import { Link } from 'react-router-dom';
import { Sparkles, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative bg-ink text-cream mt-12 sm:mt-16 lg:mt-24 overflow-hidden">
      <div className="absolute -top-32 -right-20 w-72 h-72 rounded-full bg-red/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-lime/10 blur-3xl pointer-events-none" />

      <div className="container-tight relative py-10 sm:py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-md">
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-cream text-ink flex items-center justify-center font-serif font-bold italic">
                d
              </div>
              <span className="font-serif text-xl sm:text-[22px] font-bold italic text-cream">
                dam<span className="text-red">.</span>kemon
              </span>
            </Link>
            <p className="text-cream/55 text-sm leading-relaxed max-w-xs">
              Bangladesh price comparison. Searches live BD shops, never shows fake prices.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-3 sm:gap-5">
            <Link to="/" className="text-cream/70 hover:text-cream text-sm transition-colors">Home</Link>
            <Link to="/compare" className="text-cream/70 hover:text-cream text-sm transition-colors">Compare</Link>
            <Link to="/sellers" className="text-cream/70 hover:text-cream text-sm transition-colors">Sellers</Link>
            <Link to="/dashboard" className="text-cream/70 hover:text-cream text-sm transition-colors">Dashboard</Link>
            <a
              href="https://github.com/Saif64/dam-kemon-backend"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-cream/70 hover:text-cream text-sm transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" /> Source
            </a>
          </nav>
        </div>

        <div className="border-t border-cream/10 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-cream/40 text-xs sm:text-sm inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-yellow" /> Made with chai in Dhaka
          </p>
          <p className="text-cream/40 text-xs sm:text-sm font-mono">© 2026 Damkemon</p>
        </div>
      </div>
    </footer>
  );
}
