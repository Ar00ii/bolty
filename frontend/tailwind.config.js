/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Terminal green palette
        'neon': {
          50:  '#f0fff4',
          100: '#dcffe4',
          200: '#a8f7c1',
          300: '#6ef59a',
          400: '#39e87c',  // primary neon green
          500: '#00d46a',
          600: '#00b855',
          700: '#009143',
          800: '#006e32',
          900: '#004d21',
        },
        // Terminal dark palette
        'terminal': {
          50:  '#0d1117',
          100: '#0a0e13',
          200: '#090c11',
          300: '#07090e',
          400: '#05070b',
          500: '#040609',
          bg:  '#0d1117',
          card: '#161b22',
          border: '#21262d',
          text: '#c9d1d9',
          muted: '#8b949e',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
        sans: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'cursor-blink': 'blink 1s step-end infinite',
        'scan-line': 'scan 3s linear infinite',
        'glitch': 'glitch 0.3s ease-in-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'matrix-rain': 'matrixRain 2s linear infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(2px, -2px)' },
          '60%': { transform: 'translate(-1px, 1px)' },
          '80%': { transform: 'translate(1px, -1px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 5px #39e87c, 0 0 10px #39e87c' },
          '50%': { boxShadow: '0 0 20px #39e87c, 0 0 40px #39e87c' },
        },
      },
      boxShadow: {
        'neon-sm': '0 0 5px #39e87c',
        'neon-md': '0 0 10px #39e87c, 0 0 20px #39e87c40',
        'neon-lg': '0 0 20px #39e87c, 0 0 40px #39e87c40, 0 0 80px #39e87c20',
      },
      backgroundImage: {
        'terminal-grid': `
          linear-gradient(rgba(57, 232, 124, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(57, 232, 124, 0.03) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'terminal-grid': '30px 30px',
      },
    },
  },
  plugins: [],
};
