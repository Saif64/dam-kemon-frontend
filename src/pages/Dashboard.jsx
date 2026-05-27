import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getDashboardStats, getLiveStats, getTrendingSearches, getHotDrops,
} from '../api/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Activity, TrendingDown, Search, RefreshCw, AlertTriangle, ArrowRight,
  Store, Flame, ShieldCheck, Eye, Users,
} from 'lucide-react';

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN');
}
function bdt(n) {
  if (n == null) return '—';
  return '৳' + Number(n).toLocaleString('en-IN');
}

/**
 * Public live dashboard — answers "what is Damkemon and what's happening
 * right now?" for first-time visitors landing from the navbar.
 *
 * <p>Previous version surfaced an operator-only "Quick scrape" form (any
 * visitor could queue a background scrape) and a 69-row horizontal bar
 * chart that was unreadable past row 10. Both gone. The page now leans
 * into what's actually interesting to a curious visitor:
 * <ul>
 *   <li>Right-now activity (active users, searches in last minute).</li>
 *   <li>What everyone's searching for (trending — click to jump in).</li>
 *   <li>Today's biggest price drops (CTA into the search funnel).</li>
 *   <li>Top shops by indexed inventory — list not chart.</li>
 * </ul>
 * Operator actions live at {@code /admin} where they belong.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [live, setLive] = useState(null);
  const [trending, setTrending] = useState([]);
  const [hotDrops, setHotDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    if (silent) setRefreshing(true);
    Promise.allSettled([
      getDashboardStats(),
      getLiveStats(),
      getTrendingSearches(8),
      getHotDrops(6),
    ])
      .then(([s, l, t, h]) => {
        if (s.status === 'fulfilled') setStats(s.value.data);
        else if (!silent) setError(s.reason?.message || 'Backend unreachable');
        if (l.status === 'fulfilled') setLive(l.value.data);
        if (t.status === 'fulfilled') setTrending(Array.isArray(t.value.data) ? t.value.data : []);
        if (h.status === 'fulfilled') setHotDrops(Array.isArray(h.value.data) ? h.value.data : []);
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { loadAll(); }, []);
  // Soft auto-refresh of live counters every 30s — feels alive without spamming.
  useEffect(() => {
    const id = setInterval(() => {
      getLiveStats().then((r) => setLive(r.data)).catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return <div className="container-tight py-12"><LoadingSpinner text="Loading dashboard…" /></div>;
  }

  if (error || !stats) {
    return (
      <div className="container-tight py-12">
        <div className="card-soft p-8 sm:p-10 text-center max-w-lg mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-red-soft mb-4">
            <AlertTriangle className="w-8 h-8 text-red" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold italic text-ink mb-2">Backend unreachable</h2>
          <p className="text-gray text-sm mb-5">
            The Spring Boot server didn't respond. Start it with{' '}
            <code className="font-mono text-ink bg-cream-soft px-1.5 py-0.5 rounded">./gradlew bootRun</code> and refresh.
          </p>
          <button onClick={() => loadAll()} className="btn-ghost inline-flex">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const siteStats = Array.isArray(stats.siteStats) ? stats.siteStats : [];
  const shopsWithStock = siteStats.filter((s) => (s.productCount ?? 0) > 0).length;
  const totalShops = siteStats.length;
  const dormant = totalShops - shopsWithStock;

  const topShops = [...siteStats]
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 12);
  const maxCount = topShops[0]?.productCount || 1;

  const recentSearches = Array.isArray(stats.recentSearches) ? stats.recentSearches : [];

  return (
    <div className="container-tight py-5 sm:py-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 mb-6 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-green font-bold">Live</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold italic text-ink leading-tight">
            What's happening on Damkemon
          </h1>
          <p className="text-ink/60 text-xs sm:text-sm mt-1">
            Real numbers from the indexer + this minute's traffic. Refreshes automatically.
          </p>
        </div>
        <button onClick={() => loadAll(true)} disabled={refreshing} className="btn-ghost self-start sm:self-auto disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* ─── Hero stats row: four cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <HeroStat
          label="Products tracked"
          value={fmt(stats.totalProducts)}
          accent="red"
          icon={Store}
        />
        <HeroStat
          label="Active shops"
          value={`${shopsWithStock}`}
          sub={`of ${totalShops} indexed`}
          accent="green"
          icon={ShieldCheck}
        />
        <HeroStat
          label="Searches today"
          value={fmt(live?.searchesToday ?? 0)}
          sub={live?.searchesLast60s != null ? `${live.searchesLast60s} in last minute` : ''}
          accent="blue"
          icon={Search}
          live
        />
        <HeroStat
          label="Price points"
          value={fmt(stats.totalPricePoints)}
          sub={`${fmt(stats.totalReviews)} reviews indexed`}
          accent="ink"
          icon={Eye}
        />
      </div>

      {/* ─── Live pulse strip ─── */}
      {live && (
        <div className="card-soft p-3 sm:p-4 mb-6 bg-gradient-to-r from-cream-soft to-white flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-line">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse-dot" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink/65">Right now</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[12px] text-ink/75">
            <Users className="w-3.5 h-3.5 text-ink/50" />
            <b className="font-mono text-ink">{live.activeUsers}</b> active visitor{live.activeUsers === 1 ? '' : 's'}
          </span>
          <span className="text-ink/30">·</span>
          <span className="inline-flex items-center gap-1.5 text-[12px] text-ink/75">
            <Activity className="w-3.5 h-3.5 text-ink/50" />
            <b className="font-mono text-ink">{live.viewsToday}</b> product views today
          </span>
          {dormant > 0 && (
            <>
              <span className="text-ink/30">·</span>
              <Link to="/admin" className="inline-flex items-center gap-1.5 text-[12px] text-ink/65 hover:text-ink">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow" />
                {dormant} dormant shop{dormant === 1 ? '' : 's'} — auto-learner running
              </Link>
            </>
          )}
        </div>
      )}

      {/* ─── Three-column grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* LEFT (2/3): Top shops + recent searches */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* Top shops — clean list */}
          <div className="card-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-ink/60" />
                <h3 className="font-serif text-base sm:text-lg font-bold italic text-ink">Top shops by inventory</h3>
              </div>
              <Link to="/sellers" className="text-[11px] font-mono text-ink/55 hover:text-ink inline-flex items-center gap-1">
                See all {totalShops} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ul className="divide-y divide-line/60">
              {topShops.map((s, i) => {
                const pct = Math.max(2, Math.round(((s.productCount ?? 0) / maxCount) * 100));
                return (
                  <li key={s.siteName} className="px-5 py-2.5 hover:bg-cream-soft/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-serif italic text-ink/30 text-sm w-5 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <span className="text-ink font-semibold text-[13px] truncate">{s.siteName}</span>
                          <span className="font-mono text-[12px] text-ink font-bold shrink-0">{fmt(s.productCount)}</span>
                        </div>
                        <div className="h-1 bg-cream-soft rounded-full overflow-hidden">
                          <div className="h-full bg-green rounded-full transition-all"
                               style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
              {topShops.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-ink/55">No shops indexed yet.</li>
              )}
            </ul>
          </div>

          {/* Hot drops — only render when there are real drops */}
          {hotDrops.length > 0 && (
            <div className="card-soft overflow-hidden">
              <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red" />
                  <h3 className="font-serif text-base sm:text-lg font-bold italic text-ink">Today's biggest drops</h3>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink/55">{hotDrops.length}</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-line/60">
                {hotDrops.slice(0, 4).map((d) => (
                  <li key={d.productId || d.name}>
                    <Link to={`/product/${d.productId || ''}`} className="block px-5 py-3 hover:bg-cream-soft/40 transition-colors">
                      <p className="text-[13px] font-semibold text-ink line-clamp-1">{d.name || d.productName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-sm font-bold text-green">{bdt(d.currentPrice ?? d.lowestPrice)}</span>
                        {d.previousPrice != null && d.previousPrice > (d.currentPrice ?? 0) && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-red">
                            <TrendingDown className="w-3 h-3" /> {bdt(d.previousPrice - (d.currentPrice ?? 0))} off
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT (1/3): Trending + Recent searches */}
        <div className="space-y-4 sm:space-y-5">
          {/* Trending searches */}
          <div className="card-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center gap-2">
              <Activity className="w-4 h-4 text-red" />
              <h3 className="font-serif text-base font-bold italic text-ink">Trending searches</h3>
            </div>
            <div className="p-4">
              {trending.length === 0 ? (
                <p className="text-[12px] text-ink/55">No searches yet today.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {trending.map((t, i) => (
                    <li key={t.query + i}>
                      <button
                        onClick={() => navigate(`/search?q=${encodeURIComponent(t.query)}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream-soft border border-line hover:border-ink hover:bg-white text-[11px] text-ink transition-colors"
                      >
                        <span className="font-mono text-ink/45 text-[10px]">{i + 1}</span>
                        <span className="truncate max-w-[160px]">{t.query}</span>
                        {t.hits > 1 && <span className="text-[9px] font-mono text-ink/45">×{t.hits}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Recent searches (chronological) */}
          {recentSearches.length > 0 && (
            <div className="card-soft overflow-hidden">
              <div className="px-5 py-4 border-b border-line">
                <h3 className="font-serif text-base font-bold italic text-ink">Recent searches</h3>
              </div>
              <ul className="divide-y divide-line/60">
                {recentSearches.slice(0, 8).map((q, i) => (
                  <li key={q + i}>
                    <button
                      onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                      className="w-full text-left px-5 py-2.5 hover:bg-cream-soft/40 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-ink text-[13px] truncate">{q}</span>
                      <ArrowRight className="w-3 h-3 text-ink/30 group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer note */}
          <p className="text-[10px] text-ink/45 px-1 leading-relaxed">
            Numbers refresh on every load. Live counters poll every 30s.
            Operator actions live at <Link to="/admin" className="text-ink underline">/admin</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Hero stat card — large number, label, optional subtitle, accent color
function HeroStat({ label, value, sub, accent = 'ink', icon: Icon, live }) {
  const accentClass = {
    red: 'text-red',
    green: 'text-green',
    blue: 'text-blue',
    ink: 'text-ink',
  }[accent] || 'text-ink';
  return (
    <div className="card-soft p-4 sm:p-5 relative overflow-hidden">
      {Icon && (
        <Icon className={`absolute top-3 right-3 w-4 h-4 ${accentClass} opacity-30`} />
      )}
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink/55 mb-1 inline-flex items-center gap-1">
        {label}
        {live && <span className="w-1 h-1 rounded-full bg-green animate-pulse-dot" />}
      </div>
      <div className={`font-serif text-2xl sm:text-3xl lg:text-[34px] font-bold italic leading-none ${accentClass}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] font-mono text-ink/50 mt-1.5 truncate">{sub}</div>}
    </div>
  );
}
