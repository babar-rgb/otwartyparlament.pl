/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 1. Brand Identity (The Hero Color)
        brand: {
          DEFAULT: '#D6B55E', // Mustard Gold
          light: '#E5C773',
          dark: '#B59645',
        },
        // 2. Backgrounds (Editorial Feel)
        paper: {
          DEFAULT: '#F9F9F7', // Warm Off-White for page bg
          pure: '#FFFFFF',    // For Cards
        },
        // 3. Typography (Softer than pure black)
        ink: {
          DEFAULT: '#111827', // Deep Charcoal
          light: '#4B5563',   // Secondary Text
        },
        // 4. Functional / Voting Results (Muted, Serious tones)
        vote: {
          yes: '#166534',     // Deep Forest Green
          yesBg: '#DCFCE7',   // Light Green Pill bg
          no: '#991B1B',      // Brick Red
          noBg: '#FEE2E2',    // Light Red Pill bg
          abstain: '#4B5563', // Steel Gray
          abstainBg: '#F3F4F6'
        }
      },
      fontFamily: {
        // Use a serious Serif for Headings (Editorial vibe)
        serif: ['Merriweather', 'serif'],
        // Use clean Sans for UI/Data
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
  plugins: [],
};
