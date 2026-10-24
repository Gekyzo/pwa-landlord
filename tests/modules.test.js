import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODULES, switchModule, visibleSections } from '#modules';

test('MODULES is properties', () => {
  assert.deepEqual(MODULES, ['properties']);
});

test('visibleSections with no module off is the full navigation', () => {
  assert.deepEqual(visibleSections([]), ['properties', 'settings']);
});

test('visibleSections without properties keeps settings', () => {
  assert.deepEqual(visibleSections(['properties']), ['settings']);
});

test('visibleSections ignores an unknown id', () => {
  assert.deepEqual(visibleSections(['shops']), ['properties', 'settings']);
});

test('switchModule turns a module off and on', () => {
  assert.deepEqual(switchModule([], 'properties', false), ['properties']);
  assert.deepEqual(switchModule(['properties'], 'properties', true), []);
  assert.deepEqual(switchModule([], 'properties', true), []);
});

test('switchModule ignores an unknown id and does not change its input', () => {
  const off = ['properties'];
  assert.deepEqual(switchModule(off, 'shops', false), ['properties']);
  assert.deepEqual(off, ['properties']);
});
