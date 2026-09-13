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
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });


  const [loans, setLoans] = useState(() => {
    const saved = localStorage.getItem('comm_loans');
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  const [monthlyUnit, setMonthlyUnit] = useState(() => {
    const saved = localStorage.getItem('comm_monthly_unit');
    return saved ? Number(saved) : 1000;
  });

  const [meetingMonth, setMeetingMonth] = useState(() => {
    const saved = localStorage.getItem('comm_meeting_month');
    return saved ? saved : 'September 2026';
  });

  // Payments log for current meeting month
  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem('comm_payments');
    if (saved) return JSON.parse(saved);
    const initial = {};
    INITIAL_MEMBERS.forEach(m => {
      initial[m.id] = { status: 'pending', shortAmount: 0, extraAmount: 0, deposit: 0 };
    });
    return initial;
  });

  // Full Activity / Audit Log: [{ id, timestamp, actor, action, details, previousState, targetMemberId }]
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('comm_audit_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'init-1',
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        actor: 'SYSTEM',
        action: 'MEETING_INITIALIZED',
        details: 'September 2026 meeting initialized with 15 members & preloaded loan data.',
        canRollback: false
      }
    ];
  });

  // Current Active User
  const [currentUser, setCurrentUser] = useState(() => {
    return INITIAL_MEMBERS.find(m => m.name === 'NARENDRA') || INITIAL_MEMBERS[0];
  });

  // Current Selected Outer Borrower
  const [currentOuterLoanId, setCurrentOuterLoanId] = useState(408);

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
    localStorage.setItem('comm_meeting_month', meetingMonth);
  }, [meetingMonth]);

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
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }),
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

    setPayments(prev => ({
      ...prev,
      [memberId]: {
        ...current,
        status: newStatus,
        deposit: newStatus === 'paid' ? bill.totalDue : 0,
        shortAmount: 0
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

    setPayments(prev => ({
      ...prev,
      [memberId]: {
        status: shortAmount > 0 ? 'short' : 'paid',
        deposit: Number(depositAmount),
        shortAmount: Number(shortAmount),
        extraAmount: Number(extraAmount)
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
    const previousPayments = { ...payments };
    const newPayments = {};
    members.forEach(m => {
      const bill = getMemberBill(m.name);
      newPayments[m.id] = {
        status: 'paid',
        deposit: bill.totalDue,
        shortAmount: 0,
        extraAmount: 0
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
      t,
      toggleLanguage,
      members,
      loans,
      monthlyUnit,
      setMonthlyUnit,
      meetingMonth,
      setMeetingMonth,
      payments,
      auditLogs,
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
