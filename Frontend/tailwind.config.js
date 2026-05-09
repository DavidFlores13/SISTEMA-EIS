/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        eis: {
          navy: "#0b1d3a",
          sky: "#22d3ee",
          mint: "#2dd4bf",
          sand: "#f3efe4",
        },
      },
      boxShadow: {
        soft: "0 10px 35px -15px rgba(11, 29, 58, 0.45)",
      },
    },
  },
  plugins: [],
};
