import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_MEMBERS, INITIAL_LOANS } from '../data/initialData';
import { calculateKisht, calculateSecurityFee } from '../utils/loanCalculator';

const AppContext = createContext();

export function AppProvider({ children }) {
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

  // Payments log for current meeting month: { [memberId]: { status: 'paid' | 'pending', shortAmount: 0, extraAmount: 0, deposit: 0 } }
  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem('comm_payments');
    if (saved) return JSON.parse(saved);
    // Default initial state: all pending except a couple for demonstration
    const initial = {};
    INITIAL_MEMBERS.forEach(m => {
      initial[m.id] = { status: 'pending', shortAmount: 0, extraAmount: 0, deposit: 0 };
    });
    return initial;
  });

  // Current Active User (for role-based switching)
  // Default: Narendra (Admin)
  const [currentUser, setCurrentUser] = useState(() => {
    return INITIAL_MEMBERS.find(m => m.name === 'NARENDRA') || INITIAL_MEMBERS[0];
  });

  // Current Selected Outer Borrower (for Outsider Passbook view)
  const [currentOuterLoanId, setCurrentOuterLoanId] = useState(408); // Sanju Saini default

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

  // Mark a member as paid / unpaid
  const toggleMemberPaid = (memberId) => {
    setPayments(prev => {
      const current = prev[memberId] || { status: 'pending', shortAmount: 0, extraAmount: 0, deposit: 0 };
      const newStatus = current.status === 'paid' ? 'pending' : 'paid';
      const member = members.find(m => m.id === memberId);
      const bill = member ? getMemberBill(member.name) : { totalDue: 0 };

      return {
        ...prev,
        [memberId]: {
          ...current,
          status: newStatus,
          deposit: newStatus === 'paid' ? bill.totalDue : 0,
          shortAmount: 0
        }
      };
    });
  };

  // Record custom payment (partial / short)
  const recordPartialPayment = (memberId, depositAmount, shortAmount, extraAmount) => {
    setPayments(prev => ({
      ...prev,
      [memberId]: {
        status: shortAmount > 0 ? 'short' : 'paid',
        deposit: Number(depositAmount),
        shortAmount: Number(shortAmount),
        extraAmount: Number(extraAmount)
      }
    }));
  };

  // One-tap mark all paid
  const markAllPaid = () => {
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
  };

  // Disburse a brand new loan
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
  };

  const isSuperAdmin = currentUser && (currentUser.name === 'NARENDRA' || currentUser.name === 'HARISH');

  return (
    <AppContext.Provider value={{
      members,
      loans,
      monthlyUnit,
      setMonthlyUnit,
      meetingMonth,
      setMeetingMonth,
      payments,
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
