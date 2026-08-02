/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14171A',
        paper: '#FAFAF8',
        market: {
          50: '#EAF4EE',
          100: '#CFE6D9',
          200: '#9FCDB4',
          300: '#6FB48F',
          400: '#3E9A6A',
          500: '#1F6D4C',
          600: '#195A3E',
          700: '#134730',
          800: '#0D3422',
          900: '#082116'
        },
        citrus: {
          50: '#FDF3E3',
          100: '#FAE3B8',
          200: '#F5C97C',
          300: '#F0AE47',
          400: '#E8A33D',
          500: '#D68A22',
          600: '#B06E1A'
        },
        slate2: {
          50: '#F3F4F6',
          100: '#E4E6EA',
          200: '#C7CBD3',
          300: '#9AA1AC',
          400: '#5B6470',
          500: '#434B55',
          600: '#2E353D',
          700: '#20262C',
          800: '#171B1F',
          900: '#101316'
        },
        tomato: {
          50: '#FBEAE8',
          400: '#D9695F',
          500: '#C4453C',
          600: '#A6362E'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      borderRadius: {
        tag: '4px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,23,26,0.04), 0 1px 8px rgba(20,23,26,0.04)',
        pop: '0 8px 30px rgba(20,23,26,0.12)'
      }
    }
  },
  plugins: []
}
