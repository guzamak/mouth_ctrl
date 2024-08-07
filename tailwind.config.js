/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily:{
        'KAUFMANN':['KAUFMANN',"sans-serif"],
        'IBMPlexSansThai':['IBMPlexSansThai',"sans"],
      }
    },
  },
  // only light mode
  daisyui: {
    themes: [
      "light",
    ]
  },
  plugins: [require("daisyui")],
}