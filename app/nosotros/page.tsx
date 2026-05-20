import type { Metadata } from 'next';
import Link from 'next/link';
import { Target, Eye, HeartHandshake, Mail, Globe, MapPin, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre Nicaragua Informate — Noticias de Nicaragua',
  description: 'Conoce a Nicaragua Informate: equipo, misión y visión del medio digital nicaragüense dedicado a noticias verificadas.',
  alternates: { canonical: 'https://nicaraguainformate.com/nosotros' },
};

const ACENTO = '#dc2626';
const TXT = '#0f172a';
const TXT_SEC = '#334155';
const BG_CARD = '#ffffff';
const BORDER = '#e2e8f0';
const LINK = '#2563eb';

export default function NosotrosPage() {
  return (
    <main style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ background: '#0f172a', color: '#fff', padding: '64px 24px 48px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }}>
            Sobre Nicaragua Informate
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#cbd5e1', lineHeight: 1.7, maxWidth: 640 }}>
            Nicaragua Informate es un medio digital nicaragüense creado para mantener informada a la comunidad nicaragüense dentro y fuera del país.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Intro */}
        <p style={{ fontSize: '1.1rem', color: TXT, lineHeight: 1.8, marginBottom: '1.25rem' }}>
          <strong>Nicaragua Informate</strong> es un medio digital nicaragüense creado para mantener informada a la comunidad nicaragüense dentro y fuera del país. Publicamos contenido diario sobre sucesos, noticias nacionales, deportes, internacionales, tecnología y espectáculos, con información verificada y presentada de forma clara.
        </p>

        {/* Misión / Visión / Valores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, margin: '2.5rem 0' }}>
          {[
            { icon: <Target size={22} color={ACENTO} />, title: 'Misión', desc: 'Brindar información verificada, contextualizada y oportuna para ciudadanos informados.' },
            { icon: <Eye size={22} color={ACENTO} />, title: 'Visión', desc: 'Ser la fuente de noticias digitales más confiable para nicaragüenses en el país y el extranjero.' },
            { icon: <HeartHandshake size={22} color={ACENTO} />, title: 'Valores', desc: 'Veracidad, precisión, responsabilidad social, ética periodística e independencia editorial.' },
          ].map((v) => (
            <div key={v.title} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ marginBottom: 10 }}>{v.icon}</div>
              <h3 style={{ color: TXT, marginBottom: 6, fontSize: '1.05rem', fontWeight: 700 }}>{v.title}</h3>
              <p style={{ color: TXT_SEC, fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* ¿Quién está detrás? */}
        <h2 style={{ fontSize: '1.4rem', color: TXT, marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>
          ¿Quiénes están detrás de Nicaragua Informate?
        </h2>
        <p style={{ color: TXT_SEC, marginBottom: '1.5rem', lineHeight: 1.75 }}>
          Somos un equipo de tres personas que trabajamos juntas para que este medio funcione. Cada uno aporta desde su área:
        </p>

        {/* Equipo */}
        {[
          { initials: 'MN', name: 'Maycol Josué Nicaragua Rivas', role: 'Director Técnico', bio: 'Ingeniero en Sistemas. Se encarga del desarrollo tecnológico, la infraestructura web y todo lo relacionado con que el sitio funcione correctamente. Es el responsable de que la plataforma esté disponible las 24 horas.' },
          { initials: 'JL', name: 'José Luis López Ramírez', role: 'Director de Operaciones', bio: 'Ingeniero en Sistemas. Coordina la operación diaria, la publicación oportuna de contenido y la organización del equipo. Su trabajo es que todo salga a tiempo y con calidad.' },
          { initials: 'KR', name: 'Keyling Elieth Rivera Muñoz', role: 'Directora Editorial', bio: 'Licenciada en Periodismo. Especializada en cobertura de sucesos, noticias nacionales, deportes e internacionales. Revisa y contrasta la información antes de publicarla para garantizar que sea precisa y confiable.', photo: '/keyling-rivera.jpg', link: '/autor/keyling-rivera' },
        ].map((p) => (
          <div key={p.name} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {p.photo ? (
                <img src={p.photo} alt={p.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${ACENTO}` }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#0f172a,#334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
                  {p.initials}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ color: TXT, fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{p.name}</div>
                <div style={{ color: ACENTO, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{p.role}</div>
                <p style={{ color: TXT_SEC, fontSize: '0.95rem', margin: 0, lineHeight: 1.65 }}>
                  {p.bio} {p.link && <Link href={p.link} style={{ color: LINK, textDecoration: 'none', fontWeight: 600 }}>Ver perfil →</Link>}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* ¿Por qué creamos? */}
        <h2 style={{ fontSize: '1.4rem', color: TXT, marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>
          ¿Por qué creamos Nicaragua Informate?
        </h2>
        <p style={{ color: TXT_SEC, marginBottom: '1.25rem', lineHeight: 1.75 }}>
          Nació de la necesidad de tener un espacio informativo directo, accesible y hecho por nicaragüenses. En un entorno con tanta información, queríamos ofrecer algo que la gente pueda leer sin complicaciones y confiar en lo que dice.
        </p>

        {/* Enfoque */}
        <h2 style={{ fontSize: '1.4rem', color: TXT, marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>Nuestro enfoque</h2>
        <ul style={{ color: TXT_SEC, lineHeight: 1.8, paddingLeft: '1.5rem', listStyleType: 'disc', marginBottom: '2rem' }}>
          <li><strong style={{ color: TXT }}>Información verificada</strong> antes de publicar</li>
          <li><strong style={{ color: TXT }}>Correcciones transparentes</strong> cuando nos equivocamos</li>
          <li><strong style={{ color: TXT }}>Separación clara</strong> entre contenido editorial y publicidad</li>
          <li><strong style={{ color: TXT }}>Publicación diaria,</strong> las 24 horas del día</li>
        </ul>

        {/* ¿Qué cubrimos? */}
        <h2 style={{ fontSize: '1.4rem', color: TXT, marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>¿Qué cubrimos?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: '2.5rem' }}>
          {[
            { cat: 'Nacionales', desc: 'Noticias de Nicaragua: política, economía, sociedad' },
            { cat: 'Sucesos', desc: 'Incidentes, accidentes, seguridad' },
            { cat: 'Internacionales', desc: 'Lo que pasa fuera del país con relevancia local' },
            { cat: 'Deportes', desc: 'Fútbol, béisbol y disciplinas populares en Nicaragua' },
            { cat: 'Tecnología', desc: 'Avances, apps, redes sociales, consejos digitales' },
            { cat: 'Espectáculos', desc: 'Farándula, cultura, eventos' },
          ].map((s) => (
            <div key={s.cat} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
              <div style={{ fontWeight: 700, color: TXT, fontSize: '0.95rem', marginBottom: 4 }}>{s.cat}</div>
              <div style={{ color: TXT_SEC, fontSize: '0.85rem' }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Compromiso */}
        <h2 style={{ fontSize: '1.4rem', color: TXT, marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>
          Compromiso con la información
        </h2>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: ACENTO, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <div style={{ color: TXT, fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Verificación rigurosa</div>
            <p style={{ color: TXT_SEC, fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
              Contrastamos la información con al menos dos fuentes antes de publicar.
            </p>
          </div>
        </div>
        <ul style={{ color: TXT_SEC, lineHeight: 1.8, paddingLeft: '1.5rem', listStyleType: 'disc', marginBottom: '2rem' }}>
          <li><strong style={{ color: TXT }}>Verificación:</strong> Contrastamos la información con al menos dos fuentes antes de publicar.</li>
          <li><strong style={{ color: TXT }}>Correcciones:</strong> Si hay un error, lo corregimos y lo indicamos.</li>
          <li><strong style={{ color: TXT }}>Independencia:</strong> El contenido editorial no responde a intereses políticos ni comerciales.</li>
          <li><strong style={{ color: TXT }}>Disponibilidad:</strong> Publicamos todos los días, a toda hora.</li>
        </ul>

        {/* Contacto */}
        <h2 style={{ fontSize: '1.4rem', color: TXT, marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>Contacto</h2>
        <p style={{ color: TXT_SEC, marginBottom: '1.25rem', lineHeight: 1.75 }}>
          Para consultas, sugerencias o reportes, puedes escribirnos a través de los canales de contacto disponibles en el sitio.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, margin: '0.5rem 0 2rem' }}>
          {[
            { icon: <MapPin size={16} color={ACENTO} />, label: 'Dirección', val: 'Managua, Nicaragua, Centroamérica' },
            { icon: <Mail size={16} color={ACENTO} />, label: 'Correo', val: 'contacto@nicaraguainformate.com', href: 'mailto:contacto@nicaraguainformate.com' },
            { icon: <Globe size={16} color={ACENTO} />, label: 'Sitio web', val: 'www.nicaraguainformate.com' },
          ].map((c) => (
            <div key={c.label} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '1rem' }}>
              <div style={{ marginBottom: 8 }}>{c.icon}</div>
              <div style={{ color: TXT, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.label}</div>
              <div style={{ color: TXT_SEC, fontSize: 13 }}>
                {c.href ? <a href={c.href} style={{ color: TXT_SEC, textDecoration: 'none' }}>{c.val}</a> : c.val}
              </div>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '1.5rem', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/politica-editorial" style={{ color: LINK, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Política Editorial</Link>
          <Link href="/contacto" style={{ color: LINK, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Contacto</Link>
          <Link href="/terminos" style={{ color: LINK, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Términos</Link>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2rem' }}>
          © {new Date().getFullYear()} Nicaragua Informate. Todos los derechos reservados.
        </p>
      </div>
    </main>
  );
}
