import React from 'react';
import { Lock, AlertTriangle, ShieldAlert, RefreshCw } from 'lucide-react';

export default function SubscriptionLockScreen({
  title = "Subscription Expired / सेवा निलंबित",
  message = "The annual software license & server maintenance for Banking Society has expired. Access to all member accounts, records, and meeting collections has been temporarily suspended.",
  subMessage = "Kripya portal re-activation ke liye software administrator / developer se sampark karein."
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background ambient red/amber glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-slate-900/90 border border-red-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md text-center relative z-10 space-y-5">
        {/* Animated Security Lock Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping opacity-40" />
          <button
            type="button"
            className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-red-950 to-red-900 border border-red-500/50 flex items-center justify-center text-red-400 shadow-lg cursor-pointer active:scale-95 transition"
            title="Banking Society Security Gate"
          >
            <Lock className="w-9 h-9" />
          </button>
        </div>

        {/* Status Badge */}
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-red-400 bg-red-950/80 border border-red-800/60 px-3 py-1 rounded-full shadow-inner">
            <ShieldAlert className="w-3.5 h-3.5" />
            Portal Suspended
          </span>
          <h2 className="text-xl font-black text-white mt-3 tracking-tight">
            {title}
          </h2>
        </div>

        {/* Detailed Explanation */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-300 space-y-2.5 leading-relaxed text-left">
          <div className="flex items-start gap-2 text-amber-400 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Annual License Expired (वार्षिक लाइसेंस समाप्त)</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {message}
          </p>
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-300/90 font-medium">
            💡 {subMessage}
          </div>
        </div>

        {/* Status Check / Refresh Button */}
        <div className="pt-1 space-y-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Renewal Status (रिफ्रेश करें)</span>
          </button>
        </div>


        <div className="pt-3 border-t border-slate-800/80 text-center">
            <p className="text-[10px] text-slate-500">
              Designed &amp; Developed by{' '}
              <a
                href="https://pixeltocloud.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-bold underline decoration-emerald-500/40 underline-offset-2"
              >
                PixelToCloud
              </a>{' '}
              (pixeltocloud.com)
            </p>
          </div>
        </div>
      </div>
    );
  }