import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_SLUG } from '#config';
import {
  PROPERTIES_KEY,
  MAX_NAME,
  MAX_ADDRESS,
  emptyProperties,
  normalizeProperties,
  addProperty,
  editProperty,
  deleteProperty,
  moveProperty,
  findProperty,
} from '#properties';

const build = (...names) => ({ version: 1, properties: names.map((name, i) => ({ id: `p${i}`, name, address: '' })) });

test('the key of the properties has the slug', () => {
  assert.equal(PROPERTIES_KEY, `${APP_SLUG}.properties`);
});

test('a property is added first, trimmed, and the input state is unchanged', () => {
  const state = build('old');
  const { state: next, error } = addProperty(state, { name: '  Flat 2B  ', address: ' Main St 4 ' }, 'x');
  assert.equal(error, undefined);
  assert.deepEqual(next.properties, [
    { id: 'x', name: 'Flat 2B', address: 'Main St 4' },
    { id: 'p0', name: 'old', address: '' },
  ]);
  assert.deepEqual(state, build('old'));
});

test('a property with no address has an empty address', () => {
  for (const address of [undefined, null, '', '   ']) {
    assert.equal(addProperty(emptyProperties(), { name: 'a', address }, 'x').state.properties[0].address, '');
  }
});

test('a blank name is an error and the state is unchanged', () => {
  const state = build('a');
  for (const name of ['', '   ', null, undefined]) {
    assert.deepEqual(addProperty(state, { name }, 'x'), { state, error: { key: 'error.nameRequired' } });
  }
  assert.deepEqual(addProperty(state, undefined, 'x'), { state, error: { key: 'error.nameRequired' } });
});

test('a name over the maximum length is an error', () => {
  const state = emptyProperties();
  assert.deepEqual(addProperty(state, { name: 'a'.repeat(MAX_NAME + 1) }, 'x'), {
    state,
    error: { key: 'error.nameTooLong', params: { max: MAX_NAME } },
  });
  assert.equal(addProperty(state, { name: 'a'.repeat(MAX_NAME) }, 'x').error, undefined);
});

test('an address over the maximum length is an error', () => {
  const state = emptyProperties();
  assert.deepEqual(addProperty(state, { name: 'a', address: 'b'.repeat(MAX_ADDRESS + 1) }, 'x'), {
    state,
    error: { key: 'error.addressTooLong', params: { max: MAX_ADDRESS } },
  });
  assert.equal(addProperty(state, { name: 'a', address: 'b'.repeat(MAX_ADDRESS) }, 'x').error, undefined);
});

test('a property without an id gets a fresh one', () => {
  const { state } = addProperty(emptyProperties(), { name: 'a' });
  assert.equal(typeof state.properties[0].id, 'string');
  assert.ok(state.properties[0].id.length > 0);
});

test('an edit changes the name and the address of one property', () => {
  const state = build('a', 'b');
  const { state: next } = editProperty(state, 'p1', { name: ' B ', address: ' Road 1 ' });
  assert.deepEqual(next.properties, [
    { id: 'p0', name: 'a', address: '' },
    { id: 'p1', name: 'B', address: 'Road 1' },
  ]);
  assert.deepEqual(state, build('a', 'b'));
});

test('an edit to a blank name is an error', () => {
  const state = build('a');
  assert.deepEqual(editProperty(state, 'p0', { name: ' ' }), { state, error: { key: 'error.nameRequired' } });
});

test('a delete removes one property', () => {
  const { state } = deleteProperty(build('a', 'b'), 'p0');
  assert.deepEqual(state.properties, [{ id: 'p1', name: 'b', address: '' }]);
});

test('an id that does not exist is an error for edit, delete and move', () => {
  const state = build('a');
  const missing = { state, error: { key: 'error.propertyMissing' } };
  assert.deepEqual(editProperty(state, 'zz', { name: 'x' }), missing);
  assert.deepEqual(deleteProperty(state, 'zz'), missing);
  assert.deepEqual(moveProperty(state, 'zz', 0), missing);
});

test('a move puts a property at an index, clamped to the list', () => {
  const names = (result) => result.state.properties.map((p) => p.name);
  assert.deepEqual(names(moveProperty(build('a', 'b', 'c'), 'p0', 2)), ['b', 'c', 'a']);
  assert.deepEqual(names(moveProperty(build('a', 'b', 'c'), 'p2', -5)), ['c', 'a', 'b']);
});

test('findProperty returns the property or null', () => {
  assert.deepEqual(findProperty(build('a'), 'p0'), { id: 'p0', name: 'a', address: '' });
  assert.equal(findProperty(build('a'), 'zz'), null);
});

test('normalizeProperties keeps a valid doc, trims the texts and fills a missing address', () => {
  assert.deepEqual(
    normalizeProperties({
      version: 1,
      properties: [
        { id: 'a', name: ' x ', address: ' y ', more: 1 },
        { id: 'b', name: 'z' },
      ],
    }),
    {
      version: 1,
      properties: [
        { id: 'a', name: 'x', address: 'y' },
        { id: 'b', name: 'z', address: '' },
      ],
    },
  );
});

test('normalizeProperties refuses a doc that is not version 1 properties', () => {
  const bad = [
    null,
    42,
    {},
    { version: 2, properties: [] },
    { version: 1 },
    { version: 1, notes: [] },
    { version: 1, properties: [{ id: '', name: 'a' }] },
    { version: 1, properties: [{ id: 'a', name: ' ' }] },
    { version: 1, properties: [{ id: 'a', name: 'x', address: 3 }] },
    { version: 1, properties: [{ id: 'a', name: 'x' }, { id: 'a', name: 'y' }] },
  ];
  for (const data of bad) assert.equal(normalizeProperties(data), null, JSON.stringify(data));
});
