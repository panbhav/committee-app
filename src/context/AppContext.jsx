import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_MEMBERS, INITIAL_LOANS, AVAILABLE_MONTHS } from '../data/initialData';
import { translations } from '../data/translations';
import { calculateKisht, calculateSecurityFee, getStandardRate } from '../utils/loanCalculator';
import { db, doc, setDoc, onSnapshot } from '../services/firebase';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [cloudSyncStatus, setCloudSyncStatus] = useState('connecting'); // 'connected' | 'offline' | 'connecting'
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

  // Automatic cache cleanup if schema/data version changed (purges test data)
  const DATA_VERSION = 'v2_clean_sep2026';
  if (typeof window !== 'undefined' && localStorage.getItem('comm_app_data_version') !== DATA_VERSION) {
    localStorage.removeItem('comm_members');
    localStorage.removeItem('comm_loans');
    localStorage.removeItem('comm_payments');
    localStorage.removeItem('comm_loan_requests');
    localStorage.removeItem('comm_audit_logs');
    localStorage.removeItem('comm_monthly_unit');
    localStorage.removeItem('comm_cash_fund');
    localStorage.removeItem('comm_meeting_month');
    localStorage.removeItem('comm_meeting_date');
    localStorage.setItem('comm_app_data_version', DATA_VERSION);
  }

  // Persistence via localStorage
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('comm_members');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map(m => {
        const initial = INITIAL_MEMBERS.find(im => im.id === m.id);
        return initial ? { ...m, phone: initial.phone, role: initial.role } : m;
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

  // Annual February Meeting Loan Totals Configuration
  const [annualMeetingConfig, setAnnualMeetingConfig] = useState(() => {
    const saved = localStorage.getItem('comm_annual_meeting_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      useCustomTotals: false,
      customSelfTotal: null,
      customOuterTotal: null,
      customMemberGuarantees: {}
    };
  });

  const getFormattedTimestamp = () => {
    const d = new Date();
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
           d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const defaultPendingPayments = () => {
    const initial = {};
    INITIAL_MEMBERS.forEach(m => {
      initial[m.id] = { status: 'pending', shortAmount: 0, extraAmount: 0, deposit: 0, paidAt: null, paidBy: null };
    });
    return initial;
  };

  // Payments stored per month so all historical & future months are preserved
  const [paymentsByMonth, setPaymentsByMonth] = useState(() => {
    const saved = localStorage.getItem('comm_payments_by_month');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const legacy = localStorage.getItem('comm_payments');
    const initialSep = legacy ? JSON.parse(legacy) : defaultPendingPayments();
    return {
      'September 2026': initialSep
    };
  });

  // Active Payments log for currently selected meeting month
  const [payments, setPayments] = useState(() => {
    const currentMonth = localStorage.getItem('comm_meeting_month') || 'September 2026';
    const savedByMonth = localStorage.getItem('comm_payments_by_month');
    if (savedByMonth) {
      try {
        const parsed = JSON.parse(savedByMonth);
        if (parsed[currentMonth]) return parsed[currentMonth];
      } catch (e) {}
    }
    const saved = localStorage.getItem('comm_payments');
    if (saved) return JSON.parse(saved);
    return defaultPendingPayments();
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
    localStorage.setItem('comm_payments_by_month', JSON.stringify(paymentsByMonth));
  }, [paymentsByMonth]);

  useEffect(() => {
    localStorage.setItem('comm_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('comm_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('comm_annual_meeting_config', JSON.stringify(annualMeetingConfig));
  }, [annualMeetingConfig]);

  // Push state updates to Firebase Firestore
  const syncToCloud = async (patch) => {
    try {
      const docRef = doc(db, 'committee', 'global_state');
      await setDoc(docRef, patch, { merge: true });
    } catch (err) {
      console.warn('Sync to cloud warning:', err);
    }
  };

  // Real-time Cloud Firestore Listener (Live Multi-Device Sync)
  useEffect(() => {
    const docRef = doc(db, 'committee', 'global_state');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.members && Array.isArray(d.members)) {
          const syncedMembers = d.members.map(m => {
            if (['NARENDRA', 'MAHENDRA', 'NARESH'].includes(m.name)) return { ...m, role: 'admin' };
            if (m.name === 'HARISH') return { ...m, role: 'member' };
            return m;
          });
          setMembers(syncedMembers);
        }
        if (d.loans && Array.isArray(d.loans)) setLoans(d.loans);
        if (d.paymentsByMonth && typeof d.paymentsByMonth === 'object') {
          setPaymentsByMonth(d.paymentsByMonth);
        }
        if (d.meetingMonth) {
          setMeetingMonth(d.meetingMonth);
          if (d.payments && typeof d.payments === 'object') {
            setPayments(d.payments);
          } else if (d.paymentsByMonth && d.paymentsByMonth[d.meetingMonth]) {
            setPayments(d.paymentsByMonth[d.meetingMonth]);
          }
        } else if (d.payments && typeof d.payments === 'object') {
          setPayments(d.payments);
        }
        if (d.auditLogs && Array.isArray(d.auditLogs)) setAuditLogs(d.auditLogs);
        if (d.loanRequests && Array.isArray(d.loanRequests)) setLoanRequests(d.loanRequests);
        if (d.monthlyUnit !== undefined) setMonthlyUnit(d.monthlyUnit);
        if (d.availableCashFund !== undefined) setAvailableCashFund(d.availableCashFund);
        if (d.meetingDate) setMeetingDate(d.meetingDate);
        if (d.annualMeetingConfig && typeof d.annualMeetingConfig === 'object') {
          setAnnualMeetingConfig(d.annualMeetingConfig);
        }
        setCloudSyncStatus('connected');
      } else {
        // First-time seed of initial September committee data into cloud
        const initialSeed = {
          members: INITIAL_MEMBERS,
          loans: INITIAL_LOANS,
          payments,
          paymentsByMonth,
          auditLogs,
          loanRequests,
          monthlyUnit,
          availableCashFund,
          meetingMonth,
          meetingDate
        };
        setDoc(docRef, initialSeed).catch(() => {});
        setCloudSyncStatus('connected');
      }
    }, (err) => {
      console.warn('Firestore real-time listener error:', err);
      setCloudSyncStatus('offline');
    });

    return () => unsubscribe();
  }, []);

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

  // Update payments for currently active meeting month and sync to cloud
  const updateCurrentMonthPayments = (newPayments, logEntry = null) => {
    setPayments(newPayments);
    const updatedByMonth = {
      ...paymentsByMonth,
      [meetingMonth]: newPayments
    };
    setPaymentsByMonth(updatedByMonth);

    let updatedLogs = auditLogs;
    if (logEntry) {
      updatedLogs = [logEntry, ...auditLogs];
      setAuditLogs(updatedLogs);
    }

    syncToCloud({
      payments: newPayments,
      paymentsByMonth: updatedByMonth,
      ...(logEntry ? { auditLogs: updatedLogs } : {})
    });
  };

  // Switch meeting month dynamically (any historical or future month)
  const changeMeetingMonth = (newMonth) => {
    if (!newMonth || newMonth === meetingMonth) return;

    const parts = newMonth.split(' ');
    const monthShort = parts[0].slice(0, 3);
    const year = parts[1] || '2026';
    const newDate = `10 ${monthShort} ${year}`;

    const monthPayments = paymentsByMonth[newMonth] || defaultPendingPayments();

    setMeetingMonth(newMonth);
    setMeetingDate(newDate);
    setPayments(monthPayments);

    const updatedByMonth = {
      ...paymentsByMonth,
      [newMonth]: monthPayments
    };
    setPaymentsByMonth(updatedByMonth);

    const logEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: getFormattedTimestamp(),
      actor: currentUser ? currentUser.name : 'ADMIN',
      action: 'MONTH_CHANGED',
      details: `Switched meeting month to ${newMonth} (${newDate}).`,
      canRollback: false
    };
    const updatedLogs = [logEntry, ...auditLogs];
    setAuditLogs(updatedLogs);

    syncToCloud({
      meetingMonth: newMonth,
      meetingDate: newDate,
      payments: monthPayments,
      paymentsByMonth: updatedByMonth,
      auditLogs: updatedLogs
    });
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

    const updatedPayments = {
      ...payments,
      [memberId]: {
        ...current,
        status: newStatus,
        deposit: newStatus === 'paid' ? bill.totalDue : 0,
        shortAmount: 0,
        paidAt: newStatus === 'paid' ? timestampNow : null,
        paidBy: newStatus === 'paid' ? actorName : null
      }
    };

    const logEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: timestampNow,
      actor: actorName,
      action: newStatus === 'paid' ? 'MARKED_PAID' : 'REVERTED_PAID',
      details: newStatus === 'paid'
        ? `Marked ${member.name} as fully PAID (₹${bill.totalDue.toLocaleString()}) for ${meetingMonth}.`
        : `Reverted ${member.name} back to PENDING for ${meetingMonth}.`,
      canRollback: true,
      rollbackData: { type: 'payment', memberId, previousState: current }
    };

    updateCurrentMonthPayments(updatedPayments, logEntry);
  };

  // Record custom payment (partial / short) with Audit Trail
  const recordPartialPayment = (memberId, depositAmount, shortAmount, extraAmount) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const current = payments[memberId] || { status: 'pending', shortAmount: 0, extraAmount: 0, deposit: 0 };
    const timestampNow = getFormattedTimestamp();
    const actorName = currentUser ? currentUser.name : 'ADMIN';

    const updatedPayments = {
      ...payments,
      [memberId]: {
        status: shortAmount > 0 ? 'short' : 'paid',
        deposit: Number(depositAmount),
        shortAmount: Number(shortAmount),
        extraAmount: Number(extraAmount),
        paidAt: timestampNow,
        paidBy: actorName
      }
    };

    const logEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: timestampNow,
      actor: actorName,
      action: 'RECORDED_PARTIAL',
      details: `Updated ${member.name} (${meetingMonth}): Deposit ₹${Number(depositAmount).toLocaleString()}${shortAmount > 0 ? `, Short ₹${shortAmount.toLocaleString()}` : ''}${extraAmount > 0 ? `, Extra ₹${extraAmount.toLocaleString()}` : ''}.`,
      canRollback: true,
      rollbackData: { type: 'payment', memberId, previousState: current }
    };

    updateCurrentMonthPayments(updatedPayments, logEntry);
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

    const logEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: timestampNow,
      actor: actorName,
      action: 'MARKED_ALL_PAID',
      details: `One-tap: Marked all 15 members as fully paid for ${meetingMonth}.`,
      canRollback: true,
      rollbackData: { type: 'all_payments', previousPayments }
    };

    updateCurrentMonthPayments(newPayments, logEntry);
  };

  // Rollback a past action from log
  const rollbackAction = (logEntry) => {
    if (!logEntry.rollbackData) return;

    if (logEntry.rollbackData.type === 'payment') {
      const { memberId, previousState } = logEntry.rollbackData;
      const updatedPayments = {
        ...payments,
        [memberId]: previousState
      };
      updateCurrentMonthPayments(updatedPayments);
      addLog('ROLLBACK', `Undid action: ${logEntry.action} (${logEntry.details})`, false);
    } else if (logEntry.rollbackData.type === 'all_payments') {
      updateCurrentMonthPayments(logEntry.rollbackData.previousPayments);
      addLog('ROLLBACK', `Undid: One-tap mark all paid. Restored previous states.`, false);
    } else if (logEntry.rollbackData.type === 'new_loan') {
      const { loanId } = logEntry.rollbackData;
      setLoans(prev => prev.filter(l => l.id !== loanId));
      addLog('ROLLBACK', `Cancelled loan #${loanId} and restored limits.`, false);
    }
  };

  // Submit a loan request by a member
  const submitLoanRequest = ({ type, borrowerName, borrowerPhone, borrowerAddress, borrowerAadhar, principal, note, totalMonths = 12, chargedRate = null, documents = [] }) => {
    let finalPrincipal = Number(principal);
    if (type === 'outer' && finalPrincipal > 100000) {
      finalPrincipal = 100000;
    }
    const m = Number(totalMonths) || 12;
    const standardRate = getStandardRate(type, m);
    const kisht = calculateKisht(finalPrincipal, type, m);
    const security = calculateSecurityFee(finalPrincipal, type);
    const effectiveChargedRate = (type === 'outer' && chargedRate && Number(chargedRate) > 0) ? Number(chargedRate) : standardRate;
    const outsiderKisht = (type === 'outer') ? calculateKisht(finalPrincipal, type, m, effectiveChargedRate) : kisht;

    const newRequest = {
      id: 'req-' + Date.now(),
      requestedBy: currentUser.name,
      type,
      borrowerName,
      borrowerPhone,
      borrowerAddress,
      borrowerAadhar: borrowerAadhar || '',
      documents: documents || [],
      principal: finalPrincipal,
      totalMonths: m,
      rate: standardRate,
      chargedRate: effectiveChargedRate,
      monthlyKisht: kisht,
      outsiderMonthlyKisht: outsiderKisht,
      securityFee: security,
      note,
      status: 'pending',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })
    };

    const updatedRequests = [newRequest, ...loanRequests];
    setLoanRequests(updatedRequests);
    addLog(
      'LOAN_REQUESTED',
      `${currentUser.name} requested new ${type.toUpperCase()} loan for ${borrowerName} (₹${finalPrincipal.toLocaleString()}, ${m} Months).`,
      false
    );
    syncToCloud({ loanRequests: updatedRequests });
  };

  // Approve loan request by Super Admin
  const approveLoanRequest = (requestId) => {
    const req = loanRequests.find(r => r.id === requestId);
    if (!req) return;

    // Disburse the actual loan
    disburseLoan({
      borrowerName: req.borrowerName,
      borrowerPhone: req.borrowerPhone,
      borrowerAddress: req.borrowerAddress,
      borrowerAadhar: req.borrowerAadhar || '',
      guarantor: req.requestedBy,
      type: req.type,
      principal: req.principal,
      totalMonths: req.totalMonths || 12,
      chargedRate: req.chargedRate || null,
      documents: req.documents || []
    });

    const updatedRequests = loanRequests.map(r => r.id === requestId ? { ...r, status: 'approved' } : r);
    setLoanRequests(updatedRequests);
    addLog('REQUEST_APPROVED', `Admin approved loan request for ${req.borrowerName} (₹${req.principal.toLocaleString()}).`, false);
    syncToCloud({ loanRequests: updatedRequests });
  };

  // Reject loan request by Super Admin
  const rejectLoanRequest = (requestId) => {
    const req = loanRequests.find(r => r.id === requestId);
    if (!req) return;

    const updatedRequests = loanRequests.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r);
    setLoanRequests(updatedRequests);
    addLog('REQUEST_REJECTED', `Admin rejected loan request for ${req.borrowerName}.`, false);
    syncToCloud({ loanRequests: updatedRequests });
  };

  // Disburse a brand new loan with Audit Trail
  const disburseLoan = ({ borrowerName, borrowerPhone, borrowerAddress, borrowerAadhar, guarantor, type, principal, totalMonths = 12, chargedRate = null, documents = [] }) => {
    const rawP = Number(principal);
    const p = (type === 'outer' && rawP > 100000) ? 100000 : rawP;
    const m = Number(totalMonths) || 12;
    const standardRate = getStandardRate(type, m);
    const kisht = calculateKisht(p, type, m);
    const security = calculateSecurityFee(p, type);
    const nextId = Math.max(...loans.map(l => l.id), 460) + 1;

    const effectiveChargedRate = (type === 'outer' && chargedRate !== null && chargedRate !== undefined && Number(chargedRate) > 0)
      ? Number(chargedRate)
      : standardRate;
    const outsiderKisht = (type === 'outer')
      ? calculateKisht(p, type, m, effectiveChargedRate)
      : kisht;

    const newLoan = {
      id: nextId,
      borrowerName: borrowerName.toUpperCase(),
      borrowerPhone: borrowerPhone || '9800000000',
      borrowerAddress: borrowerAddress || '',
      borrowerAadhar: borrowerAadhar || '',
      documents: documents || [],
      guarantor: type === 'self' ? borrowerName.toUpperCase() : guarantor.toUpperCase(),
      type,
      principal: p,
      rate: standardRate,
      chargedRate: effectiveChargedRate,
      monthlyKisht: kisht,
      outsiderMonthlyKisht: outsiderKisht,
      currentMonth: 1,
      totalMonths: m,
      securityFee: security
    };

    const updatedLoans = [newLoan, ...loans];
    setLoans(updatedLoans);

    const logEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: getFormattedTimestamp(),
      actor: currentUser ? currentUser.name : 'ADMIN',
      action: 'LOAN_DISBURSED',
      details: `Disbursed new ${type.toUpperCase()} loan #${nextId} to ${newLoan.borrowerName} for ₹${p.toLocaleString()} (${m} Months, Guarantor: ${newLoan.guarantor}, Standard Kisht: ₹${kisht.toLocaleString()}/mo).`,
      canRollback: true,
      rollbackData: { type: 'new_loan', loanId: nextId }
    };
    const updatedLogs = [logEntry, ...auditLogs];
    setAuditLogs(updatedLogs);

    syncToCloud({ loans: updatedLoans, auditLogs: updatedLogs });

    return newLoan;
  };

  // Attach a security document or form to an existing loan
  const attachLoanDocument = (loanId, document) => {
    const updatedLoans = loans.map(l => {
      if (l.id === loanId) {
        const existingDocs = l.documents || [];
        return { ...l, documents: [...existingDocs, document] };
      }
      return l;
    });
    setLoans(updatedLoans);
    addLog('DOCUMENT_ATTACHED', `Attached security document "${document.name}" to Loan #${loanId}.`, false);
    syncToCloud({ loans: updatedLoans });
  };

  // Remove an attached document from a loan
  const removeLoanDocument = (loanId, docId) => {
    const updatedLoans = loans.map(l => {
      if (l.id === loanId) {
        const existingDocs = l.documents || [];
        return { ...l, documents: existingDocs.filter(d => d.id !== docId) };
      }
      return l;
    });
    setLoans(updatedLoans);
    addLog('DOCUMENT_REMOVED', `Removed document from Loan #${loanId}.`, false);
    syncToCloud({ loans: updatedLoans });
  };

  // Update complete documents list for a loan
  const updateLoanDocuments = (loanId, documents) => {
    const updatedLoans = loans.map(l => {
      if (l.id === loanId) {
        return { ...l, documents: documents || [] };
      }
      return l;
    });
    setLoans(updatedLoans);
    addLog('DOCUMENTS_UPDATED', `Updated security documents for Loan #${loanId}.`, false);
    syncToCloud({ loans: updatedLoans });
  };

  // Update Annual February Meeting Configuration (custom totals or auto)
  const updateAnnualMeetingConfig = (newConfig) => {
    setAnnualMeetingConfig(newConfig);
    localStorage.setItem('comm_annual_meeting_config', JSON.stringify(newConfig));
    addLog(
      'ANNUAL_CONFIG_UPDATED',
      `Updated Annual February Meeting loan totals configuration (Mode: ${newConfig.useCustomTotals ? 'Custom' : 'Auto'}).`,
      false
    );
    syncToCloud({ annualMeetingConfig: newConfig });
  };

  // Compute Annual February Meeting Profit & Commission Statistics
  const getAnnualMeetingStats = () => {
    const activeSelfLoans = loans.filter(l => l.type === 'self');
    const activeOuterLoans = loans.filter(l => l.type === 'outer');
    const autoSelfTotal = activeSelfLoans.reduce((s, l) => s + l.principal, 0);
    const autoOuterTotal = activeOuterLoans.reduce((s, l) => s + l.principal, 0);

    const useCustom = Boolean(annualMeetingConfig?.useCustomTotals);
    const selfTotal = (useCustom && annualMeetingConfig?.customSelfTotal != null)
      ? Number(annualMeetingConfig.customSelfTotal)
      : autoSelfTotal;
    const outerTotal = (useCustom && annualMeetingConfig?.customOuterTotal != null)
      ? Number(annualMeetingConfig.customOuterTotal)
      : autoOuterTotal;

    const totalLoansGiven = selfTotal + outerTotal;
    const selfPoolReturn7Pct = Math.round(selfTotal * 0.07);
    const outerPoolReturn7Pct = Math.round(outerTotal * 0.07);
    const totalCommonPool = selfPoolReturn7Pct + outerPoolReturn7Pct;
    const perMemberPoolDividend = Math.round(totalCommonPool / 15);

    const memberPayouts = members.map(m => {
      const selfLoansTaken = activeSelfLoans
        .filter(l => l.borrowerName === m.name)
        .reduce((s, l) => s + l.principal, 0);

      const autoGuaranteed = activeOuterLoans
        .filter(l => l.guarantor === m.name)
        .reduce((s, l) => s + l.principal, 0);

      const outerGuaranteed = (useCustom && annualMeetingConfig?.customMemberGuarantees?.[m.name] != null)
        ? Number(annualMeetingConfig.customMemberGuarantees[m.name])
        : autoGuaranteed;

      const guarantorCommission = Math.round(outerGuaranteed * 0.06);
      const totalPayout = perMemberPoolDividend + guarantorCommission;

      return {
        member: m,
        selfLoansTaken,
        outerGuaranteed,
        guarantorCommission,
        poolDividend: perMemberPoolDividend,
        totalPayout
      };
    });

    const totalCommissionAll = memberPayouts.reduce((s, r) => s + r.guarantorCommission, 0);
    const totalPayoutAll = memberPayouts.reduce((s, r) => s + r.totalPayout, 0);

    return {
      useCustom,
      selfTotal,
      outerTotal,
      autoSelfTotal,
      autoOuterTotal,
      totalLoansGiven,
      selfPoolReturn7Pct,
      outerPoolReturn7Pct,
      totalCommonPool,
      perMemberPoolDividend,
      memberPayouts,
      totalCommissionAll,
      totalPayoutAll
    };
  };

  // Reset to initial data
  const resetToFactory = () => {
    localStorage.clear();
    localStorage.setItem('comm_app_data_version', DATA_VERSION);
    setMembers(INITIAL_MEMBERS);
    setLoans(INITIAL_LOANS);
    setLoanRequests([]);
    setMonthlyUnit(1000);
    setAvailableCashFund(150000);
    setMeetingMonth('September 2026');
    setMeetingDate('10 Sep 2026');
    const initial = defaultPendingPayments();
    setPayments(initial);
    const resetByMonth = { 'September 2026': initial };
    setPaymentsByMonth(resetByMonth);
    const resetLogs = [
      {
        id: 'init-reset',
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        actor: currentUser?.name || 'ADMIN',
        action: 'FACTORY_RESET',
        details: 'Reset application data back to default September state.',
        canRollback: false
      }
    ];
    setAuditLogs(resetLogs);

    syncToCloud({
      members: INITIAL_MEMBERS,
      loans: INITIAL_LOANS,
      loanRequests: [],
      monthlyUnit: 1000,
      availableCashFund: 150000,
      meetingMonth: 'September 2026',
      meetingDate: '10 Sep 2026',
      payments: initial,
      paymentsByMonth: resetByMonth,
      auditLogs: resetLogs
    });
  };

  const isSuperAdmin = currentUser && ['NARENDRA', 'MAHENDRA', 'NARESH'].includes(currentUser.name);

  return (
    <AppContext.Provider value={{
      cloudSyncStatus,
      lang,
      language: lang,
      setLang,
      setLanguage,
      t,
      toggleLanguage,
      AVAILABLE_MONTHS,
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
      changeMeetingMonth,
      getFormattedTimestamp,
      payments,
      paymentsByMonth,
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
      attachLoanDocument,
      removeLoanDocument,
      updateLoanDocuments,
      annualMeetingConfig,
      updateAnnualMeetingConfig,
      getAnnualMeetingStats,
      resetToFactory
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
