import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import MeetingCollection from './components/admin/MeetingCollection';
import MemberDashboard from './components/member/MemberDashboard';
import OuterPassbook from './components/outsider/OuterPassbook';
import AnnualMeetingModal from './components/admin/AnnualMeetingModal';
import DisburseLoanModal from './components/admin/DisburseLoanModal';
import { formatINR } from './utils/loanCalculator';
import { Users, FileText, Plus, Search } from 'lucide-react';

export default function App() {
  const { currentUser, isSuperAdmin, loans, members, getMemberLimits } = useApp();
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'loans' | 'limits' | 'annual'
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);
  const [loanSearch, setLoanSearch] = useState('');
  const [limitSearch, setLimitSearch] = useState('');

  // If viewing as an Outsider (currentUser is null)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative border-x border-slate-900 shadow-2xl">
        <Header />
        <main className="flex-1 p-4">
          <OuterPassbook />
        </main>
      </div>
    );
  }

  // Filter Loans by loan ID, borrower name, or guarantor
  const filteredLoans = loans.filter(l => {
    const q = loanSearch.toLowerCase();
    return (
      l.id.toString().includes(q) ||
      l.borrowerName.toLowerCase().includes(q) ||
      l.guarantor.toLowerCase().includes(q)
    );
  });

  // Filter Members by name
  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(limitSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative border-x border-slate-900 shadow-2xl">
      <Header />

      <main className="flex-1 p-4 overflow-y-auto">
        {/* TAB 1: HOME / MEETING */}
        {activeTab === 'home' && (
          isSuperAdmin ? (
            <MeetingCollection onOpenNewLoan={() => setIsDisburseOpen(true)} />
          ) : (
            <MemberDashboard onOpenNewLoan={() => setIsDisburseOpen(true)} />
          )
        )}

        {/* TAB 2: LOANS SCHEDULE */}
        {activeTab === 'loans' && (
          <div className="space-y-4 pb-20">
            <div className="flex justify-between items-center px-1">
              <div>
                <h2 className="text-lg font-bold text-white">Active Loans Register</h2>
                <p className="text-xs text-slate-400">Total {loans.length} active loans (12 Kishts)</p>
              </div>
              {isSuperAdmin && (
                <button
                  onClick={() => setIsDisburseOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Loan</span>
                </button>
              )}
            </div>

            {/* Quick Loan Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by loan # (e.g. 408), borrower, or guarantor..."
                value={loanSearch}
                onChange={(e) => setLoanSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              {loanSearch && (
                <button
                  onClick={() => setLoanSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="space-y-2">
              {filteredLoans.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
                  No loans found matching "{loanSearch}".
                </div>
              ) : (
                filteredLoans.map(l => (
                  <div
                    key={l.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                        <span>#{l.id} {l.borrowerName}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          l.type === 'self' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {l.type === 'self' ? 'SELF 10%' : 'OUTER 16%'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Guarantor: <b className="text-slate-200">{l.guarantor}</b> • Month: <b className="text-emerald-400">{l.currentMonth}/12</b>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-sm text-white">
                        {formatINR(l.monthlyKisht)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Principal: {formatINR(l.principal)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LIMITS DIRECTORY */}
        {activeTab === 'limits' && (
          <div className="space-y-4 pb-20">
            <div>
              <h2 className="text-lg font-bold text-white">15 Member Risk Limits</h2>
              <p className="text-xs text-slate-400">Cap: ₹2L Personal • ₹8L Outer Guarantee</p>
            </div>

            {/* Quick Limit Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member limits (e.g. Avnish, Satish)..."
                value={limitSearch}
                onChange={(e) => setLimitSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              {limitSearch && (
                <button
                  onClick={() => setLimitSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {filteredMembers.map(m => {
                const limits = getMemberLimits(m.name);
                const selfPct = Math.min(100, Math.round((limits.selfUsed / limits.memberLimit) * 100));
                const outerPct = Math.min(100, Math.round((limits.outerUsed / limits.outerLimit) * 100));

                return (
                  <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        {m.name}
                        {m.role === 'admin' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">ID #{m.id}</span>
                    </div>

                    {/* Self Meter */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5 text-slate-300">
                        <span>Personal: {formatINR(limits.selfUsed)}</span>
                        <span className="text-emerald-400 font-semibold">{formatINR(limits.selfLeft)} Left</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${selfPct}%` }} />
                      </div>
                    </div>

                    {/* Outer Meter */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5 text-slate-300">
                        <span>Outer Guarantees: {formatINR(limits.outerUsed)}</span>
                        <span className="text-amber-400 font-semibold">{formatINR(limits.outerLeft)} Left</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${outerPct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ANNUAL MEETING FEB */}
        {activeTab === 'annual' && (
          <AnnualMeetingModal />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Disburse Modal */}
      <DisburseLoanModal
        isOpen={isDisburseOpen}
        onClose={() => setIsDisburseOpen(false)}
      />
    </div>
  );
}
