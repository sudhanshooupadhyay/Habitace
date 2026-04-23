/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#060c1a',
          800: '#0a0f1e',
          700: '#0d1526',
          600: '#111827',
          500: '#1a2332',
          400: '#1e293b',
        },
        accent: {
          indigo: '#6366f1',
          purple: '#8b5cf6',
          violet: '#7c3aed',
        },
        calm: {
          green: '#10b981',
          blue: '#38bdf8',
          gold: '#f59e0b',
        },
      },
      animation: {
        'breathe-in':  'breatheIn 4s ease-in-out forwards',
        'breathe-out': 'breatheOut 4s ease-in-out forwards',
        'hold':        'hold 4s ease-in-out forwards',
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'fade-in':     'fadeIn 0.4s ease-out forwards',
        'slide-up':    'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        breatheIn: {
          '0%':   { transform: 'scale(0.6)', opacity: '0.4' },
          '100%': { transform: 'scale(1.2)', opacity: '1' },
        },
        breatheOut: {
          '0%':   { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(0.6)', opacity: '0.4' },
        },
        hold: {
          '0%, 100%': { transform: 'scale(1.2)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.3)' },
          '50%':      { boxShadow: '0 0 40px rgba(99,102,241,0.7)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
