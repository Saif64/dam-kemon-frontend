import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { getTrendingSearches } from '../api/api';

/**
 * Horizontal strip of the top search terms in the last 24h. Rendered only
 * once enough events exist (>= 3 distinct queries) — until then the home
 * page hides this section so it doesn't look broken on a fresh deploy.
 */
export default function TrendingStrip() {
  const [terms, setTerms] = useState([]);

  useEffect(() => {
    let alive = true;
    getTrendingSearches(10).then((r) => {
      if (alive && Array.isArray(r.data)) setTerms(r.data);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  if (terms.length < 3) return null;

  return (
    <section className="container-tight pt-2 pb-6 sm:pb-8">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <TrendingUp className="w-4 h-4 text-red" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-gray">
          Trending today
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {terms.map((t) => (
          <Link
            key={t.query}
            to={`/search?q=${encodeURIComponent(t.query)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-line hover:border-ink text-xs font-medium text-ink transition-colors"
          >
            <span className="truncate max-w-[200px]">{t.query}</span>
            <span className="font-mono text-[10px] text-gray">{t.hits}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
