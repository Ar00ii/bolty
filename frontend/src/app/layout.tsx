import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { ClientShell } from '@/components/layout/ClientShell';
import { ThemeProvider } from '@/lib/theme/ThemeContext';

export const metadata: Metadata = {
  title: 'Bolty | AI Developer Platform',
  description: 'The developer platform for AI agents, code marketplaces, and community collaboration.',
  keywords: ['bolty', 'ai agents', 'developer platform', 'code marketplace', 'ethereum', 'web3'],
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  openGraph: {
    title: 'Bolty | AI Developer Platform',
    description: 'The developer platform for AI agents, code marketplaces, and community collaboration.',
    type: 'website',
  },
  robots: 'index, follow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen grid-bg">
        <ThemeProvider>
          <AuthProvider>
            <ClientShell>
              {children}
            </ClientShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
