import { randomUUID } from 'node:crypto';
import { AVAILABLE_MONTHS, DEFAULT_ANNUAL, loansForMonth, limitsForMember, billForMember } from './ledger.js';
import { allowedKeys, reject } from './security.js';
const text = (value, max = 120, required = true) => {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u001f\u007f]/.test(value) || (required && !value.trim())) reject('invalid-argument', 'Enter valid text values.');
  return value.trim();
};
const money = (value, max = 100000000) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) reject('invalid-argument', 'Enter a valid monetary amount.');
  return value;
};
const id = value => { if (!Number.isSafeInteger(value) || value < 1) reject('invalid-argument', 'Choose a valid record.'); return value; };
const adminOnly = account => { if (account.role !== 'admin') reject('permission-denied', 'Administrator access is required.'); };
const newPayment = () => ({ status: 'pending', deposit: 0, shortAmount: 0, extraAmount: 0, paidAt: null, paidBy: null });
const rate = (type, months) => type === 'self' ? months === 6 ? 5 : 10 : months === 6 ? 8 : 16;
function validateLoan(input, state, loans, forcedMember = null) {
  allowedKeys(input, ['type', 'borrowerName', 'borrowerPhone', 'borrowerAddress', 'guarantor', 'principal', 'totalMonths', 'chargedRate', 'note']);
  if (!['self', 'outer'].includes(input.type) || ![6, 12].includes(input.totalMonths)) reject('invalid-argument', 'Choose a valid loan type and tenure.');
  const principal = money(input.principal, input.type === 'outer' ? 100000 : 200000);
  if (principal === 0) reject('invalid-argument', 'The loan amount must be positive.');
  const borrowerName = input.type === 'self' && forcedMember ? forcedMember.name : text(input.borrowerName, 80).toUpperCase();
  const guarantor = forcedMember ? forcedMember.name : input.type === 'self' ? borrowerName : text(input.guarantor, 80).toUpperCase();
  const member = state.members.find(item => item.name === (input.type === 'self' ? borrowerName : guarantor));
  if (!member) reject('invalid-argument', 'Choose a registered committee member.');
  const limits = limitsForMember(state.members, loans, member.name);
  if (principal > (input.type === 'self' ? limits.selfLeft : limits.outerLeft)) reject('failed-precondition', 'The member’s remaining limit is insufficient.');
  const standardRate = rate(input.type, input.totalMonths);
  const chargedRate = input.chargedRate == null ? standardRate : money(input.chargedRate, 100);
  if (input.type === 'outer' && chargedRate < standardRate) reject('invalid-argument', 'The charged rate cannot be below the society rate.');
  const phone = input.borrowerPhone ? text(input.borrowerPhone, 16) : '';
  if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) reject('invalid-argument', 'Enter a valid phone number.');
  return { type: input.type, borrowerName, borrowerPhone: phone, borrowerAddress: input.borrowerAddress ? text(input.borrowerAddress, 250, false) : '', guarantor, principal, totalMonths: input.totalMonths, rate: standardRate, chargedRate, monthlyKisht: Math.round(principal * (1 + standardRate / 100) / input.totalMonths), outsiderMonthlyKisht: Math.round(principal * (1 + (input.type === 'outer' ? chargedRate : standardRate) / 100) / input.totalMonths), securityFee: input.type === 'outer' ? Math.round(principal * .005) : 0 };
}
export function applyCommand(source, account, envelope, now = new Date()) {
  allowedKeys(envelope, ['action', 'payload', 'meetingMonth', 'requestId', 'expectedRevision']);
  const { action, payload, meetingMonth } = envelope;
  if (!AVAILABLE_MONTHS.includes(meetingMonth)) reject('invalid-argument', 'Choose a valid meeting month.');
  if (typeof envelope.requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(envelope.requestId)) reject('invalid-argument', 'Missing operation identifier.');
  if (!Number.isSafeInteger(envelope.expectedRevision) || envelope.expectedRevision !== source.revision) reject('aborted', 'Records changed on another device. Refresh and try again.');
  if (account.role === 'borrower') reject('permission-denied', 'Borrower accounts have read-only access.');
  const state = structuredClone(source);
  const actor = state.members.find(member => member.id === account.memberId);
  if (!actor) reject('permission-denied', 'Account access is not configured.');
  const loans = loansForMonth(state, meetingMonth);
  const payments = { ...(state.paymentsByMonth?.[meetingMonth] || {}) };
  const timestamp = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
  let result = true;
  let details = '';
  let canRollback = true;
  const savePayments = () => { state.paymentsByMonth = { ...state.paymentsByMonth, [meetingMonth]: payments }; };
  const saveLoans = value => { state.loansByMonth = { ...state.loansByMonth, [meetingMonth]: value }; };
  const createLoan = input => {
    const fields = validateLoan(input, state, loans);
    const maxId = Math.max(460, ...Object.values(state.loansByMonth || {}).flat().map(loan => loan.id));
    if (!Number.isSafeInteger(maxId)) reject('failed-precondition', 'Loan identifiers need reconciliation.');
    const loan = { ...fields, id: maxId + 1, currentMonth: 1 };
    saveLoans([loan, ...loans]);
    return loan;
  };
  switch (action) {
    case 'togglePayment': {
      adminOnly(account); allowedKeys(payload, ['memberId']);
      const member = state.members.find(item => item.id === id(payload.memberId));
      if (!member) reject('not-found', 'Member not found.');
      const paid = payments[member.id]?.status !== 'paid';
      payments[member.id] = paid ? { status: 'paid', deposit: billForMember(loans, state.monthlyUnit, member.name).totalDue, shortAmount: 0, extraAmount: 0, paidAt: timestamp, paidBy: actor.name } : newPayment();
      savePayments(); details = `Set ${member.name} payment to ${paid ? 'paid' : 'pending'} for ${meetingMonth}.`; break;
    }
    case 'recordPayment': {
      adminOnly(account); allowedKeys(payload, ['memberId', 'deposit', 'shortAmount', 'extraAmount']);
      const member = state.members.find(item => item.id === id(payload.memberId));
      if (!member) reject('not-found', 'Member not found.');
      const deposit = money(payload.deposit), shortAmount = money(payload.shortAmount), extraAmount = money(payload.extraAmount);
      const due = billForMember(loans, state.monthlyUnit, member.name).totalDue;
      if (shortAmount > due || shortAmount > 0 && extraAmount > 0 || Math.abs(deposit - (due - shortAmount + extraAmount)) > .01) reject('invalid-argument', 'The payment breakdown does not reconcile.');
      payments[member.id] = { status: shortAmount > 0 ? 'short' : 'paid', deposit, shortAmount, extraAmount, paidAt: timestamp, paidBy: actor.name };
      savePayments(); details = `Recorded ₹${deposit} from ${member.name} for ${meetingMonth}.`; break;
    }
    case 'markAllPaid':
      adminOnly(account); allowedKeys(payload, []);
      for (const member of state.members) payments[member.id] = { status: 'paid', deposit: billForMember(loans, state.monthlyUnit, member.name).totalDue, shortAmount: 0, extraAmount: 0, paidAt: timestamp, paidBy: actor.name };
      savePayments(); details = `Marked all members paid for ${meetingMonth}.`; break;
    case 'updateKisht': {
      adminOnly(account); allowedKeys(payload, ['loanId', 'currentMonth']);
      const loan = loans.find(item => item.id === id(payload.loanId));
      if (!loan) reject('not-found', 'Loan not found.');
      if (!Number.isInteger(payload.currentMonth) || payload.currentMonth < 1 || payload.currentMonth > loan.totalMonths) reject('invalid-argument', 'Enter a valid installment number.');
      saveLoans(loans.map(item => item.id === loan.id ? { ...item, currentMonth: payload.currentMonth } : item)); details = `Updated loan #${loan.id} installment for ${meetingMonth}.`; break;
    }
    case 'advanceLoans': case 'revertLoans':
      adminOnly(account); allowedKeys(payload, []);
      saveLoans(loans.map(loan => ({ ...loan, currentMonth: Math.max(1, Math.min(loan.totalMonths, loan.currentMonth + (action === 'advanceLoans' ? 1 : -1))) })));
      details = `${action === 'advanceLoans' ? 'Advanced' : 'Reverted'} installments for ${meetingMonth}.`; break;
    case 'submitLoanRequest': {
      if (!['admin', 'member'].includes(account.role)) reject('permission-denied', 'Member access is required.');
      const fields = validateLoan(payload, state, loans, actor);
      const request = { ...fields, id: randomUUID(), requestedBy: actor.name, requestedById: actor.id, requestedByUid: account.uid, note: payload.note ? text(payload.note, 500, false) : '', status: 'pending', timestamp };
      if ((state.loanRequests || []).filter(item => item.status === 'pending' && item.requestedById === actor.id).length >= 5) reject('resource-exhausted', 'You already have five pending loan requests.');
      state.loanRequests = [request, ...(state.loanRequests || [])]; result = request; details = `Requested ${fields.type} loan for ${fields.borrowerName}.`; canRollback = false; break;
    }
    case 'disburseLoan':
      adminOnly(account); result = createLoan(payload); details = `Disbursed loan #${result.id} for ₹${result.principal}.`; break;
    case 'approveLoanRequest': case 'rejectLoanRequest': {
      adminOnly(account); allowedKeys(payload, ['requestId']);
      const request = (state.loanRequests || []).find(item => item.id === text(payload.requestId, 80));
      if (!request || request.status !== 'pending') reject('failed-precondition', 'This request is no longer pending.');
      const requester = state.members.find(item => item.id === request.requestedById);
      if (!requester || requester.name !== request.requestedBy) reject('failed-precondition', 'The requesting account needs reconciliation.');
      if (action === 'approveLoanRequest') result = createLoan({ type: request.type, borrowerName: request.type === 'self' ? requester.name : request.borrowerName, borrowerPhone: request.borrowerPhone, borrowerAddress: request.borrowerAddress, guarantor: requester.name, principal: request.principal, totalMonths: request.totalMonths, chargedRate: request.chargedRate });
      state.loanRequests = state.loanRequests.map(item => item.id === request.id ? { ...item, status: action === 'approveLoanRequest' ? 'approved' : 'rejected' } : item);
      details = `${action === 'approveLoanRequest' ? 'Approved' : 'Rejected'} loan request ${request.id}.`; break;
    }
    case 'updateMonthlyUnit':
      adminOnly(account); allowedKeys(payload, ['value']); state.monthlyUnit = money(payload.value, 100000); details = `Updated monthly contribution to ₹${state.monthlyUnit}.`; break;
    case 'updateAnnualConfig': {
      adminOnly(account); allowedKeys(payload, ['useCustomTotals', 'customSelfTotal', 'customOuterTotal', 'customMemberGuarantees']);
      if (typeof payload.useCustomTotals !== 'boolean') reject('invalid-argument', 'Choose an annual configuration mode.');
      if (!payload.useCustomTotals) state.annualMeetingConfig = structuredClone(DEFAULT_ANNUAL);
      else {
        allowedKeys(payload.customMemberGuarantees, state.members.map(member => member.name));
        state.annualMeetingConfig = { useCustomTotals: true, customSelfTotal: money(payload.customSelfTotal), customOuterTotal: money(payload.customOuterTotal), customMemberGuarantees: Object.fromEntries(Object.entries(payload.customMemberGuarantees).map(([name, amount]) => [name, money(amount)])) };
      }
      details = 'Updated annual settlement configuration.'; break;
    }
    default: reject('invalid-argument', 'This operation is not permitted.');
  }
  const undoPatch = Object.fromEntries(Object.keys(source).filter(key => !['revision', 'auditLogs'].includes(key) && JSON.stringify(source[key]) !== JSON.stringify(state[key])).map(key => [key, source[key]]));
  state.revision = source.revision + 1;
  const audit = { id: envelope.requestId, timestamp, actor: actor.name, actorUid: account.uid, action, details, canRollback, meetingMonth, revision: state.revision };
  state.auditLogs = [audit, ...(source.auditLogs || [])].slice(0, 200);
  return { state, result, audit, undoPatch };
}
