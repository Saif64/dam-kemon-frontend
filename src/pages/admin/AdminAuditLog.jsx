import { useEffect, useState } from 'react';
import api from '../../api/api';

export default function AdminAuditLog() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-log', { params: { limit: 200 } })
      .then((r) => setRows(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray">Loading…</p>;
  if (!rows.length) return <p className="text-sm text-gray card-soft p-6 text-center">No audit entries yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-gray border-b border-line">
            <th className="py-2 pr-3">When</th>
            <th className="py-2 pr-3">Actor</th>
            <th className="py-2 pr-3">Method</th>
            <th className="py-2 pr-3">Path</th>
            <th className="py-2 pr-3 text-right">Status</th>
            <th className="py-2 pr-3">IP hash</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line/50">
              <td className="py-2 pr-3 text-gray whitespace-nowrap">{new Date(r.ts).toLocaleString()}</td>
              <td className="py-2 pr-3 font-mono">{r.actor}</td>
              <td className="py-2 pr-3 font-mono uppercase">{r.method}</td>
              <td className="py-2 pr-3 font-mono">{r.path}</td>
              <td className={`py-2 pr-3 text-right font-mono ${r.status >= 400 ? 'text-red' : 'text-green'}`}>{r.status}</td>
              <td className="py-2 pr-3 font-mono text-gray text-[10px]">{r.ipHash}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
