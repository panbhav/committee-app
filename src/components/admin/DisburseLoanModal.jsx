import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateKisht, calculateSecurityFee, formatINR } from '../../utils/loanCalculator';
import { X, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DisburseLoanModal({ isOpen, onClose }) {
  const { members, disburseLoan, getMemberLimits, t } = useApp();

  const [type, setType] = useState('outer'); // 'outer' | 'self'
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [guarantor, setGuarantor] = useState(members[0]?.name || 'AVNISH');
  const [principal, setPrincipal] = useState('100000');

  if (!isOpen) return null;

  const numPrincipal = Number(principal) || 0;
  const kisht = calculateKisht(numPrincipal, type);
  const security = calculateSecurityFee(numPrincipal, type);

  // Check limits
  const targetMemberName = type === 'self' ? borrowerName : guarantor;
  const limits = getMemberLimits(targetMemberName);
  const availableLimit = type === 'self' ? limits.selfLeft : limits.outerLeft;
  const isLimitExceeded = numPrincipal > availableLimit;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      alert('Please enter borrower name');
      return;
    }
    if (numPrincipal <= 0) {
      alert('Please enter valid amount');
      return;
    }
    if (isLimitExceeded) {
      if (!confirm(`Warning: Loan exceeds available limit (${formatINR(availableLimit)}). Still approve?`)) {
        return;
      }
    }

    const createdLoan = disburseLoan({
      borrowerName,
      borrowerPhone,
      guarantor: type === 'self' ? borrowerName : guarantor,
      type,
      principal: numPrincipal
    });

    if (type === 'outer') {
      const appUrl = window.location.href.split('?')[0].split('#')[0];
      const shareMsg = `Namaste ${borrowerName} ji! Aapka ₹${numPrincipal.toLocaleString()} ka committee loan pass ho gaya hai (Loan Account #${createdLoan.id}). Aapki monthly kisht ₹${kisht.toLocaleString()} hai (har mahine ki 10 tareekh tak deya). Apni digital passbook dekhne ke liye is link par apna phone number ya Loan #${createdLoan.id} daalein: ${appUrl}`;
      if (confirm(`Loan #${createdLoan.id} Disbursed Successfully!\n\nWould you like to send the Digital Passbook link to ${borrowerName} on WhatsApp?`)) {
        window.open(`https://wa.me/${borrowerPhone ? '91' + borrowerPhone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(shareMsg)}`, '_blank');
      }
    } else {
      alert(`Self Loan #${createdLoan.id} for ${borrowerName} disbursed successfully!`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {t.disburseLoanTitle}
            </h3>
            <p className="text-[11px] text-slate-400">{t.disburseLoanSubtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Loan Track Selector */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setType('outer')}
              className={`py-2 rounded-xl font-bold transition text-xs ${
                type === 'outer'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.outerLoan16}
            </button>
            <button
              type="button"
              onClick={() => setType('self')}
              className={`py-2 rounded-xl font-bold transition text-xs ${
                type === 'self'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.selfLoan10}
            </button>
          </div>

          {/* Borrower Name */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              {type === 'self' ? 'Select Member (Borrower):' : t.borrowerNameLabel}
            </label>
            {type === 'self' ? (
              <select
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Choose Member --</option>
                {members.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:border-amber-500 focus:outline-none"
              />
            )}
          </div>

          {/* Guarantor (for Outer Loans) */}
          {type === 'outer' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-semibold">{t.guarantorLabel}</label>
                <span className="text-[10px] text-amber-400 font-bold">
                  Avail Limit: {formatINR(limits.outerLeft)}
                </span>
              </div>
              <select
                value={guarantor}
                onChange={(e) => setGuarantor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:border-amber-500 focus:outline-none"
              >
                {members.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Principal Amount */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              {t.principalLabel}
            </label>
            <input
              type="number"
              step="5000"
              required
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-base font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Auto-Calculated Summary Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1.5 text-slate-300">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Live Auto-Calculations
            </span>
            <div className="flex justify-between">
              <span>Interest Rate:</span>
              <span className="font-bold text-white">{type === 'self' ? '10% Flat' : '16% Flat'}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.monthlyKishtBreakdown}</span>
              <span className="font-extrabold text-emerald-400 text-sm">{formatINR(kisht)} / month</span>
            </div>
            <div className="flex justify-between">
              <span>{t.securityFeeDeduction}</span>
              <span className="font-bold text-amber-400">{formatINR(security)}</span>
            </div>

            {isLimitExceeded && (
              <div className="pt-2 text-amber-400 text-[11px] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{t.loanExceedsLimit} ({formatINR(availableLimit)})</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/40 active:scale-98 transition"
            >
              {t.disburseSubmitBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
