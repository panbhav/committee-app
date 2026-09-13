import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Export full monthly data to Excel matching original format
export function exportToExcel({ members, loans, payments, meetingMonth, getMemberBill, getMemberLimits }) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Monthly Meeting Collection Summary (Image 1 replica)
  const summaryRows = members.map(m => {
    const bill = getMemberBill(m.name);
    const p = payments[m.id] || { status: 'pending', shortAmount: 0, extraAmount: 0, deposit: 0 };
    return {
      "NAME": m.name,
      "OUTER": bill.outerTotal,
      "SELF": bill.selfTotal,
      "MONTHLY": bill.monthlyUnit,
      "TOTAL": bill.totalDue,
      "STATUS": p.status ? p.status.toUpperCase() : 'PENDING',
      "SHORT": p.shortAmount || 0,
      "EXTRA": p.extraAmount || 0,
      "DEPOSIT": p.deposit || 0
    };
  });

  // Calculate Totals row
  const totalOuter = summaryRows.reduce((s, r) => s + r.OUTER, 0);
  const totalSelf = summaryRows.reduce((s, r) => s + r.SELF, 0);
  const totalMonthly = summaryRows.reduce((s, r) => s + r.MONTHLY, 0);
  const totalDue = summaryRows.reduce((s, r) => s + r.TOTAL, 0);
  const totalDeposit = summaryRows.reduce((s, r) => s + r.DEPOSIT, 0);

  summaryRows.push({
    "NAME": "TOTAL",
    "OUTER": totalOuter,
    "SELF": totalSelf,
    "MONTHLY": totalMonthly,
    "TOTAL": totalDue,
    "STATUS": "-",
    "SHORT": 0,
    "EXTRA": 0,
    "DEPOSIT": totalDeposit
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, "LOAN DETAILS");

  // Sheet 2: All Active Loans Register (Self & Outer)
  const loansRows = loans.map(l => ({
    "LOAN NO": l.id,
    "BORROWER NAME": l.borrowerName,
    "GUARANTOR": l.guarantor,
    "TYPE": l.type.toUpperCase(),
    "PRINCIPAL (RS)": l.principal,
    "INTEREST RATE (%)": l.rate,
    "MONTHLY KISHT": l.monthlyKisht,
    "CURRENT MONTH": `${l.currentMonth}/12`,
    "SECURITY FEE": l.securityFee
  }));
  const wsLoans = XLSX.utils.json_to_sheet(loansRows);
  XLSX.utils.book_append_sheet(wb, wsLoans, "ACTIVE LOANS");

  // Sheet 3: Member Limits (Image 3 replica)
  const limitsRows = members.map(m => {
    const lim = getMemberLimits(m.name);
    return {
      "NAME": m.name,
      "MEMBER LIMIT": lim.memberLimit,
      "SELF LOAN USED": lim.selfUsed,
      "SELF REMAIN": lim.selfLeft,
      "OUTER LIMIT": lim.outerLimit,
      "OUTER LOAN USED": lim.outerUsed,
      "OUTER REMAIN": lim.outerLeft
    };
  });
  const wsLimits = XLSX.utils.json_to_sheet(limitsRows);
  XLSX.utils.book_append_sheet(wb, wsLimits, "MEMBER LIMITS");

  // Download Excel
  const filename = `Committee_Bahikhata_${meetingMonth.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// Export clean PDF summary report
export function exportToPDF({ members, loans, payments, meetingMonth, getMemberBill }) {
  const doc = new jsPDF();

  // Header Title
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("COMMITTEE BAHIKHATA & COLLECTION SHEET", 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Meeting: ${meetingMonth}  |  Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 22);

  // Table Data
  const tableData = members.map(m => {
    const bill = getMemberBill(m.name);
    const p = payments[m.id] || { status: 'pending', deposit: 0 };
    return [
      m.name,
      bill.outerTotal.toLocaleString(),
      bill.selfTotal.toLocaleString(),
      bill.monthlyUnit.toLocaleString(),
      bill.totalDue.toLocaleString(),
      p.status === 'paid' ? 'PAID' : (p.status === 'short' ? `SHORT (${p.shortAmount})` : 'PENDING'),
      p.deposit ? p.deposit.toLocaleString() : '-'
    ];
  });

  // Calculate Totals row
  const totalOuter = members.reduce((s, m) => s + getMemberBill(m.name).outerTotal, 0);
  const totalSelf = members.reduce((s, m) => s + getMemberBill(m.name).selfTotal, 0);
  const totalDue = members.reduce((s, m) => s + getMemberBill(m.name).totalDue, 0);
  const totalDeposit = members.reduce((s, m) => {
    const p = payments[m.id];
    return s + (p && p.deposit ? p.deposit : 0);
  }, 0);

  tableData.push([
    'TOTAL',
    totalOuter.toLocaleString(),
    totalSelf.toLocaleString(),
    (members.length * 1000).toLocaleString(),
    totalDue.toLocaleString(),
    '-',
    totalDeposit.toLocaleString()
  ]);

  autoTable(doc, {
    head: [['Name', 'Outer Kishts', 'Self Kisht', 'Unit', 'Total Due', 'Status', 'Deposit']],
    body: tableData,
    startY: 28,
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: 0, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    didParseCell: (data) => {
      // Highlight TOTAL row
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [226, 232, 240];
      }
    }
  });

  const filename = `Committee_Report_${meetingMonth.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
