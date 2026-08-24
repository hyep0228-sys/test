/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#EFEEEA",
        ink: "#151515",
        mute: "#8A8A86",
        line: "#D6D4CE",
        accent: "#1E3FD0",
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "var(--font-instrument-serif)",
          "Pretendard Variable",
          "Pretendard",
          "serif",
        ],
      },
    },
  },
  plugins: [],
};
