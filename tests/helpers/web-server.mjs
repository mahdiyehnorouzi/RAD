import next from 'next';
import { createServer } from 'node:http';
import path from 'node:path';
const [app, port] = process.argv.slice(2);
const dir = path.resolve('apps', app);
const { default: conf } = await import(path.join(dir, 'next.config.mjs'));
const server = next({ dev: true, dir, conf: { ...conf, distDir: '.next-qa' }, hostname: '127.0.0.1', port: Number(port) });
await server.prepare();
createServer(server.getRequestHandler()).listen(Number(port), '127.0.0.1');
