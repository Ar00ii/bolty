'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const data = await api.get<User>('/auth/me');
      // Legacy uploads stored a relative `/api/v1/...` avatar path; normalise
      // to an absolute URL so `<img src>` resolves against the backend origin.
      setUser({ ...data, avatarUrl: resolveAssetUrl(data.avatarUrl) });
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {});
    } finally {
      setUser(null);
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
