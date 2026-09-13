import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateKisht, calculateSecurityFee, formatINR } from '../../utils/loanCalculator';
import { Send, Sparkles, AlertTriangle, CheckCircle2, User } from 'lucide-react';

export default function MemberLoanRequestModal({ isOpen, onClose }) {
  const { currentUser, submitLoanRequest, getMemberLimits, t } = useApp();

  const [type, setType] = useState('outer'); // 'outer' | 'self'
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerAddress, setBorrowerAddress] = useState('');
  const [principal, setPrincipal] = useState('50000');
  const [note, setNote] = useState('');

  if (!isOpen || !currentUser) return null;

  const numPrincipal = Number(principal) || 0;
  const kisht = calculateKisht(numPrincipal, type);
  const security = calculateSecurityFee(numPrincipal, type);

  const limits = getMemberLimits(currentUser.name);
  const availableLimit = type === 'self' ? limits.selfLeft : limits.outerLeft;
  const isLimitExceeded = numPrincipal > availableLimit;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'outer' && !borrowerName.trim()) {
      alert('Please enter outsider borrower name');
      return;
    }
    if (numPrincipal <= 0) {
      alert('Please enter valid amount');
      return;
    }

    submitLoanRequest({
      type,
      borrowerName: type === 'self' ? currentUser.name : borrowerName.toUpperCase(),
      borrowerPhone,
      borrowerAddress,
      principal: numPrincipal,
      note
    });

    alert(
      type === 'self'
        ? `Aapka ₹${numPrincipal.toLocaleString()} ke personal loan ka aavedan President ko bhej diya gaya hai!`
        : `Aapne ${borrowerName.toUpperCase()} ke ₹${numPrincipal.toLocaleString()} loan ki zaminari ka aavedan bhej diya hai!`
    );
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
              onClick={() => setType('outer')}
              className={`py-2 rounded-xl font-bold transition ${
                type === 'outer' ? 'bg-amber-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              Outer Loan (16%)
            </button>
            <button
              type="button"
              onClick={() => setType('self')}
              className={`py-2 rounded-xl font-bold transition ${
                type === 'self' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              Self Personal (10%)
            </button>
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
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
            </>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-slate-300 space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase">Borrower:</span>
              <span className="font-bold text-white text-sm">{currentUser.name} (Apne liye)</span>
              <span className="text-[11px] text-emerald-400 block">Interest: 10% Flat • 12 Kishts</span>
            </div>
          )}

          {/* Amount */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-semibold">Loan Amount (₹):</label>
              <span className="text-[10px] text-slate-400">
                Aapki bachi limit: <b className="text-emerald-400">{formatINR(availableLimit)}</b>
              </span>
            </div>
            <input
              type="number"
              step="5000"
              required
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-base focus:outline-none focus:border-emerald-500"
            />
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

          {/* Auto calculations */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span>Mahina Kisht (12 Mos):</span>
              <span className="font-bold text-emerald-400">{formatINR(kisht)} / mo</span>
            </div>
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
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
