import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cpSync, mkdtempSync, mkdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

const repoRoot = path.resolve(__dirname, "../../..");

function run(command: string, args: string[], cwd: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`${command} ${args.join(" ")} exited with code ${code}`),
        );
    });
  });
}

/**
 * The VPS runs `node dist/main.js` with NODE_ENV=production from the extracted
 * artifact. `@rad/types` must load through that Node process, not through tsx
 * or the monorepo checkout.
 */
test("extracted API artifact resolves @rad/types without loading its TypeScript source", async () => {
  await run("npm", ["run", "build", "--workspace", "@rad/api"], repoRoot);
  const root = realpathSync(
    mkdtempSync(path.join(tmpdir(), "rad-api-artifact-")),
  );
  const typesDest = path.join(root, "node_modules", "@rad", "types");
  const apiDest = path.join(root, "apps", "api");
  mkdirSync(path.dirname(typesDest), { recursive: true });
  mkdirSync(apiDest, { recursive: true });
  cpSync(
    path.join(repoRoot, "packages/types/package.json"),
    path.join(typesDest, "package.json"),
  );
  cpSync(
    path.join(repoRoot, "packages/types/dist"),
    path.join(typesDest, "dist"),
    { recursive: true },
  );
  cpSync(
    path.join(repoRoot, "packages/types/src"),
    path.join(typesDest, "src"),
    { recursive: true },
  );
  cpSync(path.join(repoRoot, "apps/api/dist"), path.join(apiDest, "dist"), {
    recursive: true,
  });
  cpSync(
    path.join(repoRoot, "apps/api/package.json"),
    path.join(apiDest, "package.json"),
  );
  try {
    const env = {
      PATH: process.env.PATH,
      NODE_ENV: "production",
      TYPEORM_SYNCHRONIZE: "false",
      JWT_SECRET: "artifact-runtime-test-secret-32ch",
      DATABASE_URL: "postgresql://rad:rad@127.0.0.1:9/rad_artifact_runtime",
      NODE_PATH: path.join(repoRoot, "node_modules"),
    };
    const loaded = await new Promise<{ code: number | null; text: string }>(
      (resolve, reject) => {
        const child = spawn(
          process.execPath,
          [
            "-e",
            "const resolved = require.resolve('@rad/types'); if (!resolved.includes(process.env.ARTIFACT_ROOT)) { console.error(resolved); process.exit(2); } const types = require('@rad/types'); require('./dist/identities/identities.service.js'); if (types.formatRadCode(84) !== '084') process.exit(3);",
          ],
          {
            cwd: apiDest,
            env: { ...env, ARTIFACT_ROOT: root },
            stdio: ["ignore", "pipe", "pipe"],
          },
        );
        let text = "";
        child.stdout.on("data", (chunk) => {
          text += chunk.toString();
        });
        child.stderr.on("data", (chunk) => {
          text += chunk.toString();
        });
        child.on("error", reject);
        child.on("exit", (code) => resolve({ code, text }));
      },
    );
    assert.equal(loaded.code, 0, loaded.text);
    assert.equal(
      loaded.text.includes("ERR_MODULE_NOT_FOUND"),
      false,
      loaded.text,
    );

    const started = await new Promise<{ code: number | null; text: string }>(
      (resolve, reject) => {
        const child = spawn(process.execPath, ["dist/main.js"], {
          cwd: apiDest,
          env,
          stdio: ["ignore", "pipe", "pipe"],
        });
        let text = "";
        const stop = () => {
          if (child.exitCode === null && child.signalCode === null)
            child.kill("SIGTERM");
        };
        const timer = setTimeout(stop, 15_000);
        const onData = (chunk: Buffer) => {
          text += chunk.toString();
          if (
            text.includes("Starting Nest application") ||
            text.includes("ERR_MODULE_NOT_FOUND")
          )
            stop();
        };
        child.stdout.on("data", onData);
        child.stderr.on("data", onData);
        child.on("error", reject);
        child.on("exit", (code) => {
          clearTimeout(timer);
          resolve({ code, text });
        });
      },
    );
    assert.equal(
      started.text.includes("ERR_MODULE_NOT_FOUND"),
      false,
      started.text,
    );
    assert.equal(
      started.text.includes("packages/types/src/artwork"),
      false,
      started.text,
    );
    assert.match(started.text, /Starting Nest application/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
