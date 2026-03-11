/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Monad purple palette (primary brand color)
        'monad': {
          50:  '#f3f0ff',
          100: '#e9e3ff',
          200: '#d4cbff',
          300: '#b5a5ff',
          400: '#836EF9',  // primary Monad purple
          500: '#7B5CF6',
          600: '#6b4fe0',
          700: '#5a3cc7',
          800: '#4a31a4',
          900: '#3c2885',
        },
        // Terminal dark palette (zinc-based for professional look)
        'terminal': {
          50:  '#09090b',
          100: '#09090b',
          200: '#09090b',
          300: '#09090b',
          400: '#09090b',
          500: '#09090b',
          bg:  '#09090b',
          card: '#18181b',
          border: '#27272a',
          text: '#e4e4e7',
          muted: '#71717a',
        },
        // Legacy neon green — kept for backward compat
        'neon': {
          50:  '#f0fff4',
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
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'cursor-blink': 'blink 1s step-end infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
      },
      keyframes: {
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
      },
      boxShadow: {
        'monad-sm': '0 0 5px rgba(131, 110, 249, 0.4)',
        'monad-md': '0 0 15px rgba(131, 110, 249, 0.3)',
        'monad-lg': '0 0 30px rgba(131, 110, 249, 0.2)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
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
