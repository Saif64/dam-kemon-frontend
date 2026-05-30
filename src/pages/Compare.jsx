import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getShops, getShopTrust } from '../api/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { TrustScore, deliveryText, returnText, authenticityMeta } from '../components/TrustBadge';
import {
  ArrowLeft, Plus, X, Crown, Star, Store, AlertTriangle, Search, Check,
} from 'lucide-react';

const AVATAR_COLORS = ['#1877F2', '#FF4521', '#0F4D2A', '#FFD23F', '#7B61FF', '#15131A'];
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const initialsOf = (name) => (name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

// Representative delivery in days — prefer buyer-reported, else the baseline midpoint.
function deliveryDays(t) {
  if (!t) return null;
  if (t.avgReportedDelivery != null) return t.avgReportedDelivery;
  const lo = t.deliveryDaysMin, hi = t.deliveryDaysMax;
  if (lo == null && hi == null) return null;
  return ((lo ?? hi) + (hi ?? lo)) / 2;
}
const authRank = (a) => {
  switch (a) {
    case 'authorized': case 'official_store': return 3;
    case 'reseller': return 2;
    case 'marketplace': return 1;
    default: return 0;
  }
};
const respRank = (r) => (r === 'fast' ? 3 : r === 'normal' ? 2 : r === 'slow' ? 1 : null);

/**
 * Index of the single winning shop for a row, or -1 when there's no genuine
 * winner: fewer than two real values, or the best value is shared by more than
 * one shop. Only a UNIQUE best is crowned — this is what keeps the crown
 * honest (no crown on ties, shared bests, or single-shop comparisons).
 */
function bestIndex(values, higherBetter) {
  if (higherBetter == null) return -1;
  const real = values.filter((v) => v != null && !Number.isNaN(v));
  if (real.length < 2) return -1;
  const best = higherBetter ? Math.max(...real) : Math.min(...real);
  if (real.filter((v) => v === best).length > 1) return -1; // shared best → no crown
  return values.findIndex((v) => v === best);
}

/**
 * Shop-vs-shop comparison. Instead of stacking products, we stack the SELLERS
 * themselves — trust score, catalog size, ratings, delivery, returns, COD and
 * genuineness — because on a price-comparison site the seller is the decision.
 * Shops are chosen from the public directory (/api/shops) and their decision
 * signals come from the trust layer (/api/trust/shops).
 */
export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const slugsParam = searchParams.get('shops') || '';
  const slugs = slugsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4);

  const [dir, setDir] = useState([]);
  const [dirLoading, setDirLoading] = useState(true);
  const [trust, setTrust] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [picker, setPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  // Shop directory — powers the picker, names and catalog size.
  useEffect(() => {
    setDirLoading(true);
    getShops()
      .then((r) => setDir(Array.isArray(r.data) ? r.data : []))
      .catch(() => { /* picker just shows empty */ })
      .finally(() => setDirLoading(false));
  }, []);

  const dirMap = useMemo(() => {
    const m = {};
    dir.forEach((s) => { m[s.slug] = s; });
    return m;
  }, [dir]);

  // Trust / delivery / returns signals for the selected shops.
  useEffect(() => {
    if (slugs.length === 0) { setTrust({}); return; }
    setLoading(true); setError(null);
    getShopTrust(slugs)
      .then((r) => setTrust(r.data || {}))
      .catch(() => setError('network'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugsParam]);

  const addShop = (slug) => {
    if (!slug || slugs.includes(slug)) return;
    const next = [...slugs, slug].slice(0, 4);
    setSearchParams({ shops: next.join(',') });
    setPicker(false); setPickerQuery('');
  };
  const removeShop = (slug) => {
    const next = slugs.filter((s) => s !== slug);
    if (next.length === 0) setSearchParams({});
    else setSearchParams({ shops: next.join(',') });
  };

  const filteredPicker = dir.filter((s) => {
    if (slugs.includes(s.slug)) return false;
    if (!pickerQuery) return true;
    const q = pickerQuery.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.slug || '').toLowerCase().includes(q);
  });

  // Comparison rows. `val` → sortable number (for the crown), `cell` → display.
  const rows = useMemo(() => [
    { key: 'trust', label: 'Trust score', higher: true,
      val: (t) => t?.trustScore ?? null,
      cell: (t) => (t ? <TrustScore score={t.trustScore} size="sm" /> : '—') },
    { key: 'catalog', label: 'Catalog size', higher: true,
      val: (t, c) => (c != null ? c : null),
      cell: (t, c) => (c != null
        ? <span className="font-mono">{Number(c).toLocaleString('en-IN')}<span className="font-sans text-gray text-[11px]"> products</span></span>
        : '—') },
    { key: 'rating', label: 'Avg rating', higher: true,
      val: (t) => t?.ratingAvg ?? t?.scrapedRatingAvg ?? null,
      cell: (t) => { const r = t?.ratingAvg ?? t?.scrapedRatingAvg; return r != null
        ? <span className="inline-flex items-center gap-1 font-mono"><Star className="w-3.5 h-3.5 text-yellow fill-yellow" />{Number(r).toFixed(1)}</span>
        : '—'; } },
    { key: 'recommend', label: 'Would recommend', higher: true,
      val: (t) => t?.recommendRate ?? null,
      cell: (t) => (t?.recommendRate != null ? <span className="font-mono">{t.recommendRate}%</span> : '—') },
    { key: 'delivery', label: 'Avg delivery', higher: false,
      val: (t) => deliveryDays(t),
      cell: (t) => deliveryText(t) || '—' },
    { key: 'cod', label: 'Cash on delivery', higher: true,
      val: (t) => (t == null ? null : (t.codAvailable ? 1 : 0)),
      cell: (t) => (t == null ? '—' : t.codAvailable
        ? <span className="inline-flex items-center gap-1 text-green font-semibold"><Check className="w-3.5 h-3.5" />Yes</span>
        : <span className="text-gray">No</span>) },
    { key: 'returns', label: 'Returns', higher: true,
      val: (t) => t?.returnWindowDays ?? null,
      cell: (t) => (t ? returnText(t) : '—') },
    { key: 'genuine', label: 'Genuineness', higher: true,
      val: (t) => (t ? authRank(t.authenticity) : null),
      cell: (t) => { const a = authenticityMeta(t?.authenticity); const Icon = a.Icon;
        return <span className={`inline-flex items-center gap-1 ${a.tone}`}><Icon className="w-3.5 h-3.5" />{a.label}</span>; } },
    { key: 'response', label: 'Response time', higher: true,
      val: (t) => respRank(t?.responseTime),
      cell: (t) => (t?.responseTime ? cap(t.responseTime) : '—') },
    { key: 'warranty', label: 'Warranty', higher: null,
      val: () => null,
      cell: (t) => t?.warranty || '—' },
  ], []);

  const hasData = slugs.length > 0;
  const slotCount = Math.max(2, slugs.length + (slugs.length < 4 ? 1 : 0));

  return (
    <div className="container-tight py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-7">
        <Link to="/" className="inline-flex items-center gap-1.5 text-gray hover:text-ink text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <Link to="/browse" className="text-sm text-gray hover:text-ink">Browse products instead →</Link>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="tag-bar mb-2 sm:mb-3"><Store className="w-4 h-4" /> Seller showdown</div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold italic text-ink tracking-tight leading-[1.05]">
          Compare <em className="text-red">shops side by side</em>
        </h1>
        <p className="text-gray text-sm sm:text-base mt-2">
          Stack up to 4 sellers on trust, catalog size, delivery, returns &amp; genuineness — here the seller wins, not the product.
        </p>
      </div>

      {/* Slot row */}
      <div className={`grid gap-3 sm:gap-4 mb-5 ${
        slotCount === 2 ? 'grid-cols-2'
        : slotCount === 3 ? 'grid-cols-2 sm:grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-4'
      }`}>
        {slugs.map((slug, i) => {
          const s = dirMap[slug];
          const name = s?.name || trust[slug]?.shopName || slug;
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
          return (
            <div key={slug} className="card-soft relative p-4 flex flex-col items-center text-center gap-1.5">
              <button
                onClick={() => removeShop(slug)}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-red hover:text-white flex items-center justify-center shadow"
                aria-label="Remove"
              >
                <X className="w-4 h-4" />
              </button>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-serif font-bold italic text-lg mb-0.5"
                style={{ backgroundColor: color, color: color === '#FFD23F' ? '#15131A' : 'white' }}
              >
                {initialsOf(name)}
              </div>
              <div className="font-serif text-sm font-semibold text-ink leading-snug line-clamp-2">{name}</div>
              {s?.platform && <span className="font-mono text-[10px] uppercase tracking-wider text-gray">{s.platform}</span>}
              {s?.productCount != null && (
                <span className="text-[11px] text-gray font-mono">{Number(s.productCount).toLocaleString('en-IN')} products</span>
              )}
            </div>
          );
        })}

        {slugs.length < 4 && (
          <button
            onClick={() => setPicker(true)}
            className="rounded-2xl border-2 border-dashed border-line-strong hover:border-ink hover:bg-cream-soft/60 transition-all flex flex-col items-center justify-center text-gray hover:text-ink min-h-[150px] sm:min-h-[170px]"
          >
            <Plus className="w-8 h-8 mb-1" />
            <span className="text-sm font-medium">Add shop</span>
            <span className="text-[11px] text-gray-soft mt-1">{slugs.length}/4</span>
          </button>
        )}
      </div>

      {/* Empty state */}
      {!hasData && (
        <div className="card-soft p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-cream-soft mb-4">
            <Store className="w-8 h-8 text-ink/30" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold italic text-ink mb-2">Pick shops to compare</h2>
          <p className="text-gray text-sm max-w-md mx-auto mb-5">
            Add 2–4 sellers and see them stacked side by side: trust, catalog size, delivery speed, returns, COD &amp; genuineness.
          </p>
          <button onClick={() => setPicker(true)} className="btn-accent inline-flex">
            <Plus className="w-4 h-4" /> Add your first shop
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && hasData && <LoadingSpinner text="Loading shop signals…" />}

      {/* Error */}
      {error && hasData && !loading && (
        <div className="card-soft p-8 sm:p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-red-soft mb-4">
            <AlertTriangle className="w-8 h-8 text-red" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold italic text-ink mb-2">Unable to load shop data</h2>
          <p className="text-gray text-sm">Make sure the Spring Boot server is running on port 8080.</p>
        </div>
      )}

      {/* Seller scorecard */}
      {hasData && !loading && !error && (
        <div className="card-elev overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-line">
            <h2 className="font-serif text-base sm:text-lg lg:text-xl font-bold italic text-ink leading-tight">Seller scorecard</h2>
            <p className="text-[11px] sm:text-xs text-gray mt-0.5">Winner per row gets the crown — ties and single picks are not crowned</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-cream-soft/50">
                  <th className="text-left text-[11px] uppercase tracking-wider font-mono text-gray font-semibold px-4 sm:px-5 py-3 w-[26%]">Signal</th>
                  {slugs.map((slug) => (
                    <th key={slug} className="text-left px-4 sm:px-5 py-3">
                      <span className="text-[13px] font-serif italic text-ink">
                        {dirMap[slug]?.name || trust[slug]?.shopName || slug}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const values = slugs.map((slug) => row.val(trust[slug], dirMap[slug]?.productCount));
                  const crown = bestIndex(values, row.higher);
                  return (
                    <tr key={row.key} className="border-b border-line last:border-0 hover:bg-cream-soft/40">
                      <td className="px-4 sm:px-5 py-3 font-medium text-ink/80 align-top">{row.label}</td>
                      {slugs.map((slug, i) => {
                        const isWin = crown === i;
                        return (
                          <td key={slug} className={`px-4 sm:px-5 py-3 align-top ${isWin ? 'bg-lime/30' : ''}`}>
                            <div className="flex items-center gap-1.5">
                              {isWin && <Crown className="w-3.5 h-3.5 text-yellow shrink-0" />}
                              <span className={isWin ? 'font-semibold text-green' : 'text-ink'}>
                                {row.cell(trust[slug], dirMap[slug]?.productCount)}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shop picker */}
      {picker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setPicker(false)} />
          <div className="relative w-full max-w-2xl card-elev overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold italic text-ink">Pick a shop to compare</h3>
              <button onClick={() => setPicker(false)} className="w-9 h-9 rounded-full hover:bg-cream-soft flex items-center justify-center" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-line">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
                <input
                  type="text"
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="Filter shops…"
                  className="w-full pl-10 pr-3 py-2.5 bg-cream-soft border border-line rounded-xl text-sm text-ink placeholder-gray-soft focus:outline-none focus:border-ink/40"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {dirLoading ? (
                <LoadingSpinner text="Loading shops…" />
              ) : filteredPicker.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray">
                  {dir.length === 0 ? 'No shops available right now.' : 'No shops match the filter.'}
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {filteredPicker.map((s, i) => {
                    const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    return (
                      <button
                        key={s.slug}
                        onClick={() => addShop(s.slug)}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-cream-soft text-left transition-colors"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-serif font-bold italic text-sm shrink-0"
                          style={{ backgroundColor: color, color: color === '#FFD23F' ? '#15131A' : 'white' }}
                        >
                          {initialsOf(s.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-ink truncate">{s.name}</div>
                          <div className="text-[11px] text-gray flex items-center gap-2 mt-0.5">
                            {s.platform && <span className="font-mono uppercase">{s.platform}</span>}
                            <span className="font-mono">{Number(s.productCount || 0).toLocaleString('en-IN')} products</span>
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-gray shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
