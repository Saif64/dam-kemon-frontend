import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getProduct, getProductHistory, getDailyPriceHistory, getShopTrust, getSellerTrust } from '../api/api';
import { trackView } from '../api/analytics';
import { pushRecent } from '../api/recentlyViewed';
import { addToWishlist, removeFromWishlist, listWishlist, updateWishlistAlert } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import PriceComparisonTable from '../components/PriceComparisonTable';
import PriceHistoryChart from '../components/PriceHistoryChart';
import SmartVerdict from '../components/SmartVerdict';
import ReviewsPanel from '../components/ReviewsPanel';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductSEO from '../components/ProductSEO';
import {
  ArrowLeft, Star, Share2, Bell, ShieldCheck, Store, AlertTriangle, Heart,
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

  useEffect(() => {
    const pid = product?.id || id;
    if (pid) {
      trackView(pid);
      pushRecent(pid);
    }
  }, [product?.id, id]);

  const { user } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    alertsEnabled: false,
    targetPrice: '',
    alertOnDropPercent: 10,
  });

  useEffect(() => {
    if (!user) { setInWishlist(false); return; }
    const pid = product?.id || id;
    if (!pid) return;
    listWishlist().then((r) => {
      const row = (r.data || []).find((w) => (w.product?.id || w.productId) === pid);
      setInWishlist(!!row);
      if (row) {
        setAlertSettings({
          alertsEnabled: !!row.alertsEnabled,
          targetPrice: row.targetPrice ?? '',
          alertOnDropPercent: row.alertOnDropPercent != null
            ? Math.round(row.alertOnDropPercent * 100) : 10,
        });
      }
    }).catch(() => {});
  }, [user, product?.id, id]);

  const toggleWishlist = async () => {
    const pid = product?.id || id;
    if (!pid || !user) { navigate('/sign-in'); return; }
    setWishlistBusy(true);
    try {
      if (inWishlist) { await removeFromWishlist(pid); setInWishlist(false); }
      else { await addToWishlist(pid); setInWishlist(true); }
    } catch { /* noop */ }
    finally { setWishlistBusy(false); }
  };

  const openTrackPrice = async () => {
    const pid = product?.id || id;
    if (!pid) return;
    if (!user) { navigate('/sign-in'); return; }
    // Add to wishlist first if not already — alerts hang off a wishlist row
    if (!inWishlist) {
      try { await addToWishlist(pid); setInWishlist(true); }
      catch { return; }
    }
    setAlertModalOpen(true);
  };

  const saveAlertSettings = async () => {
    const pid = product?.id || id;
    if (!pid) return;
    setWishlistBusy(true);
    try {
      const tp = alertSettings.targetPrice === '' ? null : Number(alertSettings.targetPrice);
      await updateWishlistAlert(pid, {
        alertsEnabled: !!alertSettings.alertsEnabled,
        targetPrice: Number.isFinite(tp) ? tp : null,
        alertOnDropPercent: Math.max(1, Math.min(50, Number(alertSettings.alertOnDropPercent) || 10)) / 100,
      });
      setAlertModalOpen(false);
    } catch { /* noop */ }
    finally { setWishlistBusy(false); }
  };

  const [dailySeries, setDailySeries] = useState([]);
  useEffect(() => {
    const pid = product?.id || id;
    if (!pid) return;
    getDailyPriceHistory(pid, 30).then((r) => {
      setDailySeries(Array.isArray(r.data) ? r.data : []);
    }).catch(() => {});
  }, [product?.id, id]);

  // Trust / delivery / genuineness profiles for every seller on this product,
  // fetched in one batched call keyed by shop slug.
  const [trust, setTrust] = useState({});
  useEffect(() => {
    const slugs = [...new Set((product?.prices || []).map((p) => p.siteSlug || p.siteName).filter(Boolean))];
    if (slugs.length === 0) { setTrust({}); return; }
    let alive = true;
    getShopTrust(slugs).then((r) => { if (alive && r.data) setTrust(r.data); }).catch(() => {});
    return () => { alive = false; };
  }, [product?.id, id]);

  // Per-seller reputation for marketplace sub-sellers (Daraz storefronts, etc),
  // keyed by sellerId — real, data-derived scores so we can rank one Daraz
  // seller against another, not just show the marketplace's blanket score.
  const [sellerTrust, setSellerTrust] = useState({});
  useEffect(() => {
    const ids = [...new Set((product?.prices || []).map((p) => p.sellerId).filter(Boolean))];
    if (ids.length === 0) { setSellerTrust({}); return; }
    let alive = true;
    getSellerTrust(ids).then((r) => { if (alive && r.data) setSellerTrust(r.data); }).catch(() => {});
    return () => { alive = false; };
  }, [product?.id, id]);

  // A freshly submitted review returns the seller's updated trust profile —
  // merge it so the verdict + comparison table reflect it without a refetch.
  const onTrustUpdated = (t) => {
    if (t && t.shopSlug) setTrust((m) => ({ ...m, [t.shopSlug]: t }));
  };

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

  return (
    <div className="container-tight py-4 sm:py-6 lg:py-8">
      <ProductSEO product={product} />
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-gray hover:text-ink text-sm font-medium mb-4 sm:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to results
      </button>

      {/* Slim identity header — just enough product context; the price
          comparison leads the page since we compare prices + reviews. */}
      <div className="card-elev p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cream-soft via-cream to-yellow-soft flex items-center justify-center shrink-0 overflow-hidden">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <span className="font-serif text-3xl italic text-ink/15">{(product.category || 'P')[0]}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {product.category && (
                <span className="chip chip-ghost !text-[10px] !py-0.5">{product.category}</span>
              )}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                sellerCount > 1 ? 'bg-green text-white' : 'bg-cream-soft text-ink/60'
              }`}>
                <Store className="w-3 h-3" />
                {sellerCount === 0 ? 'No sellers' : sellerCount === 1 ? '1 seller' : `${sellerCount} sellers`}
              </span>
            </div>

            <h1 className="font-serif text-lg sm:text-2xl font-bold text-ink leading-[1.15] tracking-tight line-clamp-2">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {product.averageRating > 0 ? (
                <>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.averageRating || 0) ? 'text-yellow fill-yellow' : 'text-line-strong'}`} />
                    ))}
                  </div>
                  <span className="text-ink font-semibold text-sm">{Number(product.averageRating).toFixed(1)}</span>
                  {product.totalReviews > 0 && (
                    <span className="text-gray text-xs">
                      ({Number(product.totalReviews).toLocaleString('en-IN')} {product.totalReviews === 1 ? 'review' : 'reviews'})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray text-xs">No reviews aggregated yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions — buying happens in the price comparison rows below */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
          <button
            onClick={toggleWishlist}
            disabled={wishlistBusy}
            className={`btn-ghost ${inWishlist ? 'text-red' : ''}`}
            title={user ? (inWishlist ? 'Remove from wishlist' : 'Add to wishlist') : 'Sign in to save'}
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red' : ''}`} />
            {inWishlist ? 'Saved' : 'Wishlist'}
          </button>
          <button
            onClick={openTrackPrice}
            className={`btn-ghost ${alertSettings.alertsEnabled ? 'text-green' : ''}`}
            title={alertSettings.alertsEnabled ? 'Edit price drop alert' : 'Notify me when price drops'}
          >
            <Bell className={`w-4 h-4 ${alertSettings.alertsEnabled ? 'fill-green/30' : ''}`} />
            {alertSettings.alertsEnabled ? 'Tracking' : 'Track price'}
          </button>
          <button
            onClick={() => {
              const url = window.location.href;
              if (navigator.share) navigator.share({ title: product.name, url }).catch(() => {});
              else navigator.clipboard?.writeText(url);
            }}
            className="btn-ghost"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
          <Link
            to={`/protect?productId=${encodeURIComponent(product.id || id)}&shopSlug=${encodeURIComponent(cheapest?.siteSlug || cheapest?.siteName || '')}&itemName=${encodeURIComponent(product.name || '')}&amount=${lowestPrice || ''}`}
            className="btn-ghost"
            title="Check scam risk & open a protected order"
          >
            <ShieldCheck className="w-4 h-4 text-green" /> Buy Protected
          </Link>
        </div>
      </div>

      {/* 1 — Price comparison: the lead. We're a price + review comparison site. */}
      <section className="mb-6 sm:mb-8">
        <div className="mb-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold italic text-ink leading-tight">Price comparison</h2>
          <p className="text-[11px] sm:text-xs text-gray font-mono mt-0.5">
            {sellerCount} {sellerCount === 1 ? 'seller' : 'sellers'} · lowest {formatPrice(lowestPrice)}
            {savings > 0 && <> · save {formatPrice(savings)} vs highest</>}
          </p>
        </div>
        <PriceComparisonTable prices={product.prices || []} productId={product.id || id} trust={trust} sellerTrust={sellerTrust} />
      </section>

      {/* 2 — Smart verdict (carries its own card header + margin) */}
      <SmartVerdict product={product} trust={trust} />

      {/* 3 — Reviews & trust */}
      <section className="mb-6 sm:mb-8">
        <div className="mb-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold italic text-ink leading-tight">Reviews &amp; trust</h2>
          <p className="text-[11px] sm:text-xs text-gray font-mono mt-0.5">What buyers say across every seller</p>
        </div>
        <ReviewsPanel productId={product.id || id} product={product} onTrustUpdated={onTrustUpdated} />
      </section>

      {/* 4 — Price history */}
      <section className="mb-2">
        <PriceHistoryChart history={history} dailySeries={dailySeries} />
      </section>

      {alertModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm p-3 sm:p-6 animate-fade-in"
          onClick={() => setAlertModalOpen(false)}
        >
          <div
            className="bg-cream rounded-3xl shadow-[var(--shadow-lift)] border border-line-strong w-full max-w-md p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold italic text-ink">Track this price</h3>
                <p className="text-xs text-gray mt-1">We'll email you the moment it drops.</p>
              </div>
              <button
                onClick={() => setAlertModalOpen(false)}
                className="p-1.5 -mr-1 rounded-full hover:bg-ink/5 text-gray hover:text-ink"
                aria-label="Close"
              >
                <ArrowLeft className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-4 px-3 py-2.5 rounded-2xl bg-white border border-line">
              <input
                type="checkbox"
                checked={!!alertSettings.alertsEnabled}
                onChange={(e) => setAlertSettings((s) => ({ ...s, alertsEnabled: e.target.checked }))}
                className="mt-0.5 w-4 h-4"
              />
              <span className="text-sm">
                <span className="font-semibold text-ink">Enable price alerts</span>
                <span className="block text-[11px] text-gray mt-0.5">
                  Currently lowest: <span className="font-mono">{formatPrice(lowestPrice)}</span>
                </span>
              </span>
            </label>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1.5">
                  Target price (notify when below)
                </label>
                <div className="flex items-center gap-2 bg-white border border-line rounded-2xl px-3 py-2">
                  <span className="text-gray font-mono">৳</span>
                  <input
                    type="number"
                    value={alertSettings.targetPrice}
                    onChange={(e) => setAlertSettings((s) => ({ ...s, targetPrice: e.target.value }))}
                    placeholder={lowestPrice ? Math.round(lowestPrice * 0.9).toString() : 'e.g. 65000'}
                    className="flex-1 bg-transparent outline-none text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1.5">
                  Or notify on any drop ≥ <b>{alertSettings.alertOnDropPercent}%</b>
                </label>
                <input
                  type="range"
                  min="1" max="50" step="1"
                  value={alertSettings.alertOnDropPercent}
                  onChange={(e) => setAlertSettings((s) => ({ ...s, alertOnDropPercent: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAlertModalOpen(false)}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={saveAlertSettings}
                disabled={wishlistBusy}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {wishlistBusy ? 'Saving…' : 'Save alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
