import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel Editorial | Nicaragua Informate',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
