import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User } from '../lib/types';
import { api } from '../lib/api';
import { ensureDemoAccount, DEMO_EMAIL, DEMO_PASSWORD } from '../lib/seed';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  openDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  clearUser: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const restored = await api.restoreSession();
        if (mounted) setUser(restored);
      } finally {
        if (mounted) setInitializing(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: u } = await api.login({ email, password });
    setUser(u);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { user: u } = await api.register({ name, email, password });
    setUser(u);
  }, []);

  const openDemo = useCallback(async () => {
    await ensureDemoAccount();
    const { user: u } = await api.login({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const clearUser = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({ user, initializing, signIn, signUp, openDemo, signOut, clearUser }),
    [user, initializing, signIn, signUp, openDemo, signOut, clearUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
