import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestMagicLink, passwordLogin } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

export default function SignIn() {
  const [tab, setTab] = useState('password'); // 'password' | 'link'

  return (
    <div className="container-tight py-10 sm:py-14 lg:py-16 max-w-md">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray hover:text-ink mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="text-center mb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight mb-2">
          Sign in
        </h1>
        <p className="text-gray text-[15px]">
          {tab === 'password'
            ? 'Owner sign-in. Use the magic-link tab if you only need an account for wishlist or saved searches.'
            : 'Enter your email — we\'ll send you a one-shot sign-in link.'}
        </p>
      </div>

      <div className="flex gap-1 mb-5 bg-cream-soft rounded-full p-1 max-w-xs mx-auto">
        <TabButton active={tab === 'password'} onClick={() => setTab('password')} icon={KeyRound}>
          Password
        </TabButton>
        <TabButton active={tab === 'link'} onClick={() => setTab('link')} icon={Mail}>
          Magic link
        </TabButton>
      </div>

      {tab === 'password' ? <PasswordForm /> : <MagicLinkForm />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
        active ? 'bg-ink text-cream' : 'text-ink/60 hover:text-ink'
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {children}
    </button>
  );
}

function PasswordForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await passwordLogin(username, password);
      signIn(r.data.token, r.data.user);
      navigate(r.data.user?.role === 'admin' ? '/admin' : '/account');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not sign in. Check your username and password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card-soft p-6 sm:p-8 space-y-4">
      <label className="block">
        <span className="block text-xs font-mono uppercase tracking-wider text-gray mb-1.5">Username</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          autoFocus
          className="w-full bg-white border border-line rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-ink"
        />
      </label>
      <label className="block">
        <span className="block text-xs font-mono uppercase tracking-wider text-gray mb-1.5">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="w-full bg-white border border-line rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-ink"
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
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

function MagicLinkForm() {
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
        if (r.data.token) setDevToken(r.data.token);
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
      <div className="card-soft p-6 sm:p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green/15 text-green mb-4">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-semibold mb-2">Check your email</h2>
        <p className="text-gray text-[14px] mb-4">
          We sent a sign-in link to <span className="font-semibold text-ink">{email}</span>.
          The link works for 15 minutes.
        </p>
        {devToken && (
          <div className="text-left bg-cream-soft border border-line-strong rounded-xl p-4 mb-2">
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
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card-soft p-6 sm:p-8 space-y-4">
      <label className="block">
        <span className="block text-xs font-mono uppercase tracking-wider text-gray mb-1.5">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoFocus
          className="w-full bg-white border border-line rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-ink"
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
  );
}
