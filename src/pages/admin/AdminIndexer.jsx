import { useEffect, useState } from 'react';
import { triggerReindex, indexStatus, retryFailedShops, getIndexerHistory } from '../../api/api';
import api from '../../api/api';
import { Play, RotateCcw, Search as SearchIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AdminIndexer() {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);

  const loadStatus = () =>
    indexStatus().then((r) => setStatus(r.data)).catch(() => {});
  const loadHistory = () =>
    getIndexerHistory(30).then((r) => setHistory(Array.isArray(r.data) ? r.data : [])).catch(() => {});

  useEffect(() => {
    loadStatus();
    loadHistory();
    const t = setInterval(loadStatus, 4000);
    return () => clearInterval(t);
  }, []);

  const handle = async (label, fn) => {
    setBusy(label); setMsg(null);
    try { await fn(); setMsg({ ok: true, text: `${label} started` }); await loadStatus(); }
    catch (e) { setMsg({ ok: false, text: e.response?.data?.error || `${label} failed` }); }
    finally { setBusy(null); }
  };

  const fmtPct = (a, b) => b ? Math.round((a / b) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="card-soft p-5 sm:p-6">
        <h2 className="font-serif text-xl font-semibold mb-1">Latest run</h2>
        {(() => {
          // /index/status only knows about the run in the CURRENT JVM lifetime
          // (it's an in-memory RunSummary). After every backend restart that
          // resets to zero — which is why "No runs yet" was showing even
          // when Run history clearly listed 3 completed runs. Fall back to
          // the most recent persisted IndexerRunRecord when status is empty.
          const inMemory = status?.startedAtEpochMs > 0;
          const persisted = (!inMemory && history.length > 0) ? history[0] : null;

          if (!inMemory && !persisted) {
            return <p className="text-sm text-gray mt-2">No runs yet — kick one off below.</p>;
          }

          const view = inMemory ? {
            shopsAttempted: status.shopsAttempted,
            shopsSucceeded: status.shopsSucceeded,
            shopsFailed: status.shopsFailed,
            urlsScraped: status.urlsScraped,
            productsInserted: status.productsInserted,
            productsMerged: status.productsMerged,
            finishedAtMs: status.finishedAtEpochMs,
            startedAtMs: status.startedAtEpochMs,
            source: status.inProgress ? 'running' : 'this-session',
          } : {
            shopsAttempted: persisted.shopsAttempted,
            shopsSucceeded: persisted.shopsSucceeded,
            shopsFailed: persisted.shopsFailed,
            urlsScraped: persisted.urlsScraped,
            productsInserted: persisted.productsInserted,
            productsMerged: persisted.productsMerged,
            finishedAtMs: persisted.finishedAt ? new Date(persisted.finishedAt).getTime() : 0,
            startedAtMs: persisted.startedAt ? new Date(persisted.startedAt).getTime() : 0,
            source: 'persisted',
            kind: persisted.kind,
            tookSeconds: persisted.tookSeconds,
          };

          return (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                <Stat label="Shops" value={`${view.shopsSucceeded}/${view.shopsAttempted}`}
                      hint={view.shopsFailed > 0 ? `${view.shopsFailed} failed` : null} />
                <Stat label="URLs scraped" value={view.urlsScraped?.toLocaleString() ?? '—'} />
                <Stat label="Inserted" value={view.productsInserted?.toLocaleString() ?? '—'} />
                <Stat label="Merged" value={view.productsMerged?.toLocaleString() ?? '—'} />
              </div>
              {status?.inProgress && (
                <div className="mt-4 text-xs font-mono inline-flex items-center gap-2 text-green">
                  <span className="w-2 h-2 rounded-full bg-green animate-pulse" /> Running…
                </div>
              )}
              {!status?.inProgress && view.finishedAtMs > 0 && (
                <p className="mt-3 text-[11px] text-gray">
                  {view.source === 'persisted' && (
                    <span className="inline-flex items-center gap-1 mr-2 px-1.5 py-0.5 rounded-full bg-cream-soft border border-line text-[10px] font-mono uppercase tracking-wider">
                      {view.kind || 'past'}
                    </span>
                  )}
                  Finished {new Date(view.finishedAtMs).toLocaleString()}
                  {' '} · took {view.tookSeconds ?? Math.round((view.finishedAtMs - view.startedAtMs) / 1000)}s
                </p>
              )}
            </>
          );
        })()}
      </section>

      <section className="card-soft p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-serif text-xl font-semibold mb-1">Manual scrape</h2>
          <p className="text-sm text-gray">
            Nightly auto-runs at 03:00. Use this button any time you want a fresh crawl right now —
            it walks every active shop, refreshes prices, and writes new products into the catalog.
          </p>
        </div>
        <button
          onClick={() => handle('Manual scrape', () => triggerReindex())}
          disabled={busy === 'Manual scrape' || status?.inProgress}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red text-white font-semibold text-base hover:bg-ink disabled:opacity-50 disabled:cursor-wait transition-colors w-full sm:w-auto"
        >
          <Play className="w-4 h-4" />
          {status?.inProgress
            ? 'Scrape in progress…'
            : busy === 'Manual scrape'
              ? 'Starting…'
              : 'Scrape every shop now'}
        </button>

        <div className="border-t border-line pt-4">
          <h3 className="font-serif text-base font-semibold mb-2">Other actions</h3>
          <div className="flex flex-wrap gap-2">
            <ActionBtn icon={RotateCcw} onClick={() => handle('Retry pass', () => retryFailedShops())} busy={busy === 'Retry pass'}>
              Retry failed shops only
            </ActionBtn>
            <ActionBtn icon={SearchIcon} onClick={() => handle('Shop discovery', () => api.post('/admin/discover-shops'))} busy={busy === 'Shop discovery'}>
              Discover new shops
            </ActionBtn>
            <ActionBtn icon={SearchIcon} onClick={() => handle('Hot-drops rebuild', () => api.post('/admin/hot-drops/rebuild'))} busy={busy === 'Hot-drops rebuild'}>
              Rebuild hot drops
            </ActionBtn>
          </div>
        </div>

        {msg && (
          <p className={`inline-flex items-center gap-1.5 text-xs ${msg.ok ? 'text-green' : 'text-red'}`}>
            {msg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {msg.text}
          </p>
        )}
      </section>

      <section className="card-soft p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-xl font-semibold">Run history</h2>
          <span className="text-xs text-gray">last {history.length} runs</span>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-gray">No persisted runs yet — kick one off above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-gray border-b border-line">
                  <th className="py-2 pr-3">Started</th>
                  <th className="py-2 pr-3">Kind</th>
                  <th className="py-2 pr-3 text-right">Shops</th>
                  <th className="py-2 pr-3 text-right">URLs</th>
                  <th className="py-2 pr-3 text-right">+Inserted</th>
                  <th className="py-2 pr-3 text-right">↔Merged</th>
                  <th className="py-2 pr-3 text-right">Took</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id} className="border-b border-line/50">
                    <td className="py-2 pr-3 text-gray whitespace-nowrap">{new Date(r.startedAt).toLocaleString()}</td>
                    <td className="py-2 pr-3 font-mono text-[10px] uppercase tracking-wider">{r.kind}</td>
                    <td className={`py-2 pr-3 text-right font-mono ${r.shopsFailed > 0 ? 'text-yellow' : ''}`}>
                      {r.shopsSucceeded}/{r.shopsAttempted}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono">{(r.urlsScraped ?? 0).toLocaleString()}</td>
                    <td className="py-2 pr-3 text-right font-mono">{(r.productsInserted ?? 0).toLocaleString()}</td>
                    <td className="py-2 pr-3 text-right font-mono">{(r.productsMerged ?? 0).toLocaleString()}</td>
                    <td className="py-2 pr-3 text-right font-mono">{r.tookSeconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="bg-cream-soft border border-line rounded-xl p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-gray">{label}</div>
      <div className="font-serif text-xl sm:text-2xl font-bold mt-1">{value}</div>
      {hint && <div className="text-[11px] text-red mt-0.5">{hint}</div>}
    </div>
  );
}

function ActionBtn({ icon: Icon, onClick, busy, children }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink text-cream font-semibold text-sm hover:bg-red disabled:opacity-50 disabled:cursor-wait transition-colors"
    >
      <Icon className="w-3.5 h-3.5" /> {busy ? '…' : children}
    </button>
  );
}
