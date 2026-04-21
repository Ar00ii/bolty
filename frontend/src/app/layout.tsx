import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';

import './globals.css';
import { ClientShell } from '@/components/layout/ClientShell';
import { ToastContainer } from '@/components/ui/Toast';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { ToastProvider } from '@/lib/hooks/useToast';
import { ThemeProvider } from '@/lib/theme/ThemeContext';

// Inter is the primary UI font — self-hosted + async-loaded via next/font so
// the browser can render text immediately instead of waiting on a blocking
// stylesheet from fonts.googleapis.com. Geist / Geist Mono are loaded
// asynchronously in <head> below (the `Geist` family isn't exposed by
// next/font/google in Next 14, so we keep a non-blocking <link>).
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const BASE_URL = 'https://boltynetwork.xyz';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Bolty — AI Developer Platform',
    template: '%s | Bolty',
  },
  description:
    'Bolty is the developer platform for publishing code, deploying AI agents, and earning from your work. Join the community at boltynetwork.xyz.',
  keywords: [
    'bolty',
    'boltynetwork',
    'bolty network',
    'ai developer platform',
    'ai agents marketplace',
    'publish code',
    'code marketplace',
    'developer community',
    'ethereum payments',
    'web3 developer',
    'bolty ai',
    'boltynetwork.xyz',
  ],
  authors: [{ name: 'Bolty', url: BASE_URL }],
  creator: 'Bolty',
  publisher: 'Bolty',
  category: 'technology',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Bolty',
    title: 'Bolty — AI Developer Platform',
    description:
      'Publish code, deploy AI agents, and earn from your work. The developer platform for the next generation of builders.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Bolty — AI Developer Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bolty — AI Developer Platform',
    description:
      'Publish code, deploy AI agents, and earn from your work. The developer platform for the next generation of builders.',
    images: [`${BASE_URL}/og-image.png`],
    creator: '@boltynetwork',
    site: '@boltynetwork',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Bolty',
  alternateName: 'BoltyNetwork',
  url: BASE_URL,
  logo: `${BASE_URL}/icon.png`,
  description:
    'Bolty is the AI developer platform for publishing code, deploying AI agents, and earning from your work.',
  sameAs: ['https://twitter.com/boltynetwork', 'https://github.com/boltynetwork'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: `${BASE_URL}/chat`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable}>
      <head>
        {/* Non-blocking Geist + Geist Mono. The `media="print"` trick lets the
             browser fetch the stylesheet in the background without blocking
             the initial paint; the onLoad handler promotes it to `all` once
             ready. Fontshare's "General Sans" + "Clash Display" links were
             dropped — the few spots that used General Sans now fall back to
             Inter, which is visually close and already loaded. */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
          media="print"
          // @ts-expect-error onLoad swap trick for async CSS
          onLoad="this.media='all'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <ClientShell>{children}</ClientShell>
            </AuthProvider>
            <ToastContainer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
