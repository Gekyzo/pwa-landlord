import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mortgageMonths, yearsOf, financesOf, glanceOf } from '#finances';

const today = '2026-04-10';
const p = {
  id: 'p0',
  name: 'Flat',
  address: '',
  owner: '',
  tenant: '',
  start: '2025-11-30',
  rent: 80000,
  deposit: null,
  costs: {},
  mortgage: { amount: 50000, start: '2025-12-05', end: '2026-02-05' },
  paid: { '2025-12': 80000, '2026-01': 80000 },
  expenses: [
    { id: 'e1', title: 'IBI', kind: 'ibi', amount: 30000, date: '2026-03-01' },
    { id: 'e2', title: 'Derrama', kind: 'levy', amount: 10000, date: '2025-12-20' },
  ],
};
const empty = { ...p, start: '', rent: null, mortgage: null, expenses: [] };

test('the mortgage counts each month from its first to its last payment, up to today', () => {
  assert.equal(mortgageMonths(p.mortgage, 2025, today), 1);
  assert.equal(mortgageMonths(p.mortgage, 2026, today), 2);
  assert.equal(mortgageMonths({ ...p.mortgage, end: '' }, 2026, today), 4);
  assert.equal(mortgageMonths(p.mortgage, 2024, today), 0);
  assert.equal(mortgageMonths(null, 2026, today), 0);
});

test('the years run from the first year with data to this year, newest first', () => {
  assert.deepEqual(yearsOf(p, today), [2026, 2025]);
  assert.deepEqual(yearsOf(empty, today), [2026]);
  assert.deepEqual(yearsOf({ ...empty, expenses: [{ ...p.expenses[0], date: '2023-06-01' }] }, today), [2026, 2025, 2024, 2023]);
});

test('rent counts in the year of its due month', () => {
  assert.equal(financesOf(p, 2025, today).rent, 80000); // November unpaid, December paid
  assert.equal(financesOf(p, 2025, today).unpaid, 80000);
});

test('the finances of a year add the costs by kind and give the net', () => {
  assert.deepEqual(financesOf(p, 2026, today), {
    rent: 80000,
    unpaid: 160000, // Feb, Mar unpaid; Jan paid
    costs: { mortgage: 100000, levy: 0, ibi: 30000, tax: 0, insurance: 0, other: 0 },
    total: 130000,
    net: -50000,
  });
  assert.deepEqual(financesOf(p, 2025, today).costs, { mortgage: 50000, levy: 10000, ibi: 0, tax: 0, insurance: 0, other: 0 });
});

test('a year with no data is all zero', () => {
  assert.deepEqual(financesOf(empty, 2026, today), {
    rent: 0,
    unpaid: 0,
    costs: { mortgage: 0, levy: 0, ibi: 0, tax: 0, insurance: 0, other: 0 },
    total: 0,
    net: 0,
  });
});

test('the glance of a property is its unpaid rent and the net of this year, or null with no data', () => {
  // Unpaid over all years: November 2025, February and March 2026.
  assert.deepEqual(glanceOf(p, today), { due: 240000, net: -50000 });
  assert.equal(glanceOf(empty, today), null);
  assert.deepEqual(glanceOf({ ...empty, expenses: [{ ...p.expenses[0], date: '2025-03-01' }] }, today), { due: 0, net: 0 });
});
