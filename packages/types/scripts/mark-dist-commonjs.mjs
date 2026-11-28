import { writeFileSync } from "node:fs";

const packageJsonPath = new URL("../dist/package.json", import.meta.url);
writeFileSync(packageJsonPath, '{ "type": "commonjs" }\n');
