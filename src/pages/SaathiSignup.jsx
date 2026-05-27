import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { saathiMe, saathiSignup } from '../api/auth';
import {
  Sparkles, ArrowRight, Radio, MessageSquare, ShieldCheck, Check, ArrowLeft,
} from 'lucide-react';

/**
 * Dedicated Saathi signup page at /saathi/signup.
 *
 * <p>Previously the signup form lived as a modal triggered by a button
 * on the /saathi landing page, which made the flow opaque — there was
 * no link to share, no URL to bookmark, and visitors arriving on
 * /saathi/dashboard with no account got bounced back to the landing
 * page with no obvious next step. This page is the proper entry point
 * and the route the dashboard now redirects to.
 *
 * <p>Entry contract:
 * <ol>
 *   <li>If not signed in → redirect to {@code /sign-in?next=/saathi/signup}
 *       so the user comes right back here after authenticating.</li>
 *   <li>If signed in AND already has a Saathi account → straight to
 *       the dashboard (idempotent).</li>
 *   <li>Otherwise: render the form.</li>
 * </ol>
 */
export default function SaathiSignup() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({ displayName: '', facebookUrl: '', whatsapp: '', city: 'Dhaka' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate('/sign-in?next=/saathi/signup', { replace: true });
      return;
    }
    saathiMe()
      .then((r) => {
        if (r.data) navigate('/saathi/dashboard', { replace: true });
      })
      .catch((e) => {
        if (e.response?.status !== 404) {
          // unknown error — let them try anyway
        }
      })
      .finally(() => setChecking(false));
  }, [ready, user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.displayName.trim()) { setErr('Shop name is required'); return; }
    setSubmitting(true); setErr(null);
    try {
      await saathiSignup(form);
      navigate('/saathi/dashboard');
    } catch (e2) {
      setErr(e2.response?.data?.error || 'Could not open your shop. Try again.');
    } finally { setSubmitting(false); }
  };

  if (!ready || checking) {
    return <div className="container-tight py-16 text-center text-ink/55 text-sm">Loading…</div>;
  }

  return (
    <div className="container-tight py-8 sm:py-12 max-w-3xl">
      <Link to="/saathi" className="inline-flex items-center gap-1.5 text-ink/55 hover:text-ink text-sm font-medium mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Saathi
      </Link>

      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-soft border border-yellow text-ink text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3 h-3" /> 14-day free trial
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold italic text-ink leading-tight mb-2">
          Open your <span className="text-red">Saathi</span> shop
        </h1>
        <p className="text-ink/65 text-sm sm:text-base max-w-xl mx-auto">
          Two minutes of setup, then your bot starts replying to "দাম কত?" DMs and your Live streams show real-time competitor prices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-3 card-elev p-5 sm:p-6">
          <h2 className="font-serif text-lg font-bold italic text-ink mb-1">Tell us about your shop</h2>
          <p className="text-[12px] text-ink/55 mb-5">You can edit any of this later from your dashboard.</p>

          <form onSubmit={submit} className="space-y-3">
            <Field label="Shop name *">
              <input value={form.displayName}
                     onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                     placeholder="Your shop's display name" autoFocus maxLength={60}
                     className="input-row" />
            </Field>
            <Field label="Facebook page URL">
              <input value={form.facebookUrl}
                     onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                     placeholder="https://facebook.com/yourpage"
                     className="input-row" />
            </Field>
            <Field label="WhatsApp number (optional)">
              <input value={form.whatsapp}
                     onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                     placeholder="+880 1XXX-XXXXXX"
                     className="input-row" />
            </Field>
            <Field label="City">
              <select value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="input-row">
                <option>Dhaka</option>
                <option>Chattogram</option>
                <option>Sylhet</option>
                <option>Rajshahi</option>
                <option>Khulna</option>
                <option>Barishal</option>
                <option>Rangpur</option>
                <option>Mymensingh</option>
              </select>
            </Field>

            {err && (
              <div className="bg-red-soft border border-red/20 rounded-xl px-3 py-2 text-[12px] text-red">{err}</div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={submitting || !form.displayName.trim()}
                      className="btn-primary w-full disabled:opacity-50">
                {submitting ? 'Setting up your shop…' : <>Open my shop <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="text-[10px] text-ink/50 mt-2 text-center">
                No credit card. Cancel any time during trial.
              </p>
            </div>
          </form>
        </div>

        {/* What you get */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-serif text-base font-bold italic text-ink mb-1 px-1">You'll unlock</h2>
          <Perk icon={Radio} title="Live price assist"
                blurb="Type a product during FB Live → see every competitor's price in one second." />
          <Perk icon={MessageSquare} title="Messenger auto-reply"
                blurb='Connect your Page and the bot answers "দাম কত?" DMs 24/7.' />
          <Perk icon={ShieldCheck} title="Verified shop badge"
                blurb="After identity check, embed our trust badge on your FB cover." />

          <div className="bg-cream-soft rounded-2xl p-3 border border-line mt-2">
            <p className="text-[11px] text-ink/70 leading-relaxed">
              Already have a Saathi account?{' '}
              <Link to="/saathi/dashboard" className="text-ink font-semibold underline">Go to dashboard →</Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`.input-row{width:100%;background:white;border:1px solid var(--color-line);border-radius:0.75rem;padding:0.625rem 0.875rem;font-size:0.875rem;color:var(--color-ink);outline:none}.input-row:focus{border-color:var(--color-ink)}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider font-mono text-ink/55 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Perk({ icon: Icon, title, blurb }) {
  return (
    <div className="card-soft p-3 flex items-start gap-2.5">
      <span className="w-7 h-7 rounded-xl bg-ink/5 inline-flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-ink" />
      </span>
      <div className="min-w-0">
        <p className="font-serif text-[13px] font-bold text-ink">{title}</p>
        <p className="text-[11px] text-ink/60 leading-relaxed">{blurb}</p>
      </div>
      <Check className="w-4 h-4 text-green shrink-0 ml-auto mt-0.5" />
    </div>
  );
}
