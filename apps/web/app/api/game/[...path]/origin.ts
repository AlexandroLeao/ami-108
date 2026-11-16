import type { NextRequest } from 'next/server';

export function sameOriginMutation(request: NextRequest): boolean {
  const raw = request.headers.get('origin');
  if (!raw || request.headers.get('sec-fetch-site') === 'cross-site') return false;
  try {
    const origin = new URL(raw);
    if (origin.origin !== raw || !['http:', 'https:'].includes(origin.protocol)) return false;
    const configured = process.env.AMI_PUBLIC_ORIGIN;
    if (configured) return origin.origin === new URL(configured).origin;
    // Local Cloud Shell is reverse-proxied; use only the forwarded host in this
    // explicitly gated development environment. Production must configure origin.
    if (process.env.AMI_DEV_PREVIEW !== '1') return false;
    const hosts = [request.nextUrl.host, request.headers.get('host'), request.headers.get('x-forwarded-host')];
    return hosts.some((host) => host === origin.host);
  } catch { return false; }
}

