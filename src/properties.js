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
// The kinds of an extra cost that the owner pays (FIN-1).
export const KINDS = ['levy', 'ibi', 'tax', 'insurance', 'other'];
// The places for the files of a property, in the order of the screen (DOC-1). `documents` owns
// the rules of the files; the list is here because the doc check needs it.
export const SLOTS = ['contract', 'home', 'insurance', 'power', 'gas'];

export const emptyProperties = () => ({ version: 5, properties: [] });

const missing = (state) => ({ state, error: { key: 'error.propertyMissing' } });

const text = (value) => String(value ?? '').trim();

// The known costs with a known payer; the rest is dropped.
const cleanCosts = (costs) =>
  Object.fromEntries(
    COSTS.filter((cost) => PAYERS.includes(costs?.[cost])).map((cost) => [cost, costs[cost]]),
  );

// The mortgage of its three texts: null with no amount, else it needs a first payment and a last
// one, when set, on or after it (FIN-1).
const checkMortgage = (amount, start, end) => {
  const { cents, error } = parseAmount(amount, 'mortgage');
  if (error) return { error };
  if (cents === null) return { mortgage: null };
  const clean = { start: text(start), end: text(end) };
  if (!isDate(clean.start)) return { error: { key: 'error.mortgageStart' } };
  if (clean.end && (!isDate(clean.end) || clean.end < clean.start)) return { error: { key: 'error.mortgageEnd' } };
  return { mortgage: { amount: cents, ...clean } };
};

// The clean fields, or an error message. `rent`, `deposit` and `mortgageAmount` are texts, as
// typed (PROP-11).
const checkFields = ({ name, address, owner, tenant, start, rent, deposit, costs, mortgageAmount, mortgageStart, mortgageEnd } = {}) => {
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
  const { mortgage, error } = checkMortgage(mortgageAmount, mortgageStart, mortgageEnd);
  if (error) return { error };
  return { clean: { ...clean, ...amounts, costs: cleanCosts(costs), mortgage } };
};

export const findProperty = (state, id) => state.properties.find((property) => property.id === id) ?? null;

export const addProperty = (state, fields, id = crypto.randomUUID()) => {
  const { clean, error } = checkFields(fields);
  if (error) return { state, error };
  return { state: { ...state, properties: [{ id, ...clean, paid: {}, expenses: [], documents: [] }, ...state.properties] } };
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
const isFile = (file) =>
  isObject(file) &&
  typeof file.id === 'string' &&
  file.id !== '' &&
  typeof file.name === 'string' &&
  file.name.trim() !== '' &&
  Number.isInteger(file.size) &&
  file.size > 0 &&
  isDate(file.added);
const isExpense = (expense, version) =>
  isObject(expense) &&
  (version < 4 || KINDS.includes(expense.kind)) &&
  (version < 5 || expense.file === null || isFile(expense.file)) &&
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
const validBalance = ({ paid, expenses }, version) =>
  optional(paid, isPaid) &&
  optional(expenses, (list) => Array.isArray(list) && list.every((expense) => isExpense(expense, version)));
const isMortgage = (mortgage) =>
  mortgage === null ||
  (isObject(mortgage) &&
    isAmount(mortgage.amount) &&
    mortgage.amount !== null &&
    isDate(mortgage.start) &&
    (mortgage.end === '' || (isDate(mortgage.end) && mortgage.end >= mortgage.start)));

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
      (version === 2 || validBalance(property, version)) &&
      (version < 4 || optional(property.mortgage, isMortgage)) &&
      (version < 5 ||
        optional(property.documents, (list) => Array.isArray(list) && list.every((file) => isFile(file) && SLOTS.includes(file.slot))))));

const cleanFile = ({ id, name, size, added }) => ({ id, name: name.trim(), size, added });

// A clean version 5 doc, or null. An older doc migrates: a version 1 property gets the empty facts
// of a contract, a version 1 or 2 property an empty balance, a version 1 to 3 property no
// mortgage, with each extra cost of kind `other`, and a version 1 to 4 property no documents,
// with no receipt on each extra cost (PROP-2). Add a migration here when the version goes up.
export const normalizeProperties = (data) => {
  if (!isObject(data) || ![1, 2, 3, 4, 5].includes(data.version) || !Array.isArray(data.properties)) return null;
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
    mortgage: property.mortgage ? { amount: property.mortgage.amount, start: property.mortgage.start, end: property.mortgage.end } : null,
    paid: { ...property.paid },
    expenses: (property.expenses ?? []).map(({ id, title, amount, date, kind = 'other', file = null }) => ({
      id,
      title: title.trim(),
      amount,
      date,
      kind,
      file: file && cleanFile(file),
    })),
    documents: (property.documents ?? []).map((file) => ({ ...cleanFile(file), slot: file.slot })),
  }));
  if (new Set(properties.map((property) => property.id)).size !== properties.length) return null;
  return { version: 5, properties };
};
