# Changelog

User-visible changes, newest first.

## Unreleased

No change.

## 0.2.3 - 2026-10-31

- Bold text in **What's new** (VER-22): `textParts` of `src/onboarding.js` also reads a text between two `**` as a part with `strong: true`, a key in it too; a `**` with no pair, or one in a key, stays as text. `src/ui/whatsnew.js` shows such a part in a `<strong>`. Until now the notes showed the `**` marks.
- **Delete all data** in Settings › Backup, as in pwa-template (SET-2): `resetAll` in `src/storage.js` removes each `localStorage` key of the app, `<slug>.*` (the file trash too), and no key of another app of the origin; the page loads again as a new install. With a session the question says that it also logs out (`signedIn` of `src/ui/account.js`). Before the keys it empties the IndexedDB store of the file blobs (`clear` of `src/files.js`, DOC-4), and the question says that the backup does not keep the files. Keys `settings.reset`, `reset.confirm`, `reset.confirmLocal`, `error.resetFailed`.

## 0.2.2 - 2026-10-28

- Four width classes, as in `pwa-shopping-list` (DSV-5, DSV-6, NAV-3, NAV-4, SET-1): phone below 600px unchanged; from 600px the rail stands at the start with either hand and the add is **Add property** in the header; from 840px a sheet with a head is a card at the end of the content and Settings is two columns; from 1024px the app stands in a frame of at most 1280px with a 232px sidebar (the app mark, the count of properties, **No account** with no session). `tests/design.test.js` runs DS-8 without the 1024px query. The screen-reader text of `.version-status` no longer makes the page scroll.
- The documents of a property (DOC-1 to DOC-7, `docs/spec/11-documents.md`): PDF, JPEG or PNG files of up to 10 MB in five slots (rental contract, home insurance, other insurances, power contract, gas contract) and a receipt on each extra cost. The blobs live in IndexedDB (`pwa-landlord`/`files`, `src/files.js`); the doc, version 5, keeps their data only (`src/documents.js`, `src/ui/documents.js`). A delete has undo; a delete or a replace puts the file in a trash (`pwa-landlord.file-trash`), and a later start removes its blob after the undo time. An import puts nothing in the trash, so it loses no file of the device. A file whose blob is missing shows **Not on this device**. The JSON export holds the data only, and Settings says so. Icons `clip` and `file`. The shell cache is `pwa-landlord-shell-v6`.
- At a glance (PROP-13): each row of the property list shows, below the name, the unpaid rent of every year in the danger colour and the net of the current year. `glanceOf` in `src/finances.js`; no line for a property with no rent month, no extra cost and no mortgage.
- The annual finances of a property (FIN-1 to FIN-6, `docs/spec/10-finances.md`): a mortgage per month with its first and last payment in the property sheet, a kind for each extra cost (levy, IBI, income tax, insurance, other), and a **Finances** part in the detail with a year select: rent collected by the year of its due month, unpaid rent apart, the costs by kind, the total and the net. New modules `src/finances.js` and `src/ui/finances.js`. The doc goes to version 4; versions 1 to 3 migrate with no mortgage and each extra cost of kind other. The shell cache is `pwa-landlord-shell-v5`.
- New app icon: three red houses and a gold key. `icons/source.png` is the new art (1254 px); `npm run icons` wrote `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` and `logo.png` again.
- The balance of a property (BAL-1 to BAL-8, `docs/spec/09-balance.md`): the rent months since the contract start, each due on the start day, red while unpaid and green once marked paid; the paid amount is kept per month. Extra costs that the landlord pays (title, amount, date) with their own sheet and an undo on delete. New modules `src/balance.js` and `src/ui/balance.js`. The doc goes to version 3; versions 1 and 2 migrate with an empty balance. The shell cache is `pwa-landlord-shell-v4`.
- The summary of a property (PROP-1 to PROP-4, PROP-8, PROP-10 to PROP-12): owner, tenant, contract start, monthly rent, deposit and the payer of each running cost, in the sheet and in the detail. The detail derives the end of the current year of contract and the 5-year limit (1 year, extended a year at a time up to 5). New pure module `src/contract.js`. The doc goes to version 2; a version 1 doc or export migrates. The shell cache is `pwa-landlord-shell-v3`.

## 0.2.1 - 2026-10-25

- Google sign-in and the approval gate of the PocketBase server, with an offline choice, as in `pwa-template` (ACC-1 to ACC-10, `docs/spec/08-account.md`): `src/pocketbase.js`, `src/session.js`, `src/ui/account.js`. The app opens for an approved Google account or, after **Use offline**, with no account. Nothing syncs. Keys `pwa-landlord.session`, `pwa-landlord.offline` and `pwa-landlord.oauth` (`sessionStorage`). The shell cache is `pwa-landlord-shell-v2`.

## 0.2.0 - 2026-10-24

- The Properties section replaces the notes demo: create, edit, delete and reorder properties, each with a name (required, at most 80 characters) and an address (optional, at most 200). The doc is `pwa-landlord.properties`; the `pwa-landlord.notes` key of 0.1.1 is no longer read.

## 0.1.1 - 2026-10-24

- First release, from pwa-template 0.1.2: offline shell, install, update toast, What's new, English and Spanish, light and dark themes. The notes demo stands in for the domain.
