/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
      },
      colors: {
        canvas: {
          light: '#f0f3ee',
          dark: '#0b0e0c',
          soft: '#e8ebe6',
          'soft-dark': '#181d18',
        },
        surface: {
          light: '#ffffff',
          dark: '#131713',
        },
        hairline: {
          light: '#e0e4dd',
          dark: '#1f261f',
        },
        ink: {
          light: '#0e0f0c',
          dark: '#f4f6f3',
          body: '#454745',
          'body-dark': '#a3aba1',
          muted: '#737672',
          'muted-dark': '#6d756c',
        },
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        fikr: {
          dark: '#0e0f0c',
          emerald: '#059669',
          accent: '#0d9488',
        }
      },
      borderRadius: {
        'card': '16px',
        'input': '12px',
      },
      letterSpacing: {
        tighter: '-0.035em',
        tight: '-0.02em',
      }
    },
  },
  plugins: [],
}
