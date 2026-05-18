import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { compareProducts, getAllProducts } from '../api/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ArrowLeft, Plus, X, Crown, Star, Store, AlertTriangle, ExternalLink, Search,
} from 'lucide-react';

function fmt(value, unit) {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    const formatted = Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    if (unit === '৳')  return '৳' + formatted;
    if (unit === '%') return formatted + '%';
    if (unit === '★') return formatted + ' ★';
    return formatted;
  }
  return String(value);
}

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const idsParam = searchParams.get('ids') || '';
  const ids = idsParam.split(',').filter(Boolean).slice(0, 4);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [picker, setPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerProducts, setPickerProducts] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  useEffect(() => {
    if (ids.length === 0) { setData(null); return; }
    setLoading(true);
    setError(null);
    compareProducts(ids)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.status === 0 || !err.response ? 'network' : 'unknown'))
      .finally(() => setLoading(false));
  }, [idsParam]);

  // Load some products for the picker
  useEffect(() => {
    if (!picker) return;
    setPickerLoading(true);
    getAllProducts(0, 30)
      .then((res) => {
        const list = res.data?.content || res.data || [];
        setPickerProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => setPickerProducts([]))
      .finally(() => setPickerLoading(false));
  }, [picker]);

  const addProduct = (id) => {
    if (!id || ids.includes(id)) return;
    const next = [...ids, id].slice(0, 4);
    setSearchParams({ ids: next.join(',') });
    setPicker(false);
    setPickerQuery('');
  };

  const removeProduct = (id) => {
    const next = ids.filter((x) => x !== id);
    if (next.length === 0) setSearchParams({});
    else setSearchParams({ ids: next.join(',') });
  };

  const filteredPicker = pickerProducts.filter((p) => {
    if (!pickerQuery) return !ids.includes(p.id);
    const q = pickerQuery.toLowerCase();
    return !ids.includes(p.id) && (p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
  });

  const products = data?.products || [];
  const attributes = data?.attributes || [];
  const winners = data?.bestIndexByAttribute || {};

  return (
    <div className="container-tight py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-7">
        <Link to="/" className="inline-flex items-center gap-1.5 text-gray hover:text-ink text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <button
          onClick={() => navigate('/search?q=')}
          className="text-sm text-gray hover:text-ink"
        >
          Pick from search instead →
        </button>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="tag-bar mb-2 sm:mb-3">Side by side</div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold italic text-ink tracking-tight leading-[1.05]">
          Compare <em className="text-red">up to 4 products</em>
        </h1>
        <p className="text-gray text-sm sm:text-base mt-2">See specs, prices, and ratings stacked against each other in one row.</p>
      </div>

      {/* Slot row */}
      <div className={`grid gap-3 sm:gap-4 mb-5 ${
        Math.max(2, ids.length + (ids.length < 4 ? 1 : 0)) === 2 ? 'grid-cols-2'
        : Math.max(2, ids.length + (ids.length < 4 ? 1 : 0)) === 3 ? 'grid-cols-2 sm:grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-4'
      }`}>
        {products.map((p, i) => (
          <div key={p.id || i} className="card-soft relative overflow-hidden">
            <button
              onClick={() => removeProduct(p.id)}
              className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-red hover:text-white flex items-center justify-center shadow"
              aria-label="Remove"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="aspect-[4/3] bg-gradient-to-br from-cream-soft to-cream flex items-center justify-center overflow-hidden">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-5xl italic text-ink/15">{(p.category || 'P')[0]}</span>
              )}
            </div>
            <div className="p-3">
              {p.category && (
                <span className="font-mono text-[9px] uppercase tracking-wider text-gray">{p.category}</span>
              )}
              <Link to={`/product/${p.id}`} className="block mt-1">
                <h3 className="font-serif text-sm sm:text-base font-semibold text-ink leading-snug line-clamp-2 hover:text-red transition-colors">
                  {p.name}
                </h3>
              </Link>
              {p.lowestPrice != null && (
                <div className="mt-2 font-mono text-base font-bold text-ink">
                  {fmt(p.lowestPrice, '৳')}
                  <div className="font-sans text-[10px] text-gray font-normal">cheapest</div>
                </div>
              )}
            </div>
          </div>
        ))}

        {ids.length < 4 && (
          <button
            onClick={() => setPicker(true)}
            className="rounded-2xl border-2 border-dashed border-line-strong hover:border-ink hover:bg-cream-soft/60 transition-all flex flex-col items-center justify-center text-gray hover:text-ink min-h-[200px] sm:min-h-[240px]"
          >
            <Plus className="w-8 h-8 mb-1" />
            <span className="text-sm font-medium">Add product</span>
            <span className="text-[11px] text-gray-soft mt-1">{ids.length}/4</span>
          </button>
        )}
      </div>

      {/* Empty state */}
      {ids.length === 0 && !loading && (
        <div className="card-soft p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-cream-soft mb-4">
            <Plus className="w-8 h-8 text-ink/30" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold italic text-ink mb-2">Pick products to compare</h2>
          <p className="text-gray text-sm max-w-md mx-auto mb-5">
            Add up to 4 products and see them stacked side by side: price, rating, sellers, savings.
          </p>
          <button onClick={() => setPicker(true)} className="btn-accent inline-flex">
            <Plus className="w-4 h-4" /> Add your first product
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && <LoadingSpinner text="Loading comparison…" />}

      {/* Error */}
      {error && (
        <div className="card-soft p-8 sm:p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-red-soft mb-4">
            <AlertTriangle className="w-8 h-8 text-red" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold italic text-ink mb-2">
            {error === 'network' ? 'Backend unreachable' : 'Compare failed'}
          </h2>
          <p className="text-gray text-sm">Make sure the Spring Boot server is running on port 8080.</p>
        </div>
      )}

      {/* Comparison table */}
      {!loading && !error && products.length > 0 && attributes.length > 0 && (
        <div className="card-elev overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-line">
            <h2 className="font-serif text-base sm:text-lg lg:text-xl font-bold italic text-ink leading-tight">Spec sheet</h2>
            <p className="text-[11px] sm:text-xs text-gray mt-0.5">Winner per row gets the crown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-cream-soft/50">
                  <th className="text-left text-[11px] uppercase tracking-wider font-mono text-gray font-semibold px-4 sm:px-5 py-3 w-[28%]">Attribute</th>
                  {products.map((p, i) => (
                    <th key={p.id || i} className="text-left text-[11px] uppercase tracking-wider font-mono text-gray font-semibold px-4 sm:px-5 py-3 truncate max-w-[260px]">
                      <Link to={`/product/${p.id}`} className="text-ink hover:text-red transition-colors normal-case text-[13px] font-serif italic">
                        {p.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attributes.map((row) => (
                  <tr key={row.key} className="border-b border-line last:border-0 hover:bg-cream-soft/40">
                    <td className="px-4 sm:px-5 py-3 font-medium text-ink/80 align-top">{row.label}</td>
                    {row.values.map((v, i) => {
                      const isWinner = winners[row.key] === i && row.values.length > 1;
                      return (
                        <td key={i} className={`px-4 sm:px-5 py-3 align-top ${isWinner ? 'bg-lime/30' : ''}`}>
                          <div className="flex items-center gap-1.5">
                            {isWinner && <Crown className="w-3.5 h-3.5 text-yellow shrink-0" title="Winner" />}
                            <span className={`font-mono ${isWinner ? 'font-bold text-green' : 'text-ink'}`}>
                              {fmt(v, row.unit)}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Sellers row: show how many + cheapest seller per product */}
                <tr className="border-b border-line last:border-0 bg-cream-soft/30">
                  <td className="px-4 sm:px-5 py-3 font-medium text-ink/80 align-top">Best seller</td>
                  {products.map((p, i) => {
                    const prices = (p.prices || []).slice().sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
                    const cheapest = prices[0];
                    return (
                      <td key={i} className="px-4 sm:px-5 py-3 align-top">
                        {cheapest ? (
                          <div className="flex flex-col gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink">
                              <Store className="w-3 h-3" />{cheapest.siteName}
                            </span>
                            {cheapest.productUrl && cheapest.productUrl !== '#' && (
                              <a
                                href={cheapest.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red hover:underline"
                              >
                                Buy <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : <span className="text-gray">—</span>}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Picker Modal */}
      {picker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setPicker(false)} />
          <div className="relative w-full max-w-2xl card-elev overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold italic text-ink">Pick a product to compare</h3>
              <button
                onClick={() => setPicker(false)}
                className="w-9 h-9 rounded-full hover:bg-cream-soft flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-line">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
                <input
                  type="text"
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="Filter products…"
                  className="w-full pl-10 pr-3 py-2.5 bg-cream-soft border border-line rounded-xl text-sm text-ink placeholder-gray-soft focus:outline-none focus:border-ink/40"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {pickerLoading ? (
                <LoadingSpinner text="Loading products…" />
              ) : filteredPicker.length === 0 ? (
                <div className="p-8 text-center text-sm">
                  {pickerProducts.length === 0 ? (
                    <>
                      <p className="text-ink font-semibold mb-1">No saved products yet</p>
                      <p className="text-gray">Compare needs persisted products. Run a search first — anything we find gets saved (when MongoDB is reachable).</p>
                    </>
                  ) : (
                    <p className="text-gray">No products match the filter.</p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {filteredPicker.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p.id)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-cream-soft text-left transition-colors"
                    >
                      <div className="w-12 h-12 bg-cream-soft rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-serif text-lg italic text-ink/30">{(p.category || 'P')[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-ink truncate">{p.name}</div>
                        <div className="text-[11px] text-gray flex items-center gap-2 mt-0.5">
                          {p.category && <span>{p.category}</span>}
                          {p.lowestPrice != null && <span className="font-mono">{fmt(p.lowestPrice, '৳')}</span>}
                          {p.averageRating != null && (
                            <span className="inline-flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-yellow fill-yellow" />
                              {Number(p.averageRating).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-gray shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
