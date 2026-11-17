// Exercise the built Next.js facade and NestJS API against the disposable CI DB.
// No AI provider, browser automation, or cloud deployment is involved.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const manifest = JSON.parse(await readFile(new URL('../apps/api/assets/scenes/manifest.json', import.meta.url), 'utf8'));
assert.equal(manifest.scenes.length, 12);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
for (const scene of manifest.scenes) {
  const bytes = await readFile(new URL('../apps/api/assets/scenes/' + scene.file, import.meta.url));
  assert.equal(sha256(bytes), scene.sha256, scene.id + ' manifest hash');
  assert.equal(bytes.readUInt32BE(16), 1536, scene.id + ' width');
  assert.equal(bytes.readUInt32BE(20), 864, scene.id + ' height');
}
const expectedHashes = new Map(manifest.scenes.map(scene => [scene.id, scene.sha256]));
const webOrigin = 'http://127.0.0.1:3000';
const apiOrigin = 'http://127.0.0.1:3001';
const env = { ...process.env, AMI_DEV_PREVIEW: '1', API_URL: apiOrigin, AMI_PUBLIC_ORIGIN: webOrigin };
const children = [
  spawn(process.execPath, ['dist/main.js'], { cwd: 'apps/api', env, stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3000'], { cwd: 'apps/web', env, stdio: 'inherit' }),
];

async function waitFor(url) {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch { /* startup */ }
    await delay(500);
  }
  throw new Error('Service failed to start: ' + url);
}
let cookie = '';
async function call(endpoint, method = 'GET', body, origin = webOrigin) {
  return fetch(webOrigin + '/api/game/' + endpoint, {
    method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000),
  });
}

try {
  await Promise.all([waitFor(apiOrigin + '/health'), waitFor(webOrigin + '/health')]);
  const home = await fetch(webOrigin);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /AMI-108/);
  assert.equal((await call('view')).status, 401);
  assert.equal((await call('session', 'POST', { locale: 'pt-BR' }, 'https://other.example')).status, 403);
  const created = await call('session', 'POST', { locale: 'pt-BR' });
  assert.equal(created.status, 201);
  const setCookie = created.headers.get('set-cookie');
  assert.match(setCookie, /^ami_session=[A-Za-z0-9_-]{43}; HttpOnly; SameSite=Lax; Path=\/; Max-Age=2592000$/);
  cookie = setCookie.split(';')[0];
  let view = await created.json();
  assert.equal(view.phase, 'CHAPTER_CARD');
  assert.equal(view.asset, null);
  assert.equal((await call('asset?key=CENA-01')).status, 404);
  const verifiedAssets = new Set();
  const verifyCurrentArtwork = async () => {
    if (!view.asset) return;
    const key = new URL(webOrigin + view.asset.url).searchParams.get('key');
    const response = await fetch(webOrigin + view.asset.url, { headers: { Cookie: cookie } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.equal(sha256(Buffer.from(await response.arrayBuffer())), expectedHashes.get(key), key + ' HTTP hash');
    verifiedAssets.add(key);
  };
  const send = async (action) => {
    const body = { commandId: randomUUID(), expectedRevision: view.revision, actionId: action.id };
    const result = await call('commands', 'POST', body);
    assert.equal(result.status, 200);
    const outcome = await result.json();
    assert.equal(outcome.status, 'APPLIED');
    view = outcome.view;
    await verifyCurrentArtwork();
    return body;
  };
  for (let i = 0; i < 4; i++) await send(view.actions[0]);
  assert.equal(view.text, 'Onde eu estou?');
  const asset = await fetch(webOrigin + view.asset.url, { headers: { Cookie: cookie } });
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get('cache-control'), 'private, no-store');
  const pixels = Buffer.from(await asset.arrayBuffer());
  assert.equal(pixels.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const body = await send(view.actions[0]);
  assert.equal(view.text, 'Sangue...?');
  assert.deepEqual(Buffer.from(await (await fetch(webOrigin + view.asset.url, { headers: { Cookie: cookie } })).arrayBuffer()), pixels);
  const replay = await (await call('commands', 'POST', body)).json();
  assert.equal(replay.status, 'REPLAYED');
  assert.equal(replay.view.revision, view.revision);
  assert.equal((await call('asset?key=CENA-12')).status, 404);
  const translated = await call('locale', 'PATCH', { commandId: randomUUID(), expectedRevision: view.revision, locale: 'en' });
  assert.equal(translated.status, 200);
  view = (await translated.json()).view;
  assert.equal(view.text, 'Blood...?');
  assert.deepEqual(await (await call('view')).json(), view);
  const resumed = await fetch(webOrigin, { headers: { Cookie: cookie } });
  assert.equal(resumed.status, 200);
  for (let i = 0; i < 90 && view.phase !== 'ENCOUNTER'; i++) {
    await send(view.actions.find(action => action.kind === 'CONTINUE' || action.kind === 'INTERACT'));
  }
  assert.equal(view.phase, 'ENCOUNTER');
  assert.equal(view.actions.filter(action => action.kind === 'CHOOSE').length, 4);
  assert.equal((await call('asset?key=CENA-04')).status, 200);
  assert.equal((await call('asset?key=CENA-05')).status, 404);
  await send(view.actions.find(action => action.kind === 'CONSULT'));
  assert.equal(view.diagnostics.energy, 2);
  for (let i = 0; i < 4 && view.phase !== 'ENCOUNTER'; i++) await send(view.actions[0]);
  await send(view.actions.find(action => action.id === 'DOG-01'));
  assert.equal(view.phase, 'DEAD');
  await send(view.actions[0]);
  await send(view.actions.find(action => action.kind === 'RETRY'));
  assert.equal(view.diagnostics.energy, 3);
  for (let i = 0; i < 12 && view.phase !== 'ENCOUNTER'; i++) await send(view.actions[0]);
  await send(view.actions.find(action => action.id === 'DOG-04'));
  for (let i = 0; i < 60 && view.chapter !== 3; i++) await send(view.actions[0]);
  assert.equal(view.chapter, 3);
  assert.deepEqual(view.diagnostics, { energy: 3, med: 35, bio: 42, hist: 53, personal: 5, personalUnlocked: false });
  assert.deepEqual([...verifiedAssets].sort(), ['CENA-01', 'CENA-02', 'CENA-03', 'CENA-04', 'CENA-05']);
  console.log('Built Next.js/NestJS smoke passed: session, origin guard, commands, 12 manifest hashes and stable HTTP artwork bytes for all 5 reached assets, locale, resume, dog encounter and Chapter 2 boundary.');
} finally {
  for (const child of children) child.kill('SIGTERM');
}
