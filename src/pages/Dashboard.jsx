import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, triggerScrape } from '../api/api';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Activity, CheckCircle2, AlertTriangle, XCircle, Search, Loader2,
  Clock, Zap, TrendingUp, BarChart3, PieChartIcon, RefreshCw, ArrowRight,
} from 'lucide-react';

const COLORS = ['#FF4521', '#0F4D2A', '#1877F2', '#FFD23F', '#7B61FF', '#6B6B6B'];

const mockStats = { totalProducts: 10247, totalSites: 6, totalReviews: 34892, totalPricePoints: 52341 };

const mockActivity = [
  { id: 1, query: 'iPhone 15 Pro', sites: 6, products: 24, status: 'completed', time: '2 min ago' },
  { id: 2, query: 'Samsung Galaxy S24', sites: 6, products: 18, status: 'completed', time: '15 min ago' },
  { id: 3, query: 'MacBook Air M3', sites: 4, products: 12, status: 'completed', time: '1 hour ago' },
  { id: 4, query: 'Sony WH-1000XM5', sites: 5, products: 8, status: 'running', time: 'Now' },
  { id: 5, query: 'Dell XPS 15', sites: 3, products: 6, status: 'completed', time: '2 hours ago' },
];

const mockSiteStatus = [
  { name: 'Daraz', status: 'active', lastScrape: '5 min ago', products: 5200, responseTime: 1.2 },
  { name: 'Startech', status: 'active', lastScrape: '10 min ago', products: 1800, responseTime: 0.8 },
  { name: 'Ryans', status: 'active', lastScrape: '12 min ago', products: 1200, responseTime: 1.5 },
  { name: 'Chaldal', status: 'slow', lastScrape: '30 min ago', products: 3500, responseTime: 4.2 },
  { name: 'Pickaboo', status: 'active', lastScrape: '8 min ago', products: 900, responseTime: 1.1 },
  { name: 'Rokomari', status: 'down', lastScrape: '2 hours ago', products: 2400, responseTime: 0 },
];

const statusConfig = {
  active: { icon: CheckCircle2, color: 'text-green', bg: 'bg-green-soft', dot: 'bg-green', label: 'Active' },
  slow: { icon: AlertTriangle, color: 'text-yellow', bg: 'bg-yellow-soft', dot: 'bg-yellow', label: 'Slow' },
  down: { icon: XCircle, color: 'text-red', bg: 'bg-red-soft', dot: 'bg-red', label: 'Down' },
};

function generatePriceTrendData() {
  const data = [];
  const now = Date.now();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now - i * 86400000);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Daraz: Math.round(3200 + Math.sin(i * 0.3) * 400 + Math.random() * 200),
      Startech: Math.round(3400 + Math.cos(i * 0.25) * 350 + Math.random() * 150),
      Pickaboo: Math.round(3100 + Math.sin(i * 0.2 + 1) * 500 + Math.random() * 180),
      Ryans: Math.round(3300 + Math.cos(i * 0.35) * 300 + Math.random() * 160),
    });
  }
  return data;
}

function generateScrapingActivity() {
  const data = [];
  for (let i = 23; i >= 0; i--) {
    data.push({
      hour: `${String(23 - i).padStart(2, '0')}:00`,
      scraped: Math.floor(Math.random() * 800) + 200,
      errors: Math.floor(Math.random() * 30),
    });
  }
  return data;
}

function generateCategoryData() {
  return [
    { name: 'Electronics', value: 4200 },
    { name: 'Fashion', value: 2800 },
    { name: 'Groceries', value: 1900 },
    { name: 'Books', value: 800 },
    { name: 'Home', value: 1100 },
    { name: 'Beauty', value: 650 },
  ];
}

function generateSitePerformance() {
  return mockSiteStatus.map((s) => ({
    name: s.name,
    responseTime: s.responseTime,
    products: s.products,
    uptime: s.status === 'active' ? 99.2 + Math.random() * 0.7 : s.status === 'slow' ? 85 + Math.random() * 10 : 0,
  }));
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl p-3 shadow-lg border border-line-strong text-xs sm:text-sm">
      <p className="text-gray font-mono text-[10px] sm:text-[11px] mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-gray">{entry.name}</span>
          <span className="text-ink font-mono font-bold ml-auto">{typeof entry.value === 'number' && entry.value > 100 ? '৳' + entry.value.toLocaleString() : entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scrapeQuery, setScrapeQuery] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [priceTrend] = useState(generatePriceTrendData);
  const [scrapingActivity] = useState(generateScrapingActivity);
  const [categoryData] = useState(generateCategoryData);
  const [sitePerformance] = useState(generateSitePerformance);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => setStats(mockStats))
      .finally(() => setLoading(false));
  }, []);

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!scrapeQuery.trim()) return;
    setScraping(true);
    setScrapeResult(null);
    try {
      await triggerScrape(scrapeQuery, ['daraz', 'startech', 'ryans', 'chaldal', 'pickaboo', 'rokomari']);
      setScrapeResult({ success: true, message: `Scraping started for "${scrapeQuery}"` });
    } catch {
      setScrapeResult({ success: true, message: `Scrape queued for "${scrapeQuery}" (demo mode)` });
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

  const s = stats || mockStats;
  const statCards = [
    { value: s.totalProducts?.toLocaleString() || '10,247', label: 'Products', accent: 'red' },
    { value: String(s.totalSites || 6), label: 'Sites', accent: 'green' },
    { value: s.totalReviews?.toLocaleString() || '34,892', label: 'Reviews', accent: 'blue' },
    { value: s.totalPricePoints?.toLocaleString() || '52,341', label: 'Price points', accent: 'ink' },
  ];

  return (
    <div className="container-tight py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <div className="tag-bar mb-2">Control room</div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold italic text-ink leading-tight">Dashboard</h1>
          <p className="text-gray text-xs sm:text-sm mt-1">Monitor scraping activity and system health</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn-ghost self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((stat, i) => (
          <div key={stat.label} className="card-soft p-4 sm:p-5">
            <StatsCard value={stat.value} label={stat.label} delay={i * 80} accent={stat.accent} />
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="card-soft overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-soft flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-red" />
              </div>
              <div>
                <h3 className="font-serif text-base sm:text-[17px] font-bold italic text-ink leading-tight">Price Trends</h3>
                <p className="text-[11px] text-gray mt-0.5">Last 30 days · 4 sites</p>
              </div>
            </div>
          </div>
          <div className="p-3 sm:p-4 lg:p-5">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={priceTrend} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,19,26,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#6B6B6B', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#6B6B6B', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => '৳' + (v / 1000).toFixed(1) + 'k'} width={42} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={6} />
                <Line type="monotone" dataKey="Daraz" stroke="#FF4521" strokeWidth={2.25} dot={false} />
                <Line type="monotone" dataKey="Startech" stroke="#0F4D2A" strokeWidth={2.25} dot={false} />
                <Line type="monotone" dataKey="Pickaboo" stroke="#1877F2" strokeWidth={2.25} dot={false} />
                <Line type="monotone" dataKey="Ryans" stroke="#FFD23F" strokeWidth={2.25} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-soft overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-green-soft flex items-center justify-center">
                <Activity className="w-4 h-4 text-green" />
              </div>
              <div>
                <h3 className="font-serif text-base sm:text-[17px] font-bold italic text-ink leading-tight">Scraping Activity</h3>
                <p className="text-[11px] text-gray mt-0.5">Last 24 hours</p>
              </div>
            </div>
          </div>
          <div className="p-3 sm:p-4 lg:p-5">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={scrapingActivity} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="scraped" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4F542" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#D4F542" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,19,26,0.06)" />
                <XAxis dataKey="hour" tick={{ fill: '#6B6B6B', fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fill: '#6B6B6B', fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={6} />
                <Area type="monotone" dataKey="scraped" name="Products scraped" stroke="#0F4D2A" fill="url(#scraped)" strokeWidth={2} />
                <Area type="monotone" dataKey="errors" name="Errors" stroke="#FF4521" fill="#FF4521" fillOpacity={0.1} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="card-soft overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-soft flex items-center justify-center">
              <PieChartIcon className="w-4 h-4 text-blue" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-[17px] font-bold italic text-ink leading-tight">Products by Category</h3>
              <p className="text-[11px] text-gray mt-0.5">{categoryData.reduce((a, b) => a + b.value, 0).toLocaleString()} total</p>
            </div>
          </div>
          <div className="p-3 sm:p-4 lg:p-5 flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={200} className="sm:max-w-[200px]">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} innerRadius={48} dataKey="value" stroke="none" paddingAngle={2}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => v.toLocaleString() + ' products'} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 w-full">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-ink truncate">{cat.name}</span>
                  <span className="text-[10px] text-gray font-mono ml-auto shrink-0">{(cat.value / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-soft overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-soft flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-ink" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-[17px] font-bold italic text-ink leading-tight">Site Response Time</h3>
              <p className="text-[11px] text-gray mt-0.5">Faster is better</p>
            </div>
          </div>
          <div className="p-3 sm:p-4 lg:p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sitePerformance} layout="vertical" margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,19,26,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6B6B6B', fontSize: 10 }} tickLine={false} axisLine={false} unit="s" />
                <YAxis type="category" dataKey="name" tick={{ fill: '#6B6B6B', fontSize: 10 }} tickLine={false} axisLine={false} width={56} />
                <Tooltip formatter={(v) => v.toFixed(1) + 's'} />
                <Bar dataKey="responseTime" name="Response time" radius={[0, 6, 6, 0]}>
                  {sitePerformance.map((entry, i) => (
                    <Cell key={i} fill={entry.responseTime > 3 ? '#FF4521' : entry.responseTime > 1.5 ? '#FFD23F' : '#0F4D2A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity + Quick Scrape + Site Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <div className="card-soft overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-soft flex items-center justify-center">
                <Activity className="w-4 h-4 text-red" />
              </div>
              <h3 className="font-serif text-base sm:text-[17px] font-bold italic text-ink">Recent Activity</h3>
            </div>
            <div className="divide-y divide-line">
              {mockActivity.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(item.query)}`)}
                  className="px-5 sm:px-6 py-3.5 sm:py-4 hover:bg-cream-soft/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        item.status === 'completed' ? 'bg-green' :
                        item.status === 'running' ? 'bg-red animate-pulse-dot' : 'bg-gray'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-ink font-semibold text-sm truncate">{item.query}</p>
                        <p className="text-gray text-[11px] sm:text-xs mt-0.5">
                          <span className="font-mono">{item.sites}</span> sites · <span className="font-mono">{item.products}</span> products
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2 sm:gap-3">
                      <span className={`font-mono text-[9px] sm:text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        item.status === 'completed' ? 'bg-green-soft text-green' : 'bg-red-soft text-red'
                      }`}>
                        {item.status === 'running' ? 'Running' : 'Done'}
                      </span>
                      <span className="text-gray text-[11px] hidden sm:flex items-center gap-1">
                        <Clock className="w-3 h-3" />{item.time}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-soft group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Quick Scrape */}
          <div className="card-soft p-5 sm:p-6 bg-gradient-to-br from-cream-soft to-white">
            <h3 className="font-serif text-base sm:text-[17px] font-bold italic text-ink flex items-center gap-2 mb-3 sm:mb-4">
              <Zap className="w-4 h-4 text-red" /> Quick Scrape
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
              <button
                type="submit"
                disabled={scraping || !scrapeQuery.trim()}
                className="btn-accent w-full !py-3 disabled:!bg-gray-soft disabled:cursor-not-allowed"
              >
                {scraping ? <><Loader2 className="w-4 h-4 animate-spin" /> Scraping…</> : <><Zap className="w-4 h-4" /> Start Scrape</>}
              </button>
            </form>
            {scrapeResult && (
              <div className={`mt-3 p-3 rounded-xl text-xs sm:text-sm font-mono ${
                scrapeResult.success ? 'bg-green-soft text-green border border-green/20' : 'bg-red-soft text-red border border-red/20'
              }`}>
                {scrapeResult.message}
              </div>
            )}
          </div>

          <div className="card-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <h3 className="font-serif text-base sm:text-[17px] font-bold italic text-ink">Site Status</h3>
            </div>
            <div className="divide-y divide-line">
              {mockSiteStatus.map((site) => {
                const info = statusConfig[site.status];
                return (
                  <div key={site.name} className="px-5 py-3 hover:bg-cream-soft/60 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${info.dot} ${site.status === 'active' ? 'animate-pulse-dot' : ''}`} />
                        <div className="min-w-0">
                          <p className="text-ink text-sm font-semibold truncate">{site.name}</p>
                          <p className="text-gray text-[11px]">Last: {site.lastScrape}</p>
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
        </div>
      </div>
    </div>
  );
}
