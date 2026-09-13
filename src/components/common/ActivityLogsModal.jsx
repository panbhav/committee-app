import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { History, Undo2, UserCheck, Shield, Clock, AlertCircle } from 'lucide-react';

export default function ActivityLogsModal({ isOpen, onClose }) {
  const { auditLogs, rollbackAction, isSuperAdmin } = useApp();
  const [filter, setFilter] = useState('all'); // 'all' | 'payments' | 'loans'

  if (!isOpen) return null;

  const filteredLogs = auditLogs.filter(log => {
    if (filter === 'payments') return log.action.includes('PAID') || log.action.includes('PARTIAL');
    if (filter === 'loans') return log.action.includes('LOAN');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Transparent Activity Logs</h3>
              <p className="text-[10px] text-slate-400">Complete audit trail visible to all members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs flex-shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1 rounded-lg font-bold transition ${filter === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400'}`}
          >
            All Logs ({auditLogs.length})
          </button>
          <button
            onClick={() => setFilter('payments')}
            className={`flex-1 py-1 rounded-lg font-bold transition ${filter === 'payments' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}
          >
            Payments
          </button>
          <button
            onClick={() => setFilter('loans')}
            className={`flex-1 py-1 rounded-lg font-bold transition ${filter === 'loans' ? 'bg-amber-600 text-white shadow' : 'text-slate-400'}`}
          >
            Loans
          </button>
        </div>

        {/* Log Entries List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No activity recorded under this filter.
            </div>
          ) : (
            filteredLogs.map(log => {
              const isRollback = log.action === 'ROLLBACK';
              const isPayment = log.action.includes('PAID') || log.action.includes('PARTIAL');
              const isLoan = log.action.includes('LOAN');

              return (
                <div
                  key={log.id}
                  className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 text-xs space-y-1.5 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 rounded font-black text-[9px] uppercase tracking-wider ${
                        isRollback ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                        isLoan ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        isPayment ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-[11px] font-bold text-white flex items-center gap-1">
                        By: <b className="text-slate-200">{log.actor}</b>
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.timestamp}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {log.details}
                  </p>

                  {/* Undo Button (Super Admins Only) */}
                  {log.canRollback && isSuperAdmin && (
                    <div className="pt-1.5 border-t border-slate-800/80 flex justify-end">
                      <button
                        onClick={() => {
                          if (confirm(`Do you want to undo this action?\n\n"${log.details}"`)) {
                            rollbackAction(log);
                          }
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded-lg active:scale-95 transition"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Undo / Revert This Action</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="text-center pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex-shrink-0">
          🔒 Tamper-evident audit trail • Every change records who & when
        </div>
      </div>
    </div>
  );
}
