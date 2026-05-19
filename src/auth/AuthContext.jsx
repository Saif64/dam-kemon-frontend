import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAuthToken, setAuthToken, getMe, signOut as apiSignOut } from '../api/auth';

const AuthContext = createContext({
  user: null,
  ready: false,
  signIn: () => {},
  signOut: () => {},
  refresh: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) { setUser(null); setReady(true); return; }
    try {
      const r = await getMe();
      setUser(r.data);
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const signIn = useCallback((token, profile) => {
    setAuthToken(token);
    setUser(profile);
  }, []);

  const signOut = useCallback(() => {
    apiSignOut().catch(() => {});
    setAuthToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
