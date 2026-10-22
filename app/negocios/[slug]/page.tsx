import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import NegocioShell from '@/components/NegocioShell';
import NegocioContacto from '@/components/NegocioContacto';
import NegocioVista from '@/components/NegocioVista';
import { getNegocioPublicoBySlug } from '@/lib/negocios/datos';
import { escapeJsonLd } from '@/lib/jsonld';
import { MapPin, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

const getCached = getNegocioPublicoBySlug;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const n = await getCached(slug);
  if (!n) return { title: 'Negocio no encontrado' };
  return {
    title: { absolute: `${n.nombre} — ${n.categoria} en ${n.departamento} | Nicaragua Informate` },
    description: n.descripcion.slice(0, 155),
    alternates: { canonical: `https://nicaraguainformate.com/negocios/${n.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: n.nombre,
      description: n.descripcion.slice(0, 155),
      type: 'website',
      images: n.fotos.slice(0, 1),
    },
  };
}

export default async function NegocioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = await getCached(slug);
  if (!n) notFound();

  const localBusinessLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: n.nombre,
    description: n.descripcion.slice(0, 300),
    url: `https://nicaraguainformate.com/negocios/${n.slug}`,
    image: n.fotos.length ? n.fotos : undefined,
    telephone: n.telefono || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: n.municipio || undefined,
      addressRegion: n.departamento,
      addressCountry: 'NI',
      streetAddress: n.direccion || undefined,
    },
  };

  return (
    <NegocioShell title={n.nombre}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(localBusinessLd) }}
      />
      <NegocioVista negocioId={n.id} slug={n.slug} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 13, color: '#64748b', marginBottom: '1rem' }}>
        <span style={{ background: '#f1f5f9', borderRadius: 6, padding: '3px 8px' }}>{n.categoria}</span>
        {n.patrocinado && (
          <span style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', borderRadius: 6, padding: '3px 8px', fontWeight: 700 }}>
            {n.piloto ? 'PILOTO GRATUITO' : 'PATROCINADO'}
          </span>
        )}
      </div>

      {n.fotos.length > 0 && (
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', marginBottom: '1.25rem' }}>
          {n.fotos.map((f) => (
            <img key={f} src={f} alt={n.nombre} loading="lazy" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 10 }} />
          ))}
        </div>
      )}

      <p style={{ color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{n.descripcion}</p>

      <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.25rem', margin: '1.5rem 0', background: '#f8fafc' }}>
        <h2 style={{ fontSize: '1rem', margin: '0 0 12px', color: '#0f172a' }}>Contacto y ubicación</h2>
        <NegocioContacto negocio={n} />
        <div style={{ marginTop: 14, display: 'grid', gap: 6, fontSize: 14, color: '#475569' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} />
            {[n.direccion, n.municipio, n.departamento].filter(Boolean).join(', ') || n.departamento}
          </span>
          {n.horario && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> {n.horario}
            </span>
          )}
          {n.email && <span>{n.email}</span>}
        </div>
      </div>

      <p style={{ fontSize: '.85rem', color: '#64748b' }}>
        ¿La información está desactualizada? <Link href={`/negocios/alta?corregir=${encodeURIComponent(n.id)}&nombre=${encodeURIComponent(n.nombre)}`} style={{ color: 'var(--accent, #0369a1)' }}>Solicitá una corrección</Link>.
        {' '}<Link href="/negocios" style={{ color: 'var(--accent, #0369a1)' }}>← Ver más negocios</Link>
      </p>
      {n.patrocinado && (
        <p style={{ fontSize: '.78rem', color: '#94a3b8', marginTop: 8 }}>
          {n.piloto ? 'Piloto gratuito por tiempo limitado: no representa un pago recibido.' : 'Perfil patrocinado: contenido comercial identificado.'} Independiente de la cobertura editorial.
        </p>
      )}
    </NegocioShell>
  );
}
