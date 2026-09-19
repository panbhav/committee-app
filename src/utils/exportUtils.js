import XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Reusable Theme Colors
const COLORS = {
  emeraldDark: "042F2E",   // 950
  emeraldHeader: "0F766E", // 700
  emeraldLight: "CCFBF1",  // 100
  
  blueDark: "0F172A",      // 900
  blueHeader: "1E40AF",    // 700
  blueLight: "DBEAFE",     // 100

  purpleDark: "3B0764",    // 950
  purpleHeader: "6B21A8",  // 700
  purpleLight: "F3E8FF",   // 100

  amberDark: "451A03",     // 950
  amberHeader: "92400E",   // 800
  amberLight: "FEF3C7",    // 100

  zebraEven: "FFFFFF",
  zebraOdd: "F8FAFC",      // Slate 50
  borderLight: "E2E8F0",   // Slate 200
  borderDark: "64748B",    // Slate 500

  totalBg: "0F172A",       // Slate 900
  totalText: "38BDF8",     // Sky 400
  white: "FFFFFF",

  paidBg: "DCFCE7",        // Green 100
  paidText: "15803D",      // Green 700
  pendingBg: "FEF3C7",     // Amber 100
  pendingText: "B45309",   // Amber 700
  shortBg: "FEE2E2",       // Red 100
  shortText: "B91C1C",     // Red 700
};

// Border styles
const thinBorder = {
  top: { style: "thin", color: { rgb: COLORS.borderLight } },
  bottom: { style: "thin", color: { rgb: COLORS.borderLight } },
  left: { style: "thin", color: { rgb: COLORS.borderLight } },
  right: { style: "thin", color: { rgb: COLORS.borderLight } }
};

const headerBorder = {
  top: { style: "thin", color: { rgb: "FFFFFF" } },
  bottom: { style: "medium", color: { rgb: "0F172A" } },
  left: { style: "thin", color: { rgb: "FFFFFF" } },
  right: { style: "thin", color: { rgb: "FFFFFF" } }
};

const totalBorder = {
  top: { style: "thin", color: { rgb: COLORS.totalText } },
  bottom: { style: "double", color: { rgb: COLORS.totalText } },
  left: { style: "thin", color: { rgb: "334155" } },
  right: { style: "thin", color: { rgb: "334155" } }
};

/**
 * Helper to build a styled worksheet with Title, Subtitle, Headers, Data Rows, and Totals
 */
function createStyledSheet({
  title,
  subtitle,
  headerBg,
  headers,
  dataRows,
  totalsRow,
  colWidths
}) {
  const aoa = [];
  const colCount = headers.length;

  // 1. Title Banner Row (Row 1)
  const titleRow = [];
  for (let c = 0; c < colCount; c++) {
    titleRow.push({
      v: c === 0 ? title : "",
      t: "s",
      s: {
        fill: { fgColor: { rgb: headerBg } },
        font: { name: "Calibri", sz: 14, bold: true, color: { rgb: COLORS.white } },
        alignment: { horizontal: "center", vertical: "center" }
      }
    });
  }
  aoa.push(titleRow);

  // 2. Subtitle Row (Row 2)
  const subtitleRow = [];
  for (let c = 0; c < colCount; c++) {
    subtitleRow.push({
      v: c === 0 ? subtitle : "",
      t: "s",
      s: {
        fill: { fgColor: { rgb: "1E293B" } }, // Slate 800
        font: { name: "Calibri", sz: 10, italic: true, color: { rgb: "CBD5E1" } },
        alignment: { horizontal: "center", vertical: "center" }
      }
    });
  }
  aoa.push(subtitleRow);

  // 3. Blank spacing row (Row 3)
  aoa.push(new Array(colCount).fill({ v: "", t: "s" }));

  // 4. Table Header Row (Row 4)
  const headRow = headers.map(h => ({
    v: h.label,
    t: "s",
    s: {
      fill: { fgColor: { rgb: headerBg } },
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: COLORS.white } },
      alignment: { horizontal: h.align || "center", vertical: "center", wrapText: true },
      border: headerBorder
    }
  }));
  aoa.push(headRow);

  // 5. Data Rows (Row 5+)
  dataRows.forEach((row, idx) => {
    const isOdd = idx % 2 === 1;
    const rowBg = isOdd ? COLORS.zebraOdd : COLORS.zebraEven;

    const rowCells = headers.map((h, cIdx) => {
      const rawVal = row[h.key];
      const cell = {
        v: rawVal !== undefined && rawVal !== null ? rawVal : "",
        t: typeof rawVal === "number" ? "n" : "s",
        s: {
          fill: { fgColor: { rgb: rowBg } },
          font: { name: "Calibri", sz: 10, color: { rgb: "0F172A" } },
          alignment: { horizontal: h.align || "left", vertical: "center" },
          border: thinBorder
        }
      };

      // Currency Formatting
      if (h.type === "currency" && typeof rawVal === "number") {
        cell.z = "₹#,##0";
        cell.s.alignment.horizontal = "right";
      }

      // Percentage Formatting
      if (h.type === "percent" && typeof rawVal === "number") {
        cell.z = "0.0%";
        cell.s.alignment.horizontal = "right";
      }

      // Special highlight for Name column
      if (h.key === "name" || h.key === "borrowerName") {
        cell.s.font.bold = true;
      }

      // Status Badges
      if (h.key === "status") {
        const valStr = String(rawVal).toUpperCase();
        if (valStr === "PAID") {
          cell.s.fill = { fgColor: { rgb: COLORS.paidBg } };
          cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.paidText } };
          cell.s.alignment.horizontal = "center";
        } else if (valStr === "PENDING") {
          cell.s.fill = { fgColor: { rgb: COLORS.pendingBg } };
          cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.pendingText } };
          cell.s.alignment.horizontal = "center";
        } else if (valStr === "SHORT") {
          cell.s.fill = { fgColor: { rgb: COLORS.shortBg } };
          cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.shortText } };
          cell.s.alignment.horizontal = "center";
        }
      }

      // Loan Type Badges
      if (h.key === "type") {
        const valStr = String(rawVal).toUpperCase();
        if (valStr.includes("OUTER")) {
          cell.s.fill = { fgColor: { rgb: COLORS.amberLight } };
          cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.amberHeader } };
        } else if (valStr.includes("SELF")) {
          cell.s.fill = { fgColor: { rgb: COLORS.emeraldLight } };
          cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.emeraldHeader } };
        }
        cell.s.alignment.horizontal = "center";
      }

      // Short amount highlighted in Red
      if (h.key === "short" && rawVal > 0) {
        cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.shortText } };
      }

      // Extra amount highlighted in Green
      if (h.key === "extra" && rawVal > 0) {
        cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: COLORS.paidText } };
      }

      return cell;
    });

    aoa.push(rowCells);
  });

  // 6. Totals Row
  if (totalsRow) {
    const totalCells = headers.map(h => {
      const val = totalsRow[h.key];
      const isNum = typeof val === "number";
      const cell = {
        v: val !== undefined ? val : "",
        t: isNum ? "n" : "s",
        s: {
          fill: { fgColor: { rgb: COLORS.totalBg } },
          font: { name: "Calibri", sz: 11, bold: true, color: { rgb: COLORS.totalText } },
          alignment: { horizontal: h.align || "center", vertical: "center" },
          border: totalBorder
        }
      };

      if (h.type === "currency" && isNum) {
        cell.z = "₹#,##0";
        cell.s.alignment.horizontal = "right";
      }
      return cell;
    });
    aoa.push(totalCells);
  }

  // Create sheet
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Apply Column Widths
  ws["!cols"] = colWidths.map(w => ({ wch: w }));

  // Apply Row Heights
  const rowHeights = [
    { hpt: 32 }, // Title
    { hpt: 20 }, // Subtitle
    { hpt: 8 },  // Spacing
    { hpt: 26 }, // Header
  ];
  for (let i = 0; i < dataRows.length; i++) {
    rowHeights.push({ hpt: 21 });
  }
  if (totalsRow) {
    rowHeights.push({ hpt: 25 }); // Totals row
  }
  ws["!rows"] = rowHeights;

  // Merges for Title & Subtitle Banner
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } }  // Subtitle
  ];

  return ws;
}

/**
 * Export full monthly data to high-presentation styled Excel Workbook
 */
export function exportToExcel({ members, loans, payments, meetingMonth, getMemberBill, getMemberLimits }) {
  const wb = XLSX.utils.book_new();
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // ==========================================
  // SHEET 1: MEETING COLLECTION (Image 1 replica)
  // ==========================================
  const summaryHeaders = [
    { key: "sno", label: "S.NO.", align: "center" },
    { key: "name", label: "MEMBER NAME", align: "left" },
    { key: "outer", label: "OUTER KISHTS (₹)", type: "currency", align: "right" },
    { key: "self", label: "SELF KISHT (₹)", type: "currency", align: "right" },
    { key: "monthly", label: "MONTHLY UNIT (₹)", type: "currency", align: "right" },
    { key: "total", label: "TOTAL DUE (₹)", type: "currency", align: "right" },
    { key: "status", label: "STATUS", align: "center" },
    { key: "short", label: "SHORT (₹)", type: "currency", align: "right" },
    { key: "extra", label: "EXTRA (₹)", type: "currency", align: "right" },
    { key: "deposit", label: "DEPOSIT (₹)", type: "currency", align: "right" },
  ];

  const summaryData = members.map((m, idx) => {
    const bill = getMemberBill(m.name);
    const p = payments[m.id] || { status: 'pending', shortAmount: 0, extraAmount: 0, deposit: 0 };
    return {
      sno: idx + 1,
      name: m.name,
      outer: bill.outerTotal,
      self: bill.selfTotal,
      monthly: bill.monthlyUnit,
      total: bill.totalDue,
      status: p.status ? p.status.toUpperCase() : 'PENDING',
      short: p.shortAmount || 0,
      extra: p.extraAmount || 0,
      deposit: p.deposit || 0
    };
  });

  const totalOuter = summaryData.reduce((s, r) => s + r.outer, 0);
  const totalSelf = summaryData.reduce((s, r) => s + r.self, 0);
  const totalMonthly = summaryData.reduce((s, r) => s + r.monthly, 0);
  const totalDue = summaryData.reduce((s, r) => s + r.total, 0);
  const totalShort = summaryData.reduce((s, r) => s + r.short, 0);
  const totalExtra = summaryData.reduce((s, r) => s + r.extra, 0);
  const totalDeposit = summaryData.reduce((s, r) => s + r.deposit, 0);

  const summaryTotals = {
    sno: "TOTAL",
    name: "15 MEMBERS",
    outer: totalOuter,
    self: totalSelf,
    monthly: totalMonthly,
    total: totalDue,
    status: `${summaryData.filter(r => r.status === 'PAID').length} PAID`,
    short: totalShort,
    extra: totalExtra,
    deposit: totalDeposit
  };

  const wsSummary = createStyledSheet({
    title: "COMMITTEE MONTHLY BAHIKHATA & COLLECTION REGISTER",
    subtitle: `Meeting Month: ${meetingMonth}  •  Total Expected: ₹${totalDue.toLocaleString()}  •  Generated: ${currentDate}`,
    headerBg: COLORS.emeraldHeader,
    headers: summaryHeaders,
    dataRows: summaryData,
    totalsRow: summaryTotals,
    colWidths: [8, 20, 18, 16, 18, 18, 14, 14, 14, 18]
  });
  XLSX.utils.book_append_sheet(wb, wsSummary, "LOAN DETAILS");

  // ==========================================
  // SHEET 2: ACTIVE LOANS REGISTER (Image 2 replica)
  // ==========================================
  const loansHeaders = [
    { key: "id", label: "LOAN NO.", align: "center" },
    { key: "borrowerName", label: "BORROWER NAME", align: "left" },
    { key: "guarantor", label: "GUARANTOR", align: "left" },
    { key: "type", label: "LOAN TRACK", align: "center" },
    { key: "principal", label: "PRINCIPAL (₹)", type: "currency", align: "right" },
    { key: "rate", label: "INTEREST RATE", align: "center" },
    { key: "monthlyKisht", label: "MONTHLY KISHT (₹)", type: "currency", align: "right" },
    { key: "month", label: "MONTH (MONT)", align: "center" },
    { key: "remainingKishts", label: "REMAINING KISHTS", align: "center" },
    { key: "balanceDue", label: "REMAINING BALANCE (₹)", type: "currency", align: "right" },
    { key: "paidSoFar", label: "PAID SO FAR (₹)", type: "currency", align: "right" },
    { key: "securityFee", label: "0.5% SECURITY FEE (₹)", type: "currency", align: "right" }
  ];

  const loansData = loans.map(l => {
    const totalM = l.totalMonths || 12;
    const paidSoFar = l.monthlyKisht * l.currentMonth;
    const remKishts = Math.max(0, totalM - l.currentMonth);
    const balanceDue = l.monthlyKisht * remKishts;
    return {
      id: `#${l.id}`,
      borrowerName: l.borrowerName,
      guarantor: l.guarantor,
      type: l.type === 'outer' ? `OUTER (${l.rate || (totalM === 6 ? 8 : 16)}%)` : `SELF (${l.rate || (totalM === 6 ? 5 : 10)}%)`,
      principal: l.principal,
      rate: `${l.rate || (l.type === 'outer' ? (totalM === 6 ? 8 : 16) : (totalM === 6 ? 5 : 10))}% Flat`,
      monthlyKisht: l.monthlyKisht,
      month: `${l.currentMonth} / ${totalM}`,
      remainingKishts: remKishts === 0 ? 'COMPLETED' : `${remKishts} Mos Left`,
      balanceDue,
      paidSoFar,
      securityFee: l.securityFee || 0
    };
  });

  const totalPrincipal = loansData.reduce((s, r) => s + r.principal, 0);
  const totalMonthlyKisht = loansData.reduce((s, r) => s + r.monthlyKisht, 0);
  const totalPaidLoans = loansData.reduce((s, r) => s + r.paidSoFar, 0);
  const totalBalanceDue = loansData.reduce((s, r) => s + r.balanceDue, 0);
  const totalSecurityFees = loansData.reduce((s, r) => s + r.securityFee, 0);

  const loansTotals = {
    id: "TOTAL",
    borrowerName: `${loans.length} ACTIVE LOANS`,
    guarantor: "-",
    type: "-",
    principal: totalPrincipal,
    rate: "-",
    monthlyKisht: totalMonthlyKisht,
    month: "-",
    remainingKishts: "-",
    balanceDue: totalBalanceDue,
    paidSoFar: totalPaidLoans,
    securityFee: totalSecurityFees
  };

  const wsLoans = createStyledSheet({
    title: "ACTIVE LOANS & REMAINING KISHTS REGISTER (SELF & OUTER)",
    subtitle: `Total Active Disbursals: ${loans.length} Loans  •  Meeting Month: ${meetingMonth}  •  Generated: ${currentDate}`,
    headerBg: COLORS.blueHeader,
    headers: loansHeaders,
    dataRows: loansData,
    totalsRow: loansTotals,
    colWidths: [12, 22, 18, 16, 18, 16, 19, 15, 18, 20, 18, 20]
  });
  XLSX.utils.book_append_sheet(wb, wsLoans, "ACTIVE LOANS");

  // ==========================================
  // SHEET 3: MEMBER RISK LIMITS (Image 3 replica)
  // ==========================================
  const limitsHeaders = [
    { key: "sno", label: "S.NO.", align: "center" },
    { key: "name", label: "MEMBER NAME", align: "left" },
    { key: "memberLimit", label: "PERSONAL LIMIT (₹)", type: "currency", align: "right" },
    { key: "selfUsed", label: "SELF USED (₹)", type: "currency", align: "right" },
    { key: "selfLeft", label: "SELF REMAINING (₹)", type: "currency", align: "right" },
    { key: "outerLimit", label: "OUTER LIMIT (₹)", type: "currency", align: "right" },
    { key: "outerUsed", label: "OUTER USED (₹)", type: "currency", align: "right" },
    { key: "outerLeft", label: "OUTER REMAINING (₹)", type: "currency", align: "right" },
    { key: "totalExposure", label: "TOTAL EXPOSURE (₹)", type: "currency", align: "right" },
  ];

  const limitsData = members.map((m, idx) => {
    const lim = getMemberLimits(m.name);
    return {
      sno: idx + 1,
      name: m.name,
      memberLimit: lim.memberLimit,
      selfUsed: lim.selfUsed,
      selfLeft: lim.selfLeft,
      outerLimit: lim.outerLimit,
      outerUsed: lim.outerUsed,
      outerLeft: lim.outerLeft,
      totalExposure: lim.selfUsed + lim.outerUsed
    };
  });

  const totalSelfUsed = limitsData.reduce((s, r) => s + r.selfUsed, 0);
  const totalSelfLeft = limitsData.reduce((s, r) => s + r.selfLeft, 0);
  const totalOuterUsed = limitsData.reduce((s, r) => s + r.outerUsed, 0);
  const totalOuterLeft = limitsData.reduce((s, r) => s + r.outerLeft, 0);
  const totalExposureSum = limitsData.reduce((s, r) => s + r.totalExposure, 0);

  const limitsTotals = {
    sno: "TOTAL",
    name: "15 MEMBERS",
    memberLimit: 15 * 200000,
    selfUsed: totalSelfUsed,
    selfLeft: totalSelfLeft,
    outerLimit: 15 * 800000,
    outerUsed: totalOuterUsed,
    outerLeft: totalOuterLeft,
    totalExposure: totalExposureSum
  };

  const wsLimits = createStyledSheet({
    title: "15 MEMBER RISK & GUARANTEE LIMIT AUDIT",
    subtitle: `Personal Max: ₹2,00,000  •  Outer Guarantee Max: ₹8,00,000  •  Generated: ${currentDate}`,
    headerBg: COLORS.purpleHeader,
    headers: limitsHeaders,
    dataRows: limitsData,
    totalsRow: limitsTotals,
    colWidths: [8, 20, 19, 18, 19, 18, 18, 19, 20]
  });
  XLSX.utils.book_append_sheet(wb, wsLimits, "MEMBER LIMITS");

  // ==========================================
  // SHEET 4: ANNUAL FEBRUARY SETTLEMENT
  // ==========================================
  let annualConfig = null;
  try {
    const saved = localStorage.getItem('comm_annual_meeting_config');
    if (saved) annualConfig = JSON.parse(saved);
  } catch (e) {}

  const useCustomAnnual = Boolean(annualConfig?.useCustomTotals);
  const autoOuter = loans.filter(l => l.type === 'outer').reduce((s, l) => s + l.principal, 0);
  const autoSelf = loans.filter(l => l.type === 'self').reduce((s, l) => s + l.principal, 0);

  const totalOuterPrincipal = (useCustomAnnual && annualConfig?.customOuterTotal != null)
    ? Number(annualConfig.customOuterTotal)
    : autoOuter;
  const totalSelfPrincipal = (useCustomAnnual && annualConfig?.customSelfTotal != null)
    ? Number(annualConfig.customSelfTotal)
    : autoSelf;

  const pool7PercentDividend = Math.round((totalOuterPrincipal * 0.07) + (totalSelfPrincipal * 0.07));
  const perMemberPoolDividend = Math.round(pool7PercentDividend / 15);

  const annualHeaders = [
    { key: "sno", label: "S.NO.", align: "center" },
    { key: "name", label: "MEMBER NAME", align: "left" },
    { key: "poolDividend", label: "7% POOL DIVIDEND (₹)", type: "currency", align: "right" },
    { key: "outerGuaranteed", label: "OUTER GUARANTEED (₹)", type: "currency", align: "right" },
    { key: "guarantorCommission", label: "6% GUARANTOR INCENTIVE (₹)", type: "currency", align: "right" },
    { key: "totalPayout", label: "NET FEBRUARY PAYOUT (₹)", type: "currency", align: "right" }
  ];

  const annualData = members.map((m, idx) => {
    const autoGuaranteed = loans.filter(l => l.type === 'outer' && l.guarantor === m.name).reduce((sum, l) => sum + l.principal, 0);
    const guaranteedAmount = (useCustomAnnual && annualConfig?.customMemberGuarantees?.[m.name] != null)
      ? Number(annualConfig.customMemberGuarantees[m.name])
      : autoGuaranteed;
    const commission = Math.round(guaranteedAmount * 0.06);
    const payout = perMemberPoolDividend + commission;

    return {
      sno: idx + 1,
      name: m.name,
      poolDividend: perMemberPoolDividend,
      outerGuaranteed: guaranteedAmount,
      guarantorCommission: commission,
      totalPayout: payout
    };
  });

  const totalGuaranteedAll = annualData.reduce((s, r) => s + r.outerGuaranteed, 0);
  const totalCommissionAll = annualData.reduce((s, r) => s + r.guarantorCommission, 0);
  const totalPayoutAll = annualData.reduce((s, r) => s + r.totalPayout, 0);

  const annualTotals = {
    sno: "TOTAL",
    name: "ANNUAL POOL",
    poolDividend: perMemberPoolDividend * 15,
    outerGuaranteed: totalGuaranteedAll,
    guarantorCommission: totalCommissionAll,
    totalPayout: totalPayoutAll
  };

  const wsAnnual = createStyledSheet({
    title: "ANNUAL FEBRUARY GENERAL MEETING - PROFIT & COMMISSION DISTRIBUTION",
    subtitle: `7% Pool Dividend (₹${perMemberPoolDividend.toLocaleString()} each) + 6% Guarantor Commission  •  Generated: ${currentDate}`,
    headerBg: COLORS.amberHeader,
    headers: annualHeaders,
    dataRows: annualData,
    totalsRow: annualTotals,
    colWidths: [8, 22, 24, 24, 26, 26]
  });
  XLSX.utils.book_append_sheet(wb, wsAnnual, "ANNUAL FEB SETTLEMENT");

  // Trigger Download
  const filename = `Committee_Bahikhata_${meetingMonth.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Export clean, branded PDF summary report
 */
export function exportToPDF({ members, loans, payments, meetingMonth, getMemberBill }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Universal currency formatting (prevents Helvetica font glyph corruption in PDF)
  const fmtCurrency = (n) => `Rs. ${(n || 0).toLocaleString('en-IN')}`;

  // Top Header Banner
  doc.setFillColor(15, 118, 110); // Teal 700
  doc.rect(0, 0, 210, 24, 'F');

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("BANKING SOCIETY - MONTHLY BAHIKHATA & COLLECTION", 10, 11);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(204, 251, 241);
  doc.text(`Meeting: ${meetingMonth}   |   15 Members   |   Generated: ${currentDate}`, 10, 18);

  // Summary Metrics Banner Row (y = 27 to 37)
  const totalOuter = members.reduce((s, m) => s + getMemberBill(m.name).outerTotal, 0);
  const totalSelf = members.reduce((s, m) => s + getMemberBill(m.name).selfTotal, 0);
  const totalMonthly = members.reduce((s, m) => s + getMemberBill(m.name).monthlyUnit, 0);
  const totalDue = members.reduce((s, m) => s + getMemberBill(m.name).totalDue, 0);
  const totalDeposit = members.reduce((s, m) => {
    const p = payments[m.id];
    return s + (p && p.deposit ? p.deposit : 0);
  }, 0);

  // 4 Micro Summary Cards
  const cardY = 27;
  const cardW = 46;
  const cardH = 11;

  const drawCard = (x, title, value, valColor) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, cardY, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(title, x + 3, cardY + 4);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(valColor[0], valColor[1], valColor[2]);
    doc.text(value, x + 3, cardY + 8.5);
  };

  drawCard(10, "TOTAL EXPECTED DUE", fmtCurrency(totalDue), [15, 118, 110]);
  drawCard(58, "OUTER KISHTS", fmtCurrency(totalOuter), [180, 83, 9]);
  drawCard(106, "SELF KISHT", fmtCurrency(totalSelf), [22, 101, 52]);
  drawCard(154, "MONTHLY UNITS", fmtCurrency(totalMonthly), [30, 41, 59]);

  // Table Data
  const tableData = members.map((m, idx) => {
    const bill = getMemberBill(m.name);
    const p = payments[m.id] || { status: 'pending', deposit: 0, shortAmount: 0 };
    return [
      idx + 1,
      m.name,
      fmtCurrency(bill.outerTotal),
      fmtCurrency(bill.selfTotal),
      fmtCurrency(bill.monthlyUnit),
      fmtCurrency(bill.totalDue),
      p.status === 'paid' ? 'PAID' : (p.status === 'short' ? `SHORT (${p.shortAmount})` : 'PENDING'),
      fmtCurrency(p.deposit || 0)
    ];
  });

  tableData.push([
    '',
    'TOTAL',
    fmtCurrency(totalOuter),
    fmtCurrency(totalSelf),
    fmtCurrency(totalMonthly),
    fmtCurrency(totalDue),
    '-',
    fmtCurrency(totalDeposit)
  ]);

  autoTable(doc, {
    head: [['#', 'Member Name', 'Outer Kishts', 'Self Kisht', 'Monthly Unit', 'Total Due', 'Status', 'Deposit']],
    body: tableData,
    startY: 42,
    margin: { left: 10, right: 10 },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8,
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      valign: 'middle',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 32 },
      2: { halign: 'right', cellWidth: 26 },
      3: { halign: 'right', cellWidth: 24 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 27 },
      6: { halign: 'center', cellWidth: 25 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 28 }
    },
    didParseCell: (data) => {
      // Prevent header styles from leaking to column colors
      if (data.section === 'head') {
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }

      // Body styling
      if (data.section === 'body') {
        // Highlight TOTAL row
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [15, 23, 42]; // Slate 900
          data.cell.styles.textColor = [56, 189, 248]; // Sky 400
          data.cell.styles.fontSize = 8;
        } else if (data.column.index === 6) {
          // Status badges
          const text = String(data.cell.raw);
          if (text === 'PAID') {
            data.cell.styles.textColor = [22, 101, 52]; // Dark Green
            data.cell.styles.fontStyle = 'bold';
          } else if (text.includes('SHORT')) {
            data.cell.styles.textColor = [185, 28, 28]; // Red
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [194, 65, 12]; // Amber
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    }
  });

  // Footer note for Page 1
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Official Banking Society Bahikhata Report  •  Page 1: Monthly Collections  •  100% Peer Verified", 10, pageHeight - 6);

  // ==========================================
  // PAGE 2: ACTIVE LOANS & REMAINING KISHTS
  // ==========================================
  if (loans && loans.length > 0) {
    doc.addPage();
    // Header banner
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, 210, 18, 'F');
    doc.setFillColor(15, 118, 110);
    doc.rect(0, 18, 210, 1.5, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("BANKING SOCIETY - ACTIVE LOANS & REMAINING KISHTS", 10, 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Meeting Month: ${meetingMonth}  •  Total Loans: ${loans.length}  •  Generated: ${currentDate}`, 10, 14);

    const loansPdfData = loans.map((l, idx) => {
      const totalM = l.totalMonths || 12;
      const rem = Math.max(0, totalM - l.currentMonth);
      const remAmt = rem * (l.outsiderMonthlyKisht || l.monthlyKisht);
      return [
        idx + 1,
        `#${l.id}`,
        l.borrowerName,
        l.guarantor,
        l.type.toUpperCase(),
        fmtCurrency(l.principal),
        fmtCurrency(l.monthlyKisht),
        `${l.currentMonth}/${totalM}`,
        rem > 0 ? `${rem} left` : 'Completed',
        fmtCurrency(remAmt)
      ];
    });

    const totalLoansPrincipal = loans.reduce((s, l) => s + l.principal, 0);
    const totalLoansKisht = loans.reduce((s, l) => s + l.monthlyKisht, 0);
    const totalLoansRemBalance = loans.reduce((s, l) => s + (Math.max(0, (l.totalMonths || 12) - l.currentMonth) * (l.outsiderMonthlyKisht || l.monthlyKisht)), 0);

    loansPdfData.push([
      '',
      '',
      'TOTAL',
      `${loans.length} LOANS`,
      '-',
      fmtCurrency(totalLoansPrincipal),
      fmtCurrency(totalLoansKisht),
      '-',
      '-',
      fmtCurrency(totalLoansRemBalance)
    ]);

    autoTable(doc, {
      head: [['#', 'Loan ID', 'Borrower', 'Guarantor', 'Type', 'Principal', 'Monthly Kisht', 'Month', 'Remaining', 'Balance Left']],
      body: loansPdfData,
      startY: 23,
      margin: { left: 10, right: 10 },
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 7.5,
        cellPadding: 1.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      styles: {
        fontSize: 6.8,
        cellPadding: 1.5,
        valign: 'middle',
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 7 },
        1: { halign: 'center', cellWidth: 14 },
        2: { fontStyle: 'bold', cellWidth: 30 },
        3: { cellWidth: 26 },
        4: { halign: 'center', cellWidth: 14 },
        5: { halign: 'right', cellWidth: 22 },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
        7: { halign: 'center', cellWidth: 15 },
        8: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
        9: { halign: 'right', fontStyle: 'bold', cellWidth: 22 }
      },
      didParseCell: (data) => {
        if (data.section === 'head') {
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.section === 'body') {
          if (data.row.index === loansPdfData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [15, 23, 42];
            data.cell.styles.textColor = [56, 189, 248];
          } else if (data.column.index === 8) {
            const txt = String(data.cell.raw);
            if (txt === 'Completed') {
              data.cell.styles.textColor = [22, 101, 52];
            } else {
              data.cell.styles.textColor = [180, 83, 9];
            }
          }
        }
      }
    });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Official Banking Society Bahikhata Report  •  Page 2: Active Loans & Remaining Kishts", 10, pageHeight - 6);
  }

  const filename = `Banking_Society_Bahikhata_${meetingMonth.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
