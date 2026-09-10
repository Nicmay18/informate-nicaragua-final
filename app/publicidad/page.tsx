import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';
import { Megaphone, Users, Globe, TrendingUp, Mail, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: 'Publicidad y alianzas comerciales | Nicaragua Informate' },
  description: 'Conectá tu marca con la audiencia de Nicaragua Informate. Medio digital independiente con cobertura nacional e internacional: publicidad digital, contenido patrocinado, campañas digitales y alianzas comerciales personalizadas.',
  alternates: { canonical: 'https://nicaraguainformate.com/publicidad' },
  robots: { index: true, follow: true },
};

const STATS = [
  { icon: <Users size={20} />, label: 'Seguidores en comunidades de Facebook', val: '27,985' },
  { icon: <Globe size={20} />, label: 'Visualizaciones en Facebook (últimos 28 días)', val: '~4.3 millones' },
  { icon: <TrendingUp size={20} />, label: 'Espectadores registrados por Meta (últimos 28 días)', val: '~979 mil' },
  { icon: <Megaphone size={20} />, label: 'Usuarios activos en el sitio (30 días)', val: '~17,000' },
];

const FORMATS = [
  {
    title: 'Banners Display',
    desc: 'Espacios publicitarios dentro del sitio web, incluyendo opciones en portada, categorías y artículos.',
  },
  {
    title: 'Contenido patrocinado',
    desc: 'Contenido desarrollado en coordinación con la marca y claramente identificado como “Contenido patrocinado”. Puede incluir texto, imágenes y enlaces proporcionados por el anunciante, sujeto a revisión editorial y comercial.',
  },
  {
    title: 'Campañas digitales',
    desc: 'Campañas que pueden combinar presencia en sitio web y distribución en nuestras comunidades digitales. La cantidad, formatos, frecuencia y duración se definen de acuerdo con cada campaña.',
  },
  {
    title: 'Campañas por temporada',
    desc: 'Opciones para lanzamientos, promociones, eventos, temporadas comerciales o campañas de mayor duración. Pueden combinar diferentes formatos según los objetivos de la marca.',
  },
  {
    title: 'Alianzas comerciales',
    desc: 'Propuestas personalizadas para marcas que buscan una presencia sostenida dentro del ecosistema digital de Nicaragua Informate.',
  },
];

const POLICY = [
  'La publicidad no influye en las decisiones editoriales.',
  'El contenido patrocinado debe estar claramente identificado.',
  'Los materiales publicitarios están sujetos a revisión editorial y comercial.',
  'Nicaragua Informate se reserva el derecho de rechazar campañas que no sean compatibles con sus políticas o con la legislación aplicable.',
];

export default function PublicidadPage() {
  return (
    <LegalPageShell title="Publicidad y alianzas comerciales">
      {/* Hero stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--accent)', marginBottom: 8 }}>{s.icon}</div>
            <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{s.val}</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.55, marginBottom: '1rem' }}>
        Datos de referencia recientes. No constituyen garantías de alcance futuro para ninguna campaña.
      </p>

      <div style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2rem' }}>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Aproximadamente 4,700 usuarios activos durante los últimos 7 días.</li>
          <li>Aproximadamente 22,000 page views.</li>
          <li>Aproximadamente 13,000 usuarios de Nicaragua.</li>
          <li>Audiencia adicional en Estados Unidos, Costa Rica, Guatemala, España y otros países.</li>
        </ul>
      </div>

      <p style={{ color: '#475569', lineHeight: 1.75, marginBottom: '1.25rem' }}>
        <strong>Nicaragua Informate</strong> es un medio digital independiente con cobertura nacional e internacional y un ecosistema de comunicación que conecta a nicaragüenses dentro del país y en el extranjero. Nuestra audiencia se interesa por noticias, deportes, tecnología, entretenimiento y actualidad, principalmente en Nicaragua, Estados Unidos, Costa Rica, Guatemala y España.
      </p>

      <p style={{ color: '#475569', lineHeight: 1.75, marginBottom: '2rem' }}>
        Desarrollamos propuestas publicitarias adaptadas a las necesidades de cada marca. Los formatos, alcance y duración se definen junto al anunciante, sin tarifas públicas ni precios preestablecidos.
      </p>

      <h2 style={{ fontSize: '1.3rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '1.25rem', fontWeight: 700 }}>Formatos disponibles</h2>
      <div style={{ display: 'grid', gap: 16, marginBottom: '2rem' }}>
        {FORMATS.map((f) => (
          <div key={f.title} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{f.title}</div>
            <div style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', marginBottom: '2rem' }}>
        <h3 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.05rem', marginBottom: 8 }}>Distribución en comunidades digitales</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>
          Nicaragua Informate puede desarrollar campañas de distribución en sus comunidades digitales, sujetas a disponibilidad, programación editorial y aprobación de los materiales. La publicidad nunca debe interferir con la cobertura periodística habitual del medio.
        </p>
      </div>

      <div style={{ background: 'linear-gradient(135deg, rgba(140,29,24,0.08), rgba(196,30,58,0.08))', border: '1px solid rgba(140,29,24,0.2)', borderRadius: 14, padding: '1.75rem', marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.35rem', color: '#0f172a', fontWeight: 800, marginBottom: 10 }}>¿Querés promocionar tu marca en Nicaragua Informate?</h2>
        <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.65, margin: '0 auto 1.25rem', maxWidth: 600 }}>
          Contanos sobre tu campaña, producto o servicio y nuestro equipo comercial puede preparar una propuesta personalizada de acuerdo con tus objetivos, duración y necesidades de comunicación.
        </p>
        <a
          href="mailto:publicidad@nicaraguainformate.com"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#fff',
            background: 'linear-gradient(135deg, #8c1d18, #c41e3a)',
            padding: '14px 28px',
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: 15,
          }}
        >
          <Mail size={16} />
          Solicitar propuesta comercial
        </a>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '1rem' }}>
          También podés usar el <Link href="/contacto" style={{ color: '#93c5fd', textDecoration: 'underline' }}>formulario de contacto</Link> seleccionando “Publicidad / Patrocinio”.
        </p>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', marginBottom: '2rem' }}>
        <h3 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.05rem', marginBottom: 12 }}>Política editorial y comercial</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {POLICY.map((item) => (
            <li key={item} style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <CheckCircle size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </LegalPageShell>
  );
}
