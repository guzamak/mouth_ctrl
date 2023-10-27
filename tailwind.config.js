/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        primary:'#F2F210',
        secondary:{
          '100':'#030303',
          '200':'#F0F0F0',
          '300':'#000000',
          '400':'#000000',
        }
      },
      fontFamily:{
        'KAUFMANN':['KAUFMANN',"sans-serif"],
        'NeutraText-Demi':['NeutraText-Demi',"sans"],
        'IBMPlexSansThai':['IBMPlexSansThai',"sans"],
      }
    },
  },
  plugins: [require("daisyui")],
}