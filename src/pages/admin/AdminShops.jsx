import { useEffect, useState } from 'react';
import { listShops, reindexShop, setShopStatus } from '../../api/api';
import { RotateCcw, Power, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const HEALTH_BADGE = {
  active: { color: 'bg-green/15 text-green', icon: CheckCircle2 },
  degraded: { color: 'bg-yellow/30 text-ink', icon: AlertTriangle },
  dormant: { color: 'bg-gray/20 text-gray', icon: Clock },
};

export default function AdminShops() {
  const [shops, setShops] = useState([]);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(null);

  const load = () => listShops().then((r) => setShops(Array.isArray(r.data) ? r.data : [])).catch(() => setShops([]));
  useEffect(() => { load(); }, []);

  const filtered = shops.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'failing') return s.consecutiveFailures > 0 || s.needsRetry;
    return (s.health || 'active') === filter;
  });

  const reindex = async (slug) => {
    setBusy('reindex:' + slug);
    try { await reindexShop(slug); }
    finally { setBusy(null); }
  };

  const flipStatus = async (slug, current) => {
    const next = current === 'active' ? 'blocked' : 'active';
    setBusy('status:' + slug);
    try { await setShopStatus(slug, next); await load(); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'active', 'degraded', 'dormant', 'failing'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === f ? 'bg-ink text-cream border-ink' : 'bg-white text-ink border-line hover:border-ink'
            }`}
          >
            {f} {f === 'all' && `(${shops.length})`}
          </button>
        ))}
        <span className="text-xs text-gray ml-auto">{filtered.length} shown</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-gray border-b border-line">
              <th className="py-2 pr-3">Shop</th>
              <th className="py-2 pr-3">Health</th>
              <th className="py-2 pr-3">Last run</th>
              <th className="py-2 pr-3 text-right">Products</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const badge = HEALTH_BADGE[s.health] || HEALTH_BADGE.dormant;
              const Icon = badge.icon;
              return (
                <tr key={s.slug} className="border-b border-line/50 hover:bg-cream-soft/50">
                  <td className="py-2 pr-3">
                    <div className="font-semibold">{s.name}</div>
                    <a href={s.baseUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray hover:text-ink">
                      {s.baseUrl?.replace(/^https?:\/\//, '')}
                    </a>
                    {s.lastError && (
                      <div className="text-[10px] text-red mt-1 line-clamp-2">{s.lastError}</div>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${badge.color}`}>
                      <Icon className="w-3 h-3" /> {s.health || 'active'}
                    </span>
                    {s.consecutiveFailures > 0 && (
                      <div className="text-[10px] text-red mt-1">{s.consecutiveFailures} fails</div>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-xs text-gray">
                    {s.lastIndexedAt ? new Date(s.lastIndexedAt).toLocaleString() : '—'}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono">
                    {(s.lastIndexedCount ?? 0).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => reindex(s.slug)}
                        disabled={busy === 'reindex:' + s.slug}
                        className="p-1.5 rounded-full hover:bg-ink/10 text-ink disabled:opacity-50"
                        title="Reindex shop"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => flipStatus(s.slug, s.status)}
                        disabled={busy === 'status:' + s.slug}
                        className={`p-1.5 rounded-full hover:bg-red/10 disabled:opacity-50 ${
                          s.status === 'active' ? 'text-gray hover:text-red' : 'text-red'
                        }`}
                        title={s.status === 'active' ? 'Disable shop' : 'Enable shop'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
