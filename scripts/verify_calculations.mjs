import { INITIAL_MEMBERS, INITIAL_LOANS } from '../src/data/initialData.js';
import { calculateKisht, calculateSecurityFee, getStandardRate } from '../src/utils/loanCalculator.js';

console.log('=== BANKING SOCIETY CALCULATION VERIFICATION SUITE ===\n');

let issuesFound = 0;

// 1. VERIFY ALL INITIAL LOANS FORMULAS
console.log('--- 1. Testing Monthly Kisht Formulas for all Initial Loans ---');
INITIAL_LOANS.forEach(loan => {
  const expectedRate = getStandardRate(loan.type, loan.totalMonths || 12);
  if (loan.rate !== expectedRate) {
    console.warn(`[WARN] Loan #${loan.id} (${loan.borrowerName}): stored rate ${loan.rate}% !== expected standard rate ${expectedRate}%`);
  }

  const calculatedKisht = calculateKisht(loan.principal, loan.type, loan.totalMonths || 12, loan.rate);
  if (calculatedKisht !== loan.monthlyKisht) {
    console.error(`[ERROR] Loan #${loan.id} (${loan.borrowerName}): stored kisht ₹${loan.monthlyKisht} !== calculated kisht ₹${calculatedKisht} (diff: ${calculatedKisht - loan.monthlyKisht})`);
    issuesFound++;
  }

  const expectedSecurity = calculateSecurityFee(loan.principal, loan.type);
  if (loan.securityFee !== undefined && loan.securityFee !== expectedSecurity) {
    console.warn(`[WARN] Loan #${loan.id} (${loan.borrowerName}): stored security fee ₹${loan.securityFee} !== calculated ₹${expectedSecurity}`);
  }
});
console.log(`Verified ${INITIAL_LOANS.length} loans. Monthly Kisht math check completed.`);

// 2. VERIFY MEMBER BILLS
console.log('\n--- 2. Testing Member Monthly Bills Calculation ---');
const monthlyUnit = 1000;
let grandTotalOuter = 0;
let grandTotalSelf = 0;
let grandTotalMonthly = 0;
let grandTotalDue = 0;

INITIAL_MEMBERS.forEach(m => {
  const selfLoans = INITIAL_LOANS.filter(l => l.type === 'self' && l.borrowerName === m.name);
  const outerLoans = INITIAL_LOANS.filter(l => l.type === 'outer' && l.guarantor === m.name);

  const selfTotal = selfLoans.reduce((sum, l) => sum + l.monthlyKisht, 0);
  const outerTotal = outerLoans.reduce((sum, l) => sum + l.monthlyKisht, 0);
  const totalDue = selfTotal + outerTotal + monthlyUnit;

  grandTotalOuter += outerTotal;
  grandTotalSelf += selfTotal;
  grandTotalMonthly += monthlyUnit;
  grandTotalDue += totalDue;

  console.log(`Member: ${m.name.padEnd(12)} | Outer: ₹${outerTotal.toLocaleString().padStart(7)} | Self: ₹${selfTotal.toLocaleString().padStart(7)} | Unit: ₹${monthlyUnit} | Total: ₹${totalDue.toLocaleString().padStart(7)}`);
});

console.log('-------------------------------------------------------------------------');
console.log(`GRAND TOTALS | Outer: ₹${grandTotalOuter.toLocaleString()} | Self: ₹${grandTotalSelf.toLocaleString()} | Units: ₹${grandTotalMonthly.toLocaleString()} | Expected Collection: ₹${grandTotalDue.toLocaleString()}`);

// Check against expected ₹5,84,902
if (grandTotalDue === 584902) {
  console.log('✅ Grand Total matches EXACTLY ₹5,84,902 from the original spreadsheet!');
} else {
  console.log(`ℹ️ Grand Total is ₹${grandTotalDue.toLocaleString()} (Difference from 5,84,902: ₹${grandTotalDue - 584902})`);
}

// 3. VERIFY RISK LIMITS
console.log('\n--- 3. Testing Risk Limits for All Members ---');
INITIAL_MEMBERS.forEach(m => {
  const selfLoans = INITIAL_LOANS.filter(l => l.type === 'self' && l.borrowerName === m.name);
  const outerLoans = INITIAL_LOANS.filter(l => l.type === 'outer' && l.guarantor === m.name);

  const selfUsed = selfLoans.reduce((s, l) => s + l.principal, 0);
  const outerUsed = outerLoans.reduce((s, l) => s + l.principal, 0);
  const selfLeft = Math.max(0, m.memberLimit - selfUsed);
  const outerLeft = Math.max(0, m.outerLimit - outerUsed);

  const selfExceeded = selfUsed > m.memberLimit;
  const outerExceeded = outerUsed > m.outerLimit;

  if (selfExceeded || outerExceeded) {
    console.warn(`[LIMIT ALERT] ${m.name}: Self Used ₹${selfUsed.toLocaleString()}/${m.memberLimit.toLocaleString()} (${selfExceeded ? 'EXCEEDED' : 'OK'}), Outer Used ₹${outerUsed.toLocaleString()}/${m.outerLimit.toLocaleString()} (${outerExceeded ? 'EXCEEDED' : 'OK'})`);
  }
});
console.log('Member risk limits verification completed.');

// 4. VERIFY ANNUAL FEBRUARY SETTLEMENT MATH
console.log('\n--- 4. Testing Annual February Profit & Commission Settlement Math ---');
const activeSelfLoans = INITIAL_LOANS.filter(l => l.type === 'self');
const activeOuterLoans = INITIAL_LOANS.filter(l => l.type === 'outer');

const totalSelfPrincipal = activeSelfLoans.reduce((s, l) => s + l.principal, 0);
const totalOuterPrincipal = activeOuterLoans.reduce((s, l) => s + l.principal, 0);
const totalLoansDisbursed = totalSelfPrincipal + totalOuterPrincipal;

const selfPool7Pct = Math.round(totalSelfPrincipal * 0.07);
const outerPool7Pct = Math.round(totalOuterPrincipal * 0.07);
const totalCommonPool = selfPool7Pct + outerPool7Pct;
const perMemberDividend = Math.round(totalCommonPool / 15);

console.log(`Total Self Loans: ₹${totalSelfPrincipal.toLocaleString()} -> 7% Pool Return: ₹${selfPool7Pct.toLocaleString()}`);
console.log(`Total Outer Loans: ₹${totalOuterPrincipal.toLocaleString()} -> 7% Pool Return: ₹${outerPool7Pct.toLocaleString()}`);
console.log(`Total Common Pool (7% + 7%): ₹${totalCommonPool.toLocaleString()}`);
console.log(`Per Member Dividend (1/15th of pool): ₹${perMemberDividend.toLocaleString()}`);

let totalGuarantorCommissionAll = 0;
let totalPayoutAll = 0;

INITIAL_MEMBERS.forEach(m => {
  const guaranteedOuter = activeOuterLoans
    .filter(l => l.guarantor === m.name)
    .reduce((s, l) => s + l.principal, 0);
  const comm = Math.round(guaranteedOuter * 0.06);
  const payout = perMemberDividend + comm;
  totalGuarantorCommissionAll += comm;
  totalPayoutAll += payout;

  console.log(`  ${m.name.padEnd(12)} | Guaranteed Outer: ₹${guaranteedOuter.toLocaleString().padStart(8)} | 6% Comm: ₹${comm.toLocaleString().padStart(6)} | Dividend: ₹${perMemberDividend.toLocaleString()} | Total Payout: ₹${payout.toLocaleString().padStart(7)}`);
});

console.log('-------------------------------------------------------------------------');
console.log(`TOTALS | 6% Commissions: ₹${totalGuarantorCommissionAll.toLocaleString()} | Member Dividends (15x): ₹${(perMemberDividend * 15).toLocaleString()} | Total February Payouts: ₹${totalPayoutAll.toLocaleString()}`);

// 5. TEST 6-MONTH LOAN MATH
console.log('\n--- 5. Testing 6-Month vs 12-Month Tenures ---');
const testP = 100000;
const self12Kisht = calculateKisht(testP, 'self', 12);
const self6Kisht = calculateKisht(testP, 'self', 6);
const outer12Kisht = calculateKisht(testP, 'outer', 12);
const outer6Kisht = calculateKisht(testP, 'outer', 6);

console.log(`₹1,00,000 Self 12m (10%): ₹${self12Kisht}/mo -> Total: ₹${self12Kisht * 12}`);
console.log(`₹1,00,000 Self 6m   (5%): ₹${self6Kisht}/mo -> Total: ₹${self6Kisht * 6}`);
console.log(`₹1,00,000 Outer 12m (16%): ₹${outer12Kisht}/mo -> Total: ₹${outer12Kisht * 12}`);
console.log(`₹1,00,000 Outer 6m  (8%): ₹${outer6Kisht}/mo -> Total: ₹${outer6Kisht * 6}`);

// 6. TEST CUSTOM CHARGED RATE & GUARANTOR MARGIN
console.log('\n--- 6. Testing Custom Charged Rate Margin for Outsiders ---');
const chargedRate20 = 20;
const customKisht20 = calculateKisht(testP, 'outer', 12, chargedRate20);
const margin = customKisht20 - outer12Kisht;
console.log(`₹1,00,000 Outer at 20% charged rate: ₹${customKisht20}/mo`);
console.log(`Committee standard at 16%: ₹${outer12Kisht}/mo`);
console.log(`Guarantor monthly profit margin: ₹${margin}/mo`);

console.log('\n=== SUITE EXECUTION SUMMARY ===');
console.log(`Total Errors Detected: ${issuesFound}`);
