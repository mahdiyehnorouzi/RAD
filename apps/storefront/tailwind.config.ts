import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rad: {
          canvas: "#eee7dc",
          paper: "#f7f2e9",
          ink: "#18231f",
          mineral: "#263d34",
          oxide: "#8a4938",
          sand: "#cbb892",
        },
      },
      fontFamily: { sans: ["Vazirmatn", "Vazir", "Tahoma", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
