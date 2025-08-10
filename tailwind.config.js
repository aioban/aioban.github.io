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
  "hidden","opacity-60","pointer-events-none","select-none","dark",
  "bg-white/80","dark:bg-slate-900/70","border","border-slate-200","dark:border-slate-800",
  "text-slate-600","dark:text-slate-400","dark:bg-slate-950","dark:text-slate-100"
],

    // Clases que se agregan desde JS en runtime
    "hidden",
    "opacity-60",
    "pointer-events-none",
    "select-none",
    "dark"
  ],
  plugins: []
};
