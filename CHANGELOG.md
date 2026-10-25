# Changelog

User-visible changes, newest first.

## Unreleased

- Google sign-in and the approval gate of the PocketBase server, with an offline choice, as in `pwa-template` (ACC-1 to ACC-10, `docs/spec/08-account.md`): `src/pocketbase.js`, `src/session.js`, `src/ui/account.js`. The app opens for an approved Google account or, after **Use offline**, with no account. Nothing syncs. Keys `pwa-landlord.session`, `pwa-landlord.offline` and `pwa-landlord.oauth` (`sessionStorage`). The shell cache is `pwa-landlord-shell-v2`.

## 0.2.0 - 2026-10-24

- The Properties section replaces the notes demo: create, edit, delete and reorder properties, each with a name (required, at most 80 characters) and an address (optional, at most 200). The doc is `pwa-landlord.properties`; the `pwa-landlord.notes` key of 0.1.1 is no longer read.

## 0.1.1 - 2026-10-24

- First release, from pwa-template 0.1.2: offline shell, install, update toast, What's new, English and Spanish, light and dark themes. The notes demo stands in for the domain.
