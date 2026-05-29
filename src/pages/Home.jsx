import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllProducts, getDashboardStats } from '../api/api';
import SearchBar from '../components/SearchBar';
import LiveActivityPill from '../components/LiveActivityPill';
import TrendingStrip from '../components/TrendingStrip';
import HotDropsRail from '../components/HotDropsRail';
import RecentlyViewedRail from '../components/RecentlyViewedRail';
import ProtectShowcase from '../components/ProtectShowcase';
import {
  Sparkles, Database, ShieldCheck, Store, ArrowRight, Crown,
  Radio, MessageSquare, BadgeCheck, ShoppingBag,
} from 'lucide-react';

function fmt(p) {
  if (p == null) return 'N/A';
  return '৳' + Number(p).toLocaleString('en-IN');
}

export default function Home() {
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getAllProducts(0, 12)
      .then((res) => {
        const items = res.data?.content || [];
        const withPrice = items.filter((p) => p.lowestPrice != null && p.imageUrl);
        setTrending(withPrice.slice(0, 6));
      })
      .catch(() => setTrending([]));
    getDashboardStats().then((res) => setStats(res.data)).catch(() => setStats(null));
  }, []);

  const handleSearch = (query) => {
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const steps = [
    { num: '01', title: 'Nightly index',  desc: 'Every night at 3 AM we crawl 60+ Bangladesh shops and refresh prices into our catalog.', icon: Database },
    { num: '02', title: 'Cross-shop merge', desc: 'When the same product is sold by multiple shops, we merge them so you see every seller in one row.', icon: ShieldCheck },
    { num: '03', title: 'You search, instantly', desc: 'No live scraping at search time. The DB serves you a complete comparison the moment you hit Enter.', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <section className="relative">
        <div className="absolute top-20 -left-32 w-80 h-80 rounded-full bg-yellow/30 blur-3xl animate-blob pointer-events-none" />
        <div className="absolute top-40 -right-32 w-96 h-96 rounded-full bg-red/15 blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '4s' }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-lime/25 blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '8s' }} />

        <div className="container-tight pt-8 sm:pt-14 lg:pt-20 pb-10 sm:pb-14 lg:pb-16 text-center relative">
          <LiveActivityPill fallbackProductsCount={stats?.totalProducts} />

          <h1 className="font-serif font-semibold leading-[0.92] tracking-[-0.035em] mb-4 sm:mb-5 text-[clamp(2.5rem,8.5vw,6.75rem)]">
            <em className="text-red font-medium">Dam kemon,</em>
            <br />
            <span className="scribble-underline">
              really?
              <svg viewBox="0 0 200 14" preserveAspectRatio="none">
                <path d="M2 10 Q 50 2, 100 8 T 198 6" stroke="#FF4521" strokeWidth="3" fill="none" strokeLinecap="round" className="animate-scribble" />
              </svg>
            </span>
          </h1>

          <p className="text-[15px] sm:text-lg lg:text-xl text-gray max-w-[600px] mx-auto mb-7 sm:mb-10 px-2 leading-relaxed">
            One search across <span className="text-ink font-semibold">{stats?.totalSites ?? '60+'} Bangladesh shops</span>.
            Side-by-side prices, the cheapest seller wins.
          </p>

          <SearchBar large onSearch={handleSearch} />

          {stats && (stats.totalProducts > 0 || stats.totalSites > 0) && (
            <div className="grid grid-cols-3 max-w-md mx-auto mt-8 sm:mt-10 gap-2">
              <Stat label="products" value={stats.totalProducts?.toLocaleString() || '—'} />
              <Stat label="shops" value={String(stats.totalSites || '—')} />
              <Stat label="prices tracked" value={stats.totalPricePoints?.toLocaleString() || '—'} />
            </div>
          )}
        </div>
      </section>

      <TrendingStrip />

      <RecentlyViewedRail />

      <HotDropsRail />

      {trending.length > 0 && (
        <section className="container-tight py-10 sm:py-14 lg:py-16">
          <div className="flex items-end justify-between mb-5 sm:mb-7">
            <div>
              <div className="tag-bar mb-2">From the catalog</div>
              <h2 className="font-serif font-semibold text-[clamp(1.5rem,3.5vw,2.25rem)] leading-tight">
                Recently <em className="text-red">indexed</em>
              </h2>
            </div>
            <Link to="/browse" className="text-sm font-semibold text-ink/70 hover:text-ink inline-flex items-center gap-1.5">
              Browse all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
            {trending.map((p) => {
              const sellers = p.prices || [];
              const cheapest = sellers.slice().sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0];
              return (
                <Link
                  key={p.id}
                  to={`/product/${p.id || p.slug}`}
                  state={{ product: p }}
                  className="card-soft overflow-hidden flex flex-col hover:shadow-[var(--shadow-card)] transition-shadow group"
                >
                  <div className="aspect-[4/3] bg-cream-soft flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]" onError={(e)=>{e.target.style.display='none'}} />
                    ) : (
                      <span className="font-serif text-5xl italic text-ink/15">{(p.category || 'P')[0]}</span>
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
                      {sellers.length > 1 ? (
                        <span className="text-[10px] sm:text-[11px] font-mono text-green inline-flex items-center gap-0.5">
                          <Crown className="w-3 h-3" /> {sellers.length} sellers
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-[11px] font-mono text-gray inline-flex items-center gap-0.5">
                          <Store className="w-3 h-3" /> {cheapest?.siteName?.slice(0,18) || ''}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Damkemon Protect — buyer-trust spotlight (animated).
          See components/ProtectShowcase.jsx */}
      <ProtectShowcase />

      {/* Saathi cross-sell — primary funnel for the seller side of the
          two-sided marketplace. Placed after "why us" so visitors who came
          for shopping see we also serve them as sellers. */}
      <section className="relative overflow-hidden">
        <div className="container-tight py-10 sm:py-14 lg:py-18">
          <div className="rounded-3xl bg-gradient-to-br from-yellow-soft via-cream-soft to-lime-soft border border-line-strong p-6 sm:p-10 lg:p-14 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-red/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-12 w-72 h-72 rounded-full bg-lime/20 blur-3xl pointer-events-none" />

            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ink text-cream text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3 h-3 text-yellow" /> New
                </span>
                <h2 className="font-serif text-[clamp(1.6rem,4.2vw,2.75rem)] font-bold italic leading-[1.05] tracking-tight text-ink mb-2">
                  Run an FB shop?<br />
                  Meet your <span className="text-red">Saathi</span>.
                </h2>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/55 mb-4">
                  A seller's companion
                </p>
                <p className="text-ink/75 text-sm sm:text-[15px] leading-relaxed max-w-md mb-5">
                  Quote smart prices on FB Live. Auto-reply to "দাম কত?" in
                  Messenger. Earn the verified badge that builds buyer trust.
                  ৳999/mo. 14 days free.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/saathi" className="btn-primary">
                    Open my Saathi shop <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/saathi#how" className="btn-ghost">See how it works</Link>
                </div>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SaathiFeatureChip icon={Radio} title="Live price assist" tone="bg-red-soft text-red" />
                <SaathiFeatureChip icon={MessageSquare} title="Messenger auto-reply" tone="bg-blue-soft text-blue" />
                <SaathiFeatureChip icon={BadgeCheck} title="Verified badge" tone="bg-lime-soft text-green" />
                <SaathiFeatureChip icon={ShoppingBag} title="Public storefront" tone="bg-yellow-soft text-ink" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink text-cream py-14 sm:py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-red/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-lime/10 blur-3xl pointer-events-none" />
        <div className="container-tight relative">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <div className="tag-bar text-lime mb-3 sm:mb-4">How it works</div>
            <h2 className="font-serif font-semibold leading-[1.02] tracking-[-0.025em] text-[clamp(1.85rem,5vw,3.5rem)]">
              Pre-indexed. <em className="text-lime">Instant.</em>
            </h2>
            <p className="text-cream/55 text-sm sm:text-base mt-3 max-w-xl">
              No live scraping at search time. We do the slow, expensive work overnight so you get the cheapest BD seller in milliseconds.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="relative pt-12 sm:pt-14 group">
                  <div className="absolute top-0 left-0 flex items-center gap-3">
                    <span className="font-serif text-4xl sm:text-5xl font-bold italic text-lime/80 leading-none">{s.num}</span>
                    <div className="w-10 h-10 rounded-2xl bg-cream/10 flex items-center justify-center group-hover:bg-lime group-hover:text-ink transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl lg:text-2xl font-semibold mb-2 sm:mb-3 tracking-tight">{s.title}</h3>
                  <p className="text-cream/55 text-sm sm:text-[15px] leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="text-center">
      <div className="font-serif text-lg sm:text-xl font-bold italic text-ink">{value}</div>
      <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-gray">{label}</div>
    </div>
  );
}

function SaathiFeatureChip({ icon: Icon, title, tone }) {
  return (
    <li className="bg-surface/85 backdrop-blur border border-line rounded-2xl p-3 flex items-center gap-2.5">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="font-serif text-[15px] font-semibold text-ink">{title}</span>
    </li>
  );
}
