import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, GitCompare, MessageCircle, BarChart3 } from 'lucide-react';

const tabs = [
  { to: '/',          icon: Home,          label: 'Home' },
  { to: '/search',    icon: Search,        label: 'Search' },
  { to: '/compare',   icon: GitCompare,    label: 'Compare' },
  { to: '/sellers',   icon: MessageCircle, label: 'Sellers' },
  { to: '/dashboard', icon: BarChart3,     label: 'Dash' },
];

export default function BottomNav() {
  const { pathname, search } = useLocation();
  const [show, setShow] = useState(true);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) setShow(true);
      else setShow(y < lastY);
      setLastY(y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastY]);

  const isActive = (to) => {
    if (to === '/') return pathname === '/';
    if (to.startsWith('/#')) return false;
    if (to === '/search') return pathname === '/search';
    return pathname.startsWith(to);
  };

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe px-3 pt-2 transition-transform duration-300 ${
        show ? 'translate-y-0' : 'translate-y-[120%]'
      }`}
    >
      <nav className="flex items-center justify-around bg-ink/95 backdrop-blur-xl text-cream rounded-full px-2 py-1.5 shadow-[0_-8px_30px_-10px_rgba(21,19,26,0.4)]">
        {tabs.map((t) => {
          const active = isActive(t.to);
          const Icon = t.icon;
          const handleClick = (e) => {
            if (t.to.startsWith('/#')) {
              e.preventDefault();
              const id = t.to.slice(2);
              if (pathname === '/') {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.location.href = '/' + t.to.slice(1);
              }
            }
          };
          return (
            <Link
              key={t.label}
              to={t.to}
              onClick={handleClick}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all ${
                active ? 'bg-red text-white' : 'text-cream/70 active:scale-90'
              }`}
              aria-label={t.label}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.4 : 2} />
              <span className="text-[10px] font-medium leading-none">{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
