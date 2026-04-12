import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#080808",
        surface: "#111111",
        border: "#2A2A2A",
        text: "#F0F0F0",
        muted: "#444444",
        dim: "#2A2A2A",
      },
    },
  },
  plugins: [],
};

export default config;
