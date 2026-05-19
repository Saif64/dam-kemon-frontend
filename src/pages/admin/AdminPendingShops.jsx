import { useEffect, useState } from 'react';
import { listPendingShops, approvePendingShop, rejectPendingShop } from '../../api/api';
import { Check, X, ExternalLink } from 'lucide-react';

export default function AdminPendingShops() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = () =>
    listPendingShops().then((r) => setItems(Array.isArray(r.data) ? r.data : [])).catch(() => setItems([]));

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    setBusy(id);
    try { await approvePendingShop(id); await load(); }
    finally { setBusy(null); }
  };
  const reject = async (id) => {
    setBusy(id);
    try { await rejectPendingShop(id, 'rejected via admin console'); await load(); }
    finally { setBusy(null); }
  };

  const pending = items.filter((p) => p.status === 'pending');
  const reviewed = items.filter((p) => p.status !== 'pending');

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-serif text-lg font-semibold mb-3">Awaiting review · {pending.length}</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray card-soft p-6 text-center">No submissions awaiting review.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((p) => (
              <li key={p.id} className="card-soft p-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{p.name}</div>
                  <a href={p.baseUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray hover:text-ink inline-flex items-center gap-1">
                    {p.baseUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                  {p.sitemapUrl && <div className="text-[11px] text-gray mt-0.5">sitemap: {p.sitemapUrl}</div>}
                  {p.platform && <div className="text-[11px] text-gray mt-0.5">platform: {p.platform}</div>}
                  {p.notes && <div className="text-xs mt-2 italic text-ink/70">{p.notes}</div>}
                  {p.contactEmail && <div className="text-[11px] text-gray mt-1">from {p.contactEmail}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approve(p.id)}
                    disabled={busy === p.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green text-white text-xs font-semibold hover:bg-green/90 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => reject(p.id)}
                    disabled={busy === p.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cream-soft border border-line text-ink text-xs font-semibold hover:border-red hover:text-red disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {reviewed.length > 0 && (
        <section>
          <h2 className="font-serif text-lg font-semibold mb-3">Reviewed · {reviewed.length}</h2>
          <ul className="space-y-1">
            {reviewed.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-xs text-gray border-b border-line/50 py-2">
                <span className="truncate">{p.name} ({p.baseUrl?.replace(/^https?:\/\//, '')})</span>
                <span className={`font-mono uppercase tracking-wider ${p.status === 'approved' ? 'text-green' : 'text-red'}`}>
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
