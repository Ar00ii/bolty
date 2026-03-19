/** @type {import('next').NextConfig} */
const path = require('path');
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const wsUrl  = process.env.NEXT_PUBLIC_WS_URL  || 'http://localhost:3001';

// Extract origin (protocol + host) from URL for CSP
const apiOrigin = new URL(apiUrl).origin;
const wsOrigin  = new URL(wsUrl).origin;
const wsOriginWs = wsOrigin.replace(/^http/, 'ws');

const nextConfig = {
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    // Ensure @/ path alias resolves to src/ (backup for tsconfig paths)
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');

    if (isServer) {
      // Replace @splinetool packages with a stub on the server.
      // @splinetool/runtime executes `new class extends null` at module-level
      // which throws in Node.js ("Super constructor null is not a constructor").
      config.resolve.alias['@splinetool/react-spline'] = path.resolve(
        __dirname,
        'src/__stubs__/spline-stub.js',
      );
      config.resolve.alias['@splinetool/runtime'] = path.resolve(
        __dirname,
        'src/__stubs__/spline-stub.js',
      );
    } else {
      // @splinetool/react-spline@4.x only exposes an ESM "import" condition in
      // its exports field, which webpack cannot resolve without this alias.
      // Point directly to the dist file to bypass the broken exports field.
      config.resolve.alias['@splinetool/react-spline'] = path.resolve(
        __dirname,
        'node_modules/@splinetool/react-spline/dist/react-spline.js',
      );
      // face-api.js → @tensorflow/tfjs-core → node-fetch → encoding
      // "encoding" is a Node.js native module; stub it out in browser bundles.
      config.resolve.alias['encoding'] = false;
    }
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
              "img-src 'self' data: https: blob:",
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
    ],
  },

  // Environment variables available to browser (non-secret only)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
  },
};

module.exports = nextConfig;
