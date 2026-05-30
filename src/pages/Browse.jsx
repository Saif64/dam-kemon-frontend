import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllProducts, getShopTrust, getCategories } from '../api/api';
import SearchProductCard from '../components/SearchProductCard';
import SearchProductCardSkeleton from '../components/SearchProductCardSkeleton';
import { LayoutGrid, ArrowUpDown, PackageSearch, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

// Collapsed chip rail height — roughly two rows of py-2 chips + the gap.
const CHIPS_COLLAPSED = '4.75rem';

const PAGE_SIZE = 24;

const sortOptions = [
  { id: 'default', label: 'Featured' },
  { id: 'price_asc', label: 'Cheapest first' },
  { id: 'price_desc', label: 'Highest first' },
];

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(false);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [showSort, setShowSort] = useState(false);
  const [trust, setTrust] = useState({});
  const [categories, setCategories] = useState([]);
  const [chipsExpanded, setChipsExpanded] = useState(false);
  const [chipsOverflow, setChipsOverflow] = useState(false);
  const chipsRef = useRef(null);

  useEffect(() => {
    getCategories().then((r) => { if (Array.isArray(r.data)) setCategories(r.data); }).catch(() => {});
  }, []);

  // Decide whether the "show more" toggle is needed: does the full chip set
  // exceed the collapsed two-line cap? Re-measures on category load + resize.
  useLayoutEffect(() => {
    const el = chipsRef.current;
    if (!el) return;
    const measure = () => setChipsOverflow(el.scrollHeight > 88);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [categories]);

  const loadPage = (p, cat, replace) => {
    setLoading(true);
    setError(false);
    getAllProducts(p, PAGE_SIZE, cat || undefined)
      .then((res) => {
        const data = res.data || {};
        const content = Array.isArray(data.content) ? data.content : [];
        setItems((prev) => (replace ? content : [...prev, ...content]));
        setLast(!!data.last || content.length < PAGE_SIZE);
        setTotal(typeof data.totalElements === 'number' ? data.totalElements : null);
        setPage(p);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  // Reset and reload whenever the category filter changes.
  useEffect(() => {
    setItems([]);
    setLast(false);
    setTotal(null);
    loadPage(0, category, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Batch-fetch trust for the cheapest seller of each loaded product.
  useEffect(() => {
    if (!items.length) { setTrust({}); return; }
    const slugs = [...new Set(items.map((p) => {
      const ps = (p.prices || []).slice().sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      return ps[0]?.siteSlug || ps[0]?.siteName;
    }).filter(Boolean))].slice(0, 50);
    if (!slugs.length) return;
    let alive = true;
    getShopTrust(slugs).then((r) => { if (alive && r.data) setTrust((m) => ({ ...m, ...r.data })); }).catch(() => {});
    return () => { alive = false; };
  }, [items]);

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sortBy === 'price_asc') arr.sort((a, b) => (a.lowestPrice ?? Infinity) - (b.lowestPrice ?? Infinity));
    else if (sortBy === 'price_desc') arr.sort((a, b) => (b.lowestPrice ?? 0) - (a.lowestPrice ?? 0));
    return arr;
  }, [items, sortBy]);

  const setCategory = (c) => {
    const next = new URLSearchParams(params);
    if (c) next.set('category', c); else next.delete('category');
    setParams(next);
  };

  const initialLoading = loading && items.length === 0;

  return (
    <div className="container-tight py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 mb-4 sm:mb-5">
        <div>
          <div className="tag-bar mb-2 inline-flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5" /> Catalog
          </div>
          <h1 className="font-serif font-semibold text-[clamp(1.6rem,4vw,2.5rem)] leading-tight tracking-tight">
            Browse <em className="text-red">{category ? category : 'everything'}</em>
          </h1>
          <p className="text-gray text-sm mt-1">
            {total != null
              ? <><span className="font-mono text-ink">{total.toLocaleString('en-IN')}</span> products{category ? ` in ${category}` : ' across every shop'} — cheapest seller, trust &amp; delivery on each.</>
              : 'Every product we index, with the smart-buy signals on each.'}
          </p>
        </div>

        {/* Sort */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSort((s) => !s)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink bg-white border border-line rounded-full px-3 py-2 hover:border-line-strong transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sort</span>
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-[var(--shadow-lift)] border border-line-strong z-20 py-2 min-w-[180px] animate-slide-down">
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

      {/* Category chips — wrap to ~2 lines, then reveal the rest on demand */}
      <div className="mb-4 sm:mb-5">
        <div
          ref={chipsRef}
          className="flex flex-wrap gap-1.5 sm:gap-2 overflow-hidden transition-[max-height] duration-300 ease-out"
          style={{ maxHeight: chipsExpanded ? '1000px' : CHIPS_COLLAPSED }}
        >
          <Chip active={!category} onClick={() => setCategory('')}>All</Chip>
          {categories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
          ))}
        </div>
        {chipsOverflow && (
          <button
            onClick={() => setChipsExpanded((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-ink/70 hover:text-ink transition-colors"
          >
            {chipsExpanded
              ? <>Show less <ChevronUp className="w-3.5 h-3.5" /></>
              : <>Show all categories <ChevronDown className="w-3.5 h-3.5" /></>}
          </button>
        )}
      </div>

      {/* Content */}
      {initialLoading ? (
        <div className="space-y-2.5 sm:space-y-3">
          {[...Array(5)].map((_, i) => <SearchProductCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="card-soft p-8 sm:p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-red-soft mb-4">
            <AlertTriangle className="w-8 h-8 text-red" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold italic text-ink mb-2">Couldn't load the catalog</h2>
          <p className="text-gray text-sm max-w-md mx-auto mb-5">
            The backend at <code className="font-mono text-ink bg-cream-soft px-1.5 py-0.5 rounded">/api</code> isn't responding. Start it with <code className="font-mono text-ink bg-cream-soft px-1.5 py-0.5 rounded">./gradlew bootRun</code>.
          </p>
          <button onClick={() => loadPage(0, category, true)} className="btn-ghost inline-flex">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="card-soft p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-cream-soft mb-4">
            <PackageSearch className="w-8 h-8 text-ink/30" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold italic text-ink mb-2">Nothing here yet</h2>
          <p className="text-gray text-sm max-w-md mx-auto">
            {category
              ? <>No <b>{category}</b> products are indexed yet. Try another category or browse <button onClick={() => setCategory('')} className="text-ink underline">everything</button>.</>
              : 'The catalog is empty. The indexer crawls 80+ BD shops nightly at 3 AM.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4">
            {sorted.map((p, i) => (
              <SearchProductCard key={p.id || p.slug || i} product={p} trust={trust} />
            ))}
          </div>

          <div className="flex justify-center mt-6 sm:mt-8">
            {!last ? (
              <button
                onClick={() => loadPage(page + 1, category)}
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Loading…</> : <>Load more products</>}
              </button>
            ) : (
              <p className="text-gray text-sm font-mono">You've reached the end · {items.length} shown</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 font-mono text-[11px] sm:text-xs px-3 sm:px-3.5 py-2 rounded-full border transition-all whitespace-nowrap capitalize ${
        active ? 'bg-ink text-cream border-ink' : 'bg-white text-ink/70 border-line hover:border-line-strong hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
