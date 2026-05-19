import { useEffect, useState } from 'react';
import { getLiveStats } from '../api/api';

/**
 * "X searching now" pill on the homepage hero. Polls every 8s; the backend
 * caches the underlying query so this is cheap. Falls back silently when
 * the events collection is empty (fresh deploy).
 */
export default function LiveActivityPill({ fallbackProductsCount }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;
    const fetch = () => getLiveStats().then((r) => { if (alive) setStats(r.data); }).catch(() => {});
    fetch();
    const t = setInterval(fetch, 8000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const active = stats?.activeUsers ?? 0;
  const showActive = active > 0;

  return (
    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-line-strong px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-medium mb-5 sm:mb-7 shadow-[var(--shadow-soft)]">
      <span className="relative flex w-2 h-2">
        <span className="absolute inset-0 bg-green rounded-full animate-pulse-dot" />
        <span className="relative w-2 h-2 bg-green rounded-full" />
      </span>
      {showActive ? (
        <span>
          <span className="font-bold tabular-nums">{active}</span>
          <span className="text-ink/70"> searching now</span>
        </span>
      ) : (
        <span>{fallbackProductsCount ? `${fallbackProductsCount.toLocaleString()} products indexed` : 'Live BD price comparison'}</span>
      )}
    </div>
  );
}
