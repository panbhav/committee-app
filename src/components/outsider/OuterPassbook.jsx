import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/loanCalculator';
import { ShieldCheck, Phone, FileCheck2, AlertCircle } from 'lucide-react';

export default function OuterPassbook() {
  const { loans, currentOuterLoanId, members } = useApp();

  const loan = loans.find(l => l.id === currentOuterLoanId) || loans.find(l => l.type === 'outer');

  if (!loan) {
    return (
      <div className="p-8 text-center text-slate-400">
        No active outer loan found.
      </div>
    );
  }

  const guarantorMember = members.find(m => m.name === loan.guarantor);
  const progressPercent = Math.round((loan.currentMonth / loan.totalMonths) * 100);
  const totalRepayable = loan.monthlyKisht * loan.totalMonths;
  const totalPaidSoFar = loan.monthlyKisht * loan.currentMonth;
  const remainingBalance = Math.max(0, totalRepayable - totalPaidSoFar);

  return (
    <div className="space-y-4 pb-20">
      {/* Top Passbook Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 border border-sky-800/50 px-2 py-0.5 rounded-full">
              Borrower Passbook
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              {loan.borrowerName}
            </h2>
            <p className="text-xs text-slate-400">
              Loan Account #{loan.id} • 16% Flat
            </p>
          </div>

          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-1 rounded-full">
            Active
          </span>
        </div>

        {/* Big Installment Card */}
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 text-center mt-3">
          <span className="text-xs text-emerald-300 font-medium">Your Monthly Kisht (Installment)</span>
          <div className="text-3xl font-black text-white mt-1">
            {formatINR(loan.monthlyKisht)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Due on 10th of every month
          </span>
        </div>

        {/* 12-Month Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Repayment Progress:</span>
            <span className="text-white">Kisht {loan.currentMonth} of {loan.totalMonths} ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 pt-1">
            <span>Paid: <b className="text-slate-200">{formatINR(totalPaidSoFar)}</b></span>
            <span>Balance: <b className="text-emerald-400">{formatINR(remainingBalance)}</b></span>
          </div>
        </div>
      </div>

      {/* Guarantor Contact Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Your Committee Guarantor</span>
            <span className="text-sm font-bold text-white">{loan.guarantor}</span>
          </div>
        </div>

        <button
          onClick={() => alert(`Calling Guarantor: ${guarantorMember?.phone || '9800000000'}`)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
        >
          <Phone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Call</span>
        </button>
      </div>

      {/* Payment History Log */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
          Installment Receipts History
        </span>

        <div className="space-y-1.5">
          {Array.from({ length: loan.currentMonth }).map((_, idx) => {
            const kishtNum = idx + 1;
            return (
              <div
                key={kishtNum}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </div>
                  <div>
                    <div className="font-semibold text-white">Kisht #{kishtNum}</div>
                    <div className="text-[10px] text-slate-400">Cash deposited via {loan.guarantor}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-400">{formatINR(loan.monthlyKisht)}</span>
                  <span className="text-[10px] text-slate-500 block">Receipt #{loan.id}-{kishtNum}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
