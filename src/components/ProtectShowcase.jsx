import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Search, Truck, ArrowRight, AlertTriangle, Wallet, TrendingDown,
} from 'lucide-react';

// Demo "scam risk" the meter animates to (0–100, higher = riskier).
const RISK = 58;

/**
 * Damkemon Protect homepage spotlight. Buyer-trust feature: matching prices is
 * table stakes; in BD the real fear is paying a seller (often an FB page) and
 * getting scammed. The right-hand card animates a live risk check — score
 * counts up, scam flags slide in, then a "protected" stamp lands — so the
 * value lands at a glance. Motion is gated on scroll-in and respects
 * prefers-reduced-motion (see .pm-* rules in index.css).
 */
export default function ProtectShowcase() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [score, setScore] = useState(0);

  // Reveal + sequence trigger when the panel scrolls into view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { setInView(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Count the risk score up once visible.
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setScore(RISK); return; }
    let raf, start;
    const dur = 1100;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / dur, 1);
      setScore(Math.round((1 - Math.pow(1 - p, 3)) * RISK));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  return (
    <section className="container-tight py-10 sm:py-14 lg:py-18">
      <div
        ref={ref}
        className={`relative overflow-hidden rounded-3xl bg-ink text-cream p-6 sm:p-10 lg:p-12 ${inView ? 'pm-in' : ''}`}
      >
        {/* drifting aurora */}
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-lime/15 blur-3xl pointer-events-none animate-blob" />
        <div className="absolute -bottom-28 -left-16 w-96 h-96 rounded-full bg-red/20 blur-3xl pointer-events-none animate-blob" style={{ animationDelay: '6s' }} />
        <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full bg-yellow/10 blur-3xl pointer-events-none animate-blob" style={{ animationDelay: '11s' }} />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* LEFT — message */}
          <div>
            <div className="tag-bar text-lime mb-4 inline-flex items-center gap-2 pm-reveal">
              <span className="relative inline-flex w-4 h-4 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-lime/50 pm-ring" />
                <ShieldCheck className="w-4 h-4 relative" />
              </span>
              Damkemon Protect
            </div>

            <h2 className="font-serif font-semibold leading-[1.02] tracking-tight text-[clamp(2rem,5.2vw,3.4rem)] pm-reveal d1">
              Buy from anyone.<br />
              <span className="scribble-underline">
                <em className="text-lime">Without the fear.</em>
                <svg viewBox="0 0 200 14" preserveAspectRatio="none">
                  <path d="M2 10 Q 50 2, 100 8 T 198 6" stroke="#D4F542" strokeWidth="3" fill="none" strokeLinecap="round" className="animate-scribble" />
                </svg>
              </span>
            </h2>

            <p className="text-cream/60 text-sm sm:text-base mt-5 max-w-md pm-reveal d2">
              Found it cheaper on a Facebook page? Before you pay, Damkemon scores the
              scam risk, puts your order on record, and stands behind you if it goes wrong.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-6 pm-reveal d3">
              <Link to="/protect" className="btn-accent group">
                <ShieldCheck className="w-4 h-4" /> Check a seller now
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/protect" className="text-sm font-semibold text-cream/70 hover:text-cream inline-flex items-center gap-1.5">
                See how it works
              </Link>
            </div>

            <div className="flex items-center gap-2 mt-7 pm-reveal d4">
              <MiniStep icon={Search} label="Check" />
              <Dash />
              <MiniStep icon={ShieldCheck} label="Protect" />
              <Dash />
              <MiniStep icon={Truck} label="Resolve" />
            </div>
          </div>

          {/* RIGHT — animated live risk check */}
          <div className="relative pm-reveal d2">
            <Chip className="pm-chip pm-float-a -top-3 left-2 sm:-left-4" tone="bg-red-soft text-red">
              <Wallet className="w-3 h-3" /> bKash personal?
            </Chip>
            <Chip className="pm-chip pm-float-b -bottom-4 right-1 sm:-right-3" tone="bg-yellow-soft text-ink">
              <TrendingDown className="w-3 h-3" /> 32% below market
            </Chip>

            <div className="relative rounded-2xl bg-cream/[0.06] border border-cream/10 p-5 overflow-hidden transition-colors hover:border-cream/20">
              <div className="pm-scan absolute inset-x-0 h-24 -top-24 bg-gradient-to-b from-transparent via-lime/10 to-transparent pointer-events-none" />

              <div className="relative flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-cream/50 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse-dot" /> Live risk check
                </span>
                <Search className="w-4 h-4 text-cream/40" />
              </div>

              <div className="relative flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red/40 to-yellow/30 flex items-center justify-center font-serif italic font-bold text-cream/90">R</div>
                <div className="min-w-0">
                  <div className="font-semibold text-cream text-sm truncate">Rafiq's Gadget Corner</div>
                  <div className="text-[11px] text-cream/45 font-mono">Facebook page · 2 months old</div>
                </div>
              </div>

              <div className="relative mb-4">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-mono text-cream/50">Scam risk</span>
                  <span className="font-serif text-2xl font-bold italic text-yellow tabular-nums">
                    {score}<span className="text-cream/40 text-sm not-italic">/100</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-cream/10 overflow-hidden">
                  <div className="pm-meter-fill h-full rounded-full bg-gradient-to-r from-lime via-yellow to-red" style={{ '--pm-risk': `${RISK}%` }} />
                </div>
              </div>

              <div className="relative space-y-1.5 mb-4">
                <Flag>Seller asks for bKash <b className="text-cream/90 font-semibold">Send Money</b> (personal)</Flag>
                <Flag>Price is <b className="text-cream/90 font-semibold">32% below</b> the market average</Flag>
              </div>

              <div className="relative flex items-center justify-between gap-2 rounded-xl bg-green-soft text-green px-3 py-2.5 pm-stamp">
                <span className="inline-flex items-center gap-2 font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4" /> Order protected
                </span>
                <span className="font-mono text-xs font-bold tracking-wider bg-white/70 rounded-md px-2 py-0.5">DK-7F3A2C</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStep({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-cream/10 text-lime">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="font-mono text-[11px] uppercase tracking-wider text-cream/70">{label}</span>
    </div>
  );
}

function Dash() {
  return <span className="w-5 h-px bg-cream/20 shrink-0" />;
}

function Chip({ children, className = '', tone }) {
  return (
    <div className={`absolute z-10 hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-lg ${tone} ${className}`}>
      {children}
    </div>
  );
}

function Flag({ children }) {
  return (
    <div className="flex items-start gap-2 text-[13px] text-cream/70">
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-yellow shrink-0" />
      <span>{children}</span>
    </div>
  );
}
