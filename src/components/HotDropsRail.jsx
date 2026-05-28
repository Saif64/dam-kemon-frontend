import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight } from 'lucide-react';
import { getHotDrops } from '../api/api';

function fmt(p) {
  if (p == null) return 'N/A';
  return '৳' + Number(p).toLocaleString('en-IN');
}

/**
 * Horizontal scroller of products whose current cheapest price is at least
 * 10% below their 7-day peak. The backend rebuilds the underlying list
 * nightly; the rail renders nothing until at least 3 items qualify so a
 * fresh deploy doesn't show an empty section.
 */
export default function HotDropsRail() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    getHotDrops(12).then((r) => {
      if (alive && Array.isArray(r.data)) setItems(r.data);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  if (items.length < 3) return null;

  return (
    <section className="container-tight py-10 sm:py-14 lg:py-16">
      <div className="flex items-end justify-between mb-5 sm:mb-7">
        <div>
          <div className="tag-bar mb-2 inline-flex items-center gap-1.5 text-red">
            <Flame className="w-3.5 h-3.5" /> Hot drops
          </div>
          <h2 className="font-serif font-semibold text-[clamp(1.5rem,3.5vw,2.25rem)] leading-tight">
            Prices below their <em className="text-red">7-day peak</em>
          </h2>
        </div>
        <Link to="/browse" className="text-sm font-semibold text-ink/70 hover:text-ink inline-flex items-center gap-1.5">
          Browse all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.slice(0, 8).map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.id || p.slug}`}
            className="card-soft overflow-hidden flex flex-col hover:shadow-[var(--shadow-card)] transition-shadow group"
          >
            <div className="relative aspect-[4/3] bg-cream-soft flex items-center justify-center overflow-hidden">
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span className="font-serif text-5xl italic text-ink/15">{(p.category || 'P')[0]}</span>
              )}
              <div className="absolute top-2 right-2 inline-flex items-center gap-1 bg-red text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                -{p.dropPct}%
              </div>
            </div>
            <div className="p-3 sm:p-4 flex-1 flex flex-col">
              {p.category && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-gray mb-1">{p.category}</span>
              )}
              <h3 className="font-serif text-sm sm:text-[15px] font-semibold text-ink leading-snug line-clamp-2 mb-2">
                {p.name}
              </h3>
              <div className="mt-auto flex items-baseline justify-between gap-2">
                <span className="font-mono text-base sm:text-lg font-bold text-ink">{fmt(p.currentPrice)}</span>
                <span className="font-mono text-[11px] text-gray line-through">{fmt(p.peakPrice)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
