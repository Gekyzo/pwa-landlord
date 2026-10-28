# Balance

The rent months of a property, their payment, and the extra costs that the landlord pays. Its
files are `src/balance.js`, `src/ui/balance.js`, `tests/balance.test.js`, the `balance.*`,
`expense.*`, `toast.expenseDeleted`, `error.rentMissing`, `error.title*`, `error.expense*` and
`error.dateInvalid` keys of the catalogs, the `#property-balance` part of the detail and the
`#expense-sheet` of `index.html`. Everything stays on the device.

## Doc

- **BAL-1** A property has `paid`, an object from a month `YYYY-MM` to the amount (PROP-11, not
  `null`) that it was paid with, and `expenses`, a list of `{ id, title, amount, date, kind, file }`, newest
  first: a title that is not blank, an amount that is not `null`, a real day, a kind of
  `KINDS` (FIN-1) and a receipt (DOC-1) or `null`.

## Rules

- **BAL-2** The rent months of a property with a start (PROP-1) and a rent: month k, from 0, is
  due on the start day k months later, counted from the start; a day that the month does not
  have becomes its last day. A month shows while its due day is today or before, up to 60 months
  (PROP-10). Its key is the `YYYY-MM` of its due day. With no start or no rent there is no month.
- **BAL-3** The amount of a paid month is the one stored in `paid`; of an unpaid month, the rent.
  `togglePaid` marks an unpaid month paid with the rent, and makes a paid month unpaid again. With
  no rent, marking is `error.rentMissing`.
- **BAL-4** `addExpense` puts an extra cost first. Its title is trimmed: blank is
  `error.titleRequired`, more than 80 characters `error.titleTooLong`. Its amount is read as
  PROP-11: empty is `error.expenseRequired`, else `error.expenseInvalid` or
  `error.expenseTooLarge`. A date that is not a real day is `error.dateInvalid`. With no kind it is `other`; a kind that is
  not in `KINDS` is `error.kindInvalid`.
- **BAL-5** `deleteExpense` removes one extra cost; one that is not there is
  `error.expenseMissing`. A property that is not there is `error.propertyMissing` for each
  operation.
- **BAL-6** `balanceOf` gives the sum and the count of the unpaid months, the sum of the paid
  months and the sum of the extra costs. An extra cost is the landlord's: it never adds to what
  the tenant owes.

## Screen

- **BAL-7** The detail of a property (PROP-8) ends with **Balance**. With no start or no rent it
  shows `balance.needs`. Else it shows the total: **Unpaid:** the sum and the count of the unpaid
  months in the danger colour, or **All paid.** in the done colour; then the rent months, newest
  first, each with its month, its amount and a button: **Unpaid** in the danger colour, or
  **Paid** in the done colour. A tap on the button marks the month paid or unpaid (BAL-3), with no
  toast. The view reads today from the clock of the device, as a local day.
- **BAL-8** Below the months, **Extra costs** lists the extra costs, newest first, each with its
  title, its date, its amount and a delete button; a delete shows `toast.expenseDeleted` with
  **Undo** for 5 seconds. **Add cost** opens the sheet of a new extra cost: **Title**, **Amount**
  and **Date**, today by default, with **Close** in its head and **Save** in its foot. **Close**,
  a tap on the veil, a drag down of the head or `Escape` closes it with no save.
