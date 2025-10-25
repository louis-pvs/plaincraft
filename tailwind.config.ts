import type { Config } from "tailwindcss";

export default {
  content: ["./demo/**/*.{ts,tsx,html}", "./snippets/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#0F172A",
          700: "#334155",
          300: "#CBD5E1",
        },
        accent: {
          blue: "#2563EB",
          teal: "#0D9488",
          orange: "#EA580C",
        },
      },
      borderRadius: { md: "12px" },
    },
  },
  plugins: [],
} satisfies Config;
