import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Nicaragua Informate',
  description: 'Política de privacidad de Nicaragua Informate — Cómo protegemos tu información.',
  alternates: { canonical: 'https://nicaraguainformate.com/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <LegalPageShell title="Política de Privacidad">
      <div style={{ background: 'rgba(96,165,250,0.08)', borderLeft: '4px solid #60a5fa', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 5 de mayo de 2026
      </div>

      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem' }}>
        En <strong>Nicaragua Informate</strong> valoramos y respetamos tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos tu información personal cuando visitas nuestro sitio web.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>1. Información que recopilamos</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Recopilamos información de dos maneras:</p>
      <h3 style={{ fontSize: '1rem', color: '#e2e8f0', marginTop: '1rem', marginBottom: '0.5rem' }}>Información anónima automática</h3>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#cbd5e1', fontSize: '0.92rem' }}>
        <li style={{ marginBottom: '0.4rem' }}>Dirección IP (anonimizada)</li>
        <li style={{ marginBottom: '0.4rem' }}>Tipo de dispositivo, sistema operativo y navegador</li>
        <li style={{ marginBottom: '0.4rem' }}>Páginas visitadas, tiempo de navegación y rutas de click</li>
        <li style={{ marginBottom: '0.4rem' }}>Ubicación aproximada (país/región)</li>
      </ul>
      <h3 style={{ fontSize: '1rem', color: '#e2e8f0', marginTop: '1rem', marginBottom: '0.5rem' }}>Información que proporcionas voluntariamente</h3>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#cbd5e1', fontSize: '0.92rem' }}>
        <li style={{ marginBottom: '0.4rem' }}>Correo electrónico (solo si te suscribes al boletín)</li>
        <li style={{ marginBottom: '0.4rem' }}>Nombre (opcional, en formulario de contacto)</li>
      </ul>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>2. Cookies y tecnologías de seguimiento</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Utilizamos cookies propias y de terceros para mejorar tu experiencia de navegación, analizar el tráfico del sitio y mostrar publicidad personalizada.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>3. Publicidad (Google AdSense)</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1rem', fontSize: '0.92rem' }}>
        Utilizamos Google AdSense para mostrar anuncios en nuestro sitio. Google, como proveedor externo, utiliza cookies para servir anuncios basados en visitas anteriores de los usuarios a nuestro sitio web o a otros sitios de Internet.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1rem', fontSize: '0.92rem' }}>
        Las cookies de publicidad de Google (incluidas las de DoubleClick) permiten a Google y a sus socios mostrar anuncios basados en las visitas realizadas por los usuarios a nuestro sitio y/u otros sitios en Internet.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Los usuarios pueden optar por la personalización de anuncios visitando{' '}
        <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>Configuración de anuncios de Google</a>.{' '}
        Alternativamente, pueden optar por no participar en la personalización de anuncios de terceros visitando{' '}
        <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>www.aboutads.info</a>.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>4. Uso de la información</h2>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#cbd5e1', fontSize: '0.92rem' }}>
        <li style={{ marginBottom: '0.4rem' }}>Proporcionar y mantener nuestros servicios de noticias</li>
        <li style={{ marginBottom: '0.4rem' }}>Analizar el tráfico y mejorar la experiencia del usuario</li>
        <li style={{ marginBottom: '0.4rem' }}>Mostrar publicidad relevante a través de Google AdSense</li>
        <li style={{ marginBottom: '0.4rem' }}>Enviar boletines informativos (solo si te suscribes)</li>
      </ul>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>5. Transferencia internacional de datos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Algunos de nuestros proveedores de servicios (como Google) pueden procesar datos en servidores ubicados fuera de Nicaragua. Utilizamos únicamente proveedores que garantizan medidas de seguridad adecuadas.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>6. Retención de datos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Conservamos los datos personales únicamente durante el tiempo necesario para cumplir con los fines descritos en esta política. Los datos de navegación anonimizados pueden conservarse por períodos más largos con fines estadísticos.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>7. Tus derechos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Tienes derecho a acceder, corregir, limitar o eliminar tus datos personales. Para ejercer estos derechos, contáctanos a través de nuestro{' '}
        <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a>.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>8. Menores de edad</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Nuestro sitio no está dirigido a menores de 13 años. No recopilamos intencionalmente información personal de menores de edad.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>9. Cambios a esta política</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Podemos actualizar esta política periódicamente. Te notificaremos cualquier cambio material publicando la nueva versión en esta página con la fecha de actualización correspondiente.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>10. Contacto</h2>
      <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
        Si tienes preguntas sobre esta política, escríbenos a{' '}
        <a href="mailto:privacidad@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>privacidad@nicaraguainformate.com</a>{' '}
        o usa nuestro <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a>.
      </p>
    </LegalPageShell>
  );
}
