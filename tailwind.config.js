/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0b1f3a",
          deep: "#071528",
          sky: "#5dade2",
          soft: "#e8f4fc",
          accent: "#1a5276",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        ui: ["var(--font-ui)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,31,58,0.06), 0 8px 24px rgba(11,31,58,0.06)",
      },
    },
  },
  plugins: [],
};
