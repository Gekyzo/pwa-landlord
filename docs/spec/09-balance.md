# Balance

The rent months of a property, their payment, and the extra costs that the landlord pays. Its
files are `src/balance.js`, `src/ui/balance.js`, `tests/balance.test.js`, the `balance.*`,
`expense.*`, `toast.expenseDeleted`, `error.rentMissing`, `error.title*`, `error.expense*` and
`error.dateInvalid` keys of the catalogs, the `#property-balance` part of the detail and the
`#expense-sheet` of `index.html`. Everything stays on the device.

## Doc

- **BAL-1** A property has `paid`, an object from a month `YYYY-MM` to the amount (PROP-11, not
  `null`) that it was paid with, and `expenses`, a list of `{ id, title, amount, date }`, newest
  first: a title that is not blank, an amount that is not `null` and a real day.

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
  `error.expenseTooLarge`. A date that is not a real day is `error.dateInvalid`.
- **BAL-5** `deleteExpense` removes one extra cost; one that is not there is
  `error.expenseMissing`. A property that is not there is `error.propertyMissing` for each
  operation.
- **BAL-6** `balanceOf` gives the sum and the count of the unpaid months, the sum of the paid
  months and the sum of the extra costs. An extra cost is the landlord's: it never adds to what
  the tenant owes.
