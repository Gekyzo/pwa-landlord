// The blobs of the files of the documents, in IndexedDB: database `pwa-landlord`, store `files`,
// `{ id, blob }` (DOC-4). It takes the `indexedDB` object, so that a test can pass its own.
const DB = 'pwa-landlord';
const STORE = 'files';

const done = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

// The store, or null with no IndexedDB or a refused open (private mode, blocked site data).
export const openFiles = async (indexedDB) => {
  if (!indexedDB) return null;
  let db;
  try {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    db = await done(request);
  } catch {
    return null;
  }
  // A refused write (quota) aborts the transaction, so the result waits for its end.
  const run = (mode, work) =>
    new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = work(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  return {
    put: (id, blob) => run('readwrite', (store) => store.put({ id, blob })).then(() => undefined),
    get: (id) => run('readonly', (store) => store.get(id)).then((row) => row?.blob ?? null),
    remove: (id) => run('readwrite', (store) => store.delete(id)).then(() => undefined),
    keys: () => run('readonly', (store) => store.getAllKeys()),
    clear: () => run('readwrite', (store) => store.clear()).then(() => undefined),
  };
};

// Removes the blobs of `ids` that the store holds; returns how many it removed.
export const discard = async (store, ids) => {
  const held = new Set(await store.keys());
  const gone = ids.filter((id) => held.has(id));
  for (const id of gone) await store.remove(id);
  return gone.length;
};
