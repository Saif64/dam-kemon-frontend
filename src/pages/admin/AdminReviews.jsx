import { useEffect, useState } from 'react';
import { adminFlaggedReviews, adminSetReviewStatus } from '../../api/api';
import { Check, EyeOff, Loader2, ShieldAlert, RefreshCw, Star } from 'lucide-react';

function fmtDate(v) {
  if (!v) return '';
  try {
    const d = Array.isArray(v) ? new Date(v[0], (v[1] || 1) - 1, v[2] || 1) : new Date(v);
    return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

/**
 * Review moderation queue — spam-flagged community reviews awaiting an
 * operator decision. Publish feeds the seller's trust score; Hide keeps it
 * out of public view. Backed by /api/admin/reviews/**.
 */
export default function AdminReviews() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    adminFlaggedReviews()
      .then((r) => setRows(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const moderate = async (id, status) => {
    setBusyId(id);
    try {
      await adminSetReviewStatus(id, status);
      setRows((rs) => rs.filter((r) => r.id !== id));
    } catch { /* leave row for retry */ }
    finally { setBusyId(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-serif text-xl font-semibold inline-flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red" /> Flagged reviews
          </h2>
          <p className="text-gray text-sm mt-0.5">Auto-flagged as possible spam. Publish to approve (feeds trust), or hide.</p>
        </div>
        <button onClick={load} className="btn-ghost !py-2" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="card-soft p-8 text-center text-gray text-sm inline-flex items-center justify-center gap-2 w-full">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="card-soft p-10 text-center">
          <Check className="w-8 h-8 text-green mx-auto mb-2" />
          <p className="text-gray text-sm">Nothing in the queue — no reviews are flagged.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.id} className="card-soft p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="min-w-0">
                  <span className="font-semibold text-ink text-sm">{r.reviewerName || 'Anonymous'}</span>
                  <span className="text-[11px] text-gray ml-2">{fmtDate(r.reviewDate)}{r.siteName ? ` · ${r.siteName}` : ''}</span>
                </div>
                {r.rating != null && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-gray shrink-0">
                    <Star className="w-3.5 h-3.5 text-yellow fill-yellow" /> {r.rating}
                  </span>
                )}
              </div>
              {r.title && <h5 className="font-semibold text-ink text-sm">{r.title}</h5>}
              {r.content && <p className="text-gray text-[13px] leading-relaxed mb-2">{r.content}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => moderate(r.id, 'published')}
                  disabled={busyId === r.id}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green text-white hover:bg-green/90 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" /> Publish
                </button>
                <button
                  onClick={() => moderate(r.id, 'hidden')}
                  disabled={busyId === r.id}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-cream text-ink border border-line-strong hover:bg-ink hover:text-cream disabled:opacity-50"
                >
                  <EyeOff className="w-3.5 h-3.5" /> Hide
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
