import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  saathiMe, saathiSubmitVerification,
  saathiListProducts, saathiAttachProduct, saathiDetachProduct,
  saathiLiveAssist, saathiRecentQueries, saathiStats,
  saathiConnectMessenger, saathiDisconnectMessenger, saathiTestBot,
} from '../api/auth';
import { searchProducts } from '../api/api';
import {
  Radio, ShieldCheck, Store, Search, X, Plus, Copy, MessageSquare, Activity,
  TrendingDown, TrendingUp, Equal, AlertTriangle, Check, Power, Settings,
  ArrowRight, Sparkles, Zap, ExternalLink, Bot,
} from 'lucide-react';

function fmt(p) {
  if (p == null || Number.isNaN(p)) return '—';
  return '৳' + Number(p).toLocaleString('en-IN');
}

/**
 * Saathi seller's control room.
 *
 * <p>Reimagined from the old tabbed config screen. Layout is a single
 * scrolling canvas where the Live Assist tool is permanently visible —
 * it's the killer feature and it earns its real estate. The Messenger
 * bot, products, badge, and activity stream all live in cards beside or
 * below the main canvas so a seller can tell at a glance:
 * <ul>
 *   <li>Is my bot replying right now?</li>
 *   <li>What did the last customer ask me?</li>
 *   <li>What's left to set up?</li>
 *   <li>What's the market price for X — quote in 2 seconds.</li>
 * </ul>
 */
export default function SaathiDashboard() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [acc, setAcc] = useState(null);
  const [stats, setStats] = useState(null);
  const [productCount, setProductCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProducts, setShowProducts] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [showTestBot, setShowTestBot] = useState(false);
  const [showVerify, setShowVerify] = useState(false);

  const reloadAcc = () => saathiMe().then((r) => setAcc(r.data)).catch(() => {});
  const reloadStats = () => saathiStats().then((r) => setStats(r.data)).catch(() => {});
  const reloadProductCount = () =>
    saathiListProducts().then((r) => setProductCount(Array.isArray(r.data) ? r.data.length : 0)).catch(() => {});

  useEffect(() => { if (ready && !user) navigate('/sign-in'); }, [ready, user, navigate]);

  useEffect(() => {
    if (!user) return;
    saathiMe()
      .then((r) => setAcc(r.data))
      // 404 → no Saathi account yet → send straight to the signup form,
      // not the marketing page. Was redirecting to /saathi (landing),
      // which made the journey opaque ("where do I sign up?").
      .catch((e) => { if (e.response?.status === 404) navigate('/saathi/signup', { replace: true }); })
      .finally(() => setLoading(false));
    reloadStats();
    reloadProductCount();
  }, [user, navigate]);

  if (loading) return <div className="container-tight py-16 text-center text-gray text-sm">Loading…</div>;
  if (!acc) return null;

  const trialDays = acc.trialUntil ? Math.max(0, Math.ceil((new Date(acc.trialUntil) - Date.now()) / 86400000)) : 0;
  const verified = acc.verificationStatus === 'verified';
  const botConnected = !!acc.messengerConnectedAt;
  const hasProducts = (productCount ?? 0) > 0;

  const stepsDone = [verified, botConnected, hasProducts].filter(Boolean).length;
  const stepsTotal = 3;
  const setupComplete = stepsDone === stepsTotal;

  return (
    <div className="container-tight py-5 sm:py-8 max-w-6xl">
      {/* ─── Header strip ─── */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-ink text-cream flex items-center justify-center font-serif italic text-lg shrink-0">
            {(acc.displayName || '?')[0]}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-xl sm:text-2xl font-bold italic text-ink leading-none truncate">{acc.displayName}</h1>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Link to={`/p/${acc.slug}`} className="text-[11px] text-gray font-mono hover:text-ink">
                damkemon.com/p/{acc.slug} <ExternalLink className="inline w-2.5 h-2.5" />
              </Link>
              {verified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-2.5 h-2.5" /> Verified
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          {acc.paidUntil ? (
            <p className="text-[11px] text-gray font-mono">Paid through {new Date(acc.paidUntil).toLocaleDateString()}</p>
          ) : trialDays > 0 ? (
            <p className="text-[11px] font-mono text-ink"><b>{trialDays}</b> trial days left</p>
          ) : (
            <Link to="/saathi#pricing" className="text-[11px] font-mono text-red font-semibold underline">Trial ended — upgrade</Link>
          )}
        </div>
      </div>

      {/* ─── Setup checklist (only while incomplete) ─── */}
      {!setupComplete && (
        <div className="card-elev p-4 sm:p-5 mb-5 bg-gradient-to-br from-yellow-soft/60 to-cream-soft border-yellow/40">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold italic text-ink mb-0.5">
                {stepsDone === 0 ? 'Set up your shop' : `${stepsDone} of ${stepsTotal} steps done`}
              </h2>
              <p className="text-xs text-ink/65">Finish these to unlock the verified badge and start auto-replying on Messenger.</p>
            </div>
            <div className="inline-flex gap-1">
              {[...Array(stepsTotal)].map((_, i) => (
                <span key={i} className={`w-6 h-1.5 rounded-full ${i < stepsDone ? 'bg-green' : 'bg-ink/10'}`} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
            <SetupStep done={verified} title="Get verified"
                       blurb={acc.verificationStatus === 'pending' ? 'Submitted — review in 48h.' : 'Submit NID / Trade License.'}
                       action={() => setShowVerify(true)} actionLabel={acc.verificationStatus === 'pending' ? 'Submitted' : 'Start'} />
            <SetupStep done={botConnected} title="Connect your FB Page"
                       blurb={botConnected ? `@${acc.facebookPageName || acc.facebookPageId}` : 'Bot needs this to reply on your behalf.'}
                       action={() => setShowConnect(true)} actionLabel={botConnected ? 'Reconnect' : 'Connect'} />
            <SetupStep done={hasProducts} title="List products"
                       blurb={hasProducts ? `${productCount} product${productCount === 1 ? '' : 's'} listed.` : 'Add the SKUs you sell so the bot can quote your prices.'}
                       action={() => setShowProducts(true)} actionLabel={hasProducts ? 'Manage' : 'Add'} />
          </div>
        </div>
      )}

      {/* ─── Two-column main area ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Live Assist canvas — the hero, takes 2/3 width on desktop */}
        <div className="lg:col-span-2 space-y-4">
          <LiveAssistCanvas />
          <StatsBar stats={stats} productCount={productCount} />
        </div>

        {/* Right column: bot + activity */}
        <div className="space-y-4">
          <BotStatusCard
            acc={acc}
            onConnect={() => setShowConnect(true)}
            onTest={() => setShowTestBot(true)}
            onDisconnect={async () => {
              if (!confirm('Disconnect the bot? Your Page will stop auto-replying.')) return;
              try { await saathiDisconnectMessenger(); reloadAcc(); }
              catch { /* noop */ }
            }}
          />
          <ActivityRail />
        </div>
      </div>

      {/* ─── Bottom row: management cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
        <ManageCard icon={Store} title="My products" subtitle={`${productCount ?? '…'} listed`}
                    onClick={() => setShowProducts(true)} />
        <BadgeCard slug={acc.slug} verified={verified} />
        <ManageCard icon={Settings} title="Public profile"
                    subtitle={`/p/${acc.slug}`}
                    onClick={() => window.open(`/p/${acc.slug}`, '_blank')} icon2={ExternalLink} />
      </div>

      {/* ─── Modals ─── */}
      {showProducts && <ProductsModal onClose={() => { setShowProducts(false); reloadProductCount(); reloadStats(); }} />}
      {showConnect  && <ConnectFbModal acc={acc} onClose={() => setShowConnect(false)} onConnected={() => { setShowConnect(false); reloadAcc(); }} />}
      {showTestBot  && <TestBotModal acc={acc} onClose={() => setShowTestBot(false)} />}
      {showVerify   && <VerifyModal acc={acc} onClose={() => setShowVerify(false)} onSubmitted={(updated) => { setAcc(updated); setShowVerify(false); }} />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Setup checklist row
function SetupStep({ done, title, blurb, action, actionLabel }) {
  return (
    <div className={`p-3 rounded-2xl border ${done ? 'bg-green/10 border-green/25' : 'bg-white border-line'} flex flex-col`}>
      <div className="flex items-center gap-1.5 mb-1">
        {done
          ? <span className="w-4 h-4 rounded-full bg-green text-white inline-flex items-center justify-center"><Check className="w-3 h-3" /></span>
          : <span className="w-4 h-4 rounded-full bg-ink/10" />}
        <span className="text-[12px] font-semibold text-ink">{title}</span>
      </div>
      <p className="text-[11px] text-ink/65 mb-2 flex-1">{blurb}</p>
      {!done && (
        <button onClick={action} className="text-[11px] font-mono font-semibold text-red hover:text-ink self-start inline-flex items-center gap-1">
          {actionLabel} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Live Assist canvas (was the "Live assist" tab)
function LiveAssistCanvas() {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const lookup = async (e) => {
    e?.preventDefault();
    if (q.trim().length < 2) return;
    setBusy(true); setResult(null);
    try { const r = await saathiLiveAssist(q.trim()); setResult(r.data); }
    catch (err) {
      const body = err.response?.data;
      if (err.response?.status === 402) setResult({ error: 'trial_expired', message: body?.message });
      else if (err.response?.status === 429) setResult({ error: 'quota_exceeded', used: body?.used, limit: body?.limit, tier: body?.tier });
      else if (err.response?.status === 403) setResult({ error: 'suspended', note: body?.note });
      else setResult({ error: 'unknown' });
    } finally { setBusy(false); }
  };

  const prices = (result?.match?.prices || []).slice().sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  const lowest = prices[0]?.price;
  const yours = result?.yourListing?.listedPrice;
  const diff = yours != null && lowest != null ? yours - lowest : null;
  const replyText = result?.match ? buildReply(result, lowest) : null;

  return (
    <div className="card-elev p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-4 h-4 text-red" />
        <h2 className="font-serif text-lg sm:text-xl font-bold italic text-ink">Live price assist</h2>
      </div>
      <p className="text-[12px] text-ink/60 mb-3">
        Type a product, get your price vs the cheapest competitor + a copy-paste reply. Pin this tab during FB Live.
      </p>

      <form onSubmit={lookup} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray pointer-events-none" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="iPhone 15 Pro Max, Walton AC 1.5 ton…"
                 className="w-full pl-10 pr-3 py-3 bg-surface border border-line-strong rounded-2xl text-sm focus:outline-none focus:border-ink text-ink placeholder-gray-soft" />
        </div>
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50 whitespace-nowrap">
          {busy ? 'Looking…' : 'Quote'}
        </button>
      </form>

      {!result ? (
        <div className="bg-cream-soft/60 rounded-2xl p-6 text-center">
          <Sparkles className="w-7 h-7 text-ink/25 mx-auto mb-2" />
          <p className="text-sm text-ink/55">Ready when you are.</p>
        </div>
      ) : result.error === 'trial_expired' ? (
        <ErrorPanel icon={AlertTriangle} title="Trial ended" body={result.message || 'Upgrade to keep using live-assist.'}>
          <Link to="/saathi#pricing" className="btn-primary text-sm">Upgrade</Link>
        </ErrorPanel>
      ) : result.error === 'quota_exceeded' ? (
        <ErrorPanel icon={AlertTriangle} title="Daily quota reached" body={`Used ${result.used} of ${result.limit} on the ${result.tier} tier today.`}>
          <Link to="/saathi#pricing" className="btn-primary text-sm">Upgrade to Pro</Link>
        </ErrorPanel>
      ) : result.error === 'suspended' ? (
        <ErrorPanel icon={AlertTriangle} title="Account suspended" body={result.note || 'Contact support to restore access.'} />
      ) : result.error ? (
        <ErrorPanel icon={AlertTriangle} title="Lookup failed" body="Try a simpler search term." />
      ) : !result.match ? (
        <div className="bg-cream-soft/60 rounded-2xl p-5 text-center">
          <p className="text-sm text-ink/55">No catalog match. Try a brand + model number.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-serif text-base font-semibold text-ink line-clamp-1">{result.match.name}</h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-cream-soft rounded-2xl p-3">
              <div className="font-mono text-[9px] uppercase tracking-wider text-ink/55 mb-1">Your price</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-ink">{fmt(yours)}</div>
              {yours == null && <div className="text-[10px] text-ink/55 mt-1">Not listed yet</div>}
            </div>
            <div className="bg-green/10 rounded-2xl p-3 border border-green/20">
              <div className="font-mono text-[9px] uppercase tracking-wider text-green mb-1">Cheapest in market</div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-green">{fmt(lowest)}</div>
              {prices[0]?.siteName && <div className="text-[10px] text-ink/55 mt-1">{prices[0].siteName}</div>}
            </div>
          </div>

          {diff != null && (
            <div className="text-center">
              {diff > 100 ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-soft text-red text-xs font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" /> {fmt(diff)} above market — undercut to win
                </span>
              ) : diff < -100 ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-lime/40 text-green text-xs font-semibold">
                  <TrendingDown className="w-3.5 h-3.5" /> {fmt(-diff)} below market — lean into it
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cream-soft text-ink text-xs font-semibold">
                  <Equal className="w-3.5 h-3.5" /> At market price
                </span>
              )}
            </div>
          )}

          <div className="bg-ink text-cream rounded-2xl p-3">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-cream/60">Copy to Messenger / Live</span>
              <button onClick={() => navigator.clipboard?.writeText(replyText)} className="text-[10px] font-mono text-yellow hover:text-cream inline-flex items-center gap-0.5">
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <pre className="font-sans text-[12.5px] whitespace-pre-wrap leading-relaxed">{replyText}</pre>
          </div>

          {prices.length > 1 && (
            <details className="text-[12px]">
              <summary className="cursor-pointer text-[11px] font-mono uppercase tracking-wider text-ink/55 hover:text-ink">
                See all {prices.length} sellers
              </summary>
              <div className="mt-2 space-y-1">
                {prices.slice(0, 8).map((sp, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-line/30 last:border-0">
                    <span>{sp.siteName}</span>
                    <span className={`font-mono font-bold ${i === 0 ? 'text-green' : 'text-ink'}`}>{fmt(sp.price)}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function ErrorPanel({ icon: Icon, title, body, children }) {
  return (
    <div className="bg-yellow-soft border border-yellow rounded-2xl p-5 text-center">
      <Icon className="w-7 h-7 text-ink mx-auto mb-2" />
      <h4 className="font-serif text-base font-bold text-ink mb-1">{title}</h4>
      <p className="text-[12px] text-ink/65 mb-3">{body}</p>
      {children}
    </div>
  );
}

function buildReply(result, lowest) {
  const name = result.match.name;
  const yours = result.yourListing?.listedPrice;
  if (yours != null && lowest != null) {
    const d = yours - lowest;
    if (Math.abs(d) <= 100) return `${name} — আমাদের price ৳${Number(yours).toLocaleString('en-IN')}. Market rate এ আছি. In stock, COD available.`;
    if (d < 0) return `${name} — আমাদের price ৳${Number(yours).toLocaleString('en-IN')}. Market এর চেয়ে ৳${Number(-d).toLocaleString('en-IN')} কম. In stock, COD available.`;
    return `${name} — আমাদের price ৳${Number(yours).toLocaleString('en-IN')}. Bulk এ negotiable.`;
  }
  if (lowest != null) return `${name} — current market lowest ৳${Number(lowest).toLocaleString('en-IN')}. আমাদের stock check করে confirm করি.`;
  return `${name} — stock check করে দাম জানাচ্ছি.`;
}

// ────────────────────────────────────────────────────────────
// Bot status card
function BotStatusCard({ acc, onConnect, onTest, onDisconnect }) {
  const connected = !!acc.messengerConnectedAt;
  return (
    <div className={`card-soft p-4 ${connected ? 'border-green/30 bg-green/5' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Bot className={`w-4 h-4 ${connected ? 'text-green' : 'text-ink/40'}`} />
        <h3 className="font-serif text-base font-bold italic text-ink">Messenger bot</h3>
        {connected ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green text-white text-[9px] font-mono font-bold uppercase tracking-wider ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-ink/10 text-ink/55 text-[9px] font-mono font-bold uppercase tracking-wider ml-auto">
            Offline
          </span>
        )}
      </div>

      {connected ? (
        <>
          <p className="text-[11px] text-ink/70 mb-3">
            Replying as <b className="text-ink">@{acc.facebookPageName || acc.facebookPageId}</b>.
            Auto-answers customer DMs with your price + market context.
          </p>
          <div className="flex gap-2">
            <button onClick={onTest} className="btn-primary text-xs flex-1">
              <Zap className="w-3 h-3" /> Test reply
            </button>
            <button onClick={onDisconnect} className="text-[11px] font-mono text-ink/60 hover:text-red inline-flex items-center gap-1">
              <Power className="w-3 h-3" /> Disconnect
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[11px] text-ink/70 mb-3">
            Connect your FB Page and the bot will reply to "দাম কত?" DMs within seconds — even while you sleep.
          </p>
          <button onClick={onConnect} className="btn-primary text-xs w-full">
            <MessageSquare className="w-3 h-3" /> Connect Facebook Page
          </button>
          <button onClick={onTest} className="text-[11px] font-mono text-ink/60 hover:text-ink mt-2 inline-flex items-center gap-1">
            <Zap className="w-3 h-3" /> Try a test reply first →
          </button>
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Activity rail
function ActivityRail() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    saathiRecentQueries(8)
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card-soft p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-ink/60" />
        <h3 className="font-serif text-base font-bold italic text-ink">Recent activity</h3>
      </div>
      {loading ? (
        <p className="text-[11px] text-ink/50">Loading…</p>
      ) : !items.length ? (
        <p className="text-[11px] text-ink/55">
          No queries yet. When customers DM you or you use Live assist, activity shows up here.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((q) => {
            const Icon = q.source === 'messenger' ? MessageSquare
                       : q.source === 'live_assist' ? Radio
                       : q.source === 'test' ? Zap
                       : Search;
            const tone = q.source === 'messenger' ? 'text-blue'
                       : q.source === 'live_assist' ? 'text-red'
                       : 'text-ink/55';
            return (
              <li key={q.id} className="flex items-start gap-2 py-1 border-b border-line/30 last:border-0">
                <Icon className={`w-3.5 h-3.5 ${tone} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-ink truncate">{q.rawQuery}</p>
                  <p className="text-[10px] font-mono text-ink/50">
                    {q.matchedProductId ? '✓ matched' : 'no match'} · {q.ts ? timeAgo(q.ts) : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function timeAgo(ts) {
  const d = new Date(ts).getTime();
  const sec = Math.floor((Date.now() - d) / 1000);
  if (sec < 60)   return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

// ────────────────────────────────────────────────────────────
// Stats bar (inline KPIs)
function StatsBar({ stats, productCount }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      <Kpi label="Today" value={stats.queries24h} sub={`of ${stats.quotaLimit}`} />
      <Kpi label="7-day" value={stats.queries7d} />
      <Kpi label="Match rate" value={`${Math.round((stats.matchRate || 0) * 100)}%`} />
      <Kpi label="Products" value={productCount ?? stats.totalProducts ?? 0} />
    </div>
  );
}

function Kpi({ label, value, sub }) {
  return (
    <div className="card-soft p-3 text-center">
      <div className="text-[9px] font-mono uppercase tracking-wider text-ink/55 mb-1">{label}</div>
      <div className="font-serif text-lg sm:text-xl font-bold italic text-ink leading-none">{value}</div>
      {sub && <div className="text-[9px] font-mono text-ink/45 mt-1">{sub}</div>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Bottom-row management cards
function ManageCard({ icon: Icon, title, subtitle, onClick, icon2: Icon2 = ArrowRight }) {
  return (
    <button onClick={onClick} className="card-soft p-4 text-left hover:border-ink transition-colors flex items-center gap-3 group">
      <Icon className="w-5 h-5 text-ink/60 group-hover:text-ink shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-serif text-sm font-bold text-ink">{title}</p>
        <p className="text-[11px] text-ink/55 truncate">{subtitle}</p>
      </div>
      <Icon2 className="w-4 h-4 text-ink/40 group-hover:text-ink shrink-0" />
    </button>
  );
}

function BadgeCard({ slug, verified }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const badgeUrl = `${origin}/api/saathi/badge/${slug}.svg`;
  const embed = `<a href="${origin}/p/${slug}" target="_blank"><img src="${badgeUrl}" alt="Verified by Damkemon" width="220" height="64"/></a>`;
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(embed); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="card-soft p-4 flex items-center gap-3">
      <ShieldCheck className={`w-5 h-5 shrink-0 ${verified ? 'text-green' : 'text-ink/40'}`} />
      <div className="flex-1 min-w-0">
        <p className="font-serif text-sm font-bold text-ink">Verified badge</p>
        <p className="text-[11px] text-ink/55">{verified ? 'Embed on your FB cover' : 'Unlock after verification'}</p>
      </div>
      {verified && (
        <button onClick={copy} className="text-[11px] font-mono font-semibold text-ink hover:text-red inline-flex items-center gap-1 shrink-0">
          {copied ? <><Check className="w-3 h-3 text-green" /> Copied</> : <><Copy className="w-3 h-3" /> Copy embed</>}
        </button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Connect FB modal
function ConnectFbModal({ acc, onClose, onConnected }) {
  const [pageId, setPageId] = useState(acc.facebookPageId || '');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const r = await saathiConnectMessenger(pageId.trim(), token.trim());
      if (r.data?.connected) onConnected();
      else setErr('Connection failed. Double-check the Page ID and token.');
    } catch (e2) {
      const body = e2.response?.data;
      setErr(body?.message || body?.error || 'Facebook rejected the token. Generate a new one and try again.');
    } finally { setBusy(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <h3 className="font-serif text-xl font-bold italic text-ink mb-1">Connect your Facebook Page</h3>
      <p className="text-[11px] text-ink/60 mb-4">
        We use a Page Access Token to send replies on your behalf. We never read your messages — only the ones forwarded by Meta's Messenger webhook.
      </p>

      <ol className="text-[12px] text-ink/70 mb-4 space-y-1.5 list-decimal pl-5">
        <li>Open <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="underline text-ink">Graph API Explorer</a>.</li>
        <li>Pick your Page from "User or Page" dropdown → it shows your Page Access Token.</li>
        <li>Find your Page ID at the top (numeric).</li>
        <li>Paste both below.</li>
      </ol>

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider font-mono text-ink/60 mb-1">Facebook Page ID</span>
          <input value={pageId} onChange={(e) => setPageId(e.target.value)} placeholder="e.g. 102345678901234"
                 className="w-full bg-white border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider font-mono text-ink/60 mb-1">Page Access Token</span>
          <input value={token} onChange={(e) => setToken(e.target.value)} type="password" placeholder="EAAB…"
                 className="w-full bg-white border border-line rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-ink" />
        </label>

        <div className="bg-cream-soft border border-line rounded-xl p-3">
          <p className="text-[11px] text-ink/65"><b>Also needed:</b> install our webhook in Meta Business Suite → Settings → Webhooks. URL: <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api/saathi/messenger/webhook?slug={acc.slug}</code>, verify token <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded">damkemon-verify</code>. Subscribe to <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded">messages</code> events.</p>
        </div>

        {err && <p className="text-red text-[12px]">{err}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={busy || !pageId.trim() || !token.trim()} className="btn-primary flex-1 disabled:opacity-50">
            {busy ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ────────────────────────────────────────────────────────────
// Test bot modal
function TestBotModal({ acc, onClose }) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const run = async (e) => {
    e?.preventDefault();
    if (q.trim().length < 2) return;
    setBusy(true); setResult(null);
    try { const r = await saathiTestBot(q.trim()); setResult(r.data); }
    catch { setResult({ error: true }); }
    finally { setBusy(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <h3 className="font-serif text-xl font-bold italic text-ink mb-1">Test your bot's reply</h3>
      <p className="text-[11px] text-ink/60 mb-4">
        Type a question a customer might send. We'll show you what the bot would reply with — no message gets sent on Messenger.
      </p>

      <form onSubmit={run} className="flex gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)}
               placeholder="iPhone 15 এর দাম কত?"
               className="flex-1 bg-white border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        <button type="submit" disabled={busy} className="btn-primary text-sm">
          {busy ? '…' : 'Reply'}
        </button>
      </form>

      {result && !result.error && (
        <div className="space-y-3">
          <div className="bg-blue-soft border border-blue/20 rounded-2xl p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-blue mb-1">Customer asks</p>
            <p className="text-sm text-ink">{result.query}</p>
          </div>
          <div className="bg-ink text-cream rounded-2xl p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-cream/60 mb-1">Bot replies</p>
            <pre className="font-sans text-[13px] whitespace-pre-wrap leading-relaxed">{result.reply}</pre>
          </div>
          <div className="text-[11px] text-ink/55 text-center">
            {result.matched ? <>Matched <b className="text-ink">{result.matchName}</b>{result.yourPrice != null && <> · your price {fmt(result.yourPrice)}</>}{result.marketLowest != null && <> · market {fmt(result.marketLowest)}</>}</> : 'No catalog match — bot used the polite-fallback template.'}
          </div>
          {!result.connected && (
            <div className="text-[11px] text-ink/55 text-center bg-yellow-soft/60 border border-yellow rounded-xl p-2">
              Reply will only be <b>sent</b> after you connect your Facebook Page.
            </div>
          )}
        </div>
      )}
      {result?.error && <p className="text-red text-sm">Couldn't generate a reply. Try a different query.</p>}

      <button onClick={onClose} className="btn-ghost w-full mt-4">Done</button>
    </ModalShell>
  );
}

// ────────────────────────────────────────────────────────────
// Verification modal
function VerifyModal({ acc, onClose, onSubmitted }) {
  const [nid, setNid] = useState('');
  const [tl, setTl] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const r = await saathiSubmitVerification({ nid, tradeLicense: tl }); onSubmitted(r.data); }
    catch { /* noop */ } finally { setBusy(false); }
  };
  return (
    <ModalShell onClose={onClose}>
      <h3 className="font-serif text-xl font-bold italic text-ink mb-1">Verify your shop</h3>
      <p className="text-[11px] text-ink/60 mb-4">
        Submit your NID or Trade License (one is enough). Our team reviews within 48 hours.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider font-mono text-ink/60 mb-1">NID number</span>
          <input value={nid} onChange={(e) => setNid(e.target.value)} placeholder="13 digit NID"
                 className="w-full bg-white border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider font-mono text-ink/60 mb-1">Trade License (optional)</span>
          <input value={tl} onChange={(e) => setTl(e.target.value)} placeholder="Speeds up review"
                 className="w-full bg-white border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </label>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={busy || (!nid && !tl)} className="btn-primary flex-1 disabled:opacity-50">
            {busy ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ────────────────────────────────────────────────────────────
// Products modal (full list + add)
function ProductsModal({ onClose }) {
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
    <ModalShell onClose={onClose} wide>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-xl font-bold italic text-ink">My products</h3>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-xs"><Plus className="w-3 h-3" /> Add</button>
      </div>

      {loading ? (
        <p className="text-ink/55 text-sm">Loading…</p>
      ) : !items.length ? (
        <div className="bg-cream-soft rounded-2xl p-6 text-center">
          <Store className="w-8 h-8 text-ink/20 mx-auto mb-2" />
          <p className="text-sm text-ink/65">No products listed yet.</p>
          <p className="text-[12px] text-ink/55 mt-1">Saathi shows market price next to yours during Live + DMs.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
          {items.map((row) => {
            const p = row.product;
            const lowest = p?.lowestPrice;
            const diff = row.listedPrice && lowest ? row.listedPrice - lowest : null;
            return (
              <li key={row.id} className="card-soft p-3 flex items-start gap-3">
                {p?.imageUrl && <img src={p.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${p?.id || row.productId}`} className="block">
                    <span className="font-serif text-[13px] font-semibold line-clamp-2 hover:text-red transition-colors">{p?.name || 'Removed product'}</span>
                  </Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] font-mono"><b>You:</b> {fmt(row.listedPrice)}</span>
                    <span className="text-[10px] font-mono text-ink/55">market {fmt(lowest)}</span>
                    {diff != null && diff > 0 && <span className="text-[9px] font-mono text-red">↑ {fmt(diff)}</span>}
                    {diff != null && diff < 0 && <span className="text-[9px] font-mono text-green">↓ {fmt(-diff)}</span>}
                  </div>
                </div>
                <button onClick={() => remove(row.productId)} className="shrink-0 p-1 rounded-full hover:bg-red/10 hover:text-red text-ink/55"><X className="w-3.5 h-3.5" /></button>
              </li>
            );
          })}
        </ul>
      )}

      {showAdd && <AddProductInner onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); reload(); }} />}
    </ModalShell>
  );
}

function AddProductInner({ onClose, onAdded }) {
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
    <ModalShell onClose={onClose}>
      <h3 className="font-serif text-lg font-bold italic text-ink mb-3">Add a product</h3>
      <input value={q} onChange={(e) => { setQ(e.target.value); setPicked(null); }}
             placeholder="Search the Damkemon catalog…"
             className="w-full bg-white border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink mb-3" />

      {!picked && results.length > 0 && (
        <ul className="space-y-1 mb-3 max-h-56 overflow-y-auto">
          {results.map((p) => (
            <li key={p.id}>
              <button onClick={() => { setPicked(p); setPrice(p.lowestPrice ? Math.round(p.lowestPrice) : ''); }} className="w-full text-left p-2 rounded-xl hover:bg-cream-soft flex items-center gap-2">
                {p.imageUrl && <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold line-clamp-1">{p.name}</p>
                  <p className="text-[10px] text-ink/55 font-mono">market: {fmt(p.lowestPrice)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {picked && (
        <div className="bg-cream-soft rounded-xl p-2 mb-3 flex items-center gap-2">
          {picked.imageUrl && <img src={picked.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold line-clamp-1">{picked.name}</p>
            <p className="text-[10px] text-ink/55 font-mono">market: {fmt(picked.lowestPrice)}</p>
          </div>
          <button onClick={() => setPicked(null)} className="text-ink/50 hover:text-ink"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <label className="block mb-3">
        <span className="block text-[10px] uppercase tracking-wider font-mono text-ink/60 mb-1">Your price (BDT)</span>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
               placeholder="e.g. 52500"
               className="w-full bg-white border border-line rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink" />
      </label>

      <div className="flex gap-2">
        <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
        <button onClick={submit} disabled={!picked || busy} className="btn-primary flex-1 disabled:opacity-50">
          {busy ? 'Adding…' : 'Add'}
        </button>
      </div>
    </ModalShell>
  );
}

// ────────────────────────────────────────────────────────────
// Shared modal shell
function ModalShell({ children, onClose, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm p-3 sm:p-6" onClick={onClose}>
      <div className={`bg-cream rounded-3xl shadow-[var(--shadow-lift)] border border-line-strong w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-5 sm:p-6 max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
