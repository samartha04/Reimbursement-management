/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F6F3EE',
        surface: '#FFFFFF',
        surface2: '#EFECE6',
        border1: 'rgba(30,25,15,0.09)',
        border2: 'rgba(30,25,15,0.15)',
        ink: {
          1: '#1C1814',
          2: '#6B6355',
          3: '#A09888',
        },
        green: {
          bg: '#EBF3EB',
          text: '#2D5F2F',
          mid: '#4E8A51',
        },
        amber: {
          bg: '#FEF3E2',
          text: '#7A4E0E',
        },
        red: {
          bg: '#FEECEC',
          text: '#7A1C1C',
        }
      },
      fontFamily: {
        disp: ['Fraunces', 'Georgia', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        'sm1': '8px',
        'md1': '14px',
      }
    },
  },
  plugins: [],
}
