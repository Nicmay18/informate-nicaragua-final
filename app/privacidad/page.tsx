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
      <div style={{ background: '#fefce8', borderLeft: '4px solid #fbbf24', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 15 de mayo de 2026
      </div>

      <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>
        En <strong>Nicaragua Informate</strong> respetamos tu privacidad. Esta política explica de forma sencilla cómo manejamos la información cuando visitas nuestro sitio <a href="https://nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>nicaraguainformate.com</a>.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>
        Al usar nuestro sitio, aceptas estas prácticas. Si no estás de acuerdo, te recomendamos no continuar navegando.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>1. Qué información recopilamos</h2>

      <h3 style={{ fontSize: '1.05rem', color: '#0f172a', marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>1.1 Información automática</h3>
      <p style={{ color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Cuando entras al sitio, tu navegador envía datos técnicos que recopilamos de forma automática:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Dirección IP (para seguridad básica del sitio)</li>
        <li>Tipo de dispositivo, sistema operativo y navegador que usas</li>
        <li>Páginas que visitas, tiempo de navegación y enlaces en los que haces clic</li>
        <li>Ubicación aproximada (país/región, no tu dirección exacta)</li>
        <li>Sitio desde el que llegaste a nosotros</li>
      </ul>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Esta información es anónima y se usa solo para mejorar el funcionamiento del sitio.
      </p>

      <h3 style={{ fontSize: '1.05rem', color: '#0f172a', marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>1.2 Información que tú nos das</h3>
      <p style={{ color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Solo recopilamos datos personales cuando tú decides dárnoslos voluntariamente:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li><strong style={{ color: '#0f172a' }}>Correo electrónico:</strong> si te suscribes a nuestro boletín de noticias</li>
        <li><strong style={{ color: '#0f172a' }}>Nombre y mensaje:</strong> si nos escribes a través del formulario de contacto</li>
        <li><strong style={{ color: '#0f172a' }}>Datos de redes sociales:</strong> solo si interactúas con nuestras cuentas oficiales</li>
      </ul>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        No vendemos, alquilamos ni compartimos tu información personal con terceros para fines comerciales.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>2. Cookies y tecnologías de seguimiento</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Usamos cookies (pequeños archivos que se guardan en tu dispositivo) para que el sitio funcione mejor y para mostrarte publicidad relevante.
      </p>

      <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '0.75rem', fontWeight: 700 }}>Tipos de cookies que usamos:</h3>
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#fff' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Tipo</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Para qué sirve</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>¿Puedes rechazarla?</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: '#ffffff' }}>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 600 }}>Esenciales</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Para que el sitio funcione (inicio de sesión, seguridad)</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 700 }}>No</td>
            </tr>
            <tr style={{ background: '#f8fafc' }}>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 600 }}>Analíticas</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Para ver cuántas personas nos visitan y qué leen</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#dc2626', fontWeight: 700 }}>Sí</td>
            </tr>
            <tr style={{ background: '#ffffff' }}>
              <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600 }}>Publicidad</td>
              <td style={{ padding: '12px 16px', color: '#64748b' }}>Para mostrarte anuncios acordes a tus intereses</td>
              <td style={{ padding: '12px 16px', color: '#dc2626', fontWeight: 700 }}>Sí</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 700 }}>Tu control sobre las cookies:</h3>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Al entrar al sitio verás un banner de cookies donde puedes:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Aceptar todas</li>
        <li>Rechazar las no esenciales</li>
        <li>Cambiar tu decisión más tarde</li>
      </ul>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        También puedes configurar tu navegador para bloquear cookies, aunque algunas funciones del sitio podrían dejar de funcionar.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>3. Google Analytics</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Usamos Google Analytics para entender cómo se usa nuestro sitio. Google recibe información sobre tu navegación (sin datos que te identifiquen personalmente) y la guarda en servidores en Estados Unidos.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Si no quieres que Google Analytics te rastree, puedes instalar su complemento de inhabilitación:{' '}
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>tools.google.com/dlpage/gaoptout</a>
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>4. Publicidad y redes publicitarias</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Nicaragua Informate trabaja con redes publicitarias de terceros para mostrar anuncios que financian el funcionamiento del sitio. Actualmente usamos <strong style={{ color: '#0f172a' }}>Monetag</strong> como proveedor principal de publicidad. Estas redes pueden usar cookies y tecnologías similares para mostrarte anuncios relevantes según tu historial de navegación.
      </p>
      <p style={{ color: '#64748b', marginBottom: '0.5rem', lineHeight: 1.75, fontWeight: 600, fontSize: '0.92rem' }}>
        Cómo controlar la publicidad personalizada:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Usa el <strong style={{ color: '#0f172a' }}>banner de cookies</strong> en nuestro sitio para rechazar anuncios personalizados</li>
        <li>Opciones de exclusión de anuncios: <a href="https://optout.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>optout.aboutads.info</a></li>
        <li>Opciones de exclusión en Europa: <a href="https://www.youronlinechoices.eu" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>youronlinechoices.eu</a></li>
        <li>Si en el futuro incorporamos otras redes publicitarias, esta sección será actualizada</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>5. Para qué usamos tu información</h2>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Mantener el sitio funcionando correctamente</li>
        <li>Mejorar la experiencia de navegación</li>
        <li>Mostrar publicidad relevante (si aceptaste cookies de publicidad)</li>
        <li>Enviarte boletines (solo si te suscribiste)</li>
        <li>Responder tus mensajes de contacto</li>
        <li>Proteger el sitio contra usos fraudulentos</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>6. Seguridad de tu información</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Tomamos medidas básicas de seguridad:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Conexión cifrada (HTTPS)</li>
        <li>Acceso restringido a quienes administran el sitio</li>
        <li>Revisión periódica de nuestros sistemas</li>
      </ul>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ color: '#64748b', margin: 0, lineHeight: 1.65, fontSize: '0.9rem' }}>
          <strong style={{ color: '#0f172a' }}>Importante:</strong> Ningún sistema es 100% seguro. Si bien hacemos lo posible por proteger tus datos, no podemos garantizar seguridad absoluta.
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>7. Cuánto tiempo guardamos los datos</h2>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li><strong style={{ color: '#0f172a' }}>Datos de contacto:</strong> los mantenemos mientras sea necesario para responderte, luego los eliminamos.</li>
        <li><strong style={{ color: '#0f172a' }}>Datos de navegación:</strong> los conservamos de forma anónima para análisis estadísticos.</li>
        <li><strong style={{ color: '#0f172a' }}>Datos de suscripción al boletín:</strong> hasta que decidas cancelarla.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>8. Tus derechos</h2>
      <p style={{ color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Puedes:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Pedirnos qué información tenemos sobre ti</li>
        <li>Pedir que corrijamos datos incorrectos</li>
        <li>Pedir que eliminemos tus datos personales</li>
        <li>Cancelar tu suscripción al boletín en cualquier momento</li>
      </ul>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Para ejercer estos derechos, contáctanos a través del <Link href="/contacto" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>formulario de contacto</Link> disponible en nuestro sitio, o escríbenos a <a href="mailto:privacidad@nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>privacidad@nicaraguainformate.com</a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>9. Menores de edad</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Este sitio no está dirigido a menores de 13 años. No recopilamos intencionalmente información de niños. Si crees que hemos recopilado datos de un menor sin autorización, contáctanos para eliminarlos.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>10. Enlaces a otros sitios</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Podemos incluir enlaces a sitios de terceros. Esta política no aplica allí. Te recomendamos leer sus propias políticas de privacidad antes de entregarles información.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>11. Cambios a esta política</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Podemos actualizar esta política cuando sea necesario. Si hacemos cambios importantes, lo indicaremos en esta página con la nueva fecha de actualización. Te recomendamos revisar esta página de vez en cuando.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>12. Contacto</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Si tienes dudas sobre esta política de privacidad, sobre cómo usamos tus datos, o si quieres ejercer tus derechos, escríbenos a través del <Link href="/contacto" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>formulario de contacto</Link> en nuestro sitio, o al correo <a href="mailto:privacidad@nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>privacidad@nicaraguainformate.com</a>.
      </p>
      <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Nicaragua Informate opera desde Nicaragua y esta política se rige por las leyes de la República de Nicaragua.
      </p>
    </LegalPageShell>
  );
}
