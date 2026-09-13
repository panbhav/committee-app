import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Phone, KeyRound, Shield, UserCheck, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const { members, loans, setCurrentUser, setCurrentOuterLoanId, t } = useApp();

  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Quick Demo Fast-Login buttons
  const handleFastLogin = (identifier, type = 'member') => {
    if (type === 'admin') {
      const adminMember = members.find(m => m.name === 'NARENDRA');
      setCurrentUser(adminMember);
      onLoginSuccess();
    } else if (type === 'member') {
      const member = members.find(m => m.name === identifier);
      setCurrentUser(member);
      onLoginSuccess();
    } else if (type === 'outer') {
      setCurrentUser(null);
      setCurrentOuterLoanId(identifier); // loan ID
      onLoginSuccess();
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanPhone = mobileNumber.trim();

    // 1. Check if number matches one of the 15 Core Members
    const matchedMember = members.find(m => m.phone === cleanPhone || m.name.toLowerCase() === cleanPhone.toLowerCase());

    if (matchedMember) {
      // Default demo PIN is 1234 or empty
      if (pin && pin !== '1234') {
        setErrorMsg('Invalid PIN. (Default demo PIN is 1234)');
        return;
      }
      setCurrentUser(matchedMember);
      onLoginSuccess();
      return;
    }

    // 2. Check if number or name matches an Outer Borrower
    const matchedOuter = loans.find(
      l => l.type === 'outer' && (l.borrowerPhone === cleanPhone || l.borrowerName.toLowerCase() === cleanPhone.toLowerCase() || l.id.toString() === cleanPhone)
    );

    if (matchedOuter) {
      setCurrentUser(null); // Outsider has no committee partner record
      setCurrentOuterLoanId(matchedOuter.id);
      onLoginSuccess();
      return;
    }

    setErrorMsg('Mobile number or Loan ID not found in committee records. Please check or use quick login below.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 mx-auto flex items-center justify-center text-slate-950 text-2xl font-black shadow-lg shadow-emerald-900/30">
            💰
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Committee Portal Login
          </h1>
          <p className="text-xs text-slate-400">
            Enter your registered Mobile Number or Loan ID
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              Mobile Number / Member Name / Loan ID:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. 9800000003 or HARISH or 408"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-slate-300 font-semibold">
                Security PIN (Optional for Demo):
              </label>
              <span className="text-[10px] text-slate-500">Default: 1234</span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength="4"
                placeholder="4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-white text-sm tracking-widest font-mono focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-950/40 border border-red-800/50 p-3 rounded-xl flex items-start gap-2 text-red-300 text-[11px]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-98 transition text-sm"
          >
            <span>Login to Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Tap Quick Fast Login for Instant Testing */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span>⚡ 1-Tap Quick Demo Login:</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleFastLogin('NARENDRA', 'admin')}
              className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-950/20 hover:bg-amber-900/30 text-amber-300 text-left transition"
            >
              <Shield className="w-3.5 h-3.5 mb-1 text-amber-400" />
              <div className="font-bold text-xs">NARENDRA</div>
              <span className="text-[9px] text-slate-400 block">Super Admin</span>
            </button>

            <button
              onClick={() => handleFastLogin('HARISH', 'member')}
              className="p-2.5 rounded-xl border border-indigo-500/40 bg-indigo-950/20 hover:bg-indigo-900/30 text-indigo-300 text-left transition"
            >
              <UserCheck className="w-3.5 h-3.5 mb-1 text-indigo-400" />
              <div className="font-bold text-xs">HARISH</div>
              <span className="text-[9px] text-slate-400 block">Member (12 loans)</span>
            </button>

            <button
              onClick={() => handleFastLogin(408, 'outer')}
              className="p-2.5 rounded-xl border border-sky-500/40 bg-sky-950/20 hover:bg-sky-900/30 text-sky-300 text-left transition"
            >
              <Sparkles className="w-3.5 h-3.5 mb-1 text-sky-400" />
              <div className="font-bold text-xs">SANJU #408</div>
              <span className="text-[9px] text-slate-400 block">Outer Passbook</span>
            </button>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-500">
          🔒 Committee Private Network • Role detected automatically
        </div>
      </div>
    </div>
  );
}
