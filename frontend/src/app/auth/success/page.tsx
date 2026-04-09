'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function AuthSuccessPage() {
  const router = useRouter();
  const { refresh, user, isLoading } = useAuth();

  useEffect(() => {
    refresh().then(() => {
      // handled by the second useEffect once user is loaded
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!user.profileSetup) {
      router.push('/profile/setup');
    } else {
      router.push('/');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-neon-400 font-mono text-xl animate-pulse mb-2">
          Authentication successful
        </div>
        <div className="text-terminal-muted font-mono text-sm">Redirecting...</div>
      </div>
    </div>
  );
}
