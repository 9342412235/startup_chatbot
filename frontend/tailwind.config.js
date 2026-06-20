/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0c15',
        darkPanel: 'rgba(20, 21, 38, 0.7)',
        glassBorder: 'rgba(255, 255, 255, 0.08)',
        accentPurple: '#8b5cf6',
        accentPink: '#ec4899',
        accentIndigo: '#6366f1',
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
