import { useEffect, useState } from 'react';
import { listJobs, runJob, jobRuns } from '../../api/api';
import { Play, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

function relative(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const ms = Date.now() - d.getTime();
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return d.toLocaleString();
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [busy, setBusy] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [history, setHistory] = useState([]);

  const load = () => listJobs().then((r) => setJobs(Array.isArray(r.data) ? r.data : [])).catch(() => setJobs([]));
  useEffect(() => { load(); }, []);

  const run = async (id) => {
    setBusy(id);
    try { await runJob(id); setTimeout(load, 1500); }
    finally { setBusy(null); }
  };

  const openHistory = async (id) => {
    setHistoryFor(id);
    try { const r = await jobRuns(id); setHistory(Array.isArray(r.data) ? r.data : []); }
    catch { setHistory([]); }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-lg font-semibold inline-flex items-center gap-2">
        <Clock className="w-4 h-4" /> Background jobs
      </h2>
      <ul className="space-y-2">
        {jobs.map((j) => {
          const lastRun = j.lastRuns?.[0];
          return (
            <li key={j.id} className="card-soft p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{j.name}</div>
                  <div className="text-xs text-gray mt-0.5">{j.description}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                    <span className="font-mono px-2 py-0.5 rounded-full bg-cream-soft text-gray">cadence: {j.cadence}</span>
                    {lastRun && (
                      <span className={`inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-full ${lastRun.ok ? 'bg-green/15 text-green' : 'bg-red/15 text-red'}`}>
                        {lastRun.ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        last: {relative(lastRun.ts)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => run(j.id)}
                    disabled={busy === j.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-ink text-cream font-semibold text-xs hover:bg-red disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" /> {busy === j.id ? '…' : 'Run now'}
                  </button>
                  {j.lastRuns?.length > 0 && (
                    <button onClick={() => openHistory(j.id)} className="text-[11px] text-gray hover:text-ink">
                      {j.lastRuns.length} recent
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {historyFor && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setHistoryFor(null)}>
          <div className="bg-cream rounded-2xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg font-semibold mb-3">Recent runs · {historyFor}</h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray">No manual runs recorded.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {history.map((h, i) => (
                  <li key={i} className={`flex items-center justify-between py-1.5 border-b border-line/50 ${h.ok ? '' : 'text-red'}`}>
                    <span className="font-mono text-xs">{relative(h.ts)}</span>
                    <span className="text-xs">{h.ok ? 'ok' : `failed: ${h.error || 'see logs'}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
