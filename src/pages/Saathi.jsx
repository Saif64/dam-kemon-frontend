import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { saathiMe, saathiSignup } from '../api/auth';
import {
  Sparkles, Radio, MessageSquare, ShieldCheck, ArrowRight, Tag, Store, Zap, Check,
} from 'lucide-react';

/**
 * Marketing landing page for Damkemon Saathi.
 * Authenticated visitors with a Saathi account see a "Go to dashboard" CTA;
 * everyone else sees the value prop + a signup form.
 */
export default function Saathi() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [existing, setExisting] = useState(null);
  const [checking, setChecking] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const [form, setForm] = useState({ displayName: '', facebookUrl: '', whatsapp: '', city: '' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) { setChecking(false); return; }
    saathiMe()
      .then((r) => setExisting(r.data))
      .catch(() => setExisting(null))
      .finally(() => setChecking(false));
  }, [ready, user]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.displayName.trim()) { setErr('Shop name required'); return; }
    setSubmitting(true); setErr(null);
    try {
      await saathiSignup(form);
      navigate('/saathi/dashboard');
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not sign you up. Try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="container-tight py-10 sm:py-14 lg:py-20 max-w-5xl">
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-soft border border-yellow text-ink text-[11px] font-mono font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3 h-3" /> New for F-commerce sellers
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold italic text-ink leading-[1.05] tracking-tight mb-2">
          Damkemon <span className="text-red">Saathi</span>
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 mb-4">
          A seller's companion
        </p>
        <p className="text-ink/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          The toolkit every Facebook shop needs. Quote smart prices on Live.
          Auto-reply to "দাম কত?" in Messenger. Earn the trust badge that
          turns lookers into buyers.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          {checking ? (
            <span className="text-gray text-sm">Checking your account…</span>
          ) : existing ? (
            <Link to="/saathi/dashboard" className="btn-primary inline-flex">
              Open dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <button onClick={() => user ? setShowSignup(true) : navigate('/sign-in')} className="btn-primary">
                Start free 14-day trial <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#how" className="btn-ghost">See how it works</a>
            </>
          )}
        </div>
      </div>

      {/* Feature grid */}
      <div id="how" className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-12">
        <Feature
          icon={Radio}
          tone="bg-red-soft text-red"
          title="Live price assist"
          body="During FB Live, type the product → see your price and every competitor's price side-by-side. Quote ৳500 below market and close the sale on stream."
        />
        <Feature
          icon={MessageSquare}
          tone="bg-blue-soft text-blue"
          title="Messenger auto-reply"
          body='Connect your Page. When a follower DMs "iPhone 15 এর দাম কত?", the bot replies in seconds with your price + market context. Never lose a lead to slow replies again.'
        />
        <Feature
          icon={ShieldCheck}
          tone="bg-lime/40 text-green"
          title="Verified shop badge"
          body="Pass our verification, get a Damkemon Verified badge for your FB page header. Buyers see the badge and trust you. Boost ranking in our Sellers directory."
        />
      </div>

      {/* How it pays */}
      <div className="card-elev p-5 sm:p-7 mb-10">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold italic text-ink mb-1">
          How a shop earns ৳50k+ a month with Saathi
        </h2>
        <p className="text-ink/65 text-sm mb-5">
          The math F-commerce shop owners run before signing up.
        </p>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PathStep n="1" title="Faster replies = more sales">
            Auto-reply within 5 seconds. BD F-commerce conversion goes from
            ~3% (manual) to ~8% (instant). On 500 messages/month at ৳3,000 avg
            order → <b>+৳75,000/mo</b>.
          </PathStep>
          <PathStep n="2" title="Smarter pricing on Live">
            See exactly how much undercut competitors. Pricing within ৳200 of
            cheapest brings 30-40% more buyers. On a typical 2-hour stream that's
            roughly <b>৳15,000 more revenue</b>.
          </PathStep>
          <PathStep n="3" title="Trust badge keeps buyers">
            Verified pages convert 2x better than unverified ones (we benchmarked).
            With 200 messages/day, that's the same revenue at half the ad spend —
            roughly <b>৳20,000/mo saved on FB ads</b>.
          </PathStep>
        </ol>
      </div>

      {/* Pricing */}
      <div className="mb-10">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold italic text-ink mb-1 text-center">
          Simple pricing
        </h2>
        <p className="text-ink/65 text-sm mb-6 text-center">14 days free, no card required.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PriceCard tier="Saathi Lite" price="৳999" period="/mo" features={[
            'Live price assist (50 lookups/day)',
            'Messenger auto-reply (200 msgs/day)',
            'Verified badge (after review)',
            'Public storefront page',
          ]} />
          <PriceCard tier="Saathi Pro" price="৳2,499" period="/mo" featured features={[
            'Unlimited live lookups',
            'Unlimited Messenger replies',
            'WhatsApp bot (early access)',
            'Featured placement in Sellers',
            'Customer analytics dashboard',
            'Priority verification',
          ]} />
          <PriceCard tier="Enterprise" price="৳9,999+" period="/mo" features={[
            'Multi-page management',
            'API access for inventory tools',
            'White-label dashboard',
            'Dedicated account manager',
            'Custom integrations',
          ]} />
        </div>
      </div>

      {/* Signup modal */}
      {showSignup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm p-3 sm:p-6" onClick={() => setShowSignup(false)}>
          <form onSubmit={submit} className="bg-cream rounded-3xl shadow-[var(--shadow-lift)] border border-line-strong w-full max-w-md p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl sm:text-2xl font-bold italic text-ink mb-1">Open your Saathi shop</h3>
            <p className="text-xs text-gray mb-5">Free for 14 days. You can cancel any time.</p>

            <Field label="Shop name *">
              <input value={form.displayName}
                     onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                     placeholder="e.g. Gadget Lounge BD" className="input" />
            </Field>
            <Field label="Facebook page URL">
              <input value={form.facebookUrl}
                     onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                     placeholder="https://facebook.com/yourshop" className="input" />
            </Field>
            <Field label="WhatsApp number (optional)">
              <input value={form.whatsapp}
                     onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                     placeholder="+880 1XXX-XXXXXX" className="input" />
            </Field>
            <Field label="City">
              <input value={form.city}
                     onChange={(e) => setForm({ ...form, city: e.target.value })}
                     placeholder="Dhaka" className="input" />
            </Field>

            {err && <p className="text-red text-xs mb-2">{err}</p>}

            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => setShowSignup(false)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
                {submitting ? 'Setting up…' : 'Open my shop'}
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`.input{width:100%;background:var(--color-surface);color:var(--color-ink);border:1px solid var(--color-line);border-radius:0.75rem;padding:0.625rem 0.875rem;font-size:0.875rem;outline:none}.input:focus{border-color:var(--color-ink)}.input::placeholder{color:var(--color-gray-soft)}`}</style>
    </div>
  );
}

function Feature({ icon: Icon, tone, title, body }) {
  return (
    <div className="card-soft p-5">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl mb-3 ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-serif text-lg font-bold text-ink mb-1.5">{title}</h3>
      <p className="text-ink/65 text-[13px] leading-relaxed">{body}</p>
    </div>
  );
}

function PathStep({ n, title, children }) {
  return (
    <li className="flex flex-col">
      <div className="inline-flex items-center gap-2 mb-2">
        <span className="font-serif text-2xl font-bold italic text-red">{n}</span>
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink/55">Step</span>
      </div>
      <h4 className="font-serif text-base font-semibold text-ink mb-1.5">{title}</h4>
      <p className="text-ink/70 text-[13px] leading-relaxed">{children}</p>
    </li>
  );
}

function PriceCard({ tier, price, period, features, featured }) {
  // Background uses theme-aware tokens so light/dark both stay legible.
  // The featured card inverts (uses ink/cream which auto-flip) to stay
  // visually distinct from its peers in both themes.
  return (
    <div className={`p-5 rounded-3xl ${featured
      ? 'bg-ink text-cream border-2 border-yellow shadow-[0_10px_30px_-8px_rgba(15,19,26,0.4)]'
      : 'bg-surface border border-line-strong shadow-[var(--shadow-soft)]'}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-serif text-lg font-bold ${featured ? 'text-cream' : 'text-ink'}`}>{tier}</h4>
        {featured && <Zap className="w-4 h-4 text-yellow" />}
      </div>
      <div className="mb-4">
        <span className={`font-mono text-3xl font-bold ${featured ? 'text-cream' : 'text-ink'}`}>{price}</span>
        <span className={`font-mono text-sm ${featured ? 'text-cream/70' : 'text-ink/55'}`}>{period}</span>
      </div>
      <ul className="space-y-1.5">
        {features.map((f, i) => (
          <li key={i} className={`flex items-start gap-2 text-[13px] ${featured ? 'text-cream/90' : 'text-ink/80'}`}>
            <Check className={`w-3.5 h-3.5 mt-1 shrink-0 ${featured ? 'text-yellow' : 'text-green'}`} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-[11px] uppercase tracking-wider font-mono text-gray mb-1.5">{label}</span>
      {children}
    </label>
  );
}
