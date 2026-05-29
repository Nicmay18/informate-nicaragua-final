import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Publicidad y alianzas',
  description: 'Opciones de publicidad, patrocinios y alianzas comerciales en Nicaragua Informate. Medio digital con cobertura nacional y audiencia nicaraguense.',
  alternates: { canonical: 'https://nicaraguainformate.com/publicidad' },
  robots: { index: true, follow: true },
};

export default function PublicidadPage() {
  return (
    <LegalPageShell title="Publicidad y alianzas">
      <p style={{ marginBottom: '1rem' }}>
        Nicaragua Informate ofrece espacios comerciales para marcas, instituciones y emprendimientos que buscan llegar a una audiencia nicaraguense interesada en noticias, servicios y actualidad nacional.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', marginTop: '2rem', marginBottom: '.75rem', fontWeight: 700 }}>Formatos disponibles</h2>
      <ul style={{ paddingLeft: '1.25rem', marginBottom: '1rem' }}>
        <li>Banners display en portada, categorias y articulos.</li>
        <li>Patrocinios editoriales identificados de forma transparente.</li>
        <li>Campanas por temporada, eventos, servicios locales y marcas nacionales.</li>
        <li>Integracion con plataformas publicitarias verificadas como Google AdSense.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', marginTop: '2rem', marginBottom: '.75rem', fontWeight: 700 }}>Politica comercial</h2>
      <p style={{ marginBottom: '1rem' }}>
        La publicidad no influye en nuestras decisiones editoriales. Todo contenido patrocinado debe estar identificado y cumplir nuestras politicas de privacidad, cookies y estandares de calidad.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', marginTop: '2rem', marginBottom: '.75rem', fontWeight: 700 }}>Contacto</h2>
      <p>
        Para tarifas, disponibilidad y propuestas comerciales, escribe a{' '}
        <a href="mailto:publicidad@nicaraguainformate.com" style={{ color: '#93c5fd', textDecoration: 'underline' }}>publicidad@nicaraguainformate.com</a>{' '}
        o visita la pagina de <Link href="/contacto" style={{ color: '#93c5fd', textDecoration: 'underline' }}>contacto</Link>.
      </p>
    </LegalPageShell>
  );
}
