import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openFiles, prune } from '#files';

// A store of the shape of openFiles, over a Map.
const fakeStore = (ids) => {
  const map = new Map(ids.map((id) => [id, new Blob([id])]));
  return {
    put: async (id, blob) => void map.set(id, blob),
    get: async (id) => map.get(id) ?? null,
    remove: async (id) => void map.delete(id),
    keys: async () => [...map.keys()],
  };
};

test('prune keeps the named ids and removes the rest', async () => {
  const store = fakeStore(['a', 'b', 'c']);
  assert.equal(await prune(store, new Set(['b'])), 2);
  assert.deepEqual(await store.keys(), ['b']);
});

test('prune of a store with only named ids removes nothing', async () => {
  const store = fakeStore(['a']);
  assert.equal(await prune(store, new Set(['a', 'x'])), 0);
  assert.deepEqual(await store.keys(), ['a']);
});

test('openFiles is null with no IndexedDB', async () => assert.equal(await openFiles(undefined), null));

test('openFiles is null when the open is refused', async () => {
  const request = {};
  const indexedDB = {
    open: () => {
      queueMicrotask(() => request.onerror?.());
      return request;
    },
  };
  assert.equal(await openFiles(indexedDB), null);
});

test('openFiles is null when the open throws', async () => {
  assert.equal(await openFiles({ open: () => { throw new Error('denied'); } }), null);
});
