import type { Metadata } from 'next';
import NegocioShell from '@/components/NegocioShell';
import NegocioAltaForm from '@/components/NegocioAltaForm';

export const metadata: Metadata = {
  title: { absolute: 'Registrá tu negocio | Nicaragua Informate Negocios' },
  description: 'Dá de alta tu negocio en el directorio de Nicaragua Informate. Toda publicación pasa por revisión editorial antes de mostrarse.',
  alternates: { canonical: 'https://nicaraguainformate.com/negocios/alta' },
  robots: { index: true, follow: true },
};

export default async function NegocioAltaPage({ searchParams }: { searchParams: Promise<{ corregir?: string; nombre?: string }> }) {
  const params = await searchParams;
  return (
    <NegocioShell title="Registrá tu negocio">
      <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1.25rem' }}>
        Completá el formulario y nuestro equipo revisará la información antes de
        publicar el perfil. También podés usarlo para solicitar correcciones a un
        perfil existente.
      </p>
      <NegocioAltaForm negocioId={params.corregir || ''} nombre={params.nombre || ''} />
    </NegocioShell>
  );
}
