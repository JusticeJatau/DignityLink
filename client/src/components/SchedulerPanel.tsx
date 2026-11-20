import React, { useState } from 'react';
import { Calendar, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../api/client';

const getNextWeekdayIso = (targetDay: number) => {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diff = (targetDay - utc.getUTCDay() + 7) % 7 || 7;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc.toISOString().slice(0, 10);
};

interface SchedulerRunDetail {
  beneficiaryId: string;
  name: string;
  outcome: string;
  week?: number;
  slot?: number;
  externalMessageId?: string;
  reason?: string;
}

interface SchedulerRunResponse {
  run: {
    summaryNotes: string;
  };
  details: SchedulerRunDetail[];
}

export const SchedulerPanel: React.FC<{ onRunComplete?: () => void }> = ({ onRunComplete }) => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SchedulerRunResponse | null>(null);
  const [error, setError] = useState('');

  const handleRunScheduler = async () => {
    setRunning(true);
    setError('');
    try {
      const data = await apiRequest<SchedulerRunResponse>('/api/scheduler/run', {
        method: 'POST',
        body: JSON.stringify({ date: selectedDate }),
      });
      setResult(data);
      if (onRunComplete) onRunComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const presets = [
    { label: 'Today', date: todayIso },
    { label: 'Next Mon (W1–4)', date: getNextWeekdayIso(1) },
    { label: 'Next Tue (W5–12)', date: getNextWeekdayIso(2) },
    { label: 'Next Wed (W1–4)', date: getNextWeekdayIso(3) },
    { label: 'Next Fri (All)', date: getNextWeekdayIso(5) },
  ];

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Daily Scheduler (node-cron) & Demo Runner
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Automated daily cron runs at 08:00 UTC. Weeks 1–4 dispatch Monday, Wednesday, and Friday;
            Weeks 5–12 dispatch Tuesday and Friday. Select any date to simulate a scheduled run.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-slate-50">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              aria-label="Target scheduler date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-mono text-slate-800 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleRunScheduler}
            disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-800 hover:bg-rose-900 text-white text-sm font-medium disabled:opacity-60 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            {running ? 'Running...' : 'Run Scheduler Now'}
          </button>
        </div>
      </div>

      {/* Quick weekday demo selector */}
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
        <span className="text-xs font-medium text-slate-500 mr-1">Demo Quick-Pick Dates:</span>
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setSelectedDate(preset.date)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap shrink-0 cursor-pointer border ${
              selectedDate === preset.date
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {preset.label} · <span className="font-mono">{preset.date}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm">
          <div className="flex items-center gap-2 font-medium text-emerald-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-mono text-xs sm:text-sm">{result.run.summaryNotes}</span>
          </div>
          {result.details?.length > 0 && (
            <ul className="mt-2.5 space-y-1 text-xs text-emerald-900 border-t border-emerald-200/70 pt-2.5">
              {result.details.map((item, idx) => (
                <li key={`${item.beneficiaryId}-${idx}`} className="flex flex-wrap gap-x-2">
                  <span className="font-semibold">{item.name}</span>
                  <span>·</span>
                  <span>{item.outcome}</span>
                  {item.week && (
                    <>
                      <span>·</span>
                      <span className="font-mono">
                        Week {item.week} Slot {item.slot}
                      </span>
                    </>
                  )}
                  {item.externalMessageId && (
                    <>
                      <span>·</span>
                      <span className="font-mono">{item.externalMessageId}</span>
                    </>
                  )}
                  {item.reason && <span className="text-emerald-800">({item.reason})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};
