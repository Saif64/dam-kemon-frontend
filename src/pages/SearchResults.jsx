import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchProducts, getShopTrust } from '../api/api';
import SearchProductCard from '../components/SearchProductCard';
import { SkeletonRow } from '../components/LoadingSpinner';
import SearchProductCardSkeleton from '../components/SearchProductCardSkeleton';
import {
  Search, ArrowUpDown, ArrowLeft, Sparkles, TrendingDown,
  TrendingUp, Equal, AlertTriangle, RefreshCw, Lightbulb,
} from 'lucide-react';

const filterOptions = [
  { id: 'all',      label: 'All products' },
  { id: 'in_stock', label: 'In stock' },
  { id: 'rating',   label: '★ 4+' },
  { id: 'multi',    label: 'Multi-seller' },
];

const sortOptions = [
  { id: 'relevance',  label: 'Most relevant' },
  { id: 'price_asc',  label: 'Cheapest first' },
  { id: 'price_desc', label: 'Highest first' },
  { id: 'rating',     label: 'Top rated' },
];

function formatPrice(price) {
  if (!price && price !== 0) return 'N/A';
  return '৳' + Number(price).toLocaleString('en-IN');
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [showSort, setShowSort] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [trust, setTrust] = useState({});

  const runSearch = (q) => {
    if (!q) { setLoading(false); setError(null); return; }
    setLoading(true);
    setError(null);
    searchProducts(q)
      .then((res) => {
        const data = res.data || {};
        setProducts(Array.isArray(data.products) ? data.products : []);
        setMeta({
          totalResults: data.totalResults ?? 0,
          sitesSearched: data.sitesSearched ?? [],
          detectedCategory: data.detectedCategory,
          brands: data.brands ?? [],
          confidence: data.confidence,
          didYouMean: data.didYouMean,
          sponsoredProductIds: data.sponsoredProductIds || [],
        });
      })
      .catch((err) => {
        const status = err.response?.status;
        setError({ kind: status ? 'http' : 'network', message: err.message, status });
        setProducts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSearchInput(query);
    runSearch(query);
  }, [query]);

  // Trust hint on each card uses the cheapest seller's profile; batch them.
  useEffect(() => {
    if (!products.length) { setTrust({}); return; }
    const slugs = [...new Set(products.map((p) => {
      const ps = (p.prices || []).slice().sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      return ps[0]?.siteSlug || ps[0]?.siteName;
    }).filter(Boolean))].slice(0, 50);
    if (!slugs.length) return;
    let alive = true;
    getShopTrust(slugs).then((r) => { if (alive && r.data) setTrust(r.data); }).catch(() => {});
    return () => { alive = false; };
  }, [products]);

  const handleNewSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) setSearchParams({ q: searchInput.trim() });
  };

  const filtered = useMemo(() => products.filter((p) => {
    const prices = p.prices || [];
    if (activeFilter === 'in_stock') return prices.some((sp) => sp.inStock !== false);
    if (activeFilter === 'rating')   return (p.averageRating || 0) >= 4;
    if (activeFilter === 'multi')    return prices.length >= 2;
    return true;
  }), [products, activeFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'price_asc')  arr.sort((a, b) => (a.lowestPrice ?? Infinity) - (b.lowestPrice ?? Infinity));
    else if (sortBy === 'price_desc') arr.sort((a, b) => (b.lowestPrice ?? 0) - (a.lowestPrice ?? 0));
    else if (sortBy === 'rating')     arr.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
    return arr;
  }, [filtered, sortBy]);

  const stats = useMemo(() => {
    const lows = sorted.map((p) => p.lowestPrice).filter((v) => v != null);
    if (lows.length === 0) return null;
    const low = Math.min(...lows);
    const high = Math.max(...lows);
    const avg = Math.round(lows.reduce((s, v) => s + v, 0) / lows.length);
    return { low, high, avg, savings: high - low };
  }, [sorted]);

  // "Smart pick" — the single result that best balances seller trust, price
  // and delivery (not just relevance or cheapest). Needs trust data + at least
  // two comparable results, so it only appears once profiles have loaded.
  const smartPickId = useMemo(() => {
    const rows = sorted.map((p) => {
      const ps = (p.prices || []).slice().sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      const cheap = ps[0];
      return { id: p.id, price: cheap?.price ?? null, t: cheap ? trust[cheap.siteSlug || cheap.siteName] : null };
    }).filter((r) => r.id && r.price != null);
    if (rows.length < 2 || !rows.some((r) => r.t)) return null;
    const prices = rows.map((r) => r.price);
    const min = Math.min(...prices), max = Math.max(...prices);
    const span = max - min || 1;
    let best = null, bestScore = -Infinity;
    for (const r of rows) {
      const trustN = (r.t?.trustScore ?? 60) / 100;
      const priceAdv = (max - r.price) / span; // 1 = cheapest, 0 = priciest
      const dmid = r.t ? (r.t.avgReportedDelivery ?? (((r.t.deliveryDaysMin ?? 3) + (r.t.deliveryDaysMax ?? 7)) / 2)) : 5;
      const delN = Math.max(0, Math.min(1, 1 - dmid / 10));
      const score = 0.5 * trustN + 0.3 * priceAdv + 0.2 * delN;
      if (score > bestScore) { bestScore = score; best = r.id; }
    }
    return best;
  }, [sorted, trust]);

  if (!query) {
    return (
      <div className="container-tight py-16 sm:py-24 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-cream-soft mb-6">
          <Search className="w-10 h-10 sm:w-12 sm:h-12 text-ink/30" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold italic text-ink mb-2">Search for products</h2>
        <p className="text-gray text-sm sm:text-base">Enter a product name to compare prices across sellers</p>
      </div>
    );
  }

  return (
    <div className="container-tight py-4 sm:py-6 lg:py-8">
      {/* Back + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-5">
        <Link to="/" className="inline-flex items-center gap-1.5 text-gray hover:text-ink text-sm font-medium transition-colors shrink-0 self-start">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <form onSubmit={handleNewSearch} className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-24 py-3 bg-white border border-line-strong rounded-2xl text-sm sm:text-[15px] text-ink placeholder-gray-soft focus:outline-none focus:border-ink/40 focus:shadow-[0_0_0_4px_rgba(21,19,26,0.04)] transition-all"
            placeholder="Search again…"
          />
          <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-ink hover:bg-red text-cream text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* Did-you-mean hint — surfaces when literal search returned nothing
          and we fell back to fuzzy. Click to re-search with the suggestion. */}
      {!loading && !error && meta?.didYouMean && meta.didYouMean !== query && (
        <button
          onClick={() => setSearchParams({ q: meta.didYouMean })}
          className="w-full mb-3 inline-flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-yellow-soft border border-yellow text-left hover:bg-yellow/50 transition-colors group"
        >
          <span className="inline-flex items-center gap-2 text-sm">
            <Lightbulb className="w-4 h-4 text-yellow shrink-0" />
            <span className="text-gray">Did you mean</span>
            <span className="font-serif italic font-semibold text-ink truncate">{meta.didYouMean}</span>
            <span className="text-gray">?</span>
          </span>
          <span className="text-xs font-mono text-ink group-hover:underline shrink-0">Search this</span>
        </button>
      )}

      {/* Context */}
      <div className="card-elev p-4 sm:p-5 mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-ink font-semibold text-sm sm:text-base">
              {loading ? (
                <span className="text-gray">Searching the catalog…</span>
              ) : error ? (
                <span className="text-red">Unable to fetch results</span>
              ) : (
                <>
                  <span className="font-mono text-base sm:text-lg">{sorted.length}</span> {sorted.length === 1 ? 'product' : 'products'} for{' '}
                  <span className="font-serif italic text-red">"{query}"</span>
                </>
              )}
            </h1>
            {!loading && !error && meta?.detectedCategory && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="chip chip-ghost !text-[10px] !py-1 !px-2.5">
                  <Sparkles className="w-3 h-3 text-yellow" />
                  Category: <b className="ml-1 capitalize">{meta.detectedCategory}</b>
                </span>
                {meta?.brands?.length > 0 && (
                  <span className="chip chip-ghost !text-[10px] !py-1 !px-2.5 capitalize">
                    Brand: <b className="ml-1">{meta.brands.join(', ')}</b>
                  </span>
                )}
                {meta?.sitesSearched?.length > 0 && (
                  <span className="chip chip-ghost !text-[10px] !py-1 !px-2.5 text-gray" title={meta.sitesSearched.join(', ')}>
                    {meta.sitesSearched.length} {meta.sitesSearched.length === 1 ? 'shop' : 'shops'} have it
                  </span>
                )}
              </div>
            )}
            {!loading && !error && stats && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] sm:text-xs text-gray mt-2">
                <span className="inline-flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-green" /> Low <span className="text-green font-bold">{formatPrice(stats.low)}</span>
                </span>
                <span className="text-line-strong">·</span>
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-red" /> High <span className="text-red font-bold">{formatPrice(stats.high)}</span>
                </span>
                <span className="text-line-strong">·</span>
                <span className="inline-flex items-center gap-1">
                  <Equal className="w-3 h-3" /> Avg <span className="text-ink font-bold">{formatPrice(stats.avg)}</span>
                </span>
              </div>
            )}
          </div>
          {!loading && !error && stats && stats.savings > 0 && (
            <div className="inline-flex items-center gap-2 bg-lime/30 border border-green/20 text-green px-3 py-2 rounded-xl shrink-0 self-start">
              <Sparkles className="w-4 h-4" />
              <div className="text-[11px] sm:text-xs font-mono leading-tight">
                <div className="font-bold">Save {formatPrice(stats.savings)}</div>
                <div className="text-green/70 text-[10px]">cheapest vs priciest</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter + Sort */}
      <div className="sticky top-14 sm:top-16 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 backdrop-blur-lg bg-cream/85 mb-3 sm:mb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
            {filterOptions.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id)}
                className={`shrink-0 font-mono text-[11px] sm:text-xs px-3 sm:px-3.5 py-2 rounded-full border transition-all whitespace-nowrap ${
                  activeFilter === chip.id
                    ? 'bg-ink text-cream border-ink'
                    : 'bg-white text-ink/70 border-line hover:border-line-strong hover:text-ink'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => setShowSort(!showSort)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink bg-white border border-line rounded-full px-3 py-2 hover:border-line-strong transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sort</span>
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-[var(--shadow-lift)] border border-line-strong z-10 py-2 min-w-[200px] animate-slide-down">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                    className={`w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-cream-soft transition-colors ${sortBy === opt.id ? 'font-bold text-ink' : 'text-gray'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2.5 sm:space-y-3">
          {[...Array(4)].map((_, i) => <SearchProductCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="card-soft p-8 sm:p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-red-soft mb-4">
            <AlertTriangle className="w-8 h-8 text-red" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold italic text-ink mb-2">
            {error.kind === 'network' ? 'Backend unreachable' : 'Search failed'}
          </h2>
          <p className="text-gray text-sm max-w-md mx-auto mb-5">
            {error.kind === 'network'
              ? <>The backend at <code className="font-mono text-ink bg-cream-soft px-1.5 py-0.5 rounded">/api</code> isn't responding. Start it with <code className="font-mono text-ink bg-cream-soft px-1.5 py-0.5 rounded">./gradlew bootRun</code>.</>
              : error.message || 'Try again in a moment.'}
          </p>
          <button onClick={() => runSearch(query)} className="btn-ghost inline-flex">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="card-soft p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-cream-soft mb-4">
            <Search className="w-8 h-8 text-ink/30" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold italic text-ink mb-2">No results yet</h2>
          <p className="text-gray text-sm max-w-md mx-auto">
            Our catalog doesn't have anything matching <b>"{query}"</b> yet.
            The indexer crawls 60+ BD shops nightly at 3 AM — try a broader term, or trigger a reindex
            from <Link to="/dashboard" className="text-ink underline">Dashboard → Quick scrape</Link>.
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {sorted.map((p, i) => (
            <SearchProductCard
              key={p.id || p.slug || i}
              product={p}
              rank={i + 1}
              query={query}
              sponsored={!!meta?.sponsoredProductIds?.includes(p.id)}
              trust={trust}
              smartPick={!!smartPickId && p.id === smartPickId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
