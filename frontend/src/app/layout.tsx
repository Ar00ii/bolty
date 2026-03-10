import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { MatrixRain } from '@/components/ui/MatrixRain';

export const metadata: Metadata = {
  title: 'Bolty | The Ethereum Memecoin Platform',
  description: 'The memecoin platform on Ethereum. Trade, publish repos, chat, and earn.',
  keywords: ['bolty', 'ethereum', 'memecoin', 'web3', 'crypto', 'defi', 'metamask', 'erc20'],
  openGraph: {
    title: 'Bolty | The Ethereum Memecoin Platform',
    description: 'The memecoin platform on Ethereum.',
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
          <MatrixRain />
          <div className="flex flex-col min-h-screen relative z-10">
            <Navbar />
            <main className="flex-1 pt-16">
              {children}
            </main>
            <footer className="border-t border-zinc-800/60 py-4 px-6 text-center text-zinc-500 text-xs">
              <span className="text-monad-400 font-semibold">Bolty</span> — The Ethereum memecoin platform
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
