/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f7f5f0',
          100: '#efede6',
          200: '#e2ded4',
          300: '#c9c3b5',
          400: '#8e877b',
          500: '#746d61',
          600: '#5f594f',
          700: '#48443c',
          800: '#35322c',
          900: '#25231f',
          950: '#181713',
        },
        church: {
          50: '#faf6ed',
          100: '#f0e5d1',
          200: '#e2cda7',
          300: '#cdb17d',
          400: '#b8965b',
          500: '#a38346',
          600: '#86692e',
          700: '#705523',
          800: '#5a451f',
          900: '#46361d',
          950: '#2b2214',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      borderRadius: { lg: '0.625rem', xl: '0.875rem', '2xl': '1rem' },
      boxShadow: {
        sm: '0 2px 8px rgb(70 54 29 / 0.04)',
        md: '0 5px 18px rgb(70 54 29 / 0.06)',
      },
    },
  },
  plugins: [],
};
