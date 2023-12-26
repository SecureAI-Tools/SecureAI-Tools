/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "../../node_modules/flowbite-react/**/*.js",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./fe/components/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("flowbite/plugin")],
  // Disables default dark mode inheriting from OS preferences!
  // Our dark mode isn't that well supported -- it is all over the place hence it is disabled for now!
  // In future, considering fully testing the app in dark mode before enabling this again.
  //
  // Reference: https://tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually
  darkMode: "class",
};
