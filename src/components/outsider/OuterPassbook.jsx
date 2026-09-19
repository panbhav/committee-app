import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR, getLoanTimeline, getInstallmentSchedule } from '../../utils/loanCalculator';
import DocumentViewerModal from '../common/DocumentViewerModal';
import { ShieldCheck, Phone, FileCheck2, AlertCircle, Calendar, Clock, CheckCircle2, Paperclip, Eye } from 'lucide-react';

export default function OuterPassbook() {
  const { loans, currentOuterLoanId, members, t } = useApp();
  const [viewingDoc, setViewingDoc] = useState(null);

  const loan = loans.find(l => l.id === currentOuterLoanId) || loans.find(l => l.type === 'outer');

  if (!loan) {
    return (
      <div className="p-8 text-center text-slate-400">
        No active outer loan found.
      </div>
    );
  }

  const totalMonths = loan.totalMonths || 12;
  const effectiveRate = loan.chargedRate ?? loan.rate ?? (totalMonths === 6 ? 8 : 16);
  const effectiveKisht = loan.outsiderMonthlyKisht || loan.monthlyKisht;

  const guarantorMember = members.find(m => m.name === loan.guarantor);
  const progressPercent = Math.round((loan.currentMonth / totalMonths) * 100);
  const totalRepayable = effectiveKisht * totalMonths;
  const totalPaidSoFar = effectiveKisht * Math.max(0, loan.currentMonth - 1);
  const remainingBalance = Math.max(0, totalRepayable - totalPaidSoFar);

  const timeline = getLoanTimeline(loan.currentMonth, totalMonths);
  const schedule = getInstallmentSchedule(loan.currentMonth, totalMonths);

  return (
    <div className="space-y-4 pb-20">
      {/* Top Passbook Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 border border-sky-800/50 px-2 py-0.5 rounded-full">
              {t.borrowerPassbook}
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              {loan.borrowerName}
            </h2>
            <p className="text-xs text-slate-400">
              Loan Account #{loan.id} • {effectiveRate}% Flat
            </p>
            {loan.borrowerAadhar && (
              <p className="text-[11px] text-amber-300 font-mono mt-0.5">
                Aadhaar: {loan.borrowerAadhar}
              </p>
            )}
          </div>

          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-1 rounded-full">
            Active
          </span>
        </div>

        {/* Big Installment Card */}
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 text-center mt-3">
          <span className="text-xs text-emerald-300 font-medium">{t.monthlyKisht}</span>
          <div className="text-3xl font-black text-white mt-1">
            {formatINR(effectiveKisht)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {t.dueOn10th}
          </span>
        </div>

        {/* Timeline Row */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80 font-medium">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span>{t.started}: <b className="text-white">{timeline.startMonth}</b></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>{t.ends}: <b className="text-white">{timeline.endMonth}</b></span>
          </div>
        </div>

        {/* Progress Bar & Remaining Kishts */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-400">{t.repaymentProgress}:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold">{loan.currentMonth} / {totalMonths} Mos</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60">
                {Math.max(0, totalMonths - loan.currentMonth)} Bachi (Remaining)
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
            <span>{t.paidSoFar}: <b className="text-slate-200">{formatINR(totalPaidSoFar)}</b></span>
            <span>Bachi Rashi (Remaining): <b className="text-emerald-400">{formatINR(remainingBalance)}</b></span>
          </div>
        </div>
      </div>

      {/* Guarantor Contact Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">{t.yourGuarantor}</span>
            <span className="text-sm font-bold text-white">{loan.guarantor}</span>
          </div>
        </div>

        <button
          onClick={() => alert(`Calling Guarantor: ${guarantorMember?.phone || '9800000000'}`)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
        >
          <Phone className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t.callGuarantor}</span>
        </button>
      </div>

      {/* Attached Security Documents / Signed Form */}
      {loan.documents && loan.documents.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
              <span>Signed Form & Security Documents ({loan.documents.length})</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {loan.documents.map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setViewingDoc(d)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200 hover:border-indigo-500 active:scale-95 transition"
              >
                <span className="truncate max-w-[150px]">{d.name}</span>
                <Eye className="w-3 h-3 text-sky-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 12-Month Calendar Schedule */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t.installmentReceipts}
          </span>
          <span className="text-[11px] text-slate-400">{totalMonths} Months Schedule</span>
        </div>

        <div className="space-y-1.5">
          {schedule.map((item) => {
            const isPaid = item.status === 'paid';
            const isCurrent = item.status === 'current';

            return (
              <div
                key={item.kishtNum}
                className={`border rounded-xl p-3 flex items-center justify-between text-xs transition ${
                  isPaid
                    ? 'bg-slate-900/60 border-emerald-900/30'
                    : isCurrent
                    ? 'bg-slate-900 border-amber-500/50 shadow-md shadow-amber-950/20'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    isPaid
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isCurrent
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isPaid ? '✓' : item.kishtNum}
                  </div>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>Kisht #{item.kishtNum}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({item.monthName})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      <span>{item.dueDate}</span>
                      {isPaid && <span className="text-emerald-400">• Paid via {loan.guarantor}</span>}
                      {isCurrent && <span className="text-amber-400 font-bold">• Due This Month</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-bold ${isPaid ? 'text-emerald-400' : isCurrent ? 'text-amber-400' : 'text-slate-400'}`}>
                    {formatINR(effectiveKisht)}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {isPaid ? `Receipt #${loan.id}-${item.kishtNum}` : isCurrent ? 'Action Pending' : 'Upcoming'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {viewingDoc && (
        <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
}
