import { useNavigate } from 'react-router-dom';
import { TrendingDown, Store } from 'lucide-react';

function formatPrice(price) {
  if (!price && price !== 0) return 'N/A';
  return '৳' + Number(price).toLocaleString('en-IN');
}

const categoryEmoji = {
  Electronics: '🔌',
  Fashion: '👗',
  'Home & Kitchen': '🍳',
  'Beauty & Care': '✨',
  Mobiles: '📱',
  'Baby & Toys': '🧸',
  Books: '📚',
  Groceries: '🛒',
  Smartphones: '📱',
  Laptops: '💻',
  Headphones: '🎧',
  Accessories: '🎒',
};

const gradientByCategory = {
  Electronics: 'from-blue-soft to-cream',
  Smartphones: 'from-blue-soft to-cream',
  Laptops: 'from-yellow-soft to-cream',
  Headphones: 'from-red-soft to-cream',
  Fashion: 'from-yellow-soft to-cream',
  'Beauty & Care': 'from-red-soft to-cream',
  Books: 'from-lime-soft to-cream',
  Groceries: 'from-lime-soft to-cream',
  'Home & Kitchen': 'from-green-soft to-cream',
};

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const {
    id,
    name = 'Unnamed Product',
    imageUrl,
    lowestPrice,
    highestPrice,
    prices,
    category,
    siteName,
  } = product;
  const siteCount = product.siteCount || prices?.length || 0;

  const hasDiscount = highestPrice && lowestPrice && highestPrice > lowestPrice;
  const discountPct = hasDiscount
    ? Math.round(((highestPrice - lowestPrice) / highestPrice) * 100)
    : 0;
  const emoji = categoryEmoji[category] || '🎁';
  const grad = gradientByCategory[category] || 'from-cream-soft to-cream';

  return (
    <div
      onClick={() => navigate(`/product/${id}`)}
      className="card-soft overflow-hidden cursor-pointer group"
    >
      <div className={`relative aspect-[4/3] bg-gradient-to-br ${grad} overflow-hidden flex items-center justify-center`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`${imageUrl ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center`}>
          <span className="text-5xl sm:text-6xl opacity-60 group-hover:scale-110 transition-transform duration-500">{emoji}</span>
        </div>

        {hasDiscount && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-red text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-red/30 font-mono">
            <TrendingDown className="w-3 h-3" />−{discountPct}%
          </div>
        )}

        {category && (
          <div className="absolute top-3 right-3 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider bg-white/85 backdrop-blur text-ink/70 px-2 py-1 rounded-full font-medium">
            {category}
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="font-serif text-[15px] sm:text-base font-semibold text-ink leading-snug line-clamp-2 mb-2.5 sm:mb-3 min-h-[2.6em]">
          {name}
        </h3>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-mono text-base sm:text-lg font-bold text-ink">
            {formatPrice(lowestPrice)}
          </span>
          {hasDiscount && (
            <span className="font-mono text-xs sm:text-sm text-gray-soft line-through">
              {formatPrice(highestPrice)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray pt-2 border-t border-line">
          <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="truncate">
            {siteName ? (
              <>Cheapest on <span className="font-semibold text-ink">{siteName}</span></>
            ) : siteCount > 0 ? (
              <><span className="font-semibold text-ink">{siteCount}</span> {siteCount === 1 ? 'seller' : 'sellers'} compared</>
            ) : (
              'Price comparison'
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
