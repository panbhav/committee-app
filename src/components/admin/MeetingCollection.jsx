import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/loanCalculator';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { CheckCircle2, Clock, AlertCircle, PlusCircle, CheckCheck, FileSpreadsheet, FileDown, Search } from 'lucide-react';

export default function MeetingCollection({ onOpenNewLoan }) {
  const {
    members,
    loans,
    payments,
    meetingMonth,
    getMemberBill,
    getMeetingStats,
    getMemberLimits,
    toggleMemberPaid,
    recordPartialPayment,
    markAllPaid,
    isSuperAdmin,
    t,
  } = useApp();


  const [activeModalMember, setActiveModalMember] = useState(null);
  const [shortInput, setShortInput] = useState('');
  const [extraInput, setExtraInput] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'paid'
  const [searchQuery, setSearchQuery] = useState('');

  const stats = getMeetingStats();

  const handleSavePartial = () => {
    if (!activeModalMember) return;
    const bill = getMemberBill(activeModalMember.name);
    const short = Number(shortInput) || 0;
    const extra = Number(extraInput) || 0;
    const deposit = bill.totalDue - short + extra;
    recordPartialPayment(activeModalMember.id, deposit, short, extra);
    setActiveModalMember(null);
    setShortInput('');
    setExtraInput('');
  };

  // Filter & Search Logic
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const p = payments[m.id];
    const isPaid = p && (p.status === 'paid' || p.status === 'short');
    if (filter === 'paid') return isPaid;
    if (filter === 'pending') return !isPaid;
    return true;
  });

  const handleExportExcel = () => {
    exportToExcel({ members, loans, payments, meetingMonth, getMemberBill, getMemberLimits });
  };

  const handleExportPDF = () => {
    exportToPDF({ members, loans, payments, meetingMonth, getMemberBill });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Meeting Overview Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              {t.meetingCashflow}
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {formatINR(stats.totalExpected)}
            </div>
            <span className="text-xs text-slate-400">{t.totalExpectedMonthlyCollection}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isSuperAdmin && (
              <button
                onClick={onOpenNewLoan}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-2xl flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 active:scale-95 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t.newLoan}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mini Stats Bar */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block font-medium">{t.collectedSoFar}:</span>
            <span className="text-sm font-bold text-emerald-400">{formatINR(stats.totalCollected)}</span>
            <span className="text-[10px] text-slate-500 block">{stats.paidCount} / 15 {t.filterPaid}</span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block font-medium">{t.pendingRecovery}:</span>
            <span className="text-sm font-bold text-amber-400">{formatINR(Math.max(0, stats.totalExpected - stats.totalCollected))}</span>
            <span className="text-[10px] text-slate-500 block">{stats.pendingCount} {t.filterPending}</span>
          </div>
        </div>

        {/* Action Row: Export Buttons + Mark All Paid */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => {
                if (confirm('Mark all 15 members as fully paid for September?')) {
                  markAllPaid();
                }
              }}
              className="w-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.markAllPaid}</span>
            </button>
          )}

          {/* Bahikhata Export Buttons (Available to All!) */}
          <div className="flex w-full gap-2">
            <button
              onClick={handleExportExcel}
              className="flex-1 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/50 text-emerald-300 text-[11px] font-bold py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.downloadExcel}</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 bg-sky-950/50 hover:bg-sky-900/50 border border-sky-800/50 text-sky-300 text-[11px] font-bold py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-400" />
              <span>{t.downloadPDF}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t.searchMemberPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>


      {/* Filter Tabs */}
      <div className="flex items-center justify-between px-1">
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${filter === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400'}`}
          >
            All (15)
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${filter === 'pending' ? 'bg-amber-600 text-white shadow' : 'text-slate-400'}`}
          >
            Pending ({stats.pendingCount})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${filter === 'paid' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'}`}
          >
            Paid ({stats.paidCount})
          </button>
        </div>

        <span className="text-[11px] text-slate-400">
          {filteredMembers.length} displayed
        </span>
      </div>

      {/* Member Collection Cards */}
      <div className="space-y-2.5">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
            No members found matching "{searchQuery}".
          </div>
        ) : (
          filteredMembers.map(m => {
            const bill = getMemberBill(m.name);
            const p = payments[m.id] || { status: 'pending', shortAmount: 0, extraAmount: 0, deposit: 0 };
            const isPaid = p.status === 'paid';
            const isShort = p.status === 'short';

            return (
              <div
                key={m.id}
                className={`border rounded-2xl p-3.5 transition-all ${
                  isPaid
                    ? 'bg-slate-900/60 border-emerald-900/40'
                    : isShort
                    ? 'bg-slate-900 border-amber-900/50'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs ${
                      isPaid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {m.name.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        {m.name}
                        {m.role === 'admin' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-500/30">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Outer: <span className="text-slate-300 font-medium">{formatINR(bill.outerTotal)}</span> • Self: <span className="text-slate-300 font-medium">{formatINR(bill.selfTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Paid
                      </span>
                    ) : isShort ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" /> Short: {formatINR(p.shortAmount)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action / Details Row */}
                <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Total Payable:</span>
                    <span className="text-base font-extrabold text-white">{formatINR(bill.totalDue)}</span>
                  </div>

                  {/* Action Buttons for Super Admins */}
                  {isSuperAdmin ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleMemberPaid(m.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition active:scale-95 ${
                          isPaid
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
                        }`}
                      >
                        {isPaid ? 'Undo' : 'Mark Paid'}
                      </button>

                      <button
                        onClick={() => {
                          setActiveModalMember(m);
                          setShortInput('');
                          setExtraInput('');
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-[11px]"
                        title="Record Short / Extra"
                      >
                        Short/Extra
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      Unit: {formatINR(bill.monthlyUnit)} included
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Partial / Short Modal */}
      {activeModalMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">
                Record Short or Extra: {activeModalMember.name}
              </h3>
              <button
                onClick={() => setActiveModalMember(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Total Expected Bill: <span className="font-bold text-white">{formatINR(getMemberBill(activeModalMember.name).totalDue)}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Short Amount (Kam Diya):
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={shortInput}
                  onChange={(e) => setShortInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Extra Amount (Zyada Diya / Advance):
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={extraInput}
                  onChange={(e) => setExtraInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveModalMember(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePartial}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
