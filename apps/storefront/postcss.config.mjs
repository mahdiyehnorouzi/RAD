import { fileURLToPath } from "node:url";

// Next.js resolves plugin names from its own package, so local files need absolute paths.
// Turbopack only maps import.meta.url correctly in the literal new URL("./file", import.meta.url) form.
const breakpoints = fileURLToPath(
  new URL("./styles/postcss-breakpoints.cjs", import.meta.url),
);
const tokens = fileURLToPath(new URL("./styles/tokens.css", import.meta.url));

export default {
  plugins: {
    [breakpoints]: { tokens },
    "postcss-custom-media": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
