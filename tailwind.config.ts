import type { Config } from "tailwindcss";

// Les couleurs pointent vers les variables CSS definies dans globals.css : c'est ce
// qui permet au theme sombre et a l'accent propre a chaque section de fonctionner
// sans dupliquer les classes.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        line: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        ink: {
          DEFAULT: "var(--text)",
          dim: "var(--text-dim)",
          faint: "var(--text-faint)",
        },
        brand: {
          DEFAULT: "var(--brand)",
          2: "var(--brand-2)",
          soft: "var(--brand-soft)",
        },
        section: {
          DEFAULT: "var(--section)",
          2: "var(--section-2)",
          soft: "var(--section-soft)",
        },
        ok: { DEFAULT: "var(--success)", soft: "var(--success-soft)" },
        bad: { DEFAULT: "var(--danger)", soft: "var(--danger-soft)" },
        warn: { DEFAULT: "var(--warning)", soft: "var(--warning-soft)" },
        info: { DEFAULT: "var(--info)", soft: "var(--info-soft)" },
        // Conserve pour compatibilite avec les classes deja presentes dans les pages.
        accent: { DEFAULT: "var(--section)", 2: "var(--section-2)" },
      },
      borderRadius: {
        sm: "12px",
        DEFAULT: "18px",
        xl: "18px",
        "2xl": "26px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
