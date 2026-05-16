import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Nicaragua Informate',
  description: 'Política de privacidad de Nicaragua Informate — GDPR, CCPA, cookies, Google Analytics, AdSense y protección de datos personales.',
  alternates: { canonical: 'https://www.nicaraguainformate.com/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <LegalPageShell title="Política de Privacidad">
      <div style={{ background: 'rgba(96,165,250,0.08)', borderLeft: '4px solid #60a5fa', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 15 de mayo de 2026
      </div>

      <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>
        En <strong>Nicaragua Informate</strong> valoramos y respetamos tu privacidad. Esta política describe en detalle cómo recopilamos, utilizamos, protegemos y compartimos tu información personal cuando visitas nuestro sitio web <a href="https://nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>nicaraguainformate.com</a>. Al utilizar nuestro sitio, aceptas las prácticas descritas en esta política. Esta política cumple con las normativas internacionales de protección de datos, incluyendo el Reglamento General de Protección de Datos (GDPR) de la Unión Europea y la Ley de Privacidad del Consumidor de California (CCPA).
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>1. Información que recopilamos</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Recopilamos información de dos categorías principales:</p>

      <h3 style={{ fontSize: '1.05rem', color: '#e2e8f0', marginTop: '1.5rem', marginBottom: '0.6rem', fontWeight: 600 }}>1.1 Información automática (tecnológica)</h3>
      <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Cuando visitas nuestro sitio, recopilamos automáticamente cierta información que tu navegador envía. Esta información se recopila mediante cookies, balizas web y tecnologías similares, e incluye:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Dirección IP (parcialmente anonimizada para proteger tu privacidad)</li>
        <li style={{ marginBottom: '0.5rem' }}>Tipo de dispositivo, sistema operativo, idioma del navegador y versión</li>
        <li style={{ marginBottom: '0.5rem' }}>Páginas visitadas, tiempo de navegación, rutas de interacción y clics</li>
        <li style={{ marginBottom: '0.5rem' }}>Ubicación aproximada (país y región, no geolocalización precisa)</li>
        <li style={{ marginBottom: '0.5rem' }}>Sitio web de referencia (cómo llegaste a nuestro sitio) y términos de búsqueda utilizados</li>
        <li style={{ marginBottom: '0.5rem' }}>Registros de errores y diagnósticos técnicos del navegador</li>
      </ul>

      <h3 style={{ fontSize: '1.05rem', color: '#e2e8f0', marginTop: '1.5rem', marginBottom: '0.6rem', fontWeight: 600 }}>1.2 Información que proporcionas voluntariamente</h3>
      <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Solo recopilamos información personal cuando tú la proporcionas explícitamente a través de nuestros formularios o mecanismos de contacto:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Correo electrónico (solo si te suscribes a nuestro boletín o nos contactas)</li>
        <li style={{ marginBottom: '0.5rem' }}>Nombre completo (opcional, en el formulario de contacto)</li>
        <li style={{ marginBottom: '0.5rem' }}>Mensaje, consulta o contenido que nos envíes voluntariamente</li>
        <li style={{ marginBottom: '0.5rem' }}>Datos de perfil social si interactúas con nuestras cuentas oficiales</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>2. Cookies y tecnologías de seguimiento</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Utilizamos cookies y tecnologías similares para mejorar tu experiencia, analizar el tráfico del sitio y mostrar publicidad relevante. Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web.
      </p>
      <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1rem', fontWeight: 600 }}>Tipos de cookies que utilizamos:</p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Cookies esenciales:</strong> Necesarias para el funcionamiento básico del sitio, como mantener tu sesión de navegación activa.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Cookies de rendimiento y analíticas:</strong> Nos permiten analizar el tráfico para mejorar el sitio. Utilizamos Google Analytics para este propósito.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Cookies de funcionalidad:</strong> Recuerdan tus preferencias de navegación, como el tema claro/oscuro o el idioma seleccionado.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Cookies de publicidad (terceros):</strong> Se utilizan para mostrar anuncios relevantes según tus intereses. Estas cookies son gestionadas por Google AdSense y sus socios publicitarios.</li>
      </ul>
      <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
        Puedes configurar tu navegador para rechazar todas las cookies o para que te avise cuando se envíen cookies. Ten en cuenta que si desactivas las cookies, algunas funcionalidades del sitio podrían no operar correctamente.
      </p>
      <div style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.7 }}>
          <strong style={{ color: '#60a5fa' }}>Gestión de cookies:</strong> Al acceder a nuestro sitio, se te mostrará un banner de cookies donde podrás aceptar o rechazar las cookies no esenciales. Puedes modificar tu configuración en cualquier momento.
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>3. Google Analytics</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nicaragua Informate utiliza Google Analytics, un servicio de análisis web proporcionado por Google, Inc. Google Analytics utiliza cookies para analizar cómo los usuarios utilizan nuestro sitio. La información generada por la cookie sobre tu uso del sitio (incluyendo tu dirección IP anonimizada) se transmitirá y almacenará por Google en servidores ubicados en Estados Unidos.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Google utiliza esta información por nuestra cuenta para evaluar el uso del sitio, compilar informes sobre la actividad del sitio y proporcionar otros servicios relacionados con la actividad del sitio y el uso de Internet. Google puede transferir esta información a terceros cuando así lo requiera la ley, o cuando dichos terceros procesen la información por cuenta de Google.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Puedes optar por no ser rastreado por Google Analytics visitando{' '}
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>tools.google.com/dlpage/gaoptout</a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>4. Google AdSense y publicidad de terceros</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Utilizamos Google AdSense para mostrar anuncios en nuestro sitio web. Google, como proveedor externo, utiliza cookies (incluidas las cookies de DoubleClick) para servir anuncios basados en las visitas previas de los usuarios a nuestro sitio web o a otros sitios de Internet.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Las cookies de publicidad de Google permiten a Google y a sus socios mostrar anuncios basados en las visitas realizadas por los usuarios a nuestro sitio y/u otros sitios en Internet. Estos anuncios pueden ser personalizados según tus intereses demográficos e histórico de navegación.
      </p>
      <div style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
          <strong style={{ color: '#60a5fa' }}>Opciones de personalización de anuncios:</strong>
        </p>
        <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.7 }}>
          Los usuarios pueden optar por la personalización de anuncios visitando{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Configuración de anuncios de Google</a>.{' '}
          Alternativamente, pueden optar por no participar en la personalización de anuncios de terceros visitando{' '}
          <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>www.aboutads.info</a>{' '}
          o la{' '}
          <a href="https://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Network Advertising Initiative</a>.
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>5. Uso de la información</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Utilizamos la información recopilada para los siguientes fines legítimos:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Proporcionar, mantener y mejorar nuestros servicios de noticias e información</li>
        <li style={{ marginBottom: '0.5rem' }}>Analizar el tráfico y patrones de uso para mejorar la experiencia del usuario y el rendimiento del sitio</li>
        <li style={{ marginBottom: '0.5rem' }}>Mostrar publicidad relevante y no invasiva a través de Google AdSense y otros proveedores autorizados</li>
        <li style={{ marginBottom: '0.5rem' }}>Enviar boletines informativos y actualizaciones (solo si te suscribes explícitamente)</li>
        <li style={{ marginBottom: '0.5rem' }}>Responder a consultas, sugerencias y solicitudes de contacto</li>
        <li style={{ marginBottom: '0.5rem' }}>Detectar, prevenir y abordar problemas técnicos, actividades fraudulentas o violaciones de seguridad</li>
        <li style={{ marginBottom: '0.5rem' }}>Cumplir con obligaciones legales y regulatorias aplicables</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>6. Bases legales del procesamiento (GDPR)</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        De conformidad con el Reglamento General de Protección de Datos (GDPR) de la Unión Europea, el procesamiento de tus datos personales se fundamenta en las siguientes bases legales:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Consentimiento:</strong> Para el uso de cookies no esenciales, análisis avanzados y publicidad personalizada.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Intereses legítimos:</strong> Para garantizar la seguridad del sitio, prevenir fraudes y mejorar nuestros servicios.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Ejecución de un contrato:</strong> Cuando existe una relación contractual derivada del uso de nuestros servicios.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Obligación legal:</strong> Para cumplir con requerimientos legales o regulatorios.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>7. Transferencia internacional de datos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Algunos de nuestros proveedores de servicios (como Google para AdSense, Analytics y servicios de hosting) pueden procesar datos en servidores ubicados fuera de Nicaragua, incluyendo Estados Unidos, la Unión Europea y otros países. Utilizamos únicamente proveedores que garantizan medidas de seguridad adecuadas y cumplimiento de estándares internacionales de protección de datos, incluyendo Cláusulas Contractuales Tipo (SCC) donde corresponda.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>8. Seguridad de datos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Implementamos medidas de seguridad técnicas y organizativas de carácter preventivo y reactivivo para proteger tu información personal contra acceso no autorizado, alteración, divulgación o destrucción. Estas medidas incluyen el uso de conexiones cifradas (HTTPS), firewalls, control de accesos y revisiones periódicas de seguridad. Sin embargo, ningún método de transmisión por Internet es 100% seguro y no podemos garantizar seguridad absoluta.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>9. Retención de datos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Conservamos los datos personales únicamente durante el tiempo necesario para cumplir con los fines descritos en esta política. Los datos de navegación anonimizados pueden conservarse por períodos más largos con fines estadísticos y de análisis de tendencias. Cuando los datos ya no son necesarios, los eliminamos o anonimizamos de manera segura.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>10. Tus derechos (GDPR / CCPA)</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        De conformidad con las normativas internacionales de protección de datos, tienes los siguientes derechos sobre tus datos personales:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Derecho de acceso:</strong> Solicitar una copia de los datos personales que tenemos sobre ti.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Derecho de rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Derecho de supresión (derecho al olvido):</strong> Solicitar la eliminación de tus datos personales cuando ya no sean necesarios.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Derecho de oposición:</strong> Oponerte al procesamiento de tus datos para fines de marketing directo o intereses legítimos.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Derecho de limitación del procesamiento:</strong> Solicitar la restricción del tratamiento de tus datos en determinadas circunstancias.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Derecho a la portabilidad:</strong> Recibir tus datos en un formato estructurado y transferirlos a otro responsable.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Derecho a no ser objeto de decisiones automatizadas:</strong> Incluida la elaboración de perfiles.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Derecho a retirar el consentimiento:</strong> En cualquier momento, sin afectar la licitud del tratamiento basado en el consentimiento previo.</li>
      </ul>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Para ejercer estos derechos, contáctanos a través de nuestro{' '}
        <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a> o escribe a{' '}
        <a href="mailto:privacidad@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>privacidad@nicaraguainformate.com</a>.{' '}
        Responderemos a tu solicitud en un plazo máximo de 30 días, de conformidad con la legislación aplicable.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>11. Menores de edad</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nuestro sitio no está dirigido a menores de 13 años. No recopilamos intencionalmente información personal de menores de edad. Si descubrimos que hemos recopilado información personal de un menor sin el consentimiento verificable de sus padres o tutores, tomaremos medidas inmediatas para eliminar dicha información de nuestros servidores.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>12. Enlaces a sitios de terceros</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nuestro sitio puede contener enlaces a sitios web de terceros. Esta política de privacidad no se aplica a dichos sitios. Te recomendamos revisar las políticas de privacidad de cada sitio que visites para comprender cómo recopilan, utilizan y comparten tu información.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>13. Cambios a esta política</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Podemos actualizar esta política periódicamente para reflejar cambios en nuestras prácticas, cambios legislativos o por otras razones operativas. Te notificaremos cualquier cambio material publicando la nueva versión en esta página con la fecha de actualización correspondiente. El uso continuado del sitio después de cualquier modificación constituye aceptación de la política actualizada. Te recomendamos revisar esta política periódicamente.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>14. Contacto sobre privacidad</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Si tienes preguntas, comentarios o inquietudes sobre esta política de privacidad, o deseas ejercer tus derechos sobre tus datos personales, escríbenos a{' '}
        <a href="mailto:privacidad@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>privacidad@nicaraguainformate.com</a>{' '}
        o usa nuestro <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a>.{' '}
        Responderemos a tu solicitud en un plazo razonable, de conformidad con la legislación aplicable de Nicaragua y las normativas internacionales de protección de datos.
      </p>
    </LegalPageShell>
  );
}
