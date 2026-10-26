import React from 'react';
import { Sparkles, ArrowUpRight, Globe } from 'lucide-react';

export default function AppFooter({ className = "" }) {
  return (
    <footer className={`mt-10 mb-6 pt-6 border-t border-slate-800/80 text-center select-none ${className}`}>
      <div className="max-w-xl mx-auto px-4 py-3 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-slate-800 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-left">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles size={16} />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                Software Architecture &amp; Engineering
              </p>
              <p className="text-xs text-slate-200 font-semibold">
                Designed &amp; Developed by{' '}
                <a
                  href="https://pixeltocloud.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-bold underline decoration-emerald-500/40 underline-offset-2 transition inline-flex items-center gap-0.5"
                >
                  PixelToCloud
                  <ArrowUpRight size={12} className="inline opacity-80" />
                </a>
              </p>
            </div>
          </div>

          <a
            href="https://pixeltocloud.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-300 hover:text-white text-[11px] font-semibold transition active:scale-95 shrink-0 shadow-sm"
          >
            <Globe size={13} />
            <span>pixeltocloud.com</span>
            <ArrowUpRight size={13} />
          </a>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          Need a custom web or mobile application for your business or society? Connect with PixelToCloud.
        </p>
      </div>
    </footer>
  );
}
