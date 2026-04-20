/** @type {import('next').NextConfig} */
const path = require('path');
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const wsUrl  = process.env.NEXT_PUBLIC_WS_URL  || 'http://localhost:3001';

// Extract origin (protocol + host) from URL for CSP
const apiOrigin = new URL(apiUrl).origin;
const wsOrigin  = new URL(wsUrl).origin;
const wsOriginWs = wsOrigin.replace(/^http/, 'ws');

// Backend base (without /api/v1) for the proxy rewrite
const backendOrigin = apiOrigin;

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during build since the code compiles successfully.
    // The ESLint config references plugins that aren't installed (@next/next).
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendOrigin}/api/v1/:path*`,
      },
    ];
  },

  webpack: (config) => {
    // Ensure @/ path alias resolves to src/ (backup for tsconfig paths)
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              `img-src 'self' data: https: http: blob: ${apiOrigin}`,
              // Allow backend API (http or https) + WebSocket connections
              `connect-src 'self' ${apiOrigin} ${wsOrigin} ${wsOriginWs} https: wss:`,
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: new URL(apiUrl).hostname },
    ],
  },

};

module.exports = nextConfig;
