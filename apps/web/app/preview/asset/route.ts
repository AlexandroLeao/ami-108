export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.AMI_DEV_PREVIEW !== '1') return new Response(null, { status: 404 });

  const origin = process.env.API_URL ?? 'http://localhost:3001';
  try {
    const result = await fetch(new URL('/development/scene', origin), {
      cache: 'no-store', signal: AbortSignal.timeout(3500),
    });
    if (!result.ok || !result.headers.get('content-type')?.startsWith('image/png')) {
      await result.body?.cancel();
      return new Response(null, { status: 404 });
    }
    return new Response(result.body, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
