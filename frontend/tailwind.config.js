/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    // Tighten the radius scale. Most "AI-generated" Tailwind UIs lean on
    // rounded-2xl/3xl which read as bouncy/saas. Linear, Vercel, Phantom
    // sit at 4–10px max — sharper edges, more confident product feel.
    borderRadius: {
      none: '0',
      sm: '3px',
      DEFAULT: '5px',
      md: '6px',
      lg: '8px',
      xl: '10px',
      '2xl': '12px',
      '3xl': '14px',
      full: '9999px',
    },
    extend: {
      colors: {
        bolty: {
          50: '#E6FFF4',
          100: '#B3FFD9',
          200: '#7DFFBF',
          300: '#48F9A6',
          400: '#14F195',
          500: '#00DC83',
          600: '#00B96E',
          700: '#008F55',
          800: '#00663D',
          900: '#003D24',
        },
        solana: {
          green: '#14F195',
          mint: '#00FFA3',
          cyan: '#03E1FF',
          magenta: '#EC4899',
        },
        // Neutral surface ramp tuned for dark UI. Slightly warmer than
        // pure zinc — reads less "VS Code dark theme", more product-grade.
        surface: {
          0: '#070708',
          1: '#0B0B0D',
          2: '#101013',
          3: '#16161A',
          4: '#1D1D22',
          5: '#27272D',
          6: '#3A3A42',
        },
        terminal: {
          50: '#09090b',
          100: '#09090b',
          200: '#09090b',
          300: '#09090b',
          400: '#09090b',
          500: '#09090b',
          bg: '#09090b',
          card: '#18181b',
          border: '#27272a',
          text: '#e4e4e7',
          muted: '#71717a',
        },
        neon: {
          50: '#E6FFF4',
          100: '#B3FFD9',
          200: '#7DFFBF',
          300: '#48F9A6',
          400: '#14F195',
          500: '#00DC83',
          600: '#00B96E',
          700: '#008F55',
          800: '#00663D',
          900: '#003D24',
        },
      },
      fontFamily: {
        // Three-family system, like Vercel/Linear:
        //   display — Geist for headings (loaded via layout.tsx)
        //   sans    — Inter for body
        //   mono    — Geist Mono for tabular numbers, IDs, code, kbd
        display: [
          'Geist',
          'Inter',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: [
          'Geist Mono',
          'ui-monospace',
          'SFMono-Regular',
          'SF Mono',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
        tight: '-0.015em',
        normal: '0',
        wide: '0.04em',
        wider: '0.08em',
      },
      animation: {
        'fade-in': 'fadeIn 0.28s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'slide-up': 'slideUp 0.32s cubic-bezier(0.22, 0.61, 0.36, 1)',
        'cursor-blink': 'blink 1s step-end infinite',
        'border-beam': 'borderBeam calc(var(--duration)*1s) linear infinite',
        'card-stagger': 'card-stagger 0.4s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
        'shimmer-load': 'shimmer-load 1.6s infinite',
      },
      keyframes: {
        borderBeam: {
          '100%': { 'offset-distance': '100%' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'card-stagger': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer-load': {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      boxShadow: {
        // Calmer shadow scale. No more aggressive neon glows by default —
        // glow becomes opt-in via the `bolty-glow` class for moments that
        // genuinely call for it.
        'bolty-sm': '0 0 0 1px rgba(20,241,149,0.18)',
        'bolty-md': '0 0 0 1px rgba(20,241,149,0.28), 0 1px 0 rgba(20,241,149,0.05) inset',
        'bolty-lg': '0 0 0 1px rgba(20,241,149,0.36), 0 8px 24px -8px rgba(20,241,149,0.32)',
        // Hairline + soft drop. The Linear / Vercel signature.
        hairline: '0 0 0 1px rgba(255,255,255,0.06)',
        'hairline-strong': '0 0 0 1px rgba(255,255,255,0.10)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.06), 0 8px 24px -16px rgba(0,0,0,0.6)',
        'card-hover': '0 1px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px rgba(255,255,255,0.10), 0 12px 32px -18px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        // Square dot grid — calmer than the line grid, reads more "engineering tool".
        'dot-grid': `radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)`,
        'terminal-grid': `
          linear-gradient(rgba(20, 241, 149, 0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(20, 241, 149, 0.025) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'dot-grid': '20px 20px',
        'terminal-grid': '40px 40px',
      },
    },
  },
  plugins: [],
};
