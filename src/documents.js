import { SLOTS, findProperty } from '#properties';

// The files of a property and the receipt of an extra cost (DOC-1 to DOC-3). The doc keeps only
// their metadata; the blobs are in the store of `files`.
export { SLOTS };
// The slots that hold several files; each other slot holds one.
export const MULTI = ['insurance'];
export const MAX_FILE = 10 * 1024 * 1024;
export const MAX_FILE_NAME = 200;
export const TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const missing = (state) => ({ state, error: { key: 'error.propertyMissing' } });

export const checkFile = ({ type, size }) => {
  if (!TYPES.includes(type)) return { error: { key: 'error.fileType' } };
  if (!(size >= 1 && size <= MAX_FILE)) return { error: { key: 'error.fileSize', params: { max: MAX_FILE / 1024 / 1024 } } };
  return {};
};

const cleanMeta = ({ id, name, size, added }) => ({ id, name: String(name).trim().slice(0, MAX_FILE_NAME), size, added });

// The state with one property changed by `change`, which returns `{ property }` or `{ error }`.
const update = (state, id, change) => {
  const property = findProperty(state, id);
  if (!property) return missing(state);
  const { property: next, error } = change(property);
  if (error) return { state, error };
  return { state: { ...state, properties: state.properties.map((other) => (other.id === id ? next : other)) } };
};

// A file of a single slot replaces the one before; its blob stays until the next start (DOC-4).
export const addDocument = (state, propertyId, slot, meta) => {
  if (!SLOTS.includes(slot)) return { state, error: { key: 'error.slotInvalid' } };
  return update(state, propertyId, (property) => {
    const kept = MULTI.includes(slot) ? property.documents : property.documents.filter((file) => file.slot !== slot);
    return { property: { ...property, documents: [...kept, { ...cleanMeta(meta), slot }] } };
  });
};

export const removeDocument = (state, propertyId, documentId) =>
  update(state, propertyId, (property) => {
    if (!property.documents.some((file) => file.id === documentId)) return { error: { key: 'error.documentMissing' } };
    return { property: { ...property, documents: property.documents.filter((file) => file.id !== documentId) } };
  });

// `meta` null removes the receipt.
export const attachReceipt = (state, propertyId, expenseId, meta) =>
  update(state, propertyId, (property) => {
    if (!property.expenses.some((expense) => expense.id === expenseId)) return { error: { key: 'error.expenseMissing' } };
    const file = meta && cleanMeta(meta);
    return {
      property: { ...property, expenses: property.expenses.map((expense) => (expense.id === expenseId ? { ...expense, file } : expense)) },
    };
  });

export const fileIds = (state) =>
  new Set(
    state.properties.flatMap((property) => [
      ...property.documents.map(({ id }) => id),
      ...property.expenses.filter(({ file }) => file).map(({ file }) => file.id),
    ]),
  );

// The size of a file: whole kilobytes below 1 MB (at least 1), megabytes with one decimal from there.
export const formatSize = (bytes, tag) => {
  const mega = bytes >= 1024 * 1024;
  const value = mega ? bytes / 1024 / 1024 : Math.max(1, Math.round(bytes / 1024));
  return new Intl.NumberFormat(tag, { style: 'unit', unit: mega ? 'megabyte' : 'kilobyte', maximumFractionDigits: 1 }).format(value);
};
