import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATALOGS } from '#i18n';
import { PAGES } from '#onboarding';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const body = html.slice(html.indexOf('<body'), html.indexOf('<script type="importmap">'));

const textKeys = [...body.matchAll(/data-i18n="([^"]+)"/g)].map(([, key]) => key);
const attrKeys = [...body.matchAll(/data-i18n-attr="([^"]+)"/g)].flatMap(([, pairs]) =>
  pairs.split(',').map((pair) => pair.split(':')[1]));

test('the page has translated text and translated attributes', () => {
  assert.ok(textKeys.length > 0);
  assert.ok(attrKeys.length > 0);
});

test('each key of the page is in the Spanish catalog', () => {
  for (const key of [...textKeys, ...attrKeys]) assert.ok(Object.hasOwn(CATALOGS.es, key), key);
});

test('an element with a text key is empty in the markup', () => {
  for (const [, key, text] of body.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)</g)) assert.equal(text.trim(), '', key);
});

test('the markup has no text of its own', () => {
  const visible = body
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<span class="chevron"[^>]*>[^<]*<\/span>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[+\s]/g, '');
  assert.equal(visible, '');
  assert.doesNotMatch(body, /\s(aria-label|placeholder|title)="/);
});

test('the property sheet has a veil, a dialog, a name and an address with their maximum lengths', () => {
  const [layer = ''] = body.match(/<div id="property-sheet" class="sheet-layer"[\s\S]*?<\/form>\s*<\/div>/) ?? [];
  assert.match(layer, /<div id="property-veil" class="sheet-veil">/);
  assert.match(layer, /<form id="property-form" class="sheet" role="dialog"/);
  assert.match(layer, /<input id="property-name"[^>]*maxlength="80" required/);
  assert.match(layer, /<input id="property-address"[^>]*maxlength="200"/);
});

test('the property sheet has a head with its title and Close, a body, and Save in its foot', () => {
  const [layer = ''] = body.match(/<div id="property-sheet" class="sheet-layer"[\s\S]*?<\/form>\s*<\/div>/) ?? [];
  assert.match(layer, /<header class="sheet-head"><h2 id="property-sheet-title" class="sheet-title main"><\/h2><button id="property-close" class="button tonal" type="button" data-i18n="properties.close"><\/button><\/header>\s*<div class="sheet-body">/);
  assert.match(layer, /<footer class="sheet-foot"><button class="button primary wide" type="submit" data-i18n="properties.save"><\/button><\/footer>\s*<\/form>/);
});

test('the extra cost sheet has a veil, a dialog, a title, an amount and a date, and Save in its foot (BAL-8)', () => {
  const [layer = ''] = body.match(/<div id="expense-sheet" class="sheet-layer"[\s\S]*?<\/form>\s*<\/div>/) ?? [];
  assert.match(layer, /<div id="expense-veil" class="sheet-veil">/);
  assert.match(layer, /<form id="expense-form" class="sheet" role="dialog" aria-modal="true" aria-labelledby="expense-sheet-title"/);
  assert.match(layer, /<input id="expense-title"[^>]*maxlength="80" required/);
  assert.match(layer, /<input id="expense-amount"[^>]*inputmode="decimal" required/);
  assert.match(layer, /<input id="expense-date"[^>]*type="date" required/);
  assert.match(layer, /<footer class="sheet-foot"><button class="button primary wide" type="submit" data-i18n="properties.save"><\/button><\/footer>\s*<\/form>/);
});

test('the property sheet has the mortgage fields, and the cost sheet a kind (FIN-5)', () => {
  assert.match(body, /<input id="property-mortgage-amount"[^>]*inputmode="decimal"/);
  assert.match(body, /<input id="property-mortgage-start"[^>]*type="date"/);
  assert.match(body, /<input id="property-mortgage-end"[^>]*type="date"/);
  assert.match(body, /<select id="expense-kind" class="select field-input"/);
  assert.match(body, /<section id="property-finances" class="finances">/);
  assert.match(body, /<select id="finance-year" class="select field-input"/);
});

test('the detail has the Documents part with one input of each slot (DOC-5)', () => {
  assert.match(body, /<section id="property-documents" class="documents">/);
  assert.match(body, /<input id="document-input" type="file" accept="application\/pdf,image\/jpeg,image\/png" hidden>/);
  assert.match(body, /<button id="expense-receipt" class="button outline" type="button" data-i18n="expense.receiptPick">/);
  assert.match(body, /<p class="backup-note" data-i18n="settings.exportNote"><\/p>/);
});

test('the header has the add of the view, and the rail the brand, the count and the foot (NAV-3, NAV-4)', () => {
  assert.match(body, /<header class="app-header">[\s\S]*<button id="header-add" class="button primary header-add" type="button" hidden>[\s\S]*<span id="header-add-text"><\/span><\/button>\s*<\/header>/);
  const [nav = ''] = body.match(/<nav class="nav-bar"[\s\S]*?<\/nav>/) ?? [];
  assert.match(nav, /^<nav class="nav-bar"[^>]*>\s*<div class="nav-brand" aria-hidden="true"><img src="\.\/icons\/icon-192\.png" alt="" width="28" height="28"><span data-i18n="app.title"><\/span><\/div>/);
  assert.match(nav, /<span id="nav-count" class="nav-count" aria-hidden="true"><\/span>/);
  assert.match(nav, /<p id="nav-account" class="nav-foot" data-i18n-attr="title:nav.local" hidden>/);
});

test('each group of Settings is a section: its head and its group (SET-1)', () => {
  const [settings = ''] = body.match(/<section id="settings"[\s\S]*?<\/section>/) ?? [];
  const heads = settings.match(/class="list-group-head"/g) ?? [];
  const sections = settings.match(/class="settings-section"/g) ?? [];
  assert.ok(heads.length > 0);
  assert.equal(sections.length, heads.length);
});

test('the walkthrough has one drawing for each page, in the order of the pages', () => {
  const [layer = ''] = body.match(/<div id="onboarding"[\s\S]*?<input id="import-file"/) ?? [];
  const drawings = [...layer.matchAll(/<svg data-page="([^"]+)"/g)].map(([, page]) => page);
  assert.deepEqual(drawings, PAGES);
});

test('the walkthrough shows the app icon first, out of the page that changes, with no text', () => {
  const [, layer = ''] = body.match(/<div id="onboarding"[^>]*>\s*([\s\S]*?)<div id="onboarding-page"/) ?? [];
  assert.match(layer, /^<img class="onboarding-logo" src="\.\/icons\/logo\.png" alt="">\s*$/);
});

test('the walkthrough has Saltar and the next button in one bar at the bottom, Saltar first', () => {
  const [bar = ''] = body.match(/<div class="onboarding-actions">[\s\S]*?<\/div>/) ?? [];
  const buttons = [...bar.matchAll(/<button id="([^"]+)"/g)].map(([, id]) => id);
  assert.deepEqual(buttons, ['onboarding-skip', 'onboarding-next']);
  assert.doesNotMatch(body, /onboarding-top/);
});

test('the What\'s new sheet has a veil, a dialog with its title and Close, and a body (VER-22)', () => {
  const [layer = ''] = body.match(/<div id="whatsnew-sheet" class="sheet-layer"[\s\S]*?<\/section>\s*<\/div>/) ?? [];
  assert.match(layer, /<div id="whatsnew-veil" class="sheet-veil">/);
  assert.match(layer, /<section id="whatsnew" class="sheet" role="dialog" aria-modal="true" aria-labelledby="whatsnew-title">/);
  assert.match(layer, /<h2 id="whatsnew-title" class="sheet-title main" data-i18n="whatsNew.title"><\/h2><button id="whatsnew-close" class="button tonal" type="button" data-i18n="whatsNew.close"><\/button>/);
  assert.match(layer, /<div id="whatsnew-body" class="sheet-body whatsnew-body"><\/div>/);
});

test('Help in Settings has the What\'s new row, hidden until there are notes (VER-23)', () => {
  assert.match(body, /<button id="show-whatsnew" class="settings-row" type="button" hidden><span class="settings-row-label" data-i18n="settings.whatsNew"><\/span><span class="chevron" aria-hidden="true">›<\/span><\/button>/);
});

test('the account screens cover the app: Sign in with Google or offline, and Waiting for approval (ACC-2)', () => {
  const [layer = ''] = body.match(/<section id="auth" class="account" role="dialog" aria-modal="true"[\s\S]*?<\/section>/) ?? [];
  assert.match(layer, /<div id="login" class="account-page">/);
  assert.match(layer, /<h2 id="login-title" class="account-title" tabindex="-1" data-i18n="account.login.title">/);
  assert.match(layer, /<button id="login-google" class="button tonal wide" type="button"><svg class="icon small" aria-hidden="true"><use href="icons.svg#google"\/><\/svg>/);
  assert.match(layer, /<p id="login-error" class="input-help danger" role="alert" hidden><\/p>\s*<button id="login-offline" class="button accent" type="button" data-i18n="account.offline"><\/button>/);
  assert.match(layer, /<div id="waiting" class="account-page" hidden>/);
  assert.match(layer, /<h2 id="waiting-title" class="account-title" tabindex="-1" data-i18n="account.waiting.title">/);
  const buttons = [...layer.matchAll(/<button id="(waiting-[^"]+)"/g)].map(([, id]) => id);
  assert.deepEqual(buttons, ['waiting-check', 'waiting-logout']);
});

test('Settings has the Account group: the email and Log out, or Sign in with Google (ACC-8)', () => {
  const [group = ''] = body.match(/<div id="account-group" class="settings-section" hidden>[\s\S]*?<\/div>\s*<\/div>/) ?? [];
  assert.match(group, /data-i18n="settings.account"/);
  assert.match(group, /<span id="account-email" class="settings-row-label"><\/span>/);
  assert.match(group, /<div id="account-row" class="settings-row"><span id="account-email" class="settings-row-label"><\/span><\/div>/);
  assert.match(group, /<button id="logout" class="settings-row" type="button">/);
  assert.match(group, /<button id="account-login" class="settings-row" type="button"><span class="settings-row-label" data-i18n="account.signIn"><\/span>/);
});
