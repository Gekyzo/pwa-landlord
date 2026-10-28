import { KINDS, findProperty } from '#properties';
import { financesOf, yearsOf } from '#finances';
import { formatAmount, localDay } from '#contract';
import { intlTag } from '#i18n';
import { $, el, ui, state, t, lang, render } from '#ui/context';

// The Finances part of the detail of a property (FIN-5, FIN-6).
const today = () => localDay(new Date());
const money = (cents) => formatAmount(cents, intlTag(lang));

// The property whose year is in `ui.financeYear`: another one starts at the current year.
let shownFor = null;

const line = (key, cents, variant = '') =>
  el('div', { className: variant ? `finances-row ${variant}` : 'finances-row' }, [
    el('dt', { textContent: t(key) }),
    el('dd', { textContent: money(cents) }),
  ]);

export const renderFinances = () => {
  const property = ui.propertyId === null ? null : findProperty(state, ui.propertyId);
  $('property-finances').hidden = !property;
  if (!property) return;
  if (shownFor !== property.id) {
    shownFor = property.id;
    ui.financeYear = null;
  }
  const years = yearsOf(property, today());
  const year = years.includes(ui.financeYear) ? ui.financeYear : years[0];
  $('finance-year').replaceChildren(...years.map((value) => el('option', { value: String(value), textContent: String(value) })));
  $('finance-year').value = String(year);
  const { rent, unpaid, costs, total, net } = financesOf(property, year, today());
  const costRows = ['mortgage', ...KINDS]
    .filter((kind) => costs[kind] > 0)
    .map((kind) => line(kind === 'mortgage' ? 'finances.mortgage' : `kind.${kind}`, costs[kind]));
  $('finance-rows').replaceChildren(
    line('finances.rent', rent),
    ...(unpaid > 0 ? [line('finances.unpaid', unpaid, 'due')] : []),
    ...costRows,
    line('finances.total', total, 'total'),
    line('finances.net', net, net < 0 ? 'net loss' : 'net'),
  );
};

export const bind = () => {
  $('finance-year').addEventListener('change', (event) => {
    ui.financeYear = Number(event.target.value);
    render();
  });
};
