/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          orange: '#f47836',
          yellow: '#fbaf34',
          brown: '#982f20',
          red: '#9a2d02',
        }
      },
      fontFamily: {
        'libre': ['"Libre Franklin"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
