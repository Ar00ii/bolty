'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

import { api } from '@/lib/api/client';
import { resolveAssetUrl } from '@/lib/utils/asset-url';

export interface User {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  githubLogin: string | null;
  walletAddress: string | null;
  role: string;
  profileSetup: boolean;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  email: string | null;
  twoFactorEnabled: boolean;
  reputationPoints?: number;
  userTag?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  refresh: async () => {},
  logout: async () => {},
});

// ── Optimistic hint cache ───────────────────────────────────────────────────
// When switching accounts, React state briefly becomes `null` between logout
// and the next `/auth/me` response. Previously this caused the avatar to
// visually "disappear" across the app. We persist the last good user snapshot
// in localStorage and seed state from it on mount + keep it across refresh so
// the avatar stays rendered through the transition. The cookie-authenticated
// `/auth/me` call still gets the final word.
const HINT_KEY = 'bolty:auth-hint';

function readHint(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(HINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.id !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeHint(user: User | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) window.localStorage.setItem(HINT_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(HINT_KEY);
  } catch {
    /* storage quota / privacy mode — ignore */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Track whether an explicit logout happened so we DON'T reuse the hint if
  // the user explicitly signed out.
  const loggedOutRef = useRef(false);

  // Seed from the hint after mount to avoid SSR hydration mismatch. The hint
  // makes the avatar stay rendered during account-switch transitions instead
  // of briefly flashing to the gradient+initial placeholder.
  useEffect(() => {
    const hint = readHint();
    if (hint) setUser(hint);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const data = await api.get<User>('/auth/me');
      const normalised = { ...data, avatarUrl: resolveAssetUrl(data.avatarUrl) };
      setUser(normalised);
      writeHint(normalised);
      loggedOutRef.current = false;
    } catch {
      // Unauthenticated. Only clear state if we're not mid-logout (already
      // handled below) and don't have a valid hint to keep optimistic.
      if (loggedOutRef.current) {
        setUser(null);
        writeHint(null);
      } else {
        // No valid session at all — clear hint to avoid showing stale user.
        setUser(null);
        writeHint(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    loggedOutRef.current = true;
    try {
      await api.post('/auth/logout', {});
    } finally {
      setUser(null);
      writeHint(null);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        refresh: fetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
