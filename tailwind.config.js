/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '375px',  // Small mobile (iPhone SE)
        '3xl': '1920px', // Full HD / 4K starts
      },
      colors: {
        // 1. Semantic Colors mapped to CSS variables
        background: 'rgb(var(--bg-page) / <alpha-value>)',
        surface: 'rgb(var(--bg-surface) / <alpha-value>)',
        primary: 'rgb(var(--text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
        border: 'rgb(var(--border-base) / <alpha-value>)',

        // 2. Brand Identity (Keeping gold/mustard)
        brand: {
          DEFAULT: '#D6B55E',
          light: '#E5C773',
          dark: '#B59645',
        },
        // Backwards compatibility for old names if needed
        paper: {
          DEFAULT: 'rgb(var(--bg-page) / <alpha-value>)',
          pure: 'rgb(var(--bg-surface) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)',
          light: 'rgb(var(--text-secondary) / <alpha-value>)',
        },
        // 4. Functional / Voting Results
        vote: {
          yes: '#166534',
          yesBg: '#DCFCE7',
          no: '#991B1B',
          noBg: '#FEE2E2',
          abstain: '#4B5563',
          abstainBg: '#F3F4F6'
        }
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'tilt': 'tilt 10s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        tilt: {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};
