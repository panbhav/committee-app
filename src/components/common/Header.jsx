import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, UserCheck, ChevronDown, RefreshCw, History } from 'lucide-react';
import ActivityLogsModal from './ActivityLogsModal';

export default function Header() {
  const {
    currentUser,
    setCurrentUser,
    members,
    loans,
    currentOuterLoanId,
    setCurrentOuterLoanId,
    isSuperAdmin,
    meetingMonth,
    resetToFactory,
    auditLogs
  } = useApp();

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

  // Outer loans list for switcher
  const outerLoans = loans.filter(l => l.type === 'outer');

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
              CA
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                Committee Portal
              </h1>
              <p className="text-[10px] font-medium text-slate-400">
                {meetingMonth}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Logs Button */}
            <button
              onClick={() => setShowLogsModal(true)}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 px-2.5 py-1.5 rounded-full text-xs font-semibold text-slate-200 transition"
              title="View Complete Activity Logs"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px]">{auditLogs.length}</span>
            </button>

            {/* Active User Switcher Pill */}
            <button
              onClick={() => setShowSwitchModal(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 px-2.5 py-1.5 rounded-full transition-all text-xs font-semibold text-slate-200"
            >
              {isSuperAdmin ? (
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  {currentUser?.name || 'Admin'}
                </span>
              ) : currentUser ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <UserCheck className="w-3.5 h-3.5" />
                  {currentUser.name}
                </span>
              ) : (
                <span className="text-sky-400">
                  Outsider View
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Activity Logs Modal */}
      <ActivityLogsModal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
      />

      {/* Role / User Switcher Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Switch Active Login</h3>
                <p className="text-xs text-slate-400">Test the app from different perspectives</p>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-xs text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg"
              >
                Close
              </button>
            </div>

            {/* 1. Super Admins */}
            <div>
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                2 Super Admins (Full Edit Access)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {members.filter(m => m.name === 'NARENDRA' || m.name === 'HARISH').map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setCurrentUser(m);
                      setShowSwitchModal(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition text-xs font-bold ${
                      currentUser?.id === m.id
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    👑 {m.name}
                    <span className="block text-[10px] font-normal text-slate-400">Super Admin</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Core 15 Members */}
            <div>
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                Committee Members (Read-Only Portal)
              </div>
              <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                {members.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setCurrentUser(m);
                      setShowSwitchModal(false);
                    }}
                    className={`p-2 rounded-lg text-left text-xs font-semibold truncate transition ${
                      currentUser?.id === m.id
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Outer Borrowers */}
            <div>
              <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-2">
                Outer Borrowers (Passbook Only)
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
                {outerLoans.slice(0, 8).map(l => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setCurrentUser(null);
                      setCurrentOuterLoanId(l.id);
                      setShowSwitchModal(false);
                    }}
                    className={`w-full p-2 rounded-lg text-left text-xs flex justify-between items-center transition ${
                      !currentUser && currentOuterLoanId === l.id
                        ? 'bg-sky-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>#{l.id} {l.borrowerName}</span>
                    <span className="text-[10px] opacity-75">Guarantor: {l.guarantor}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Factory Reset */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">Reset demo state:</span>
              <button
                onClick={() => {
                  if (confirm("Reset data back to September defaults?")) {
                    resetToFactory();
                    setShowSwitchModal(false);
                  }
                }}
                className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 bg-red-950/40 border border-red-900/50 px-2.5 py-1 rounded-lg"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
