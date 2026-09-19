import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR, getLoanTimeline } from '../../utils/loanCalculator';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { UserCheck, Shield, ChevronRight, MessageSquare, CheckCircle, Clock, FileSpreadsheet, FileDown, Calendar } from 'lucide-react';


export default function MemberDashboard({ onOpenNewLoan, onOpenLogs, onOpenBahikhata }) {
  const { currentUser, getMemberBill, getMemberLimits, payments, loans, members, meetingMonth, t } = useApp();

  const handleExportExcel = () => {
    exportToExcel({ members, loans, payments, meetingMonth, getMemberBill, getMemberLimits });
  };

  const handleExportPDF = () => {
    exportToPDF({ members, loans, payments, meetingMonth, getMemberBill });
  };



  if (!currentUser) return null;

  const bill = getMemberBill(currentUser.name);
  const limits = getMemberLimits(currentUser.name);
  const p = payments[currentUser.id] || { status: 'pending' };
  const isPaid = p.status === 'paid';

  const [activeSubTab, setActiveSubTab] = useState('outer'); // 'outer' | 'self'

  const selfPercent = Math.min(100, Math.round((limits.selfUsed / limits.memberLimit) * 100));
  const outerPercent = Math.min(100, Math.round((limits.outerUsed / limits.outerLimit) * 100));

  const sendWhatsAppReminder = (borrowerName, amount, month, phone) => {
    const text = encodeURIComponent(
      `Namaste ${borrowerName} ji! Ye September committee ki kisht (${formatINR(amount)}, Mahina ${month}/12) jama karne ka reminder hai. Kripya meeting se pehle jama kar dein. Dhanyawad - ${currentUser.name}`
    );
    const phoneNum = phone ? '91' + phone.replace(/\D/g, '') : '';
    window.open(`https://wa.me/${phoneNum}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Member Personalized Banner */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-4 shadow-xl">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 border border-indigo-800/50 px-2 py-0.5 rounded-full">
                {t.memberPortal}
              </span>
              {currentUser.role === 'admin' && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2 py-0.5 rounded-full">
                  {t.adminBadge}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              {t.namaste}, {currentUser.name}! 👋
            </h2>
          </div>

          <div className="text-right">
            {isPaid ? (
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" /> {t.depositReceived}
                </span>
                {p.paidAt && (
                  <span className="text-[10px] text-emerald-400/90 block mt-1 font-medium">
                    🕒 {p.paidAt}
                  </span>
                )}
              </div>
            ) : (
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/50 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" /> {t.pendingDeposit}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {t.due}: 10 Sep 2026
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Bill Breakdown Box */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 mt-3 space-y-2 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>{t.guaranteedOuterKishts} ({bill.outerLoans.length} loans):</span>
            <span className="font-bold text-white">{formatINR(bill.outerTotal)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>{t.personalSelfKisht} ({bill.selfLoans.length} loans):</span>
            <span className="font-bold text-white">{formatINR(bill.selfTotal)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>{t.monthlyUnitSavings}:</span>
            <span className="font-bold text-white">{formatINR(bill.monthlyUnit)}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
            <span className="font-black text-slate-200">{t.totalYouMustBring}</span>
            <span className="text-xl font-black text-indigo-400">{formatINR(bill.totalDue)}</span>
          </div>
        </div>
      </div>

      {/* Limits Gauge Meters */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3.5 shadow-md">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>{t.yourRiskLimits}</span>
          <span className="text-[10px] text-slate-500 font-normal">Cap control</span>
        </h3>

        {/* Personal Limit */}
        <div>
          <div className="flex justify-between text-xs mb-1 font-medium">
            <span className="text-slate-400">{t.personalLimit}</span>
            <span className="text-white">
              {formatINR(limits.selfUsed)} Used • <span className="text-emerald-400 font-bold">{formatINR(limits.selfLeft)} Left</span>
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${selfPercent}%` }}
            />
          </div>
        </div>

        {/* Outer Guarantee Limit */}
        <div>
          <div className="flex justify-between text-xs mb-1 font-medium">
            <span className="text-slate-400">{t.outerGuaranteeLimit}</span>
            <span className="text-white">
              {formatINR(limits.outerUsed)} Used • <span className="text-amber-400 font-bold">{formatINR(limits.outerLeft)} Left</span>
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${outerPercent}%` }}
            />
          </div>
        </div>
      </div>


      {/* Loans Sub-tabs: Outer vs Self */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center px-1">
          <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('outer')}
              className={`px-3 py-1 rounded-lg font-bold transition ${activeSubTab === 'outer' ? 'bg-amber-600 text-white shadow' : 'text-slate-400'}`}
            >
              Guaranteed Outsiders ({bill.outerLoans.length})
            </button>
            <button
              onClick={() => setActiveSubTab('self')}
              className={`px-3 py-1 rounded-lg font-bold transition ${activeSubTab === 'self' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'}`}
            >
              My Self Loans ({bill.selfLoans.length})
            </button>
          </div>

          <button
            onClick={onOpenNewLoan}
            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
          >
            + Request Loan
          </button>
        </div>

        {/* Outer Loans List */}
        {activeSubTab === 'outer' ? (
          <div className="space-y-2">
            {bill.outerLoans.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                You have not guaranteed any outer loans yet.
              </div>
            ) : (
              bill.outerLoans.map(l => {
                const timeline = getLoanTimeline(l.currentMonth, l.totalMonths);
                return (
                  <div
                    key={l.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-sm text-white">
                        #{l.id} {l.borrowerName}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5 space-y-0.5">
                        <div className="text-indigo-300 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          <span>{timeline.startMonth} — {timeline.endMonth}</span>
                        </div>
                        <div>Month {l.currentMonth} of {l.totalMonths} • Principal: {formatINR(l.principal)}</div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-sm font-extrabold text-amber-400">
                        {formatINR(l.monthlyKisht)}
                      </span>
                      <button
                        onClick={() => sendWhatsAppReminder(l.borrowerName, l.monthlyKisht, l.currentMonth, l.borrowerPhone)}
                        className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-lg active:scale-95"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Remind
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Self Loans List */
          <div className="space-y-2">
            {bill.selfLoans.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                No active personal loans.
              </div>
            ) : (
              bill.selfLoans.map(l => {
                const timeline = getLoanTimeline(l.currentMonth, l.totalMonths);
                return (
                  <div
                    key={l.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-sm text-white">
                        Personal Loan #{l.id}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5 space-y-0.5">
                        <div className="text-emerald-300 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-400" />
                          <span>{timeline.startMonth} — {timeline.endMonth}</span>
                        </div>
                        <div>Kisht {l.currentMonth} of {l.totalMonths} (10% Interest)</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-emerald-400">
                        {formatINR(l.monthlyKisht)} / mo
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Principal: {formatINR(l.principal)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Transparent Committee Audit & Bahikhata Access for Member */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Full Committee Transparency</h4>
              <p className="text-[10px] text-slate-400">See all 15 members' payments, logs & loans</p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          As a partner, you have 100% visibility into every rupee collected, every loan approved, and any changes made by the President.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onOpenLogs && onOpenLogs()}
            className="py-2.5 px-3 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/50 text-indigo-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>View All Logs</span>
          </button>

          <button
            onClick={() => onOpenBahikhata && onOpenBahikhata()}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Meeting Bahikhata</span>
          </button>
        </div>

        {/* 1-Click Excel & PDF Downloads */}
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
          <button
            onClick={handleExportExcel}
            className="py-2 px-3 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="py-2 px-3 bg-sky-950/50 hover:bg-sky-900/60 border border-sky-800/50 text-sky-300 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
          >
            <FileDown className="w-3.5 h-3.5 text-sky-400" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}


