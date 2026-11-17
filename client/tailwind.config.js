/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        subodhi: {
          red: '#dc2626',
          darkRed: '#b91c1c',
          blue: '#1e3a8a',
          navy: '#0f172a',
          sky: '#3b82f6',
          accent: '#2563eb'
        }
      }
    },
  },
  plugins: [],
}

