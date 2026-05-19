import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestMagicLink } from '../api/auth';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [devToken, setDevToken] = useState(null);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await requestMagicLink(email);
      if (r.data?.ok) {
        setSent(true);
        if (r.data.token) setDevToken(r.data.token); // dev-only: server can expose token directly
      } else {
        setError(r.data?.error || 'Could not send link.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Network error. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="container-tight py-16 sm:py-24 text-center">
        <div className="max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green/15 text-green mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-3">Check your email</h1>
          <p className="text-gray text-[15px] leading-relaxed mb-6">
            We sent a sign-in link to <span className="font-semibold text-ink">{email}</span>.
            The link works for 15 minutes.
          </p>
          {devToken && (
            <div className="text-left bg-cream-soft border border-line-strong rounded-xl p-4 mb-6">
              <div className="font-mono text-[10px] uppercase tracking-wider text-gray mb-1">Dev mode</div>
              <p className="text-xs text-gray mb-2">SMTP isn't configured, so here's your link:</p>
              <Link
                to={`/auth/verify?email=${encodeURIComponent(email)}&token=${encodeURIComponent(devToken)}`}
                className="block bg-white border border-line rounded-lg px-3 py-2 text-xs font-mono text-ink break-all hover:border-ink"
              >
                /auth/verify?email={email}&amp;token={devToken.slice(0, 20)}…
              </Link>
            </div>
          )}
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-cream font-semibold text-sm hover:bg-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-tight py-10 sm:py-14 lg:py-16 max-w-md">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray hover:text-ink mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-lime/30 mb-4">
          <Mail className="w-6 h-6 text-ink" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight mb-2">
          Sign in
        </h1>
        <p className="text-gray text-[15px]">
          Enter your email — we'll send you a one-shot sign-in link. No passwords, no fuss.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card-soft p-6 sm:p-8 space-y-4">
        <label className="block">
          <span className="block text-xs font-mono uppercase tracking-wider text-gray mb-1.5">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            className="w-full bg-white border border-line rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-ink transition-colors"
          />
        </label>

        {error && (
          <div className="flex items-start gap-2 bg-red/10 border border-red/20 text-red px-3 py-2 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ink text-cream font-semibold text-sm hover:bg-red disabled:opacity-50 disabled:cursor-wait transition-colors"
        >
          {busy ? 'Sending…' : 'Email me a sign-in link'}
        </button>
      </form>
    </div>
  );
}
