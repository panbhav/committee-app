import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, X, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { formatINR } from '../../utils/loanCalculator';

export default function PendingLoanRequestsModal({ isOpen, onClose }) {
  const { loanRequests, approveLoanRequest, rejectLoanRequest, isSuperAdmin, getMemberLimits } = useApp();

  if (!isOpen) return null;

  const pendingList = loanRequests.filter(r => r.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Member Loan Requests ({pendingList.length})
            </h3>
            <p className="text-[10px] text-slate-400">Review, Approve or Reject member submissions</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
          {pendingList.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No pending loan applications from members.
            </div>
          ) : (
            pendingList.map(req => {
              const limits = getMemberLimits(req.requestedBy);
              const availableLimit = req.type === 'self' ? limits.selfLeft : limits.outerLeft;
              const isOverLimit = req.principal > availableLimit;

              return (
                <div
                  key={req.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                        req.type === 'self' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {req.type === 'self' ? 'SELF (10%)' : 'OUTER (16%)'}
                      </span>
                      <div className="font-bold text-sm text-white mt-1">
                        {req.borrowerName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Requested by Member: <b className="text-indigo-400">{req.requestedBy}</b>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-white">{formatINR(req.principal)}</span>
                      <span className="text-[10px] text-emerald-400 block font-semibold">{formatINR(req.monthlyKisht)}/mo</span>
                    </div>
                  </div>

                  {req.note && (
                    <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                      Reason: "{req.note}"
                    </div>
                  )}

                  {isOverLimit && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Exceeds {req.requestedBy}'s limit ({formatINR(availableLimit)} left)</span>
                    </div>
                  )}

                  {/* Actions for Super Admin */}
                  {isSuperAdmin ? (
                    <div className="pt-2 border-t border-slate-800 flex gap-2">
                      <button
                        onClick={() => rejectLoanRequest(req.id)}
                        className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center gap-1 text-[11px]"
                      >
                        <X className="w-3 h-3 text-red-400" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Approve ₹${req.principal.toLocaleString()} loan for ${req.borrowerName}?`)) {
                            approveLoanRequest(req.id);
                          }
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1 text-[11px] shadow"
                      >
                        <Check className="w-3 h-3" />
                        <span>Approve & Disburse</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 italic text-center">
                      Pending approval by Narendra / Harish
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
