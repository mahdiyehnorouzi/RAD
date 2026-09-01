import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appRoot, "../..");

/** @type {import('next').NextConfig} */
export default {
  transpilePackages: ["@rad/ui", "@rad/types"],
  turbopack: { root: monorepoRoot },
};
