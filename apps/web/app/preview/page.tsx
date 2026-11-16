import { notFound } from 'next/navigation';
import { GamePreview } from './game-preview';

export const dynamic = 'force-dynamic';

export default async function PreviewPage() {
  if (process.env.AMI_DEV_PREVIEW !== '1') notFound();

  const origin = process.env.API_URL ?? 'http://localhost:3001';
  let imageAvailable = false;
  try {
    const result = await fetch(new URL('/development/scene', origin), {
      cache: 'no-store', signal: AbortSignal.timeout(3500),
    });
    imageAvailable = result.ok && result.headers.get('content-type')?.startsWith('image/png') === true;
    await result.body?.cancel();
  } catch {
    // Keep the visual preview usable when the approved local asset is missing.
  }
  return <GamePreview imageAvailable={imageAvailable} />;
}
