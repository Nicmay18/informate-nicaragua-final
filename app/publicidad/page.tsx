import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';
import { Megaphone, Users, Globe, TrendingUp, Mail, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Publicidad y alianzas | Nicaragua Informate',
  description: 'Media kit oficial de Nicaragua Informate. Espacios publicitarios, tarifas y alianzas comerciales para llegar a audiencia nicaragüense en Managua y el exterior.',
  alternates: { canonical: 'https://nicaraguainformate.com/publicidad' },
  robots: { index: true, follow: true },
};

const PLANS = [
  {
    name: 'Banner Básico',
    price: '$25',
    period: 'mes',
    features: [
      'Banner 300x250 en sidebar de artículos',
      'Hasta 5,000 impresiones/mes',
      'Reporte mensual de clics',
      'Duración mínima: 1 mes',
    ],
  },
  {
    name: 'Portada Premium',
    price: '$75',
    period: 'mes',
    features: [
      'Banner 728x90 en homepage',
      'Banner 300x250 en sidebar homepage',
      'Hasta 20,000 impresiones/mes',
      'Prioridad en rotación',
      'Reporte mensual detallado',
    ],
  },
  {
    name: 'Patrocinio Editorial',
    price: '$150',
    period: 'mes',
    features: [
      'Artículo patrocinado con tu marca',
      'Banner en homepage + artículos',
      'Mención en newsletter (si aplica)',
      'Link dofollow en el artículo',
      'Reporte completo de engagement',
    ],
  },
];

const STATS = [
  { icon: <Users size={20} />, label: 'Visitas mensuales', val: '15,000+' },
  { icon: <Globe size={20} />, label: 'Países principales', val: 'Nicaragua, USA, Costa Rica' },
  { icon: <TrendingUp size={20} />, label: 'Crecimiento', val: '20% mensual' },
  { icon: <Megaphone size={20} />, label: 'Artículos publicados', val: '196+' },
];

export default function PublicidadPage() {
  return (
    <LegalPageShell title="Publicidad y alianzas comerciales">
      {/* Hero stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: '2rem' }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--accent)', marginBottom: 8 }}>{s.icon}</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{s.val}</div>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <p style={{ color: '#e2e8f0', lineHeight: 1.75, marginBottom: '2rem' }}>
        <strong>Nicaragua Informate</strong> es un medio digital independiente con cobertura nacional e internacional. Nuestra audiencia está compuesta por nicaragüenses dentro del país y en el extranjero (principalmente Estados Unidos, Costa Rica y España), interesados en noticias locales, deportes, tecnología y entretenimiento.
      </p>

      <h2 style={{ fontSize: '1.3rem', color: '#f8fafc', marginTop: '2.5rem', marginBottom: '1.25rem', fontWeight: 700 }}>Formatos disponibles</h2>
      <div style={{ display: 'grid', gap: 16, marginBottom: '2rem' }}>
        {[
          { title: 'Banners Display', desc: 'Formatos estándar IAB: 728x90 (leaderboard), 300x250 (medium rectangle), 320x50 (mobile banner). Ubicaciones: homepage, categorías y artículos individuales.' },
          { title: 'Patrocinios Editoriales', desc: 'Artículos de contenido relevante para tu marca, claramente identificados como "Contenido patrocinado". Incluye foto, texto y link a tu sitio.' },
          { title: 'Campañas por Temporada', desc: 'Paquetes especiales para eventos, lanzamientos o temporadas específicas. Incluye banners + menciones en redes sociales.' },
        ].map((f) => (
          <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{f.title}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '1.3rem', color: '#f8fafc', marginTop: '2.5rem', marginBottom: '1.25rem', fontWeight: 700 }}>Tarifas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: '2rem' }}>
        {PLANS.map((plan) => (
          <div key={plan.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{plan.name}</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '2rem', marginBottom: 4 }}>{plan.price}</div>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: '1rem' }}>por {plan.period}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
              {plan.features.map((feat) => (
                <li key={feat} style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <CheckCircle size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(140,29,24,0.12)', border: '1px solid rgba(140,29,24,0.3)', borderRadius: 12, padding: '1.25rem', marginBottom: '2rem' }}>
        <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', marginBottom: 8 }}>Política comercial</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>
          La publicidad <strong>no influye</strong> en nuestras decisiones editoriales. Todo contenido patrocinado debe estar identificado claramente. No aceptamos publicidad de productos ilegales, apuestas, contenido para adultos, ni servicios que violen las leyes de Nicaragua.
        </p>
      </div>

      <h2 style={{ fontSize: '1.3rem', color: '#f8fafc', marginTop: '2rem', marginBottom: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mail size={18} color="var(--accent)" />
        Contacto comercial
      </h2>
      <p style={{ color: '#94a3b8', lineHeight: 1.75, marginBottom: '1.25rem' }}>
        Para propuestas, disponibilidad de espacios y tarifas personalizadas, escribinos a:
      </p>
      <a
        href="mailto:publicidad@nicaraguainformate.com"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: '#fff',
          background: 'linear-gradient(135deg, #8c1d18, #c41e3a)',
          padding: '12px 24px',
          borderRadius: 8,
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: 15,
        }}
      >
        <Mail size={16} />
        publicidad@nicaraguainformate.com
      </a>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '1rem' }}>
        También podés usar el <Link href="/contacto" style={{ color: '#93c5fd', textDecoration: 'underline' }}>formulario de contacto</Link> seleccionando "Publicidad / Patrocinio".
      </p>
    </LegalPageShell>
  );
}
