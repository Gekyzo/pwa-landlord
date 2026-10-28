# Documents

The files of a property (contract, insurances, supply contracts) and the receipt of an extra
cost, kept on the device. Its files are `src/documents.js`, `src/files.js`,
`tests/documents.test.js`, `tests/files.test.js` and the `error.file*`, `error.slotInvalid` and
`error.documentMissing` keys of the catalogs.

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
