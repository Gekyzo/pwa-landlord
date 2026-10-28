import { $, ui, state, storage, t, UNDO_MS, setRender, setFiles, render, showToast, hideToast, toastAction, clickGuardUntil } from '#ui/context';
import { bind as bindNav, renderNav } from '#ui/nav';
import { bind as bindProperties, renderProperties, closePropertySheet } from '#ui/properties';
import { bind as bindBalance, renderBalance, closeExpenseSheet } from '#ui/balance';
import { bind as bindFinances, renderFinances } from '#ui/finances';
import { renderDocuments } from '#ui/documents';
import { openFiles, discard } from '#files';
import { fileIds, trashDue } from '#documents';
import { loadTrash, saveTrash } from '#storage';
import { bind as bindSettings, applyLanguage } from '#ui/settings';
import { bind as bindInstall, renderInstall } from '#ui/install';
import { readVersion, renderVersion, offerUpdate } from '#ui/update';
import { bind as bindDrag, endReorder } from '#ui/drag';
import { bind as bindOnboarding, closeOnboarding, turnOnboarding } from '#ui/onboarding';
import { bind as bindWhatsNew, startWhatsNew, isWhatsNewOpen, closeWhatsNew } from '#ui/whatsnew';
import { bind as bindAccount, renderAccount, startAccount, goOnline, isAccountOpen, closeAccount } from '#ui/account';
import { readOAuthReturn } from '#session';

// The return of the Google sign-in (ACC-4): `code`, `state` and `error` leave the URL at once.
const { oauth, clean } = readOAuthReturn(new URL(location.href));
if (oauth) history.replaceState(history.state, '', clean);

const renderAll = () => {
  renderNav();
  $('title').textContent = t(`nav.${ui.view}`);
  renderProperties();
  renderBalance();
  renderFinances();
  renderDocuments();
  $('settings').hidden = ui.view !== 'settings';
  renderVersion();
  renderInstall();
  renderAccount();
};
setRender(renderAll);

bindNav();
bindProperties();
bindBalance();
bindFinances();
bindSettings();
bindInstall();
bindDrag();
bindOnboarding();
bindWhatsNew();
bindAccount();

document.addEventListener(
  'click',
  (event) => {
    if (Date.now() >= clickGuardUntil) return;
    event.preventDefault();
    event.stopPropagation();
  },
  true,
);

document.addEventListener('keydown', (event) => {
  // The account screens cover the app, the walkthrough too. Only Sign in over an open app closes (ACC-2).
  if (isAccountOpen()) {
    if (event.key === 'Escape') closeAccount();
    return;
  }
  if (ui.onboarding !== null) {
    if (event.key === 'Escape') closeOnboarding();
    else if (event.key === 'ArrowRight') turnOnboarding(1);
    else if (event.key === 'ArrowLeft') turnOnboarding(-1);
    return;
  }
  if (event.key !== 'Escape') return;
  if (isWhatsNewOpen()) {
    closeWhatsNew();
    return;
  }
  endReorder(false);
  if (ui.expenseOpen) closeExpenseSheet();
  else if (ui.sheetOpen) closePropertySheet();
  else if (ui.propertyId !== null) {
    ui.propertyId = null;
    render();
  }
});

$('toast-action').addEventListener('click', () => {
  const action = toastAction;
  hideToast();
  action?.run();
});

applyLanguage();
if (ui.onboarding !== null) $('onboarding-next').focus();
startAccount(oauth);
window.addEventListener('online', goOnline);
if (!storage) showToast(t('error.noStorage'));
navigator.storage?.persist?.().catch(() => {});
navigator.serviceWorker?.register('./sw.js').catch(() => {});
// Read once at the start: the worker answers from the cache, then stores the file of the next deploy.
readVersion('./version.json').then((running) => {
  ui.version.running = running;
  renderVersion();
  startWhatsNew(running);
  navigator.serviceWorker?.ready.then(offerUpdate).catch(() => {});
});

// The store of the files (DOC-4). At the start the blobs of the trash go, but only those dropped
// before this run and longer ago than an undo lasts, so an undo, in this tab or another, finds its
// blob. An import puts nothing in the trash, so it loses no file of this device.
const started = Date.now();
const emptyTrash = async (store) => {
  if (!storage) return;
  const { remove } = trashDue(loadTrash(storage), fileIds(state), started - 2 * UNDO_MS);
  if (remove.length === 0) return;
  await discard(store, remove);
  // Read again: this run may have put new ids in the trash meanwhile.
  const named = fileIds(state);
  const rest = Object.entries(loadTrash(storage)).filter(([id]) => !remove.includes(id) && !named.has(id));
  saveTrash(storage, Object.fromEntries(rest));
};
openFiles(window.indexedDB).then(async (store) => {
  let keys = [];
  if (store) {
    await emptyTrash(store).catch(() => {});
    // A store that cannot be read shows each file as missing; nothing is lost.
    keys = await store.keys().catch(() => []);
  }
  setFiles(store, new Set(keys));
  render();
});
