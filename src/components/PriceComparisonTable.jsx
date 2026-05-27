import { ExternalLink, Star, Check, Truck, Crown, Award } from 'lucide-react';
import { trackClick } from '../api/analytics';
import { affiliateUrl } from '../api/api';

function formatPrice(price) {
  if (!price && price !== 0) return 'N/A';
  return '৳' + Number(price).toLocaleString('en-IN');
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

export default function PriceComparisonTable({ prices = [], productId }) {
  if (!prices.length) {
    return (
      <div className="card-soft p-8 sm:p-10 text-center">
        <p className="text-gray text-sm">No price data available</p>
      </div>
    );
  }

  const sortedPrices = [...prices].sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
  const lowestPrice = sortedPrices[0]?.price;

  return (
    <div className="space-y-2 sm:space-y-3">
      {sortedPrices.map((item, idx) => {
        const isLowest = item.price === lowestPrice && idx === 0;
        const isFb = isFacebookSeller(item.siteName);
        const discount = item.originalPrice && item.price
          ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
          : 0;
        const badge = sellerBadges[item.siteName];
        const rank = idx + 1;

        return (
          <div
            key={idx}
            className={`group relative rounded-2xl p-3 sm:p-4 lg:p-5 transition-all duration-300 ${
              isLowest
                ? 'bg-gradient-to-br from-lime/40 via-lime/20 to-cream border-[1.5px] border-ink shadow-[0_10px_30px_-10px_rgba(15,77,42,0.25)]'
                : isFb
                ? 'bg-blue-soft/30 border border-blue/20 hover:border-blue/40 hover:bg-blue-soft/40'
                : 'bg-white border border-line hover:border-line-strong hover:shadow-[var(--shadow-card)]'
            }`}
          >
            {isLowest && (
              <div className="absolute -top-3 left-4 sm:left-5 inline-flex items-center gap-1 bg-ink text-cream px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                <Crown className="w-3 h-3 text-yellow" /> Best Price
              </div>
            )}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`hidden sm:flex items-center justify-center font-serif text-2xl lg:text-3xl font-bold italic w-9 lg:w-11 h-9 lg:h-11 rounded-full shrink-0 ${
                isLowest ? 'bg-ink text-cream' : 'bg-cream-soft text-ink/40'
              }`}>
                {rank}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                  <h4 className="font-semibold text-ink text-sm sm:text-[15px] truncate">{item.siteName || 'Unknown Seller'}</h4>
                  {badge && (
                    <span className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-md ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                  {isFb && (
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-md bg-blue text-white">
                      Facebook
                    </span>
                  )}
                </div>

                {/* Rating row — only render when the shop actually has one.
                    Earlier this hard-coded 4 yellow stars + "4.0" on every
                    seller, which is fake data the user wanted gone. */}
                {item.rating != null && item.rating > 0 && (
                  <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < Math.round(item.rating) ? 'text-yellow fill-yellow' : 'text-line-strong'}`} />
                    ))}
                    <span className="text-[10px] sm:text-[11px] text-gray ml-0.5 font-mono">{Number(item.rating).toFixed(1)}</span>
                    {item.reviewCount > 0 && (
                      <span className="text-[10px] sm:text-[11px] text-gray-soft ml-1">({item.reviewCount})</span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {isLowest && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-green text-white">
                      <Check className="w-3 h-3" /> Lowest
                    </span>
                  )}
                  {item.inStock !== false ? (
                    <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-yellow-soft text-ink/70">
                      <Truck className="w-3 h-3" /> In stock
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-red-soft text-red font-bold">
                      Out of stock
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-red text-white">
                      −{discount}%
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className={`font-mono text-base sm:text-lg lg:text-xl font-bold ${isLowest ? 'text-green' : 'text-ink'}`}>
                  {formatPrice(item.price)}
                </div>
                {item.originalPrice && item.originalPrice > item.price && (
                  <div className="font-mono text-[10px] sm:text-xs text-gray-soft line-through">{formatPrice(item.originalPrice)}</div>
                )}
                <a
                  href={productId
                    ? affiliateUrl(productId, item.siteSlug || item.siteName)
                    : (item.productUrl || '#')}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className={`inline-flex items-center gap-1 mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                    isLowest
                      ? 'bg-ink text-cream hover:bg-red'
                      : 'bg-cream text-ink border border-line-strong hover:bg-ink hover:text-cream hover:border-ink'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    trackClick(productId, item.siteSlug || item.siteName);
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
