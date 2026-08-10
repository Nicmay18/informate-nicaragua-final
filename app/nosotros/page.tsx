import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Mail,
  Globe,
  MapPin,
  ArrowRight,
  CheckCircle,
  Users,
  Search,
  Scale,
} from 'lucide-react';
import { getCspNonce } from '@/lib/nonce';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      '@id': 'https://nicaraguainformate.com/nosotros#aboutpage',
      url: 'https://nicaraguainformate.com/nosotros',
      name: 'Sobre Nicaragua Informate: medio digital nicaragüense',
      isPartOf: { '@id': 'https://nicaraguainformate.com#website' },
      about: { '@id': 'https://nicaraguainformate.com#organization' },
      description:
        'Conoce a Nicaragua Informate: quiénes somos, cómo verificamos la información, nuestro equipo editorial, principios de transparencia y canales de contacto.',
    },
    {
      '@type': 'Organization',
      '@id': 'https://nicaraguainformate.com#organization',
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
        'Medio digital nicaragüense que publica información verificada sobre nacionales, sucesos, internacionales, tecnología, deportes y espectáculos, con contexto y responsabilidad editorial.',
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
        url: 'https://nicaraguainformate.com/nosotros',
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
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://nicaraguainformate.com/nosotros#breadcrumbs',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: 'https://nicaraguainformate.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Sobre Nicaragua Informate',
          item: 'https://nicaraguainformate.com/nosotros',
        },
      ],
    },
  ],
};

export const metadata: Metadata = {
  title: 'Sobre Nicaragua Informate | Medio digital nicaragüense',
  description:
    'Conoce a Nicaragua Informate: quiénes somos, cómo verificamos la información, nuestro equipo editorial y cómo contactarnos para consultas o reportes.',
  alternates: { canonical: 'https://nicaraguainformate.com/nosotros' },
  openGraph: {
    title: 'Sobre Nicaragua Informate | Medio digital nicaragüense',
    description:
      'Conoce a Nicaragua Informate: quiénes somos, cómo verificamos la información, nuestro equipo editorial y cómo contactarnos.',
    url: 'https://nicaraguainformate.com/nosotros',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function NosotrosPage() {
  const nonce = await getCspNonce();

  return (
    <main className="article-page" style={{ paddingTop: 40 }}>
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />

      <nav className="ni-breadcrumbs" aria-label="Miga de pan" style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px 0' }}>
        <Link href="/">Inicio</Link>
        <span className="ni-breadcrumbs__sep">/</span>
        <span>Sobre Nicaragua Informate</span>
      </nav>

      <section className="article-hero" style={{ height: 'auto', minHeight: 220 }}>
        <div style={{ background: 'var(--primary)', position: 'absolute', inset: 0 }} />
        <div className="article-hero-content" style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: 12, color: 'white' }}>
            Sobre Nicaragua Informate: medio digital nicaragüense
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, maxWidth: 680 }}>
            Medio digital nicaragüense dedicado a informar con contexto, precisión y responsabilidad a la comunidad dentro y fuera del país.
          </p>
        </div>
      </section>

      <div className="article-content-wrapper">
        <h2 className="article-summary-title" style={{ marginTop: 0, marginBottom: 16 }}>Quiénes somos</h2>
        <div className="article-body" style={{ marginBottom: 28 }}>
          <p style={{ marginBottom: 16 }}>
            <strong>Nicaragua Informate</strong> es un medio digital fundado en 2024 con el propósito de ofrecer información relevante, verificada y presentada con contexto a la comunidad nicaragüense, tanto en Nicaragua como en el exterior.
          </p>
          <p style={{ marginBottom: 16 }}>
            Nuestra audiencia incluye lectores que buscan seguir la actualidad nacional, comprender sucesos con antecedentes, acceder a noticias internacionales con relevancia local y encontrar contenido sobre tecnología, deportes y espectáculos.
          </p>
          <p>
            Trabajamos bajo un enfoque editorial que prioriza la precisión sobre la velocidad, la transparencia sobre la amplificación y la utilidad del lector sobre el volumen de contenido.
          </p>
        </div>
      </div>

      <h2 className="article-summary-title" style={{ marginBottom: 16 }}>Nuestra misión editorial</h2>
      <div className="article-body" style={{ marginBottom: 32 }}>
        <p style={{ marginBottom: 16 }}>
          Nuestra misión es publicar información que ayude a los lectores a entender lo que ocurre, por qué importa y qué significa para ellos.
        </p>
        <div className="article-related-grid" style={{ marginBottom: 0 }}>
          {[
            {
              icon: <CheckCircle size={20} color="var(--accent)" />,
              title: 'Información verificada',
              text: 'Contrastamos los datos con al menos dos fuentes antes de publicar y dejamos constancia cuando una información está en desarrollo.',
            },
            {
              icon: <Search size={20} color="var(--accent)" />,
              title: 'Contexto antes de publicar',
              text: 'Buscamos incluir antecedentes, cifras y perspectivas que permitan al lector comprender el fondo de cada noticia.',
            },
            {
              icon: <Scale size={20} color="var(--accent)" />,
              title: 'Separación editorial y publicidad',
              text: 'Los contenidos comerciales se identifican como tales. El equipo editorial decide qué publicar de forma independiente.',
            },
            {
              icon: <Users size={20} color="var(--accent)" />,
              title: 'Responsabilidad con los lectores',
              text: 'Corregimos errores de manera visible, respondemos consultas y mantenemos un canal de contacto abierto.',
            },
          ].map((item) => (
            <div key={item.title} className="sidebar-widget" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem', marginBottom: 4 }}>{item.title}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="article-summary-title" style={{ marginBottom: 16 }}>Cómo trabajamos</h2>
      <div className="article-body" style={{ marginBottom: 32 }}>
        <p style={{ marginBottom: 16 }}>
          Cada noticia que publicamos sigue un proceso de verificación diseñado para reducir errores y mantener la claridad ante el lector.
        </p>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Nuestro proceso de verificación</h3>
        <ol className="article-body" style={{ paddingLeft: 24, marginBottom: 0, listStyleType: 'decimal' }}>
          <li style={{ marginBottom: 12 }}>
            <strong>Selección del tema.</strong> Identificamos noticias de interés público a partir de fuentes oficiales, hechos verificables y temas relevantes para nuestra audiencia.
          </li>
          <li style={{ marginBottom: 12 }}>
            <strong>Revisión inicial.</strong> Verificamos que el tema tenga sustento, que las fuentes estén disponibles y que exista información suficiente para redactar con precisión.
          </li>
          <li style={{ marginBottom: 12 }}>
            <strong>Contraste de información.</strong> Comparamos al menos dos fuentes independientes antes de publicar una afirmación como dato confirmado.
          </li>
          <li style={{ marginBottom: 12 }}>
            <strong>Redacción.</strong> Escribimos con lenguaje claro, evitamos opiniones sin atribución y señalamos la fuente de cada dato central.
          </li>
          <li style={{ marginBottom: 12 }}>
            <strong>Revisión editorial.</strong> Un miembro del equipo revisa la noticia para confirmar que cumpla con los criterios de precisión, contexto y estilo del medio.
          </li>
          <li style={{ marginBottom: 12 }}>
            <strong>Publicación.</strong> Publicamos la noticia con metadatos claros, categoría correcta y corrección de datos de contacto cuando corresponde.
          </li>
          <li>
            <strong>Corrección posterior.</strong> Si un lector o una nueva fuente señala un error, lo revisamos, corregimos y actualizamos la noticia de forma visible.
          </li>
        </ol>
      </div>

      <h2 className="article-summary-title" style={{ marginBottom: 20 }}>Equipo editorial</h2>
      <p className="article-body" style={{ marginBottom: 20 }}>
        Somos un equipo de tres personas. Cada quien asume responsabilidad concreta sobre áreas definidas del medio.
      </p>

      {[
        {
          initials: 'KR',
          name: 'Keyling Elieth Rivera Muñoz',
          role: 'Directora Editorial',
          bio: 'Licenciada en Periodismo. Coordina la línea editorial, supervisa la revisión de contenido y se encarga de que cada noticia cumpla con los criterios de verificación, contexto y estilo del medio.',
          photo: '/keyling-rivera.jpg',
          link: '/autor/keyling-rivera',
        },
        {
          initials: 'MN',
          name: 'Maycol Josué Nicaragua Rivas',
          role: 'Director Técnico',
          bio: 'Ingeniero en Sistemas. Responsable de la infraestructura web, la estabilidad del sitio y las herramientas que sostienen la publicación diaria del contenido.',
        },
        {
          initials: 'JL',
          name: 'José Luis López Ramírez',
          role: 'Director de Operaciones',
          bio: 'Ingeniero en Sistemas. Coordina la operación diaria, el flujo de publicación y la organización del equipo para que el medio funcione de manera continua.',
        },
      ].map((p) => (
        <div key={p.name} className="sidebar-widget" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {p.photo ? (
              <img src={p.photo} alt={p.name} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', objectPosition: '50% 25%', flexShrink: 0, border: '2px solid var(--accent)' }} />
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

      <h2 className="article-summary-title" style={{ marginTop: 40, marginBottom: 16 }}>Principios editoriales</h2>
      <div className="article-related-grid" style={{ marginBottom: 44 }}>
        {[
          { title: 'Precisión', text: 'Publicamos hechos verificables y corregimos cualquier dato erróneo de forma visible.' },
          { title: 'Transparencia', text: 'Explicamos nuestras fuentes, señalamos cuando una información está en desarrollo y mantenemos un canal de contacto abierto.' },
          { title: 'Correcciones', text: 'Cuando cometemos un error, lo reconocemos, lo corregimos y documentamos el cambio en la noticia afectada.' },
          { title: 'Responsabilidad social', text: 'Evitamos la amplificación de contenido dañino y priorizamos la utilidad de la información para el lector.' },
          { title: 'Independencia editorial', text: 'El contenido editorial no responde a intereses políticos, comerciales ni personales ajenos al medio.' },
        ].map((p) => (
          <div key={p.title} className="sidebar-widget">
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem', marginBottom: 6 }}>{p.title}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>{p.text}</p>
          </div>
        ))}
      </div>

      <h2 className="article-summary-title" style={{ marginBottom: 16 }}>Qué cubrimos</h2>
      <div className="article-related-grid" style={{ marginBottom: 44 }}>
        {[
          { cat: 'Nacionales', desc: 'Noticias de Nicaragua: política, instituciones, desarrollo social, economía y temas de interés público con contexto local.' },
          { cat: 'Sucesos', desc: 'Incidentes, accidentes y hechos de seguridad ciudadana, reportados con información contrastada y antecedentes relevantes.' },
          { cat: 'Internacionales', desc: 'Acontecimientos del mundo con incidencia en Nicaragua o de interés para la comunidad nicaragüense en el exterior.' },
          { cat: 'Tecnología', desc: 'Avances tecnológicos, servicios digitales, redes sociales y guías prácticas con aplicación en el país.' },
          { cat: 'Deportes', desc: 'Cobertura de fútbol, béisbol y disciplinas populares en Nicaragua, con resultados, contexto y figuras relevantes.' },
          { cat: 'Espectáculos', desc: 'Entretenimiento, cultura, eventos y personalidades, con enfoque informativo y sin sensacionalismo.' },
        ].map((s) => (
          <div key={s.cat} className="sidebar-widget">
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem', marginBottom: 4 }}>{s.cat}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.55 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <h2 className="article-summary-title" style={{ marginBottom: 16 }}>Correcciones y transparencia</h2>
      <div className="article-body" style={{ marginBottom: 32 }}>
        <p style={{ marginBottom: 16 }}>
          <strong>Nuestro compromiso cuando cometemos errores</strong>
        </p>
        <p style={{ marginBottom: 16 }}>
          Cuando una información publicada resulta incompleta, desactualizada o incorrecta, revisamos el caso, actualizamos la noticia y dejamos constancia del cambio. El objetivo no es ocultar el error, sino mantener la confianza del lector y la integridad del registro informativo.
        </p>
        <ul className="article-body" style={{ paddingLeft: 24, listStyleType: 'disc', marginBottom: 0 }}>
          <li style={{ marginBottom: 8 }}>Actualizamos la información cuando surgen datos más completos o precisos.</li>
          <li style={{ marginBottom: 8 }}>Hacemos correcciones visibles en la noticia afectada cuando es necesario.</li>
          <li>Asumimos la responsabilidad ante los lectores y respondemos a los reportes de error que recibimos.</li>
        </ul>
      </div>

      <h2 className="article-summary-title" style={{ marginBottom: 16 }}>Contacto editorial</h2>
      <p className="article-body" style={{ marginBottom: 20 }}>
        Puedes escribirnos a <a href="mailto:contacto@nicaraguainformate.com" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>contacto@nicaraguainformate.com</a> para:
      </p>
      <div className="article-related-grid" style={{ marginBottom: 44 }}>
        {[
          { label: 'Consultas', text: 'Dudas sobre el medio, el contenido o nuestras políticas.' },
          { label: 'Sugerencias', text: 'Propuestas de temas, mejoras o comentarios sobre la experiencia de lectura.' },
          { label: 'Reportes de errores', text: 'Avisos sobre información incorrecta, desactualizada o que necesite corrección.' },
          { label: 'Colaboraciones', text: 'Propuestas de trabajo conjunto, contenido patrocinado o alianzas informativas.' },
        ].map((c) => (
          <div key={c.label} className="sidebar-widget">
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem', marginBottom: 4 }}>{c.label}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.55 }}>{c.text}</div>
          </div>
        ))}
      </div>

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
