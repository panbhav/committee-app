import Modal from './Modal';
import React, { useState } from 'react';
import { useApp } from '../../context/useApp';
import { Landmark, ChevronDown, History, LogOut, X, Globe2, ShieldCheck } from 'lucide-react';
import ActivityLogsModal from './ActivityLogsModal';
import { DEMO_MODE } from '../../config';

export default function Header() {
  const { currentUser, setCurrentUser, setCurrentOuterLoanId, members, loans, isSuperAdmin, meetingMonth, AVAILABLE_MONTHS, changeMeetingMonth, lang, toggleLanguage, cloudSyncStatus } = useApp();
  const [showAccount, setShowAccount] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const logout = () => {
    localStorage.removeItem('comm_logged_in');
    localStorage.removeItem('comm_current_user');
    localStorage.removeItem('comm_outer_loan_id');
    window.location.reload();
  };
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="app-header">
      <div className="brand"><span className="brand-mark"><Landmark size={23} strokeWidth={1.8} /></span><div><h1>Banking Society</h1><p>{lang === 'hi' ? 'साथ बचाएं, साथ बढ़ें' : 'GROWING TOGETHER'}</p></div></div>
      <div className="header-actions">
        <span className="sync-badge" title={cloudSyncStatus === 'local' ? 'Demo data is saved in this browser only' : 'Cloud connection status'}><i className={cloudSyncStatus === 'connected' ? 'live' : ''} />{cloudSyncStatus === 'local' ? 'Local demo' : cloudSyncStatus === 'connected' ? 'Live' : cloudSyncStatus === 'connecting' ? 'Connecting' : 'Offline'}</span>
        <button className="header-icon" onClick={toggleLanguage} aria-label="Switch language"><Globe2 size={16} /><span>{lang === 'hi' ? 'EN' : 'हिंदी'}</span></button>
        {currentUser && <button className="header-icon history-button" onClick={() => setShowLogs(true)} aria-label="Activity history"><History size={18} /></button>}
        <button className="account-button" onClick={() => setShowAccount(true)} aria-label="Open account menu"><span className="avatar">{currentUser?.name?.slice(0, 1) || 'B'}</span><span className="account-name">{currentUser?.name || 'Passbook'}<small>{isSuperAdmin ? 'Administrator' : currentUser ? 'Member' : 'Borrower'}</small></span><ChevronDown size={14} /></button>
      </div>
    </header>
    {currentUser && <ActivityLogsModal isOpen={showLogs} onClose={() => setShowLogs(false)} />}
    {showAccount && <Modal onClose={() => setShowAccount(false)} label="Your account" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <section aria-labelledby="account-title" className="account-panel" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-5"><h2 id="account-title" className="text-lg font-bold">{lang === 'hi' ? 'आपका खाता' : 'Your account'}</h2><button onClick={() => setShowAccount(false)} aria-label="Close account menu" className="header-icon"><X size={19} /></button></div>
        <div className="flex gap-3 items-center mb-5"><span className="avatar large">{currentUser?.name?.slice(0, 1) || 'B'}</span><div className="text-sm font-semibold">{currentUser?.name || 'Borrower passbook'}<p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><ShieldCheck size={13} />{isSuperAdmin ? 'Administrator' : 'Member account'}</p></div></div>
        <label className="block text-xs text-slate-400 mb-2" htmlFor="account-month">Meeting month</label>
        <select id="account-month" value={meetingMonth} onChange={event => changeMeetingMonth(event.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm mb-5">{AVAILABLE_MONTHS.map(month => <option key={month}>{month}</option>)}</select>
        {DEMO_MODE && <><p className="eyebrow mb-3">EXPLORE DEMO ACCOUNTS</p><div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto mb-4">{members.map(member => <button key={member.id} onClick={() => { setCurrentUser(member); setCurrentOuterLoanId(null); setShowAccount(false); }} className="bg-slate-800 hover:bg-emerald-900 rounded-lg p-2 text-[11px] text-left truncate">{member.name}</button>)}</div><button onClick={() => { setCurrentUser(null); setCurrentOuterLoanId(loans.find(loan => loan.type === 'outer')?.id ?? null); setShowAccount(false); }} className="text-sm text-emerald-300 mb-5">Explore borrower passbook →</button></>}
        <button onClick={logout} className="w-full border border-slate-700 rounded-xl p-3 text-sm flex items-center justify-center gap-2 hover:bg-slate-800"><LogOut size={16} />{lang === 'hi' ? 'लॉग आउट' : 'Sign out'}</button>
      </section>
    </Modal>}
  </>;
}
