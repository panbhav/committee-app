export function calculateKisht(principal, type = 'outer') {
  const p = Number(principal) || 0;
  if (type === 'self') {
    // 10% flat interest, 12 months
    const total = p * 1.10;
    return Math.round(total / 12);
  } else {
    // 16% flat interest, 12 months
    const total = p * 1.16;
    return Math.round(total / 12);
  }
}

export function calculateSecurityFee(principal, type = 'outer') {
  if (type === 'self') return 0;
  // 0.5% security fee for outer loans (e.g. ₹500 on 1 Lakh, ₹250 on 50k)
  const p = Number(principal) || 0;
  return Math.round(p * 0.005);
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

/**
 * Calculates start month, end month, and current calendar month for loans
 */
export function getLoanTimeline(currentMonth, totalMonths = 12) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMeetingMonthIdx = 8; // Sep 2026 (0-indexed)
  const currentMeetingYear = 2026;

  const offset = Math.max(0, (currentMonth || 1) - 1);
  let startMonthIdx = currentMeetingMonthIdx - offset;
  let startYear = currentMeetingYear;
  while (startMonthIdx < 0) {
    startMonthIdx += 12;
    startYear -= 1;
  }

  let endMonthIdx = startMonthIdx + totalMonths - 1;
  let endYear = startYear;
  while (endMonthIdx >= 12) {
    endMonthIdx -= 12;
    endYear += 1;
  }

  return {
    startMonth: `${months[startMonthIdx]} ${startYear}`,
    endMonth: `${months[endMonthIdx]} ${endYear}`,
    currentMonthName: `${months[currentMeetingMonthIdx]} ${currentMeetingYear}`,
    nextDueDate: `10 ${months[(currentMeetingMonthIdx + 1) % 12]} ${currentMeetingMonthIdx === 11 ? currentMeetingYear + 1 : currentMeetingYear}`,
    startMonthIdx,
    startYear
  };
}

/**
 * Generates monthly installment calendar with exact dates for borrower passbooks
 */
export function getInstallmentSchedule(currentMonth, totalMonths = 12) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const timeline = getLoanTimeline(currentMonth, totalMonths);
  const schedule = [];

  let mIdx = timeline.startMonthIdx;
  let y = timeline.startYear;

  for (let i = 1; i <= totalMonths; i++) {
    const isPaid = i < currentMonth;
    const isCurrent = i === currentMonth;
    const dateStr = `10 ${months[mIdx]} ${y}`;

    schedule.push({
      kishtNum: i,
      monthName: `${months[mIdx]} ${y}`,
      dueDate: dateStr,
      status: isPaid ? 'paid' : (isCurrent ? 'current' : 'upcoming'),
      statusText: isPaid ? 'Paid' : (isCurrent ? 'Due This Month' : 'Upcoming')
    });

    mIdx++;
    if (mIdx >= 12) {
      mIdx = 0;
      y++;
    }
  }

  return schedule;
}
