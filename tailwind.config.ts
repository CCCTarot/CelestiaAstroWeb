import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { midnight: "#0B0F17" },
      fontFamily: { display: ["var(--font-display)", "sans-serif"], sans: ["var(--font-sans)", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
