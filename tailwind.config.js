/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff8f1',
          100: '#feecdc',
          200: '#fcd9b3',
          300: '#fbbf7a',
          400: '#f99840',
          500: '#f77a1a',
          600: '#e85f0d',
          700: '#c0460d',
          800: '#993812',
          900: '#7c3012',
          950: '#431507',
        },
        brand: {
          DEFAULT: '#f77a1a',
          dark:    '#c0460d',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted:   '#f9fafb',
          subtle:  '#f3f4f6',
        },
      },
      fontFamily: {
        sans:    ['Geist', 'ui-sans-serif', 'system-ui'],
        display: ['Syne', 'ui-sans-serif', 'system-ui'],
        mono:    ['Geist Mono', 'ui-monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        card:    '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
      },
    },
  },
  plugins: [],
};