import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rad: {
          canvas: "var(--canvas)",
          paper: "var(--paper)",
          ink: "var(--ink)",
          sand: "var(--sand)",
          moss: "var(--moss)",
          mineral: "var(--moss)",
          muted: "var(--muted)",
          line: "var(--line)",
        },
      },
      fontFamily: { sans: ["var(--font-sans)"] },
      fontSize: {
        label: [
          "var(--text-label)",
          { letterSpacing: "var(--tracking-index)" },
        ],
        caption: [
          "var(--text-caption)",
          { letterSpacing: "var(--tracking-label)" },
        ],
        identifier: [
          "var(--text-identifier)",
          { letterSpacing: "var(--tracking-label)" },
        ],
        eyebrow: "var(--text-eyebrow)",
        button: "var(--text-button)",
        body: ["var(--text-body)", { lineHeight: "var(--leading-body)" }],
        price: "var(--text-price)",
        faq: ["var(--text-faq)", { fontWeight: "500" }],
        lede: ["var(--text-lede)", { lineHeight: "var(--leading-prose)" }],
        prose: ["var(--text-prose)", { lineHeight: "var(--leading-prose)" }],
        "product-title": [
          "var(--text-product-title)",
          { lineHeight: "var(--leading-tight)" },
        ],
        h3: ["var(--text-h3)", { lineHeight: "var(--leading-tight)" }],
        h2: ["var(--text-h2)", { lineHeight: "var(--leading-tight)" }],
        designer: [
          "var(--text-designer)",
          { lineHeight: "var(--leading-tight)" },
        ],
        quote: ["var(--text-quote)", { lineHeight: "var(--leading-quote)" }],
        hero: ["var(--text-hero)", { lineHeight: "var(--leading-tight)" }],
        display: [
          "var(--text-display)",
          { lineHeight: "var(--leading-display)" },
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
