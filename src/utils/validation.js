export function loanInputError({ type, principal, totalMonths, borrowerName, guarantor, chargedRate }, members, limits) {
  const amount = Number(principal);
  const memberName = String(type === 'self' ? borrowerName : guarantor).trim().toUpperCase();
  if (!['self', 'outer'].includes(type) || ![6, 12].includes(Number(totalMonths))) return 'Choose a valid loan type and tenure.';
  if (!String(borrowerName || '').trim() || !members.some(member => member.name === memberName)) return 'Choose a valid borrower and committee member.';
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter a valid positive loan amount.';
  if (type === 'outer' && amount > 100000) return 'Outer loans cannot exceed ₹1,00,000.';
  if (chargedRate != null && (!Number.isFinite(Number(chargedRate)) || Number(chargedRate) < 0)) return 'Enter a valid interest rate.';
  if (amount > (type === 'self' ? limits.selfLeft : limits.outerLeft)) return 'This loan exceeds the member’s available limit.';
  return '';
}

export function paymentInputError(totalDue, deposit, short, extra) {
  const values = [totalDue, deposit, short, extra].map(Number);
  if (values.some(value => !Number.isFinite(value) || value < 0)) return 'Payment amounts must be finite, non-negative numbers.';
  if (Number(short) > Number(totalDue) || (Number(short) > 0 && Number(extra) > 0)) return 'Enter either a short amount up to the amount due, or an extra amount.';
  if (Math.abs(Number(deposit) - (Number(totalDue) - Number(short) + Number(extra))) > 0.01) return 'The payment breakdown does not match the amount due.';
  return '';
}

export function undoError(entry, auditLogs, meetingMonth) {
  const index = auditLogs.findIndex(log => log.id === entry?.id);
  if (index < 0 || !auditLogs[index].canRollback || !entry.rollbackData) return 'This action has already been undone or cannot be undone.';
  if (entry.rollbackData.meetingMonth !== meetingMonth) return 'Open the original meeting month before undoing this action. Older entries without a meeting month cannot be safely undone.';
  const type = entry.rollbackData.type;
  const newerChange = auditLogs.slice(0, index).some(log => log.canRollback !== false && (
    log.rollbackData?.meetingMonth === meetingMonth && (
      log.rollbackData.type === type ||
      ['payment', 'all_payments'].includes(log.rollbackData.type) && ['payment', 'all_payments'].includes(type)
    )
  ));
  return newerChange ? 'A newer change exists. Undo the latest change first to preserve the audit trail.' : '';
}

// Allocate whole rupees without distributing more or less than the common pool.
export function distributeRupees(amount, count) {
  if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(count) || count < 1) return [];
  const total = Math.round(amount);
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}
