export function getStandardRate(type = 'outer', totalMonths = 12) {
  const m = Number(totalMonths) || 12;
  if (type === 'self') {
    return m === 6 ? 5 : 10;
  } else {
    return m === 6 ? 8 : 16;
  }
}

export function calculateKisht(principal, type = 'outer', totalMonths = 12, customRate = null) {
  const p = Number(principal) || 0;
  const m = Number(totalMonths) || 12;

  let rate;
  if (customRate !== null && customRate !== undefined && !isNaN(Number(customRate)) && Number(customRate) >= 0) {
    rate = Number(customRate);
  } else {
    rate = getStandardRate(type, m);
  }

  if (!Number.isFinite(p) || p < 0 || !Number.isFinite(m) || m <= 0 || !Number.isFinite(rate)) return 0;
  const total = p * (1 + rate / 100);
  return Math.round(total / m);
}

export function calculateSecurityFee(principal, type = 'outer') {
  if (type === 'self') return 0;
  // 0.5% security fee for outer loans (e.g. ₹500 on 1 Lakh, ₹250 on 50k)
  const p = Number(principal) || 0;
  return Number.isFinite(p) && p > 0 ? Math.round(p * 0.005) : 0;
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
export function getLoanTimeline(currentMonth, totalMonths = 12, meetingMonth = 'September 2026') {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [monthName, yearText] = String(meetingMonth).split(' ');
  const monthIndex = months.findIndex(month => month.toLowerCase() === monthName.slice(0, 3).toLowerCase());
  const valid = monthIndex >= 0 && /^\d{4}$/.test(yearText || '');
  const currentMeetingMonthIdx = valid ? monthIndex : 8;
  const currentMeetingYear = valid ? Number(yearText) : 2026;
  const duration = Number.isFinite(Number(totalMonths)) ? Math.max(1, Math.trunc(Number(totalMonths))) : 12;
  const installment = Number.isFinite(Number(currentMonth)) ? Math.max(1, Math.min(duration, Math.trunc(Number(currentMonth)))) : 1;
  const start = new Date(currentMeetingYear, currentMeetingMonthIdx - installment + 1, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + duration - 1, 1);
  const next = new Date(currentMeetingYear, currentMeetingMonthIdx + 1, 10);
  return {
    startMonth: `${months[start.getMonth()]} ${start.getFullYear()}`,
    endMonth: `${months[end.getMonth()]} ${end.getFullYear()}`,
    currentMonthName: `${months[currentMeetingMonthIdx]} ${currentMeetingYear}`,
    nextDueDate: `10 ${months[next.getMonth()]} ${next.getFullYear()}`,
    startMonthIdx: start.getMonth(),
    startYear: start.getFullYear()
  };
}

/**
 * Generates monthly installment calendar with exact dates for borrower passbooks
 */
export function getInstallmentSchedule(currentMonth, totalMonths = 12, meetingMonth = 'September 2026') {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  totalMonths = Number.isFinite(Number(totalMonths)) ? Math.max(1, Math.trunc(Number(totalMonths))) : 12;
  currentMonth = Number.isFinite(Number(currentMonth)) ? Math.max(1, Math.trunc(Number(currentMonth))) : 1;
  const timeline = getLoanTimeline(currentMonth, totalMonths, meetingMonth);
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
      status: isPaid ? 'earlier' : (isCurrent ? 'current' : 'upcoming'),
      statusText: isPaid ? 'Earlier scheduled' : (isCurrent ? 'Due This Month' : 'Upcoming')
    });

    mIdx++;
    if (mIdx >= 12) {
      mIdx = 0;
      y++;
    }
  }

  return schedule;
}
