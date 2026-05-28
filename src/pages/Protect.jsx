import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, Check, Truck, Loader2, Copy, ArrowRight,
  Sparkles, Search, ThumbsDown, ChevronRight,
} from 'lucide-react';
import {
  protectAssess, protectCreateOrder, protectGetOrder, protectConfirmOrder, protectDisputeOrder,
} from '../api/api';

const fmt = (p) => (p == null || p === '' ? '—' : '৳' + Number(p).toLocaleString('en-IN'));

const PAYMENTS = [
  { v: 'cod', label: 'Cash on Delivery (COD)' },
  { v: 'bkash_personal', label: 'bKash — Send Money (personal number)' },
  { v: 'bkash_merchant', label: 'bKash — Payment (merchant)' },
  { v: 'nagad_personal', label: 'Nagad — Send Money (personal number)' },
  { v: 'nagad_merchant', label: 'Nagad — Payment (merchant)' },
  { v: 'card', label: 'Card' },
  { v: 'advance_bank', label: 'Advance bank transfer' },
  { v: 'advance_full', label: 'Full advance payment' },
  { v: 'store_pickup', label: 'Store pickup' },
  { v: 'other', label: 'Other' },
];

const SELLER_TYPES = [
  { v: 'fb_page', label: 'Facebook page / group seller' },
  { v: 'instagram', label: 'Instagram seller' },
  { v: 'marketplace', label: 'Marketplace listing (Daraz/Bikroy…)' },
  { v: 'known_shop', label: 'Known online shop / website' },
  { v: 'unknown', label: 'Not sure' },
];

const CATEGORIES = [
  { v: '', label: 'Auto-detect' },
  { v: 'smartphone', label: 'Smartphone' }, { v: 'laptop', label: 'Laptop' },
  { v: 'tablet', label: 'Tablet' }, { v: 'headphone', label: 'Headphone / Audio' },
  { v: 'smartwatch', label: 'Smartwatch' }, { v: 'camera', label: 'Camera' },
  { v: 'accessory', label: 'Accessory' }, { v: 'tv', label: 'TV' },
  { v: 'appliance', label: 'Home appliance' }, { v: 'ac', label: 'Air conditioner' },
  { v: 'refrigerator', label: 'Refrigerator' }, { v: 'gaming', label: 'Gaming' },
  { v: 'fashion', label: 'Fashion' }, { v: 'beauty', label: 'Beauty' },
  { v: 'jewellery', label: 'Jewellery' }, { v: 'book', label: 'Book' },
  { v: 'grocery', label: 'Grocery' }, { v: 'furniture', label: 'Furniture' },
  { v: 'power', label: 'Power backup (IPS/UPS)' }, { v: 'health', label: 'Health' },
];

const levelStyle = (lvl) => ({
  low: { text: 'text-green', bg: 'bg-green-soft', ring: 'border-green', label: 'Low risk' },
  medium: { text: 'text-ink', bg: 'bg-yellow-soft', ring: 'border-yellow', label: 'Medium risk' },
  high: { text: 'text-red', bg: 'bg-red-soft', ring: 'border-red', label: 'High risk' },
}[lvl] || { text: 'text-ink', bg: 'bg-cream-soft', ring: 'border-line', label: '—' });

const sevIcon = (s) => (s === 'good' ? Check : s === 'warn' ? AlertTriangle : ShieldAlert);
const sevColor = (s) => (s === 'good' ? 'text-green' : s === 'warn' ? 'text-yellow' : 'text-red');

export default function Protect() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    sellerName: '', shopSlug: '', productId: '', itemName: '', amount: '', paymentMethod: 'cod',
    sellerType: 'fb_page', category: '',
  });
  const [verdict, setVerdict] = useState(null);
  const [checking, setChecking] = useState(false);
  const [created, setCreated] = useState(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Prefill from a product page's "Buy Protected" CTA.
  useEffect(() => {
    const next = {};
    ['productId', 'shopSlug', 'itemName', 'amount', 'sellerName', 'category'].forEach((k) => {
      const v = params.get(k); if (v) next[k] = v;
    });
    // Arriving from a product page means it's a known shop, not a random page.
    if (params.get('shopSlug')) next.sellerType = 'known_shop';
    if (Object.keys(next).length) setForm((f) => ({ ...f, ...next }));
  }, [params]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const check = async (e) => {
    e?.preventDefault();
    setChecking(true); setCreated(null);
    try {
      const res = await protectAssess({
        sellerName: form.sellerName || undefined,
        shopSlug: form.shopSlug || undefined,
        productId: form.productId || undefined,
        itemName: form.itemName || undefined,
        amount: form.amount === '' ? undefined : Number(form.amount),
        paymentMethod: form.paymentMethod,
        sellerType: form.sellerType || undefined,
        category: form.category || undefined,
      });
      setVerdict(res.data);
    } catch { setVerdict(null); }
    finally { setChecking(false); }
  };

  const openOrder = async () => {
    if (!form.itemName && !form.productId) { return; }
    setCreating(true);
    try {
      const res = await protectCreateOrder({
        sellerName: form.sellerName || undefined,
        shopSlug: form.shopSlug || undefined,
        productId: form.productId || undefined,
        itemName: form.itemName || undefined,
        amount: form.amount === '' ? undefined : Number(form.amount),
        paymentMethod: form.paymentMethod,
        sellerType: form.sellerType || undefined,
        category: form.category || undefined,
      });
      if (res.data?.order) setCreated(res.data.order);
    } catch { /* noop */ }
    finally { setCreating(false); }
  };

  const canOpen = (form.itemName || form.productId) && (form.sellerName || form.shopSlug);

  return (
    <div className="container-tight py-6 sm:py-10 max-w-3xl">
      {/* Hero */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="tag-bar mb-2 mx-auto inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-green" /> Damkemon Protect
        </div>
        <h1 className="font-serif font-semibold text-[clamp(1.8rem,5vw,3rem)] leading-[1.05] tracking-tight">
          Buy from anyone.<br /><em className="text-red">Without the fear.</em>
        </h1>
        <p className="text-gray text-sm sm:text-base mt-3 max-w-xl mx-auto">
          Before you pay — even a Facebook page — tell us who, how much, and how you're paying.
          We'll flag the scam risk and protect your order.
        </p>
      </div>

      {/* Risk check form */}
      <form onSubmit={check} className="card-elev p-4 sm:p-6 mb-4">
        <h2 className="font-serif text-lg font-bold text-ink mb-3 inline-flex items-center gap-2">
          <Search className="w-4 h-4" /> Check before you pay
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Who are you buying from?">
            <input value={form.sellerName} onChange={(e) => set('sellerName', e.target.value)}
              placeholder="Seller / FB page name" className="dk-input" />
          </Field>
          <Field label="What are you buying?">
            <input value={form.itemName} onChange={(e) => set('itemName', e.target.value)}
              placeholder="e.g. iPhone 15 128GB" className="dk-input" />
          </Field>
          <Field label="Price (৳)">
            <input type="number" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)}
              placeholder="e.g. 95000" className="dk-input font-mono" />
          </Field>
          <Field label="How will you pay?">
            <select value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)} className="dk-input">
              {PAYMENTS.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="What kind of seller?">
            <select value={form.sellerType} onChange={(e) => set('sellerType', e.target.value)} className="dk-input">
              {SELLER_TYPES.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Category (optional)">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className="dk-input">
              {CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
            </select>
          </Field>
        </div>
        <button type="submit" disabled={checking} className="btn-primary mt-4 w-full sm:w-auto disabled:opacity-50">
          {checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : <><ShieldCheck className="w-4 h-4" /> Check the risk</>}
        </button>
      </form>

      {/* Verdict */}
      {verdict && <Verdict verdict={verdict} onOpen={openOrder} canOpen={canOpen} creating={creating} created={created} />}

      {/* Created order */}
      {created && <CreatedCard order={created} copied={copied} onCopy={() => {
        navigator.clipboard?.writeText(created.protectionCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
      }} />}

      {/* Track / resolve */}
      <TrackPanel />

      <style>{`.dk-input{width:100%;background:var(--color-surface);border:1px solid var(--color-line);border-radius:1rem;padding:0.6rem 0.85rem;font-size:0.9rem;color:var(--color-ink);outline:none}.dk-input:focus{border-color:rgba(21,19,26,0.4)}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Verdict({ verdict, onOpen, canOpen, creating, created }) {
  const s = levelStyle(verdict.riskLevel);
  const safe = 100 - (verdict.riskScore ?? 0);
  return (
    <div className="card-elev overflow-hidden mb-4 animate-slide-down">
      <div className={`flex items-center gap-4 p-4 sm:p-5 border-b border-line ${s.bg}`}>
        <div className={`shrink-0 w-16 h-16 rounded-2xl bg-surface border-2 ${s.ring} flex flex-col items-center justify-center`}>
          <span className={`font-serif text-2xl font-bold italic leading-none ${s.text}`}>{verdict.riskScore}</span>
          <span className="text-[8px] font-mono uppercase text-gray">risk</span>
        </div>
        <div className="min-w-0">
          <div className={`font-serif text-xl font-bold ${s.text} inline-flex items-center gap-1.5`}>
            {verdict.riskLevel === 'low' ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            {s.label}
          </div>
          <p className="text-ink/80 text-sm mt-0.5">{verdict.recommendation}</p>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {verdict.flags?.length > 0 && (
          <div className="space-y-1.5">
            {verdict.flags.map((f, i) => {
              const Icon = sevIcon(f.severity);
              return (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${sevColor(f.severity)}`} />
                  <span className="text-ink/85">{f.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-2xl bg-cream-soft p-3.5">
          <div className="text-[11px] uppercase tracking-wider font-mono text-gray mb-2">Safety checklist</div>
          <ul className="space-y-1.5">
            {verdict.checklist?.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-ink/85">
                <Check className="w-3.5 h-3.5 mt-0.5 text-green shrink-0" /> {c}
              </li>
            ))}
          </ul>
        </div>

        {verdict.categoryTips?.length > 0 && (
          <div className="rounded-2xl bg-yellow-soft/60 p-3.5">
            <div className="text-[11px] uppercase tracking-wider font-mono text-ink/60 mb-2">For this category</div>
            <ul className="space-y-1.5">
              {verdict.categoryTips.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-ink/85">
                  <Sparkles className="w-3.5 h-3.5 mt-0.5 text-yellow shrink-0" /> {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {verdict.saferAlternatives?.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider font-mono text-gray mb-2">Safer options for the same product</div>
            <div className="space-y-1.5">
              {verdict.saferAlternatives.map((a, i) => (
                <Link key={i} to={`/product/${a.productId}`}
                  className="flex items-center justify-between gap-2 bg-white border border-line rounded-2xl px-3 py-2 hover:border-line-strong transition-colors">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4 text-green" />
                    <span className="font-semibold text-ink">{a.siteName}</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-green-soft text-green">{a.trustScore}/100</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-ink">{fmt(a.price)} <ChevronRight className="w-4 h-4 text-gray" /></span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {verdict.saferShops?.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider font-mono text-gray mb-2">Trusted shops that sell this category</div>
            <div className="space-y-1.5">
              {verdict.saferShops.map((s, i) => (
                <a key={i} href={s.baseUrl || '#'} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 bg-white border border-line rounded-2xl px-3 py-2 hover:border-line-strong transition-colors">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4 text-green" />
                    <span className="font-semibold text-ink">{s.shopName}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-green-soft text-green">{s.trustScore}/100</span>
                    <ArrowRight className="w-4 h-4 text-gray" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {!created && (
          <button onClick={onOpen} disabled={!canOpen || creating}
            className="btn-accent w-full disabled:opacity-50"
            title={canOpen ? 'Open a protected order' : 'Add who you\'re buying from and what you\'re buying'}>
            {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening…</> : <><Sparkles className="w-4 h-4" /> Open a Protected Order</>}
          </button>
        )}
      </div>
    </div>
  );
}

function CreatedCard({ order, copied, onCopy }) {
  return (
    <div className="card-elev p-5 sm:p-6 mb-4 text-center animate-slide-down border-green/30">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-green-soft text-green mb-2">
        <ShieldCheck className="w-6 h-6" />
      </div>
      <h3 className="font-serif text-xl font-bold text-ink">You're protected</h3>
      <p className="text-gray text-sm mb-3">Keep this code. When your order arrives, come back to confirm — or open a dispute if something's wrong.</p>
      <button onClick={onCopy} className="inline-flex items-center gap-2 font-mono text-2xl font-bold tracking-wider bg-ink text-cream px-5 py-3 rounded-2xl hover:bg-red transition-colors">
        {order.protectionCode} {copied ? <Check className="w-5 h-5 text-lime" /> : <Copy className="w-4 h-4 opacity-70" />}
      </button>
      <p className="text-[11px] text-gray mt-3">Track or resolve it anytime below using this code.</p>
    </div>
  );
}

function TrackPanel() {
  const [code, setCode] = useState('');
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState('');

  const load = async (e) => {
    e?.preventDefault();
    if (!code.trim()) return;
    setBusy(true); setErr(null); setOrder(null);
    try {
      const res = await protectGetOrder(code.trim());
      setOrder(res.data);
    } catch { setErr('No protected order found for that code.'); }
    finally { setBusy(false); }
  };

  const act = async (kind) => {
    if (!order) return;
    setBusy(true);
    try {
      const res = kind === 'confirm'
        ? await protectConfirmOrder(order.protectionCode)
        : await protectDisputeOrder(order.protectionCode, reason || 'Issue with the order');
      setOrder(res.data); setDisputeOpen(false); setReason('');
    } catch { /* noop */ } finally { setBusy(false); }
  };

  const st = order?.status;
  const stStyle = st === 'confirmed' ? 'text-green bg-green-soft'
    : st === 'disputed' ? 'text-red bg-red-soft' : 'text-ink bg-yellow-soft';

  return (
    <div className="card-soft p-4 sm:p-5">
      <h2 className="font-serif text-lg font-bold text-ink mb-1 inline-flex items-center gap-2"><Truck className="w-4 h-4" /> Track or resolve an order</h2>
      <p className="text-gray text-xs mb-3">Enter your protection code (e.g. DK-XXXXXX).</p>
      <form onSubmit={load} className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="DK-XXXXXX"
          className="flex-1 bg-white border border-line rounded-2xl px-3.5 py-2.5 text-sm font-mono uppercase outline-none focus:border-ink/40" />
        <button type="submit" disabled={busy} className="btn-ghost shrink-0">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Track'}</button>
      </form>
      {err && <p className="text-red text-sm mt-2">{err}</p>}

      {order && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="font-semibold text-ink">{order.itemName || 'Protected order'}</div>
            <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${stStyle}`}>{st}</span>
          </div>
          <div className="text-[13px] text-gray space-y-0.5 mb-3">
            {order.sellerName && <div>Seller: <span className="text-ink">{order.sellerName}</span></div>}
            {order.amount != null && <div>Amount: <span className="text-ink font-mono">{fmt(order.amount)}</span></div>}
            <div>Risk at purchase: <span className="text-ink">{order.riskScore}/100 · {order.riskLevel}</span></div>
          </div>

          {st === 'open' && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => act('confirm')} disabled={busy} className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-full bg-green text-white hover:bg-green/90 disabled:opacity-50">
                <Check className="w-4 h-4" /> I received it
              </button>
              <button onClick={() => setDisputeOpen((o) => !o)} className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-full bg-cream text-ink border border-line-strong hover:bg-red hover:text-cream hover:border-red">
                <ThumbsDown className="w-4 h-4" /> Something's wrong
              </button>
            </div>
          )}
          {st === 'confirmed' && <p className="text-green text-sm inline-flex items-center gap-1.5"><Check className="w-4 h-4" /> Confirmed received. Thanks!</p>}
          {st === 'disputed' && <p className="text-red text-sm inline-flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Dispute recorded — this affects the seller's trust score.</p>}

          {disputeOpen && st === 'open' && (
            <div className="mt-3 space-y-2">
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                placeholder="What went wrong? (didn't arrive, fake product, seller unresponsive…)"
                className="w-full bg-white border border-line rounded-2xl px-3 py-2 text-sm outline-none focus:border-ink/40 resize-none" />
              <button onClick={() => act('dispute')} disabled={busy} className="btn-primary !bg-red w-full disabled:opacity-50">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit dispute'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
