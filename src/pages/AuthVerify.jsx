import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { verifyMagicLink } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthVerify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [status, setStatus] = useState('verifying'); // verifying | ok | error
  const [error, setError] = useState(null);

  useEffect(() => {
    const email = params.get('email');
    const token = params.get('token');
    if (!email || !token) {
      setStatus('error');
      setError('This link is incomplete. Try signing in again.');
      return;
    }
    let cancelled = false;
    verifyMagicLink(email, token)
      .then((r) => {
        if (cancelled) return;
        signIn(r.data.token, r.data.user);
        setStatus('ok');
        setTimeout(() => navigate('/account'), 800);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        setError(err.response?.data?.error || 'The link is invalid or expired.');
      });
    return () => { cancelled = true; };
  }, [params, signIn, navigate]);

  if (status === 'verifying') {
    return (
      <div className="container-tight py-24 text-center">
        <Loader2 className="w-8 h-8 text-ink animate-spin mx-auto mb-4" />
        <p className="text-gray">Verifying your sign-in link…</p>
      </div>
    );
  }
  if (status === 'ok') {
    return (
      <div className="container-tight py-24 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green/15 text-green mb-4">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h1 className="font-serif text-3xl font-semibold mb-2">Signed in</h1>
        <p className="text-gray">Taking you to your account…</p>
      </div>
    );
  }
  return (
    <div className="container-tight py-24 text-center max-w-md mx-auto">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red/15 text-red mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h1 className="font-serif text-3xl font-semibold mb-2">Sign-in failed</h1>
      <p className="text-gray mb-6">{error}</p>
      <Link
        to="/sign-in"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-cream font-semibold text-sm hover:bg-red transition-colors"
      >
        Try again
      </Link>
    </div>
  );
}
