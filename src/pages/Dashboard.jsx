import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, triggerScrape } from '../api/api';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import {
  Activity, CheckCircle2, AlertTriangle, Search, Loader2,
  Zap, BarChart3, RefreshCw, ArrowRight,
} from 'lucide-react';

const statusConfig = {
  active:  { color: 'text-green', bg: 'bg-green-soft',  dot: 'bg-green',  label: 'Active' },
  slow:    { color: 'text-yellow', bg: 'bg-yellow-soft', dot: 'bg-yellow', label: 'Slow' },
  dormant: { color: 'text-gray', bg: 'bg-cream-soft',    dot: 'bg-gray',   label: 'Dormant' },
  down:    { color: 'text-red', bg: 'bg-red-soft',       dot: 'bg-red',    label: 'Down' },
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl p-3 shadow-lg border border-line-strong text-xs sm:text-sm">
      <p className="text-gray font-mono text-[10px] sm:text-[11px] mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-gray">{entry.name}</span>
          <span className="text-ink font-mono font-bold ml-auto">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrapeQuery, setScrapeQuery] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);

  const loadStats = () => {
    setLoading(true); setError(null);
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message || 'Backend unreachable'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, []);

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!scrapeQuery.trim()) return;
    setScraping(true);
    setScrapeResult(null);
    try {
      const res = await triggerScrape(scrapeQuery, []);
      setScrapeResult({ ok: true, message: `Scrape job queued: ${res.data?.id || scrapeQuery}` });
    } catch (err) {
      setScrapeResult({ ok: false, message: err.response?.data?.message || err.message || 'Failed to queue scrape' });
    } finally {
      setScraping(false);
      setScrapeQuery('');
    }
  };

  if (loading) {
    return (
      <div className="container-tight py-12">
        <LoadingSpinner text="Loading dashboard…" />
      </div>
    );
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
          <button onClick={loadStats} className="btn-ghost inline-flex">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { value: (stats.totalProducts ?? 0).toLocaleString(),     label: 'Products',     accent: 'red' },
    { value: String(stats.totalSites ?? 0),                   label: 'Sites',        accent: 'green' },
    { value: (stats.totalReviews ?? 0).toLocaleString(),      label: 'Reviews',      accent: 'blue' },
    { value: (stats.totalPricePoints ?? 0).toLocaleString(),  label: 'Price points', accent: 'ink' },
  ];

  const siteStats = Array.isArray(stats.siteStats) ? stats.siteStats : [];
  const siteBars = siteStats.map((s) => ({ name: s.siteName, products: Number(s.productCount ?? 0), status: s.status || 'active' }));
  const recentSearches = Array.isArray(stats.recentSearches) ? stats.recentSearches : [];

  return (
    <div className="container-tight py-4 sm:py-6 lg:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <div className="tag-bar mb-2">Control room</div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold italic text-ink leading-tight">Dashboard</h1>
          <p className="text-gray text-xs sm:text-sm mt-1">Live system stats from the backend</p>
        </div>
        <button onClick={loadStats} className="btn-ghost self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((stat, i) => (
          <div key={stat.label} className="card-soft p-4 sm:p-5">
            <StatsCard value={stat.value} label={stat.label} delay={i * 80} accent={stat.accent} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 card-soft overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-soft flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-ink" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-[17px] font-bold italic text-ink leading-tight">Products by Site</h3>
              <p className="text-[11px] text-gray mt-0.5">Indexed across {siteStats.length} sites</p>
            </div>
          </div>
          <div className="p-3 sm:p-4 lg:p-5">
            {siteBars.length === 0 ? (
              <p className="text-sm text-gray text-center py-8">No products indexed yet. Run a search.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={siteBars} layout="vertical" margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,19,26,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6B6B6B', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#6B6B6B', fontSize: 10 }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="products" name="Products" radius={[0, 6, 6, 0]}>
                    {siteBars.map((entry, i) => (
                      <Cell key={i} fill={entry.products === 0 ? '#FF4521' : '#0F4D2A'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="card-soft p-5 sm:p-6 bg-gradient-to-br from-cream-soft to-white">
            <h3 className="font-serif text-base sm:text-[17px] font-bold italic text-ink flex items-center gap-2 mb-3 sm:mb-4">
              <Zap className="w-4 h-4 text-red" /> Quick scrape
            </h3>
            <form onSubmit={handleScrape}>
              <div className="relative mb-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
                <input
                  type="text"
                  value={scrapeQuery}
                  onChange={(e) => setScrapeQuery(e.target.value)}
                  placeholder="Product to scrape…"
                  className="w-full pl-10 pr-3 py-3 bg-white border border-line rounded-xl text-sm text-ink placeholder-gray-soft focus:outline-none focus:border-ink/40 transition-colors"
                />
              </div>
              <button type="submit" disabled={scraping || !scrapeQuery.trim()} className="btn-accent w-full !py-3 disabled:!bg-gray-soft disabled:cursor-not-allowed">
                {scraping ? <><Loader2 className="w-4 h-4 animate-spin" /> Queueing…</> : <><Zap className="w-4 h-4" /> Start scrape</>}
              </button>
            </form>
            {scrapeResult && (
              <div className={`mt-3 p-3 rounded-xl text-xs sm:text-sm font-mono ${
                scrapeResult.ok ? 'bg-green-soft text-green border border-green/20' : 'bg-red-soft text-red border border-red/20'
              }`}>
                {scrapeResult.message}
              </div>
            )}
          </div>

          <div className="card-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <h3 className="font-serif text-base sm:text-[17px] font-bold italic text-ink">Site status</h3>
            </div>
            <div className="divide-y divide-line">
              {siteStats.length === 0 ? (
                <p className="text-sm text-gray text-center py-6 px-4">No sites registered.</p>
              ) : siteStats.map((site) => {
                const info = statusConfig[site.status] || statusConfig.active;
                return (
                  <div key={site.siteName} className="px-5 py-3 hover:bg-cream-soft/60 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${info.dot} ${site.status === 'active' ? 'animate-pulse-dot' : ''}`} />
                        <div className="min-w-0">
                          <p className="text-ink text-sm font-semibold truncate">{site.siteName}</p>
                          <p className="text-gray text-[11px] font-mono">{site.productCount ?? 0} products</p>
                        </div>
                      </div>
                      <span className={`font-mono text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${info.bg} ${info.color}`}>
                        {info.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {recentSearches.length > 0 && (
            <div className="card-soft overflow-hidden">
              <div className="px-5 py-4 border-b border-line flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-soft flex items-center justify-center">
                  <Activity className="w-4 h-4 text-red" />
                </div>
                <h3 className="font-serif text-base sm:text-[17px] font-bold italic text-ink">Recent searches</h3>
              </div>
              <div className="divide-y divide-line">
                {recentSearches.map((q, i) => (
                  <button
                    key={q + i}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                    className="w-full text-left px-5 py-3 hover:bg-cream-soft/60 transition-colors flex items-center justify-between group"
                  >
                    <span className="text-ink text-sm font-semibold truncate">{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-soft group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-[11px] text-gray inline-flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-green" /> All numbers above are live from <code className="font-mono text-ink bg-cream-soft px-1 py-0.5 rounded">/api/dashboard/stats</code>.
      </div>
    </div>
  );
}
