import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_MEMBERS, INITIAL_LOANS } from '../data/initialData';
import { translations } from '../data/translations';
import { calculateKisht, calculateSecurityFee } from '../utils/loanCalculator';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Language: 'hi' (Hindi) or 'en' (English)
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('comm_lang') || 'hi'; // Default Hindi for user-friendliness!
  });

  const t = translations[lang] || translations.en;

  const setLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('comm_lang', newLang);
  };

  const toggleLanguage = () => {
    setLang(prev => {
      const next = prev === 'hi' ? 'en' : 'hi';
      localStorage.setItem('comm_lang', next);
      return next;
    });
  };

  // Persistence via localStorage
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('comm_members');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map(m => {
        const initial = INITIAL_MEMBERS.find(im => im.id === m.id);
        return initial ? { ...m, phone: initial.phone } : m;
      });
    }
    return INITIAL_MEMBERS;
  });


  const [loans, setLoans] = useState(() => {
    const saved = localStorage.getItem('comm_loans');
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  const [monthlyUnit, setMonthlyUnit] = useState(() => {
    const saved = localStorage.getItem('comm_monthly_unit');
    return saved ? Number(saved) : 1000;
  });

  // Cash Reserve / Opening Balance in committee bank or safe
  const [availableCashFund, setAvailableCashFund] = useState(() => {
    const saved = localStorage.getItem('comm_cash_fund');
    return saved ? Number(saved) : 150000; // default ₹1.5L reserve
  });

  const [meetingMonth, setMeetingMonth] = useState(() => {
    const saved = localStorage.getItem('comm_meeting_month');
    return saved ? saved : 'September 2026';
  });


  const [meetingDate, setMeetingDate] = useState(() => {
    const saved = localStorage.getItem('comm_meeting_date');
    return saved ? saved : '10 Sep 2026';
  });

  const getFormattedTimestamp = () => {
    const d = new Date();
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
           d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Payments log for current meeting month
  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem('comm_payments');
    if (saved) return JSON.parse(saved);
    const initial = {};
    INITIAL_MEMBERS.forEach(m => {
      initial[m.id] = { status: 'pending', shortAmount: 0, extraAmount: 0, deposit: 0, paidAt: null, paidBy: null };
    });
    return initial;
  });

  // Full Activity / Audit Log: [{ id, timestamp, actor, action, details, previousState, targetMemberId }]
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('comm_audit_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'log-sep-3',
        timestamp: '10 Sep 2026, 07:30 PM',
        actor: 'NARENDRA (Admin)',
        action: 'MEETING_OPENED',
        details: 'September 2026 Monthly General Meeting in session at Narendra residence.',
        canRollback: false
      },
      {
        id: 'log-sep-2',
        timestamp: '10 Sep 2026, 06:45 PM',
        actor: 'HARISH (Admin)',
        action: 'FUND_HEALTH_CHECK',
        details: 'Liquidity check verified: ₹1,50,000 opening reserve + ₹5,84,902 expected collections.',
        canRollback: false
      },
      {
        id: 'log-aug-1',
        timestamp: '10 Aug 2026, 08:30 PM',
        actor: 'NARENDRA (Admin)',
        action: 'MEETING_CONCLUDED',
        details: 'August 2026 meeting completed with 100% attendance and ₹5,84,902 recovery.',
        canRollback: false
      },
      {
        id: 'log-aug-2',
        timestamp: '10 Aug 2026, 07:15 PM',
        actor: 'HARISH (Admin)',
        action: 'LOAN_DISBURSED',
        details: 'Loan #459 disbursed for ₹1,00,000 with 16% flat interest and 12-month tenure.',
        canRollback: false
      }
    ];
  });

  // Member Loan Requests: [{ id, requestedBy, type, borrowerName, borrowerPhone, borrowerAddress, principal, monthlyKisht, securityFee, note, status: 'pending'|'approved'|'rejected', timestamp }]
  const [loanRequests, setLoanRequests] = useState(() => {
    const saved = localStorage.getItem('comm_loan_requests');
    return saved ? JSON.parse(saved) : [];
  });

  // Current Active User
  const [currentUser, setCurrentUser] = useState(() => {
    return INITIAL_MEMBERS.find(m => m.name === 'NARENDRA') || INITIAL_MEMBERS[0];
  });

  // Current Selected Outer Borrower
  const [currentOuterLoanId, setCurrentOuterLoanId] = useState(408);

  useEffect(() => {
    localStorage.setItem('comm_loan_requests', JSON.stringify(loanRequests));
  }, [loanRequests]);

  useEffect(() => {
    localStorage.setItem('comm_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('comm_loans', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('comm_monthly_unit', monthlyUnit.toString());
  }, [monthlyUnit]);

  useEffect(() => {
    localStorage.setItem('comm_cash_fund', availableCashFund.toString());
  }, [availableCashFund]);

  useEffect(() => {
    localStorage.setItem('comm_meeting_month', meetingMonth);
  }, [meetingMonth]);

  useEffect(() => {
    localStorage.setItem('comm_meeting_date', meetingDate);
  }, [meetingDate]);

  useEffect(() => {
    localStorage.setItem('comm_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('comm_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Helper to add an audit log entry
  const addLog = (action, details, canRollback = false, rollbackData = null) => {
    const newEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: getFormattedTimestamp(),
      actor: currentUser ? currentUser.name : 'ADMIN',
      action,
      details,
      canRollback,
      rollbackData
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  // Compute bill per member for the current month
  const getMemberBill = (memberName) => {
    const selfLoans = loans.filter(l => l.type === 'self' && l.borrowerName === memberName);
    const outerLoans = loans.filter(l => l.type === 'outer' && l.guarantor === memberName);

    const selfTotal = selfLoans.reduce((sum, l) => sum + l.monthlyKisht, 0);
    const outerTotal = outerLoans.reduce((sum, l) => sum + l.monthlyKisht, 0);
    const totalDue = selfTotal + outerTotal + monthlyUnit;

    return {
      selfLoans,
      outerLoans,
      selfTotal,
      outerTotal,
      monthlyUnit,
      totalDue
    };
  };

  // Compute overall meeting stats
  const getMeetingStats = () => {
    let totalExpected = 0;
    let totalCollected = 0;
    let paidCount = 0;
    let pendingCount = 0;

    members.forEach(m => {
      const bill = getMemberBill(m.name);
      totalExpected += bill.totalDue;

      const p = payments[m.id];
      if (p && p.status === 'paid') {
        paidCount++;
        totalCollected += (p.deposit > 0 ? p.deposit : bill.totalDue);
      } else {
        pendingCount++;
        if (p && p.deposit > 0) {
          totalCollected += p.deposit;
        }
      }
    });

    return {
      totalExpected,
      totalCollected,
      paidCount,
      pendingCount
    };
  };

  // Compute limit usage for a member
  const getMemberLimits = (memberName) => {
    const member = members.find(m => m.name === memberName);
    if (!member) return { memberLimit: 200000, selfUsed: 0, selfLeft: 200000, outerLimit: 800000, outerUsed: 0, outerLeft: 800000 };

    const selfLoans = loans.filter(l => l.type === 'self' && l.borrowerName === memberName);
    const outerLoans = loans.filter(l => l.type === 'outer' && l.guarantor === memberName);

    const selfUsed = selfLoans.reduce((sum, l) => sum + l.principal, 0);
    const outerUsed = outerLoans.reduce((sum, l) => sum + l.principal, 0);

    return {
      memberLimit: member.memberLimit,
      selfUsed,
      selfLeft: Math.max(0, member.memberLimit - selfUsed),
      outerLimit: member.outerLimit,
      outerUsed,
      outerLeft: Math.max(0, member.outerLimit - outerUsed)
    };
  };

  // Mark a member as paid / unpaid with Undo & Audit Trail
  const toggleMemberPaid = (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const current = payments[memberId] || { status: 'pending', shortAmount: 0, extraAmount: 0, deposit: 0 };
    const newStatus = current.status === 'paid' ? 'pending' : 'paid';
    const bill = getMemberBill(member.name);
    const timestampNow = getFormattedTimestamp();
    const actorName = currentUser ? currentUser.name : 'ADMIN';

    setPayments(prev => ({
      ...prev,
      [memberId]: {
        ...current,
        status: newStatus,
        deposit: newStatus === 'paid' ? bill.totalDue : 0,
        shortAmount: 0,
        paidAt: newStatus === 'paid' ? timestampNow : null,
        paidBy: newStatus === 'paid' ? actorName : null
      }
    }));

    if (newStatus === 'paid') {
      addLog(
        'MARKED_PAID',
        `Marked ${member.name} as fully PAID (₹${bill.totalDue.toLocaleString()}).`,
        true,
        { type: 'payment', memberId, previousState: current }
      );
    } else {
      addLog(
        'REVERTED_PAID',
        `Reverted ${member.name} back to PENDING.`,
        true,
        { type: 'payment', memberId, previousState: current }
      );
    }
  };

  // Record custom payment (partial / short) with Audit Trail
  const recordPartialPayment = (memberId, depositAmount, shortAmount, extraAmount) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const current = payments[memberId] || { status: 'pending', shortAmount: 0, extraAmount: 0, deposit: 0 };
    const timestampNow = getFormattedTimestamp();
    const actorName = currentUser ? currentUser.name : 'ADMIN';

    setPayments(prev => ({
      ...prev,
      [memberId]: {
        status: shortAmount > 0 ? 'short' : 'paid',
        deposit: Number(depositAmount),
        shortAmount: Number(shortAmount),
        extraAmount: Number(extraAmount),
        paidAt: timestampNow,
        paidBy: actorName
      }
    }));

    addLog(
      'RECORDED_PARTIAL',
      `Updated ${member.name}: Deposit ₹${depositAmount.toLocaleString()}${shortAmount > 0 ? `, Short ₹${shortAmount.toLocaleString()}` : ''}${extraAmount > 0 ? `, Extra ₹${extraAmount.toLocaleString()}` : ''}.`,
      true,
      { type: 'payment', memberId, previousState: current }
    );
  };

  // One-tap mark all paid with Audit Trail
  const markAllPaid = () => {
    const timestampNow = getFormattedTimestamp();
    const actorName = currentUser ? currentUser.name : 'ADMIN';
    const previousPayments = { ...payments };
    const newPayments = {};
    members.forEach(m => {
      const bill = getMemberBill(m.name);
      newPayments[m.id] = {
        status: 'paid',
        deposit: bill.totalDue,
        shortAmount: 0,
        extraAmount: 0,
        paidAt: timestampNow,
        paidBy: actorName
      };
    });
    setPayments(newPayments);

    addLog(
      'MARKED_ALL_PAID',
      'One-tap: Marked all 15 members as fully paid for the meeting.',
      true,
      { type: 'all_payments', previousPayments }
    );
  };

  // Rollback a past action from log
  const rollbackAction = (logEntry) => {
    if (!logEntry.rollbackData) return;

    if (logEntry.rollbackData.type === 'payment') {
      const { memberId, previousState } = logEntry.rollbackData;
      setPayments(prev => ({
        ...prev,
        [memberId]: previousState
      }));
      addLog('ROLLBACK', `Undid action: ${logEntry.action} (${logEntry.details})`, false);
    } else if (logEntry.rollbackData.type === 'all_payments') {
      setPayments(logEntry.rollbackData.previousPayments);
      addLog('ROLLBACK', `Undid: One-tap mark all paid. Restored previous states.`, false);
    } else if (logEntry.rollbackData.type === 'new_loan') {
      const { loanId } = logEntry.rollbackData;
      setLoans(prev => prev.filter(l => l.id !== loanId));
      addLog('ROLLBACK', `Cancelled loan #${loanId} and restored limits.`, false);
    }
  };

  // Submit a loan request by any member
  const submitLoanRequest = ({ type, borrowerName, borrowerPhone, borrowerAddress, principal, note }) => {
    const kisht = calculateKisht(principal, type);
    const security = calculateSecurityFee(principal, type);
    const newRequest = {
      id: 'req-' + Date.now(),
      requestedBy: currentUser.name,
      type,
      borrowerName,
      borrowerPhone,
      borrowerAddress,
      principal,
      monthlyKisht: kisht,
      securityFee: security,
      note,
      status: 'pending',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })
    };

    setLoanRequests(prev => [newRequest, ...prev]);
    addLog(
      'LOAN_REQUESTED',
      `${currentUser.name} requested new ${type.toUpperCase()} loan for ${borrowerName} (₹${principal.toLocaleString()}).`,
      false
    );
  };

  // Approve loan request by Super Admin
  const approveLoanRequest = (requestId) => {
    const req = loanRequests.find(r => r.id === requestId);
    if (!req) return;

    // Disburse the actual loan
    disburseLoan({
      borrowerName: req.borrowerName,
      borrowerPhone: req.borrowerPhone,
      guarantor: req.requestedBy,
      type: req.type,
      principal: req.principal
    });

    setLoanRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));
    addLog('REQUEST_APPROVED', `Admin approved loan request for ${req.borrowerName} (₹${req.principal.toLocaleString()}).`, false);
  };

  // Reject loan request by Super Admin
  const rejectLoanRequest = (requestId) => {
    const req = loanRequests.find(r => r.id === requestId);
    if (!req) return;

    setLoanRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
    addLog('REQUEST_REJECTED', `Admin rejected loan request for ${req.borrowerName}.`, false);
  };

  // Disburse a brand new loan with Audit Trail
  const disburseLoan = ({ borrowerName, borrowerPhone, guarantor, type, principal }) => {

    const p = Number(principal);
    const kisht = calculateKisht(p, type);
    const security = calculateSecurityFee(p, type);
    const nextId = Math.max(...loans.map(l => l.id), 460) + 1;

    const newLoan = {
      id: nextId,
      borrowerName: borrowerName.toUpperCase(),
      borrowerPhone: borrowerPhone || '9800000000',
      guarantor: type === 'self' ? borrowerName.toUpperCase() : guarantor.toUpperCase(),
      type,
      principal: p,
      rate: type === 'self' ? 10 : 16,
      monthlyKisht: kisht,
      currentMonth: 1,
      totalMonths: 12,
      securityFee: security
    };

    setLoans(prev => [newLoan, ...prev]);

    addLog(
      'LOAN_DISBURSED',
      `Disbursed new ${type.toUpperCase()} loan #${nextId} to ${newLoan.borrowerName} for ₹${p.toLocaleString()} (Guarantor: ${newLoan.guarantor}, Kisht: ₹${kisht.toLocaleString()}/mo).`,
      true,
      { type: 'new_loan', loanId: nextId }
    );

    return newLoan;
  };

  // Reset to initial data
  const resetToFactory = () => {
    localStorage.clear();
    setMembers(INITIAL_MEMBERS);
    setLoans(INITIAL_LOANS);
    setMonthlyUnit(1000);
    setMeetingMonth('September 2026');
    const initial = {};
    INITIAL_MEMBERS.forEach(m => {
      initial[m.id] = { status: 'pending', shortAmount: 0, extraAmount: 0, deposit: 0 };
    });
    setPayments(initial);
    setAuditLogs([
      {
        id: 'init-reset',
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        actor: 'DEVELOPER',
        action: 'FACTORY_RESET',
        details: 'Reset application data back to default September state.',
        canRollback: false
      }
    ]);
  };

  const isSuperAdmin = currentUser && (currentUser.name === 'NARENDRA' || currentUser.name === 'HARISH');

  return (
    <AppContext.Provider value={{
      lang,
      language: lang,
      setLang,
      setLanguage,
      t,
      toggleLanguage,
      members,
      loans,
      monthlyUnit,
      setMonthlyUnit,
      availableCashFund,
      setAvailableCashFund,
      meetingMonth,
      setMeetingMonth,
      meetingDate,
      setMeetingDate,
      getFormattedTimestamp,
      payments,
      auditLogs,
      loanRequests,
      submitLoanRequest,
      approveLoanRequest,
      rejectLoanRequest,
      currentUser,
      setCurrentUser,
      currentOuterLoanId,
      setCurrentOuterLoanId,
      isSuperAdmin,
      getMemberBill,
      getMeetingStats,
      getMemberLimits,
      toggleMemberPaid,
      recordPartialPayment,
      markAllPaid,
      rollbackAction,
      disburseLoan,
      resetToFactory
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
