# Properties

The houses under management. Its files are `src/properties.js`, `src/contract.js`,
`src/ui/properties.js`, `tests/properties.test.js`, `tests/contract.test.js`, the `properties.*`, `row.delete`, `toast.propertyDeleted`,
`toast.order`, `error.name*`, `error.address*` and `error.propertyMissing` keys of the catalogs,
the `#properties` section and the `#property-sheet` of `index.html`.

## Doc

- **PROP-1** The doc is `{ version: 2, properties: [{ id, name, address, owner, tenant, start,
  rent, deposit, costs }] }`, newest property first, stored as JSON under `pwa-landlord.properties`.
  `owner` and `tenant` are full names, `''` when empty; `start` is the day the contract starts,
  `YYYY-MM-DD` or `''`; `rent` and `deposit` are amounts (PROP-11) or `null`; `costs` maps a cost
  of `COSTS` (`community`, `ibi`, `water`, `power`, `gas`, `rubbish`, `internet`) to `owner` or
  `tenant`, and a cost with no entry is not assigned. A stored doc that is not valid is kept
  under `pwa-landlord.properties.corrupt`, and the app starts with no properties. The
  `pwa-landlord.notes` key of 0.1.1 is not read.
- **PROP-2** `normalizeProperties` accepts a doc of version 1 or 2 whose properties have a
  non-empty id, a name that is not blank, and no id two times; in version 2 also a text or no
  `owner` and `tenant`, a real day, `''` or no `start`, an amount, `null` or no `rent` and
  `deposit`, and an object or no `costs`. It trims the texts, gives an absent field its empty
  value, drops a cost that is not in `COSTS` or has another payer, and drops unknown fields. A
  version 1 doc, also from an import, becomes version 2 with the empty values. A new version
  adds its migration here.

## Operations

- **PROP-3** `addProperty` puts a property first. The texts are trimmed. A blank name is
  `error.nameRequired`, a name of more than 80 characters is `error.nameTooLong`, an address of
  more than 200 characters is `error.addressTooLong`, an owner or a tenant of more than 120
  characters is `error.ownerTooLong` or `error.tenantTooLong`, and a start that is not a real day
  is `error.startInvalid`. The rent and the deposit come as texts (PROP-11). Every other field can
  be empty.
- **PROP-4** `editProperty` changes every field of one property but its id, with the checks of
  PROP-3.
- **PROP-5** `deleteProperty` removes one property. The toast `toast.propertyDeleted` offers
  **Undo** for 5 seconds.
- **PROP-6** `moveProperty` puts a property at an index of the list, clamped to its ends. The
  toast `toast.order` offers **Undo**.
- **PROP-7** An id that is not in the doc is `error.propertyMissing`, and nothing changes.

## Screen

- **PROP-8** The Properties section lists the properties by name. With no property it shows
  `properties.empty` and **Add property**. **+** and **Add property** open the sheet of a new
  property; a tap on a row opens its detail (LAY-3): the name, the address when there is one,
  the summary (PROP-12), **Edit** and **Delete**. The head of the sheet has the title and
  **Close**; its body has **Name**, **Address**, **Owner**, **Tenant**, **Contract start** (a date
  picker), **Monthly rent**, **Deposit**, then the part **Costs** with one select for each cost of
  `COSTS`: **Not assigned**, **Owner** or **Tenant**; its foot has **Save**. An amount shows in the
  sheet with no currency and no groups. **Close**, a tap on the veil or a drag down of the head
  closes it with no save.
- **PROP-9** A row slides left to show **Delete**. A hold of a finger, or a vertical drag of the
  mouse, lifts the row and moves it in the list (PROP-6).

## Contract

- **PROP-10** The term of a contract is 1 year, extended a year at a time up to 5 years.
  `contractTerm(start, today)` gives the year of contract that holds `today` (1 to 5), the day it
  ends, the day of the 5-year limit and whether that day is past. A start that is not a real day
  `YYYY-MM-DD` gives no term. A year after February 29 is February 28. The rule takes `today`; only
  the view reads the clock.
- **PROP-11** An amount is integer cents in euros, from 0 to 100 000 000. `parseAmount` reads a
  text: a space and `€` are ignored, the last `.` or `,` with 1 or 2 digits after it is the decimal
  mark, and another separator groups the digits by 3. An empty text is no amount. Another text is
  `error.rentInvalid` or `error.depositInvalid`; more than 1 000 000 € is `error.rentTooLarge` or
  `error.depositTooLarge`. `formatAmount` shows it
  in euros in the language of the page.
- **PROP-12** The summary of a property lists only its filled facts, each with its name: owner,
  tenant, contract start, the end of the current year with "year N of 5" (while the contract has
  not ended), the 5-year limit (**Contract ended** once it is past), monthly rent and deposit.
  Dates show in the medium style of the language, amounts in euros (PROP-11). Below the list, one
  line names the costs that the owner pays and one the costs that the tenant pays; a line with no
  cost is hidden. The view reads today from the clock of the device, as a local day.
