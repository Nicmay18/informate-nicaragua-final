import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { isAuthenticatedAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Admin | Nicaragua Informate', template: '%s | Admin' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/login');
  }

  return <>{children}</>;
}
