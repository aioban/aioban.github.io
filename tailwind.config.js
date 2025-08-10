/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./assets/**/*.js",
    "./assets/**/*.ts",
    "./**/*.html"
  ],
  darkMode: "class",
  theme: {
    extend: {}
  },
  safelist: [
    // Clases que se agregan desde JS en runtime
    "hidden",
    "opacity-60",
    "pointer-events-none",
    "select-none",
    "dark"
  ],
  plugins: []
};
