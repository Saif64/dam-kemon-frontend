import { useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Shield, Database, Store, Inbox, BarChart3, FileText, LogOut, Package, Search as SearchIcon, Clock, HardDrive } from 'lucide-react';

export default function AdminLayout() {
  const { user, ready, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate('/sign-in', { replace: true });
    else if (user.role !== 'admin') navigate('/account', { replace: true });
  }, [ready, user, navigate]);

  if (!ready) return <div className="container-tight py-16 text-center text-gray">Loading…</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="container-tight py-6 sm:py-10 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="inline-flex items-center gap-2">
          <Shield className="w-5 h-5 text-red" />
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-none">Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray hidden sm:inline">{user.email}</span>
          <button
            onClick={() => { signOut(); navigate('/'); }}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-cream-soft border border-line hover:border-ink transition-colors"
          >
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      </div>

      <nav className="flex gap-1 sm:gap-2 mb-6 border-b border-line overflow-x-auto no-scrollbar">
        <Tab to="/admin/indexer" icon={Database}>Indexer</Tab>
        <Tab to="/admin/shops" icon={Store}>Shops</Tab>
        <Tab to="/admin/pending-shops" icon={Inbox}>Pending</Tab>
        <Tab to="/admin/catalog" icon={Package}>Catalog</Tab>
        <Tab to="/admin/search-log" icon={SearchIcon}>Search log</Tab>
        <Tab to="/admin/stats" icon={BarChart3}>Stats</Tab>
        <Tab to="/admin/cache" icon={HardDrive}>Cache</Tab>
        <Tab to="/admin/jobs" icon={Clock}>Jobs</Tab>
        <Tab to="/admin/audit" icon={FileText}>Audit log</Tab>
      </nav>

      <Outlet />
    </div>
  );
}

function Tab({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      end={to === '/admin'}
      className={({ isActive }) =>
        `inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
          isActive ? 'text-ink border-ink' : 'text-gray border-transparent hover:text-ink'
        }`
      }
    >
      <Icon className="w-4 h-4" /> {children}
    </NavLink>
  );
}
