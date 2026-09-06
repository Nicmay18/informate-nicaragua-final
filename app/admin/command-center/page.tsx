import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { getSwissWatchBoard } from '@/lib/nios/swiss-watch';
import SwissWatchBoard from '@/components/nios/SwissWatchBoard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { absolute: 'NIOS Command Center | Nicaragua Informate' },
  robots: { index: false, follow: false },
};

export default async function CommandCenterPage() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login');
  }

  const board = await getSwissWatchBoard();

  return <SwissWatchBoard board={board} />;
}
