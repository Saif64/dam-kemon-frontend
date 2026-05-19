import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import { getRecentIds, clearRecent } from '../api/recentlyViewed';
import { getProductsByIds } from '../api/api';

function fmt(p) { if (p == null) return 'N/A'; return '৳' + Number(p).toLocaleString('en-IN'); }

export default function RecentlyViewedRail() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const ids = getRecentIds();
    if (!ids.length) return;
    getProductsByIds(ids)
      .then((r) => setProducts(Array.isArray(r.data) ? r.data : []))
      .catch(() => setProducts([]));
  }, []);

  if (products.length < 2) return null;

  return (
    <section className="container-tight py-8 sm:py-12">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-2">
          <Clock className="w-4 h-4 text-ink/60" />
          <h2 className="font-serif text-lg sm:text-xl font-semibold">Recently viewed</h2>
        </div>
        <button
          onClick={() => { clearRecent(); setProducts([]); }}
          className="text-xs text-gray hover:text-red inline-flex items-center gap-1"
        >
          <X className="w-3 h-3" /> clear
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
        {products.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.id || p.slug}`}
            className="card-soft overflow-hidden flex-shrink-0 w-44 sm:w-48 group"
          >
            <div className="aspect-square bg-cream-soft flex items-center justify-center overflow-hidden">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]" onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <span className="font-serif text-4xl italic text-ink/15">{(p.category || 'P')[0]}</span>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-serif text-sm font-semibold line-clamp-2 mb-1">{p.name}</h3>
              <div className="font-mono text-sm font-bold">{fmt(p.lowestPrice)}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
