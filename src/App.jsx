import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import MeetingCollection from './components/admin/MeetingCollection';
import MemberDashboard from './components/member/MemberDashboard';
import OuterPassbook from './components/outsider/OuterPassbook';
import AnnualMeetingModal from './components/admin/AnnualMeetingModal';
import DisburseLoanModal from './components/admin/DisburseLoanModal';
import MemberLoanRequestModal from './components/member/MemberLoanRequestModal';
import PendingLoanRequestsModal from './components/admin/PendingLoanRequestsModal';
import FundManagerModal from './components/admin/FundManagerModal';
import LoginScreen from './components/common/LoginScreen';
import ActivityLogsModal from './components/common/ActivityLogsModal';
import KishtProgressStepper from './components/common/KishtProgressStepper';
import { formatINR, getLoanTimeline } from './utils/loanCalculator';
import { Users, FileText, Plus, Search, Bell, Calendar, Building2, User, Send } from 'lucide-react';

export default function App() {
  const { currentUser, isSuperAdmin, loans, members, getMemberLimits, loanRequests, currentOuterLoanId, advanceAllActiveLoans, t } = useApp();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('comm_logged_in') === 'true';
  });

  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'loans' | 'limits' | 'annual'
  const [adminHomeView, setAdminHomeView] = useState('meeting'); // 'meeting' | 'member'
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);
  const [isMemberRequestOpen, setIsMemberRequestOpen] = useState(false);
  const [isPendingRequestsOpen, setIsPendingRequestsOpen] = useState(false);
  const [isFundManagerOpen, setIsFundManagerOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [showBahikhataModal, setShowBahikhataModal] = useState(false);
  const [loanSearch, setLoanSearch] = useState('');
  const [limitSearch, setLimitSearch] = useState('');


  // If not logged in, show LoginScreen
  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={() => {
          localStorage.setItem('comm_logged_in', 'true');
          setIsLoggedIn(true);
        }}
      />
    );
  }

  // If viewing as an Outsider (currentUser is null, but currentOuterLoanId is set)
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


  // Filter Loans by borrower or guarantor
  const filteredLoans = loans.filter(l =>
    l.borrowerName.toLowerCase().includes(loanSearch.toLowerCase()) ||
    l.guarantor.toLowerCase().includes(loanSearch.toLowerCase()) ||
    String(l.id).includes(loanSearch)
  );

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
          <>
            {/* If Super Admin, show View Switcher between Meeting Admin and My Member Dashboard */}
            {isSuperAdmin && (
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-3 shadow-lg">
                <button
                  onClick={() => setAdminHomeView('meeting')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    adminHomeView === 'meeting'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{t.tabMeeting} (Admin)</span>
                </button>
                <button
                  onClick={() => setAdminHomeView('member')}
                  className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    adminHomeView === 'member'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Loans ({currentUser?.name})</span>
                </button>
              </div>
            )}

            {isSuperAdmin && adminHomeView === 'meeting' ? (
              <>
                {/* Notification Banner if members have pending loan requests */}
                {loanRequests.filter(r => r.status === 'pending').length > 0 && (
                  <div
                    onClick={() => setIsPendingRequestsOpen(true)}
                    className="mb-3 bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/40 p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:border-amber-400 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs animate-bounce">
                        {loanRequests.filter(r => r.status === 'pending').length}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">New Member Loan Requests</span>
                        <span className="text-[10px] text-amber-300">Tap to review & approve</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-950 px-2 py-1 rounded-lg border border-amber-800">
                      Review →
                    </span>
                  </div>
                )}
                <MeetingCollection
                  onOpenNewLoan={() => setIsDisburseOpen(true)}
                  onOpenFundManager={() => setIsFundManagerOpen(true)}
                />
              </>
            ) : (
              <MemberDashboard
                onOpenNewLoan={() => setIsMemberRequestOpen(true)}
                onOpenLogs={() => setIsLogsOpen(true)}
                onOpenBahikhata={() => setShowBahikhataModal(true)}
              />
            )}
          </>
        )}




        {/* TAB 2: LOANS SCHEDULE */}
        {activeTab === 'loans' && (
          <div className="space-y-4 pb-20">
            <div className="flex justify-between items-center px-1">
              <div>
                <h2 className="text-lg font-bold text-white">{t.activeLoansRegister}</h2>
                <p className="text-xs text-slate-400">Total {loans.length} active loans</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      if (confirm('Kya aap sabhi active loans ki kisht +1 month aage badhana chahte hain (Advance all loans +1 Month)?')) {
                        advanceAllActiveLoans();
                      }
                    }}
                    className="bg-amber-950/70 hover:bg-amber-900/70 text-amber-300 border border-amber-800/60 text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow transition active:scale-95"
                    title="Advance all active loans by +1 month / सभी लोनों की 1 किश्त बढ़ाएं"
                  >
                    <span>⚡ Advance +1 Mo</span>
                  </button>
                )}
                <button
                  onClick={() => setIsMemberRequestOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request</span>
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => setIsDisburseOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.newLoan}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Loan Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchLoansPlaceholder}
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
                filteredLoans.map(l => {
                  const timeline = getLoanTimeline(l.currentMonth, l.totalMonths || 12);
                  return (
                    <div
                      key={l.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                            <span>#{l.id} {l.borrowerName}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              l.type === 'self' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}>
                              {l.type === 'self' ? `SELF ${l.rate}%` : `OUTER ${l.rate}%`} • {l.totalMonths || 12}m
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {t.guarantor}: <b className="text-slate-200">{l.guarantor}</b>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-indigo-300 mt-1 font-medium bg-slate-950/70 px-2 py-0.5 rounded-lg border border-slate-800/80 w-fit">
                            <Calendar className="w-2.5 h-2.5 text-indigo-400" />
                            <span>{timeline.startMonth} — {timeline.endMonth}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-300">Due: {timeline.nextDueDate}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-extrabold text-sm text-white">
                            {formatINR(l.monthlyKisht)} / mo
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {t.principal}: {formatINR(l.principal)}
                          </span>
                        </div>
                      </div>

                      {/* Smart Kisht Progress Stepper */}
                      <div className="pt-1.5 border-t border-slate-800/80">
                        <KishtProgressStepper loan={l} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LIMITS DIRECTORY */}
        {activeTab === 'limits' && (
          <div className="space-y-4 pb-20">
            <div>
              <h2 className="text-lg font-bold text-white">{t.memberRiskLimits}</h2>
              <p className="text-xs text-slate-400">Cap: ₹2L Personal • ₹8L Outer Guarantee</p>
            </div>

            {/* Quick Limit Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchLimitsPlaceholder}
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

      {/* Disburse Modal (Admin Direct) */}
      <DisburseLoanModal
        isOpen={isDisburseOpen}
        onClose={() => setIsDisburseOpen(false)}
      />

      {/* Member Loan Request Modal (For Any Member) */}
      <MemberLoanRequestModal
        isOpen={isMemberRequestOpen}
        onClose={() => setIsMemberRequestOpen(false)}
      />

      {/* Pending Requests Review Modal (For Super Admin) */}
      <PendingLoanRequestsModal
        isOpen={isPendingRequestsOpen}
        onClose={() => setIsPendingRequestsOpen(false)}
      />

      {/* Smart Fund & Liquidity Manager Modal */}
      <FundManagerModal
        isOpen={isFundManagerOpen}
        onClose={() => setIsFundManagerOpen(false)}
      />

      {/* Activity Logs Modal (Available to both Admins and Members) */}
      <ActivityLogsModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />

      {/* Full Committee Meeting Bahikhata Modal (For Members) */}
      {showBahikhataModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3 max-h-[88vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white">Full Committee Bahikhata</h3>
                <p className="text-[10px] text-slate-400">All 15 members' collection & status</p>
              </div>
              <button
                onClick={() => setShowBahikhataModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {members.map(m => {
                const bill = getMemberBill(m.name);
                const p = payments[m.id] || { status: 'pending', deposit: 0 };
                const isPaid = p.status === 'paid';

                return (
                  <div key={m.id} className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1">
                        {m.name}
                        {m.role === 'admin' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold">ADMIN</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Outer: ₹{bill.outerTotal.toLocaleString()} • Self: ₹{bill.selfTotal.toLocaleString()} • Unit: ₹{bill.monthlyUnit}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-white text-sm">₹{bill.totalDue.toLocaleString()}</div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isPaid ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isPaid ? '✓ PAID' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



