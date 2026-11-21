// Fail-closed Vercel Services routing guard, independent of a Vercel login.
// This verifies only repository configuration; it is NOT a deployment smoke test.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
const services = config.services;
assert.deepEqual(Object.keys(services).sort(), ['ai', 'api', 'web']);
assert.deepEqual(Object.keys(config).sort(), ['$schema', 'rewrites', 'services']);
for (const [name, expectedRoot] of [['web', 'apps/web'], ['api', 'apps/api'], ['ai', 'services/ai']]) {
  const service = services[name];
  assert.equal(service.root, expectedRoot);
  assert.ok(existsSync(resolve(root, expectedRoot)), name + ' must be a real directory');
  assert.ok(!('routePrefix' in service), 'Do not use legacy prefix routing');
}
assert.equal(services.web.framework, 'nextjs');
assert.equal(services.api.framework, 'nestjs');
// Vercel Services pnpm workspace: dist/main.js flattened to /var/task/main.js
// at runtime loses module resolution for reflect-metadata and Nest dependencies.
// Keep the source entrypoint rooted in apps/api so its dependency links are traced.
assert.equal(services.api.entrypoint, 'src/main.ts');
assert.equal(services.api.outputDirectory, '.');
assert.ok(existsSync(resolve(root, 'apps/api/src/main.ts')));
assert.equal(services.ai.framework, 'fastapi');
assert.equal(services.ai.entrypoint, 'app.main:app');
assert.deepEqual(services.web.bindings, [
  { type: 'service', service: 'api', format: 'url', env: 'API_URL' },
]);
assert.deepEqual(services.api.bindings, [
  { type: 'service', service: 'ai', format: 'url', env: 'AI_SERVICE_URL' },
]);
assert.equal(services.ai.bindings, undefined);
assert.deepEqual(config.rewrites, [
  { source: '/(.*)', destination: { service: 'web' } },
]);
assert.ok(!JSON.stringify(config).includes('AMI_DEV_PREVIEW'));
assert.ok(!JSON.stringify(config).includes('AMI_GROQ_API_KEY'));
console.log('Vercel Services configuration: only Web is publicly routed; API/AI use private bindings.');
