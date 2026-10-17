// Disposable QA stack. Never reads a database URL or credentials from the caller.
import { createRequire } from 'node:module';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
const root = path.resolve(import.meta.dirname, '../..');
const require = createRequire(path.join(root, 'apps/api/package.json'));
const EmbeddedPostgres = require('embedded-postgres').default;
const { hash } = require('bcryptjs');
const { createAppDataSource } = require('../../apps/api/dist/database/data-source.js');
const { Product, User } = require('../../apps/api/dist/database/entities/index.js');
const env = { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR, NODE_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1' };
// Prevent framework dotenv loaders from activating any developer credentials.
for (const app of ['api', 'storefront', 'admin']) {
  const dir = path.join(root, 'apps', app);
  for (const file of (await readdir(dir)).filter(n => /^\.env($|\.)/.test(n))) {
    for (const match of (await readFile(path.join(dir, file), 'utf8')).matchAll(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)) env[match[1]] = '';
  }
}
Object.assign(env, { NODE_ENV: 'development', API_URL: 'http://127.0.0.1:4400', JWT_SECRET: 'rad-isolated-qa-only-secret-not-for-production', TYPEORM_SYNCHRONIZE: 'false', HOST: '127.0.0.1', PORT: '4400', PAYMENT_PROVIDER: 'manual', SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '', CLOUDINARY_URL: '', STOREFRONT_ORIGIN: 'http://127.0.0.1:3300' });
const probe = createServer();
probe.listen(0, '127.0.0.1');
await once(probe, 'listening');
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const databaseDir = await mkdtemp(path.join(tmpdir(), 'rad-e2e-'));
const pg = new EmbeddedPostgres({ databaseDir, user: 'rad', password: 'rad', port, persistent: false, onLog() {}, onError() {} });
let ds;
const children = [];
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  await Promise.all(children.map(async child => {
    if (child.exitCode !== null) return;
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
    await exited;
    clearTimeout(timer);
  }));
  if (ds?.isInitialized) await ds.destroy();
  await pg.stop().catch(() => {});
  await rm(databaseDir, { recursive: true, force: true });
  process.exit(code);
}
process.on('SIGTERM', () => void stop());
process.on('SIGINT', () => void stop());
function start(args) {
  const child = spawn(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
  children.push(child);
  child.on('exit', code => { if (!stopping) void stop(code || 1); });
  return child;
}
try {
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('rad_qa');
  env.DATABASE_URL = `postgresql://rad:rad@127.0.0.1:${port}/rad_qa`;
  ds = createAppDataSource({ url: env.DATABASE_URL, synchronize: true });
  await ds.initialize();
  const passwordHash = await hash('QaOnly123456!', 10);
  for (const [id, adminRole] of [['qa-owner', 'owner'], ['qa-viewer', 'viewer'], ['qa-customer', null]]) {
    await ds.getRepository(User).save({ id, name: id, email: `${id}@example.test`, passwordHash, role: adminRole ? 'admin' : 'customer', adminRole, status: 'active' });
  }
  for (let i = 0; i < 80; i++) {
    await ds.getRepository(Product).save({ slug: `qa-work-${i}`, name: `اثر آزمایشی ${i}`, subtitle: 'تنها یک نسخه', tomanPrice: 1200000, usdPrice: 20, color: '#8a4938', accent: '#ead9bd', shape: 'tall', category: 'ceramics', status: i === 79 ? 'sold' : 'available', story: 'QA isolated fixture', details: ['تنها یک نسخه'], en: { name: `QA work ${i}`, subtitle: 'One of one', story: 'QA fixture', details: [] } });
  }
  await ds.destroy();
  start(['apps/api/dist/main.js']);
  if (!process.argv.includes('--api-only')) {
    start(['tests/helpers/web-server.mjs', 'storefront', '3300']);
    start(['tests/helpers/web-server.mjs', 'admin', '3302']);
  }
} catch (error) {
  console.error(error);
  await stop(1);
}
