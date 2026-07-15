import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: { absolute: 'Política de Cookies | Nicaragua Informate' },
  description: 'Política de cookies de Nicaragua Informate: tipos de cookies que usamos, cookies de terceros, gestión de preferencias y contacto de privacidad.',
  alternates: { canonical: 'https://nicaraguainformate.com/cookies' },
};

const COOKIE_TYPES = [
  {
    name: 'Cookies Esenciales',
    description: 'Necesarias para el funcionamiento básico del sitio. Incluyen autenticación, seguridad y preferencias básicas.',
    examples: 'session_id, csrf_token, theme_preference',
    duration: 'Sesión - 1 año',
  },
  {
    name: 'Cookies de Rendimiento',
    description: 'Nos ayudan a entender cómo interactúas con el sitio, qué páginas visitas y cómo mejorar la experiencia.',
    examples: '_ga, _gid, _gat (Google Analytics)',
    duration: '24 horas - 2 años',
  },
  {
    name: 'Cookies de Funcionalidad',
    description: 'Permiten recordar tus preferencias y personalizar el contenido según tu ubicación y configuración.',
    examples: 'preferred_city, news_filter, font_size',
    duration: '1 mes - 1 año',
  },
  {
    name: 'Cookies de Publicidad',
    description: 'Actualmente desactivadas. Se utilizaran solo con proveedores verificados como Google AdSense.',
    examples: '__gads, __gpi, NID, 1P_JAR',
    duration: '13 meses',
  },
];

export default function CookiesPage() {
  return (
    <LegalPageShell title="Política de Cookies">
      <div style={{ background: '#fefce8', borderLeft: '4px solid #fbbf24', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#854d0e', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 5 de mayo de 2026
      </div>

      <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>
        En <strong>Nicaragua Informate</strong> utilizamos cookies y tecnologías similares para mejorar tu experiencia de navegación, 
        analizar el tráfico del sitio y mostrar publicidad personalizada. Esta política explica qué son las cookies, 
        cómo las usamos y cómo puedes gestionar tus preferencias.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>1. ¿Qué son las cookies?</h2>
      <p style={{ color: '#475569', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo (ordenador, teléfono móvil o tablet) 
        cuando visitas un sitio web. Estas cookies permiten que el sitio recuerde tus acciones y preferencias durante un 
        período de tiempo, para que no tengas que volver a introducirlas cada vez que regreses al sitio o navegues entre páginas.
      </p>
      <p style={{ color: '#475569', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Además de las cookies, utilizamos otras tecnologías de seguimiento similares como web beacons, pixels de seguimiento 
        y almacenamiento local, que cumplen funciones similares.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>2. Tipos de cookies que utilizamos</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {COOKIE_TYPES.map((cookie, index) => (
          <div key={index} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#b45309', fontWeight: 600, marginBottom: '0.5rem' }}>{cookie.name}</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>{cookie.description}</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
              <span style={{ color: '#64748b' }}><strong>Ejemplos:</strong> {cookie.examples}</span>
              <span style={{ color: '#64748b' }}><strong>Duración:</strong> {cookie.duration}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>3. Cookies de terceros</h2>
      <p style={{ color: '#475569', marginBottom: '1rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Utilizamos servicios de terceros que también pueden establecer cookies en tu dispositivo:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Google AdSense:</strong> Para mostrar publicidad personalizada cuando sea implementado.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Google Analytics:</strong> Para analizar el tráfico del sitio y entender el comportamiento de los usuarios.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Firebase:</strong> Para el funcionamiento de la base de datos en tiempo real de noticias.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Open-Meteo:</strong> Para proporcionar información meteorológica localizada.</li>
      </ul>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', color: '#2563eb', fontWeight: 600, marginBottom: '0.75rem' }}>Publicidad personalizada</h3>
        <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.7 }}>
          Actualmente no utilizamos publicidad de terceros. Cuando implementemos publicidad, utilizaremos 
          proveedores verificados como Google AdSense. Puedes optar por no recibir publicidad personalizada visitando{' '}
          <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Opciones de publicidad</a>.
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>4. Gestión de cookies</h2>
      <p style={{ color: '#475569', marginBottom: '1rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Puedes controlar y gestionar las cookies de varias formas:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Configuración del navegador:</strong> La mayoría de los navegadores permiten bloquear o eliminar cookies. Consulta la sección de ayuda de tu navegador para más información.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Preferencias de publicidad:</strong> Gestiona tus preferencias de publicidad personalizada en{' '}
          <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>www.aboutads.info</a>.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Your Online Choices:</strong> Opciones para gestionar publicidad de terceros en{' '}
          <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>www.aboutads.info</a>.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>5. Impacto de desactivar cookies</h2>
      <p style={{ color: '#475569', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Si decides desactivar ciertas cookies, ten en cuenta que algunas funcionalidades del sitio pueden verse afectadas:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Las preferencias de tema (claro/oscuro) podrían no guardarse</li>
        <li style={{ marginBottom: '0.5rem' }}>El widget de clima podría no recordar tu ciudad preferida</li>
        <li style={{ marginBottom: '0.5rem' }}>Los anuncios mostrados serían menos relevantes para tus intereses</li>
        <li style={{ marginBottom: '0.5rem' }}>Algunas funciones de personalización podrían no estar disponibles</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>6. Consentimiento</h2>
      <p style={{ color: '#475569', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Al continuar navegando en <strong>Nicaragua Informate</strong>, aceptas el uso de cookies según se describe en esta política. 
        Si no estás de acuerdo, te recomendamos ajustar la configuración de tu navegador o no utilizar nuestro sitio.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>7. Actualizaciones de esta política</h2>
      <p style={{ color: '#475569', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Podemos actualizar esta política de cookies periódicamente para reflejar cambios en las tecnologías que utilizamos 
        o en los requisitos legales. Te recomendamos revisar esta página regularmente para estar informado sobre cómo 
        utilizamos las cookies.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>8. Contacto</h2>
      <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Si tienes preguntas sobre nuestra política de cookies, puedes contactarnos:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Email: <a href="mailto:privacidad@nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none' }}>privacidad@nicaraguainformate.com</a></li>
        <li style={{ marginBottom: '0.5rem' }}>Formulario: <Link href="/contacto" style={{ color: '#2563eb', textDecoration: 'none' }}>/contacto</Link></li>
      </ul>
    </LegalPageShell>
  );
}
