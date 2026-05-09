import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad de Nicaragua Informate — Cómo protegemos tu información personal.',
  alternates: { canonical: 'https://nicaraguainformate.com/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <LegalPageShell title="Política de Privacidad">
      <div style={{ background: 'rgba(96,165,250,0.08)', borderLeft: '4px solid #60a5fa', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 5 de mayo de 2026
      </div>

      <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>
        En <strong>Nicaragua Informate</strong> valoramos y respetamos tu privacidad. Esta política describe en detalle cómo recopilamos, utilizamos, protegemos y compartimos tu información personal cuando visitas nuestro sitio web. Al utilizar Nicaragua Informate, aceptas las prácticas descritas en esta política.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>1. Información que recopilamos</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Recopilamos información de dos categorías:</p>
      
      <h3 style={{ fontSize: '1.05rem', color: '#e2e8f0', marginTop: '1.5rem', marginBottom: '0.6rem', fontWeight: 600 }}>1.1 Información automática (tecnológica)</h3>
      <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Cuando visitas nuestro sitio, recopilamos automáticamente cierta información que tu navegador envía. Esta información incluye:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Dirección IP (parcialmente anonimizada para proteger tu privacidad)</li>
        <li style={{ marginBottom: '0.5rem' }}>Tipo de dispositivo, sistema operativo y versión de navegador</li>
        <li style={{ marginBottom: '0.5rem' }}>Páginas visitadas, tiempo de navegación y rutas de interacción</li>
        <li style={{ marginBottom: '0.5rem' }}>Ubicación aproximada (país y región, no geolocalización precisa)</li>
        <li style={{ marginBottom: '0.5rem' }}>Sitio web de referencia (cómo llegaste a nuestro sitio)</li>
      </ul>

      <h3 style={{ fontSize: '1.05rem', color: '#e2e8f0', marginTop: '1.5rem', marginBottom: '0.6rem', fontWeight: 600 }}>1.2 Información que proporcionas voluntariamente</h3>
      <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Solo recopilamos información personal cuando tú la proporcionas explícitamente:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Correo electrónico (solo si te suscribes a nuestro boletín)</li>
        <li style={{ marginBottom: '0.5rem' }}>Nombre (opcional, en el formulario de contacto)</li>
        <li style={{ marginBottom: '0.5rem' }}>Mensaje o consulta (en el formulario de contacto)</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>2. Cookies y tecnologías de seguimiento</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Utilizamos cookies y tecnologías similares para mejorar tu experiencia, analizar el tráfico y mostrar publicidad relevante. Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo.
      </p>
      <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1rem', fontWeight: 600 }}>Tipos de cookies que utilizamos:</p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Cookies esenciales:</strong> Necesarias para el funcionamiento básico del sitio</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Cookies de rendimiento:</strong> Analizan el tráfico para mejorar el sitio</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Cookies de funcionalidad:</strong> Recuerdan tus preferencias (tema claro/oscuro)</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Cookies de publicidad:</strong> Se utilizan para mostrar anuncios relevantes</li>
      </ul>
      <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Puedes configurar tu navegador para rechazar cookies o eliminar las cookies existentes. Ten en cuenta que esto puede afectar la funcionalidad del sitio.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>3. Publicidad (Google AdSense)</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Utilizamos Google AdSense para mostrar anuncios en nuestro sitio. Google, como proveedor externo, utiliza cookies para servir anuncios basados en las visitas previas de los usuarios a nuestro sitio web o a otros sitios de Internet.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Las cookies de publicidad de Google (incluidas las de DoubleClick) permiten a Google y a sus socios mostrar anuncios basados en las visitas realizadas por los usuarios a nuestro sitio y/u otros sitios en Internet.
      </p>
      <div style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
          <strong style={{ color: '#60a5fa' }}>Opciones de personalización:</strong>
        </p>
        <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.7 }}>
          Los usuarios pueden optar por la personalización de anuncios visitando{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Configuración de anuncios de Google</a>.{' '}
          Alternativamente, pueden optar por no participar en la personalización de anuncios de terceros visitando{' '}
          <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>www.aboutads.info</a>.
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>4. Uso de la información</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Utilizamos la información recopilada para los siguientes fines:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Proporcionar y mantener nuestros servicios de noticias</li>
        <li style={{ marginBottom: '0.5rem' }}>Analizar el tráfico y patrones de uso para mejorar la experiencia del usuario</li>
        <li style={{ marginBottom: '0.5rem' }}>Mostrar publicidad relevante a través de Google AdSense</li>
        <li style={{ marginBottom: '0.5rem' }}>Enviar boletines informativos (solo si te suscribes explícitamente)</li>
        <li style={{ marginBottom: '0.5rem' }}>Responder a consultas y solicitudes de contacto</li>
        <li style={{ marginBottom: '0.5rem' }}>Detectar, prevenir y abordar problemas técnicos</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>5. Transferencia internacional de datos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Algunos de nuestros proveedores de servicios (como Google para AdSense y Analytics) pueden procesar datos en servidores ubicados fuera de Nicaragua, incluyendo Estados Unidos y otros países. Utilizamos únicamente proveedores que garantizan medidas de seguridad adecuadas y cumplimiento de estándares internacionales de protección de datos.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>6. Seguridad de datos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra acceso no autorizado, alteración, divulgación o destrucción. Sin embargo, ningún método de transmisión por Internet es 100% seguro y no podemos garantizar seguridad absoluta.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>7. Retención de datos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Conservamos los datos personales únicamente durante el tiempo necesario para cumplir con los fines descritos en esta política. Los datos de navegación anonimizados pueden conservarse por períodos más largos con fines estadísticos y de análisis.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>8. Tus derechos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Tienes los siguientes derechos sobre tus datos personales:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Acceder a tus datos personales</li>
        <li style={{ marginBottom: '0.5rem' }}>Solicitar la corrección de datos inexactos</li>
        <li style={{ marginBottom: '0.5rem' }}>Solicitar la eliminación de tus datos personales</li>
        <li style={{ marginBottom: '0.5rem' }}>Oponerte al procesamiento de tus datos</li>
        <li style={{ marginBottom: '0.5rem' }}>Solicitar la limitación del procesamiento</li>
        <li style={{ marginBottom: '0.5rem' }}>Solicitar la portabilidad de tus datos</li>
      </ul>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Para ejercer estos derechos, contáctanos a través de nuestro{' '}
        <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a> o escribe a <a href="mailto:privacidad@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>privacidad@nicaraguainformate.com</a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>9. Menores de edad</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nuestro sitio no está dirigido a menores de 13 años. No recopilamos intencionalmente información personal de menores de edad. Si descubrimos que hemos recopilado información personal de un menor sin consentimiento parental, tomaremos medidas para eliminarla inmediatamente.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>10. Cambios a esta política</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Podemos actualizar esta política periódicamente para reflejar cambios en nuestras prácticas, cambios legislativos o por otras razones operativas. Te notificaremos cualquier cambio material publicando la nueva versión en esta página con la fecha de actualización correspondiente. Te recomendamos revisar esta política periódicamente.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>11. Contacto</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Si tienes preguntas, comentarios o inquietudes sobre esta política de privacidad, escríbenos a{' '}
        <a href="mailto:privacidad@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>privacidad@nicaraguainformate.com</a>{' '}
        o usa nuestro <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a>.{' '}
        Responderemos a tu solicitud en un plazo razonable, de conformidad con la legislación aplicable.
      </p>
    </LegalPageShell>
  );
}
