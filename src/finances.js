import { addMonths, isDate } from '#contract';
import { rentMonths } from '#balance';
import { KINDS } from '#properties';

// The finances of a property in a year (FIN-2 to FIN-4): the rent collected against the costs
// that the owner pays.

// The mortgage payments due in `year`, up to today: payment k falls k months after the first
// one, and the last one closes the run when it is set (FIN-2).
export const mortgageMonths = (mortgage, year, today) => {
  if (!mortgage) return 0;
  let count = 0;
  for (let k = 0; ; k += 1) {
    const due = addMonths(mortgage.start, k);
    if (due > today || (mortgage.end && due.slice(0, 7) > mortgage.end.slice(0, 7))) break;
    if (Number(due.slice(0, 4)) === year) count += 1;
    else if (Number(due.slice(0, 4)) > year) break;
  }
  return count;
};

// From the first year with a rent month, a cost or a mortgage payment to this year, newest
// first (FIN-3).
export const yearsOf = (property, today) => {
  const current = Number(today.slice(0, 4));
  const firsts = [
    ...rentMonths(property, today).map(({ due }) => due),
    ...property.expenses.map(({ date }) => date),
    ...(property.mortgage && isDate(property.mortgage.start) && property.mortgage.start <= today ? [property.mortgage.start] : []),
  ].map((date) => Number(date.slice(0, 4)));
  const first = Math.min(current, ...firsts);
  return Array.from({ length: current - first + 1 }, (_, i) => current - i);
};

// A rent month counts in the year of its due month; unpaid rent stays out of the net (FIN-4).
export const financesOf = (property, year, today) => {
  const inYear = (date) => Number(date.slice(0, 4)) === year;
  const months = rentMonths(property, today).filter(({ due }) => inYear(due));
  const sum = (list) => list.reduce((total, { amount }) => total + amount, 0);
  const costs = {
    mortgage: property.mortgage ? mortgageMonths(property.mortgage, year, today) * property.mortgage.amount : 0,
    ...Object.fromEntries(
      KINDS.map((kind) => [kind, sum(property.expenses.filter((expense) => expense.kind === kind && inYear(expense.date)))]),
    ),
  };
  const rent = sum(months.filter(({ paid }) => paid));
  const total = Object.values(costs).reduce((all, cents) => all + cents, 0);
  return { rent, unpaid: sum(months.filter(({ paid }) => !paid)), costs, total, net: rent - total };
};
