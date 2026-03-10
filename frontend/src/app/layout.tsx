import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { ClientShell } from '@/components/layout/ClientShell';

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
          <ClientShell>
            {children}
          </ClientShell>
        </AuthProvider>
      </body>
    </html>
  );
}
