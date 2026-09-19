import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Phone, Shield, UserCheck, ArrowRight, Sparkles, AlertCircle, CheckCircle2, MessageSquare, RotateCcw } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const { members, loans, setCurrentUser, setCurrentOuterLoanId, t, language, setLanguage } = useApp();

  // Step 1: 'phone' | Step 2: 'otp'
  const [step, setStep] = useState('phone');
  const [mobileNumber, setMobileNumber] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [targetAccount, setTargetAccount] = useState(null); // { type: 'member'|'outer', data: ... }
  const [errorMsg, setErrorMsg] = useState('');
  const [otpSentNotification, setOtpSentNotification] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    let timer;
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  // Handle Fast Demo Login (1-Tap bypass for testing)
  const handleFastLogin = (identifier, type = 'member') => {
    if (type === 'admin') {
      const adminMember = members.find(m => m.name === 'NARENDRA') || members.find(m => m.phone === '8219352124');
      setCurrentUser(adminMember);
      onLoginSuccess();
    } else if (type === 'member') {
      const member = members.find(m => m.name === identifier || m.phone === identifier);
      setCurrentUser(member);
      onLoginSuccess();
    } else if (type === 'outer') {
      setCurrentUser(null);
      setCurrentOuterLoanId(identifier);
      onLoginSuccess();
    }
  };

  // Step 1: Send OTP
  const handleRequestOtp = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanInput = mobileNumber.trim();

    if (!cleanInput) {
      setErrorMsg(language === 'hi' ? 'कृपया मोबाइल नंबर दर्ज करें' : 'Please enter your mobile number');
      return;
    }

    // 1. Check if matches Core Committee Member
    const matchedMember = members.find(
      m => m.phone === cleanInput || m.name.toLowerCase() === cleanInput.toLowerCase()
    );

    if (matchedMember) {
      const code = '1234'; // Standard predictable test OTP
      setGeneratedOtp(code);
      setTargetAccount({ type: 'member', data: matchedMember });
      setStep('otp');
      setOtpSentNotification(true);
      setCountdown(30);
      return;
    }

    // 2. Check if matches Outer Borrower
    const matchedOuter = loans.find(
      l => l.type === 'outer' && (
        l.borrowerPhone === cleanInput ||
        l.borrowerName.toLowerCase() === cleanInput.toLowerCase() ||
        l.id.toString() === cleanInput
      )
    );

    if (matchedOuter) {
      const code = '1234';
      setGeneratedOtp(code);
      setTargetAccount({ type: 'outer', data: matchedOuter });
      setStep('otp');
      setOtpSentNotification(true);
      setCountdown(30);
      return;
    }

    setErrorMsg(
      language === 'hi'
        ? 'मोबाइल नंबर या लोन आईडी नहीं मिला। परीक्षण हेतु 8219352124 (नरेंद्र) या 6378021059 (अवनिष) का उपयोग करें।'
        : 'Mobile number or Loan ID not found. For testing, use 8219352124 (Narendra) or 6378021059 (Avnish).'
    );
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (enteredOtp !== generatedOtp && enteredOtp !== '1234') {
      setErrorMsg(t.invalidOtp);
      return;
    }

    if (targetAccount.type === 'member') {
      setCurrentUser(targetAccount.data);
      onLoginSuccess();
    } else if (targetAccount.type === 'outer') {
      setCurrentUser(null);
      setCurrentOuterLoanId(targetAccount.data.id);
      onLoginSuccess();
    }
  };

  const handleAutoFillOtp = () => {
    setEnteredOtp(generatedOtp);
    setErrorMsg('');
  };

  const handleResendOtp = () => {
    const code = '1234';
    setGeneratedOtp(code);
    setEnteredOtp('');
    setOtpSentNotification(true);
    setCountdown(30);
    setErrorMsg('');
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setEnteredOtp('');
    setErrorMsg('');
    setOtpSentNotification(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
      {/* Top Language Toggle */}
      <div className="flex justify-end mb-3">
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-full p-0.5 text-xs font-semibold shadow">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded-full transition ${language === 'en' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            ENG
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`px-3 py-1 rounded-full transition ${language === 'hi' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            हिंदी
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 mx-auto flex items-center justify-center text-slate-950 text-2xl font-black shadow-lg shadow-emerald-900/30">
            💰
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            {step === 'phone' ? t.loginHeaderTitle : t.enterOtpTitle}
          </h1>
          <p className="text-xs text-slate-400">
            {step === 'phone' ? t.loginHeaderSubtitle : `${t.enterOtpSubtitle} +91 ${mobileNumber}`}
          </p>
        </div>

        {/* STEP 1: Phone Number Input */}
        {step === 'phone' && (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">
                {t.inputPhoneLabel}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder={language === 'hi' ? 'उदा. 8219352124 या 6378021059' : 'e.g. 8219352124 or 6378021059'}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition"
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
              <span>{t.sendOtpBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification Screen */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            {/* Simulated Live SMS Notification Toast */}
            {otpSentNotification && (
              <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-3 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold block text-[11px]">
                      {language === 'hi' ? 'एसएमएस प्राप्त हुआ:' : 'Simulated SMS Received:'}
                    </span>
                    <span className="text-xs font-mono font-bold tracking-wider text-white">
                      OTP: {generatedOtp}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillOtp}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg shadow transition active:scale-95"
                >
                  {t.autoFillOtp}
                </button>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-300 font-semibold">
                  {t.otpLabel}
                </label>
                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>{t.changePhone}</span>
                </button>
              </div>

              <input
                type="text"
                required
                maxLength="4"
                autoFocus
                placeholder="• • • •"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 text-center text-white text-2xl font-black tracking-[0.5em] font-mono focus:outline-none focus:border-emerald-500 transition"
              />
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
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.verifyOtpBtn}</span>
            </button>

            {/* Resend Link */}
            <div className="text-center pt-1">
              {countdown > 0 ? (
                <span className="text-[11px] text-slate-500">
                  {language === 'hi' ? `पुनः भेजें (${countdown}s)` : `Resend code in ${countdown}s`}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.resendOtp}</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* 1-Tap Quick Fast Login for Instant Testing */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span>⚡ {t.quickDemoLabel}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Narendra Admin Button */}
            <button
              onClick={() => {
                setMobileNumber('8219352124');
                handleFastLogin('NARENDRA', 'admin');
              }}
              className="p-2 rounded-xl border border-amber-500/40 bg-amber-950/20 hover:bg-amber-900/30 text-amber-300 text-left transition active:scale-98"
            >
              <Shield className="w-3.5 h-3.5 mb-1 text-amber-400" />
              <div className="font-bold text-xs">NARENDRA (Admin)</div>
              <span className="text-[10px] text-slate-400 font-mono block">8219352124</span>
            </button>

            {/* Mahendra Admin Button */}
            <button
              onClick={() => {
                setMobileNumber('9800000004');
                handleFastLogin('MAHENDRA', 'admin');
              }}
              className="p-2 rounded-xl border border-amber-500/40 bg-amber-950/20 hover:bg-amber-900/30 text-amber-300 text-left transition active:scale-98"
            >
              <Shield className="w-3.5 h-3.5 mb-1 text-amber-400" />
              <div className="font-bold text-xs">MAHENDRA (Admin)</div>
              <span className="text-[10px] text-slate-400 font-mono block">9800000004</span>
            </button>

            {/* Naresh Admin Button */}
            <button
              onClick={() => {
                setMobileNumber('9800000007');
                handleFastLogin('NARESH', 'admin');
              }}
              className="p-2 rounded-xl border border-amber-500/40 bg-amber-950/20 hover:bg-amber-900/30 text-amber-300 text-left transition active:scale-98"
            >
              <Shield className="w-3.5 h-3.5 mb-1 text-amber-400" />
              <div className="font-bold text-xs">NARESH (Admin)</div>
              <span className="text-[10px] text-slate-400 font-mono block">9800000007</span>
            </button>

            {/* Avnish Member Button */}
            <button
              onClick={() => {
                setMobileNumber('6378021059');
                handleFastLogin('AVNISH', 'member');
              }}
              className="p-2 rounded-xl border border-indigo-500/40 bg-indigo-950/20 hover:bg-indigo-900/30 text-indigo-300 text-left transition active:scale-98"
            >
              <UserCheck className="w-3.5 h-3.5 mb-1 text-indigo-400" />
              <div className="font-bold text-xs">AVNISH (Member)</div>
              <span className="text-[10px] text-slate-400 font-mono block">6378021059</span>
            </button>

            {/* Outer Borrower Testing Button */}
            <button
              onClick={() => handleFastLogin(408, 'outer')}
              className="col-span-2 p-2 rounded-xl border border-sky-800/50 bg-sky-950/20 hover:bg-sky-900/30 text-sky-300 text-left transition active:scale-98 flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-[11px]">SANJU SAINI (Outsider Borrower)</div>
                <span className="text-[9px] text-slate-400 block">Digital Passbook #408</span>
              </div>
              <span className="text-xs text-sky-400 font-bold">View Passbook →</span>
            </button>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-500">
          {t.privateNetworkNote}
        </div>
      </div>
    </div>
  );
}
