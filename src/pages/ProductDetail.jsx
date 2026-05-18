import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getProduct, getProductHistory } from '../api/api';
import PriceComparisonTable from '../components/PriceComparisonTable';
import PriceHistoryChart from '../components/PriceHistoryChart';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ArrowLeft, Star, Share2, Bell, TrendingDown, Sparkles, ShieldCheck, ExternalLink, AlertTriangle,
} from 'lucide-react';

function formatPrice(price) {
  if (!price && price !== 0) return 'N/A';
  return '৳' + Number(price).toLocaleString('en-IN');
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  // If the user arrived from a search result, the full product travels in
  // router state — use it immediately so the page renders even when the
  // backend can't look it up (e.g. live-search results before Mongo persists).
  const seedProduct = state?.product || null;

  const [product, setProduct] = useState(seedProduct);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(!seedProduct);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('prices');

  useEffect(() => {
    let cancelled = false;
    if (!seedProduct) setLoading(true);
    setError(null);

    Promise.allSettled([
      getProduct(id),
      getProductHistory(id),
    ]).then(([productRes, historyRes]) => {
      if (cancelled) return;
      if (productRes.status === 'fulfilled') {
        setProduct(productRes.value.data);
      } else if (!seedProduct) {
        // Only surface an error if we don't already have a product to render.
        const status = productRes.reason?.response?.status;
        setError({ kind: status === 404 ? 'not_found' : 'network' });
      }
      setHistory(historyRes.status === 'fulfilled' && Array.isArray(historyRes.value.data) ? historyRes.value.data : []);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [id, seedProduct]);

  if (loading) {
    return (
      <div className="container-tight py-12">
        <LoadingSpinner text="Loading product details…" />
      </div>
    );
  }

  if (!product) {
    const isNetwork = error?.kind === 'network';
    return (
      <div className="container-tight py-16 sm:py-24 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-red-soft mb-4">
          <AlertTriangle className="w-8 h-8 text-red" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold italic text-ink mb-2">
          {isNetwork ? 'Backend unreachable' : 'Product not found'}
        </h2>
        <p className="text-gray text-sm mb-6 max-w-md mx-auto">
          {isNetwork
            ? <>Backend at <code className="font-mono text-ink bg-cream-soft px-1.5 py-0.5 rounded">/api</code> isn't responding. Start the Spring Boot server with <code className="font-mono text-ink bg-cream-soft px-1.5 py-0.5 rounded">./gradlew bootRun</code>.</>
            : <>We can't find this product. Start a new search from the home page.</>}
        </p>
        <Link to="/" className="btn-primary inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
      </div>
    );
  }

  const lowestPrice = product.prices ? Math.min(...product.prices.map((p) => p.price || Infinity)) : product.lowestPrice;
  const highestPrice = product.prices ? Math.max(...product.prices.map((p) => p.price || 0)) : product.highestPrice;
  const savings = highestPrice && lowestPrice ? highestPrice - lowestPrice : 0;
  const sellerCount = product.prices?.length || 0;
  const cheapest = product.prices?.find((p) => p.price === lowestPrice);

  const tabs = [
    { id: 'prices', label: 'Prices', count: sellerCount },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="container-tight py-4 sm:py-6 lg:py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-gray hover:text-ink text-sm font-medium mb-4 sm:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to results
      </button>

      <div className="card-elev overflow-hidden mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-72 lg:w-96 aspect-[4/3] md:aspect-auto bg-gradient-to-br from-cream-soft via-cream to-yellow-soft flex items-center justify-center shrink-0 overflow-hidden">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <span className="font-serif text-7xl sm:text-8xl italic text-ink/10">{(product.category || 'P')[0]}</span>
            )}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 inline-flex items-center gap-1 bg-white/90 backdrop-blur text-ink text-[10px] sm:text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-yellow" /> Live from search
            </div>
          </div>

          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            {product.category && (
              <span className="chip chip-ghost !text-[10px] mb-2.5">
                {product.category}
              </span>
            )}

            <h1 className="font-serif text-xl sm:text-2xl lg:text-[28px] font-bold text-ink mb-3 leading-[1.15] tracking-tight">
              {product.name}
            </h1>

            {product.description && (
              <p className="text-gray text-[13px] sm:text-sm leading-relaxed mb-4 max-w-2xl line-clamp-3">
                {product.description}
              </p>
            )}

            {(product.averageRating || product.totalReviews) && (
              <div className="flex items-center gap-2 sm:gap-3 mb-5 flex-wrap">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(product.averageRating || 0) ? 'text-yellow fill-yellow' : 'text-line-strong'}`} />
                  ))}
                </div>
                {product.averageRating != null && (
                  <span className="text-ink font-semibold text-sm">{Number(product.averageRating).toFixed(1)}</span>
                )}
                {product.totalReviews != null && (
                  <span className="text-gray text-xs sm:text-sm">({product.totalReviews} reviews)</span>
                )}
              </div>
            )}

            <div className="rounded-2xl bg-gradient-to-br from-cream-soft to-white border border-line p-3 sm:p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4">
                <div>
                  <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-gray mb-0.5">Lowest right now</div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-serif text-3xl sm:text-4xl font-bold italic text-red leading-none">{formatPrice(lowestPrice)}</span>
                    {cheapest && <span className="text-xs sm:text-sm text-gray">on <span className="font-semibold text-ink">{cheapest.siteName}</span></span>}
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="inline-flex items-center gap-1 bg-green/10 text-green text-[11px] sm:text-xs font-semibold px-2 py-1 rounded-full">
                        <TrendingDown className="w-3.5 h-3.5" /> Save {formatPrice(savings)}
                      </span>
                      <span className="text-gray text-[11px] sm:text-xs">vs highest seller</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {cheapest && cheapest.productUrl && (
                <a href={cheapest.productUrl} target="_blank" rel="noopener noreferrer" className="btn-accent flex-1 sm:flex-none">
                  Buy from {cheapest.siteName} <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button className="btn-ghost">
                <Bell className="w-4 h-4" /> Price alert
              </button>
              <button className="btn-ghost">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            {sellerCount > 0 && (
              <p className="text-gray text-xs mt-4 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green" />
                Available from <span className="font-semibold text-ink">{sellerCount}</span> {sellerCount === 1 ? 'seller' : 'sellers'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-white border border-line rounded-full p-1 mb-4 sm:mb-6 overflow-x-auto no-scrollbar sticky top-14 sm:top-16 z-10 shadow-[var(--shadow-soft)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all inline-flex items-center justify-center gap-1.5 ${
              activeTab === tab.id ? 'bg-ink text-cream shadow-sm' : 'text-gray hover:text-ink'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${activeTab === tab.id ? 'bg-cream/10' : 'bg-ink/5'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {activeTab === 'prices' && <PriceComparisonTable prices={product.prices || []} />}
        {activeTab === 'history' && <PriceHistoryChart history={history} />}
      </div>
    </div>
  );
}
