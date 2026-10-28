# Roadmap

## Planned

Nothing. Items 1 to 5 (summary, balance, annual finances, at a glance, documents) shipped.

## Deferred

- **Share with pwa-tenant.** The tenant reads the summary, the balance and the documents. Needs
  collections and a landlord→tenant share in `pwa-server` (like `shopping_shares`) and file
  fields; personal data on the server.
- **Role-choice screen.** Dropped: each app is one role.
- **Backup with the files.** The JSON export holds the data of the documents, not their files
  (DOC-7). A full backup (a zip, or the files inside the JSON) would let a new device open them.

- **Suggestions button.** A button that sends a user's idea to the project repo.
  - Decided so far: the target is a GitHub issue, not a PR. The repo URL comes from a config
    module that `npm run init` writes (button hidden when empty). Offline, the button is
    disabled with a "needs a connection" note.
  - Open: the users have no GitHub account, and a prefilled issue URL needs a sign-in. The
    options are a small relay service that holds the token (the first backend and network
    call; needs abuse limits), a share sheet or `mailto:` to the author, or both behind one
    button.
