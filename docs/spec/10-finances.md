# Finances

The finances of a property in a year: the rent collected against the costs that the owner pays.
Its files are `src/finances.js`, `src/ui/finances.js`, `tests/finances.test.js`, the
`finances.*`, `kind.*`, `properties.mortgage*`, `expense.kind`, `error.mortgage*` and
`error.kindInvalid` keys of the catalogs and the `#property-finances` part of the detail. Everything stays on the device.

## Doc

- **FIN-1** A property has `mortgage`, `{ amount, start, end }` or `null`: an amount (PROP-11, not
  `null`) for each month, the day of the first payment and the day of the last one, `''` when it
  runs on. The sheet sends it as three texts: an empty amount is no mortgage; else a first
  payment that is not a real day is `error.mortgageStart`, a last payment that is not a real day
  or is before the first one is `error.mortgageEnd`, and the amount is read as PROP-11
  (`error.mortgageInvalid`, `error.mortgageTooLarge`). Each extra cost (BAL-1) has a kind of
  `KINDS`: `levy`, `ibi`, `tax` (the share of income tax of the property), `insurance` or
  `other`.

## Rules

- **FIN-2** `mortgageMonths` counts the payments of a mortgage in a year: payment k, from 0, is
  due on the first day k months later (as BAL-2), from the month of the first payment to the
  month of the last one, both in, and only while its due day is today or before.
- **FIN-3** `yearsOf` gives the years from the earliest year with a rent month (BAL-2), an extra
  cost or a mortgage payment to the current year, newest first. With no data it is the current
  year only.
- **FIN-4** `financesOf` gives, for a year: **rent**, the sum of the paid rent months (BAL-3)
  whose due day is in the year; **unpaid**, the sum of its unpaid months; **costs**, the mortgage
  payments of the year (FIN-2) times the amount, and the sum of the extra costs dated in the year
  for each kind; **total**, the sum of the costs; **net**, rent minus total. Unpaid rent is never
  in the net.

## Screen

- **FIN-5** The sheet of a property (PROP-8) ends with the part **Mortgage**: **Mortgage per
  month**, **First payment** and **Last payment**, two date pickers. The sheet of an extra cost
  (BAL-8) has **Kind**, a select of `KINDS`, **Other** by default. Each extra cost of the balance
  shows its kind beside its date.
- **FIN-6** The detail of a property ends with **Finances**: a select of the years of FIN-3, the
  current year when the detail opens, then the lines of FIN-4 for the chosen year: **Rent
  collected**; **Unpaid rent** in the danger colour, only above 0; one line for each cost above 0,
  **Mortgage** first, then the kinds in the order of `KINDS`; **Total costs**; **Net**, in the done
  colour at 0 or above and in the danger colour below 0. The view reads today from the clock of
  the device, as a local day.
