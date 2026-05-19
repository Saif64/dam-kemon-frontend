import { useEffect, useState } from 'react';
import { triggerReindex, indexStatus, retryFailedShops } from '../../api/api';
import api from '../../api/api';
import { Play, RotateCcw, Search as SearchIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AdminIndexer() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);

  const loadStatus = () =>
    indexStatus().then((r) => setStatus(r.data)).catch(() => {});

  useEffect(() => {
    loadStatus();
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
        {status?.startedAtEpochMs ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
            <Stat label="Shops" value={`${status.shopsSucceeded}/${status.shopsAttempted}`} hint={status.shopsFailed > 0 ? `${status.shopsFailed} failed` : null} />
            <Stat label="URLs scraped" value={status.urlsScraped?.toLocaleString() ?? '—'} />
            <Stat label="Inserted" value={status.productsInserted?.toLocaleString() ?? '—'} />
            <Stat label="Merged" value={status.productsMerged?.toLocaleString() ?? '—'} />
          </div>
        ) : (
          <p className="text-sm text-gray mt-2">No runs yet — kick one off below.</p>
        )}
        {status?.inProgress && (
          <div className="mt-4 text-xs font-mono inline-flex items-center gap-2 text-green">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse" /> Running…
          </div>
        )}
        {status?.finishedAtEpochMs > 0 && !status?.inProgress && (
          <p className="mt-3 text-[11px] text-gray">
            Finished {new Date(status.finishedAtEpochMs).toLocaleString()}
            {' '} · took {Math.round((status.finishedAtEpochMs - status.startedAtEpochMs) / 1000)}s
          </p>
        )}
      </section>

      <section className="card-soft p-5 sm:p-6 space-y-3">
        <h2 className="font-serif text-xl font-semibold">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <ActionBtn icon={Play} onClick={() => handle('Full reindex', () => triggerReindex())} busy={busy === 'Full reindex'}>
            Run nightly indexer now
          </ActionBtn>
          <ActionBtn icon={RotateCcw} onClick={() => handle('Retry pass', () => retryFailedShops())} busy={busy === 'Retry pass'}>
            Retry failed shops
          </ActionBtn>
          <ActionBtn icon={SearchIcon} onClick={() => handle('Shop discovery', () => api.post('/admin/discover-shops'))} busy={busy === 'Shop discovery'}>
            Discover new shops
          </ActionBtn>
          <ActionBtn icon={SearchIcon} onClick={() => handle('Hot-drops rebuild', () => api.post('/admin/hot-drops/rebuild'))} busy={busy === 'Hot-drops rebuild'}>
            Rebuild hot drops
          </ActionBtn>
        </div>
        {msg && (
          <p className={`inline-flex items-center gap-1.5 text-xs ${msg.ok ? 'text-green' : 'text-red'}`}>
            {msg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {msg.text}
          </p>
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
