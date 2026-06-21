import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'PolÃ­tica de Privacidad | Nicaragua Informate',
  description: 'PolÃ­tica de privacidad de Nicaragua Informate. Conoce cÃ³mo manejamos tu informaciÃ³n.',
  alternates: { canonical: 'https://nicaraguainformate.com/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <LegalPageShell title="PolÃ­tica de Privacidad">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <img src="/logo-ni.png" alt="Nicaragua Informate Logo" style={{ width: 120, height: 'auto' }} />
      </div>
      <div style={{ background: '#fefce8', borderLeft: '4px solid #fbbf24', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#854d0e', fontSize: '0.85rem' }}>
        <strong>Ãšltima actualizaciÃ³n:</strong> 15 de junio de 2026
      </div>

      <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>
        En <strong>Nicaragua Informate</strong> respetamos tu privacidad. Esta polÃ­tica explica de forma sencilla cÃ³mo manejamos la informaciÃ³n cuando visitas nuestro sitio <a href="https://nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>nicaraguainformate.com</a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>1. Identidad del responsable</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        <strong>Nicaragua Informate</strong> es un medio digital con sede en Managua, Nicaragua. Para cualquier consulta sobre esta polÃ­tica, escrÃ­benos a <a href="mailto:contacto@nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>contacto@nicaraguainformate.com</a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>2. Â¿QuÃ© datos recopilamos?</h2>
      <p style={{ color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Al visitar nuestro sitio, podemos recopilar:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Datos de navegaciÃ³n (IP, tipo de navegador, pÃ¡ginas visitadas)</li>
        <li>Cookies y tecnologÃ­as similares</li>
        <li>InformaciÃ³n proporcionada voluntariamente en formularios de contacto</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>3. Uso de cookies y publicidad</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Actualmente no utilizamos publicidad de terceros. Cuando implementemos publicidad, utilizaremos proveedores verificados como Google AdSense.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Al navegar en Nicaragua Informate, aceptas el uso de estas tecnologÃ­as segÃºn lo descrito en esta polÃ­tica. Puedes gestionar tus preferencias en el banner de cookies que aparece al ingresar al sitio.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>4. Google Analytics</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Usamos Google Analytics para entender cÃ³mo se usa nuestro sitio. Google recibe informaciÃ³n sobre tu navegaciÃ³n (sin datos que te identifiquen personalmente) y la guarda en servidores en Estados Unidos.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Si no quieres que Google Analytics te rastree, puedes instalar su complemento de inhabilitaciÃ³n:{' '}
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>tools.google.com/dlpage/gaoptout</a>
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>5. Tus derechos</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Puedes desactivar las cookies desde la configuraciÃ³n de tu navegador. Ten en cuenta que esto puede afectar la funcionalidad del sitio.
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Pedirnos quÃ© informaciÃ³n tenemos sobre ti</li>
        <li>Pedir que corrijamos datos incorrectos</li>
        <li>Pedir que eliminemos tus datos personales</li>
        <li>Cancelar tu suscripciÃ³n al boletÃ­n en cualquier momento</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>6. Seguridad de tu informaciÃ³n</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Tomamos medidas bÃ¡sicas de seguridad: conexiÃ³n cifrada (HTTPS), acceso restringido a quienes administran el sitio y revisiÃ³n periÃ³dica de nuestros sistemas.
      </p>
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ color: '#64748b', margin: 0, lineHeight: 1.65, fontSize: '0.9rem' }}>
          <strong style={{ color: '#0f172a' }}>Importante:</strong> NingÃºn sistema es 100% seguro. Si bien hacemos lo posible por proteger tus datos, no podemos garantizar seguridad absoluta.
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>7. Cambios en esta polÃ­tica</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Podemos actualizar esta polÃ­tica ocasionalmente. La fecha de Ãºltima actualizaciÃ³n se indica al inicio del documento. Te recomendamos revisar esta pÃ¡gina de vez en cuando.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>8. Contacto</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Para ejercer tus derechos o hacer consultas, escrÃ­benos a travÃ©s del <Link href="/contacto" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>formulario de contacto</Link> disponible en nuestro sitio, o al correo <a href="mailto:contacto@nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>contacto@nicaraguainformate.com</a>.
      </p>
      <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Nicaragua Informate opera desde Nicaragua y esta polÃ­tica se rige por las leyes de la RepÃºblica de Nicaragua.
      </p>
    </LegalPageShell>
  );
}
