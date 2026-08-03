import type { Metadata } from 'next';
import { getCommandCenter } from '@/lib/nios/command-center';
import NiosCeoShell from '@/components/nios/NiosCeoShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { absolute: 'NIOS CEO | Nicaragua Informate' },
  robots: { index: false, follow: false },
};

export default async function AdminNiosPage() {
  const cc = await getCommandCenter();
  return <NiosCeoShell cc={cc} />;
}
