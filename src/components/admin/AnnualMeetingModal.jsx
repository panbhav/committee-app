import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/loanCalculator';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { Award, TrendingUp, Users, Sparkles, Settings2, CheckCircle2, RotateCcw, FileSpreadsheet, FileDown, ShieldCheck, Percent, HelpCircle } from 'lucide-react';

export default function AnnualMeetingModal() {
  const {
    members,
    loans,
    payments,
    meetingMonth,
    getMemberBill,
    getMemberLimits,
    isSuperAdmin,
    annualMeetingConfig,
    updateAnnualMeetingConfig,
    getAnnualMeetingStats,
    t
  } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const stats = getAnnualMeetingStats();

  // Local state for the Super Admin edit modal
  const [useCustom, setUseCustom] = useState(annualMeetingConfig?.useCustomTotals || false);
  const [customSelfInput, setCustomSelfInput] = useState(
    annualMeetingConfig?.customSelfTotal != null ? String(annualMeetingConfig.customSelfTotal) : String(stats.autoSelfTotal)
  );
  const [customOuterInput, setCustomOuterInput] = useState(
    annualMeetingConfig?.customOuterTotal != null ? String(annualMeetingConfig.customOuterTotal) : String(stats.autoOuterTotal)
  );
  const [memberGuarantees, setMemberGuarantees] = useState(() => {
    const map = {};
    members.forEach(m => {
      if (annualMeetingConfig?.customMemberGuarantees?.[m.name] != null) {
        map[m.name] = String(annualMeetingConfig.customMemberGuarantees[m.name]);
      } else {
        const autoAmount = loans
          .filter(l => l.type === 'outer' && l.guarantor === m.name)
          .reduce((s, l) => s + l.principal, 0);
        map[m.name] = String(autoAmount);
      }
    });
    return map;
  });

  const handleOpenEdit = () => {
    setUseCustom(annualMeetingConfig?.useCustomTotals || false);
    setCustomSelfInput(
      annualMeetingConfig?.customSelfTotal != null ? String(annualMeetingConfig.customSelfTotal) : String(stats.autoSelfTotal)
    );
    setCustomOuterInput(
      annualMeetingConfig?.customOuterTotal != null ? String(annualMeetingConfig.customOuterTotal) : String(stats.autoOuterTotal)
    );
    const map = {};
    members.forEach(m => {
      if (annualMeetingConfig?.customMemberGuarantees?.[m.name] != null) {
        map[m.name] = String(annualMeetingConfig.customMemberGuarantees[m.name]);
      } else {
        const autoAmount = loans
          .filter(l => l.type === 'outer' && l.guarantor === m.name)
          .reduce((s, l) => s + l.principal, 0);
        map[m.name] = String(autoAmount);
      }
    });
    setMemberGuarantees(map);
    setIsEditModalOpen(true);
  };

  const handleSaveConfig = () => {
    const parsedGuarantees = {};
    Object.entries(memberGuarantees).forEach(([name, val]) => {
      parsedGuarantees[name] = Number(val) || 0;
    });

    const newConfig = {
      useCustomTotals: useCustom,
      customSelfTotal: useCustom ? Number(customSelfInput) || 0 : null,
      customOuterTotal: useCustom ? Number(customOuterInput) || 0 : null,
      customMemberGuarantees: useCustom ? parsedGuarantees : {}
    };

    updateAnnualMeetingConfig(newConfig);
    setIsEditModalOpen(false);
    alert(
      useCustom
        ? 'February Annual Meeting totals updated with custom cumulative figures!'
        : 'February Annual Meeting reset to automatically compute from active loans ledger!'
    );
  };

  const handleResetToAuto = () => {
    setUseCustom(false);
    setCustomSelfInput(String(stats.autoSelfTotal));
    setCustomOuterInput(String(stats.autoOuterTotal));
    const map = {};
    members.forEach(m => {
      const autoAmount = loans
        .filter(l => l.type === 'outer' && l.guarantor === m.name)
        .reduce((s, l) => s + l.principal, 0);
      map[m.name] = String(autoAmount);
    });
    setMemberGuarantees(map);
  };

  const handleExportExcel = () => {
    exportToExcel({ members, loans, payments, meetingMonth, getMemberBill, getMemberLimits });
  };

  const handleExportPDF = () => {
    exportToPDF({ members, loans, payments, meetingMonth, getMemberBill });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-4 shadow-xl">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Annual February Settlement (वार्षिक आम बैठक)</span>
              </span>
              {stats.useCustom && (
                <span className="text-[9px] font-bold text-sky-400 bg-sky-950/80 border border-sky-800/50 px-2 py-0.5 rounded-full">
                  Custom Totals Active
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white mt-1.5">
              {t.annualMeetingTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.annualMeetingSubtitle}
            </p>
          </div>

          {isSuperAdmin && (
            <button
              onClick={handleOpenEdit}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-950/40 active:scale-95 transition"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Set Total Loans</span>
            </button>
          )}
        </div>

        {/* 4 Cumulative Loan & Profit Metric Cards */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          {/* Card 1: Total Self Loans Given */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Total Self Loans Given (कुल सेल्फ लोन):
            </span>
            <div className="text-base font-black text-white">
              {formatINR(stats.selfTotal)}
            </div>
            <span className="text-[10px] text-emerald-400 block font-medium">
              7% Pool Return: +{formatINR(stats.selfPoolReturn7Pct)}
            </span>
          </div>

          {/* Card 2: Total Outer Loans Given */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Total Outer Loans Given (कुल बाहरी लोन):
            </span>
            <div className="text-base font-black text-amber-400">
              {formatINR(stats.outerTotal)}
            </div>
            <span className="text-[10px] text-emerald-400 block font-medium">
              7% Pool: +{formatINR(stats.outerPoolReturn7Pct)} • 6% Comm: +{formatINR(Math.round(stats.outerTotal * 0.06))}
            </span>
          </div>

          {/* Card 3: Common Pool Profit (Divided Equally by 15) */}
          <div className="bg-emerald-950/30 p-3 rounded-2xl border border-emerald-500/30 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-emerald-300 font-bold uppercase">
                {t.poolDividend} (7% Pool):
              </span>
              <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                1/15 Share
              </span>
            </div>
            <div className="text-lg font-black text-emerald-300">
              {formatINR(stats.perMemberPoolDividend)} <span className="text-[11px] font-normal text-slate-300">/ member</span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Total Pool: {formatINR(stats.totalCommonPool)}
            </span>
          </div>

          {/* Card 4: Total February Distribution */}
          <div className="bg-indigo-950/30 p-3 rounded-2xl border border-indigo-500/30 space-y-1">
            <span className="text-[10px] text-indigo-300 font-bold uppercase">
              Total Feb Payout (कुल वितरण):
            </span>
            <div className="text-lg font-black text-white">
              {formatINR(stats.totalPayoutAll)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Pool Share + 6% Guarantor Commission
            </span>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="pt-3 mt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-400">
            {stats.useCustom ? '⚡ Based on custom loan baseline' : '📊 Based on current active ledger'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="py-1 px-2.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 rounded-xl font-bold text-[11px] flex items-center gap-1 transition"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="py-1 px-2.5 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/60 text-sky-300 rounded-xl font-bold text-[11px] flex items-center gap-1 transition"
            >
              <FileDown className="w-3 h-3 text-sky-400" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Member Payout Leaderboard */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t.memberPayoutSheet}
          </span>
          <span className="text-[11px] text-slate-400">15 Members</span>
        </div>

        <div className="space-y-2">
          {[...stats.memberPayouts]
            .sort((a, b) => b.totalPayout - a.totalPayout)
            .map((item, idx) => (
              <div
                key={item.member.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30' :
                    idx === 1 ? 'bg-slate-300 text-slate-950' :
                    idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{item.member.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Outer Guaranteed: <b className="text-amber-400">{formatINR(item.outerGuaranteed)}</b>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">
                    Pool {formatINR(item.poolDividend)} + Comm {formatINR(item.guarantorCommission)}
                  </span>
                  <span className="text-sm font-extrabold text-emerald-400">
                    {formatINR(item.totalPayout)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Super Admin Modal: Edit Cumulative Loan Totals */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-amber-400" />
                  Set Total Loans Given Till Now (कुल लोन सेट करें)
                </h3>
                <p className="text-[11px] text-slate-400">For February Annual Profit & Commission Settlement</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher: Auto vs Custom */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setUseCustom(false)}
                className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                  !useCustom ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto (Active Ledger)</span>
              </button>
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                  useCustom ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Custom Totals</span>
              </button>
            </div>

            {/* Active Ledger Reference Summary */}
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 text-[11px] space-y-1">
              <span className="text-slate-400 font-bold uppercase block text-[10px]">
                Active Ledger Sums:
              </span>
              <div className="flex justify-between text-slate-300">
                <span>Active Self Loans Sum:</span>
                <b className="text-white">{formatINR(stats.autoSelfTotal)}</b>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Active Outer Loans Sum:</span>
                <b className="text-amber-400">{formatINR(stats.autoOuterTotal)}</b>
              </div>
            </div>

            {/* Custom Inputs (when useCustom is true) */}
            {useCustom && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1 text-xs">
                    Total Self Loans Given Till Now (अब तक कुल सेल्फ लोन राशि):
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={customSelfInput}
                    onChange={(e) => setCustomSelfInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 2000000"
                  />
                  <span className="text-[10px] text-emerald-400 block mt-0.5">
                    Will generate 7% pool return: ₹{(Math.round((Number(customSelfInput) || 0) * 0.07)).toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1 text-xs">
                    Total Outer Loans Given Till Now (अब तक कुल बाहरी लोन राशि):
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={customOuterInput}
                    onChange={(e) => setCustomOuterInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 3000000"
                  />
                  <span className="text-[10px] text-amber-400 block mt-0.5">
                    Will generate 7% pool return: ₹{(Math.round((Number(customOuterInput) || 0) * 0.07)).toLocaleString()} & 6% commission pool: ₹{(Math.round((Number(customOuterInput) || 0) * 0.06)).toLocaleString()}
                  </span>
                </div>

                {/* Per Member Outer Guarantee Amounts for 6% Commission */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-300 font-bold text-xs">
                      Member Outer Guarantees (for 6% Commission):
                    </label>
                    <button
                      type="button"
                      onClick={handleResetToAuto}
                      className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center justify-between gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        <span className="font-semibold text-white text-[11px] truncate">{m.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 text-[10px]">₹</span>
                          <input
                            type="number"
                            step="5000"
                            value={memberGuarantees[m.name] ?? ''}
                            onChange={(e) => setMemberGuarantees({ ...memberGuarantees, [m.name]: e.target.value })}
                            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-right font-mono text-[11px] focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Save & Apply Buttons */}
            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow transition active:scale-95"
              >
                Save & Sync to Society
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
