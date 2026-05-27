import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Nicaragua Informate',
  description: 'Política de privacidad de Nicaragua Informate. Conoce cómo manejamos tu información.',
  alternates: { canonical: 'https://nicaraguainformate.com/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <LegalPageShell title="Política de Privacidad">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <img src="/logo-ni.png" alt="Nicaragua Informate Logo" style={{ width: 120, height: 'auto' }} />
      </div>
      <div style={{ background: 'rgba(251,191,36,0.12)', borderLeft: '4px solid #fbbf24', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#e2e8f0', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 27 de mayo de 2026
      </div>

      <p style={{ color: '#e2e8f0', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>
        En <strong>Nicaragua Informate</strong> respetamos tu privacidad. Esta política explica de forma sencilla cómo manejamos la información cuando visitas nuestro sitio <a href="https://nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>nicaraguainformate.com</a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>1. Identidad del responsable</h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        <strong>Nicaragua Informate</strong> es un medio digital con sede en Managua, Nicaragua. Para cualquier consulta sobre esta política, escríbenos a <a href="mailto:contacto@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>contacto@nicaraguainformate.com</a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>2. ¿Qué datos recopilamos?</h2>
      <p style={{ color: '#94a3b8', marginBottom: '0.75rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Al visitar nuestro sitio, podemos recopilar:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#94a3b8', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Datos de navegación (IP, tipo de navegador, páginas visitadas)</li>
        <li>Cookies y tecnologías similares</li>
        <li>Información proporcionada voluntariamente en formularios de contacto</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>3. Uso de cookies y publicidad</h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Utilizamos <strong style={{ color: '#f8fafc' }}>Monetag</strong> para mostrar anuncios en nuestro sitio. Monetag puede usar cookies y tecnologías similares para personalizar la publicidad que ves.
      </p>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Al navegar en Nicaragua Informate, aceptas el uso de estas tecnologías según lo descrito en esta política. Puedes gestionar tus preferencias en el banner de cookies que aparece al ingresar al sitio.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>4. Google Analytics</h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Usamos Google Analytics para entender cómo se usa nuestro sitio. Google recibe información sobre tu navegación (sin datos que te identifiquen personalmente) y la guarda en servidores en Estados Unidos.
      </p>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Si no quieres que Google Analytics te rastree, puedes instalar su complemento de inhabilitación:{' '}
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>tools.google.com/dlpage/gaoptout</a>
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>5. Tus derechos</h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Puedes desactivar las cookies desde la configuración de tu navegador. Ten en cuenta que esto puede afectar la funcionalidad del sitio.
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#94a3b8', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Pedirnos qué información tenemos sobre ti</li>
        <li>Pedir que corrijamos datos incorrectos</li>
        <li>Pedir que eliminemos tus datos personales</li>
        <li>Cancelar tu suscripción al boletín en cualquier momento</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>6. Seguridad de tu información</h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Tomamos medidas básicas de seguridad: conexión cifrada (HTTPS), acceso restringido a quienes administran el sitio y revisión periódica de nuestros sistemas.
      </p>
      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ color: '#94a3b8', margin: 0, lineHeight: 1.65, fontSize: '0.9rem' }}>
          <strong style={{ color: '#f8fafc' }}>Importante:</strong> Ningún sistema es 100% seguro. Si bien hacemos lo posible por proteger tus datos, no podemos garantizar seguridad absoluta.
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>7. Cambios en esta política</h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Podemos actualizar esta política ocasionalmente. La fecha de última actualización se indica al inicio del documento. Te recomendamos revisar esta página de vez en cuando.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>8. Contacto</h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Para ejercer tus derechos o hacer consultas, escríbenos a través del <Link href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>formulario de contacto</Link> disponible en nuestro sitio, o al correo <a href="mailto:contacto@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>contacto@nicaraguainformate.com</a>.
      </p>
      <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Nicaragua Informate opera desde Nicaragua y esta política se rige por las leyes de la República de Nicaragua.
      </p>
    </LegalPageShell>
  );
}
