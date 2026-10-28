import { balanceOf, rentMonths, togglePaid, addExpense, deleteExpense } from '#balance';
import { formatAmount, formatDay, formatMonth, localDay } from '#contract';
import { findProperty } from '#properties';
import { intlTag } from '#i18n';
import { bindSheetDrag } from '#ds/sheet';
import { $, el, ui, state, t, lang, apply, render } from '#ui/context';
import { icon } from '#ui/controls';

// The Balance part of the detail of a property (BAL-2 to BAL-6) and the sheet of an extra cost.
const today = () => localDay(new Date());
const money = (cents) => formatAmount(cents, intlTag(lang));

const openExpenseSheet = () => {
  ui.expenseOpen = true;
  for (const field of ['title', 'amount']) $(`expense-${field}`).value = '';
  $('expense-date').value = today();
  render();
  $('expense-title').focus();
};

export const closeExpenseSheet = () => {
  ui.expenseOpen = false;
  render();
};

// A month: its name, its amount, and a button that marks it paid or unpaid.
const monthRow = (propertyId, { month, amount, paid }) => {
  const button = el('button', {
    type: 'button',
    className: paid ? 'balance-state paid' : 'balance-state',
    textContent: t(paid ? 'balance.paid' : 'balance.due'),
    onclick: () => apply(togglePaid(state, propertyId, month)),
  });
  button.setAttribute('aria-pressed', String(paid));
  button.setAttribute('aria-label', t(paid ? 'balance.markDue' : 'balance.markPaid', { month: formatMonth(month, intlTag(lang)) }));
  return el('li', { className: paid ? 'balance-row paid' : 'balance-row' }, [
    el('span', { className: 'balance-row-name', textContent: formatMonth(month, intlTag(lang)) }),
    el('span', { className: 'balance-row-amount', textContent: money(amount) }),
    button,
  ]);
};

const expenseRow = (propertyId, expense) => {
  const label = t('row.delete', { text: expense.title });
  const remove = el('button', { type: 'button', className: 'button quiet balance-remove', title: label }, [icon('trash')]);
  remove.setAttribute('aria-label', label);
  remove.addEventListener('click', () =>
    apply(deleteExpense(state, propertyId, expense.id), { undoText: t('toast.expenseDeleted') }),
  );
  return el('li', { className: 'balance-row' }, [
    el('span', { className: 'balance-row-name' }, [
      el('span', { textContent: expense.title }),
      el('small', { className: 'balance-row-meta', textContent: formatDay(expense.date, intlTag(lang)) }),
    ]),
    el('span', { className: 'balance-row-amount', textContent: money(expense.amount) }),
    remove,
  ]);
};

export const renderBalance = () => {
  const property = ui.propertyId === null ? null : findProperty(state, ui.propertyId);
  $('property-balance').hidden = !property;
  $('expense-sheet').hidden = !ui.expenseOpen || !property;
  if (!property) return;
  const months = rentMonths(property, today());
  const { due, dueCount } = balanceOf(property, today());
  const canCount = property.start !== '' && property.rent !== null;
  $('balance-needs').hidden = canCount;
  $('balance-total').hidden = !canCount;
  $('balance-total').textContent = dueCount
    ? t('balance.owed', { amount: money(due), count: dueCount })
    : t('balance.upToDate');
  $('balance-total').classList.toggle('due', dueCount > 0);
  $('balance-months').replaceChildren(...months.map((month) => monthRow(property.id, month)));
  $('expense-list').replaceChildren(...property.expenses.map((expense) => expenseRow(property.id, expense)));
};

export const bind = () => {
  $('expense-add').addEventListener('click', openExpenseSheet);
  $('expense-veil').addEventListener('click', closeExpenseSheet);
  $('expense-close').addEventListener('click', closeExpenseSheet);
  bindSheetDrag($('expense-sheet'), { close: closeExpenseSheet });
  $('expense-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = { title: $('expense-title').value, amount: $('expense-amount').value, date: $('expense-date').value };
    if (apply(addExpense(state, ui.propertyId, fields))) closeExpenseSheet();
  });
};
