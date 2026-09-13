import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: "#e0703a", 2: "#3a8f7a" },
        surface: "#ffffff",
      },
      borderRadius: { xl: "16px" },
    },
  },
  plugins: [],
};
export default config;
