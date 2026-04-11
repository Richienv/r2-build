import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#080808",
        surface: "#0F0F0F",
        surface2: "#161616",
        border: "#2A2A2A",
        accent: "#FFFFFF",
        "accent-dim": "#888888",
        text: "#F0F0F0",
        muted: "#444444",
        building: "#E8FF47",
        stuck: "#FF4747",
        waiting: "#888888",
        done: "#47FFB8",
        erp: "#4A9BE8",
        oic: "#E8FF47",
        fit: "#47FFB8",
      },
      fontFamily: {
        display: ["Impact", "Haettenschweiler", "Arial Narrow Bold", "sans-serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
