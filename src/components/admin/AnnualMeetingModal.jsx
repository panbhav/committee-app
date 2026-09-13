import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/loanCalculator';
import { Award, TrendingUp, Users, ShieldAlert, Sparkles } from 'lucide-react';

export default function AnnualMeetingModal() {
  const { loans, members, monthlyUnit, t } = useApp();

  // Calculate annual pool profit
  // Total loans interest earned in 1 year:
  // Self loans total interest = 10%
  // Outer loans total interest = 16%
  const selfLoans = loans.filter(l => l.type === 'self');
  const outerLoans = loans.filter(l => l.type === 'outer');

  const totalSelfPrincipal = selfLoans.reduce((s, l) => s + l.principal, 0);
  const totalOuterPrincipal = outerLoans.reduce((s, l) => s + l.principal, 0);

  // Interest breakdown:
  // 7% pool return on all loans:
  const poolDividendFromSelf = totalSelfPrincipal * 0.07;
  const poolDividendFromOuter = totalOuterPrincipal * 0.07;
  const totalCommonPoolReturn = poolDividendFromSelf + poolDividendFromOuter;
  const perMemberPoolDividend = Math.round(totalCommonPoolReturn / 15);

  // Guarantor 6% commission per member on outer loans they guaranteed
  const memberCommissions = members.map(m => {
    const guaranteed = outerLoans.filter(l => l.guarantor === m.name);
    const guaranteedPrincipal = guaranteed.reduce((s, l) => s + l.principal, 0);
    const commission6Pct = Math.round(guaranteedPrincipal * 0.06);
    const totalPayout = perMemberPoolDividend + commission6Pct;

    return {
      member: m,
      guaranteedCount: guaranteed.length,
      guaranteedPrincipal,
      commission6Pct,
      totalPayout
    };
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Annual Summary Card */}
      <div className="bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            {t.annualMeetingTitle}
          </span>
        </div>
        <h2 className="text-xl font-black text-white">{t.annualMeetingTitle}</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {t.annualMeetingSubtitle}
        </p>

        {/* Big numbers row */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">{t.poolDividend}:</span>
            <span className="text-base font-extrabold text-emerald-400">
              {formatINR(perMemberPoolDividend)}
            </span>
            <span className="text-[10px] text-slate-500 block">{t.equalShare}</span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">{t.totalOuterGuaranteed}:</span>
            <span className="text-base font-extrabold text-amber-400">
              {formatINR(totalOuterPrincipal)}
            </span>
            <span className="text-[10px] text-slate-500 block">{t.earning6Commission}</span>
          </div>
        </div>
      </div>

      {/* Commission Ranking Leaderboard */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t.memberPayoutSheet}
          </span>
          <span className="text-[11px] text-slate-400">15 Members</span>
        </div>


        <div className="space-y-2">
          {memberCommissions
            .sort((a, b) => b.totalPayout - a.totalPayout)
            .map((item, idx) => (
              <div
                key={item.member.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30' :
                    idx === 1 ? 'bg-slate-300 text-slate-950' :
                    idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{item.member.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Guaranteed: {formatINR(item.guaranteedPrincipal)} ({item.guaranteedCount} loans)
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">
                    Pool {formatINR(perMemberPoolDividend)} + Comm {formatINR(item.commission6Pct)}
                  </span>
                  <span className="text-sm font-extrabold text-emerald-400">
                    {formatINR(item.totalPayout)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
