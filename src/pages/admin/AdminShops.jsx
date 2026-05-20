import { useEffect, useState } from 'react';
import { listShops, reindexShop, setShopStatus, editShop, bulkSetShopStatus } from '../../api/api';
import { RotateCcw, Power, AlertTriangle, CheckCircle2, Clock, Edit2, X, Check } from 'lucide-react';

const HEALTH_BADGE = {
  active: { color: 'bg-green/15 text-green', icon: CheckCircle2 },
  degraded: { color: 'bg-yellow/30 text-ink', icon: AlertTriangle },
  dormant: { color: 'bg-gray/20 text-gray', icon: Clock },
};

export default function AdminShops() {
  const [shops, setShops] = useState([]);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [editing, setEditing] = useState(null);

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

  const toggleSelect = (slug) => {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug); else next.add(slug);
    setSelected(next);
  };

  const bulkDisable = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Block ${selected.size} shops?`)) return;
    setBusy('bulk');
    try {
      await bulkSetShopStatus([...selected], 'blocked');
      setSelected(new Set());
      await load();
    } finally { setBusy(null); }
  };
  const bulkEnable = async () => {
    if (selected.size === 0) return;
    setBusy('bulk');
    try {
      await bulkSetShopStatus([...selected], 'active');
      setSelected(new Set());
      await load();
    } finally { setBusy(null); }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy('edit');
    try {
      await editShop(editing.slug, {
        name: editing.name, baseUrl: editing.baseUrl, sitemapUrl: editing.sitemapUrl,
        platform: editing.platform, requiresJs: !!editing.requiresJs,
        categories: editing.categories ? (Array.isArray(editing.categories) ? editing.categories : String(editing.categories).split(',').map(s => s.trim())) : [],
      });
      setEditing(null);
      await load();
    } finally { setBusy(null); }
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

      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-cream-soft border border-line rounded-xl text-sm">
          <span className="font-semibold">{selected.size} selected</span>
          <button onClick={bulkEnable} disabled={busy === 'bulk'} className="px-3 py-1 rounded-full bg-green text-white text-xs font-semibold hover:bg-green/90 disabled:opacity-50">
            Enable
          </button>
          <button onClick={bulkDisable} disabled={busy === 'bulk'} className="px-3 py-1 rounded-full bg-red text-white text-xs font-semibold hover:bg-red/90 disabled:opacity-50">
            Block
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray hover:text-ink">clear</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-gray border-b border-line">
              <th className="py-2 pr-2 w-6"></th>
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
                  <td className="py-2 pr-2">
                    <input type="checkbox" checked={selected.has(s.slug)} onChange={() => toggleSelect(s.slug)} />
                  </td>
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
                        onClick={() => setEditing({ ...s, categories: (s.categories || []).join(', ') })}
                        className="p-1.5 rounded-full hover:bg-ink/10 text-ink"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
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

      {editing && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-cream rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl font-semibold">Edit shop · {editing.slug}</h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-full hover:bg-ink/10"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
              <Field label="Base URL" value={editing.baseUrl} onChange={(v) => setEditing({ ...editing, baseUrl: v })} />
              <Field label="Sitemap URL" value={editing.sitemapUrl || ''} onChange={(v) => setEditing({ ...editing, sitemapUrl: v })} />
              <Field label="Platform" value={editing.platform || ''} onChange={(v) => setEditing({ ...editing, platform: v })} />
              <Field label="Categories (comma-sep)" value={editing.categories} onChange={(v) => setEditing({ ...editing, categories: v })} />
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.requiresJs} onChange={(e) => setEditing({ ...editing, requiresJs: e.target.checked })} />
                Requires JavaScript (use Playwright)
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-full border border-line text-sm hover:border-ink">Cancel</button>
              <button onClick={saveEdit} disabled={busy === 'edit'} className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-ink text-cream font-semibold text-sm hover:bg-red disabled:opacity-50">
                <Check className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-xs font-mono uppercase tracking-wider text-gray mb-1">{label}</span>
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 bg-white border border-line rounded-lg text-sm" />
    </label>
  );
}
