import { Link } from 'react-router-dom';
import { ExternalLink, Crown, Truck, Store, Star } from 'lucide-react';

function fmt(p) {
  if (p == null) return 'N/A';
  return '৳' + Number(p).toLocaleString('en-IN');
}

/**
 * Card for ONE product on the search results page.
 * Shows: image, name, lowest price + which seller has it, # of other sellers,
 * and a "Buy from <site>" link to the REAL product URL on that seller.
 *
 * Click on the card body → ProductDetail page (full price comparison).
 * Click on "Buy" → external seller URL.
 */
export default function SearchProductCard({ product, rank }) {
  const prices = Array.isArray(product.prices) ? [...product.prices] : [];
  prices.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  const cheapest = prices[0];
  const highest = prices[prices.length - 1];
  const otherSellers = Math.max(0, prices.length - 1);
  const savings = cheapest && highest && highest.price > cheapest.price
    ? highest.price - cheapest.price : 0;

  return (
    <div className="card-soft overflow-hidden flex flex-col sm:flex-row">
      {/* Image */}
      <Link
        to={`/product/${product.id || product.slug}`}
        className="relative w-full sm:w-44 lg:w-56 aspect-[4/3] sm:aspect-square bg-gradient-to-br from-cream-soft to-cream flex items-center justify-center shrink-0 overflow-hidden"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
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
      </Link>

      {/* Body */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3 min-w-0">
        <div className="flex flex-col gap-1">
          {product.category && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-gray">{product.category}</span>
          )}
          <Link to={`/product/${product.id || product.slug}`} className="block">
            <h3 className="font-serif text-base sm:text-lg lg:text-xl font-semibold text-ink leading-snug hover:text-red transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Rating / sellers row */}
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-gray">
          {product.averageRating != null && (
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow fill-yellow" />
              <span className="font-semibold text-ink">{Number(product.averageRating).toFixed(1)}</span>
              {product.totalReviews ? <span>({product.totalReviews})</span> : null}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Store className="w-3.5 h-3.5" />
            <span className="font-semibold text-ink">{prices.length}</span>
            <span>{prices.length === 1 ? 'seller' : 'sellers'}</span>
          </span>
          {savings > 0 && (
            <span className="inline-flex items-center gap-1 text-green font-semibold">
              Save up to {fmt(savings)}
            </span>
          )}
        </div>

        {/* Price block */}
        {cheapest && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 mt-auto">
            <div className="flex-1">
              <div className="font-mono text-[10px] uppercase tracking-wider text-gray mb-0.5">Lowest right now</div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-mono text-xl sm:text-2xl font-bold text-ink leading-none">{fmt(cheapest.price)}</span>
                {cheapest.originalPrice != null && cheapest.originalPrice > cheapest.price && (
                  <span className="font-mono text-sm text-gray-soft line-through">{fmt(cheapest.originalPrice)}</span>
                )}
              </div>
              <div className="text-[12px] text-gray mt-1">
                on <span className="font-semibold text-ink">{cheapest.siteName}</span>
                {otherSellers > 0 && <span> · +{otherSellers} more {otherSellers === 1 ? 'seller' : 'sellers'}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:w-auto">
              {cheapest.productUrl && cheapest.productUrl !== '#' ? (
                <a
                  href={cheapest.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-accent !text-sm !px-4 !py-2.5"
                >
                  Buy on {cheapest.siteName}
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <Link to={`/product/${product.id || product.slug}`} className="btn-accent !text-sm !px-4 !py-2.5">
                  View sellers
                </Link>
              )}
              <Link
                to={`/product/${product.id || product.slug}`}
                className="text-[12px] font-semibold text-ink/70 hover:text-ink text-center"
              >
                Compare all prices →
              </Link>
            </div>
          </div>
        )}

        {/* Mini ribbon: top 3 sellers preview */}
        {prices.length > 1 && (
          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-line">
            {prices.slice(0, 4).map((sp, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono px-2 py-1 rounded-full ${
                  i === 0
                    ? 'bg-green-soft text-green font-bold'
                    : 'bg-cream-soft text-ink/70'
                }`}
              >
                <Truck className="w-2.5 h-2.5" />
                {sp.siteName} {fmt(sp.price)}
              </span>
            ))}
            {prices.length > 4 && (
              <span className="text-[11px] text-gray">+{prices.length - 4} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
