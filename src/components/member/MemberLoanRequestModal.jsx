import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateKisht, calculateSecurityFee, getStandardRate, formatINR } from '../../utils/loanCalculator';
import DocumentAttachmentInput from '../common/DocumentAttachmentInput';
import { Send, Sparkles, AlertTriangle, CheckCircle2, User, Clock, Percent, Zap } from 'lucide-react';

export default function MemberLoanRequestModal({ isOpen, onClose }) {
  const { currentUser, isSuperAdmin, submitLoanRequest, disburseLoan, getMemberLimits, t } = useApp();

  const [type, setType] = useState('outer'); // 'outer' | 'self'
  const [totalMonths, setTotalMonths] = useState(12); // 12 | 6
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerAddress, setBorrowerAddress] = useState('');
  const [borrowerAadhar, setBorrowerAadhar] = useState('');
  const [documents, setDocuments] = useState([]);
  const [principal, setPrincipal] = useState('50000');
  const [chargedRate, setChargedRate] = useState('16');
  const [note, setNote] = useState('');
  const [instantDisburse, setInstantDisburse] = useState(false);

  const handleAadharChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setBorrowerAadhar(formatted);
  };

  // Sync default charged rate with tenure
  useEffect(() => {
    if (type === 'outer') {
      if (totalMonths === 6 && (chargedRate === '16' || !chargedRate)) {
        setChargedRate('8');
      } else if (totalMonths === 12 && (chargedRate === '8' || !chargedRate)) {
        setChargedRate('16');
      }
    }
  }, [totalMonths, type]);

  if (!isOpen || !currentUser) return null;

  const numPrincipal = Number(principal) || 0;
  const standardRate = getStandardRate(type, totalMonths);
  const kisht = calculateKisht(numPrincipal, type, totalMonths);
  const security = calculateSecurityFee(numPrincipal, type);

  const numChargedRate = Number(chargedRate) > 0 ? Number(chargedRate) : standardRate;
  const outsiderKisht = type === 'outer'
    ? calculateKisht(numPrincipal, type, totalMonths, numChargedRate)
    : kisht;
  const monthlyMargin = Math.max(0, outsiderKisht - kisht);

  const limits = getMemberLimits(currentUser.name);
  const availableLimit = type === 'self' ? limits.selfLeft : limits.outerLeft;
  const isLimitExceeded = numPrincipal > availableLimit;
  const isOuterMaxExceeded = type === 'outer' && numPrincipal > 100000;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'outer') {
      if (!borrowerName.trim()) {
        alert('Please enter outsider borrower name');
        return;
      }
      const cleanAadhar = borrowerAadhar.replace(/\D/g, '');
      if (cleanAadhar.length !== 12) {
        alert('Kripya outsider borrower ka sahi 12-digit Aadhaar number darj karein (12 अंक आधार नंबर अनिवार्य है)।');
        return;
      }
      if (numPrincipal > 100000) {
        alert(t.outerCapExceeded || 'Outsider ke liye maximum loan amount ₹1,00,000 (1 Lakh) hi ho sakta hai.');
        return;
      }
    }
    if (numPrincipal <= 0) {
      alert('Please enter valid amount');
      return;
    }

    const bName = type === 'self' ? currentUser.name : borrowerName.toUpperCase();

    if (isSuperAdmin && instantDisburse) {
      // Direct disburse by admin
      const createdLoan = disburseLoan({
        borrowerName: bName,
        borrowerPhone: type === 'self' ? currentUser.phone : borrowerPhone,
        borrowerAddress,
        borrowerAadhar: type === 'outer' ? borrowerAadhar.trim() : '',
        guarantor: currentUser.name,
        type,
        principal: numPrincipal,
        totalMonths,
        chargedRate: type === 'outer' ? numChargedRate : standardRate,
        documents
      });

      alert(
        type === 'self'
          ? `Self Loan #${createdLoan.id} for ₹${numPrincipal.toLocaleString()} (${totalMonths} Months) disbursed instantly!`
          : `Outer Loan #${createdLoan.id} for ${bName} (${totalMonths} Months) disbursed instantly!`
      );
    } else {
      // Submit as request
      submitLoanRequest({
        type,
        borrowerName: bName,
        borrowerPhone: type === 'self' ? currentUser.phone : borrowerPhone,
        borrowerAddress,
        borrowerAadhar: type === 'outer' ? borrowerAadhar.trim() : '',
        principal: numPrincipal,
        totalMonths,
        chargedRate: type === 'outer' ? numChargedRate : standardRate,
        documents,
        note
      });

      alert(
        type === 'self'
          ? `Aapka ₹${numPrincipal.toLocaleString()} ke personal loan ka aavedan (${totalMonths} mahine) committee ko bhej diya gaya hai!`
          : `Aapne ${bName} ke ₹${numPrincipal.toLocaleString()} loan ki zaminari ka aavedan (${totalMonths} mahine) bhej diya hai!`
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Naya Loan Aavedan (Loan Request)
            </h3>
            <p className="text-[11px] text-slate-400">By Member: {currentUser.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {/* Track: Self vs Outer */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('outer');
                if (Number(principal) > 100000) setPrincipal('100000');
              }}
              className={`py-2 rounded-xl font-bold transition ${
                type === 'outer' ? 'bg-amber-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              Outer Loan ({totalMonths === 6 ? '8%' : '16%'})
            </button>
            <button
              type="button"
              onClick={() => setType('self')}
              className={`py-2 rounded-xl font-bold transition ${
                type === 'self' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              Self Personal ({totalMonths === 6 ? '5%' : '10%'})
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
                className={`py-2 px-2 rounded-xl border text-center transition font-bold flex flex-col items-center gap-0.5 ${
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
                className={`py-2 px-2 rounded-xl border text-center transition font-bold flex flex-col items-center gap-0.5 ${
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

          {/* If Outer Loan: Outsider Details */}
          {type === 'outer' ? (
            <>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Outsider Full Name (क़र्ज़दार का नाम):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Mobile Number:
                  </label>
                  <input
                    type="tel"
                    placeholder="98xxxxxx"
                    value={borrowerPhone}
                    onChange={(e) => setBorrowerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Address / Gaon:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ward 4"
                    value={borrowerAddress}
                    onChange={(e) => setBorrowerAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Outsider Aadhaar Number */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Outsider Aadhaar Number (12 अंक आधार नंबर) <span className="text-amber-400 font-bold">*</span>:
                </label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  placeholder="1234 5678 9012"
                  value={borrowerAadhar}
                  onChange={handleAadharChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono tracking-wider font-semibold"
                />
              </div>

              {/* Outsider Interest Rate Choice (Requirement 2) */}
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
                  ℹ️ Outsider will only see <b>{numChargedRate}%</b> on passbook. Society accounting is standard <b>{standardRate}%</b>.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-slate-300 space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase">Borrower:</span>
              <span className="font-bold text-white text-sm">{currentUser.name} (Apne liye)</span>
              <span className="text-[11px] text-emerald-400 block">
                Interest: {standardRate}% Flat • {totalMonths} Kishts
              </span>
            </div>
          )}

          {/* Amount */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-semibold">Loan Amount (₹):</label>
              <div className="text-right">
                {type === 'outer' && (
                  <span className="text-[10px] text-amber-400 font-bold block">
                    {t.maxOuterLoanCap}
                  </span>
                )}
                <span className="text-[10px] text-slate-400">
                  Bachi limit: <b className="text-emerald-400">{formatINR(availableLimit)}</b>
                </span>
              </div>
            </div>
            <input
              type="number"
              step="5000"
              max={type === 'outer' ? 100000 : undefined}
              required
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className={`w-full bg-slate-950 border ${isOuterMaxExceeded ? 'border-red-500' : 'border-slate-800'} rounded-xl p-2.5 text-white font-bold text-base focus:outline-none focus:border-emerald-500`}
            />
            {isOuterMaxExceeded && (
              <p className="text-[11px] text-red-400 font-bold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{t.outerCapExceeded}</span>
              </p>
            )}
          </div>

          {/* Reason / Note */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Uddeshya / Note (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Medical / Dukaan / Kheti"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-slate-700"
            />
          </div>

          {/* Security Document / Signed Form Attachment */}
          <DocumentAttachmentInput
            documents={documents}
            onChange={setDocuments}
          />

          {/* Auto calculations */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span>Society Kisht ({totalMonths} Mos):</span>
              <span className="font-bold text-emerald-400">{formatINR(kisht)} / mo</span>
            </div>

            {type === 'outer' && numChargedRate !== standardRate && (
              <>
                <div className="flex justify-between text-amber-300 pt-1 border-t border-slate-800/80">
                  <span>Outsider Kisht ({numChargedRate}%):</span>
                  <span className="font-bold text-amber-400">{formatINR(outsiderKisht)} / mo</span>
                </div>
                {monthlyMargin > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-400 font-semibold bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-900/40">
                    <span>Aapka Har Mahine Ka Munafa:</span>
                    <span>+{formatINR(monthlyMargin)} / mo</span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between">
              <span>Upfront Security Fee:</span>
              <span className="font-bold text-amber-400">{formatINR(security)}</span>
            </div>

            {type === 'outer' && (
              <div className="flex justify-between pt-1 border-t border-slate-800/80 text-[11px] text-indigo-400">
                <span>Aapka Feb Commission (6%):</span>
                <span className="font-bold">{formatINR(numPrincipal * 0.06)}</span>
              </div>
            )}
            {isLimitExceeded && (
              <div className="text-amber-400 pt-1 text-[11px] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Limit se zyada hai (Admin approval zaroori)</span>
              </div>
            )}
          </div>

          {/* Admin Instant Disburse Option */}
          {isSuperAdmin && (
            <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-2xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Instant Disburse (Super Admin)</span>
                  <span className="text-[10px] text-emerald-300">Approve and disburse immediately</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={instantDisburse}
                onChange={(e) => setInstantDisburse(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLimitExceeded || isOuterMaxExceeded}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-1.5 shadow active:scale-98 transition"
            >
              {isSuperAdmin && instantDisburse ? <Zap className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isSuperAdmin && instantDisburse ? 'Disburse Now' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
