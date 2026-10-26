export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const AVAILABLE_MONTHS = Array.from({ length: 60 }, (_, i) => `${MONTHS[i % 12]} ${2026 + Math.floor(i / 12)}`);
export const DEFAULT_ANNUAL = { useCustomTotals: false, customSelfTotal: null, customOuterTotal: null, customMemberGuarantees: {} };
export const emptyLedger = () => ({ revision: 0, members: [], loansByMonth: {}, paymentsByMonth: {}, monthlyUnit: 1000, availableCashFund: 0, annualMeetingConfig: { ...DEFAULT_ANNUAL }, loanRequests: [], auditLogs: [] });
export function loansForMonth(state, month) {
  if (Array.isArray(state.loansByMonth?.[month])) return state.loansByMonth[month];
  const target = AVAILABLE_MONTHS.indexOf(month);
  const saved = Object.entries(state.loansByMonth || {}).filter(([key, value]) => AVAILABLE_MONTHS.includes(key) && Array.isArray(value));
  if (target < 0 || !saved.length) return [];
  const previous = saved.filter(([key]) => AVAILABLE_MONTHS.indexOf(key) <= target);
  const candidates = (previous.length ? previous : saved).sort(([a], [b]) => previous.length ? AVAILABLE_MONTHS.indexOf(b) - AVAILABLE_MONTHS.indexOf(a) : AVAILABLE_MONTHS.indexOf(a) - AVAILABLE_MONTHS.indexOf(b));
  const [baseMonth, loans] = candidates[0];
  const offset = target - AVAILABLE_MONTHS.indexOf(baseMonth);
  return loans.flatMap(loan => {
    const currentMonth = Number(loan.currentMonth || 1) + offset;
    return currentMonth < 1 || currentMonth > (loan.totalMonths || 12) ? [] : [{ ...loan, currentMonth }];
  });
}
export function billForMember(loans, monthlyUnit, name) {
  const selfLoans = loans.filter(loan => loan.type === 'self' && loan.borrowerName === name);
  const outerLoans = loans.filter(loan => loan.type === 'outer' && loan.guarantor === name);
  const selfTotal = selfLoans.reduce((sum, loan) => sum + loan.monthlyKisht, 0);
  const outerTotal = outerLoans.reduce((sum, loan) => sum + loan.monthlyKisht, 0);
  return { selfLoans, outerLoans, selfTotal, outerTotal, monthlyUnit, totalDue: selfTotal + outerTotal + monthlyUnit };
}
export function limitsForMember(members, loans, name) {
  const member = members.find(item => item.name === name);
  if (!member) return { memberLimit: 0, outerLimit: 0, selfUsed: 0, outerUsed: 0, selfLeft: 0, outerLeft: 0 };
  const selfUsed = loans.filter(loan => loan.type === 'self' && loan.borrowerName === name).reduce((sum, loan) => sum + loan.principal, 0);
  const outerUsed = loans.filter(loan => loan.type === 'outer' && loan.guarantor === name).reduce((sum, loan) => sum + loan.principal, 0);
  return { memberLimit: member.memberLimit, outerLimit: member.outerLimit, selfUsed, outerUsed, selfLeft: Math.max(0, member.memberLimit - selfUsed), outerLeft: Math.max(0, member.outerLimit - outerUsed) };
}
export function meetingStats(members, loans, monthlyUnit, payments) {
  return members.reduce((stats, member) => {
    const bill = billForMember(loans, monthlyUnit, member.name);
    const payment = payments[member.id];
    stats.totalExpected += bill.totalDue;
    stats.totalCollected += payment ? (Number.isFinite(payment.deposit) ? payment.deposit : payment.status === 'paid' ? bill.totalDue : 0) : 0;
    if (payment?.status === 'paid') stats.paidCount++; else stats.pendingCount++;
    return stats;
  }, { totalExpected: 0, totalCollected: 0, paidCount: 0, pendingCount: 0 });
}
export function annualStats(members, loans, config = DEFAULT_ANNUAL) {
  const selfLoans = loans.filter(loan => loan.type === 'self');
  const outerLoans = loans.filter(loan => loan.type === 'outer');
  const autoSelfTotal = selfLoans.reduce((sum, loan) => sum + loan.principal, 0);
  const autoOuterTotal = outerLoans.reduce((sum, loan) => sum + loan.principal, 0);
  const useCustom = Boolean(config.useCustomTotals);
  const selfTotal = useCustom && config.customSelfTotal != null ? config.customSelfTotal : autoSelfTotal;
  const outerTotal = useCustom && config.customOuterTotal != null ? config.customOuterTotal : autoOuterTotal;
  const selfPoolReturn7Pct = Math.round(selfTotal * .07);
  const outerPoolReturn7Pct = Math.round(outerTotal * .07);
  const totalCommonPool = selfPoolReturn7Pct + outerPoolReturn7Pct;
  const base = members.length ? Math.floor(totalCommonPool / members.length) : 0;
  const remainder = members.length ? totalCommonPool % members.length : 0;
  const memberPayouts = members.map((member, index) => {
    const autoGuaranteed = outerLoans.filter(loan => loan.guarantor === member.name).reduce((sum, loan) => sum + loan.principal, 0);
    const outerGuaranteed = useCustom && config.customMemberGuarantees?.[member.name] != null ? config.customMemberGuarantees[member.name] : autoGuaranteed;
    const guarantorCommission = Math.round(outerGuaranteed * .06);
    const poolDividend = base + (index < remainder ? 1 : 0);
    return { member, selfLoansTaken: selfLoans.filter(loan => loan.borrowerName === member.name).reduce((sum, loan) => sum + loan.principal, 0), outerGuaranteed, guarantorCommission, poolDividend, totalPayout: poolDividend + guarantorCommission };
  });
  return { useCustom, autoSelfTotal, autoOuterTotal, selfTotal, outerTotal, totalLoansGiven: selfTotal + outerTotal, selfPoolReturn7Pct, outerPoolReturn7Pct, totalCommonPool, perMemberPoolDividend: base, memberPayouts, totalCommissionAll: memberPayouts.reduce((sum, item) => sum + item.guarantorCommission, 0), totalPayoutAll: memberPayouts.reduce((sum, item) => sum + item.totalPayout, 0) };
}
