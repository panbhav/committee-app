export class PolicyError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
export const reject = (code, message) => { throw new PolicyError(code, message); };
export function authorizeAccount(account, identity, now = Date.now()) {
  if (!identity?.uid) reject('unauthenticated', 'Sign in to continue.');
  const provider = identity.firebase?.sign_in_provider;
  if (!['phone', 'password'].includes(provider)) reject('permission-denied', 'This sign-in method is not permitted.');
  if (provider === 'password' && identity.email_verified !== true) reject('permission-denied', 'Verify your email address before accessing records.');
  if (!account || account.active !== true || !['admin', 'member', 'borrower'].includes(account.role)) reject('permission-denied', 'Your account has not been approved for this workspace.');
  if (!Number.isFinite(identity.auth_time) || now / 1000 - identity.auth_time > 8 * 60 * 60 || identity.auth_time > now / 1000 + 60) reject('unauthenticated', 'Your session has expired. Sign in again.');
  if (account.role === 'borrower') {
    if (!Array.isArray(account.loanIds) || !account.loanIds.length || account.loanIds.length > 50 || account.loanIds.some(id => !Number.isInteger(id) || id < 1)) reject('permission-denied', 'Account access is not configured.');
  } else if (!Number.isInteger(account.memberId) || account.memberId < 1) reject('permission-denied', 'Account access is not configured.');
  return { ...account, uid: identity.uid };
}
export function assertRecent(identity, now = Date.now()) {
  if (now / 1000 - identity.auth_time > 15 * 60) reject('unauthenticated', 'Sign in again before changing financial records.');
}
const loanFields = ['id', 'borrowerName', 'guarantor', 'type', 'principal', 'rate', 'chargedRate', 'monthlyKisht', 'outsiderMonthlyKisht', 'currentMonth', 'totalMonths', 'securityFee'];
const pick = (object, fields) => Object.fromEntries(fields.filter(key => object[key] !== undefined).map(key => [key, object[key]]));
export function scopeWorkspace(state, account) {
  const ownMember = state.members.find(member => member.id === account.memberId);
  if (account.role !== 'borrower' && !ownMember) reject('permission-denied', 'Account access is not configured.');
  const admin = account.role === 'admin';
  const ownLoan = loan => admin || (account.role === 'borrower' ? account.loanIds.includes(loan.id) : (loan.type === 'self' && loan.borrowerName === ownMember.name) || (loan.type === 'outer' && loan.guarantor === ownMember.name));
  const sanitizeLoan = loan => {
    const safe = pick(loan, loanFields);
    if (account.role !== 'borrower') Object.assign(safe, pick(loan, ['borrowerPhone', 'borrowerAddress']));
    // Neither raw identity numbers nor embedded attachments leave the private ledger.
    return safe;
  };
  const loansByMonth = Object.fromEntries(Object.entries(state.loansByMonth || {}).map(([month, loans]) => [month, loans.filter(ownLoan).map(sanitizeLoan)]));
  const guarantors = new Set(Object.values(loansByMonth).flat().map(loan => loan.guarantor));
  const members = state.members.filter(member => admin || member.id === account.memberId || account.role === 'borrower' && guarantors.has(member.name)).map(member => pick(member, ['id', 'name', 'role', 'memberLimit', 'outerLimit', 'phone']));
  const paymentsByMonth = Object.fromEntries(Object.entries(state.paymentsByMonth || {}).map(([month, payments]) => [month, admin ? payments : account.role === 'member' ? { ...(payments[account.memberId] ? { [account.memberId]: payments[account.memberId] } : {}) } : {}]));
  const loanRequests = account.role === 'borrower' ? [] : (state.loanRequests || []).filter(request => admin || request.requestedById === account.memberId).map(request => pick(request, ['id', 'requestedBy', 'requestedById', 'type', 'borrowerName', 'borrowerPhone', 'borrowerAddress', 'principal', 'totalMonths', 'rate', 'chargedRate', 'monthlyKisht', 'outsiderMonthlyKisht', 'securityFee', 'note', 'status', 'timestamp']));
  const auditLogs = (state.auditLogs || []).filter(log => admin || log.actorUid === account.uid).map(log => ({ ...pick(log, ['id', 'timestamp', 'actor', 'action', 'details', 'canRollback']), canRollback: admin && log.canRollback === true }));
  return { revision: state.revision, members, loansByMonth, paymentsByMonth, loanRequests, auditLogs, monthlyUnit: account.role === 'borrower' ? 0 : state.monthlyUnit, availableCashFund: admin ? state.availableCashFund : 0, annualMeetingConfig: admin ? state.annualMeetingConfig : null, account: { role: account.role, memberId: account.memberId || null, loanIds: account.loanIds || [] } };
}
export function plainRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
}
export function allowedKeys(object, keys) {
  if (!plainRecord(object) || Object.keys(object).some(key => !keys.includes(key))) reject('invalid-argument', 'Unexpected request fields.');
}
export function redactError(error) {
  return error instanceof PolicyError ? { code: error.code, message: error.message } : { code: 'internal', message: 'The operation could not be completed.' };
}
