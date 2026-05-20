import { useEffect, useState } from 'react';
import { adminListCatalog, adminEditProduct, adminDeleteProduct, adminMergeProducts } from '../../api/api';
import { Search as SearchIcon, Edit2, Trash2, Merge, X, Check } from 'lucide-react';

function fmt(p) { if (p == null) return 'N/A'; return '৳' + Number(p).toLocaleString('en-IN'); }

export default function AdminCatalog() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(null);
  const [mergeMode, setMergeMode] = useState(null); // {to, search}
  const [mergeHits, setMergeHits] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setBusy(true);
    adminListCatalog({ q: q || undefined, page, size: 30 })
      .then((r) => { setItems(r.data?.content || []); setTotal(r.data?.totalElements || 0); })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setBusy(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const onSearch = (e) => { e.preventDefault(); setPage(0); load(); };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await adminEditProduct(editing.id, {
        name: editing.name, category: editing.category, description: editing.description,
        imageUrl: editing.imageUrl,
        brands: editing.brands ? (Array.isArray(editing.brands) ? editing.brands : String(editing.brands).split(',').map(s => s.trim())) : [],
      });
      setEditing(null);
      load();
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!confirm('Flag this product as spam and delete? This can\'t be undone.')) return;
    setBusy(true);
    try { await adminDeleteProduct(id); load(); }
    finally { setBusy(false); }
  };

  const startMerge = (to) => { setMergeMode({ to, search: '' }); setMergeHits([]); };
  const searchForMerge = () => {
    adminListCatalog({ q: mergeMode.search, size: 10 }).then((r) => setMergeHits(r.data?.content || []));
  };
  const doMerge = async (from) => {
    setBusy(true);
    try { await adminMergeProducts(mergeMode.to.id, from.id); setMergeMode(null); setMergeHits([]); load(); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by product name…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-line rounded-xl text-sm focus:outline-none focus:border-ink"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 rounded-xl bg-ink text-cream font-semibold text-sm hover:bg-red">Search</button>
      </form>

      <div className="text-xs text-gray">{total.toLocaleString()} products · page {page + 1}</div>

      <div className="space-y-2">
        {items.map((p) => (
          <div key={p.id} className="card-soft p-3 flex items-start gap-3">
            {p.imageUrl && <img src={p.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{p.name}</div>
              <div className="text-[11px] text-gray inline-flex items-center gap-2 flex-wrap">
                <span className="font-mono uppercase tracking-wider">{p.category || 'uncategorised'}</span>
                <span>·</span>
                <span className="font-mono">{fmt(p.lowestPrice)}</span>
                <span>·</span>
                <span>{p.prices?.length || 0} sellers</span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditing({ ...p, brands: (p.brands || []).join(', ') })} className="p-1.5 rounded-full hover:bg-ink/10" title="Edit">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => startMerge(p)} className="p-1.5 rounded-full hover:bg-ink/10" title="Merge into another product">
                <Merge className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => remove(p.id)} className="p-1.5 rounded-full hover:bg-red/10 text-red" title="Flag as spam (delete)">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setPage((x) => Math.max(0, x - 1))} disabled={page === 0 || busy} className="text-sm px-3 py-1.5 rounded-full border border-line hover:border-ink disabled:opacity-50">Prev</button>
          <button onClick={() => setPage((x) => x + 1)} disabled={items.length < 30 || busy} className="text-sm px-3 py-1.5 rounded-full border border-line hover:border-ink disabled:opacity-50">Next</button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-cream rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl font-semibold">Edit product</h3>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-full hover:bg-ink/10"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <EditField label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
              <EditField label="Category" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} />
              <EditField label="Image URL" value={editing.imageUrl} onChange={(v) => setEditing({ ...editing, imageUrl: v })} />
              <EditField label="Description" value={editing.description} onChange={(v) => setEditing({ ...editing, description: v })} multiline />
              <EditField label="Brands (comma-sep)" value={editing.brands} onChange={(v) => setEditing({ ...editing, brands: v })} />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-full border border-line text-sm hover:border-ink">Cancel</button>
              <button onClick={save} disabled={busy} className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-ink text-cream font-semibold text-sm hover:bg-red disabled:opacity-50">
                <Check className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {mergeMode && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setMergeMode(null)}>
          <div className="bg-cream rounded-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-xl font-semibold">Merge a duplicate into</h3>
              <button onClick={() => setMergeMode(null)} className="p-1.5 rounded-full hover:bg-ink/10"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-ink/80 mb-3"><strong>{mergeMode.to.name}</strong></p>
            <p className="text-xs text-gray mb-4">Find the duplicate. Its sellers will be appended to this product; the duplicate row will be deleted.</p>

            <div className="flex gap-2 mb-3">
              <input
                autoFocus
                type="text"
                value={mergeMode.search}
                onChange={(e) => setMergeMode({ ...mergeMode, search: e.target.value })}
                placeholder="Search by name…"
                className="flex-1 px-3 py-2 bg-white border border-line rounded-lg text-sm"
              />
              <button onClick={searchForMerge} className="px-3 py-2 rounded-lg bg-ink text-cream text-sm font-semibold">Find</button>
            </div>
            <ul className="space-y-1 max-h-72 overflow-y-auto">
              {mergeHits.filter((h) => h.id !== mergeMode.to.id).map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2 p-2 hover:bg-cream-soft rounded-lg">
                  <span className="text-sm truncate">{h.name}</span>
                  <button onClick={() => doMerge(h)} disabled={busy} className="text-xs px-2 py-1 rounded-full bg-red text-white font-semibold hover:bg-red/90 disabled:opacity-50">Merge</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function EditField({ label, value, onChange, multiline }) {
  return (
    <label className="block">
      <span className="block text-xs font-mono uppercase tracking-wider text-gray mb-1">{label}</span>
      {multiline ? (
        <textarea value={value || ''} rows={3} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 bg-white border border-line rounded-lg text-sm" />
      ) : (
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 bg-white border border-line rounded-lg text-sm" />
      )}
    </label>
  );
}
