import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import { Users, Search as SearchIcon, MousePointerClick, TrendingUp } from 'lucide-react';

function fmt(p) { if (p == null) return 'N/A'; return '৳' + Number(p).toLocaleString('en-IN'); }

export default function AdminStats() {
  const [overview, setOverview] = useState(null);
  const [zeroResults, setZeroResults] = useState([]);
  const [shopCtr, setShopCtr] = useState([]);
  const [top, setTop] = useState(null);

  useEffect(() => {
    api.get('/admin/stats/overview').then((r) => setOverview(r.data)).catch(() => {});
    api.get('/admin/stats/zero-results', { params: { limit: 20 } }).then((r) => setZeroResults(r.data || [])).catch(() => {});
    api.get('/admin/stats/shop-ctr', { params: { limit: 20 } }).then((r) => setShopCtr(r.data || [])).catch(() => {});
    api.get('/admin/stats/top-products', { params: { limit: 8 } }).then((r) => setTop(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card icon={Users} label="DAU" value={overview?.users?.dau ?? '—'} />
        <Card icon={Users} label="MAU" value={overview?.users?.mau ?? '—'} />
        <Card icon={SearchIcon} label="Last indexer URLs" value={(overview?.lastIndexerRun?.urlsScraped ?? '—').toLocaleString?.() ?? '—'} />
        <Card icon={TrendingUp} label="Last inserted" value={(overview?.lastIndexerRun?.productsInserted ?? '—').toLocaleString?.() ?? '—'} />
      </section>

      <section>
        <h2 className="font-serif text-lg font-semibold mb-3">Zero-result searches · last 7 days</h2>
        {zeroResults.length === 0 ? (
          <p className="text-sm text-gray card-soft p-6 text-center">No zero-result searches yet.</p>
        ) : (
          <ul className="space-y-1">
            {zeroResults.map((z) => (
              <li key={z.query} className="flex items-center justify-between text-sm py-2 border-b border-line/50">
                <Link to={`/search?q=${encodeURIComponent(z.query)}`} className="hover:text-red">{z.query}</Link>
                <span className="text-xs text-gray font-mono">{z.hits} hits</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-lg font-semibold mb-3">Click-through rate by shop · last 7 days</h2>
        {shopCtr.length === 0 ? (
          <p className="text-sm text-gray card-soft p-6 text-center">No click data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-gray border-b border-line">
                <th className="py-2 pr-3">Shop</th>
                <th className="py-2 pr-3 text-right">Views</th>
                <th className="py-2 pr-3 text-right">Clicks</th>
                <th className="py-2 pr-3 text-right">CTR</th>
              </tr>
            </thead>
            <tbody>
              {shopCtr.map((s) => (
                <tr key={s.sellerSlug} className="border-b border-line/50">
                  <td className="py-2 pr-3 font-semibold">{s.sellerSlug}</td>
                  <td className="py-2 pr-3 text-right font-mono">{s.views?.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right font-mono">{s.clicks?.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right font-mono font-bold">{s.ctr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopList title="Top viewed" items={top?.topViewed || []} icon={SearchIcon} />
        <TopList title="Top clicked" items={top?.topClicked || []} icon={MousePointerClick} />
      </section>
    </div>
  );
}

function Card({ icon: Icon, label, value }) {
  return (
    <div className="card-soft p-4">
      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-gray mb-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="font-serif text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function TopList({ title, items, icon: Icon }) {
  return (
    <div>
      <h3 className="font-serif text-base font-semibold mb-2 inline-flex items-center gap-1.5">
        <Icon className="w-4 h-4" /> {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray card-soft p-6 text-center">No data yet.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2 border-b border-line/50">
              <Link to={`/product/${p.id}`} className="flex-1 min-w-0 inline-flex items-center gap-2">
                {p.imageUrl && <img src={p.imageUrl} alt="" className="w-8 h-8 object-cover rounded shrink-0" />}
                <span className="truncate text-sm">{p.name || p.id}</span>
              </Link>
              <span className="text-xs text-gray font-mono">{p.count}</span>
              {p.lowestPrice != null && <span className="text-xs font-mono">{fmt(p.lowestPrice)}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
