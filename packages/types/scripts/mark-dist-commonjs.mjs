import { writeFileSync } from "node:fs";

writeFileSync(new URL("../dist/package.json", import.meta.url), '{ "type": "commonjs" }\n');
