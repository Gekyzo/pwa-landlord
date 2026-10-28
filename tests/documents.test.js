import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SLOTS,
  MULTI,
  MAX_FILE,
  TYPES,
  MAX_FILE_NAME,
  checkFile,
  addDocument,
  removeDocument,
  attachReceipt,
  fileIds,
  formatSize,
} from '#documents';

const property = (fields = {}) => ({
  id: 'p0',
  name: 'Flat',
  address: '',
  owner: '',
  tenant: '',
  start: '',
  rent: null,
  deposit: null,
  costs: {},
  mortgage: null,
  paid: {},
  expenses: [{ id: 'e', title: 'IBI', amount: 100, date: '2026-01-01', kind: 'ibi', file: null }],
  documents: [],
  ...fields,
});
const doc = (fields) => ({ version: 5, properties: [property(fields)] });
const meta = (id, name = `${id}.pdf`) => ({ id, name, size: 10, added: '2026-03-01' });
const docsOf = (state) => state.properties[0].documents;

test('the slots, the types and the size limit are fixed', () => {
  assert.deepEqual(SLOTS, ['contract', 'home', 'insurance', 'power', 'gas']);
  assert.deepEqual(MULTI, ['insurance']);
  assert.equal(MAX_FILE, 10 * 1024 * 1024);
  assert.deepEqual(TYPES, ['application/pdf', 'image/jpeg', 'image/png']);
});

test('checkFile accepts a PDF, JPEG or PNG of 1 byte to 10 MB', () => {
  assert.deepEqual(checkFile({ type: 'application/pdf', size: 1 }), {});
  assert.deepEqual(checkFile({ type: 'image/jpeg', size: MAX_FILE }), {});
  assert.deepEqual(checkFile({ type: 'application/pdf', size: 0 }), { error: { key: 'error.fileSize', params: { max: 10 } } });
  assert.deepEqual(checkFile({ type: 'image/png', size: MAX_FILE + 1 }), { error: { key: 'error.fileSize', params: { max: 10 } } });
  assert.deepEqual(checkFile({ type: 'application/msword', size: 5 }), { error: { key: 'error.fileType' } });
  assert.deepEqual(checkFile({ type: '', size: 5 }), { error: { key: 'error.fileType' } });
});

test('a file of a single slot replaces the one before; other insurances keep several', () => {
  let state = addDocument(doc(), 'p0', 'contract', meta('a')).state;
  state = addDocument(state, 'p0', 'contract', meta('b')).state;
  assert.deepEqual(docsOf(state), [{ ...meta('b'), slot: 'contract' }]);
  state = addDocument(state, 'p0', 'insurance', meta('c')).state;
  state = addDocument(state, 'p0', 'insurance', meta('d')).state;
  assert.deepEqual(docsOf(state).map(({ id }) => id), ['b', 'c', 'd']);
});

test('the name of a file is trimmed and cut to its maximum length', () => {
  const long = `  ${'n'.repeat(MAX_FILE_NAME + 20)}  `;
  const { state } = addDocument(doc(), 'p0', 'gas', meta('a', long));
  assert.equal(docsOf(state)[0].name, 'n'.repeat(MAX_FILE_NAME));
});

test('an unknown slot, property or document is an error and the state is unchanged', () => {
  const state = doc({ documents: [{ ...meta('a'), slot: 'gas' }] });
  assert.deepEqual(addDocument(state, 'p0', 'car', meta('b')), { state, error: { key: 'error.slotInvalid' } });
  assert.deepEqual(addDocument(state, 'zz', 'gas', meta('b')), { state, error: { key: 'error.propertyMissing' } });
  assert.deepEqual(removeDocument(state, 'p0', 'zz'), { state, error: { key: 'error.documentMissing' } });
  assert.deepEqual(removeDocument(state, 'zz', 'a'), { state, error: { key: 'error.propertyMissing' } });
});

test('a document is removed', () => {
  const state = doc({ documents: [{ ...meta('a'), slot: 'gas' }, { ...meta('b'), slot: 'power' }] });
  assert.deepEqual(docsOf(removeDocument(state, 'p0', 'a').state).map(({ id }) => id), ['b']);
});

test('a receipt is attached to and removed from an extra cost', () => {
  const { state } = attachReceipt(doc(), 'p0', 'e', meta('r', ' r.png '));
  assert.deepEqual(state.properties[0].expenses[0].file, meta('r', 'r.png'));
  assert.equal(attachReceipt(state, 'p0', 'e', null).state.properties[0].expenses[0].file, null);
  assert.deepEqual(attachReceipt(state, 'p0', 'zz', null), { state, error: { key: 'error.expenseMissing' } });
});

test('fileIds names every document and receipt', () => {
  const state = {
    version: 5,
    properties: [
      property({ documents: [{ ...meta('a'), slot: 'gas' }], expenses: [{ ...property().expenses[0], file: meta('r') }] }),
      property({ id: 'p1', documents: [{ ...meta('b'), slot: 'home' }] }),
    ],
  };
  assert.deepEqual(fileIds(state), new Set(['a', 'r', 'b']));
});

test('formatSize shows kilobytes below 1 MB and megabytes from there, in the language', () => {
  assert.equal(formatSize(512, 'en'), '1 kB');
  assert.equal(formatSize(2048, 'en'), '2 kB');
  assert.equal(formatSize(1536 * 1024, 'en'), '1.5 MB');
  assert.equal(formatSize(1536 * 1024, 'es'), '1,5 MB');
});
