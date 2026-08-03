import type { Metadata } from 'next';
import { getCommandCenter } from '@/lib/nios/command-center';
import CommandCenterShell from '@/components/nios/command-center/CommandCenterShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { absolute: 'NIOS Business Command Center | Nicaragua Informate' },
  robots: { index: false, follow: false },
};

export default async function AdminNiosPage() {
  const cc = await getCommandCenter();
  return <CommandCenterShell cc={cc} />;
}
