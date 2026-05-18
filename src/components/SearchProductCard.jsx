import { Link } from 'react-router-dom';
import { ExternalLink, Crown, Store, Star, Check } from 'lucide-react';

function fmt(p) {
  if (p == null) return 'N/A';
  return '৳' + Number(p).toLocaleString('en-IN');
}

function hostOf(url) {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
}

/**
 * Card for ONE product on the search results page.
 * - Headline: name, image, lowest price, "Buy on <site>" CTA.
 * - Below: compact price table listing every seller, sorted cheapest first.
 *
 * Clicking the card navigates to ProductDetail and passes the full product
 * through router state, so the detail page renders instantly even when
 * MongoDB isn't reachable (live-search products have null ids until persisted).
 */
export default function SearchProductCard({ product, rank }) {
  const prices = Array.isArray(product.prices) ? [...product.prices] : [];
  prices.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  const cheapest = prices[0];
  const highest = prices[prices.length - 1];
  const savings = cheapest && highest && highest.price > cheapest.price
    ? highest.price - cheapest.price : 0;

  const detailHref = `/product/${product.id || product.slug || ''}`;
  const detailLink = { pathname: detailHref };

  return (
    <div className="card-soft overflow-hidden flex flex-col">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <Link
          to={detailLink}
          state={{ product }}
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
            <Link to={detailLink} state={{ product }} className="block">
              <h3 className="font-serif text-base sm:text-lg lg:text-xl font-semibold text-ink leading-snug hover:text-red transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>
          </div>

          {/* Meta row */}
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

          {/* Headline price block */}
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
                  <Link to={detailLink} state={{ product }} className="btn-accent !text-sm !px-4 !py-2.5">
                    View sellers
                  </Link>
                )}
                <Link
                  to={detailLink}
                  state={{ product }}
                  className="text-[12px] font-semibold text-ink/70 hover:text-ink text-center"
                >
                  Compare all prices →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price table — every seller, sorted cheapest first */}
      {prices.length > 1 && (
        <div className="border-t border-line bg-cream-soft/30">
          <div className="px-4 sm:px-5 py-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-gray">
              All {prices.length} sellers
            </span>
            <span className="font-mono text-[10px] text-gray">
              {fmt(cheapest.price)} – {fmt(highest.price)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider font-mono text-gray border-y border-line">
                  <th className="px-4 sm:px-5 py-2 font-semibold">Seller</th>
                  <th className="px-3 py-2 font-semibold">Price</th>
                  <th className="px-3 py-2 font-semibold text-right">Stock</th>
                  <th className="px-4 sm:px-5 py-2 font-semibold text-right">Visit</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((sp, i) => {
                  const isLowest = i === 0;
                  const host = hostOf(sp.productUrl) || sp.siteName;
                  return (
                    <tr
                      key={`${sp.siteSlug || sp.siteName}-${i}`}
                      className={`border-b border-line last:border-0 ${
                        isLowest ? 'bg-lime/15' : 'hover:bg-white/60'
                      }`}
                    >
                      <td className="px-4 sm:px-5 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {isLowest && <Crown className="w-3.5 h-3.5 text-yellow shrink-0" />}
                          <div className="min-w-0">
                            <div className="font-semibold text-ink text-[13px] truncate">{sp.siteName || host}</div>
                            {host && host !== sp.siteName && (
                              <div className="text-[10px] font-mono text-gray truncate">{host}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className={`font-mono font-bold text-[13px] ${isLowest ? 'text-green' : 'text-ink'}`}>
                          {fmt(sp.price)}
                        </div>
                        {sp.originalPrice != null && sp.originalPrice > sp.price && (
                          <div className="font-mono text-[10px] text-gray-soft line-through">
                            {fmt(sp.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {sp.inStock === false ? (
                          <span className="inline-block text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-red-soft text-red">Out</span>
                        ) : (
                          <span className="inline-flex items-center justify-end gap-0.5 text-[11px] text-green font-semibold">
                            <Check className="w-3 h-3" /> <span className="hidden sm:inline">In stock</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 sm:px-5 py-2.5 text-right">
                        {sp.productUrl && sp.productUrl !== '#' ? (
                          <a
                            href={sp.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                              isLowest
                                ? 'bg-ink text-cream hover:bg-red'
                                : 'bg-white text-ink border border-line hover:bg-ink hover:text-cream hover:border-ink'
                            }`}
                          >
                            Visit <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-soft">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
