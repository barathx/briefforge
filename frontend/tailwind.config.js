/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        surface: {
          DEFAULT: 'rgba(255,255,255,0.05)',
          hover:   'rgba(255,255,255,0.08)',
          active:  'rgba(255,255,255,0.12)',
        },
        glass: {
          border: 'rgba(255,255,255,0.10)',
          'border-hover': 'rgba(255,255,255,0.20)',
        },
        bg: {
          base:  '#0a0a0f',
          card:  '#0f0f1a',
          input: '#13131f',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #06b6d4 100%)',
        'gradient-violet':  'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        'gradient-subtle':  'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(168,85,247,0.10) 100%)',
        'gradient-glow':    'radial-gradient(ellipse at center, rgba(124,58,237,0.3) 0%, transparent 70%)',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124,58,237,0.4)' },
          '50%':      { boxShadow: '0 0 40px rgba(168,85,247,0.7)' },
        },
        spin: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        orbPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%':      { transform: 'scale(1.15)', opacity: '0.9' },
        },
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out forwards',
        'slide-up':   'slideUp 0.5s ease-out forwards',
        shimmer:      'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        float:        'float 3s ease-in-out infinite',
        'orb-pulse':  'orbPulse 4s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass:  '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        glow:   '0 0 30px rgba(124,58,237,0.5)',
        'glow-sm': '0 0 15px rgba(124,58,237,0.3)',
        card:   '0 4px 24px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
