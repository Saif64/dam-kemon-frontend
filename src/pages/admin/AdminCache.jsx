import { useEffect, useState } from 'react';
import { listCaches, flushCache, flushAllCaches } from '../../api/api';
import { Database, Trash2, RotateCcw } from 'lucide-react';

export default function AdminCache() {
  const [caches, setCaches] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = () =>
    listCaches().then((r) => setCaches(Array.isArray(r.data) ? r.data : [])).catch(() => setCaches([]));

  useEffect(() => { load(); }, []);

  const onFlush = async (name) => {
    setBusy(name);
    try { await flushCache(name); await load(); }
    finally { setBusy(null); }
  };
  const onFlushAll = async () => {
    if (!confirm('Flush every cache?')) return;
    setBusy('all');
    try { await flushAllCaches(); await load(); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold inline-flex items-center gap-2">
          <Database className="w-4 h-4" /> Caches
        </h2>
        <button
          onClick={onFlushAll}
          disabled={busy === 'all'}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red text-white text-xs font-semibold disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" /> Flush all
        </button>
      </div>

      {caches.length === 0 ? (
        <p className="text-sm text-gray card-soft p-6 text-center">No caches registered.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-gray border-b border-line">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3 text-right">Size</th>
              <th className="py-2 pr-3 text-right">Hits</th>
              <th className="py-2 pr-3 text-right">Misses</th>
              <th className="py-2 pr-3 text-right">Hit rate</th>
              <th className="py-2 pr-3 text-right">Evictions</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {caches.map((c) => (
              <tr key={c.name} className="border-b border-line/50">
                <td className="py-2 pr-3 font-mono">{c.name}</td>
                <td className="py-2 pr-3 text-right font-mono">{(c.size ?? 0).toLocaleString()}</td>
                <td className="py-2 pr-3 text-right font-mono">{(c.hitCount ?? 0).toLocaleString()}</td>
                <td className="py-2 pr-3 text-right font-mono">{(c.missCount ?? 0).toLocaleString()}</td>
                <td className="py-2 pr-3 text-right font-mono">{c.hitRate != null ? Math.round(c.hitRate * 100) + '%' : '—'}</td>
                <td className="py-2 pr-3 text-right font-mono">{(c.evictionCount ?? 0).toLocaleString()}</td>
                <td className="py-2 pr-3 text-right">
                  <button
                    onClick={() => onFlush(c.name)}
                    disabled={busy === c.name}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-line hover:border-ink text-xs disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" /> Flush
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-[11px] text-gray">TTLs come from <code className="font-mono bg-cream-soft px-1 py-0.5 rounded">spring.cache.caffeine.spec</code> in application.yml.</p>
    </div>
  );
}
