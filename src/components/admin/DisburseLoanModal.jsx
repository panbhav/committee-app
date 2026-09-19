import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateKisht, calculateSecurityFee, getStandardRate, formatINR } from '../../utils/loanCalculator';
import { X, Sparkles, AlertTriangle, CheckCircle2, Clock, Percent } from 'lucide-react';

export default function DisburseLoanModal({ isOpen, onClose }) {
  const { members, disburseLoan, getMemberLimits, t } = useApp();

  const [type, setType] = useState('outer'); // 'outer' | 'self'
  const [totalMonths, setTotalMonths] = useState(12); // 12 | 6
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [guarantor, setGuarantor] = useState(members[0]?.name || 'AVNISH');
  const [principal, setPrincipal] = useState('100000');
  const [chargedRate, setChargedRate] = useState('16');

  // Keep default charged rate in sync with duration
  useEffect(() => {
    if (type === 'outer') {
      if (totalMonths === 6 && (chargedRate === '16' || !chargedRate)) {
        setChargedRate('8');
      } else if (totalMonths === 12 && (chargedRate === '8' || !chargedRate)) {
        setChargedRate('16');
      }
    }
  }, [totalMonths, type]);

  if (!isOpen) return null;

  const numPrincipal = Number(principal) || 0;
  const standardRate = getStandardRate(type, totalMonths);
  const kisht = calculateKisht(numPrincipal, type, totalMonths);
  const security = calculateSecurityFee(numPrincipal, type);

  const numChargedRate = Number(chargedRate) > 0 ? Number(chargedRate) : standardRate;
  const outsiderKisht = type === 'outer'
    ? calculateKisht(numPrincipal, type, totalMonths, numChargedRate)
    : kisht;
  const monthlyMargin = Math.max(0, outsiderKisht - kisht);

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
      principal: numPrincipal,
      totalMonths,
      chargedRate: type === 'outer' ? numChargedRate : standardRate
    });

    if (type === 'outer') {
      const appUrl = window.location.href.split('?')[0].split('#')[0];
      const shareMsg = `Namaste ${borrowerName} ji! Aapka ₹${numPrincipal.toLocaleString()} ka Banking Society loan pass ho gaya hai (Loan Account #${createdLoan.id}). Aapki monthly kisht ₹${outsiderKisht.toLocaleString()} hai (${totalMonths} mahine, har mahine ki 10 tareekh tak deya, Byaz Dar: ${numChargedRate}%). Apni digital passbook dekhne ke liye is link par apna phone number ya Loan #${createdLoan.id} daalein: ${appUrl}`;
      if (confirm(`Loan #${createdLoan.id} Disbursed Successfully!\n\nWould you like to send the Digital Passbook link to ${borrowerName} on WhatsApp?`)) {
        window.open(`https://wa.me/${borrowerPhone ? '91' + borrowerPhone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(shareMsg)}`, '_blank');
      }
    } else {
      alert(`Self Loan #${createdLoan.id} for ${borrowerName} (${totalMonths} Months) disbursed successfully!`);
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
              Outer Loan ({totalMonths === 6 ? '8%' : '16%'})
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
              Self Loan ({totalMonths === 6 ? '5%' : '10%'})
            </button>
          </div>

          {/* Tenure / Duration Option (12 Months vs 6 Months) */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Loan Duration (Tenure):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTotalMonths(12)}
                className={`py-2 px-2.5 rounded-xl border text-center transition font-bold flex flex-col items-center gap-0.5 ${
                  totalMonths === 12
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>12 Months</span>
                </div>
                <span className="text-[10px] font-normal text-slate-400">
                  {type === 'self' ? '10% Flat' : '16% Standard'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTotalMonths(6)}
                className={`py-2 px-2.5 rounded-xl border text-center transition font-bold flex flex-col items-center gap-0.5 ${
                  totalMonths === 6
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>6 Months (Half)</span>
                </div>
                <span className="text-[10px] font-normal text-emerald-400">
                  {type === 'self' ? '5% Flat' : '8% Standard'}
                </span>
              </button>
            </div>
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

          {/* Phone (for Outer Loans) */}
          {type === 'outer' && (
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Borrower Mobile Number (for WhatsApp / Passbook):
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={borrowerPhone}
                onChange={(e) => setBorrowerPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>
          )}

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

          {/* Outsider Custom Interest Rate (Requirement 2) */}
          {type === 'outer' && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-amber-300 font-bold flex items-center gap-1 text-xs">
                  <Percent className="w-3.5 h-3.5" />
                  <span>Outsider Interest Rate (%)</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  Society Std: <b className="text-white">{standardRate}%</b>
                </span>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-1.5">
                {(totalMonths === 12 ? ['16', '18', '20', '24'] : ['8', '10', '12', '15']).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setChargedRate(r)}
                    className={`py-1 rounded-lg text-xs font-bold border transition ${
                      chargedRate === r
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {r}% {r === String(standardRate) ? '(Std)' : ''}
                  </button>
                ))}
              </div>

              {/* Custom Rate Input */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400">Custom Rate:</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="60"
                    value={chargedRate}
                    onChange={(e) => setChargedRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-white font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. 20"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">%</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                ℹ️ The outsider will only see <b>{numChargedRate}%</b> on their passbook and receipts. Society collection is standard <b>{standardRate}%</b>.
              </p>
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
              Live Auto-Calculations ({totalMonths} Months)
            </span>
            <div className="flex justify-between">
              <span>Society Standard Rate:</span>
              <span className="font-bold text-white">{standardRate}% Flat</span>
            </div>
            <div className="flex justify-between">
              <span>Society Monthly Kisht:</span>
              <span className="font-extrabold text-emerald-400 text-sm">{formatINR(kisht)} / month</span>
            </div>

            {type === 'outer' && numChargedRate !== standardRate && (
              <>
                <div className="flex justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-amber-300">Outsider's Kisht ({numChargedRate}%):</span>
                  <span className="font-extrabold text-amber-400 text-sm">{formatINR(outsiderKisht)} / month</span>
                </div>
                {monthlyMargin > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-400 font-semibold bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-900/40">
                    <span>Guarantor Monthly Margin:</span>
                    <span>+{formatINR(monthlyMargin)} / month</span>
                  </div>
                )}
              </>
            )}

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
