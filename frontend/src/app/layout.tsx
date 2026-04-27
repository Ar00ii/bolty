import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';

import './globals.css';
import { ClientShell } from '@/components/layout/ClientShell';
import { ToastContainer } from '@/components/ui/Toast';
import {
  BRAND_DESCRIPTION,
  BRAND_DOMAIN,
  BRAND_NAME,
  BRAND_NAME_DISPLAY,
  BRAND_TAGLINE,
} from '@/lib/brand';
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

const BASE_URL = `https://${BRAND_DOMAIN}`;

// Responsive viewport — without this, mobile browsers render the page
// at the virtual 980px layout width and scale it down, which is why
// the dashboard looked catastrophically broken on phones even with
// correct responsive CSS. themeColor flipped to white now that the
// public surface defaults to the light theme.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${BRAND_NAME_DISPLAY} — ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND_NAME_DISPLAY}`,
  },
  description: BRAND_DESCRIPTION,
  keywords: [
    BRAND_NAME,
    'ethereum',
    'eth mainnet',
    'ai agents marketplace',
    'autonomous agents',
    'web3 developer',
    'agent marketplace',
    'onchain agents',
  ],
  authors: [{ name: BRAND_NAME_DISPLAY, url: BASE_URL }],
  creator: BRAND_NAME_DISPLAY,
  publisher: BRAND_NAME_DISPLAY,
  category: 'technology',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: BRAND_NAME_DISPLAY,
    title: `${BRAND_NAME_DISPLAY} — ${BRAND_TAGLINE}`,
    description: BRAND_DESCRIPTION,
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${BRAND_NAME_DISPLAY} — ${BRAND_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND_NAME_DISPLAY} — ${BRAND_TAGLINE}`,
    description: BRAND_DESCRIPTION,
    images: [`${BASE_URL}/og-image.png`],
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
  name: BRAND_NAME_DISPLAY,
  url: BASE_URL,
  logo: `${BASE_URL}/icon.png`,
  description: BRAND_DESCRIPTION,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: `${BASE_URL}/chat`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={inter.variable}>
      <head>
        {/* Explicit viewport meta as a belt-and-suspenders backup to the
            `export const viewport` above — some deploy pipelines strip or
            reorder the auto-injected tag, and without it mobile browsers
            render at ~980px and scale down. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        />
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
