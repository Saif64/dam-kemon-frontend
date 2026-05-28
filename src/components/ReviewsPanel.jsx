import { useEffect, useMemo, useState } from 'react';
import {
  Star, ThumbsUp, ThumbsDown, Send, CheckCircle2, Truck, MessageSquare, Loader2, PenLine, BadgeCheck,
} from 'lucide-react';
import { getProductReviews, postProductReview, postDeliveryReport, markReviewHelpful } from '../api/api';

function fmtDate(v) {
  if (!v) return '';
  try {
    const d = Array.isArray(v) ? new Date(v[0], (v[1] || 1) - 1, v[2] || 1) : new Date(v);
    return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

const emptyForm = {
  rating: 0, reviewerName: '', shopSlug: '', siteName: '',
  title: '', content: '', deliveryDaysReported: '', wouldRecommend: null, trustVote: null,
};

/**
 * Community reviews + trust submission. Anonymous (the X-Anon-Id header is the
 * identity, one review per product). A submitted review feeds the seller's
 * trust score, so the form collects the decision signals — star rating, the
 * seller bought from, delivery time, would-recommend, and a trust vote — not
 * just free text. On success we hand the updated trust profile back up so the
 * comparison table + verdict refresh live.
 */
export default function ReviewsPanel({ productId, product, onTrustUpdated }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [delivery, setDelivery] = useState({ open: false, shopSlug: '', days: '', busy: false, done: false, error: null });

  const sellers = useMemo(() => (product?.prices || [])
    .map((p) => ({ slug: p.siteSlug || p.siteName, name: p.siteName }))
    .filter((s) => s.name), [product]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getProductReviews(productId)
      .then((r) => { if (alive) setReviews(Array.isArray(r.data) ? r.data : []); })
      .catch(() => { if (alive) setReviews([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [productId]);

  const rated = reviews.filter((r) => r.rating != null);
  const avg = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : null;

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.rating) { setError('Please pick a star rating.'); return; }
    setSubmitting(true);
    try {
      const payload = {
        rating: form.rating,
        reviewerName: form.reviewerName || undefined,
        shopSlug: form.shopSlug || undefined,
        siteName: form.siteName || undefined,
        title: form.title || undefined,
        content: form.content || undefined,
        deliveryDaysReported: form.deliveryDaysReported === '' ? undefined : Number(form.deliveryDaysReported),
        wouldRecommend: form.wouldRecommend,
        trustVote: form.trustVote || undefined,
      };
      const res = await postProductReview(productId, payload);
      const newReview = res.data?.review;
      if (newReview) setReviews((rs) => [newReview, ...rs]);
      if (res.data?.trust && onTrustUpdated) onTrustUpdated(res.data.trust);
      setForm(emptyForm);
      setShowForm(false);
      setDone(true);
    } catch (err) {
      const status = err.response?.status;
      setError(status === 409
        ? 'You have already reviewed this product. Thank you!'
        : (err.response?.data?.error || 'Could not submit your review. Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitDelivery = async (e) => {
    e.preventDefault();
    setDelivery((d) => ({ ...d, error: null }));
    if (!delivery.shopSlug) { setDelivery((d) => ({ ...d, error: 'Pick the seller you bought from.' })); return; }
    if (delivery.days === '') { setDelivery((d) => ({ ...d, error: 'Enter how many days delivery took.' })); return; }
    setDelivery((d) => ({ ...d, busy: true }));
    try {
      const res = await postDeliveryReport(productId, { shopSlug: delivery.shopSlug, days: Number(delivery.days) });
      if (res.data?.trust && onTrustUpdated) onTrustUpdated(res.data.trust);
      setDelivery({ open: false, shopSlug: '', days: '', busy: false, done: true, error: null });
    } catch (err) {
      const status = err.response?.status;
      setDelivery((d) => ({ ...d, busy: false, error: status === 409 ? 'You already reported delivery for this product.' : 'Could not submit. Try again.' }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="card-soft p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="font-serif text-3xl font-bold italic text-ink leading-none">{avg ? avg.toFixed(1) : '—'}</div>
            <div className="flex items-center gap-0.5 mt-1 justify-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${avg && i < Math.round(avg) ? 'text-yellow fill-yellow' : 'text-line-strong'}`} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Community reviews</h3>
            <p className="text-xs text-gray inline-flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {rated.length} {rated.length === 1 ? 'review' : 'reviews'} from real buyers
            </p>
          </div>
        </div>
        {!showForm && !done && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <PenLine className="w-4 h-4" /> Write a review
          </button>
        )}
        {done && (
          <span className="inline-flex items-center gap-1.5 text-green text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Thanks — your review is live
          </span>
        )}
      </div>

      {/* Delivery quick-report — lighter than a full review, just feeds the
          seller's delivery estimate. */}
      {sellers.length > 0 && !delivery.done && (
        delivery.open ? (
          <form onSubmit={submitDelivery} className="card-soft p-4 flex flex-col sm:flex-row sm:items-end gap-3 animate-slide-down">
            <div className="flex-1">
              <label className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1.5">Seller you bought from</label>
              <select
                value={delivery.shopSlug}
                onChange={(e) => setDelivery((d) => ({ ...d, shopSlug: e.target.value }))}
                className="w-full bg-white border border-line rounded-2xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink/40"
              >
                <option value="">Select a seller</option>
                {sellers.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-32">
              <label className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1.5">Days to arrive</label>
              <div className="flex items-center gap-2 bg-white border border-line rounded-2xl px-3 py-2.5">
                <Truck className="w-4 h-4 text-gray" />
                <input type="number" min="0" max="60" value={delivery.days}
                  onChange={(e) => setDelivery((d) => ({ ...d, days: e.target.value }))}
                  placeholder="3" className="w-full bg-transparent outline-none text-sm font-mono" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDelivery((d) => ({ ...d, open: false, error: null }))} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={delivery.busy} className="btn-primary disabled:opacity-50">
                {delivery.busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit
              </button>
            </div>
            {delivery.error && <p className="text-red text-xs w-full sm:w-auto">{delivery.error}</p>}
          </form>
        ) : (
          <button onClick={() => setDelivery((d) => ({ ...d, open: true }))}
            className="w-full text-left text-sm text-ink/70 hover:text-ink inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-dashed border-line-strong hover:bg-cream-soft transition-colors">
            <Truck className="w-4 h-4 text-gray" /> Bought this? <span className="font-semibold">Report your delivery time</span> to help others.
          </button>
        )
      )}
      {delivery.done && (
        <div className="card-soft p-3 text-sm text-green inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> Thanks — your delivery time was recorded.
        </div>
      )}

      {/* Write form */}
      {showForm && (
        <form onSubmit={submit} className="card-elev p-4 sm:p-5 space-y-4 animate-slide-down">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1.5">Your rating *</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setField('rating', n)} className="p-0.5" aria-label={`${n} stars`}>
                  <Star className={`w-7 h-7 transition-colors ${n <= form.rating ? 'text-yellow fill-yellow' : 'text-line-strong hover:text-yellow/50'}`} />
                </button>
              ))}
            </div>
          </div>

          {sellers.length > 0 && (
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1.5">Which seller did you buy from?</label>
              <select
                value={form.shopSlug}
                onChange={(e) => {
                  const slug = e.target.value;
                  const s = sellers.find((x) => x.slug === slug);
                  setForm((f) => ({ ...f, shopSlug: slug, siteName: s?.name || '' }));
                }}
                className="w-full bg-white border border-line rounded-2xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink/40"
              >
                <option value="">Select a seller (optional)</option>
                {sellers.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1.5">Delivery time (days)</label>
              <div className="flex items-center gap-2 bg-white border border-line rounded-2xl px-3 py-2.5">
                <Truck className="w-4 h-4 text-gray" />
                <input
                  type="number" min="0" max="60"
                  value={form.deliveryDaysReported}
                  onChange={(e) => setField('deliveryDaysReported', e.target.value)}
                  placeholder="e.g. 3"
                  className="flex-1 bg-transparent outline-none text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1.5">Do you trust this seller?</label>
              <div className="flex gap-2">
                <TrustToggle active={form.trustVote === 'up'} onClick={() => setField('trustVote', form.trustVote === 'up' ? null : 'up')} icon={ThumbsUp} label="Trust" tone="green" />
                <TrustToggle active={form.trustVote === 'down'} onClick={() => setField('trustVote', form.trustVote === 'down' ? null : 'down')} icon={ThumbsDown} label="Don't" tone="red" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1.5">Would you recommend this seller?</label>
            <div className="flex gap-2">
              <RecToggle active={form.wouldRecommend === true} onClick={() => setField('wouldRecommend', form.wouldRecommend === true ? null : true)} label="Yes, recommend" tone="green" />
              <RecToggle active={form.wouldRecommend === false} onClick={() => setField('wouldRecommend', form.wouldRecommend === false ? null : false)} label="No" tone="red" />
            </div>
          </div>

          <div>
            <input
              type="text" value={form.title} maxLength={140}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Title (optional)"
              className="w-full bg-white border border-line rounded-2xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink/40 mb-2"
            />
            <textarea
              value={form.content} rows={3} maxLength={2000}
              onChange={(e) => setField('content', e.target.value)}
              placeholder="Share your experience — genuineness, packaging, delivery, after-sales…"
              className="w-full bg-white border border-line rounded-2xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink/40 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text" value={form.reviewerName} maxLength={60}
              onChange={(e) => setField('reviewerName', e.target.value)}
              placeholder="Your name (optional)"
              className="flex-1 bg-white border border-line rounded-2xl px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink/40"
            />
          </div>

          {error && <p className="text-red text-sm">{error}</p>}

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : <><Send className="w-4 h-4" /> Post review</>}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="card-soft p-8 text-center text-gray text-sm inline-flex items-center justify-center gap-2 w-full">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading reviews…
        </div>
      ) : reviews.length === 0 ? (
        <div className="card-soft p-8 sm:p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cream-soft mb-3">
            <MessageSquare className="w-7 h-7 text-ink/30" />
          </div>
          <h4 className="font-serif text-lg font-bold italic text-ink mb-1">No reviews yet</h4>
          <p className="text-gray text-sm max-w-sm mx-auto">Be the first to rate a seller's trust, genuineness and delivery for this product.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reviews.map((r, i) => <ReviewCard key={r.id || i} r={r} />)}
        </div>
      )}
    </div>
  );
}

function TrustToggle({ active, onClick, icon: Icon, label, tone }) {
  const on = tone === 'green' ? 'bg-green text-white border-green' : 'bg-red text-white border-red';
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${active ? on : 'bg-white text-ink/70 border-line hover:border-line-strong'}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function RecToggle({ active, onClick, label, tone }) {
  const on = tone === 'green' ? 'bg-green text-white border-green' : 'bg-red text-white border-red';
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 px-3 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${active ? on : 'bg-white text-ink/70 border-line hover:border-line-strong'}`}>
      {label}
    </button>
  );
}

function ReviewCard({ r }) {
  const isCommunity = r.source === 'community';
  const storeKey = `dk_helpful_${r.id}`;
  const [helpful, setHelpful] = useState(r.helpfulCount || 0);
  const [voted, setVoted] = useState(() => {
    try { return !!localStorage.getItem(storeKey); } catch { return false; }
  });

  const voteHelpful = async () => {
    if (voted || !r.id) return;
    setVoted(true);
    setHelpful((n) => n + 1);
    try { localStorage.setItem(storeKey, '1'); } catch { /* ignore */ }
    try {
      const res = await markReviewHelpful(r.id);
      if (res.data?.helpfulCount != null) setHelpful(res.data.helpfulCount);
    } catch { /* optimistic; leave as-is */ }
  };

  return (
    <div className="card-soft p-4">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-cream-soft flex items-center justify-center font-serif font-bold text-ink/60 shrink-0">
            {(r.reviewerName || 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-ink text-sm truncate inline-flex items-center gap-1.5">
              {r.reviewerName || 'Anonymous'}
              {r.verified && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green text-white" title="Bought via Damkemon">
                  <BadgeCheck className="w-2.5 h-2.5" /> Verified
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray">{fmtDate(r.reviewDate)}{r.siteName ? ` · bought from ${r.siteName}` : ''}</div>
          </div>
        </div>
        {r.rating != null && (
          <div className="flex items-center gap-0.5 shrink-0">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-yellow fill-yellow' : 'text-line-strong'}`} />
            ))}
          </div>
        )}
      </div>
      {r.title && <h5 className="font-semibold text-ink text-sm mb-0.5">{r.title}</h5>}
      {r.content && <p className="text-gray text-[13px] leading-relaxed">{r.content}</p>}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {isCommunity && (
          <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime-soft text-green">Community</span>
        )}
        {r.deliveryDaysReported != null && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cream-soft text-ink/70">
            <Truck className="w-3 h-3" /> {r.deliveryDaysReported}d delivery
          </span>
        )}
        {r.wouldRecommend === true && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-soft text-green">
            <ThumbsUp className="w-3 h-3" /> Recommends
          </span>
        )}
        {r.trustVote === 'up' && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-soft text-green">Trusts seller</span>
        )}
        {r.trustVote === 'down' && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-soft text-red">Distrusts seller</span>
        )}
        <button
          onClick={voteHelpful}
          disabled={voted}
          className={`ml-auto inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
            voted ? 'border-green/30 text-green bg-green-soft' : 'border-line text-gray hover:border-line-strong hover:text-ink'
          }`}
          title={voted ? 'Thanks for the feedback' : 'Was this helpful?'}
        >
          <ThumbsUp className="w-3 h-3" /> Helpful{helpful > 0 ? ` · ${helpful}` : ''}
        </button>
      </div>
    </div>
  );
}
