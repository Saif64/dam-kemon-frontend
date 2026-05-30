import { useMemo, useState } from 'react';
import { ExternalLink, Star, Check, Crown, Award, Info } from 'lucide-react';
import { trackClick } from '../api/analytics';
import { affiliateUrl } from '../api/api';
import TrustBadge, { valueScore } from './TrustBadge';

function formatPrice(price) {
  if (!price && price !== 0) return 'N/A';
  return '৳' + Number(price).toLocaleString('en-IN');
}

function fmtSold(n) {
  if (!n) return null;
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return String(n);
}

const sellerBadges = {
  Daraz: { label: 'Mall', color: 'bg-red text-white' },
  Startech: { label: 'Official', color: 'bg-ink text-cream' },
  'Ryans Computers': { label: 'Official', color: 'bg-ink text-cream' },
  Chaldal: { label: 'Mall', color: 'bg-green text-white' },
  Pickaboo: { label: 'Official', color: 'bg-ink text-cream' },
  Rokomari: { label: 'Mall', color: 'bg-green text-white' },
};

function isFacebookSeller(name) {
  return name?.toLowerCase().includes('facebook') || name?.toLowerCase().includes('fb');
}

const slugOf = (it) => it.siteSlug || it.siteName;

/**
 * Per-seller comparison. Beyond price, each row surfaces the seller's trust
 * score, delivery estimate, COD, returns and genuineness (via TrustBadge).
 * The sort toggle lets buyers rank by raw price OR by "best value" — a blend
 * of price, trust, delivery and returns — because the cheapest seller isn't
 * always the smart buy.
 */
export default function PriceComparisonTable({ prices = [], productId, trust = {} }) {
  const [sortMode, setSortMode] = useState('price'); // 'price' | 'value'

  const lowestPrice = useMemo(() => {
    const vals = prices.map((p) => p.price).filter((v) => v != null);
    return vals.length ? Math.min(...vals) : null;
  }, [prices]);

  const enriched = useMemo(() => prices.map((it) => {
    const t = trust[slugOf(it)] || null;
    return { it, t, value: valueScore({ price: it.price, lowestPrice, trust: t }) };
  }), [prices, trust, lowestPrice]);

  const bestValueSlug = useMemo(() => {
    let best = null, bestScore = -Infinity;
    enriched.forEach(({ it, value }) => {
      if (value > bestScore) { bestScore = value; best = slugOf(it); }
    });
    return best;
  }, [enriched]);

  const sorted = useMemo(() => {
    const arr = [...enriched];
    if (sortMode === 'value') arr.sort((a, b) => b.value - a.value);
    else arr.sort((a, b) => (a.it.price ?? Infinity) - (b.it.price ?? Infinity));
    return arr;
  }, [enriched, sortMode]);

  if (!prices.length) {
    return (
      <div className="card-soft p-8 sm:p-10 text-center">
        <p className="text-gray text-sm">No price data available</p>
      </div>
    );
  }

  const hasTrust = Object.keys(trust).length > 0;

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Sort toggle + what "best value" means */}
      {prices.length > 1 && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex bg-white border border-line rounded-full p-1">
            {[['price', 'Cheapest', Crown], ['value', 'Best value', Award]].map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setSortMode(id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                  sortMode === id ? 'bg-ink text-cream' : 'text-gray hover:text-ink'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
          {hasTrust && (
            <span className="text-[11px] text-gray font-mono inline-flex items-center gap-1">
              <Info className="w-3 h-3" /> Best value weighs trust, delivery &amp; returns — not just price
            </span>
          )}
        </div>
      )}

      {sorted.map(({ it, t }, idx) => {
        const slug = slugOf(it);
        const isCheapest = it.price === lowestPrice;
        const isBestValue = slug === bestValueSlug && hasTrust;
        const isTop = idx === 0;
        const isFb = isFacebookSeller(it.siteName);
        const discount = it.originalPrice && it.price
          ? Math.round(((it.originalPrice - it.price) / it.originalPrice) * 100) : 0;
        const badge = sellerBadges[it.siteName];
        const topIsValue = sortMode === 'value';

        return (
          <div
            key={idx}
            className={`group relative rounded-2xl p-3 sm:p-4 lg:p-5 transition-all duration-300 ${
              isTop
                ? 'bg-gradient-to-br from-lime/40 via-lime/20 to-cream border-[1.5px] border-ink shadow-[0_10px_30px_-10px_rgba(15,77,42,0.25)]'
                : isFb
                ? 'bg-blue-soft/30 border border-blue/20 hover:border-blue/40 hover:bg-blue-soft/40'
                : 'bg-white border border-line hover:border-line-strong hover:shadow-[var(--shadow-card)]'
            }`}
          >
            {isTop && (
              <div className="absolute -top-3 left-4 sm:left-5 inline-flex items-center gap-1 bg-ink text-cream px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                {topIsValue
                  ? <><Award className="w-3 h-3 text-lime" /> Best Value</>
                  : <><Crown className="w-3 h-3 text-yellow" /> Best Price</>}
              </div>
            )}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className={`hidden sm:flex items-center justify-center font-serif text-2xl lg:text-3xl font-bold italic w-9 lg:w-11 h-9 lg:h-11 rounded-full shrink-0 ${
                isTop ? 'bg-ink text-cream' : 'bg-cream-soft text-ink/40'
              }`}>
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                  <h4 className="font-semibold text-ink text-sm sm:text-[15px] truncate">{it.sellerName || it.siteName || 'Unknown Seller'}</h4>
                  {it.sellerName ? (
                    <span className="text-[10px] font-mono text-gray shrink-0">via {it.siteName}</span>
                  ) : badge ? (
                    <span className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-md ${badge.color}`}>
                      {badge.label}
                    </span>
                  ) : null}
                  {isFb && (
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-md bg-blue text-white">
                      Facebook
                    </span>
                  )}
                </div>

                {it.rating != null && it.rating > 0 && (
                  <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < Math.round(it.rating) ? 'text-yellow fill-yellow' : 'text-line-strong'}`} />
                    ))}
                    <span className="text-[10px] sm:text-[11px] text-gray ml-0.5 font-mono">{Number(it.rating).toFixed(1)}</span>
                    {it.reviewCount > 0 && (
                      <span className="text-[10px] sm:text-[11px] text-gray-soft ml-1">({it.reviewCount})</span>
                    )}
                  </div>
                )}

                {/* Status tags */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {isCheapest && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-green text-white">
                      <Check className="w-3 h-3" /> Lowest price
                    </span>
                  )}
                  {isBestValue && !isCheapest && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-ink text-lime">
                      <Award className="w-3 h-3" /> Best value
                    </span>
                  )}
                  {it.inStock === false && (
                    <span className="text-[9px] sm:text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-red-soft text-red font-bold">
                      Out of stock
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-red text-white">
                      −{discount}%
                    </span>
                  )}
                  {it.soldCount > 0 && (
                    <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-cream-soft text-ink/60">
                      {fmtSold(it.soldCount)} sold
                    </span>
                  )}
                </div>

                {/* Trust / delivery / genuineness signals */}
                {t && <TrustBadge trust={t} variant="full" />}
              </div>

              <div className="text-right shrink-0">
                <div className={`font-mono text-base sm:text-lg lg:text-xl font-bold ${isTop ? 'text-green' : 'text-ink'}`}>
                  {formatPrice(it.price)}
                </div>
                {it.originalPrice && it.originalPrice > it.price && (
                  <div className="font-mono text-[10px] sm:text-xs text-gray-soft line-through">{formatPrice(it.originalPrice)}</div>
                )}
                <a
                  href={productId
                    ? affiliateUrl(productId, it.siteSlug || it.siteName, undefined, it.productUrl)
                    : (it.productUrl || '#')}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className={`inline-flex items-center gap-1 mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                    isTop
                      ? 'bg-ink text-cream hover:bg-red'
                      : 'bg-cream text-ink border border-line-strong hover:bg-ink hover:text-cream hover:border-ink'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    trackClick(productId, it.siteSlug || it.siteName);
                  }}
                >
                  Visit <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
