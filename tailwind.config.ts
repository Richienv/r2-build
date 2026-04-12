import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#080808",
        surface: "#111111",
        surface2: "#1A1A1A",
        border: "#2A2A2A",
        text: "#F0F0F0",
        muted: "#555555",
        dim: "#333333",
        stuck: "#FF4747",
        done: "#47FFB8",
        erp: "#4A9BE8",
        oic: "#E8FF47",
        fit: "#47FFB8",
      },
    },
  },
  plugins: [],
};

export default config;
