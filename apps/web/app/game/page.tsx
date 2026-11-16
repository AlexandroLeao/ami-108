import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { CampaignGame } from './campaign-game';

export const dynamic = 'force-dynamic';

export default async function GamePage() {
  if (process.env.AMI_DEV_PREVIEW !== '1') notFound();
  const token = (await cookies()).get('ami_session')?.value;
  let hasSave = false;
  if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
    try {
      const response = await fetch(new URL('/game/view', process.env.API_URL ?? 'http://localhost:3001'), {
        headers: { Cookie: 'ami_session=' + token }, cache: 'no-store', signal: AbortSignal.timeout(3500),
      });
      hasSave = response.ok;
      await response.body?.cancel();
    } catch { /* Keep the menu usable; no saved game is claimed without server confirmation. */ }
  }
  return <CampaignGame initialHasSave={hasSave} />;
}
