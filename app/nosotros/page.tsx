import type { Metadata } from 'next';
import Link from 'next/link';
import { Target, Eye, HeartHandshake, Mail, Globe, MapPin, Shield, ArrowRight } from 'lucide-react';
const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nicaragua Informate',
  alternateName: 'NicaraguaInformate.com',
  url: 'https://nicaraguainformate.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://nicaraguainformate.com/logo.webp',
    width: 512,
    height: 512,
  },
  description:
    'Medio digital nicaragüense creado para mantener informada a la comunidad dentro y fuera del país. Noticias verificadas sobre nacionales, sucesos, espectáculos, internacionales, tecnología y deportes.',
  foundingDate: '2024',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Managua',
    addressCountry: 'NI',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'contacto@nicaraguainformate.com',
    contactType: 'Contacto editorial',
    availableLanguage: 'Spanish',
  },
  sameAs: ['https://www.facebook.com/profile.php?id=61578261125687'],
  employee: [
    {
      '@type': 'Person',
      name: 'Keyling Elieth Rivera Muñoz',
      jobTitle: 'Directora Editorial',
      url: 'https://nicaraguainformate.com/autor/keyling-rivera',
      sameAs: ['https://www.facebook.com/keyling.elieth.rivera.munoz'],
    },
    {
      '@type': 'Person',
      name: 'Maycol Josué Nicaragua Rivas',
      jobTitle: 'Director Técnico',
      sameAs: ['https://www.facebook.com/share/18dZryG94G/'],
    },
    {
      '@type': 'Person',
      name: 'José Luis López Ramírez',
      jobTitle: 'Director de Operaciones',
      sameAs: ['https://www.facebook.com/ramirez.lopezz.2025'],
    },
  ],
};

export const metadata: Metadata = {
  title: { absolute: 'Sobre Nicaragua Informate — Noticias de Nicaragua | Nicaragua Informate' },
  description: 'Conoce a Nicaragua Informate: equipo, misión y visión del medio digital nicaragüense dedicado a noticias verificadas.',
  alternates: { canonical: 'https://nicaraguainformate.com/nosotros' },
};

export default function NosotrosPage() {
  return (
    <main className="article-page" style={{ paddingTop: 40 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }} />
      {/* Breadcrumb */}
      <nav className="ni-breadcrumbs" aria-label="Miga de pan" style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px 0' }}>
        <Link href="/">Inicio</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <span>Sobre Nicaragua Informate</span>
      </nav>

      {/* Hero */}
      <section className="article-hero" style={{ height: 'auto', minHeight: 220 }}>
        <div style={{ background: 'var(--primary)', position: 'absolute', inset: 0 }} />
        <div className="article-hero-content" style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: 12, color: 'white' }}>
            Sobre Nicaragua Informate
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, maxWidth: 640 }}>
            Medio digital nicaragüense creado para mantener informada a la comunidad dentro y fuera del país.
          </p>
        </div>
      </section>

      <div className="article-content-wrapper">
        <p className="article-body">
          <strong>Nicaragua Informate</strong> es un medio digital nicaragüense creado para mantener informada a la comunidad nicaragüense dentro y fuera del país. Publicamos contenido diario sobre nacionales, sucesos, espectáculos, internacionales, tecnología y deportes, con información verificada y presentada de forma clara.
        </p>
      </div>

      {/* Misión / Visión / Valores */}
      <div className="article-related-grid" style={{ marginBottom: 44 }}>
        {[
          { icon: <Target size={22} color="var(--accent)" />, title: 'Misión', desc: 'Brindar información verificada, contextualizada y oportuna para ciudadanos informados.' },
          { icon: <Eye size={22} color="var(--accent)" />, title: 'Visión', desc: 'Ser la fuente de noticias digitales más confiable para nicaragüenses en el país y el extranjero.' },
          { icon: <HeartHandshake size={22} color="var(--accent)" />, title: 'Valores', desc: 'Veracidad, precisión, responsabilidad social, ética periodística e independencia editorial.' },
        ].map((v) => (
          <div key={v.title} className="sidebar-widget" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 10 }}>{v.icon}</div>
            <h3 style={{ color: 'var(--text)', marginBottom: 6, fontSize: '1.05rem', fontWeight: 700 }}>{v.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>{v.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="article-summary-title" style={{ marginBottom: 20 }}>¿Quiénes están detrás de Nicaragua Informate?</h2>
      <p className="article-body" style={{ marginBottom: 24 }}>
        Somos un equipo de tres personas que trabajamos juntas para que este medio funcione. Cada uno aporta desde su área:
      </p>

      {/* Equipo */}
      {[
        { initials: 'MN', name: 'Maycol Josué Nicaragua Rivas', role: 'Director Técnico', bio: 'Ingeniero en Sistemas. Se encarga del desarrollo tecnológico, la infraestructura web y todo lo relacionado con que el sitio funcione correctamente. Es el responsable de que la plataforma esté disponible las 24 horas.' },
        { initials: 'JL', name: 'José Luis López Ramírez', role: 'Director de Operaciones', bio: 'Ingeniero en Sistemas. Coordina la operación diaria, la publicación oportuna de contenido y la organización del equipo. Su trabajo es que todo salga a tiempo y con calidad.' },
        { initials: 'KR', name: 'Keyling Elieth Rivera Muñoz', role: 'Directora Editorial', bio: 'Licenciada en Periodismo. Especializada en cobertura de sucesos, noticias nacionales, deportes e internacionales. Revisa y contrasta la información antes de publicarla para garantizar que sea precisa y confiable.', photo: '/keyling-rivera.jpg', link: '/autor/keyling-rivera' },
      ].map((p) => (
        <div key={p.name} className="sidebar-widget" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {p.photo ? (
              <img src={p.photo} alt={p.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--accent)' }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
                {p.initials}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{p.name}</div>
              <div style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{p.role}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.65 }}>
                {p.bio} {p.link && <Link href={p.link} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Ver perfil <ArrowRight size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 2 }} /></Link>}
              </p>
            </div>
          </div>
        </div>
      ))}

      <h2 className="article-summary-title" style={{ marginTop: 40, marginBottom: 16 }}>¿Por qué creamos Nicaragua Informate?</h2>
      <p className="article-body" style={{ marginBottom: 24 }}>
        Nació de la necesidad de tener un espacio informativo directo, accesible y hecho por nicaragüenses. En un entorno con tanta información, queríamos ofrecer algo que la gente pueda leer sin complicaciones y confiar en lo que dice.
      </p>

      <h2 className="article-summary-title" style={{ marginBottom: 16 }}>Nuestro enfoque</h2>
      <ul className="article-body" style={{ marginBottom: 32, paddingLeft: 24, listStyleType: 'disc' }}>
        <li><strong>Información verificada</strong> antes de publicar</li>
        <li><strong>Correcciones transparentes</strong> cuando nos equivocamos</li>
        <li><strong>Separación clara</strong> entre contenido editorial y publicidad</li>
        <li><strong>Publicación diaria,</strong> las 24 horas del día</li>
      </ul>

      <h2 className="article-summary-title" style={{ marginBottom: 16 }}>¿Qué cubrimos?</h2>
      <div className="article-related-grid" style={{ marginBottom: 44 }}>
        {[
          { cat: 'Nacionales', desc: 'Noticias de Nicaragua: política, sociedad' },
          { cat: 'Sucesos', desc: 'Incidentes, accidentes, seguridad' },
          { cat: 'Espectáculos', desc: 'Entretenimiento, cultura, eventos' },
          { cat: 'Internacionales', desc: 'Lo que pasa fuera del país con relevancia local' },
          { cat: 'Tecnología', desc: 'Avances, apps, redes sociales, consejos digitales' },
          { cat: 'Deportes', desc: 'Fútbol, béisbol y disciplinas populares en Nicaragua' },
        ].map((s) => (
          <div key={s.cat} className="sidebar-widget">
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem', marginBottom: 4 }}>{s.cat}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <h2 className="article-summary-title" style={{ marginBottom: 16 }}>Compromiso con la información</h2>
      <div className="sidebar-widget" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={20} color="var(--primary-dark)" />
        </div>
        <div>
          <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Verificación rigurosa</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
            Contrastamos la información con al menos dos fuentes antes de publicar.
          </p>
        </div>
      </div>
      <ul className="article-body" style={{ marginBottom: 32, paddingLeft: 24, listStyleType: 'disc' }}>
        <li><strong>Verificación:</strong> Contrastamos la información con al menos dos fuentes antes de publicar.</li>
        <li><strong>Correcciones:</strong> Si hay un error, lo corregimos y lo indicamos.</li>
        <li><strong>Independencia:</strong> El contenido editorial no responde a intereses políticos ni comerciales.</li>
        <li><strong>Disponibilidad:</strong> Publicamos todos los días, a toda hora.</li>
      </ul>

      <h2 className="article-summary-title" style={{ marginBottom: 16 }}>Contacto</h2>
      <p className="article-body" style={{ marginBottom: 24 }}>
        Para consultas, sugerencias o reportes, puedes escribirnos a través de los canales de contacto disponibles en el sitio.
      </p>

      <div className="article-related-grid" style={{ marginBottom: 44 }}>
        {[
          { icon: <MapPin size={16} color="var(--accent)" />, label: 'Dirección', val: 'Managua, Nicaragua, Centroamérica' },
          { icon: <Mail size={16} color="var(--accent)" />, label: 'Correo', val: 'contacto@nicaraguainformate.com', href: 'mailto:contacto@nicaraguainformate.com' },
          { icon: <Globe size={16} color="var(--accent)" />, label: 'Sitio web', val: 'www.nicaraguainformate.com' },
        ].map((c) => (
          <div key={c.label} className="sidebar-widget">
            <div style={{ marginBottom: 8 }}>{c.icon}</div>
            <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.label}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {c.href ? <a href={c.href} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{c.val}</a> : c.val}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/politica-editorial" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Política Editorial</Link>
        <Link href="/contacto" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Contacto</Link>
        <Link href="/terminos" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Términos</Link>
      </div>

      <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: 32, marginBottom: 60 }}>
        © {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados.
      </p>
    </main>
  );
}
