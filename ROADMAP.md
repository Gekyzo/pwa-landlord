# Roadmap

## Planned

In this order. Everything stays on the device (ACC: nothing syncs) until the tenant share.

1. **Property summary.** Doc v2 of PROP with a migration: owner and tenant names, contract
   start, end (1 year, extended a year at a time up to 5; LAU art. 9), monthly rent, deposit,
   and a fixed list of costs (community, IBI, water, power, gas, rubbish, internet), each paid by
   the owner or the tenant. Amounts in integer cents.
2. **Balance.** The months come from the contract dates; the doc keeps only the paid months and
   each month's amount (the rent changes each year). Unpaid is red, paid is green; the landlord
   marks a month paid. Extra costs (free title, amount, date) are paid by the landlord, so they
   count in the annual finances, not in what the tenant owes. Attachments wait for item 5.
3. **Annual finances.** The owner's costs per property and year: mortgage (recurring), special
   levies, IBI, income tax and others. Open: income tax is usually not per property; split it
   or keep it apart.
4. **At a glance.** Each row of the property list shows the unpaid amount and the net of the
   year (paid rent minus costs).
5. **Documents.** PDFs per property: rental contract, home insurance, other insurance, power
   contract, gas contract; and the receipt of an extra cost. `localStorage` cannot hold them:
   IndexedDB, a new storage seam, and the JSON export/import must handle the files.

## Deferred

- **Share with pwa-tenant.** The tenant reads the summary, the balance and the documents. Needs
  collections and a landlord→tenant share in `pwa-server` (like `shopping_shares`) and file
  fields; personal data on the server.
- **Role-choice screen.** Dropped: each app is one role.

- **Suggestions button.** A button that sends a user's idea to the project repo.
  - Decided so far: the target is a GitHub issue, not a PR. The repo URL comes from a config
    module that `npm run init` writes (button hidden when empty). Offline, the button is
    disabled with a "needs a connection" note.
  - Open: the users have no GitHub account, and a prefilled issue URL needs a sign-in. The
    options are a small relay service that holds the token (the first backend and network
    call; needs abuse limits), a share sheet or `mailto:` to the author, or both behind one
    button.
