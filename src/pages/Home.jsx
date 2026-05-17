import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllProducts, getDashboardStats } from '../api/api';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import StatsCard from '../components/StatsCard';
import {
  TrendingUp, ArrowRight, Star, ExternalLink, Truck, Clock, MessageCircle,
  Sparkles, Zap, ShieldCheck, Crown,
} from 'lucide-react';

const sites = [
  'Daraz', 'Pickaboo', 'Chaldal', 'Othoba', 'Rokomari', 'AjkerDeal',
  'BD-Shop', 'Priyoshop', 'Startech', 'Ryans', 'Facebook Sellers',
];

const sellerDemo = [
  { rank: '01', name: 'Pickaboo', badge: 'Mall', badgeColor: 'bg-ink text-cream', price: 3290, original: 3990, stars: 5, reviews: '12,403', site: 'pickaboo.com', tag: 'Lowest price', tagColor: 'bg-green text-white', delivery: 'Free delivery', eta: 'Tomorrow', cheapest: true },
  { rank: '02', name: 'Daraz', badge: 'Mall', badgeColor: 'bg-red text-white', price: 3490, stars: 5, reviews: '28,910', site: 'daraz.com.bd', tag: '+1Y warranty', tagColor: 'bg-ink text-cream', delivery: '৳60 delivery', eta: '2-3 days' },
  { rank: '03', name: 'Gadget Lounge BD', badge: 'Facebook', badgeColor: 'bg-blue text-white', price: 3550, stars: 4, reviews: '38K followers', site: 'Dhanmondi pickup', tag: 'Pickup today', tagColor: 'bg-yellow text-ink', delivery: '৳80 delivery', eta: '1-2 days', fcommerce: true },
  { rank: '04', name: 'BD-Shop', badge: 'Official', badgeColor: 'bg-green text-white', price: 3650, stars: 4, reviews: '3,209', site: 'bdshop.com', tag: 'Same-day Dhaka', tagColor: 'bg-yellow text-ink', delivery: '৳70 delivery', eta: 'Today' },
  { rank: '05', name: 'Smart Buy 24', badge: 'Facebook', badgeColor: 'bg-blue text-white', price: 3690, stars: 4, reviews: '12K followers', site: 'COD available', tag: 'Cash on delivery', tagColor: 'bg-ink/85 text-cream', delivery: '৳100 delivery', eta: '2 days', fcommerce: true },
];

const fbCards = [
  { initials: 'GL', color: '#1877F2', name: 'Gadget Lounge BD', verified: true, meta: '38K followers · ~5 min reply · 4.5★', price: '৳3,550', sub: 'via Messenger' },
  { initials: 'SK', color: '#FF4521', name: 'Sundori Kothon', verified: true, meta: '82K followers · Cosmetics · 4.7★', price: '৳1,290', sub: '3 colors avail.' },
  { initials: 'DK', color: '#0F4D2A', name: 'Dhaka Kitchen Wares', verified: false, meta: '14K followers · COD · 4.3★', price: '৳6,750', sub: '৳450 less than Daraz' },
  { initials: 'BB', color: '#FFD23F', textColor: '#15131A', name: 'Bookworm Bangla', verified: true, meta: '26K followers · Books · 4.8★', price: '৳890', sub: 'incl. delivery' },
];

const categories = [
  { icon: '📱', name: 'Mobiles & Tab', slug: 'smartphones', tint: 'bg-blue-soft' },
  { icon: '💻', name: 'Laptops', slug: 'laptops', tint: 'bg-yellow-soft' },
  { icon: '🎧', name: 'Headphones', slug: 'headphones', tint: 'bg-red-soft' },
  { icon: '👗', name: 'Fashion & Saree', slug: 'fashion', tint: 'bg-lime-soft' },
  { icon: '🍳', name: 'Home & Kitchen', slug: 'home kitchen', tint: 'bg-green-soft' },
  { icon: '✨', name: 'Beauty & Care', slug: 'beauty cosmetics', tint: 'bg-red-soft' },
  { icon: '📚', name: 'Books', slug: 'books', tint: 'bg-yellow-soft' },
  { icon: '🛒', name: 'Groceries', slug: 'groceries', tint: 'bg-lime-soft' },
];

function fmt(n) {
  return '৳' + n.toLocaleString('en-IN');
}

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getAllProducts().then((res) => {
      const data = res.data?.content || res.data || [];
      if (Array.isArray(data)) setProducts(data.slice(0, 4));
    }).catch(() => {});

    getDashboardStats().then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const handleSearch = (query) => {
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ===== HERO ===== */}
      <section className="relative">
        {/* Decorative blobs */}
        <div className="absolute top-20 -left-32 w-80 h-80 rounded-full bg-yellow/30 blur-3xl animate-blob pointer-events-none" />
        <div className="absolute top-40 -right-32 w-96 h-96 rounded-full bg-red/15 blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '4s' }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-lime/25 blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '8s' }} />

        <div className="container-tight pt-8 sm:pt-14 lg:pt-20 pb-10 sm:pb-14 lg:pb-16 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-line-strong px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-medium mb-5 sm:mb-7 shadow-[var(--shadow-soft)]">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 bg-green rounded-full animate-pulse-dot" />
              <span className="relative w-2 h-2 bg-green rounded-full" />
            </span>
            <span>Live prices · refreshed 47s ago</span>
          </div>

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
            Search any product. We check <span className="text-ink font-semibold">50+ Bangladesh shops</span>
            {' '}<em className="text-blue italic">and 12,000+ Facebook sellers</em>
            {' '}— then show you the cheapest one.
          </p>

          <SearchBar large onSearch={handleSearch} />

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 px-2">
            <span className="text-gray text-xs sm:text-sm mr-1">Trending:</span>
            {['iPhone 16 Pro', 'Xiaomi Mi Band 8', 'Walton AC', 'Samsung S24'].map((t) => (
              <button
                key={t}
                onClick={() => handleSearch(t)}
                className="bg-white border border-line-strong px-3 py-1.5 rounded-full text-xs sm:text-sm text-ink/80 hover:bg-ink hover:text-cream hover:border-ink active:scale-95 transition-all"
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16 max-w-2xl mx-auto">
            <div className="card-soft p-3 sm:p-4 text-center"><StatsCard value={stats?.totalProducts?.toLocaleString() || '2.4M'} label="products tracked" accent="red" /></div>
            <div className="card-soft p-3 sm:p-4 text-center"><StatsCard value="50+" label="ecom sites" delay={100} accent="ink" /></div>
            <div className="card-soft p-3 sm:p-4 text-center"><StatsCard value="12K+" label="fb sellers" delay={200} accent="blue" /></div>
            <div className="card-soft p-3 sm:p-4 text-center"><StatsCard value="15 min" label="refresh rate" delay={300} accent="green" /></div>
          </div>
        </div>
      </section>

      {/* ===== SOURCES MARQUEE ===== */}
      <div className="bg-ink text-cream py-5 sm:py-7 mt-2 sm:mt-4 overflow-hidden relative">
        <div className="text-center text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-lime font-mono mb-3 flex items-center justify-center gap-2">
          <span className="w-6 h-px bg-lime/50" /> Currently watching <span className="w-6 h-px bg-lime/50" />
        </div>
        <div className="flex animate-scroll whitespace-nowrap font-serif italic text-lg sm:text-2xl lg:text-3xl font-medium gap-8 sm:gap-12">
          {[0, 1].map((i) => (
            <span key={i} className="flex items-center gap-8 sm:gap-12">
              {sites.map((s) => (
                <span key={s + i} className="flex items-center gap-6 sm:gap-10">
                  {s}<span className="w-1.5 h-1.5 bg-lime rounded-full shrink-0" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ===== SEARCH RESULT PREVIEW ===== */}
      <section className="container-tight py-12 sm:py-16 lg:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <div className="tag-bar mb-2 sm:mb-3">Live demo</div>
            <h2 className="font-serif font-semibold leading-[1.02] tracking-[-0.025em] text-[clamp(1.65rem,4vw,2.75rem)]">
              Here's what <em className="text-red">a search looks like</em>
            </h2>
          </div>
          <Link to="/search?q=Xiaomi+Mi+Band+8" className="text-sm font-semibold text-ink hover:text-red transition-colors shrink-0 inline-flex items-center gap-1.5 group">
            View all results <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="card-elev p-3 sm:p-5 mb-3 sm:mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="font-serif text-base sm:text-lg lg:text-[22px] font-semibold leading-snug">
                Showing 11 sellers for <span className="text-red italic">"Xiaomi Mi Band 8"</span>
              </div>
              <div className="text-[11px] sm:text-[13px] text-gray font-mono mt-1 flex items-center gap-2 flex-wrap">
                <span>Low <b className="text-green">৳3,290</b></span>
                <span className="text-line-strong">·</span>
                <span>High <b className="text-red">৳4,200</b></span>
                <span className="text-line-strong">·</span>
                <span>Avg <b className="text-ink">৳3,690</b></span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {['All sellers', 'Verified', 'Dhaka', '★ 4+'].map((f, i) => (
                <button key={f} className={`px-3 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition-all ${i === 0 ? 'bg-ink text-cream' : 'bg-cream-soft text-ink/70 hover:bg-ink hover:text-cream'}`}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {sellerDemo.map((s) => (
            <div
              key={s.rank}
              onClick={() => navigate('/product/demo-xiaomi-band-8')}
              className={`group relative cursor-pointer rounded-2xl p-3 sm:p-4 lg:p-5 transition-all duration-300 ${
                s.cheapest
                  ? 'bg-gradient-to-br from-lime/40 via-lime/20 to-cream border-[1.5px] border-ink shadow-[0_10px_30px_-10px_rgba(15,77,42,0.25)]'
                  : s.fcommerce
                  ? 'bg-blue-soft/30 border border-blue/20 hover:border-blue/40'
                  : 'bg-white border border-line hover:border-line-strong hover:shadow-[var(--shadow-card)]'
              }`}
            >
              {s.cheapest && (
                <div className="absolute -top-3 left-4 sm:left-5 inline-flex items-center gap-1 bg-ink text-cream px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Crown className="w-3 h-3 text-yellow" /> Best price
                </div>
              )}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`hidden sm:flex items-center justify-center font-serif text-xl lg:text-2xl font-bold italic w-10 lg:w-11 h-10 lg:h-11 rounded-full shrink-0 ${
                  s.cheapest ? 'bg-ink text-cream' : 'bg-cream-soft text-ink/40'
                }`}>{s.rank}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                    <span className="font-semibold text-sm sm:text-[15px] truncate">{s.name}</span>
                    <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${s.badgeColor}`}>{s.badge}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-[13px] text-gray">
                    <span className="text-yellow flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < s.stars ? 'fill-yellow text-yellow' : 'text-line-strong'}`} />
                      ))}
                    </span>
                    <span>{s.reviews}</span>
                    <span className="hidden sm:inline">· {s.site}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 sm:mt-2">
                    <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase ${s.tagColor}`}>{s.tag}</span>
                    <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full font-mono bg-ink/[0.04] text-gray items-center gap-1">
                      <Truck className="w-3 h-3" />{s.delivery}
                    </span>
                    <span className="hidden md:inline-flex text-[10px] px-2 py-0.5 rounded-full font-mono bg-ink/[0.04] text-gray items-center gap-1">
                      <Clock className="w-3 h-3" />{s.eta}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-mono text-base sm:text-lg lg:text-xl font-bold ${s.cheapest ? 'text-green' : 'text-ink'}`}>
                    {fmt(s.price)}
                  </div>
                  {s.original && <div className="text-[10px] sm:text-[11px] font-mono text-gray-soft line-through">{fmt(s.original)}</div>}
                  <button className="hidden sm:inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-ink bg-cream hover:bg-ink hover:text-cream border border-line-strong hover:border-ink px-3 py-1 rounded-full transition-all">
                    Visit <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TRENDING PRODUCTS FROM API ===== */}
      {products.length > 0 && (
        <section className="container-tight py-8 sm:py-12">
          <div className="flex items-end justify-between gap-3 mb-6 sm:mb-7">
            <div>
              <div className="tag-bar mb-2 sm:mb-3">Hot now</div>
              <h2 className="font-serif font-semibold leading-[1.02] tracking-[-0.025em] text-[clamp(1.65rem,4vw,2.75rem)]">
                Trending <em className="text-red">picks</em>
              </h2>
            </div>
            <Link to="/search?q=trending" className="text-sm font-semibold text-ink hover:text-red transition-colors inline-flex items-center gap-1.5 group">
              See all <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ===== FCOMMERCE ===== */}
      <section className="py-12 sm:py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue/[0.04] via-lime/[0.07] to-cream pointer-events-none" />
        <div className="container-tight relative">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-3">
              <div className="tag-bar text-blue mb-3 sm:mb-4">
                <MessageCircle className="w-4 h-4" /> The fcommerce angle
              </div>
              <h2 className="font-serif font-semibold leading-[1.02] tracking-[-0.025em] mb-4 sm:mb-5 text-[clamp(1.85rem,5vw,3.5rem)]">
                We see <em className="text-blue">Facebook sellers</em> too.
              </h2>
              <p className="text-[15px] sm:text-base lg:text-[17px] text-gray mb-6 sm:mb-7 leading-relaxed max-w-xl">
                Half of Bangladesh's ecommerce happens in Facebook pages, groups, and Messenger DMs. The big aggregators ignore it. We don't.
              </p>
              <ul className="space-y-3 sm:space-y-3.5 mb-6 sm:mb-7">
                {[
                  '12,000+ verified Facebook pages indexed',
                  'Live price extraction from posts & Marketplace',
                  'Ratings based on follower count & feedback',
                  'One-tap Messenger inquiry — no scrolling',
                ].map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm sm:text-[15px]">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-blue text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold mt-0.5 shrink-0">✓</span>
                    <span className="text-ink/85">{b}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/search?q=facebook"
                className="btn-primary !bg-blue !text-white inline-flex hover:!bg-blue/90"
              >
                Browse Facebook sellers <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="lg:col-span-2 flex flex-col gap-2.5 sm:gap-3">
              {fbCards.map((c, i) => (
                <div
                  key={c.name}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(c.name)}`)}
                  className="card-soft p-3 sm:p-4 flex items-center gap-3 cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-[15px] sm:text-base font-serif font-bold shrink-0 shadow-inner" style={{ backgroundColor: c.color, color: c.textColor || 'white' }}>{c.initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-[15px] flex items-center gap-1.5 truncate">{c.name} {c.verified && <span className="text-blue text-[12px]">✓</span>}</div>
                    <div className="text-[11px] sm:text-[12px] text-gray truncate">{c.meta}</div>
                  </div>
                  <div className="text-right font-mono font-bold text-sm sm:text-[15px] shrink-0">
                    {c.price}<span className="block text-[10px] sm:text-[11px] text-green font-normal mt-0.5">{c.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section id="categories" className="container-tight py-12 sm:py-16 lg:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <div className="tag-bar mb-2 sm:mb-3">Browse</div>
            <h2 className="font-serif font-semibold leading-[1.02] tracking-[-0.025em] text-[clamp(1.65rem,4vw,2.75rem)]">
              Shop by <em className="text-red">category</em>
            </h2>
          </div>
          <Link to="/search?q=all" className="text-sm font-semibold text-ink hover:text-red transition-colors inline-flex items-center gap-1.5 group">
            All categories <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4">
          {categories.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/search?q=${encodeURIComponent(cat.slug)}`)}
              className="card-soft p-4 sm:p-5 lg:p-6 text-left flex items-start justify-between min-h-[110px] sm:min-h-[140px] group"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex flex-col gap-2 sm:gap-3">
                <span className={`text-2xl sm:text-3xl w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${cat.tint} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-[-4deg]`}>
                  {cat.icon}
                </span>
                <span className="font-serif text-sm sm:text-base lg:text-lg font-semibold tracking-tight leading-tight">{cat.name}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-soft opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* ===== DEALS ===== */}
      <section id="deals" className="py-12 sm:py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-lime/15 via-yellow/10 to-cream pointer-events-none" />
        <div className="container-tight relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <div className="tag-bar text-red mb-2 sm:mb-3"><Zap className="w-4 h-4" /> Today only</div>
              <h2 className="font-serif font-semibold leading-[1.02] tracking-[-0.025em] text-[clamp(1.65rem,4vw,2.75rem)]">
                Biggest <em className="text-red">drops</em> of the day
              </h2>
            </div>
            <Link to="/search?q=deals" className="text-sm font-semibold text-ink hover:text-red transition-colors inline-flex items-center gap-1.5 group">
              See all deals <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: '🎧', cat: 'Electronics', name: 'Havit H2002d Gaming Headphone', now: 1390, was: 2400, discount: 42, source: 'BD-Shop', sellers: 6, grad: 'from-red-soft to-cream' },
              { icon: '🍳', cat: 'Home', name: 'Walton Air Fryer WAF-MA40 4L', now: 6750, was: 9400, discount: 28, source: 'BD-Shop', sellers: 4, grad: 'from-green-soft to-cream' },
              { icon: '📱', cat: 'Mobile', name: 'Samsung Galaxy A15 (8/256GB)', now: 22900, was: 27990, discount: 18, source: 'Daraz Mall', sellers: 9, grad: 'from-blue-soft to-cream' },
              { icon: '✨', cat: 'Beauty', name: 'Cetaphil Gentle Skin Cleanser 250ml', now: 890, was: 1360, discount: 35, source: 'Sundori (FB)', sellers: 5, grad: 'from-yellow-soft to-cream' },
            ].map((d, i) => (
              <div
                key={d.name}
                onClick={() => navigate(`/search?q=${encodeURIComponent(d.name)}`)}
                className="card-soft overflow-hidden flex flex-col cursor-pointer group"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`relative h-32 sm:h-36 lg:h-40 bg-gradient-to-br ${d.grad} flex items-center justify-center overflow-hidden`}>
                  <span className="text-6xl sm:text-7xl opacity-60 group-hover:scale-110 transition-transform duration-500">{d.icon}</span>
                  <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-red text-white px-2.5 py-1 rounded-full font-mono text-[10px] sm:text-[11px] font-bold shadow-lg shadow-red/30">−{d.discount}%</span>
                </div>
                <div className="p-3 sm:p-4 flex-1 flex flex-col">
                  <div className="font-mono text-[10px] sm:text-[11px] text-gray uppercase tracking-[0.1em] mb-1">{d.cat}</div>
                  <div className="font-serif text-sm sm:text-base font-semibold tracking-tight leading-snug mb-2.5 sm:mb-3 line-clamp-2 min-h-[2.6em]">{d.name}</div>
                  <div className="flex items-baseline gap-2 mt-auto mb-1.5">
                    <span className="font-mono text-base sm:text-lg font-bold text-ink">{fmt(d.now)}</span>
                    <span className="font-mono text-xs sm:text-sm text-gray-soft line-through">{fmt(d.was)}</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-gray flex items-center gap-1 pt-2 border-t border-line">
                    Cheapest on <b className="text-ink">{d.source}</b>
                    <span className="ml-auto text-gray-soft">· {d.sellers} sellers</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="bg-ink text-cream py-14 sm:py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-red/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-lime/10 blur-3xl pointer-events-none" />
        <div className="container-tight relative">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <div className="tag-bar text-lime mb-3 sm:mb-4">How it works</div>
            <h2 className="font-serif font-semibold leading-[1.02] tracking-[-0.025em] text-[clamp(1.85rem,5vw,3.5rem)]">
              Three taps. <em className="text-lime">Lowest price.</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {[
              { num: '01', title: 'Search anything', desc: "Type a product, paste a Daraz link, or drop a Facebook post URL. We figure it out.", icon: Sparkles },
              { num: '02', title: 'See every price', desc: 'Every shop. Every Facebook seller. Sorted by price, rating, or delivery time.', icon: TrendingUp },
              { num: '03', title: 'Buy from the best', desc: "One tap to seller site or Messenger. No middleman fees. We never touch your money.", icon: ShieldCheck },
            ].map((s) => {
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

      {/* ===== NEWSLETTER CTA ===== */}
      <section className="bg-red text-white py-16 sm:py-20 lg:py-24 text-center relative overflow-hidden">
        <span className="absolute -top-10 left-[5%] font-serif italic text-[180px] sm:text-[260px] opacity-[0.07] leading-none -rotate-[15deg] pointer-events-none select-none">৳</span>
        <span className="absolute -bottom-16 right-[5%] font-serif italic text-[180px] sm:text-[260px] opacity-[0.07] leading-none rotate-12 pointer-events-none select-none">৳</span>
        <div className="container-tight relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-mono uppercase tracking-wider mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Free forever
          </div>
          <h2 className="font-serif font-semibold leading-[0.95] tracking-tight mb-4 sm:mb-5 text-[clamp(2rem,5.5vw,4rem)]">
            Daily deals.<br /><em>Straight to Telegram.</em>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg max-w-[480px] mx-auto mb-7 sm:mb-9 opacity-95">
            The biggest price drops every morning at 9am. No spam, only deals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-2 max-w-[460px] mx-auto">
            <input
              type="text"
              placeholder="@your-telegram-username"
              className="flex-1 min-w-0 px-5 py-3.5 border border-white/20 rounded-full bg-white/10 text-white text-sm placeholder-white/60 outline-none backdrop-blur-sm focus:border-white focus:bg-white/15 transition-all"
            />
            <button className="bg-ink text-cream px-6 py-3.5 rounded-full font-semibold text-sm hover:bg-cream hover:text-ink transition-colors whitespace-nowrap shadow-lg shadow-ink/20">
              Subscribe →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
