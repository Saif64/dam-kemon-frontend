import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const handleSearch = (query) => {
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const steps = [
    { num: '01', title: 'Search anything',  desc: 'Type any product. We hit DuckDuckGo with a Bangladesh signal and pull live BD shop URLs.', icon: Sparkles },
    { num: '02', title: 'We scrape live',   desc: 'Each URL is fetched and parsed for schema.org or Open Graph product data. No fakes, no fixtures.', icon: TrendingUp },
    { num: '03', title: 'See every price',  desc: 'Results stream in as they land. Cheapest wins. Cross-site duplicates are merged automatically.', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <section className="relative">
        <div className="absolute top-20 -left-32 w-80 h-80 rounded-full bg-yellow/30 blur-3xl animate-blob pointer-events-none" />
        <div className="absolute top-40 -right-32 w-96 h-96 rounded-full bg-red/15 blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '4s' }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-lime/25 blur-3xl animate-blob pointer-events-none" style={{ animationDelay: '8s' }} />

        <div className="container-tight pt-8 sm:pt-14 lg:pt-20 pb-10 sm:pb-14 lg:pb-16 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-line-strong px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-medium mb-5 sm:mb-7 shadow-[var(--shadow-soft)]">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 bg-green rounded-full animate-pulse-dot" />
              <span className="relative w-2 h-2 bg-green rounded-full" />
            </span>
            <span>Real-time price comparison</span>
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
            Search any product. We scrape <span className="text-ink font-semibold">live BD shops</span> through DuckDuckGo
            {' '}— then show every price we can find, cheapest first.
          </p>

          <SearchBar large onSearch={handleSearch} />
        </div>
      </section>

      <section className="bg-ink text-cream py-14 sm:py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-red/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-lime/10 blur-3xl pointer-events-none" />
        <div className="container-tight relative">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <div className="tag-bar text-lime mb-3 sm:mb-4">How it works</div>
            <h2 className="font-serif font-semibold leading-[1.02] tracking-[-0.025em] text-[clamp(1.85rem,5vw,3.5rem)]">
              Three steps. <em className="text-lime">Lowest price.</em>
            </h2>
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
