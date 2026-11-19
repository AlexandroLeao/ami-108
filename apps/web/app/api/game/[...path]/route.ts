import type { NextRequest } from 'next/server';
import { sameOriginMutation } from './origin';
import { MAX_GAME_BODY_BYTES, readGameBody } from './body';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };
const methods: Readonly<Record<string, string>> = {
  session: 'POST', view: 'GET', commands: 'POST', locale: 'PATCH', asset: 'GET',
};
const noStore = { 'Cache-Control': 'private, no-store' };
const unavailable = () => Response.json({ code: 'SERVICE_UNAVAILABLE', message: 'SERVICE_UNAVAILABLE', requestId: crypto.randomUUID() }, { status: 503, headers: noStore });

async function proxy(request: NextRequest, context: Context) {
  if (process.env.AMI_DEV_PREVIEW !== '1') return new Response(null, { status: 404, headers: noStore });
  const { path } = await context.params;
  const endpoint = path.length === 1 ? path[0] : '';
  if (!Object.hasOwn(methods, endpoint)) return new Response(null, { status: 404, headers: noStore });
  if (methods[endpoint] !== request.method) return new Response(null, { status: 405, headers: noStore });
  if (request.method !== 'GET' && !sameOriginMutation(request)) return new Response(null, { status: 403, headers: noStore });
  const query = request.nextUrl.searchParams;
  if (endpoint !== 'asset' && query.size !== 0) return new Response(null, { status: 400, headers: noStore });
  if (endpoint === 'asset' && (query.size !== 1 || !/^CENA-[0-9]{2}$/.test(query.get('key') ?? ''))) {
    return new Response(null, { status: 404, headers: noStore });
  }
  const headers = new Headers();
  const token = request.cookies.get('ami_session')?.value;
  if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) headers.set('Cookie', 'ami_session=' + token);
  let body: string | undefined;
  if (request.method !== 'GET') {
    if (!request.headers.get('content-type')?.split(';')[0].trim().toLowerCase().match(/^application\/json$/)) {
      return new Response(null, { status: 415, headers: noStore });
    }
    if (Number(request.headers.get('content-length') ?? 0) > MAX_GAME_BODY_BYTES) return new Response(null, { status: 413, headers: noStore });
    const result = await readGameBody(request.body);
    if (!result.ok) return new Response(null, { status: result.status, headers: noStore });
    body = result.body;
    headers.set('Content-Type', 'application/json');
  }
  try {
    const url = new URL('/game/' + endpoint, process.env.API_URL ?? 'http://localhost:3001');
    if (endpoint === 'asset') url.searchParams.set('key', query.get('key') ?? '');
    const upstream = await fetch(url, { method: request.method, headers, body, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    const resultHeaders = new Headers(noStore);
    const type = upstream.headers.get('content-type');
    if (type) resultHeaders.set('Content-Type', type);
    if (endpoint === 'session' && upstream.status === 201) {
      const cookie = upstream.headers.get('set-cookie') ?? '';
      if (!/^ami_session=[A-Za-z0-9_-]{43}; HttpOnly; SameSite=Lax; Path=\/; Max-Age=2592000$/.test(cookie)) {
        await upstream.body?.cancel();
        return unavailable();
      }
      const secure = request.nextUrl.protocol === 'https:' || request.headers.get('origin')?.startsWith('https://');
      resultHeaders.set('Set-Cookie', cookie + (secure ? '; Secure' : ''));
    }
    return new Response(upstream.body, { status: upstream.status, headers: resultHeaders });
  } catch { return unavailable(); }
}
export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
