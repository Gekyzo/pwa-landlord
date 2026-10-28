import { TERM_YEARS, addMonths, isDate, parseAmount } from '#contract';
import { KINDS, findProperty } from '#properties';

// The balance of a property (BAL-1 to BAL-6): the rent months since the start, which of them are
// paid, and the extra costs that the landlord pays.
export const MAX_TITLE = 80;
const MAX_MONTHS = TERM_YEARS * 12;

const missing = (state) => ({ state, error: { key: 'error.propertyMissing' } });

// The state with one property changed by `change`, which returns `{ property }` or `{ error }`.
const update = (state, id, change) => {
  const property = findProperty(state, id);
  if (!property) return missing(state);
  const { property: next, error } = change(property);
  if (error) return { state, error };
  return { state: { ...state, properties: state.properties.map((other) => (other.id === id ? next : other)) } };
};

// The months whose due day is today or before, newest first. Month k is due on the start day k
// months later (BAL-2); a paid month keeps the amount it was paid with (BAL-3).
export const rentMonths = (property, today) => {
  if (!isDate(property.start) || property.rent === null) return [];
  const months = [];
  for (let k = 0; k < MAX_MONTHS; k += 1) {
    const due = addMonths(property.start, k);
    if (due > today) break;
    const month = due.slice(0, 7);
    const paid = Object.hasOwn(property.paid, month);
    months.unshift({ month, due, amount: paid ? property.paid[month] : property.rent, paid });
  }
  return months;
};

export const balanceOf = (property, today) => {
  const months = rentMonths(property, today);
  const sum = (list) => list.reduce((total, { amount }) => total + amount, 0);
  const unpaid = months.filter((month) => !month.paid);
  return {
    due: sum(unpaid),
    dueCount: unpaid.length,
    paid: sum(months.filter((month) => month.paid)),
    expenses: sum(property.expenses),
  };
};

// Marks a month paid with the current rent, or unmarks a paid month (BAL-3).
export const togglePaid = (state, id, month) =>
  update(state, id, (property) => {
    if (Object.hasOwn(property.paid, month)) {
      const { [month]: _, ...paid } = property.paid;
      return { property: { ...property, paid } };
    }
    if (property.rent === null) return { error: { key: 'error.rentMissing' } };
    return { property: { ...property, paid: { ...property.paid, [month]: property.rent } } };
  });

const checkExpense = ({ title, amount, date, kind = 'other' } = {}) => {
  const cleanTitle = String(title ?? '').trim();
  if (!cleanTitle) return { error: { key: 'error.titleRequired' } };
  if (cleanTitle.length > MAX_TITLE) return { error: { key: 'error.titleTooLong', params: { max: MAX_TITLE } } };
  const { cents, error } = parseAmount(amount, 'expense');
  if (error) return { error };
  if (cents === null) return { error: { key: 'error.expenseRequired' } };
  if (!isDate(date)) return { error: { key: 'error.dateInvalid' } };
  if (!KINDS.includes(kind)) return { error: { key: 'error.kindInvalid' } };
  return { clean: { title: cleanTitle, amount: cents, date, kind } };
};

// An extra cost goes first (BAL-4).
export const addExpense = (state, id, fields, expenseId = crypto.randomUUID()) =>
  update(state, id, (property) => {
    const { clean, error } = checkExpense(fields);
    if (error) return { error };
    return { property: { ...property, expenses: [{ id: expenseId, ...clean }, ...property.expenses] } };
  });

export const deleteExpense = (state, id, expenseId) =>
  update(state, id, (property) => {
    if (!property.expenses.some((expense) => expense.id === expenseId)) return { error: { key: 'error.expenseMissing' } };
    return { property: { ...property, expenses: property.expenses.filter((expense) => expense.id !== expenseId) } };
  });
