import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/loanCalculator';
import { CheckCircle2, Minus, Plus, Edit2, Clock, Check } from 'lucide-react';

export default function KishtProgressStepper({ loan, compact = false }) {
  const { isSuperAdmin, updateLoanKisht } = useApp();
  const [isEditing, setIsEditing] = useState(false);

  if (!loan) return null;

  const totalM = loan.totalMonths || 12;
  const currentM = Math.min(totalM, Math.max(1, loan.currentMonth || 1));
  const remainingKishts = Math.max(0, totalM - currentM);
  const effectiveKisht = loan.outsiderMonthlyKisht || loan.monthlyKisht;
  const remainingBalance = remainingKishts * effectiveKisht;
  const isCompleted = currentM >= totalM;
  const progressPercent = Math.min(100, Math.round((currentM / totalM) * 100));

  // Edit modal local states
  const [inputCurrent, setInputCurrent] = useState(currentM);
  const [inputRemaining, setInputRemaining] = useState(remainingKishts);

  const handleOpenEdit = (e) => {
    e?.stopPropagation();
    if (!isSuperAdmin) return;
    setInputCurrent(currentM);
    setInputRemaining(remainingKishts);
    setIsEditing(true);
  };

  const handleCurrentChange = (val) => {
    const num = Math.max(1, Math.min(totalM, Number(val) || 1));
    setInputCurrent(num);
    setInputRemaining(totalM - num);
  };

  const handleRemainingChange = (val) => {
    const rem = Math.max(0, Math.min(totalM - 1, Number(val) || 0));
    setInputRemaining(rem);
    setInputCurrent(totalM - rem);
  };

  const handleSave = (e) => {
    e?.preventDefault();
    updateLoanKisht(loan.id, inputCurrent);
    setIsEditing(false);
  };

  const handleStep = (step, e) => {
    e?.stopPropagation();
    const nextVal = currentM + step;
    if (nextVal >= 1 && nextVal <= totalM) {
      updateLoanKisht(loan.id, nextVal);
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      {/* Main Kisht Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Current Kisht Chip */}
          <div
            onClick={isSuperAdmin ? handleOpenEdit : undefined}
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition ${
              isCompleted
                ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
            } ${isSuperAdmin ? 'cursor-pointer hover:bg-slate-900' : ''}`}
            title={isSuperAdmin ? "Click to edit kisht / किश्त बदलने के लिए क्लिक करें" : ""}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <Clock className="w-3 h-3 text-amber-400" />
            )}
            <span>
              Kisht <b className="text-white">{currentM}</b>/{totalM}
            </span>
            {isSuperAdmin && (
              <Edit2 className="w-2.5 h-2.5 text-slate-500 ml-0.5 hover:text-white" />
            )}
          </div>

          {/* Remaining Kisht Badge */}
          {isCompleted ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-950/90 text-emerald-400 border border-emerald-800/60">
              Completed (पूर्ण)
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1">
              <span>{remainingKishts} Bachi (Remaining)</span>
              <span className="text-amber-500">•</span>
              <span className="text-amber-200">{formatINR(remainingBalance)}</span>
            </span>
          )}
        </div>

        {/* Quick Stepper Buttons for Admin */}
        {isSuperAdmin && (
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 shrink-0">
            <button
              type="button"
              disabled={currentM <= 1}
              onClick={(e) => handleStep(-1, e)}
              className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center active:scale-95 transition"
              title="Previous Month (-1 Kisht)"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono font-bold text-slate-400 px-1">
              {currentM}
            </span>
            <button
              type="button"
              disabled={currentM >= totalM}
              onClick={(e) => handleStep(1, e)}
              className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center active:scale-95 transition"
              title="Next Month (+1 Kisht)"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Visual Multi-Segment / Progress Bar */}
      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/80 flex">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isCompleted
              ? 'bg-emerald-500'
              : loan.type === 'outer'
              ? 'bg-amber-500'
              : 'bg-indigo-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Edit Modal (when Admin clicks on Kisht Chip) */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                Kisht Update
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                #{loan.id} {loan.borrowerName}
              </h3>
              <p className="text-xs text-slate-400">
                Total Duration: {totalM} Months • Kisht: {formatINR(effectiveKisht)}/mo
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Current Month input */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Current Kisht:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalM}
                    value={inputCurrent}
                    onChange={(e) => handleCurrentChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-bold text-base text-center focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 block text-center mt-0.5">
                    out of {totalM}
                  </span>
                </div>

                {/* Remaining Kisht input */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Remaining (बाकी):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalM - 1}
                    value={inputRemaining}
                    onChange={(e) => handleRemainingChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-amber-300 font-bold text-base text-center focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 block text-center mt-0.5">
                    {formatINR(inputRemaining * effectiveKisht)} left
                  </span>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Quick Presets:</span>
                <div className="grid grid-cols-4 gap-1">
                  {[1, Math.round(totalM * 0.25), Math.round(totalM * 0.5), Math.round(totalM * 0.75), totalM].map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCurrentChange(m)}
                      className={`py-1 rounded-lg font-bold text-[10px] border transition ${
                        inputCurrent === m
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      M-{m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1 shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Kisht</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
