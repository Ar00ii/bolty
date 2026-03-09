import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { AuthProvider } from '@/lib/auth/AuthProvider';

export const metadata: Metadata = {
  title: 'Bolty | The Monad Ecosystem Platform',
  description: 'The memecoin platform built for the Monad ecosystem. Trade, chat, and build.',
  keywords: ['bolty', 'monad', 'memecoin', 'web3', 'ethereum', 'crypto', 'defi'],
  openGraph: {
    title: 'Bolty | The Monad Ecosystem Platform',
    description: 'The memecoin platform built for the Monad ecosystem.',
    type: 'website',
  },
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-terminal-bg text-terminal-text min-h-screen grid-bg">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pt-16">
              {children}
            </main>
            <footer className="border-t border-zinc-800/60 py-4 px-6 text-center text-zinc-500 text-xs">
              <span className="text-monad-400 font-semibold">Bolty</span> — Built for the Monad ecosystem
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
