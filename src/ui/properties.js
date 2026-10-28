import { COSTS, PAYERS, addProperty, editProperty, deleteProperty, findProperty } from '#properties';
import { TERM_YEARS, amountText, contractTerm, formatAmount, formatDay, localDay } from '#contract';
import { intlTag } from '#i18n';
import { bindSheetDrag } from '#ds/sheet';
import { settle } from '#swipe';
import { SIDE_BUTTON, DRAG_START, $, el, ui, state, t, lang, apply, render, guardClick } from '#ui/context';
import { iconButton } from '#ui/controls';
import { reorder, bindReorder } from '#ui/drag';

const TEXTS = ['name', 'address', 'owner', 'tenant', 'start'];
const AMOUNTS = ['rent', 'deposit'];

// One select for each cost, built at each opening so that its texts follow the language.
const costField = (cost, payer = '') => {
  const select = el('select', { className: 'select field-input', id: `property-cost-${cost}` }, [
    el('option', { value: '', textContent: t('properties.payer.none') }),
    ...PAYERS.map((value) => el('option', { value, textContent: t(`properties.payer.${value}`) })),
  ]);
  select.value = payer;
  return el('label', { className: 'field' }, [select, el('span', { className: 'field-label', textContent: t(`cost.${cost}`) })]);
};

const openSheet = (id = null) => {
  const property = id ? findProperty(state, id) : null;
  ui.sheetOpen = true;
  ui.editing = id;
  $('property-sheet-title').textContent = t(id ? 'properties.editTitle' : 'properties.new');
  for (const field of TEXTS) $(`property-${field}`).value = property?.[field] ?? '';
  for (const field of AMOUNTS) $(`property-${field}`).value = amountText(property?.[field] ?? null, intlTag(lang));
  $('property-cost-fields').replaceChildren(...COSTS.map((cost) => costField(cost, property?.costs[cost])));
  render();
  $('property-name').focus();
};

export const closePropertySheet = () => {
  ui.sheetOpen = false;
  ui.editing = null;
  render();
};

const openProperty = (id) => {
  ui.propertyId = id;
  render();
};

const remove = (id) => {
  if (ui.propertyId === id) ui.propertyId = null;
  apply(deleteProperty(state, id), { undoText: t('toast.propertyDeleted') });
};

export const moveRow = (row, x) => {
  row.style.transform = x ? `translateX(${x}px)` : '';
};

// Lets a horizontal drag of the row show the side actions behind it (`settle` decides).
const bindSwipe = (row, width, id) => {
  let drag = null;
  row.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, base: ui.openId === id ? -width : 0, active: false };
  });
  row.addEventListener('pointermove', (event) => {
    if (!drag || reorder) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dy) > DRAG_START && Math.abs(dy) >= Math.abs(dx)) drag = null;
      if (!drag || Math.abs(dx) < DRAG_START) return;
      drag.active = true;
      row.setPointerCapture(event.pointerId);
      row.classList.add('dragging');
    }
    drag.at = Math.max(-width, Math.min(0, drag.base + dx));
    moveRow(row, drag.at);
  });
  const finish = (event) => {
    if (!drag) return;
    const { active, x, at } = drag;
    drag = null;
    if (!active) return;
    // The click that follows a drag must not open the property.
    guardClick();
    const side = settle(event.clientX - x, { start: 0, end: width }, ui.openId === id ? 'end' : null);
    ui.openId = side ? id : null;
    ui.settleFrom = { id, x: at };
    render();
  };
  row.addEventListener('pointerup', finish);
  row.addEventListener('pointercancel', finish);
};

// A row slides left to show Delete (swipe), and a hold lifts it to a new place (drag).
const row = (property) => {
  const open = ui.openId === property.id;
  const actions = [
    iconButton('trash', t('row.delete', { text: property.name }), () => remove(property.id), { variant: 'danger' }),
  ];
  const width = actions.length * SIDE_BUTTON;
  const name = el('button', { className: 'item-row-name', type: 'button', tabIndex: -1, onclick: () => openProperty(property.id) }, [
    el('span', { textContent: property.name }),
  ]);
  const body = el('div', { className: 'item-row-body' }, [name]);
  const from = ui.settleFrom?.id === property.id ? ui.settleFrom.x : null;
  if (from !== null) {
    // Start where the drag ended, then move to the settled place with the CSS transition.
    moveRow(body, from);
    requestAnimationFrame(() => requestAnimationFrame(() => moveRow(body, open ? -width : 0)));
  } else moveRow(body, open ? -width : 0);
  bindSwipe(body, width, property.id);
  const box = el('div', { className: open ? 'item-row-swipe open' : 'item-row-swipe' }, [
    el('div', { className: 'item-row-actions', inert: !open }, actions),
    body,
  ]);
  const node = el('li', { className: 'item-row' }, [box]);
  Object.assign(node.dataset, { id: property.id, scope: 'properties' });
  bindReorder(body, node, property.id);
  return node;
};

const formatDate = (date) => formatDay(date, intlTag(lang));

// The filled facts of the contract, as pairs of a name and a value.
const factsOf = (property) => {
  const tag = intlTag(lang);
  const term = contractTerm(property.start, localDay(new Date()));
  return [
    ['properties.owner', property.owner],
    ['properties.tenant', property.tenant],
    ['properties.start', property.start && formatDate(property.start)],
    term && !term.ended && ['properties.end', t('properties.endValue', { date: formatDate(term.end), year: term.year, years: TERM_YEARS })],
    term && [term.ended ? 'properties.ended' : 'properties.final', formatDate(term.final)],
    ['properties.rent', property.rent !== null && formatAmount(property.rent, tag)],
    ['properties.deposit', property.deposit !== null && formatAmount(property.deposit, tag)],
  ].filter((fact) => fact && fact[1]);
};

const costsOf = (property, payer) => {
  const names = COSTS.filter((cost) => property.costs[cost] === payer).map((cost) => t(`cost.${cost}`));
  return names.length ? new Intl.ListFormat(intlTag(lang), { type: 'conjunction' }).format(names) : '';
};

const renderFacts = (property) => {
  const facts = property ? factsOf(property) : [];
  $('property-facts').replaceChildren(
    ...facts.map(([key, value]) =>
      el('div', { className: 'property-fact' }, [
        el('dt', { textContent: t(key, { years: TERM_YEARS }) }),
        el('dd', { textContent: value }),
      ]),
    ),
  );
  $('property-facts').hidden = facts.length === 0;
  for (const payer of PAYERS) {
    const costs = property ? costsOf(property, payer) : '';
    const node = $(`property-costs-${payer}`);
    node.textContent = costs && t(payer === 'owner' ? 'properties.costsOwner' : 'properties.costsTenant', { costs });
    node.hidden = !costs;
  }
};

export const renderProperties = () => {
  const visible = ui.view === 'properties';
  $('properties').hidden = !visible;
  $('fab').hidden = !visible || ui.sheetOpen || ui.expenseOpen;
  if (ui.openId && !findProperty(state, ui.openId)) ui.openId = null;
  $('property-list').replaceChildren(...state.properties.map(row));
  ui.settleFrom = null;
  $('properties-empty').hidden = state.properties.length > 0;
  const property = ui.propertyId === null ? null : findProperty(state, ui.propertyId);
  if (!property) ui.propertyId = null;
  // The pane shows the detail alone below 840px, and beside the list from 840px (LAY-3).
  if (property) $('properties').dataset.detail = '';
  else delete $('properties').dataset.detail;
  $('property-detail-name').textContent = property?.name ?? '';
  $('property-detail-address').textContent = property?.address ?? '';
  $('property-detail-address').hidden = !property?.address;
  renderFacts(property);
  $('property-detail-empty').hidden = Boolean(property);
  $('property-actions').hidden = !property;
  $('property-sheet').hidden = !ui.sheetOpen;
};

export const bind = () => {
  $('fab').addEventListener('click', () => openSheet());
  $('properties-add').addEventListener('click', () => openSheet());
  $('property-veil').addEventListener('click', closePropertySheet);
  $('property-close').addEventListener('click', closePropertySheet);
  bindSheetDrag($('property-sheet'), { close: closePropertySheet });
  $('property-back').addEventListener('click', () => openProperty(null));
  $('property-edit').addEventListener('click', () => openSheet(ui.propertyId));
  $('property-delete').addEventListener('click', () => remove(ui.propertyId));
  $('property-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = Object.fromEntries([...TEXTS, ...AMOUNTS].map((field) => [field, $(`property-${field}`).value]));
    fields.costs = Object.fromEntries(COSTS.map((cost) => [cost, $(`property-cost-${cost}`).value]));
    const result = ui.editing ? editProperty(state, ui.editing, fields) : addProperty(state, fields);
    if (apply(result)) closePropertySheet();
  });
  // A tap out of the open row closes it, without a render, so that the tap still does its work.
  document.addEventListener(
    'pointerdown',
    (event) => {
      const box = document.querySelector('.item-row-swipe.open');
      if (!box || box.contains(event.target)) return;
      ui.openId = null;
      box.classList.remove('open');
      moveRow(box.querySelector('.item-row-body'), 0);
      box.querySelector('.item-row-actions').inert = true;
    },
    true,
  );
};
