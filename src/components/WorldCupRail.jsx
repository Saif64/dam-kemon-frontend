import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Flag, ArrowRight } from 'lucide-react';
import { getWorldCup } from '../api/api';

function fmt(p) {
  if (p == null) return 'N/A';
  return '৳' + Number(p).toLocaleString('en-IN');
}

/**
 * Seasonal "World Cup 2026" rail — jerseys, flags and supporter gear the
 * catalog holds, surfaced by name (WorldCupService) regardless of which
 * category each item landed in. Hides itself until at least 3 items qualify
 * so it never renders empty (e.g. before a crawl has pulled fan merch).
 */
export default function WorldCupRail() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    getWorldCup(12)
      .then((r) => { if (alive && Array.isArray(r.data)) setItems(r.data); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (items.length < 3) return null;

  return (
    <section className="container-tight py-10 sm:py-14 lg:py-16">
      <div className="rounded-3xl bg-gradient-to-br from-green-soft via-cream-soft to-yellow-soft border border-line-strong p-5 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-green/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-red/15 blur-3xl pointer-events-none" />

        <div className="relative flex items-end justify-between gap-3 mb-5 sm:mb-7">
          <div>
            <div className="tag-bar mb-2 inline-flex items-center gap-1.5 text-green">
              <Trophy className="w-3.5 h-3.5" /> World Cup 2026 · kicks off 11 June
            </div>
            <h2 className="font-serif font-semibold text-[clamp(1.5rem,3.8vw,2.4rem)] leading-tight tracking-tight">
              Gear up for the <em className="text-red">World Cup</em>
            </h2>
            <p className="text-gray text-sm mt-1.5">Jerseys, flags & fan gear — at the cheapest seller across BD shops.</p>
          </div>
          <Link to="/search?q=jersey" className="hidden sm:inline-flex text-sm font-semibold text-ink/70 hover:text-ink items-center gap-1.5 shrink-0">
            Shop all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.slice(0, 8).map((p) => {
            const sellers = p.sellerCount || 0;
            return (
              <Link
                key={p.id}
                to={`/product/${p.id || p.slug}`}
                className="bg-surface border border-line rounded-2xl overflow-hidden flex flex-col hover:shadow-[var(--shadow-card)] hover:border-line-strong transition group"
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
                    <Flag className="w-8 h-8 text-ink/15" />
                  )}
                </div>
                <div className="p-3 sm:p-4 flex-1 flex flex-col">
                  {p.category && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-gray mb-1">{p.category}</span>
                  )}
                  <h3 className="font-serif text-sm sm:text-[15px] font-semibold text-ink leading-snug line-clamp-2 mb-2">
                    {p.name}
                  </h3>
                  <div className="mt-auto flex items-baseline justify-between gap-2">
                    <span className="font-mono text-base sm:text-lg font-bold text-ink">{fmt(p.lowestPrice)}</span>
                    {sellers > 1 && (
                      <span className="text-[10px] sm:text-[11px] font-mono text-green">{sellers} sellers</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
