/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Atlas green palette (primary brand color, Solana-native)
        atlas: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#14F195', // primary Atlas green (Solana)
          500: '#00C853', // deep green for hover/active
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Terminal dark palette (zinc-based for professional look)
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
        // Neon palette aliased to atlas for backward compat with components
        // that still reference `neon-*`. Same shades, no visual diff.
        neon: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#14F195',
          500: '#00C853',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      fontFamily: {
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'SF Mono',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        float: 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'cursor-blink': 'blink 1s step-end infinite',
        spotlight: 'spotlight 2s ease .75s 1 forwards',
        grid: 'grid 15s linear infinite',
        'border-beam': 'borderBeam calc(var(--duration)*1s) linear infinite',
        'gradient-rotate': 'gradientRotate 4s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'border-gradient': 'border-gradient 4s linear infinite',
        'text-glow': 'text-glow 3s ease-in-out infinite',
        'card-stagger': 'card-stagger 0.6s ease-out forwards',
        ripple: 'ripple 0.6s ease-out',
        'shimmer-load': 'shimmer-load 2s infinite',
      },
      keyframes: {
        borderBeam: {
          '100%': { 'offset-distance': '100%' },
        },
        gradientRotate: {
          '0%': { background: 'linear-gradient(0deg,#14F195,#a7f3d0,#14F195)' },
          '25%': { background: 'linear-gradient(90deg,#14F195,#a7f3d0,#14F195)' },
          '50%': { background: 'linear-gradient(180deg,#14F195,#a7f3d0,#14F195)' },
          '75%': { background: 'linear-gradient(270deg,#14F195,#a7f3d0,#14F195)' },
          '100%': { background: 'linear-gradient(360deg,#14F195,#a7f3d0,#14F195)' },
        },
        grid: {
          '0%': { transform: 'translateY(-50%)' },
          '100%': { transform: 'translateY(0)' },
        },
        spotlight: {
          '0%': { opacity: '0', transform: 'translate(-72%, -62%) scale(0.5)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -40%) scale(1)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 5px #14F195, 0 0 10px #14F195' },
          '50%': { boxShadow: '0 0 20px #14F195, 0 0 40px #14F19550' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(20,241,149,0.4), 0 0 20px rgba(0,200,83,0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(20,241,149,0.6), 0 0 60px rgba(0,200,83,0.3)' },
        },
        'border-gradient': {
          '0%': { borderColor: '#14F195' },
          '33%': { borderColor: '#06B6D4' },
          '66%': { borderColor: '#00C853' },
          '100%': { borderColor: '#14F195' },
        },
        'text-glow': {
          '0%, 100%': { textShadow: '0 0 10px rgba(20,241,149,0.4)' },
          '50%': { textShadow: '0 0 30px rgba(20,241,149,0.8), 0 0 60px rgba(0,200,83,0.4)' },
        },
        'card-stagger': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'shimmer-load': {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      boxShadow: {
        'atlas-sm': '0 0 5px rgba(20, 241, 149, 0.4)',
        'atlas-md': '0 0 15px rgba(20, 241, 149, 0.3)',
        'atlas-lg': '0 0 30px rgba(20, 241, 149, 0.2)',
        card: '0 4px 20px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'terminal-grid': `
          linear-gradient(rgba(20, 241, 149, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(20, 241, 149, 0.03) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'terminal-grid': '40px 40px',
      },
    },
  },
  plugins: [],
};
