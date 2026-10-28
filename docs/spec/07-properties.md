# Properties

The houses under management. Its files are `src/properties.js`, `src/contract.js`,
`src/ui/properties.js`, `tests/properties.test.js`, `tests/contract.test.js`, the `properties.*`, `row.delete`, `toast.propertyDeleted`,
`toast.order`, `error.name*`, `error.address*` and `error.propertyMissing` keys of the catalogs,
the `#properties` section and the `#property-sheet` of `index.html`.

## Doc

- **PROP-1** The doc is `{ version: 4, properties: [{ id, name, address, owner, tenant, start,
  rent, deposit, costs, mortgage, paid, expenses }] }`, newest property first, stored as JSON under `pwa-landlord.properties`.
  `owner` and `tenant` are full names, `''` when empty; `start` is the day the contract starts,
  `YYYY-MM-DD` or `''`; `rent` and `deposit` are amounts (PROP-11) or `null`; `costs` maps a cost
  of `COSTS` (`community`, `ibi`, `water`, `power`, `gas`, `rubbish`, `internet`) to `owner` or
  `tenant`, and a cost with no entry is not assigned. `mortgage` is the mortgage (FIN-1) or
  `null`. `paid` and `expenses` are the balance (BAL-1). A stored doc that is not valid is kept
  under `pwa-landlord.properties.corrupt`, and the app starts with no properties. The
  `pwa-landlord.notes` key of 0.1.1 is not read.
- **PROP-2** `normalizeProperties` accepts a doc of version 1 to 4 whose properties have a
  non-empty id, a name that is not blank, and no id two times; in version 2 also a text or no
  `owner` and `tenant`, a real day, `''` or no `start`, an amount, `null` or no `rent` and
  `deposit`, and an object or no `costs`; in version 3 also the balance of BAL-1 with no kind; in version 4 the balance with a kind of
  `KINDS` and a mortgage of FIN-1, `null` or none. It trims the texts, gives an absent field its empty
  value, drops a cost that is not in `COSTS` or has another payer, and drops unknown fields. An
  older doc, also from an import, becomes version 4 with the empty values: no facts of the
  contract for version 1, `paid` `{}` and `expenses` `[]` for versions 1 and 2, and `mortgage`
  `null` and each extra cost of kind `other` for versions 1 to 3. A new version
  adds its migration here.

## Operations

- **PROP-3** `addProperty` puts a property first, with an empty balance. The texts are trimmed. A blank name is
  `error.nameRequired`, a name of more than 80 characters is `error.nameTooLong`, an address of
  more than 200 characters is `error.addressTooLong`, an owner or a tenant of more than 120
  characters is `error.ownerTooLong` or `error.tenantTooLong`, and a start that is not a real day
  is `error.startInvalid`. The rent and the deposit come as texts (PROP-11). The mortgage comes as
  three texts, `mortgageAmount`, `mortgageStart` and `mortgageEnd`, read by FIN-1. Every other
  field can be empty.
- **PROP-4** `editProperty` changes the name, the address, the summary and the mortgage of one
  property, with the checks of PROP-3. Its balance stays as it is.
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
- **PROP-13** Each row of the list shows, below the name, `glanceOf` (FIN-4): **Owes** and the
  unpaid rent of every year (BAL-6) in the danger colour when it is above 0, then the year and
  the net of the current year. A property with no rent month, no extra cost and no mortgage
  shows no line.
