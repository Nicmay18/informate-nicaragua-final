import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';
import { listarNegociosPublicos } from '@/lib/negocios/datos';
import { CATEGORIAS_NEGOCIO, DEPARTAMENTOS_NI, type PublicNegocio } from '@/lib/negocios/modelo';
import { MapPin, Search, Store } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Negocios en Nicaragua | Nicaragua Informate' },
  description: 'Directorio de negocios y servicios en Nicaragua: restaurantes, salud, tecnología, ferretería, turismo y más. Contacto directo por WhatsApp.',
  alternates: { canonical: 'https://nicaraguainformate.com/negocios' },
  robots: { index: true, follow: true },
};

const getCachedNegocios = listarNegociosPublicos;

function Badge({ piloto }: { piloto: boolean }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 6, padding: '2px 6px' }}>
      {piloto ? 'PILOTO GRATUITO' : 'PATROCINADO'}
    </span>
  );
}

function Card({ n }: { n: PublicNegocio }) {
  return (
    <Link
      href={`/negocios/${n.slug}`}
      style={{ display: 'block', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.1rem', textDecoration: 'none', background: n.destacado ? '#fffbeb' : '#fff' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{n.nombre}</h2>
        {n.patrocinado && <Badge piloto={n.piloto} />}
      </div>
      <p style={{ color: '#475569', fontSize: '.88rem', lineHeight: 1.55, margin: '8px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {n.descripcion}
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#64748b' }}>
        <span>{n.categoria}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={12} /> {n.municipio ? `${n.municipio}, ` : ''}{n.departamento}
        </span>
      </div>
    </Link>
  );
}

export default async function NegociosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; departamento?: string; q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || '').trim().toLowerCase().slice(0, 80);
  const categoria = params.categoria || '';
  const departamento = params.departamento || '';

  let items = await getCachedNegocios();
  if (categoria) items = items.filter((n) => n.categoria === categoria);
  if (departamento) items = items.filter((n) => n.departamento === departamento);
  if (q) items = items.filter((n) => `${n.nombre} ${n.descripcion} ${n.municipio}`.toLowerCase().includes(q));

  const select: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    fontSize: 14,
    background: '#fff',
    maxWidth: '100%',
  };

  return (
    <LegalPageShell title="Negocios en Nicaragua">
      <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1.25rem' }}>
        Directorio de negocios y servicios con perfiles revisados antes de publicarse.
        Los perfiles marcados como <strong>patrocinados</strong> son contenido comercial,
        claramente identificado, que no influye en la cobertura editorial.
      </p>

      {/* Búsqueda y filtros — GET form, mobile-first, sin JS de cliente */}
      <form method="get" action="/negocios" style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="search"
            name="q"
            defaultValue={params.q || ''}
            placeholder="Buscar negocio o servicio…"
            aria-label="Buscar negocio"
            style={{ ...select, flex: 1 }}
          />
          <button type="submit" style={{ ...select, background: 'var(--accent, #0369a1)', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Search size={16} /> Buscar
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select name="categoria" defaultValue={categoria} aria-label="Filtrar por categoría" style={{ ...select, flex: 1, minWidth: 150 }}>
            <option value="">Todas las categorías</option>
            {CATEGORIAS_NEGOCIO.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="departamento" defaultValue={departamento} aria-label="Filtrar por departamento" style={{ ...select, flex: 1, minWidth: 150 }}>
            <option value="">Todos los departamentos</option>
            {DEPARTAMENTOS_NI.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </form>

      {items.length === 0 ? (
        <div style={{ border: '1px dashed #cbd5e1', borderRadius: 14, padding: '2.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
          <Store size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
          <p style={{ margin: 0 }}>
            {!q && !categoria && !departamento
              ? 'Estamos abriendo el directorio. ¿Tenés un negocio?'
              : 'No encontramos negocios con esos filtros.'}
          </p>
          <Link href="/negocios/alta" style={{ color: 'var(--accent, #0369a1)', fontWeight: 600 }}>
            Solicitá el alta de tu negocio →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {items.map((n) => <Card key={n.id} n={n} />)}
        </div>
      )}

      <p style={{ marginTop: '2rem', fontSize: '.85rem', color: '#64748b' }}>
        ¿Tenés un negocio? <Link href="/negocios/alta" style={{ color: 'var(--accent, #0369a1)', fontWeight: 600 }}>Dalo de alta</Link> o
        revisá los <Link href="/publicidad" style={{ color: 'var(--accent, #0369a1)', fontWeight: 600 }}>planes comerciales</Link>.
      </p>
    </LegalPageShell>
  );
}
