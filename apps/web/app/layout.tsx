import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@fontsource/vt323/400.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'AMI-108',
  description: 'Narrative survival game — development foundation',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
