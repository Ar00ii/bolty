/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Bolty purple palette (primary brand color)
        bolty: {
          50: '#f3f0ff',
          100: '#e9e3ff',
          200: '#d4cbff',
          300: '#b5a5ff',
          400: '#836EF9', // primary Bolty purple
          500: '#7B5CF6',
          600: '#6b4fe0',
          700: '#5a3cc7',
          800: '#4a31a4',
          900: '#3c2885',
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
        // Legacy neon green — kept for backward compat
        neon: {
          50: '#f0fff4',
          100: '#dcffe4',
          200: '#a8f7c1',
          300: '#836EF9',
          400: '#836EF9',
          500: '#7B5CF6',
          600: '#6b4fe0',
          700: '#5a3cc7',
          800: '#4a31a4',
          900: '#3c2885',
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
          '0%': { background: 'linear-gradient(0deg,#836EF9,#c4b5fd,#836EF9)' },
          '25%': { background: 'linear-gradient(90deg,#836EF9,#c4b5fd,#836EF9)' },
          '50%': { background: 'linear-gradient(180deg,#836EF9,#c4b5fd,#836EF9)' },
          '75%': { background: 'linear-gradient(270deg,#836EF9,#c4b5fd,#836EF9)' },
          '100%': { background: 'linear-gradient(360deg,#836EF9,#c4b5fd,#836EF9)' },
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
          '0%, 100%': { boxShadow: '0 0 5px #836EF9, 0 0 10px #836EF9' },
          '50%': { boxShadow: '0 0 20px #836EF9, 0 0 40px #836EF950' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(131,110,249,0.4), 0 0 20px rgba(6,182,212,0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(131,110,249,0.6), 0 0 60px rgba(6,182,212,0.3)' },
        },
        'border-gradient': {
          '0%': { borderColor: '#836EF9' },
          '33%': { borderColor: '#06B6D4' },
          '66%': { borderColor: '#EC4899' },
          '100%': { borderColor: '#836EF9' },
        },
        'text-glow': {
          '0%, 100%': { textShadow: '0 0 10px rgba(131,110,249,0.4)' },
          '50%': { textShadow: '0 0 30px rgba(131,110,249,0.8), 0 0 60px rgba(6,182,212,0.4)' },
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
        'bolty-sm': '0 0 5px rgba(131, 110, 249, 0.4)',
        'bolty-md': '0 0 15px rgba(131, 110, 249, 0.3)',
        'bolty-lg': '0 0 30px rgba(131, 110, 249, 0.2)',
        card: '0 4px 20px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'terminal-grid': `
          linear-gradient(rgba(131, 110, 249, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(131, 110, 249, 0.03) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'terminal-grid': '40px 40px',
      },
    },
  },
  plugins: [],
};
