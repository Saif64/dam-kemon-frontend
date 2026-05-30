import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, BarChart3, Sparkles, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
// THEME_TOGGLE_DISABLED: dark mode is paused. See src/api/theme.js for the
// re-enable recipe. We keep the import-less component so the layout stays
// pixel-identical when we flip dark back on.

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setMobileOpen(false);
    }
  };

  // Center nav holds 6 items — "Dashboard" lives as a CTA button on the
  // right so we don't double-up. The "Sell with us" link is our entry point
  // into the Saathi seller toolkit; keep it visible because it funnels
  // merchants who'd otherwise never find the dashboard signup.
  // The pill is whitespace-nowrap + shrink-0 so it never wraps. There's no
  // desktop search bar (it freed the room the 6-item pill needs), and the
  // Admin/account labels collapse to icons below xl so the admin layout still
  // fits at lg. Below lg everything moves into the hamburger menu.
  const navLinks = [
    { to: '/',          label: 'Home' },
    { to: '/browse',    label: 'Browse' },
    { to: '/protect',   label: 'Protect' },
    { to: '/compare',   label: 'Compare' },
    { to: '/sellers',   label: 'Shops' },
    { to: '/saathi',    label: 'Sell with us' },
  ];

  const handleNavClick = (to) => {
    setMobileOpen(false);
    navigate(to);
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass shadow-[0_1px_0_var(--color-line)]' : 'bg-transparent'
        }`}
      >
        <div className="container-tight">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 shrink-0 group">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-ink text-cream flex items-center justify-center font-serif font-bold italic text-base group-hover:rotate-[-6deg] transition-transform">
                d
              </div>
              <span className="font-serif text-xl sm:text-[22px] font-bold italic tracking-tight text-ink hidden xs:inline sm:inline">
                dam<span className="text-red">.</span>kemon
              </span>
            </Link>

            {/* Center nav (desktop) — surface bg + line-strong border auto-flip
                with the theme; the prior bg-white/60 was literal white so it
                rendered as a washed-out grey pill in dark mode. */}
            <div className="hidden lg:flex items-center gap-0.5 shrink-0 bg-cream-soft border border-line-strong rounded-full px-1.5 py-1.5 shadow-[var(--shadow-soft)]">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.to)}
                  className="text-ink/75 hover:text-ink hover:bg-cream text-sm font-medium whitespace-nowrap transition-colors px-3 py-1.5 rounded-full"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right side (desktop) — auth + Dashboard CTA. No search bar here:
                desktop uses the in-page search; the navbar search lives only in
                the hamburger menu (below lg). With the search gone the bar fits
                comfortably from lg up. */}
            <div className="hidden lg:flex items-center gap-2">
              {/* THEME_TOGGLE_DISABLED: dark mode is paused. */}
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap text-sm text-red font-semibold px-3 py-2 rounded-full hover:bg-red/10 transition-colors" title="Admin console">
                      <Shield className="w-4 h-4" /><span className="hidden xl:inline">Admin</span>
                    </Link>
                  )}
                  <Link to="/account" className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap text-sm text-ink/80 hover:text-ink px-3 py-2 rounded-full hover:bg-cream transition-colors">
                    <UserIcon className="w-4 h-4 shrink-0" />
                    <span className="hidden xl:inline-block max-w-[7rem] truncate align-middle">{user.displayName || 'Account'}</span>
                  </Link>
                </>
              ) : (
                <Link to="/sign-in" className="text-sm text-ink/70 hover:text-ink font-medium px-3 py-2 rounded-full hover:bg-cream transition-colors shrink-0 whitespace-nowrap hidden md:inline-block">
                  Sign in
                </Link>
              )}
              <Link to="/dashboard" className="btn-accent shrink-0 !text-sm !px-4 !py-2.5">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden lg:inline">Dashboard</span>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-10 h-10 -mr-1 flex items-center justify-center rounded-full hover:bg-ink/5 active:scale-95 transition-all"
              aria-label="Toggle menu"
            >
              <div className="relative w-5 h-5">
                <Menu className={`absolute inset-0 w-5 h-5 transition-all ${mobileOpen ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'}`} />
                <X className={`absolute inset-0 w-5 h-5 transition-all ${mobileOpen ? 'rotate-0 opacity-100' : '-rotate-180 opacity-0'}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile / tablet menu — covers everything below lg */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div
          className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute top-14 sm:top-16 left-3 right-3 md:left-auto md:right-4 md:w-80 bg-cream rounded-3xl shadow-[var(--shadow-lift)] border border-line-strong overflow-hidden transition-all duration-300 ${
            mobileOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
          }`}
        >
          <div className="p-4 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any product…"
                autoFocus={mobileOpen}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-line rounded-2xl text-[15px] text-ink placeholder-gray-soft focus:outline-none focus:border-ink/30 transition-colors"
              />
            </form>
            <div className="flex flex-col gap-0.5">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.to)}
                  className="px-4 py-3.5 text-left text-ink hover:bg-white rounded-2xl text-[15px] font-medium transition-colors flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <span className="text-gray-soft text-xl">→</span>
                </button>
              ))}
              {user ? (
                <>
                  <button onClick={() => handleNavClick('/account')} className="px-4 py-3.5 text-left text-ink hover:bg-white rounded-2xl text-[15px] font-medium flex items-center justify-between">
                    <span className="inline-flex items-center gap-2"><UserIcon className="w-4 h-4" /> {user.displayName || 'Account'}</span>
                    <span className="text-gray-soft text-xl">→</span>
                  </button>
                  {user.role === 'admin' && (
                    <button onClick={() => handleNavClick('/admin')} className="px-4 py-3.5 text-left text-red hover:bg-white rounded-2xl text-[15px] font-semibold flex items-center justify-between">
                      <span className="inline-flex items-center gap-2"><Shield className="w-4 h-4" /> Admin</span>
                      <span className="text-gray-soft text-xl">→</span>
                    </button>
                  )}
                </>
              ) : (
                <button onClick={() => handleNavClick('/sign-in')} className="px-4 py-3.5 text-left text-ink hover:bg-white rounded-2xl text-[15px] font-medium flex items-center justify-between">
                  <span className="inline-flex items-center gap-2"><UserIcon className="w-4 h-4" /> Sign in</span>
                  <span className="text-gray-soft text-xl">→</span>
                </button>
              )}
              {/* THEME_TOGGLE_DISABLED: dark mode is paused. */}
            </div>
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="btn-accent w-full !py-3.5"
            >
              <Sparkles className="w-4 h-4" />
              Open Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
