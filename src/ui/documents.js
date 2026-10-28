import { SLOTS, MULTI, checkFile, addDocument, removeDocument, formatSize } from '#documents';
import { findProperty } from '#properties';
import { formatDay, localDay } from '#contract';
import { intlTag } from '#i18n';
import { $, el, ui, state, t, lang, apply, render, showToast, textOf, files, filesReady, fileKeys } from '#ui/context';
import { icon } from '#ui/controls';

// The Documents part of the detail of a property (DOC-5 to DOC-7), and the pick, save and open of
// a file that the receipt of an extra cost uses too.
const REVOKE_MS = 60_000;

// The file that the user picks, or null on cancel.
export const pickFile = () =>
  new Promise((resolve) => {
    const input = $('document-input');
    const finish = (file) => {
      input.onchange = null;
      input.oncancel = null;
      resolve(file);
    };
    input.value = '';
    input.onchange = () => finish(input.files[0] ?? null);
    input.oncancel = () => finish(null);
    input.click();
  });

let persistAsked = false;

// Puts the blob in the store and gives its metadata, or null after a toast of the error (DOC-6).
export const saveFile = async (file) => {
  const { error } = checkFile(file);
  if (error) {
    showToast(textOf(error));
    return null;
  }
  if (!files) {
    showToast(t('documents.unavailable'));
    return null;
  }
  if (!persistAsked) {
    persistAsked = true;
    navigator.storage?.persist?.().catch(() => {});
  }
  const meta = { id: crypto.randomUUID(), name: file.name, size: file.size, added: localDay(new Date()) };
  try {
    await files.put(meta.id, file);
  } catch {
    showToast(t('error.fileNotSaved'));
    return null;
  }
  fileKeys.add(meta.id);
  return meta;
};

// Opens the blob in a new tab; a missing blob shows so.
export const openFile = async (meta) => {
  const blob = files && (await files.get(meta.id).catch(() => null));
  if (!blob) {
    fileKeys.delete(meta.id);
    showToast(t('documents.missing'));
    render();
    return;
  }
  const url = URL.createObjectURL(blob);
  el('a', { href: url, target: '_blank', rel: 'noopener' }).click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_MS);
};

const upload = async (propertyId, slot) => {
  const file = await pickFile();
  if (!file) return;
  const meta = await saveFile(file);
  if (meta) apply(addDocument(state, propertyId, slot, meta));
};

const button = (name, label, onClick, className = 'button quiet documents-action') => {
  const node = el('button', { type: 'button', className, title: label, onclick: onClick }, [icon(name)]);
  node.setAttribute('aria-label', label);
  return node;
};

// A file: its name opens it; below, its size and date, or Not on this device.
const fileRow = (propertyId, file, single) => {
  const missing = !fileKeys.has(file.id);
  const tag = intlTag(lang);
  const meta = missing ? t('documents.missing') : `${formatSize(file.size, tag)} · ${formatDay(file.added, tag)}`;
  const open = el('button', { type: 'button', className: 'documents-open', onclick: () => openFile(file) }, [
    el('span', { className: 'documents-file', textContent: file.name }),
    el('small', { className: missing ? 'documents-meta missing' : 'documents-meta', textContent: meta }),
  ]);
  open.setAttribute('aria-label', t('documents.open', { name: file.name }));
  const remove = button('trash', t('row.delete', { text: file.name }), () =>
    apply(removeDocument(state, propertyId, file.id), { undoText: t('toast.documentDeleted') }),
  );
  return el('li', { className: 'documents-row' }, [
    icon('file'),
    open,
    ...(single ? [button('refresh', t('documents.replace', { name: file.name }), () => upload(propertyId, file.slot))] : []),
    remove,
  ]);
};

// The head of a slot, with Add while the slot can take a file.
const slotRow = (propertyId, slot, canAdd) => {
  const name = t(`documents.${slot}`);
  const add = el('button', { type: 'button', className: 'button outline', textContent: t('documents.add'), onclick: () => upload(propertyId, slot) });
  add.setAttribute('aria-label', t('documents.addTo', { slot: name }));
  return el('li', { className: 'documents-slot' }, [el('span', { className: 'documents-slot-name', textContent: name }), ...(canAdd ? [add] : [])]);
};

export const renderDocuments = () => {
  const property = ui.propertyId === null ? null : findProperty(state, ui.propertyId);
  $('property-documents').hidden = !property;
  if (!property) return;
  // Nothing shows until the store has opened, or failed to.
  $('documents-unavailable').hidden = !filesReady || files !== null;
  $('document-slots').hidden = files === null;
  if (!files) return;
  $('document-slots').replaceChildren(
    ...SLOTS.flatMap((slot) => {
      const single = !MULTI.includes(slot);
      const list = property.documents.filter((file) => file.slot === slot);
      return [slotRow(property.id, slot, !single || list.length === 0), ...list.map((file) => fileRow(property.id, file, single))];
    }),
  );
};
