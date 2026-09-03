import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { getNiosExecutiveData } from '@/lib/nios/executive-center';
import { getLatestDepartamentoReport } from '@/lib/departamento-central/store';
import NiosExecutiveCenter from '@/components/nios/NiosExecutiveCenter';
import DepartamentoCentralSummary from '@/components/nios/DepartamentoCentralSummary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { absolute: '🤖 Departamento Central | Nicaragua Informate' },
  robots: { index: false, follow: false },
};

export default async function AdminNiosPage() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login');
  }

  const [data, report] = await Promise.allSettled([
    getNiosExecutiveData(),
    getLatestDepartamentoReport(),
  ]);

  const executiveData = data.status === 'fulfilled' ? data.value : await getNiosExecutiveData();
  const deptReport = report.status === 'fulfilled' ? report.value : null;

  return (
    <>
      <DepartamentoCentralSummary report={deptReport} />
      <NiosExecutiveCenter data={executiveData} />
    </>
  );
}
