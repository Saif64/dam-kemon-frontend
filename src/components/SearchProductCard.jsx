import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Crown, Store, Star, TrendingDown, MessageSquare, ChevronRight, Scale } from 'lucide-react';
import { trackClick } from '../api/analytics';
import { toggle, inQueue, subscribe } from '../api/compareQueue';

function fmt(p) {
  if (p == null) return 'N/A';
  return '৳' + Number(p).toLocaleString('en-IN');
}

function hostOf(url) {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
}

/**
 * Product-centric card. Each card represents ONE product (deduped across
 * shops by MinHash/LSH at index time). The card leads with:
 *  - product info (image, name, category)
 *  - rating + review count
 *  - "N sellers compared" badge — the value prop of the whole product
 *  - price range across sellers (if N>1) or single price
 *
 * Primary CTA is always "Compare {N} prices" — it takes the user to
 * ProductDetail where the full seller table lives. Per-seller "Buy"
 * links are demoted to small chips at the bottom; the card itself is
 * the unit of value, not any single seller.
 */
export default function SearchProductCard({ product, rank }) {
  const [staged, setStaged] = useState(inQueue(product.id));
  useEffect(() => subscribe(() => setStaged(inQueue(product.id))), [product.id]);
  const prices = Array.isArray(product.prices) ? [...product.prices] : [];
  prices.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  const cheapest = prices[0];
  const highest = prices[prices.length - 1];
  const sellerCount = prices.length;
  const isMulti = sellerCount > 1;
  const savings = cheapest && highest && highest.price > cheapest.price
    ? highest.price - cheapest.price : 0;
  const savingsPct = savings && cheapest?.price
    ? Math.round((savings / highest.price) * 100) : 0;

  const detailHref = `/product/${product.id || product.slug || ''}`;
  const detailLink = { pathname: detailHref };

  const rating = product.averageRating;
  const totalReviews = product.totalReviews;

  return (
    <Link
      to={detailLink}
      state={{ product }}
      className="card-soft overflow-hidden flex flex-col group hover:shadow-[var(--shadow-lift)] hover:border-line-strong transition-all"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative w-full sm:w-48 lg:w-56 aspect-[4/3] sm:aspect-square bg-gradient-to-br from-cream-soft to-cream flex items-center justify-center shrink-0 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span className="font-serif text-5xl italic text-ink/15">{(product.category || 'P')[0]}</span>
          )}
          {rank === 1 && (
            <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-ink text-cream px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
              <Crown className="w-3 h-3 text-yellow" /> Best match
            </div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
            className={`absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full backdrop-blur transition-colors ${
              staged ? 'bg-lime text-ink shadow-[0_4px_12px_-2px_rgba(190,242,100,0.6)]' : 'bg-white/90 text-ink/60 hover:text-ink'
            }`}
            title={staged ? 'Remove from compare' : 'Add to compare'}
            aria-label="Toggle compare"
          >
            <Scale className="w-3.5 h-3.5" />
          </button>
          {/* Headline seller badge — the cross-shop value prop */}
          <div className={`absolute bottom-2 left-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold ${
            isMulti
              ? 'bg-green text-white shadow-[0_4px_12px_-2px_rgba(15,77,42,0.4)]'
              : 'bg-white/95 text-ink/70 border border-line backdrop-blur'
          }`}>
            <Store className="w-3 h-3" />
            {isMulti ? `${sellerCount} sellers` : '1 seller'}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3 min-w-0">
          <div className="flex flex-col gap-1">
            {product.category && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-gray">{product.category}</span>
            )}
            <h3 className="font-serif text-base sm:text-lg lg:text-xl font-semibold text-ink leading-snug group-hover:text-red transition-colors line-clamp-2">
              {product.name}
            </h3>
          </div>

          {/* Rating + reviews block — explicit, not buried */}
          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            {rating != null && rating > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'text-yellow fill-yellow' : 'text-line-strong'}`} />
                  ))}
                </span>
                <span className="font-semibold text-ink">{Number(rating).toFixed(1)}</span>
                {totalReviews > 0 && (
                  <span className="text-gray inline-flex items-center gap-0.5">
                    <MessageSquare className="w-3 h-3" /> {totalReviews.toLocaleString('en-IN')} {totalReviews === 1 ? 'review' : 'reviews'}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-gray text-[12px]">No reviews yet</span>
            )}
          </div>

          {/* Price block — front and centre */}
          {cheapest && (
            <div className="mt-auto pt-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-gray mb-1">
                {isMulti ? 'From' : 'Price'}
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`font-mono font-bold leading-none ${isMulti ? 'text-green text-2xl sm:text-3xl' : 'text-ink text-xl sm:text-2xl'}`}>
                  {fmt(cheapest.price)}
                </span>
                {isMulti && (
                  <>
                    <span className="text-gray text-sm">– {fmt(highest.price)}</span>
                    {savingsPct >= 5 && (
                      <span className="inline-flex items-center gap-0.5 bg-lime/30 text-green text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
                        <TrendingDown className="w-3 h-3" /> save {savingsPct}%
                      </span>
                    )}
                  </>
                )}
                {!isMulti && cheapest.originalPrice != null && cheapest.originalPrice > cheapest.price && (
                  <span className="font-mono text-sm text-gray-soft line-through">{fmt(cheapest.originalPrice)}</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2 gap-3">
                <div className="text-[12px] text-gray inline-flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  {isMulti
                    ? <>Cheapest at <span className="font-semibold text-ink">{cheapest.siteName}</span></>
                    : <>Only on <span className="font-semibold text-ink">{cheapest.siteName}</span></>}
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink/80 group-hover:text-red transition-colors">
                  {isMulti ? `Compare ${sellerCount} prices` : 'View details'}
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seller strip — small inline chips below, not the focus */}
      {isMulti && (
        <div className="border-t border-line bg-cream-soft/30 px-4 sm:px-5 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="font-mono text-[10px] uppercase tracking-wider text-gray shrink-0">All sellers:</span>
            {prices.slice(0, 6).map((sp, i) => {
              const host = hostOf(sp.productUrl);
              return (
                <a
                  key={`${sp.siteSlug || sp.siteName}-${i}`}
                  href={sp.productUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    trackClick(product.id, sp.siteSlug || sp.siteName);
                  }}
                  className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
                    i === 0
                      ? 'bg-green/15 text-green font-bold hover:bg-green/25'
                      : 'bg-white text-ink/70 border border-line hover:border-ink hover:text-ink'
                  }`}
                  title={host || sp.siteName}
                >
                  {i === 0 && <Crown className="w-3 h-3 text-yellow" />}
                  <span className="truncate max-w-[100px]">{sp.siteName}</span>
                  <span className="font-bold">{fmt(sp.price)}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </a>
              );
            })}
            {prices.length > 6 && (
              <span className="text-[11px] text-gray shrink-0">+{prices.length - 6} more</span>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
