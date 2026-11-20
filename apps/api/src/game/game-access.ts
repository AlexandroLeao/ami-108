// The local preview is not a public deployment switch.
export type GameMode = 'disabled' | 'local' | 'public';
export function gameMode(env: Readonly<Record<string, string | undefined>> = process.env): GameMode {
  if (env.VERCEL !== '1') return env.AMI_DEV_PREVIEW === '1' ? 'local' : 'disabled';
  if (env.AMI_DEV_PREVIEW === '1') return 'disabled';
  let validOrigin = false;
  try {
    const raw = env.AMI_PUBLIC_ORIGIN;
    if (raw) {
      const u = new URL(raw);
      validOrigin = u.protocol === 'https:' && u.origin === raw && !u.username && !u.password;
    }
  } catch { /* fail closed */ }
  if (
    env.NODE_ENV === 'production' && env.AMI_PUBLIC_GAME === '1' &&
    validOrigin && (env.AMI_API_INTERNAL_TOKEN?.length ?? 0) >= 32
  ) return 'public';
  return 'disabled';
}
