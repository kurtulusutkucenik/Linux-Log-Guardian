import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: "#000000",
        panel: "#0a0a0a",
        "panel-alt": "#0d0d0d",
        // Brand accent — red (theme color). Used for CTAs, highlights, live dot.
        neon: "#ff3b3b",
        cyan: "#00f0ff",
        // Phosphorescent turquoise — our data-viz signature (charts, our bars).
        turq: "#1ff5df",
        // Danger / critical states.
        coral: "#ff4136",
        // Genuine success/pass status (test matrix, healthy log lines).
        ok: "#22c55e",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "stream-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "stream-in": "stream-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
