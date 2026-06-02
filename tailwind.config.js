/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      colors: {
        sidebar: '#0f172a',
        sidebar2: '#1e293b'
      },
      boxShadow: {
        drawer: '-8px 0 40px rgba(15, 23, 42, 0.15)'
      }
    }
  },
  safelist: [
    { pattern: /bg-(red|orange|amber|emerald|sky|blue|slate|purple)-(100|500|600|700)/ },
    { pattern: /text-(red|orange|amber|emerald|sky|blue|slate|purple)-(500|600|700)/ }
  ],
  plugins: []
};
