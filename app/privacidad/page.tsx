import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad de Nicaragua Informate. Conoce cómo manejamos tu información, qué datos recopilamos y cuáles son tus derechos.',
  alternates: { canonical: 'https://nicaraguainformate.com/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <LegalPageShell title="Política de Privacidad">
      <div style={{ background: '#fefce8', borderLeft: '4px solid #fbbf24', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#854d0e', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 25 de junio de 2026
      </div>

      <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>
        En <strong>Nicaragua Informate</strong> respetamos tu privacidad. Esta política explica de forma clara y sencilla qué datos recopilamos, cómo los usamos y cuáles son tus derechos cuando visitas nuestro sitio <a href="https://nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>nicaraguainformate.com</a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>1. Identidad del responsable</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        <strong>Nicaragua Informate</strong> es un medio digital independiente con sede en Managua, Nicaragua. Somos responsables del tratamiento de los datos personales que nos proporcionas a través de nuestro sitio web, formularios de contacto y suscripción a boletines.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Para cualquier consulta sobre esta política de privacidad, puedes contactarnos a través de nuestro <Link href="/contacto" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>formulario de contacto</Link> o escribirnos a <a href="mailto:privacidad@nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>privacidad@nicaraguainformate.com</a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>2. ¿Qué datos personales recopilamos?</h2>
      <p style={{ color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Al visitar o interactuar con nuestro sitio, podemos recopilar los siguientes tipos de información:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas, tiempo de permanencia, dispositivo utilizado y país de origen.</li>
        <li><strong>Cookies y tecnologías similares:</strong> utilizamos cookies esenciales para el funcionamiento del sitio y cookies analíticas para entender el comportamiento de los lectores.</li>
        <li><strong>Información proporcionada voluntariamente:</strong> nombre, correo electrónico y mensaje cuando usas el formulario de contacto o te suscribes al boletín.</li>
        <li><strong>Datos de suscripción:</strong> preferencias de contenido y frecuencia de envío del boletín informativo.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>3. ¿Para qué usamos tus datos?</h2>
      <p style={{ color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Utilizamos la información recopilada para los siguientes fines legítimos:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li><strong>Mejorar el sitio:</strong> entender qué contenido es más relevante para nuestra audiencia y optimizar la experiencia de navegación.</li>
        <li><strong>Responder consultas:</strong> atender tus mensajes enviados a través del formulario de contacto en un plazo de 24 a 48 horas hábiles.</li>
        <li><strong>Enviar boletines:</strong> compartir las noticias más importantes con los suscriptores que han aceptado recibirlas.</li>
        <li><strong>Cumplir obligaciones legales:</strong> responder a requerimientos de autoridades competentes cuando sea necesario.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>4. Uso de cookies y tecnologías de seguimiento</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Utilizamos cookies para mejorar tu experiencia en nuestro sitio. Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas una página web.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        <strong>Cookies esenciales:</strong> necesarias para el funcionamiento básico del sitio, como mantener tu sesión activa o recordar tus preferencias de visualización.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        <strong>Cookies analíticas:</strong> nos ayudan a entender cómo interactúas con el sitio, qué páginas visitas y cuánto tiempo permaneces en ellas. Estas cookies son gestionadas por Google Analytics.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        <strong>Cookies de publicidad:</strong> en el futuro, podemos utilizar servicios como Google AdSense para mostrar anuncios relevantes. En ese caso, se te pedirá consentimiento explícito antes de activar estas cookies.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>5. Google Analytics</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Utilizamos Google Analytics, un servicio de análisis web proporcionado por Google LLC. Google recibe información sobre tu navegación en nuestro sitio (sin datos que te identifiquen personalmente) y la procesa en sus servidores ubicados en Estados Unidos.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Si prefieres no ser rastreado por Google Analytics, puedes instalar el <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>complemento de inhabilitación oficial de Google</a> en tu navegador.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>6. Compartir información con terceros</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        No vendemos ni alquilamos tus datos personales a terceros. Solo compartimos información en las siguientes circunstancias:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li><strong>Proveedores de servicios:</strong> empresas que nos ayudan a operar el sitio (alojamiento web, análisis, envío de correos).</li>
        <li><strong>Cumplimiento legal:</strong> cuando la ley nos obliga a proporcionar información a autoridades competentes.</li>
        <li><strong>Protección de derechos:</strong> cuando sea necesario para defender nuestros derechos legales o los de nuestros usuarios.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>7. Tus derechos sobre tus datos</h2>
      <p style={{ color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Como usuario de Nicaragua Informate, tienes los siguientes derechos respecto a tus datos personales:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li><strong>Acceso:</strong> puedes pedirnos qué información tenemos sobre ti.</li>
        <li><strong>Rectificación:</strong> puedes solicitar que corrijamos datos inexactos o incompletos.</li>
        <li><strong>Supresión:</strong> puedes pedirnos que eliminemos tus datos personales de nuestros sistemas.</li>
        <li><strong>Oposición:</strong> puedes oponerte al tratamiento de tus datos para fines específicos.</li>
        <li><strong>Cancelación de suscripción:</strong> puedes cancelar tu suscripción al boletín en cualquier momento haciendo clic en el enlace al final de cada correo.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>8. Seguridad de tu información</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Implementamos medidas técnicas y organizativas para proteger tus datos personales contra acceso no autorizado, pérdida o alteración:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Conexión cifrada mediante HTTPS en todo el sitio.</li>
        <li>Acceso restringido a las personas que administran el sitio.</li>
        <li>Revisión periódica de nuestros sistemas de seguridad.</li>
        <li>Almacenamiento de datos en servidores con certificaciones de seguridad internacional.</li>
      </ul>
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ color: '#64748b', margin: 0, lineHeight: 1.65, fontSize: '0.9rem' }}>
          <strong style={{ color: '#0f172a' }}>Nota importante:</strong> Ningún sistema de seguridad es 100% infalible. Si bien hacemos todo lo posible por proteger tus datos, no podemos garantizar seguridad absoluta. Si detectas cualquier vulnerabilidad en nuestro sitio, te agradecemos que nos lo comuniques de inmediato.
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>9. Retención de datos</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Conservamos tus datos personales únicamente durante el tiempo necesario para cumplir con los fines descritos en esta política. Los datos de contacto de formularios se mantienen durante un máximo de 2 años, salvo que nos solicites su eliminación antes. Los datos analíticos se almacenan de forma agregada y anonimizada después de 26 meses.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>10. Cambios en esta política</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Podemos actualizar esta política de privacidad ocasionalmente para reflejar cambios en nuestras prácticas o en la legislación aplicable. La fecha de última actualización se indica al inicio de este documento. Te recomendamos revisar esta página periódicamente para estar al tanto de cualquier modificación.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>11. Contacto sobre privacidad</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Para ejercer tus derechos, hacer consultas o presentar reclamos relacionados con esta política de privacidad, puedes contactarnos a través de los siguientes canales:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li><Link href="/contacto" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Formulario de contacto</Link> en nuestro sitio web.</li>
        <li>Correo electrónico: <a href="mailto:privacidad@nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>privacidad@nicaraguainformate.com</a></li>
        <li>Correo general: <a href="mailto:contacto@nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>contacto@nicaraguainformate.com</a></li>
      </ul>
      <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Nicaragua Informate opera desde Managua, Nicaragua, y esta política se rige por las leyes de la República de Nicaragua y las normas internacionales de protección de datos aplicables.
      </p>
    </LegalPageShell>
  );
}
