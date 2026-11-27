/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        postal: {
          navy: '#0b1d3a',
          blue: '#1e3a8a',
          accent: '#2563eb',
          light: '#f1f5f9',
          card: '#ffffff',
          darkBlue: '#0a192f',
          gold: '#f59e0b',
          crimson: '#dc2626',
          emerald: '#059669',
          amber: '#d97706'
        }
      }
    },
  },
  plugins: [],
}
