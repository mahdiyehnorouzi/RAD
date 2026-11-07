import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export interface E2eRuntimeState {
  apiUrl: string;
  storefrontUrl: string;
  gatewayUrl: string;
  databaseUrl: string;
  pids: { api: number; storefront: number };
  pgDataDir: string;
}

// Anchored at process.cwd(), not __dirname — see the comment on E2E_DIR in
// global-setup.ts. Spec files and global-setup both run with cwd at the
// repo root under `npm run test:e2e`.
const STATE_PATH = path.join(process.cwd(), "e2e", ".runtime", "state.json");

export function writeRuntimeState(state: E2eRuntimeState) {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export function readRuntimeState(): E2eRuntimeState {
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}

export { STATE_PATH };
