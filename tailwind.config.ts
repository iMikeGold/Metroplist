import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#071013",
        paper: "#f5f2ea",
        signal: "#21c6a8",
        ember: "#f06c3f",
        chart: "#4f8cff"
      },
      fontFamily: {
        sans: ["Inter", "Avenir Next", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["SFMono-Regular", "Roboto Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        glow: "0 0 70px rgba(33, 198, 168, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
