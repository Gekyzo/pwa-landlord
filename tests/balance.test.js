import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_TITLE, rentMonths, balanceOf, togglePaid, addExpense, deleteExpense } from '#balance';

const property = (fields = {}) => ({
  id: 'p0',
  name: 'Flat',
  address: '',
  owner: '',
  tenant: '',
  start: '2026-01-31',
  rent: 80000,
  deposit: null,
  costs: {},
  mortgage: null,
  paid: {},
  expenses: [],
  ...fields,
});
const doc = (fields) => ({ version: 4, properties: [property(fields)] });

test('the rent months run from the start to today, newest first, each due on the start day', () => {
  assert.deepEqual(rentMonths(property(), '2026-03-30'), [
    { month: '2026-02', due: '2026-02-28', amount: 80000, paid: false },
    { month: '2026-01', due: '2026-01-31', amount: 80000, paid: false },
  ]);
  assert.equal(rentMonths(property(), '2026-03-31')[0].month, '2026-03');
  assert.deepEqual(rentMonths(property(), '2026-01-30'), []);
});

test('the rent months stop after five years', () => {
  const months = rentMonths(property(), '2040-01-01');
  assert.equal(months.length, 60);
  assert.equal(months[0].month, '2030-12');
});

test('a property with no start or no rent has no rent months', () => {
  assert.deepEqual(rentMonths(property({ start: '' }), '2026-06-01'), []);
  assert.deepEqual(rentMonths(property({ rent: null }), '2026-06-01'), []);
});

test('a paid month keeps the amount that it was paid with', () => {
  const months = rentMonths(property({ rent: 90000, paid: { '2026-01': 80000 } }), '2026-02-28');
  assert.deepEqual(months, [
    { month: '2026-02', due: '2026-02-28', amount: 90000, paid: false },
    { month: '2026-01', due: '2026-01-31', amount: 80000, paid: true },
  ]);
});

test('the balance adds up the unpaid months, the paid months and the extra costs', () => {
  const p = property({
    paid: { '2026-01': 80000 },
    expenses: [{ id: 'e', title: 'Rubbish', amount: 6000, date: '2026-02-01' }],
  });
  assert.deepEqual(balanceOf(p, '2026-03-31'), { due: 160000, dueCount: 2, paid: 80000, expenses: 6000 });
});

test('a tap marks a month paid with the current rent, and a second tap unmarks it', () => {
  const state = doc();
  const { state: paid } = togglePaid(state, 'p0', '2026-02');
  assert.deepEqual(paid.properties[0].paid, { '2026-02': 80000 });
  assert.deepEqual(togglePaid(paid, 'p0', '2026-02').state.properties[0].paid, {});
  assert.deepEqual(state, doc());
});

test('a month cannot be marked with no rent or on a missing property', () => {
  const state = doc({ rent: null });
  assert.deepEqual(togglePaid(state, 'p0', '2026-02'), { state, error: { key: 'error.rentMissing' } });
  assert.deepEqual(togglePaid(state, 'zz', '2026-02'), { state, error: { key: 'error.propertyMissing' } });
});

test('an extra cost is added first, trimmed and read', () => {
  const state = doc({ expenses: [{ id: 'old', title: 'Old', amount: 100, date: '2026-01-01' }] });
  const { state: next, error } = addExpense(state, 'p0', { title: ' Rubbish tax ', amount: '60,5', date: '2026-02-01' }, 'e');
  assert.equal(error, undefined);
  assert.deepEqual(next.properties[0].expenses, [
    { id: 'e', title: 'Rubbish tax', amount: 6050, date: '2026-02-01', kind: 'other' },
    { id: 'old', title: 'Old', amount: 100, date: '2026-01-01' },
  ]);
  assert.equal(state.properties[0].expenses.length, 1);
});

test('an extra cost has a kind, other by default, and an unknown kind is an error', () => {
  const ok = { title: 'T', amount: '1', date: '2026-01-01' };
  assert.equal(addExpense(doc(), 'p0', ok, 'e').state.properties[0].expenses[0].kind, 'other');
  assert.equal(addExpense(doc(), 'p0', { ...ok, kind: 'ibi' }, 'e').state.properties[0].expenses[0].kind, 'ibi');
  assert.deepEqual(addExpense(doc(), 'p0', { ...ok, kind: 'car' }, 'e').error, { key: 'error.kindInvalid' });
});

test('an extra cost that is not valid is an error and the state is unchanged', () => {
  const state = doc();
  const ok = { title: 'Tax', amount: '60', date: '2026-02-01' };
  const cases = [
    [{ title: ' ' }, { key: 'error.titleRequired' }],
    [{ title: 'a'.repeat(MAX_TITLE + 1) }, { key: 'error.titleTooLong', params: { max: MAX_TITLE } }],
    [{ amount: '' }, { key: 'error.expenseRequired' }],
    [{ amount: 'abc' }, { key: 'error.expenseInvalid' }],
    [{ amount: '2000000' }, { key: 'error.expenseTooLarge', params: { max: 1000000 } }],
    [{ date: '' }, { key: 'error.dateInvalid' }],
    [{ date: '2026-02-30' }, { key: 'error.dateInvalid' }],
  ];
  for (const [fields, error] of cases) {
    assert.deepEqual(addExpense(state, 'p0', { ...ok, ...fields }, 'e'), { state, error }, JSON.stringify(fields));
  }
  assert.deepEqual(addExpense(state, 'zz', ok, 'e'), { state, error: { key: 'error.propertyMissing' } });
});

test('an extra cost is deleted, and a missing one is an error', () => {
  const state = doc({ expenses: [{ id: 'e', title: 'Tax', amount: 100, date: '2026-01-01' }] });
  assert.deepEqual(deleteExpense(state, 'p0', 'e').state.properties[0].expenses, []);
  assert.deepEqual(deleteExpense(state, 'p0', 'zz'), { state, error: { key: 'error.expenseMissing' } });
  assert.deepEqual(deleteExpense(state, 'zz', 'e'), { state, error: { key: 'error.propertyMissing' } });
});
