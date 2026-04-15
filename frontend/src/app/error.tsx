'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-red-950 to-red-900 rounded-lg border border-red-800 p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h1 className="text-2xl font-light text-red-300">Something went wrong</h1>
          </div>

          <p className="text-red-200 text-sm mb-6">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 p-4 bg-red-900/50 rounded text-xs text-red-300 font-mono overflow-auto max-h-32">
              <summary className="cursor-pointer font-light mb-2">Error details</summary>
              <pre>{error.message}</pre>
            </details>
          )}

          <button
            onClick={() => reset()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-light py-2 px-4 rounded transition"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
