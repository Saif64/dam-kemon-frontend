import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  saathiMe, saathiUpdate, saathiSubmitVerification,
  saathiListProducts, saathiAttachProduct, saathiDetachProduct,
  saathiLiveAssist, saathiRecentQueries,
} from '../api/auth';
import { searchProducts } from '../api/api';
import {
  Radio, ShieldCheck, Store, Search, X, Plus, Copy, MessageSquare, Activity,
  TrendingDown, TrendingUp, Equal, AlertTriangle, Check,
} from 'lucide-react';

function fmt(p) {
  if (p == null || Number.isNaN(p)) return '—';
  return '৳' + Number(p).toLocaleString('en-IN');
}

/**
 * Authenticated dashboard for an active Saathi seller. Three tabs:
 *   1. Live — the FB-Live sidebar (the killer feature).
 *   2. Products — manage which catalog SKUs they sell at what price.
 *   3. Embed — copy the verified badge + Messenger webhook URL.
 *   4. Activity — recent customer queries.
 */
export default function SaathiDashboard() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [acc, setAcc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('live');

  useEffect(() => {
    if (ready && !user) navigate('/sign-in');
  }, [ready, user, navigate]);

  useEffect(() => {
    if (!user) return;
    saathiMe()
      .then((r) => setAcc(r.data))
      .catch((e) => {
        if (e.response?.status === 404) navigate('/saathi');
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) return <div className="container-tight py-16 text-center text-gray text-sm">Loading…</div>;
  if (!acc) return null;

  const trialDays = acc.trialUntil ? Math.max(0, Math.ceil((new Date(acc.trialUntil) - Date.now()) / 86400000)) : 0;

  return (
    <div className="container-tight py-6 sm:py-10 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <Store className="w-5 h-5 text-ink" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold italic text-ink">{acc.displayName}</h1>
            {acc.verificationStatus === 'verified' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            ) : acc.verificationStatus === 'pending' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow text-ink text-[10px] font-mono font-bold uppercase tracking-wider">
                Pending review
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                {acc.verificationStatus}
              </span>
            )}
          </div>
          <p className="text-xs text-gray">damkemon.com/p/{acc.slug}</p>
        </div>
        <div className="text-right">
          {acc.paidUntil ? (
            <p className="text-xs text-gray font-mono">Paid through {new Date(acc.paidUntil).toLocaleDateString()}</p>
          ) : trialDays > 0 ? (
            <p className="text-xs font-mono text-ink"><b>{trialDays}</b> trial days left</p>
          ) : (
            <p className="text-xs font-mono text-red">Trial ended — upgrade to keep replying</p>
          )}
        </div>
      </div>

      {acc.verificationStatus !== 'verified' && <VerificationStrip acc={acc} onUpdated={setAcc} />}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-line mb-5 overflow-x-auto no-scrollbar">
        <TabBtn active={tab === 'live'} onClick={() => setTab('live')} icon={Radio}>Live assist</TabBtn>
        <TabBtn active={tab === 'products'} onClick={() => setTab('products')} icon={Store}>My products</TabBtn>
        <TabBtn active={tab === 'embed'} onClick={() => setTab('embed')} icon={Copy}>Badge & Bot</TabBtn>
        <TabBtn active={tab === 'activity'} onClick={() => setTab('activity')} icon={Activity}>Activity</TabBtn>
      </div>

      {tab === 'live' && <LiveAssistTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'embed' && <EmbedTab acc={acc} />}
      {tab === 'activity' && <ActivityTab />}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${active ? 'text-ink border-ink' : 'text-gray border-transparent hover:text-ink'}`}>
      <Icon className="w-4 h-4" /> {children}
    </button>
  );
}

function VerificationStrip({ acc, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [nid, setNid] = useState('');
  const [tl, setTl] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await saathiSubmitVerification({ nid, tradeLicense: tl });
      onUpdated(r.data);
      setOpen(false);
    } catch { /* noop */ } finally { setBusy(false); }
  };

  return (
    <div className="card-soft bg-yellow-soft border-yellow p-4 mb-5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-ink shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">Get verified to unlock the trust badge</p>
          <p className="text-xs text-gray mt-0.5">Submit your NID + Trade License (one is enough). Our team reviews within 48 hours. Verified shops convert 2x better.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary text-xs whitespace-nowrap">Start</button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-4 bg-white rounded-2xl border border-line p-4 space-y-3">
          <label className="block">
            <span className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1">NID number</span>
            <input value={nid} onChange={(e) => setNid(e.target.value)} placeholder="13 digit NID" className="w-full bg-cream-soft border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink" />
          </label>
          <label className="block">
            <span className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1">Trade license number</span>
            <input value={tl} onChange={(e) => setTl(e.target.value)} placeholder="Optional but speeds up review" className="w-full bg-cream-soft border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink" />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={busy || (!nid && !tl)} className="btn-primary flex-1 disabled:opacity-50">{busy ? 'Submitting…' : 'Submit for review'}</button>
          </div>
        </form>
      )}
    </div>
  );
}

function LiveAssistTab() {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const lookup = async (e) => {
    e?.preventDefault();
    if (q.trim().length < 2) return;
    setBusy(true);
    try {
      const r = await saathiLiveAssist(q.trim());
      setResult(r.data);
    } catch { setResult({ error: true }); } finally { setBusy(false); }
  };

  const prices = (result?.match?.prices || []).slice().sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  const lowest = prices[0]?.price;
  const yours = result?.yourListing?.listedPrice;
  const diff = yours != null && lowest != null ? yours - lowest : null;

  const replyText = result?.match ? buildReply(result, lowest) : null;

  return (
    <div>
      <form onSubmit={lookup} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="iPhone 15 Pro Max — start typing during your Live…"
                 className="w-full pl-10 pr-3 py-3 bg-white border border-line-strong rounded-2xl text-sm focus:outline-none focus:border-ink" />
        </div>
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50 whitespace-nowrap">
          {busy ? 'Looking…' : 'Quote price'}
        </button>
      </form>

      {!result ? (
        <div className="card-soft p-8 text-center">
          <Radio className="w-10 h-10 text-ink/20 mx-auto mb-3" />
          <p className="text-gray text-sm">Type a product. We'll show you the market in one second.</p>
          <p className="text-gray text-xs mt-1">Tip: pin this tab during FB Live for instant pricing.</p>
        </div>
      ) : result.error ? (
        <div className="card-soft p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red mx-auto mb-2" />
          <p className="text-sm text-gray">Lookup failed. Try a simpler search term.</p>
        </div>
      ) : !result.match ? (
        <div className="card-soft p-6 text-center">
          <p className="text-sm text-gray">No catalog match. Try a brand + model number.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Hero — your price vs market */}
          <div className="card-elev p-5">
            <h3 className="font-serif text-lg font-semibold text-ink mb-2 line-clamp-1">{result.match.name}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-cream-soft rounded-2xl p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-gray mb-1">Your price</div>
                <div className="font-mono text-2xl font-bold text-ink">{fmt(yours)}</div>
                {yours == null && <div className="text-[11px] text-gray mt-1">Not listed yet — add it in <b>My products</b></div>}
              </div>
              <div className="bg-green/10 rounded-2xl p-3 border border-green/20">
                <div className="font-mono text-[10px] uppercase tracking-wider text-green mb-1">Cheapest in market</div>
                <div className="font-mono text-2xl font-bold text-green">{fmt(lowest)}</div>
                {prices[0]?.siteName && <div className="text-[11px] text-gray mt-1">on {prices[0].siteName}</div>}
              </div>
            </div>

            {diff != null && (
              <div className="mt-3 text-center">
                {diff > 100 ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-soft text-red text-xs font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" /> You're {fmt(diff)} above market — undercut to win
                  </span>
                ) : diff < -100 ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-lime/40 text-green text-xs font-semibold">
                    <TrendingDown className="w-3.5 h-3.5" /> You're {fmt(-diff)} cheapest — lean into it
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cream-soft text-ink text-xs font-semibold">
                    <Equal className="w-3.5 h-3.5" /> You're at market price
                  </span>
                )}
              </div>
            )}

            {/* Copy-paste reply */}
            <div className="mt-4 bg-ink text-cream rounded-2xl p-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cream/60">Copy to Messenger / Live chat</span>
                <button onClick={() => navigator.clipboard?.writeText(replyText)} className="text-[10px] font-mono text-yellow hover:text-cream inline-flex items-center gap-0.5">
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <pre className="font-sans text-[13px] whitespace-pre-wrap leading-relaxed">{replyText}</pre>
            </div>
          </div>

          {/* All sellers table */}
          {prices.length > 1 && (
            <div className="card-soft p-4">
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray mb-2">{prices.length} sellers</p>
              <div className="space-y-1.5">
                {prices.slice(0, 6).map((sp, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-line/40 last:border-0">
                    <span className="text-sm">{sp.siteName}</span>
                    <span className={`font-mono font-bold text-sm ${i === 0 ? 'text-green' : 'text-ink'}`}>{fmt(sp.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function buildReply(result, lowest) {
  const name = result.match.name;
  const yours = result.yourListing?.listedPrice;
  if (yours != null && lowest != null) {
    const diff = yours - lowest;
    if (diff <= 100 && diff >= -100) return `${name} — আমাদের price ৳${Number(yours).toLocaleString('en-IN')}. Market rate এ আছি. In stock, COD available.`;
    if (diff < -100) return `${name} — আমাদের price ৳${Number(yours).toLocaleString('en-IN')}. Market এর চেয়ে ৳${Number(-diff).toLocaleString('en-IN')} কম. In stock, COD available.`;
    return `${name} — আমাদের price ৳${Number(yours).toLocaleString('en-IN')}. Bulk এ negotiable.`;
  }
  if (lowest != null) return `${name} — current market lowest ৳${Number(lowest).toLocaleString('en-IN')}. আমাদের stock check করে confirm করি.`;
  return `${name} — stock check করে দাম জানাচ্ছি.`;
}

function ProductsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const reload = () => saathiListProducts()
    .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
    .catch(() => setItems([]))
    .finally(() => setLoading(false));

  useEffect(() => { reload(); }, []);

  const remove = async (id) => {
    try { await saathiDetachProduct(id); setItems((xs) => xs.filter((x) => x.productId !== id)); }
    catch { /* noop */ }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray font-mono">{items.length} listed</p>
        <button onClick={() => setShowAdd(true)} className="btn-ghost text-sm"><Plus className="w-4 h-4" /> Add product</button>
      </div>

      {loading ? (
        <p className="text-gray text-sm">Loading…</p>
      ) : !items.length ? (
        <div className="card-soft p-8 text-center">
          <Store className="w-10 h-10 text-ink/20 mx-auto mb-3" />
          <p className="text-gray text-sm">No products listed yet.</p>
          <p className="text-gray text-xs mt-1">Add the SKUs you sell — Saathi shows market price next to yours during live & DMs.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((row) => {
            const p = row.product;
            const lowest = p?.lowestPrice;
            const diff = row.listedPrice && lowest ? row.listedPrice - lowest : null;
            return (
              <li key={row.id} className="card-soft p-3 flex items-start gap-3">
                {p?.imageUrl && <img src={p.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${p?.id || row.productId}`} className="block">
                    <span className="font-serif text-sm font-semibold line-clamp-2 hover:text-red transition-colors">{p?.name || 'Removed product'}</span>
                  </Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[12px] font-mono"><b>You:</b> {fmt(row.listedPrice)}</span>
                    <span className="text-[11px] font-mono text-gray">vs market {fmt(lowest)}</span>
                    {diff != null && diff > 0 && (
                      <span className="text-[10px] font-mono text-red">↑ {fmt(diff)} above</span>
                    )}
                    {diff != null && diff < 0 && (
                      <span className="text-[10px] font-mono text-green">↓ {fmt(-diff)} below</span>
                    )}
                  </div>
                </div>
                <button onClick={() => remove(row.productId)} className="shrink-0 p-1.5 rounded-full hover:bg-red/10 hover:text-red text-gray"><X className="w-4 h-4" /></button>
              </li>
            );
          })}
        </ul>
      )}

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); reload(); }} />}
    </div>
  );
}

function AddProductModal({ onClose, onAdded }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const debounce = useRef(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (q.trim().length < 2) { setResults([]); return; }
    debounce.current = setTimeout(() => {
      searchProducts(q.trim()).then((r) => setResults((r.data?.products || []).slice(0, 6))).catch(() => setResults([]));
    }, 250);
  }, [q]);

  const submit = async () => {
    if (!picked) return;
    setBusy(true);
    try {
      const lp = price === '' ? null : Number(price);
      await saathiAttachProduct(picked.id, Number.isFinite(lp) ? lp : null, null);
      onAdded();
    } catch { /* noop */ } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm p-3 sm:p-6" onClick={onClose}>
      <div className="bg-cream rounded-3xl shadow-[var(--shadow-lift)] border border-line-strong w-full max-w-md p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-xl font-bold italic text-ink mb-3">Add a product you sell</h3>

        <input value={q} onChange={(e) => { setQ(e.target.value); setPicked(null); }}
               placeholder="Search the Damkemon catalog…"
               className="w-full bg-white border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink mb-3" />

        {!picked && results.length > 0 && (
          <ul className="space-y-1 mb-3 max-h-64 overflow-y-auto">
            {results.map((p) => (
              <li key={p.id}>
                <button onClick={() => { setPicked(p); setPrice(p.lowestPrice ? Math.round(p.lowestPrice) : ''); }} className="w-full text-left p-2 rounded-xl hover:bg-cream-soft flex items-center gap-2">
                  {p.imageUrl && <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">{p.name}</p>
                    <p className="text-[11px] text-gray font-mono">market: {fmt(p.lowestPrice)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {picked && (
          <div className="card-soft p-3 mb-3 flex items-center gap-2">
            {picked.imageUrl && <img src={picked.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold line-clamp-1">{picked.name}</p>
              <p className="text-[11px] text-gray font-mono">market: {fmt(picked.lowestPrice)}</p>
            </div>
            <button onClick={() => setPicked(null)} className="text-gray hover:text-ink"><X className="w-4 h-4" /></button>
          </div>
        )}

        <label className="block mb-3">
          <span className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1">Your selling price (BDT)</span>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                 placeholder="e.g. 52500" className="w-full bg-white border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </label>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={submit} disabled={!picked || busy} className="btn-primary flex-1 disabled:opacity-50">{busy ? 'Adding…' : 'Add to my shop'}</button>
        </div>
      </div>
    </div>
  );
}

function EmbedTab({ acc }) {
  const verified = acc.verificationStatus === 'verified';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const badgeUrl = `${origin}/api/saathi/badge/${acc.slug}.svg`;
  const profileUrl = `${origin}/p/${acc.slug}`;
  const webhookUrl = `${origin}/api/saathi/messenger/webhook?slug=${acc.slug}`;
  const embedHtml = `<a href="${profileUrl}" target="_blank" rel="noopener"><img src="${badgeUrl}" alt="Verified by Damkemon" width="220" height="64"/></a>`;

  const copy = (text) => navigator.clipboard?.writeText(text);

  return (
    <div className="space-y-5">
      <div className="card-elev p-5">
        <h3 className="font-serif text-lg font-bold text-ink mb-1 inline-flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green" /> Your verified badge
        </h3>
        <p className="text-xs text-gray mb-3">Paste this on your FB page cover description, product posts, or anywhere customers can see it.</p>
        {verified ? (
          <>
            <div className="bg-cream-soft rounded-2xl p-4 flex justify-center mb-3">
              <img src={badgeUrl} alt="Verified" width={220} height={64} />
            </div>
            <CopyBlock label="HTML embed" value={embedHtml} onCopy={() => copy(embedHtml)} />
            <CopyBlock label="Image URL" value={badgeUrl} onCopy={() => copy(badgeUrl)} />
          </>
        ) : (
          <div className="bg-yellow-soft border border-yellow rounded-2xl p-3 text-sm text-ink">
            Your badge unlocks the moment your verification is approved. Submit NID / Trade License from the banner above.
          </div>
        )}
      </div>

      <div className="card-elev p-5">
        <h3 className="font-serif text-lg font-bold text-ink mb-1 inline-flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue" /> Messenger bot setup
        </h3>
        <ol className="text-sm text-gray space-y-2 mb-3 list-decimal pl-5">
          <li>In Meta Business Suite → Settings → Webhooks → Add webhook.</li>
          <li>Paste the URL below as the callback. Use verify token <code className="font-mono bg-cream-soft px-1 rounded">damkemon-verify</code>.</li>
          <li>Subscribe to <code className="font-mono bg-cream-soft px-1 rounded">messages</code> events.</li>
          <li>Your Page will start auto-replying to price questions.</li>
        </ol>
        <CopyBlock label="Webhook URL" value={webhookUrl} onCopy={() => copy(webhookUrl)} />
      </div>

      <div className="card-soft p-4">
        <h3 className="font-serif text-base font-bold text-ink mb-1">Public storefront</h3>
        <p className="text-xs text-gray mb-2">Buyers visit this page to see your verified status, products, and how to message you.</p>
        <Link to={`/p/${acc.slug}`} className="btn-ghost text-sm">View my storefront →</Link>
      </div>
    </div>
  );
}

function CopyBlock({ label, value, onCopy }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-gray">{label}</span>
        <button onClick={() => { onCopy(); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="text-[11px] font-mono text-ink hover:text-red inline-flex items-center gap-0.5">
          {copied ? <><Check className="w-3 h-3 text-green" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="bg-cream-soft border border-line rounded-xl px-3 py-2 text-[11px] font-mono whitespace-pre-wrap break-all">{value}</pre>
    </div>
  );
}

function ActivityTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    saathiRecentQueries(50)
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray text-sm">Loading…</p>;
  if (!items.length) return (
    <div className="card-soft p-8 text-center">
      <Activity className="w-10 h-10 text-ink/20 mx-auto mb-3" />
      <p className="text-gray text-sm">No queries yet.</p>
      <p className="text-gray text-xs mt-1">When you use Live assist or your Messenger bot replies, activity shows up here.</p>
    </div>
  );

  return (
    <ul className="space-y-1">
      {items.map((q) => (
        <li key={q.id} className="flex items-center justify-between py-2 border-b border-line/50">
          <div className="flex items-center gap-2 min-w-0">
            {q.source === 'messenger' ? <MessageSquare className="w-3.5 h-3.5 text-blue shrink-0" /> :
             q.source === 'live_assist' ? <Radio className="w-3.5 h-3.5 text-red shrink-0" /> :
             <Search className="w-3.5 h-3.5 text-gray shrink-0" />}
            <span className="text-sm truncate">{q.rawQuery}</span>
          </div>
          <span className="text-[11px] text-gray font-mono ml-2 whitespace-nowrap">
            {q.matchedProductId ? '✓ matched' : '— no match'} · {q.ts ? new Date(q.ts).toLocaleString() : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}
