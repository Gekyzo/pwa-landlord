# Changelog

User-visible changes, newest first.

## Unreleased

- The summary of a property (PROP-1 to PROP-4, PROP-8, PROP-10 to PROP-12): owner, tenant, contract start, monthly rent, deposit and the payer of each running cost, in the sheet and in the detail. The detail derives the end of the current year of contract and the 5-year limit (1 year, extended a year at a time up to 5). New pure module `src/contract.js`. The doc goes to version 2; a version 1 doc or export migrates. The shell cache is `pwa-landlord-shell-v3`.

## 0.2.1 - 2026-10-25

- Google sign-in and the approval gate of the PocketBase server, with an offline choice, as in `pwa-template` (ACC-1 to ACC-10, `docs/spec/08-account.md`): `src/pocketbase.js`, `src/session.js`, `src/ui/account.js`. The app opens for an approved Google account or, after **Use offline**, with no account. Nothing syncs. Keys `pwa-landlord.session`, `pwa-landlord.offline` and `pwa-landlord.oauth` (`sessionStorage`). The shell cache is `pwa-landlord-shell-v2`.

## 0.2.0 - 2026-10-24

- The Properties section replaces the notes demo: create, edit, delete and reorder properties, each with a name (required, at most 80 characters) and an address (optional, at most 200). The doc is `pwa-landlord.properties`; the `pwa-landlord.notes` key of 0.1.1 is no longer read.

## 0.1.1 - 2026-10-24

- First release, from pwa-template 0.1.2: offline shell, install, update toast, What's new, English and Spanish, light and dark themes. The notes demo stands in for the domain.
