import { Link, useNavigate } from 'react-router-dom';
import { Mail, Sparkles, Code2, AtSign, Send } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();

  const shopLinks = [
    { label: 'Electronics', q: 'electronics' },
    { label: 'Fashion & Saree', q: 'fashion' },
    { label: 'Groceries', q: 'groceries' },
    { label: 'Books', q: 'books' },
    { label: 'Daily Deals', q: 'deals' },
  ];
  const sellerLinks = ['List Your Store', 'Seller Dashboard', 'API Access', 'Pricing'];
  const companyLinks = ['About Us', 'Blog', 'Privacy Policy', 'Terms of Service'];

  return (
    <footer className="relative bg-ink text-cream mt-12 sm:mt-16 lg:mt-24 overflow-hidden">
      <div className="absolute -top-32 -right-20 w-72 h-72 rounded-full bg-red/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-lime/10 blur-3xl pointer-events-none" />

      <div className="container-tight relative py-12 sm:py-16 lg:py-20">
        {/* Top CTA strip */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 mb-10 sm:mb-14 pb-10 sm:pb-14 border-b border-cream/10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-cream/10 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider mb-3">
              <Sparkles className="w-3 h-3 text-yellow" /> Stay ahead
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold italic leading-[1.05] tracking-tight mb-2">
              The cheapest prices, <span className="text-lime">delivered.</span>
            </h3>
            <p className="text-cream/55 text-sm sm:text-base">
              Get the biggest daily drops in your Telegram. No spam, just deals.
            </p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); }}
            className="flex flex-col sm:flex-row gap-2 sm:gap-2 lg:min-w-[420px]"
          >
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" />
              <input
                type="text"
                placeholder="@your-telegram"
                className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-cream/5 border border-cream/15 rounded-full text-sm text-cream placeholder-cream/40 outline-none focus:border-lime focus:bg-cream/10 transition-all"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 bg-lime text-ink font-semibold text-sm px-5 py-3 sm:py-3.5 rounded-full hover:bg-cream transition-colors"
            >
              <Send className="w-4 h-4" /> Subscribe
            </button>
          </form>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10">
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-9 h-9 rounded-xl bg-cream text-ink flex items-center justify-center font-serif font-bold italic">
                d
              </div>
              <span className="font-serif text-xl sm:text-[22px] font-bold italic text-cream">
                dam<span className="text-red">.</span>kemon
              </span>
            </Link>
            <p className="text-cream/55 text-sm leading-relaxed mb-5 max-w-xs">
              Bangladesh's price comparison engine. Built in Dhaka, free for everyone.
            </p>
            <div className="flex gap-2">
              {[Code2, AtSign, Send].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-cream/5 border border-cream/10 flex items-center justify-center hover:bg-cream/15 hover:scale-105 transition-all"
                  aria-label="social"
                >
                  <Icon className="w-4 h-4 text-cream" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/40 mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {shopLinks.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigate(`/search?q=${item.q}`)}
                    className="text-cream/70 hover:text-cream text-sm transition-colors text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/40 mb-4">Sellers</h4>
            <ul className="space-y-2.5">
              {sellerLinks.map((item) => (
                <li key={item}>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-cream/70 hover:text-cream text-sm transition-colors text-left"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/40 mb-4">Company</h4>
            <ul className="space-y-2.5">
              {companyLinks.map((item) => (
                <li key={item}>
                  <span className="text-cream/70 hover:text-cream text-sm transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-cream/10 mt-10 sm:mt-14 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-cream/40 text-xs sm:text-sm">© 2026 Damkemon · Made with chai in Dhaka</p>
          <p className="text-cream/40 text-xs sm:text-sm font-mono">hello@damkemon.com</p>
        </div>
      </div>
    </footer>
  );
}
