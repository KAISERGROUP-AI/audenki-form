import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#20242B",
        paper: "#FAF8F4",
        card: "#FFFFFF",
        line: "#E6E1D8",
        accent: {
          DEFAULT: "#D9600F",
          dark: "#B24C09",
          light: "#F2A25C",
          soft: "#FCE9D9",
        },
        muted: "#8A8578",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(32,36,43,0.04), 0 8px 24px -12px rgba(32,36,43,0.12)",
        cardHover: "0 2px 4px rgba(32,36,43,0.06), 0 16px 32px -16px rgba(32,36,43,0.18)",
        cta: "0 8px 20px -6px rgba(217,96,15,0.45)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
