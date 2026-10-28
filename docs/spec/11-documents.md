# Documents

The files of a property (contract, insurances, supply contracts) and the receipt of an extra
cost, kept on the device. Its files are `src/documents.js`, `src/files.js`,
`src/ui/documents.js`, `tests/documents.test.js`, `tests/files.test.js`, the `documents.*`,
`expense.receipt*`, `balance.openReceipt`, `toast.documentDeleted`, `settings.exportNote`,
`error.file*`, `error.slotInvalid` and `error.documentMissing` keys of the catalogs, the
`#property-documents` part of the detail, the receipt field of `#expense-sheet` and
`#document-input` of `index.html`.

## Doc

- **DOC-1** A property has `documents`, a list of `{ id, slot, name, size, added }`: a non-empty
  id, a slot of `SLOTS`, a name that is not blank, a size in bytes above 0 and the day it was
  added. The slots are, in this order, `contract` (rental contract), `home` (home insurance),
  `insurance` (other insurances), `power` (power contract) and `gas` (gas contract). An extra cost
  has `file`, a receipt `{ id, name, size, added }` or `null`. The doc keeps only these data; the
  blob of each file is in the store of DOC-4, under its id.

## Rules

- **DOC-2** `checkFile` accepts a file of type `application/pdf`, `image/jpeg` or `image/png`
  (else `error.fileType`) of 1 byte to 10 MB (else `error.fileSize`).
- **DOC-3** `addDocument` adds a file to a slot. `insurance` holds several files; each other slot
  holds one, and a new file replaces it. The name is trimmed and cut to 200 characters. A slot
  that is not in `SLOTS` is `error.slotInvalid`. `removeDocument` removes one file; one that is
  not there is `error.documentMissing`. `attachReceipt` sets or, with `null`, removes the receipt
  of an extra cost; a cost that is not there is `error.expenseMissing`. A property that is not
  there is `error.propertyMissing` for each operation. `fileIds` gives the id of every file and
  receipt of the doc.
- **DOC-4** The blobs are in the IndexedDB database `pwa-landlord`, version 1, store `files`, as
  `{ id, blob }`. `openFiles` gives `put`, `get`, `remove` and `keys`, or null with no IndexedDB
  or a refused open; a write waits for the end of its transaction, so a refused write (quota) is
  an error. `prune` removes each blob whose id is not in a set and gives the count. A removed or
  replaced file keeps its blob until the next start, so an undo finds it.

## Screen

- **DOC-5** The detail of a property ends with **Documents**: for each slot, in the order of
  `SLOTS`, its name, then its files. A file shows its name, its size (`formatSize`: kB below 1 MB,
  MB with one decimal from there) and the day it was added; a tap on it opens the blob in a new tab
  from an object URL, revoked after 60 seconds. A slot of one file shows **Add** while it is empty,
  and its file has **Replace** and **Delete**; **Other insurances** keeps **Add**, and each of its
  files has **Delete**. A delete shows `toast.documentDeleted` with **Undo** for 5 seconds. With no
  store (DOC-4) the part shows `documents.unavailable` in place of the slots, and the rest of the
  app works.
- **DOC-6** **Add** and **Replace** open the file picker of the device for a PDF, a JPEG or a PNG.
  The file is checked (DOC-2, the error in a toast), then the blob is written to the store, then
  the metadata to the doc; a refused write is `error.fileNotSaved` and changes nothing. The first
  write of a run asks `navigator.storage.persist()`. A file whose blob is not in the store shows
  `documents.missing` in the danger colour in place of its size; it can be replaced or deleted. At
  each start, after the store opens, `prune` removes the blobs that no file of the doc names
  (`fileIds`); an empty doc prunes nothing, since it may be a doc that did not load.
- **DOC-7** The sheet of an extra cost has **Receipt**: the name of the picked file, or **None**,
  and **Attach**. **Save** checks the cost first, then writes the receipt as DOC-6, then saves the
  cost with it. A cost with a receipt shows a paper-clip button that opens it. The JSON export
  holds the metadata only; Settings says so below **Backup** (`settings.exportNote`), and an
  import from another device shows its files as `documents.missing`.
