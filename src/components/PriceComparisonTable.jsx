import { useMemo, useState } from 'react';
import { ExternalLink, Star, Crown, Award, Info, ShieldCheck, Truck } from 'lucide-react';
import { trackClick } from '../api/analytics';
import { affiliateUrl } from '../api/api';
import { tierOf, valueScore, deliveryText } from './TrustBadge';

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
const offerKey = (it, i) => it.productUrl || `${slugOf(it)}#${it.sellerId || i}`;

/**
 * Per-seller comparison as a responsive card GRID — sellers tile across the
 * width (3-up desktop / 2-up tablet / 1-up mobile) instead of one tall column,
 * so a product with many sellers stays compact and scannable. Each card carries
 * the decision signals beyond price:
 *
 *  - For a marketplace sub-seller (e.g. a Daraz storefront) we show that
 *    SELLER's own reputation (`sellerTrust`, computed from real scraped ratings
 *    + sales) plus this listing's rating and units sold.
 *  - For a first-party shop we show the shop's trust score, delivery and COD.
 *
 * The sort toggle ranks by raw price or by "best value" — a blend of price,
 * trust, delivery and returns. The #1 card in the current order is featured.
 */
export default function PriceComparisonTable({ prices = [], productId, trust = {}, sellerTrust = {} }) {
  const [sortMode, setSortMode] = useState('price'); // 'price' | 'value'

  const lowestPrice = useMemo(() => {
    const vals = prices.map((p) => p.price).filter((v) => v != null);
    return vals.length ? Math.min(...vals) : null;
  }, [prices]);

  const enriched = useMemo(() => prices.map((it, i) => {
    const mt = trust[slugOf(it)] || null;                                   // marketplace / shop trust
    const st = it.sellerId ? (sellerTrust[it.sellerId] || null) : null;     // per-seller reputation
    const effTrust = st ? { ...(mt || {}), trustScore: st.trustScore } : mt; // blend for best-value
    return { it, mt, st, key: offerKey(it, i), value: valueScore({ price: it.price, lowestPrice, trust: effTrust }) };
  }), [prices, trust, sellerTrust, lowestPrice]);

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

  const hasTrust = Object.keys(trust).length > 0 || Object.keys(sellerTrust).length > 0;
  const topIsValue = sortMode === 'value';

  return (
    <div className="space-y-3">
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
              <Info className="w-3 h-3" /> Best value weighs seller trust, delivery &amp; returns — not just price
            </span>
          )}
        </div>
      )}

      {/* Seller grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {sorted.map(({ it, mt, st, key }, idx) => {
          const isTop = idx === 0;
          const isFb = isFacebookSeller(it.siteName);
          const discount = it.originalPrice && it.price
            ? Math.round(((it.originalPrice - it.price) / it.originalPrice) * 100) : 0;
          const badge = sellerBadges[it.siteName];
          const name = it.sellerName || it.siteName || 'Unknown Seller';
          const score = st ? st.trustScore : (mt ? mt.trustScore : null);
          const tier = score != null ? tierOf(score) : null;
          const dtext = mt ? deliveryText(mt) : null;

          return (
            <a
              key={key}
              href={productId
                ? affiliateUrl(productId, it.siteSlug || it.siteName, undefined, it.productUrl)
                : (it.productUrl || '#')}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => trackClick(productId, it.siteSlug || it.siteName)}
              className={`group flex flex-col rounded-2xl border p-4 transition-all ${
                isTop
                  ? 'bg-green-soft border-[1.5px] border-ink'
                  : isFb
                  ? 'bg-blue-soft/30 border border-blue/20 hover:border-blue/40'
                  : 'bg-white border border-line hover:border-line-strong hover:shadow-[var(--shadow-soft)]'
              }`}
            >
              {/* Header: seller + status / rank */}
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-serif text-lg sm:text-xl font-bold text-ink leading-tight">{name}</h4>
                {isTop ? (
                  <span className="shrink-0 inline-flex items-center gap-1 bg-ink text-cream text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    {topIsValue ? <><Award className="w-3 h-3 text-lime" /> Best value</> : 'Lowest'}
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-cream-soft text-ink/40 font-mono text-xs font-bold">
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Marketplace / shop tag */}
              <div className="mt-0.5 mb-2.5">
                {it.sellerName ? (
                  <span className="text-[11px] font-mono text-gray">via {it.siteName}</span>
                ) : badge ? (
                  <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${badge.color}`}>{badge.label}</span>
                ) : isFb ? (
                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-blue text-white">Facebook</span>
                ) : (
                  <span className="text-[11px] font-mono text-gray">{it.siteName}</span>
                )}
              </div>

              {/* Signals */}
              <div className="flex items-center gap-x-2.5 gap-y-1 flex-wrap text-[12px] text-gray mb-3">
                {tier && (
                  <span className={`inline-flex items-center gap-1 font-mono font-bold ${tier.text}`} title={`${st ? 'Seller' : 'Shop'} trust ${score}/100 · ${tier.label}`}>
                    <ShieldCheck className="w-3.5 h-3.5" />{score}
                    <span className="font-sans font-normal text-gray">{tier.label.toLowerCase()}</span>
                  </span>
                )}
                {it.rating != null && it.rating > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow fill-yellow" />{Number(it.rating).toFixed(1)}
                    {it.reviewCount > 0 && <span className="text-gray-soft">({it.reviewCount})</span>}
                    {it.soldCount > 0 && <span className="text-gray-soft">· {fmtSold(it.soldCount)} sold</span>}
                  </span>
                )}
                {dtext && (
                  <span className="inline-flex items-center gap-1"><Truck className="w-3.5 h-3.5" />{dtext}</span>
                )}
                {mt?.codAvailable && (
                  <span className="px-1.5 py-0.5 rounded bg-cream-soft text-ink/60 text-[10px] font-mono font-bold uppercase">COD</span>
                )}
                {it.inStock === false && <span className="text-red font-semibold">Out of stock</span>}
              </div>

              {/* Price + visit */}
              <div className="mt-auto pt-3 border-t border-line flex items-end justify-between gap-2">
                <div>
                  <div className={`font-mono text-2xl font-bold leading-none ${isTop ? 'text-green' : 'text-ink'}`}>
                    {formatPrice(it.price)}
                  </div>
                  {it.originalPrice && it.originalPrice > it.price && (
                    <div className="font-mono text-[11px] text-gray-soft line-through mt-1">{formatPrice(it.originalPrice)}</div>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink/80 group-hover:text-red transition-colors shrink-0">
                  {discount > 0 && <span className="text-red font-bold mr-0.5">−{discount}%</span>}
                  Visit <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
