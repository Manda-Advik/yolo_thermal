/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#FFFFFF",
        secondary: "#A3A3A3",
        "electric-blue": "#00E5FF",
        "accent-lime": "#bef264",
        "background-light": "#000000",
        "background-dark": "#000000",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      animation: {
        scanline: "scanline 4s linear infinite",
        flicker: "flicker 2s infinite",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-fast": "pulse-glow 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "flow-down": "flow-down 2s linear infinite",
        "scroll-hex": "scroll-hex 10s linear infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        flicker: {
          "0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%": {
            opacity: 0.99,
          },
          "20%, 21.999%, 63%, 63.999%, 65%, 69.999%": { opacity: 0.4 },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.3 },
        },
        "flow-down": {
          "0%": { transform: "translateY(-100%)", opacity: 0 },
          "50%": { opacity: 1 },
          "100%": { transform: "translateY(100%)", opacity: 0 },
        },
        "scroll-hex": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
