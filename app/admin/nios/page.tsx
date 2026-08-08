import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { getNiosExecutiveData } from '@/lib/nios/executive-center';
import NiosExecutiveCenter from '@/components/nios/NiosExecutiveCenter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { absolute: 'NIOS — Centro de Inteligencia | Admin' },
  robots: { index: false, follow: false },
};

export default async function AdminNiosPage() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login');
  }

  const data = await getNiosExecutiveData();

  return <NiosExecutiveCenter data={data} />;
}
