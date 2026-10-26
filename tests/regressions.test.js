import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateKisht, calculateSecurityFee, getLoanTimeline, getInstallmentSchedule } from '../src/utils/loanCalculator.js';
import { loanInputError, paymentInputError, undoError, distributeRupees } from '../src/utils/validation.js';
import { projectLoansForMonth } from '../src/utils/loanProjection.js';
import { readStoredJSON, clearAppStorage } from '../src/utils/storage.js';
import { INITIAL_LOANS, INITIAL_MEMBERS, AVAILABLE_MONTHS } from '../src/data/initialData.js';

test('every original loan retains its agreed installment', () => {
  for (const loan of INITIAL_LOANS) assert.equal(calculateKisht(loan.principal, loan.type, loan.totalMonths, loan.rate), loan.monthlyKisht, `Loan ${loan.id}`);
});
test('rates distinguish member, outsider, tenure, and explicit zero interest', () => {
  assert.equal(calculateKisht(100000, 'self', 6), 17500);
  assert.equal(calculateKisht(100000, 'outer', 6), 18000);
  assert.equal(calculateKisht(100000, 'outer', 12, 20), 10000);
  assert.equal(calculateKisht(12000, 'self', 12, 0), 1000);
  assert.equal(calculateSecurityFee(100000, 'outer'), 500);
  assert.equal(calculateSecurityFee(100000, 'self'), 0);
  assert.equal(calculateSecurityFee(Infinity), 0);
  assert.equal(calculateKisht(Infinity), 0);
});
test('timeline follows the selected meeting month across a year boundary', () => {
  const october = getLoanTimeline(3, 12, 'October 2026');
  assert.equal(october.startMonth, 'Aug 2026');
  assert.equal(october.endMonth, 'Jul 2027');
  assert.equal(october.nextDueDate, '10 Nov 2026');
  assert.equal(getLoanTimeline(1, 6, 'December 2026').nextDueDate, '10 Jan 2027');
  const schedule = getInstallmentSchedule(3, 6, 'January 2027');
  assert.equal(schedule[0].dueDate, '10 Nov 2026');
  assert.equal(schedule[2].dueDate, '10 Jan 2027');
  assert.equal(schedule[2].status, 'current');
});
test('invalid timeline inputs remain finite and fall back safely', () => {
  assert.equal(getLoanTimeline(Infinity, Infinity, 'invalid').startMonth, 'Sep 2026');
  assert.equal(getInstallmentSchedule(undefined, Infinity).length, 12);
});
const limits = { selfLeft: 200000, outerLeft: 800000 };
const loan = { type: 'outer', principal: 50000, totalMonths: 12, borrowerName: 'TEST BORROWER', guarantor: 'AVNISH', chargedRate: 16 };
test('valid loan passes; malformed or over-limit loans are rejected without silently capping principal', () => {
  assert.equal(loanInputError(loan, INITIAL_MEMBERS, limits), '');
  for (const patch of [{ principal: -1 }, { principal: Infinity }, { principal: 'bad' }, { principal: 100001 }, { totalMonths: 7 }, { guarantor: 'UNKNOWN' }, { borrowerName: '' }, { chargedRate: -5 }]) assert.notEqual(loanInputError({ ...loan, ...patch }, INITIAL_MEMBERS, limits), '');
  assert.notEqual(loanInputError(loan, INITIAL_MEMBERS, { ...limits, outerLeft: 1000 }), '');
});
test('payments must reconcile and cannot combine shortage and surplus', () => {
  assert.equal(paymentInputError(1000, 800, 200, 0), '');
  assert.equal(paymentInputError(1000, 1100, 0, 100), '');
  assert.equal(paymentInputError(1000, 0, 1000, 0), '');
  for (const values of [[1000, -10, 1010, 0], [1000, 1000, 0, Infinity], [1000, 900, 50, 0], [1000, 1000, 100, 100]]) assert.notEqual(paymentInputError(...values), '');
});
test('undo is month-bound, single use, and cannot overwrite newer payments', () => {
  const entry = { id: 'one', canRollback: true, rollbackData: { type: 'payment', meetingMonth: 'September 2026' } };
  assert.equal(undoError(entry, [entry], 'September 2026'), '');
  assert.notEqual(undoError(entry, [entry], 'October 2026'), '');
  assert.notEqual(undoError(entry, [{ ...entry, canRollback: false }], 'September 2026'), '');
  assert.notEqual(undoError(entry, [{ ...entry, id: 'newer' }, entry], 'September 2026'), '');
  assert.notEqual(undoError(entry, [], 'September 2026'), '');
});
test('whole-rupee dividends conserve the pool and differ by at most one rupee', () => {
  for (const count of [1, 7, 15, 17]) {
    const values = distributeRupees(420490, count);
    assert.equal(values.reduce((a, b) => a + b, 0), 420490);
    assert.ok(Math.max(...values) - Math.min(...values) <= 1);
  }
  assert.deepEqual(distributeRupees(500, 0), []);
});
test('future projection includes newly disbursed loans and excludes loans outside their term', () => {
  const base = { 'October 2026': [{ id: 1, currentMonth: 1, totalMonths: 6 }, { id: 2, currentMonth: 12, totalMonths: 12 }] };
  const november = projectLoansForMonth('November 2026', base, AVAILABLE_MONTHS, INITIAL_LOANS);
  assert.deepEqual(november, [{ id: 1, currentMonth: 2, totalMonths: 6 }]);
  assert.equal(projectLoansForMonth('September 2026', base, AVAILABLE_MONTHS, INITIAL_LOANS).some(item => item.id === 1), false);
  assert.deepEqual(base['October 2026'][0], { id: 1, currentMonth: 1, totalMonths: 6 });
});
test('saved historical snapshots are preserved', () => {
  const saved = { 'November 2026': [{ id: 8, currentMonth: 4 }] };
  assert.equal(projectLoansForMonth('November 2026', saved, AVAILABLE_MONTHS, INITIAL_LOANS), saved['November 2026']);
});
test('bad cached JSON and wrong shapes fall back; resetting only removes app keys', () => {
  const store = { comm_broken: '{', comm_wrong: '{}', comm_valid: '[1]', unrelated: 'keep' };
  globalThis.localStorage = { ...store, getItem: key => store[key] ?? null, removeItem: key => { delete store[key]; } };
  assert.deepEqual(readStoredJSON('comm_broken', [], Array.isArray), []);
  assert.deepEqual(readStoredJSON('comm_wrong', [], Array.isArray), []);
  assert.deepEqual(readStoredJSON('comm_valid', [], Array.isArray), [1]);
  clearAppStorage();
  assert.equal(store.unrelated, 'keep');
  assert.equal(store.comm_valid, undefined);
  delete globalThis.localStorage;
});
