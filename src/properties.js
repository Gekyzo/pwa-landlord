import { APP_SLUG } from '#config';

// The houses under management, in the order that the landlord gives them; a new one goes first.
export const PROPERTIES_KEY = `${APP_SLUG}.properties`;
export const MAX_NAME = 80;
export const MAX_ADDRESS = 200;

export const emptyProperties = () => ({ version: 1, properties: [] });

const missing = (state) => ({ state, error: { key: 'error.propertyMissing' } });

// The clean fields, or an error message.
const checkFields = ({ name, address } = {}) => {
  const cleanName = String(name ?? '').trim();
  const cleanAddress = String(address ?? '').trim();
  if (!cleanName) return { error: { key: 'error.nameRequired' } };
  if (cleanName.length > MAX_NAME) return { error: { key: 'error.nameTooLong', params: { max: MAX_NAME } } };
  if (cleanAddress.length > MAX_ADDRESS) return { error: { key: 'error.addressTooLong', params: { max: MAX_ADDRESS } } };
  return { clean: { name: cleanName, address: cleanAddress } };
};

export const findProperty = (state, id) => state.properties.find((property) => property.id === id) ?? null;

export const addProperty = (state, fields, id = crypto.randomUUID()) => {
  const { clean, error } = checkFields(fields);
  if (error) return { state, error };
  return { state: { ...state, properties: [{ id, ...clean }, ...state.properties] } };
};

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

const validProperty = (property) =>
  typeof property === 'object' &&
  property !== null &&
  typeof property.id === 'string' &&
  property.id !== '' &&
  typeof property.name === 'string' &&
  property.name.trim() !== '' &&
  (property.address === undefined || typeof property.address === 'string');

// A clean version 1 doc, or null. Add a migration here when the version goes up.
export const normalizeProperties = (data) => {
  if (typeof data !== 'object' || data === null || data.version !== 1 || !Array.isArray(data.properties)) return null;
  if (!data.properties.every(validProperty)) return null;
  const properties = data.properties.map(({ id, name, address = '' }) => ({ id, name: name.trim(), address: address.trim() }));
  if (new Set(properties.map((property) => property.id)).size !== properties.length) return null;
  return { version: 1, properties };
};
