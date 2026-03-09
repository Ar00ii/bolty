import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { AuthProvider } from '@/lib/auth/AuthProvider';

export const metadata: Metadata = {
  title: 'Bolty | Web3 Terminal Platform',
  description: 'The memecoin platform with terminal aesthetics. Trade, chat, and build.',
  keywords: ['bolty', 'memecoin', 'web3', 'solana', 'crypto', 'terminal'],
  openGraph: {
    title: 'Bolty | Web3 Terminal Platform',
    description: 'The memecoin platform with terminal aesthetics.',
    type: 'website',
  },
  // Security: prevent indexing of private pages
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
            <footer className="border-t border-terminal-border py-4 px-6 text-center text-terminal-muted text-xs">
              <span className="text-neon-400">Bolty</span> Terminal v1.0.0 — Built with{' '}
              <span className="text-neon-400">♥</span> and strong security
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
