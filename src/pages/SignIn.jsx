import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { passwordLogin } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, AlertCircle, KeyRound } from 'lucide-react';

/**
 * Sole sign-in path: owner enters username + password, server returns a
 * 30-day JWT, we land them on /admin (or /account for non-admins, though
 * in practice the owner is the only user).
 */
export default function SignIn() {
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
    <div className="container-tight py-10 sm:py-14 lg:py-16 max-w-md">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray hover:text-ink mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-lime/30 mb-4">
          <KeyRound className="w-6 h-6 text-ink" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight mb-2">
          Sign in
        </h1>
        <p className="text-gray text-[15px]">Operator sign-in for the Dam Kemon admin console.</p>
      </div>

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
    </div>
  );
}
