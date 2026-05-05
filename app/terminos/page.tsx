import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Términos de Uso | Nicaragua Informate',
  description: 'Términos y condiciones de uso de Nicaragua Informate.',
  alternates: { canonical: 'https://nicaraguainformate.com/terminos' },
};

export default function TerminosPage() {
  return (
    <LegalPageShell title="Términos de Uso">
      <div style={{ background: 'rgba(196,30,58,0.08)', border: '1px solid rgba(196,30,58,0.25)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '2rem' }}>
        <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.9rem' }}>
          Al acceder y utilizar Nicaragua Informate, aceptas cumplir con estos términos y condiciones de uso. Si no estás de acuerdo, te pedimos que no utilices nuestro sitio.
        </p>
      </div>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>1. Aceptación de los términos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        El uso del sitio web Nicaragua Informate implica la aceptación plena y sin reservas de estas condiciones de uso. Nos reservamos el derecho de modificar estos términos en cualquier momento.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>2. Uso permitido del sitio</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: '0.92rem' }}>Puedes usar Nicaragua Informate para:</p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#cbd5e1', fontSize: '0.92rem' }}>
        <li style={{ marginBottom: '0.4rem' }}>Leer, compartir y comentar noticias y artículos</li>
        <li style={{ marginBottom: '0.4rem' }}>Navegar por las distintas secciones del portal</li>
        <li style={{ marginBottom: '0.4rem' }}>Suscribirte a nuestro boletín informativo</li>
      </ul>
      <p style={{ color: '#94a3b8', marginBottom: '0.75rem', fontSize: '0.85rem' }}><strong>Queda estrictamente prohibido:</strong></p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#cbd5e1', fontSize: '0.92rem' }}>
        <li style={{ marginBottom: '0.4rem' }}>Copiar, reproducir, distribuir o redistribuir contenido sin autorización expresa</li>
        <li style={{ marginBottom: '0.4rem' }}>Usar el sitio para actividades ilegales, fraudulentas o difamatorias</li>
        <li style={{ marginBottom: '0.4rem' }}>Intentar vulnerar la seguridad del sitio o acceder a áreas restringidas</li>
        <li style={{ marginBottom: '0.4rem' }}>Publicar contenido ofensivo, discriminatorio o que incite al odio</li>
        <li style={{ marginBottom: '0.4rem' }}>Extraer datos de forma automatizada (scraping) sin autorización</li>
      </ul>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>3. Licencia de uso del contenido</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Todo el contenido publicado en Nicaragua Informate (artículos, imágenes, logotipos, diseño) está protegido por derechos de autor y otras leyes de propiedad intelectual. Se concede una licencia limitada, no exclusiva e intransferible para visualizar el contenido únicamente para uso personal y no comercial.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>4. Enlaces a terceros</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Nuestro sitio puede contener enlaces a sitios web de terceros. Nicaragua Informate no se hace responsable del contenido, políticas de privacidad ni prácticas de dichos sitios externos.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>5. Propiedad intelectual</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Todo el contenido está protegido por derechos de autor. No está permitida la reproducción total o parcial sin autorización previa y expresa por escrito de Nicaragua Informate.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>6. Limitación de responsabilidad</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Nicaragua Informate no se hace responsable de daños directos, indirectos, incidentales o consecuenciales derivados del uso o la imposibilidad de uso del sitio. La información publicada se ofrece con fines informativos y no constituye asesoramiento profesional.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>7. Indemnización</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        El usuario se compromete a indemnizar y mantener indemne a Nicaragua Informate frente a cualquier reclamo, demanda o responsabilidad derivada del incumplimiento de estos términos.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>8. Ley aplicable y jurisdicción</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Estos términos se rigen por las leyes de la República de Nicaragua. Cualquier disputa será sometida a los tribunales competentes de la ciudad de Managua, Nicaragua.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>9. Severabilidad</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Si alguna disposición de estos términos es considerada inválida o inaplicable, las demás disposiciones continuarán en pleno vigor y efecto.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>10. Modificaciones a los términos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en esta página.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>11. Contacto</h2>
      <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
        Si tienes preguntas sobre estos términos, escríbenos a{' '}
        <a href="mailto:legal@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>legal@nicaraguainformate.com</a>{' '}
        o usa nuestro <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a>.
      </p>
    </LegalPageShell>
  );
}
