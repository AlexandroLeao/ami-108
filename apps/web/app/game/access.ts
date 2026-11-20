// Explicit public-release gate. The accepted Cloud Shell preview is unchanged.
export type GameMode = 'disabled' | 'local' | 'public';

export function securePublicOrigin(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && u.origin === raw && !u.username && !u.password;
  } catch { return false; }
}

export function gameMode(env: Readonly<Record<string, string | undefined>> = process.env): GameMode {
  if (env.VERCEL !== '1') return env.AMI_DEV_PREVIEW === '1' ? 'local' : 'disabled';
  // Never use the development flag on a public Vercel deployment.
  if (env.AMI_DEV_PREVIEW === '1') return 'disabled';
  if (
    env.NODE_ENV === 'production' && env.AMI_PUBLIC_GAME === '1' &&
    securePublicOrigin(env.AMI_PUBLIC_ORIGIN) && !!env.API_URL &&
    (env.AMI_API_INTERNAL_TOKEN?.length ?? 0) >= 32
  ) return 'public';
  return 'disabled';
}
