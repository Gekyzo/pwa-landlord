// The rules of a rental contract that the summary of a property shows (PROP-10, PROP-11): the
// amounts in euros and the term of 1 year, extended a year at a time up to TERM_YEARS.
export const TERM_YEARS = 5;
// Integer cents: 1 000 000 €.
export const MAX_AMOUNT = 100_000_000;

// Digits in groups of 3 split by one separator, or plain digits; then the decimal part.
const AMOUNT = /^(\d{1,3}(?:([.,])\d{3})(?:\2\d{3})*|\d+)(?:[.,](\d{1,2}))?$/;

// `{ cents }`, null when empty, or `{ error }` of the field (`rent`, `deposit`). The last `.` or
// `,` with 1 or 2 digits after it is the decimal mark; another separator groups thousands.
export const parseAmount = (text, field) => {
  const clean = String(text ?? '').replace(/[\s€]/g, '');
  if (!clean) return { cents: null };
  const match = AMOUNT.exec(clean);
  if (!match) return { error: { key: `error.${field}Invalid` } };
  const [, whole, separator, decimals = ''] = match;
  // A group separator that is also the decimal mark, as in `1.200.50`, is read as `1200.50`;
  // one that differs, as in `1,200.50`, is the usual form.
  const units = Number(separator ? whole.split(separator).join('') : whole);
  const cents = units * 100 + Number(decimals.padEnd(2, '0'));
  if (cents > MAX_AMOUNT) return { error: { key: `error.${field}TooLarge`, params: { max: MAX_AMOUNT / 100 } } };
  return { cents };
};

export const formatAmount = (cents, tag) =>
  new Intl.NumberFormat(tag, { style: 'currency', currency: 'EUR' }).format(cents / 100);

const partsOf = (text) => text.split('-').map(Number);
const daysIn = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const pad = (n, size = 2) => String(n).padStart(size, '0');

export const isDate = (text) => {
  if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [year, month, day] = partsOf(text);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysIn(year, month);
};

// A day that the target year does not have (February 29) becomes the last day of its month.
export const addYears = (date, years) => {
  const [year, month, day] = partsOf(date);
  const target = year + years;
  return `${pad(target, 4)}-${pad(month)}-${pad(Math.min(day, daysIn(target, month)))}`;
};

// The year of contract that holds `today` (1 to TERM_YEARS), the day it ends, the day of the
// last end, and whether that day is past. Null with no valid start. Dates compare as text.
export const contractTerm = (start, today) => {
  if (!isDate(start)) return null;
  const final = addYears(start, TERM_YEARS);
  let year = 1;
  while (year < TERM_YEARS && addYears(start, year) <= today) year += 1;
  return { year, end: addYears(start, year), final, ended: today >= final };
};
