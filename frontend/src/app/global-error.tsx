'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-4xl font-light text-red-500 mb-4">Critical Error</h1>
            <p className="text-gray-300 mb-8">
              The application encountered a critical error and cannot continue. Please refresh the page.
            </p>
            <button
              onClick={() => reset()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-light py-2 px-8 rounded transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
