import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { recentSearches, searchLatency } from '../../api/api';
import { Search as SearchIcon, Zap } from 'lucide-react';

function relative(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const ms = Date.now() - d.getTime();
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return d.toLocaleString();
}

export default function AdminSearchLog() {
  const [rows, setRows] = useState([]);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([recentSearches(200), searchLatency()])
      .then(([r, l]) => { setRows(Array.isArray(r.data) ? r.data : []); setLatency(l.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray">Loading…</p>;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <LatCard label="Samples (24h)" value={latency?.samples ?? '—'} />
        <LatCard label="p50" value={latency?.p50 != null ? `${latency.p50} ms` : '—'} />
        <LatCard label="p95" value={latency?.p95 != null ? `${latency.p95} ms` : '—'} />
        <LatCard label="p99" value={latency?.p99 != null ? `${latency.p99} ms` : '—'} />
      </section>

      <section>
        <h2 className="font-serif text-lg font-semibold mb-3 inline-flex items-center gap-2">
          <SearchIcon className="w-4 h-4" /> Recent searches
        </h2>
        {rows.length === 0 ? (
          <p className="text-sm text-gray card-soft p-6 text-center">No searches recorded yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-gray border-b border-line">
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Query</th>
                <th className="py-2 pr-3 text-right">Results</th>
                <th className="py-2 pr-3 text-right">Latency</th>
                <th className="py-2 pr-3">Actor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-line/50">
                  <td className="py-2 pr-3 text-gray whitespace-nowrap">{relative(r.ts)}</td>
                  <td className="py-2 pr-3">
                    <Link to={`/search?q=${encodeURIComponent(r.query)}`} className="hover:text-red">{r.query}</Link>
                  </td>
                  <td className={`py-2 pr-3 text-right font-mono ${r.resultCount === 0 ? 'text-red' : ''}`}>{r.resultCount ?? '—'}</td>
                  <td className="py-2 pr-3 text-right font-mono">{r.latencyMs != null ? `${r.latencyMs}ms` : '—'}</td>
                  <td className="py-2 pr-3 text-gray text-[10px]">{r.userId ? `user:${r.userId.slice(0, 6)}…` : r.anonId ? `anon:${r.anonId.slice(0, 6)}…` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function LatCard({ label, value }) {
  return (
    <div className="card-soft p-4">
      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-gray mb-1">
        <Zap className="w-3 h-3" /> {label}
      </div>
      <div className="font-serif text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
