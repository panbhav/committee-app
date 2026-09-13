import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/loanCalculator';
import { Wallet, TrendingUp, AlertTriangle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function FundManagerModal({ isOpen, onClose }) {
  const {
    getMeetingStats,
    availableCashFund,
    setAvailableCashFund,
    loanRequests,
    monthlyUnit,
    setMonthlyUnit,
    isSuperAdmin,
    t
  } = useApp();

  const stats = getMeetingStats();
  const pendingRequests = loanRequests.filter(r => r.status === 'pending');
  const totalRequestedAmount = pendingRequests.reduce((sum, r) => sum + r.principal, 0);

  // Cash in hand = meeting collected money + existing cash reserve
  const totalLiquidCash = (availableCashFund || 0) + (stats.totalCollected || 0);
  const fundDeficit = Math.max(0, totalRequestedAmount - totalLiquidCash);

  // Smart adjustment calculation:
  // If there's a deficit, how much extra should each of the 15 members invest this month?
  const suggestedExtraPerMember = fundDeficit > 0 ? Math.ceil(fundDeficit / 15 / 500) * 500 : 0;
  const newSuggestedUnit = monthlyUnit + suggestedExtraPerMember;

  const [customUnit, setCustomUnit] = useState(monthlyUnit);

  if (!isOpen) return null;

  const handleApplyNewUnit = () => {
    setMonthlyUnit(Number(customUnit));
    alert(`Monthly investment unit updated to ₹${Number(customUnit).toLocaleString()} per member.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Smart Fund & Liquidity Manager
            </h3>
            <p className="text-[10px] text-slate-400">Balancing cash in hand vs. loan demand</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Live Cash Summary */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Meeting Cash Collected Today:</span>
            <span className="font-bold text-emerald-400">{formatINR(stats.totalCollected)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Opening Reserve Fund Balance:</span>
            <span className="font-bold text-white">{formatINR(availableCashFund)}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="font-black text-slate-200">TOTAL DISBURSABLE CASH:</span>
            <span className="text-base font-black text-emerald-400">{formatINR(totalLiquidCash)}</span>
          </div>
        </div>

        {/* Loan Demand vs Fund Health */}
        <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
          fundDeficit > 0
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
        }`}>
          <div className="flex justify-between items-center font-bold">
            <span className="flex items-center gap-1">
              {fundDeficit > 0 ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {fundDeficit > 0 ? 'Cash Shortage Detected!' : 'Fund is Sufficient & Healthy!'}
            </span>
            <span className="text-white font-black">{formatINR(totalRequestedAmount)} Req</span>
          </div>

          {fundDeficit > 0 ? (
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              New loan requests exceed available cash by <b>{formatINR(fundDeficit)}</b>. The committee needs more funds to disburse all requests.
            </p>
          ) : (
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              You have enough cash in hand to disburse all pending loan applications with surplus left.
            </p>
          )}
        </div>

        {/* Dynamic Investment Recommendation */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Smart Dynamic Investment Rule</span>
          </div>
          <p className="text-[11px] text-slate-400">
            As per your committee rule: <i>"If fund is low $\rightarrow$ high invest; if fund is high $\rightarrow$ less invest."</i>
          </p>

          {fundDeficit > 0 ? (
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-2.5 space-y-1">
              <span className="text-[10px] text-indigo-300 block font-semibold">AI Recommendation:</span>
              <div className="text-xs text-white">
                Increase monthly unit from <b>{formatINR(monthlyUnit)}</b> to <b className="text-emerald-400 text-sm">{formatINR(newSuggestedUnit)}</b> per member (+{formatINR(suggestedExtraPerMember)} extra).
              </div>
              <span className="text-[10px] text-slate-400 block">
                This raises an extra {formatINR(suggestedExtraPerMember * 15)} today to cover the deficit!
              </span>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-xl p-2.5 text-[11px] text-slate-300">
              Surplus cash available. Normal ₹1,000 unit (or optional reduction to ₹500) is fine.
            </div>
          )}

          {/* Super Admin Control */}
          {isSuperAdmin && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-slate-300 font-semibold block">
                Adjust Monthly Unit for This Meeting (₹):
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="500"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={handleApplyNewUnit}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition text-xs"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
