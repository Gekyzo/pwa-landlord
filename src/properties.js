import { APP_SLUG } from '#config';
import { MAX_AMOUNT, isDate, parseAmount } from '#contract';

// The houses under management, in the order that the landlord gives them; a new one goes first.
export const PROPERTIES_KEY = `${APP_SLUG}.properties`;
export const MAX_NAME = 80;
export const MAX_ADDRESS = 200;
export const MAX_PERSON = 120;
// The running costs of a house; each one is paid by the owner or the tenant, or not assigned.
export const COSTS = ['community', 'ibi', 'water', 'power', 'gas', 'rubbish', 'internet'];
export const PAYERS = ['owner', 'tenant'];

export const emptyProperties = () => ({ version: 3, properties: [] });

const missing = (state) => ({ state, error: { key: 'error.propertyMissing' } });

const text = (value) => String(value ?? '').trim();

// The known costs with a known payer; the rest is dropped.
const cleanCosts = (costs) =>
  Object.fromEntries(
    COSTS.filter((cost) => PAYERS.includes(costs?.[cost])).map((cost) => [cost, costs[cost]]),
  );

// The clean fields, or an error message. `rent` and `deposit` are texts, as typed (PROP-11).
const checkFields = ({ name, address, owner, tenant, start, rent, deposit, costs } = {}) => {
  const clean = { name: text(name), address: text(address), owner: text(owner), tenant: text(tenant), start: text(start) };
  if (!clean.name) return { error: { key: 'error.nameRequired' } };
  if (clean.name.length > MAX_NAME) return { error: { key: 'error.nameTooLong', params: { max: MAX_NAME } } };
  if (clean.address.length > MAX_ADDRESS) return { error: { key: 'error.addressTooLong', params: { max: MAX_ADDRESS } } };
  for (const field of ['owner', 'tenant']) {
    if (clean[field].length > MAX_PERSON) return { error: { key: `error.${field}TooLong`, params: { max: MAX_PERSON } } };
  }
  if (clean.start && !isDate(clean.start)) return { error: { key: 'error.startInvalid' } };
  const amounts = {};
  for (const [field, value] of Object.entries({ rent, deposit })) {
    const { cents, error } = parseAmount(value, field);
    if (error) return { error };
    amounts[field] = cents;
  }
  return { clean: { ...clean, ...amounts, costs: cleanCosts(costs) } };
};

export const findProperty = (state, id) => state.properties.find((property) => property.id === id) ?? null;

export const addProperty = (state, fields, id = crypto.randomUUID()) => {
  const { clean, error } = checkFields(fields);
  if (error) return { state, error };
  return { state: { ...state, properties: [{ id, ...clean, paid: {}, expenses: [] }, ...state.properties] } };
};

// The fields replace every field of the summary: the sheet sends them all. The balance stays.
export const editProperty = (state, id, fields) => {
  if (!findProperty(state, id)) return missing(state);
  const { clean, error } = checkFields(fields);
  if (error) return { state, error };
  return {
    state: { ...state, properties: state.properties.map((property) => (property.id === id ? { ...property, ...clean } : property)) },
  };
};

export const deleteProperty = (state, id) => {
  if (!findProperty(state, id)) return missing(state);
  return { state: { ...state, properties: state.properties.filter((property) => property.id !== id) } };
};

// Puts the property at `index` of the list without it, clamped to the ends.
export const moveProperty = (state, id, index) => {
  const property = findProperty(state, id);
  if (!property) return missing(state);
  const rest = state.properties.filter((other) => other.id !== id);
  const at = Math.min(Math.max(index, 0), rest.length);
  return { state: { ...state, properties: [...rest.slice(0, at), property, ...rest.slice(at)] } };
};

const isObject = (value) => typeof value === 'object' && value !== null;
const optional = (value, check) => value === undefined || check(value);
const isText = (value) => typeof value === 'string';
const isAmount = (value) => value === null || (Number.isInteger(value) && value >= 0 && value <= MAX_AMOUNT);

const isMonth = (key) => /^\d{4}-(0[1-9]|1[0-2])$/.test(key);
const isExpense = (expense) =>
  isObject(expense) &&
  typeof expense.id === 'string' &&
  expense.id !== '' &&
  typeof expense.title === 'string' &&
  expense.title.trim() !== '' &&
  isAmount(expense.amount) &&
  expense.amount !== null &&
  isDate(expense.date);
const isPaid = (paid) =>
  isObject(paid) &&
  !Array.isArray(paid) &&
  Object.entries(paid).every(([month, cents]) => isMonth(month) && isAmount(cents) && cents !== null);
const validBalance = ({ paid, expenses }) =>
  optional(paid, isPaid) && optional(expenses, (list) => Array.isArray(list) && list.every(isExpense));

const validProperty = (property, version) =>
  isObject(property) &&
  typeof property.id === 'string' &&
  property.id !== '' &&
  typeof property.name === 'string' &&
  property.name.trim() !== '' &&
  optional(property.address, isText) &&
  (version === 1 ||
    (optional(property.owner, isText) &&
      optional(property.tenant, isText) &&
      optional(property.start, (start) => start === '' || isDate(start)) &&
      optional(property.rent, isAmount) &&
      optional(property.deposit, isAmount) &&
      optional(property.costs, (costs) => isObject(costs) && !Array.isArray(costs)) &&
      (version === 2 || validBalance(property))));

// A clean version 3 doc, or null. An older doc migrates: a version 1 property gets the empty facts
// of a contract, and a version 1 or 2 property an empty balance (PROP-2). Add a migration here
// when the version goes up.
export const normalizeProperties = (data) => {
  if (!isObject(data) || ![1, 2, 3].includes(data.version) || !Array.isArray(data.properties)) return null;
  if (!data.properties.every((property) => validProperty(property, data.version))) return null;
  const properties = data.properties.map((property) => ({
    id: property.id,
    name: property.name.trim(),
    address: text(property.address),
    owner: text(property.owner),
    tenant: text(property.tenant),
    start: property.start ?? '',
    rent: property.rent ?? null,
    deposit: property.deposit ?? null,
    costs: cleanCosts(property.costs),
    paid: { ...property.paid },
    expenses: (property.expenses ?? []).map(({ id, title, amount, date }) => ({ id, title: title.trim(), amount, date })),
  }));
  if (new Set(properties.map((property) => property.id)).size !== properties.length) return null;
  return { version: 3, properties };
};
