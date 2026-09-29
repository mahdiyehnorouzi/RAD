import { fileURLToPath } from "node:url";

export default {
  plugins: {
    "@csstools/postcss-global-data": {
      files: [fileURLToPath(new URL("./styles/tokens.css", import.meta.url))],
    },
    "postcss-custom-media": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
