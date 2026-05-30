import { useNavigate } from 'react-router-dom';
import { ExternalLink, Crown, Store, Star, TrendingDown, MessageSquare, ChevronRight, Megaphone, Sparkles } from 'lucide-react';
import { trackClick } from '../api/analytics';
import { affiliateUrl } from '../api/api';
import TrustBadge from './TrustBadge';

function fmt(p) {
  if (p == null) return 'N/A';
  return '৳' + Number(p).toLocaleString('en-IN');
}

// Seller rows surfaced directly on the card; the rest live on the detail page.
const VISIBLE_SELLERS = 4;

/**
 * Product-centric card. Each card represents ONE product (deduped across
 * shops by MinHash/LSH at index time). On a price-comparison site the sellers
 * ARE the value, so the card leads with product info + rating, then makes the
 * full seller line-up the headline block: every shop offering the product,
 * ranked cheapest-first, each price tappable straight through to the shop.
 * The cheapest row is crowned; a "Compare N prices" CTA opens the detail page
 * where the full trust/delivery comparison lives.
 */
export default function SearchProductCard({ product, rank, sponsored = false, query, trust = {}, smartPick = false }) {
  const navigate = useNavigate();
  const prices = Array.isArray(product.prices) ? [...product.prices] : [];
  prices.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  const cheapest = prices[0];
  const highest = prices[prices.length - 1];
  const sellerCount = prices.length;
  const isMulti = sellerCount > 1;
  const savings = cheapest && highest && highest.price > cheapest.price
    ? highest.price - cheapest.price : 0;
  const savingsPct = savings && highest?.price
    ? Math.round((savings / highest.price) * 100) : 0;

  const detailHref = `/product/${product.id || product.slug || ''}`;
  const goToDetail = () => navigate(detailHref, { state: { product } });

  const rating = product.averageRating;
  const totalReviews = product.totalReviews;
  const cheapestTrust = cheapest ? trust[cheapest.siteSlug || cheapest.siteName] || null : null;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToDetail(); } }}
      className="card-soft overflow-hidden flex flex-col group hover:shadow-[var(--shadow-lift)] hover:border-line-strong transition-all cursor-pointer"
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
          {sponsored ? (
            <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-yellow text-ink px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-[0_4px_12px_-2px_rgba(0,0,0,0.18)]">
              <Megaphone className="w-3 h-3" /> Sponsored
            </div>
          ) : smartPick ? (
            <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-lime text-ink px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-[0_4px_12px_-2px_rgba(190,242,100,0.6)]">
              <Sparkles className="w-3 h-3" /> Smart pick
            </div>
          ) : rank === 1 && (
            <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-ink text-cream px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
              <Crown className="w-3 h-3 text-yellow" /> Best match
            </div>
          )}
          {/* Headline seller-count badge — the cross-shop value prop */}
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

          {/* Sellers — the headline. Every shop, ranked cheapest-first, each
              price tappable straight through to the seller. */}
          {cheapest && (
            <div className="mt-auto pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-gray inline-flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" />
                  {isMulti ? `Compare ${sellerCount} sellers` : '1 seller'}
                </span>
                {isMulti && savingsPct >= 5 && (
                  <span className="inline-flex items-center gap-0.5 bg-lime/30 text-green text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
                    <TrendingDown className="w-3 h-3" /> save {savingsPct}%
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {prices.slice(0, VISIBLE_SELLERS).map((sp, i) => {
                  const isCheapest = i === 0;
                  return (
                    <a
                      key={`${sp.siteSlug || sp.siteName}-${i}`}
                      href={product.id
                        ? affiliateUrl(product.id, sp.siteSlug || sp.siteName, query, sp.productUrl)
                        : (sp.productUrl || '#')}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      onClick={(e) => { e.stopPropagation(); trackClick(product.id, sp.siteSlug || sp.siteName); }}
                      className={`group/seller flex items-center gap-2 rounded-xl px-2.5 py-2 border transition-colors ${
                        isCheapest
                          ? 'bg-lime/20 border-lime/50 hover:bg-lime/30'
                          : 'bg-white border-line hover:border-line-strong'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        isCheapest ? 'bg-green text-white' : 'bg-cream-soft text-ink/50'
                      }`}>
                        {isCheapest ? <Crown className="w-3 h-3 text-yellow" /> : i + 1}
                      </span>
                      <span className="flex-1 min-w-0 inline-flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-ink truncate">{sp.sellerName || sp.siteName || 'Unknown'}</span>
                        {sp.sellerName && (
                          <span className="hidden lg:inline text-[10px] text-gray font-mono shrink-0">· {sp.siteName}</span>
                        )}
                        {isCheapest && (
                          <span className="hidden sm:inline text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-green text-white">Lowest</span>
                        )}
                        {sp.inStock === false && (
                          <span className="text-[9px] font-mono font-bold uppercase text-red">out</span>
                        )}
                      </span>
                      <span className={`font-mono text-sm font-bold shrink-0 ${isCheapest ? 'text-green' : 'text-ink'}`}>
                        {fmt(sp.price)}
                      </span>
                      <ExternalLink className="w-3 h-3 text-gray-soft shrink-0 group-hover/seller:text-ink transition-colors" />
                    </a>
                  );
                })}
              </div>

              {/* Trust on the cheapest seller (the one most will click) */}
              {cheapestTrust && (
                <div className="mt-2">
                  <TrustBadge trust={cheapestTrust} variant="compact" />
                </div>
              )}

              {/* CTA into the full comparison */}
              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-line">
                <span className="text-[12px] text-gray">
                  {sellerCount > VISIBLE_SELLERS
                    ? <>+{sellerCount - VISIBLE_SELLERS} more {sellerCount - VISIBLE_SELLERS === 1 ? 'seller' : 'sellers'}</>
                    : isMulti
                    ? <>Cheapest at <span className="font-semibold text-ink">{cheapest.siteName}</span></>
                    : <>Only on <span className="font-semibold text-ink">{cheapest.siteName}</span></>}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink/80 group-hover:text-red transition-colors shrink-0">
                  {isMulti ? `Compare ${sellerCount} prices` : 'View details'}
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
