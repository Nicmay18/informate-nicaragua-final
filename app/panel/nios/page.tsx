import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';
import { getNiosExecutiveData } from '@/lib/nios/executive-center';
import { getLatestDepartamentoReport } from '@/lib/departamento-central/store';
import { getDepartamentoWorkSummary } from '@/lib/departamento-central/summary';
import NiosExecutiveCenter from '@/components/nios/NiosExecutiveCenter';
import DepartamentoCentralSummary from '@/components/nios/DepartamentoCentralSummary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { absolute: 'NIOS | Panel' },
  robots: { index: false, follow: false },
};

const NIOS_SECTIONS: { href: string; label: string }[] = [
  { href: '/panel/nios/performance', label: 'Crecimiento' },
  { href: '/panel/nios/editorial-strategy', label: 'Estrategia Editorial' },
  { href: '/panel/nios/weekly', label: 'Semanal' },
  { href: '/panel/nios/recovery', label: 'Recovery' },
  { href: '/panel/nios/google-intelligence', label: 'Google Intelligence' },
  { href: '/panel/nios/adsense-recovery', label: 'AdSense Recovery' },
  { href: '/panel/nios/adsense-report', label: 'AdSense Report' },
  { href: '/panel/nios/reparaciones', label: 'Reparaciones' },
  { href: '/panel/nios/command-center', label: 'Command Center' },
];

export default async function PanelNiosPage() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login');
  }

  const [data, report, summary] = await Promise.allSettled([
    getNiosExecutiveData(),
    getLatestDepartamentoReport(),
    getDepartamentoWorkSummary(),
  ]);

  const executiveData = data.status === 'fulfilled' ? data.value : await getNiosExecutiveData();
  const deptReport = report.status === 'fulfilled' ? report.value : null;
  const workSummary = summary.status === 'fulfilled' ? summary.value : null;

  return (
    <>
      <nav className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 pt-6">
        {NIOS_SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            {s.label}
          </Link>
        ))}
      </nav>
      <DepartamentoCentralSummary report={deptReport} summary={workSummary} />
      <NiosExecutiveCenter data={executiveData} />
    </>
  );
}
