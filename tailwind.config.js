import { colors } from './theme/colors';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./components/**/*.{js,ts,tsx}", "./app/**/*.{js,ts,tsx}"],

  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors
    },
  },
  plugins: [],
};
