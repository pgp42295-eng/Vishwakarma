/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        // Muted teal: calm, not loud. Swap these values to re-theme the whole site.
        brand: {
          50: '#f1f8f7', 100: '#ddefec', 200: '#bfe0da', 300: '#94c9c0', 400: '#64ab9f',
          500: '#3f8f83', 600: '#2f766c', 700: '#285f58', 800: '#234d48', 900: '#1f403c',
        },
        ink: '#1e293b',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.04), 0 2px 8px rgba(15,23,42,.04)',
        lift: '0 10px 30px -10px rgba(15,23,42,.12)',
      },
    },
  },
  plugins: [],
}
