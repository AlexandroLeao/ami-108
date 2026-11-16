import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST, PATCH } from './route';

const context = (path: string) => ({ params: Promise.resolve({ path: [path] }) });
const origin = 'https://game.example.test';
const token = 'A'.repeat(43);
const cookie = 'ami_session=' + token;
const sessionCookie = cookie + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000';
const post = (site = origin) => new NextRequest(origin + '/api/game/session', {
  method: 'POST', headers: { Origin: site, 'Content-Type': 'application/json' }, body: '{"locale":"pt-BR"}',
});

describe('same-origin game facade', () => {
  const upstream = vi.fn();
  beforeEach(() => {
    vi.stubEnv('AMI_DEV_PREVIEW', '1');
    vi.stubEnv('AMI_PUBLIC_ORIGIN', origin);
    vi.stubEnv('API_URL', 'http://api:3001');
    vi.stubGlobal('fetch', upstream);
    upstream.mockReset();
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('blocks cross-origin mutations before contacting the API', async () => {
    const response = await POST(post('https://other.example.test'), context('session'));
    expect(response.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('sets a secure HttpOnly same-origin session cookie on HTTPS', async () => {
    upstream.mockResolvedValue(new Response('{"revision":0}', {
      status: 201, headers: { 'Content-Type': 'application/json', 'Set-Cookie': sessionCookie },
    }));
    const response = await POST(post(), context('session'));
    expect(response.status).toBe(201);
    expect(response.headers.get('set-cookie')).toBe(sessionCookie + '; Secure');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(String(upstream.mock.calls[0][0])).toBe('http://api:3001/game/session');
    expect(await response.json()).toEqual({ revision: 0 });
  });
  it('forwards only the expected session cookie and current asset key', async () => {
    upstream.mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/png' } }));
    const response = await GET(new NextRequest(origin + '/api/game/asset?key=CENA-01', {
      headers: { Cookie: cookie + '; private_other_cookie=secret' },
    }), context('asset'));
    expect(String(upstream.mock.calls[0][0])).toBe('http://api:3001/game/asset?key=CENA-01');
    expect((upstream.mock.calls[0][1].headers as Headers).get('cookie')).toBe(cookie);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });
  it('rejects arbitrary routes, wrong methods, extra keys and production-disabled access', async () => {
    expect((await GET(new NextRequest(origin + '/api/game/catalog'), context('catalog'))).status).toBe(404);
    expect((await GET(new NextRequest(origin + '/api/game/commands'), context('commands'))).status).toBe(405);
    expect((await GET(new NextRequest(origin + '/api/game/asset?key=CENA-01&other=CENA-12'), context('asset'))).status).toBe(404);
    expect((await PATCH(new NextRequest(origin + '/api/game/locale', { method: 'PATCH' }), context('locale'))).status).toBe(403);
    vi.stubEnv('AMI_DEV_PREVIEW', '0');
    expect((await GET(new NextRequest(origin + '/api/game/view'), context('view'))).status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });
});
