import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Nicaragua Informate',
  description: 'Política de privacidad de Nicaragua Informate. Conoce cómo manejamos tu información.',
  alternates: { canonical: 'https://nicaraguainformate.com/privacidad' },
};

const TXT = '#0f172a';
const TXT_SEC = '#334155';
const BG = '#f8fafc';
const CARD = '#ffffff';
const BORDER = '#e2e8f0';
const ACENTO = '#dc2626';
const LINK = '#2563eb';

export default function PrivacidadPage() {
  return (
    <main style={{ background: BG, minHeight: '100vh' }}>
      <section style={{ background: '#0f172a', color: '#fff', padding: '64px 24px 48px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 12, lineHeight: 1.15 }}>
            Política de Privacidad
          </h1>
          <p style={{ fontSize: '1rem', color: '#94a3b8' }}>
            Última actualización: <strong style={{ color: '#fff' }}>15 de mayo de 2026</strong>
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        <p style={{ fontSize: '1.05rem', color: TXT, lineHeight: 1.8, marginBottom: '1.25rem' }}>
          En <strong>Nicaragua Informate</strong> respetamos tu privacidad. Esta política explica de forma sencilla cómo manejamos la información cuando visitas nuestro sitio <a href="https://nicaraguainformate.com" style={{ color: LINK, textDecoration: 'none', fontWeight: 600 }}>nicaraguainformate.com</a>.
        </p>
        <p style={{ color: TXT_SEC, marginBottom: '1.5rem', lineHeight: 1.75 }}>
          Al usar nuestro sitio, aceptas estas prácticas. Si no estás de acuerdo, te recomendamos no continuar navegando.
        </p>

        <h2 style={{ fontSize: '1.3rem', color: TXT, marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          1. Qué información recopilamos
        </h2>

        <h3 style={{ fontSize: '1.05rem', color: TXT, marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>1.1 Información automática</h3>
        <p style={{ color: TXT_SEC, marginBottom: '0.75rem', lineHeight: 1.75 }}>
          Cuando entras al sitio, tu navegador envía datos técnicos que recopilamos de forma automática:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: TXT_SEC, lineHeight: 1.8 }}>
          <li>Dirección IP (para seguridad básica del sitio)</li>
          <li>Tipo de dispositivo, sistema operativo y navegador que usas</li>
          <li>Páginas que visitas, tiempo de navegación y enlaces en los que haces clic</li>
          <li>Ubicación aproximada (país/región, no tu dirección exacta)</li>
          <li>Sitio desde el que llegaste a nosotros</li>
        </ul>
        <p style={{ color: TXT_SEC, marginBottom: '1.5rem', lineHeight: 1.75 }}>
          Esta información es anónima y se usa solo para mejorar el funcionamiento del sitio.
        </p>

        <h3 style={{ fontSize: '1.05rem', color: TXT, marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>1.2 Información que tú nos das</h3>
        <p style={{ color: TXT_SEC, marginBottom: '0.75rem', lineHeight: 1.75 }}>
          Solo recopilamos datos personales cuando tú decides dárnoslos voluntariamente:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: TXT_SEC, lineHeight: 1.8 }}>
          <li><strong style={{ color: TXT }}>Correo electrónico:</strong> si te suscribes a nuestro boletín de noticias</li>
          <li><strong style={{ color: TXT }}>Nombre y mensaje:</strong> si nos escribes a través del formulario de contacto</li>
          <li><strong style={{ color: TXT }}>Datos de redes sociales:</strong> solo si interactúas con nuestras cuentas oficiales</li>
        </ul>
        <p style={{ color: TXT_SEC, marginBottom: '1.5rem', lineHeight: 1.75 }}>
          No vendemos, alquilamos ni compartimos tu información personal con terceros para fines comerciales.
        </p>

        <h2 style={{ fontSize: '1.3rem', color: TXT, marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          2. Cookies y tecnologías de seguimiento
        </h2>
        <p style={{ color: TXT_SEC, marginBottom: '1.25rem', lineHeight: 1.75 }}>
          Usamos cookies (pequeños archivos que se guardan en tu dispositivo) para que el sitio funcione mejor y para mostrarte publicidad relevante.
        </p>

        <h3 style={{ fontSize: '1rem', color: TXT, marginBottom: '0.75rem', fontWeight: 700 }}>Tipos de cookies que usamos:</h3>
        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#fff' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Tipo</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Para qué sirve</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>¿Puedes rechazarla?</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: CARD }}>
                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, color: TXT, fontWeight: 600 }}>Esenciales</td>
                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, color: TXT_SEC }}>Para que el sitio funcione (inicio de sesión, seguridad)</td>
                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, color: TXT, fontWeight: 700 }}>No</td>
              </tr>
              <tr style={{ background: BG }}>
                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, color: TXT, fontWeight: 600 }}>Analíticas</td>
                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, color: TXT_SEC }}>Para ver cuántas personas nos visitan y qué leen</td>
                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, color: ACENTO, fontWeight: 700 }}>Sí</td>
              </tr>
              <tr style={{ background: CARD }}>
                <td style={{ padding: '12px 16px', color: TXT, fontWeight: 600 }}>Publicidad</td>
                <td style={{ padding: '12px 16px', color: TXT_SEC }}>Para mostrarte anuncios acordes a tus intereses</td>
                <td style={{ padding: '12px 16px', color: ACENTO, fontWeight: 700 }}>Sí</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 style={{ fontSize: '1rem', color: TXT, marginBottom: '0.5rem', fontWeight: 700 }}>Tu control sobre las cookies:</h3>
        <p style={{ color: TXT_SEC, marginBottom: '1.25rem', lineHeight: 1.75 }}>
          Al entrar al sitio verás un banner de cookies donde puedes:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: TXT_SEC, lineHeight: 1.8 }}>
          <li>Aceptar todas</li>
          <li>Rechazar las no esenciales</li>
          <li>Cambiar tu decisión más tarde</li>
        </ul>
        <p style={{ color: TXT_SEC, marginBottom: '1.5rem', lineHeight: 1.75 }}>
          También puedes configurar tu navegador para bloquear cookies, aunque algunas funciones del sitio podrían dejar de funcionar.
        </p>

        <h2 style={{ fontSize: '1.3rem', color: TXT, marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          3. Google Analytics
        </h2>
        <p style={{ color: TXT_SEC, marginBottom: '1.25rem', lineHeight: 1.75 }}>
          Usamos Google Analytics para entender cómo se usa nuestro sitio. Google recibe información sobre tu navegación (sin datos que te identifiquen personalmente) y la guarda en servidores en Estados Unidos.
        </p>
        <p style={{ color: TXT_SEC, marginBottom: '1.5rem', lineHeight: 1.75 }}>
          Si no quieres que Google Analytics te rastree, puedes instalar su complemento de inhabilitación:{' '}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: LINK, textDecoration: 'none', fontWeight: 600 }}>tools.google.com/dlpage/gaoptout</a>
        </p>

        <h2 style={{ fontSize: '1.3rem', color: TXT, marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          4. Google AdSense y publicidad
        </h2>
        <p style={{ color: TXT_SEC, marginBottom: '1.25rem', lineHeight: 1.75 }}>
          Usamos Google AdSense para mostrar anuncios. Google usa cookies para mostrarte anuncios basados en tu historial de navegación, tanto en nuestro sitio como en otros.
        </p>
        <p style={{ color: TXT_SEC, marginBottom: '0.5rem', lineHeight: 1.75, fontWeight: 600 }}>
          Cómo controlar los anuncios personalizados:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: TXT_SEC, lineHeight: 1.8 }}>
          <li>Configuración de Google: <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: LINK, textDecoration: 'none', fontWeight: 600 }}>adssettings.google.com</a></li>
          <li>Rechazar publicidad personalizada de terceros: <a href="https://optout.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: LINK, textDecoration: 'none', fontWeight: 600 }}>optout.aboutads.info</a></li>
        </ul>

        <h2 style={{ fontSize: '1.3rem', color: TXT, marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          5. Para qué usamos tu información
        </h2>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: TXT_SEC, lineHeight: 1.8 }}>
          <li>Mantener el sitio funcionando correctamente</li>
          <li>Mejorar la experiencia de navegación</li>
          <li>Mostrar publicidad relevante (si aceptaste cookies de publicidad)</li>
          <li>Enviarte boletines (solo si te suscribiste)</li>
          <li>Responder tus mensajes de contacto</li>
          <li>Proteger el sitio contra usos fraudulentos</li>
        </ul>

        <h2 style={{ fontSize: '1.3rem', color: TXT, marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          6. Seguridad de tu información
        </h2>
        <p style={{ color: TXT_SEC, marginBottom: '1.25rem', lineHeight: 1.75 }}>
          Tomamos medidas básicas de seguridad:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: TXT_SEC, lineHeight: 1.8 }}>
          <li>Conexión cifrada (HTTPS)</li>
          <li>Acceso restringido a quienes administran el sitio</li>
          <li>Revisión periódica de nuestros sistemas</li>
        </ul>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <p style={{ color: TXT_SEC, margin: 0, lineHeight: 1.65, fontSize: '0.95rem' }}>
            <strong style={{ color: TXT }}>Importante:</strong> Ningún sistema es 100% seguro. Si bien hacemos lo posible por proteger tus datos, no podemos garantizar seguridad absoluta.
          </p>
        </div>

        <h2 style={{ fontSize: '1.3rem', color: TXT, marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          7. Cuánto tiempo guardamos los datos
        </h2>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: TXT_SEC, lineHeight: 1.8 }}>
          <li><strong style={{ color: TXT }}>Datos de contacto:</strong> los mantenemos mientras sea necesario para responderte, luego los eliminamos.</li>
          <li><strong style={{ color: TXT }}>Datos de navegación:</strong> los conservamos de forma anónima para análisis estadísticos.</li>
          <li><strong style={{ color: TXT }}>Datos de suscripción al boletín:</strong> hasta que decidas cancelarla.</li>
        </ul>

        <h2 style={{ fontSize: '1.3rem', color: TXT, marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          8. Tus derechos
        </h2>
        <p style={{ color: TXT_SEC, marginBottom: '0.75rem', lineHeight: 1.75 }}>
          Puedes:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: TXT_SEC, lineHeight: 1.8 }}>
          <li>Pedirnos qué información tenemos sobre ti</li>
          <li>Pedir que corrijamos datos incorrectos</li>
          <li>Pedir que eliminemos tus datos personales</li>
          <li>Cancelar tu suscripción al boletín en cualquier momento</li>
        </ul>
        <p style={{ color: TXT_SEC, marginBottom: '1.5rem', lineHeight: 1.75 }}>
          Para ejercer estos derechos, contáctanos a través del <Link href="/contacto" style={{ color: LINK, textDecoration: 'none', fontWeight: 600 }}>formulario de contacto</Link> disponible en nuestro sitio, o escríbenos a <a href="mailto:privacidad@nicaraguainformate.com" style={{ color: LINK, textDecoration: 'none', fontWeight: 600 }}>privacidad@nicaraguainformate.com</a>.
        </p>

        <h2 style={{ fontSize: '1.3rem', color: TXT, marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          9. Menores de edad
        </h2>
        <p style={{ color: TXT_SEC, marginBottom: '1.5rem', lineHeight: 1.75 }}>
          Este sitio no está dirigido a menores de 13 años. No recopilamos intencionalmente información de niños. Si crees que hemos recopilado datos de un menor sin autorización, contáctanos para eliminarlos.
        </p>

        <h2 style={{ fontSize: '1.3rem', color: TXT, marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          10. Enlaces a otros sitios
        </h2>
        <p style={{ color: TXT_SEC, marginBottom: '1.5rem', lineHeight: 1.75 }}>
          Podemos incluir enlaces a sitios de terceros. Esta política no aplica allí. Te recomendamos leer sus propias políticas de privacidad antes de entregarles información.
        </p>

        <h2 style={{ fontSize: '1.3rem', color: TXT, marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          11. Cambios a esta política
        </h2>
        <p style={{ color: TXT_SEC, marginBottom: '1.5rem', lineHeight: 1.75 }}>
          Podemos actualizar esta política cuando sea necesario. Si hacemos cambios importantes, lo indicaremos en esta página con la nueva fecha de actualización. Te recomendamos revisar esta página de vez en cuando.
        </p>

        <h2 style={{ fontSize: '1.3rem', color: TXT, marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
          12. Contacto
        </h2>
        <p style={{ color: TXT_SEC, marginBottom: '1.25rem', lineHeight: 1.75 }}>
          Si tienes dudas sobre esta política de privacidad, sobre cómo usamos tus datos, o si quieres ejercer tus derechos, escríbenos a través del <Link href="/contacto" style={{ color: LINK, textDecoration: 'none', fontWeight: 600 }}>formulario de contacto</Link> en nuestro sitio, o al correo <a href="mailto:privacidad@nicaraguainformate.com" style={{ color: LINK, textDecoration: 'none', fontWeight: 600 }}>privacidad@nicaraguainformate.com</a>.
        </p>
        <p style={{ color: TXT_SEC, marginBottom: '2rem', lineHeight: 1.75 }}>
          Nicaragua Informate opera desde Nicaragua y esta política se rige por las leyes de la República de Nicaragua.
        </p>

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '1.5rem' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            © 2026 Nicaragua Informate. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </main>
  );
}
