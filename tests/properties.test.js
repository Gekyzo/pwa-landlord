import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_SLUG } from '#config';
import {
  PROPERTIES_KEY,
  MAX_NAME,
  MAX_ADDRESS,
  MAX_PERSON,
  COSTS,
  emptyProperties,
  normalizeProperties,
  addProperty,
  editProperty,
  deleteProperty,
  moveProperty,
  findProperty,
} from '#properties';

const BLANK = { owner: '', tenant: '', start: '', rent: null, deposit: null, costs: {} };
const blank = (id, name, address = '') => ({ id, name, address, ...BLANK });
const build = (...names) => ({ version: 2, properties: names.map((name, i) => blank(`p${i}`, name)) });

test('the key of the properties has the slug', () => {
  assert.equal(PROPERTIES_KEY, `${APP_SLUG}.properties`);
});

test('a property is added first, trimmed, and the input state is unchanged', () => {
  const state = build('old');
  const { state: next, error } = addProperty(state, { name: '  Flat 2B  ', address: ' Main St 4 ' }, 'x');
  assert.equal(error, undefined);
  assert.deepEqual(next.properties, [blank('x', 'Flat 2B', 'Main St 4'), blank('p0', 'old')]);
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

test('an edit changes the fields of one property', () => {
  const state = build('a', 'b');
  const { state: next } = editProperty(state, 'p1', { name: ' B ', address: ' Road 1 ', rent: '900' });
  assert.deepEqual(next.properties, [blank('p0', 'a'), { ...blank('p1', 'B', 'Road 1'), rent: 90000 }]);
  assert.deepEqual(state, build('a', 'b'));
});

test('an edit to a blank name is an error', () => {
  const state = build('a');
  assert.deepEqual(editProperty(state, 'p0', { name: ' ' }), { state, error: { key: 'error.nameRequired' } });
});

test('a delete removes one property', () => {
  const { state } = deleteProperty(build('a', 'b'), 'p0');
  assert.deepEqual(state.properties, [blank('p1', 'b')]);
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
  assert.deepEqual(findProperty(build('a'), 'p0'), blank('p0', 'a'));
  assert.equal(findProperty(build('a'), 'zz'), null);
});

test('a property keeps the facts of its contract, trimmed and read', () => {
  const fields = {
    name: 'Flat',
    owner: ' Ana Ruiz ',
    tenant: ' Luis Gil ',
    start: '2025-09-01',
    rent: '850,50',
    deposit: '1.701',
    costs: { ibi: 'owner', water: 'tenant', gas: '', unknown: 'owner', power: 'nobody' },
  };
  const { state, error } = addProperty(emptyProperties(), fields, 'x');
  assert.equal(error, undefined);
  assert.deepEqual(state.properties[0], {
    ...blank('x', 'Flat'),
    owner: 'Ana Ruiz',
    tenant: 'Luis Gil',
    start: '2025-09-01',
    rent: 85050,
    deposit: 170100,
    costs: { ibi: 'owner', water: 'tenant' },
  });
});

test('the costs are a fixed list', () => {
  assert.deepEqual(COSTS, ['community', 'ibi', 'water', 'power', 'gas', 'rubbish', 'internet']);
});

test('a fact of the contract that is not valid is an error and the state is unchanged', () => {
  const state = build('a');
  const cases = [
    [{ owner: 'a'.repeat(MAX_PERSON + 1) }, { key: 'error.ownerTooLong', params: { max: MAX_PERSON } }],
    [{ tenant: 'a'.repeat(MAX_PERSON + 1) }, { key: 'error.tenantTooLong', params: { max: MAX_PERSON } }],
    [{ start: '2026-02-30' }, { key: 'error.startInvalid' }],
    [{ rent: 'abc' }, { key: 'error.rentInvalid' }],
    [{ deposit: '2000000' }, { key: 'error.depositTooLarge', params: { max: 1000000 } }],
  ];
  for (const [fields, error] of cases) {
    assert.deepEqual(addProperty(state, { name: 'b', ...fields }, 'x'), { state, error }, JSON.stringify(fields));
    assert.deepEqual(editProperty(state, 'p0', { name: 'b', ...fields }), { state, error }, JSON.stringify(fields));
  }
  assert.equal(addProperty(state, { name: 'b', owner: 'a'.repeat(MAX_PERSON) }, 'x').error, undefined);
});

test('normalizeProperties migrates a version 1 doc, so nothing is lost', () => {
  assert.deepEqual(
    normalizeProperties({
      version: 1,
      properties: [
        { id: 'a', name: ' x ', address: ' y ', more: 1 },
        { id: 'b', name: 'z' },
      ],
    }),
    { version: 2, properties: [blank('a', 'x', 'y'), blank('b', 'z')] },
  );
});

test('normalizeProperties keeps a valid version 2 doc and drops what it does not know', () => {
  const property = {
    id: 'a',
    name: 'x',
    address: '',
    owner: ' Ana ',
    tenant: 'Luis',
    start: '2025-09-01',
    rent: 85000,
    deposit: null,
    costs: { ibi: 'owner', other: 'owner', gas: 'nobody' },
    more: 1,
  };
  assert.deepEqual(normalizeProperties({ version: 2, properties: [property, { id: 'b', name: 'z' }] }), {
    version: 2,
    properties: [
      { ...blank('a', 'x'), owner: 'Ana', tenant: 'Luis', start: '2025-09-01', rent: 85000, costs: { ibi: 'owner' } },
      blank('b', 'z'),
    ],
  });
});

test('normalizeProperties refuses a doc that is not version 1 or 2 properties', () => {
  const bad = [
    null,
    42,
    {},
    { version: 3, properties: [] },
    { version: 1 },
    { version: 1, notes: [] },
    { version: 1, properties: [{ id: '', name: 'a' }] },
    { version: 1, properties: [{ id: 'a', name: ' ' }] },
    { version: 1, properties: [{ id: 'a', name: 'x', address: 3 }] },
    { version: 1, properties: [{ id: 'a', name: 'x' }, { id: 'a', name: 'y' }] },
    { version: 2, properties: [{ id: 'a', name: 'x', owner: 3 }] },
    { version: 2, properties: [{ id: 'a', name: 'x', start: '2026-02-30' }] },
    { version: 2, properties: [{ id: 'a', name: 'x', rent: 8.5 }] },
    { version: 2, properties: [{ id: 'a', name: 'x', rent: -1 }] },
    { version: 2, properties: [{ id: 'a', name: 'x', deposit: '850' }] },
    { version: 2, properties: [{ id: 'a', name: 'x', costs: [] }] },
  ];
  for (const data of bad) assert.equal(normalizeProperties(data), null, JSON.stringify(data));
});
