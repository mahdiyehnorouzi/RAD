import { spawn } from "node:child_process";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function main() {
  await run("npx", ["prisma", "db", "push"]);
  if (process.env.RUN_SEED === "true") {
    await run("npx", ["prisma", "db", "seed"]);
  }
  await run(process.execPath, ["dist/main.js"]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
