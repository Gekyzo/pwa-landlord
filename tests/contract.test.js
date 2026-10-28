import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_AMOUNT, TERM_YEARS, parseAmount, formatAmount, amountText, isDate, addYears, contractTerm } from '#contract';

test('an empty amount is null', () => {
  for (const text of [undefined, null, '', '   ', ' € ']) assert.deepEqual(parseAmount(text, 'rent'), { cents: null });
});

test('an amount is read with a comma or a point as the decimal mark', () => {
  const cases = {
    850: 85000,
    '850,5': 85050,
    '850.5': 85050,
    '850,05': 85005,
    '1.200,50': 120050,
    '1,200.50': 120050,
    '1200.50': 120050,
    '1.200': 120000,
    '1,200': 120000,
    '1.234.56': 123456,
    ' 850 € ': 85000,
    '1 200': 120000,
    0: 0,
  };
  for (const [text, cents] of Object.entries(cases)) assert.deepEqual(parseAmount(text, 'rent'), { cents }, text);
});

test('an amount that is not a number is an error', () => {
  for (const text of ['abc', '-5', '8,5,5', '1.2.3', '1.20.000', '850,5555', ',5', '5,', '1e3']) {
    assert.deepEqual(parseAmount(text, 'rent'), { error: { key: 'error.rentInvalid' } }, text);
  }
});

test('an amount over the maximum is an error', () => {
  assert.deepEqual(parseAmount(String(MAX_AMOUNT / 100), 'rent'), { cents: MAX_AMOUNT });
  assert.deepEqual(parseAmount('1000000,01', 'deposit'), { error: { key: 'error.depositTooLarge', params: { max: 1000000 } } });
});

test('an amount shows in euros in the language of the page', () => {
  assert.equal(formatAmount(120050, 'en'), '€1,200.50');
  assert.match(formatAmount(1234550, 'es'), /^12\.345,50\s€$/);
});

test('an amount shows to edit with no currency and no groups, and reads back the same', () => {
  assert.equal(amountText(null, 'es'), '');
  assert.equal(amountText(120000, 'es'), '1200');
  assert.equal(amountText(120050, 'es'), '1200,50');
  assert.equal(amountText(120050, 'en'), '1200.50');
  for (const tag of ['es', 'en']) {
    for (const cents of [0, 5, 85050, 120000, 100_000_000]) assert.deepEqual(parseAmount(amountText(cents, tag), 'rent'), { cents });
  }
});

test('a date is a real day in the form YYYY-MM-DD', () => {
  for (const text of ['2026-01-31', '2024-02-29']) assert.equal(isDate(text), true, text);
  for (const text of ['2026-02-29', '2026-13-01', '2026-1-1', '26-01-01', '', null, 20260101]) {
    assert.equal(isDate(text), false, String(text));
  }
});

test('a year is added to a date, and February 29 becomes February 28', () => {
  assert.equal(addYears('2026-03-15', 1), '2027-03-15');
  assert.equal(addYears('2024-02-29', 1), '2025-02-28');
  assert.equal(addYears('2024-02-29', 4), '2028-02-29');
});

test('the term is one year, extended a year at a time up to five', () => {
  assert.equal(TERM_YEARS, 5);
  const start = '2024-03-15';
  assert.deepEqual(contractTerm(start, '2024-01-01'), { year: 1, end: '2025-03-15', final: '2029-03-15', ended: false });
  assert.deepEqual(contractTerm(start, '2024-03-15'), { year: 1, end: '2025-03-15', final: '2029-03-15', ended: false });
  assert.deepEqual(contractTerm(start, '2025-03-14'), { year: 1, end: '2025-03-15', final: '2029-03-15', ended: false });
  assert.deepEqual(contractTerm(start, '2025-03-15'), { year: 2, end: '2026-03-15', final: '2029-03-15', ended: false });
  assert.deepEqual(contractTerm(start, '2029-03-14'), { year: 5, end: '2029-03-15', final: '2029-03-15', ended: false });
  assert.deepEqual(contractTerm(start, '2029-03-15'), { year: 5, end: '2029-03-15', final: '2029-03-15', ended: true });
  assert.deepEqual(contractTerm(start, '2035-01-01'), { year: 5, end: '2029-03-15', final: '2029-03-15', ended: true });
});

test('the term of a contract with no valid start is null', () => {
  for (const start of ['', '2026-02-30', null]) assert.equal(contractTerm(start, '2026-01-01'), null);
});
