// Derive an unsaved month from the nearest saved ledger, including loans added
// after September. Saved months remain unchanged historical snapshots.
export function projectLoansForMonth(targetMonth, savedMonths, availableMonths, initialLoans) {
  if (Array.isArray(savedMonths?.[targetMonth])) return savedMonths[targetMonth];
  const targetIndex = availableMonths.indexOf(targetMonth);
  if (targetIndex < 0) return initialLoans;
  const snapshots = Object.entries(savedMonths || {}).filter(([month, loans]) => availableMonths.includes(month) && Array.isArray(loans));
  if (!snapshots.length) snapshots.push(['September 2026', initialLoans]);
  const before = snapshots.filter(([month]) => availableMonths.indexOf(month) <= targetIndex);
  const sorted = (before.length ? before : snapshots).sort(([a], [b]) => before.length ? availableMonths.indexOf(b) - availableMonths.indexOf(a) : availableMonths.indexOf(a) - availableMonths.indexOf(b));
  const [baseMonth, baseLoans] = sorted[0];
  const offset = targetIndex - availableMonths.indexOf(baseMonth);
  return baseLoans.flatMap(loan => {
    const currentMonth = (Number(loan.currentMonth) || 1) + offset;
    const totalMonths = Number(loan.totalMonths) || 12;
    return currentMonth < 1 || currentMonth > totalMonths ? [] : [{ ...loan, currentMonth }];
  });
}
