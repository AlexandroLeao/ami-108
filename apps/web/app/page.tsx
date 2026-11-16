import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function isApiReady(): Promise<boolean> {
  const origin = process.env.API_URL ?? 'http://localhost:3001';
  try {
    const response = await fetch(new URL('/health/ready', origin), {
      cache: 'no-store', signal: AbortSignal.timeout(3500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default async function Home() {
  const ready = await isApiReady();
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 p-8">
      <p className="text-sm uppercase tracking-[0.25em]">Development foundation</p>
      <h1 className="text-6xl font-bold tracking-tight sm:text-8xl">AMI<span className="text-[#fc2721]">-108</span></h1>
      <p>System initialization — narrative engine pending.</p>
      <p role="status" className="border border-[#fdf3e9] p-4">{ready ? 'API, database and AI service reachable.' : 'Backend not ready. Check service logs.'}</p>
      {process.env.AMI_DEV_PREVIEW === '1' && (
        <Link href="/preview" className="game-control self-start">Open development preview</Link>
      )}
    </main>
  );
}
