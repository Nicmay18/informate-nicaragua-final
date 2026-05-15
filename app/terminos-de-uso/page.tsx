import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Términos de Uso',
  description: 'Términos y condiciones de uso de Nicaragua Informate.',
  alternates: { canonical: 'https://nicaraguainformate.com/terminos-de-uso' },
};

export default function TerminosDeUsoPage() {
  return (
    <LegalPageShell title="Términos de Uso">
      <div style={{ background: 'rgba(196,30,58,0.08)', borderLeft: '4px solid #c41e3a', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 14 de mayo de 2026
      </div>

      <div style={{ background: 'rgba(196,30,58,0.08)', border: '1px solid rgba(196,30,58,0.25)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '2rem' }}>
        <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.92rem', lineHeight: 1.7 }}>
          Al acceder y utilizar Nicaragua Informate, aceptas cumplir con estos términos y condiciones de uso. Si no estás de acuerdo con estos términos, por favor no utilices nuestro sitio web.
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>1. Aceptación de los términos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        El uso del sitio web Nicaragua Informate implica la aceptación plena y sin reservas de estas condiciones de uso. Nos reservamos el derecho de modificar estos términos en cualquier momento sin previo aviso. El uso continuado del sitio después de cualquier modificación constituye aceptación de los términos actualizados.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>2. Uso permitido del sitio</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: '0.92rem', lineHeight: 1.7 }}>Puedes usar Nicaragua Informate para:</p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Leer, compartir y comentar noticias y artículos</li>
        <li style={{ marginBottom: '0.5rem' }}>Navegar por las distintas secciones del portal</li>
        <li style={{ marginBottom: '0.5rem' }}>Suscribirte a nuestro boletín informativo</li>
        <li style={{ marginBottom: '0.5rem' }}>Compartir contenido en redes sociales con los botones proporcionados</li>
      </ul>
      <p style={{ color: '#fca5a5', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Queda estrictamente prohibido:</p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Copiar, reproducir, distribuir o redistribuir contenido sin autorización expresa por escrito</li>
        <li style={{ marginBottom: '0.5rem' }}>Usar el sitio para actividades ilegales, fraudulentas o difamatorias</li>
        <li style={{ marginBottom: '0.5rem' }}>Intentar vulnerar la seguridad del sitio o acceder a áreas restringidas</li>
        <li style={{ marginBottom: '0.5rem' }}>Publicar contenido ofensivo, discriminatorio, violento o que incite al odio</li>
        <li style={{ marginBottom: '0.5rem' }}>Extraer datos de forma automatizada (scraping, crawling) sin autorización</li>
        <li style={{ marginBottom: '0.5rem' }}>Utilizar robots o scripts para acceder al sitio de manera abusiva</li>
        <li style={{ marginBottom: '0.5rem' }}>Interferir con el funcionamiento normal del sitio o sus servidores</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>3. Licencia de uso del contenido</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Todo el contenido publicado en Nicaragua Informate (artículos, imágenes, logotipos, diseño, código fuente) está protegido por derechos de autor y otras leyes de propiedad intelectual aplicables en Nicaragua e internacionalmente. Se concede una licencia limitada, no exclusiva e intransferible para visualizar el contenido únicamente para uso personal y no comercial.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Cualquier uso no autorizado del contenido, incluyendo pero no limitado a reproducción, modificación, distribución, exhibición pública o creación de obras derivadas, está estrictamente prohibido y puede violar leyes de derechos de autor, marcas registradas y otras leyes aplicables.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>4. Enlaces a terceros</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nuestro sitio puede contener enlaces a sitios web de terceros. Estos enlaces se proporcionan únicamente para tu conveniencia y no implican nuestro respaldo o afiliación con dichos sitios. Nicaragua Informate no revisa ni controla el contenido, políticas de privacidad ni prácticas de los sitios externos.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        No nos hacemos responsables por el contenido, exactitud, opiniones, productos, servicios o políticas de privacidad de sitios de terceros. Tu interacción con estos sitios se rige por sus propios términos y condiciones.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>5. Propiedad intelectual</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nicaragua Informate, su logotipo, nombre comercial y todo el contenido original son propiedad exclusiva de Nicaragua Informate o de sus licenciantes. Todos los derechos están reservados. No está permitida la reproducción total o parcial sin autorización previa y expresa por escrito.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Para solicitar permiso de uso de contenido, contáctanos a través de nuestro <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>6. Limitación de responsabilidad</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nicaragua Informate no se hace responsable de daños directos, indirectos, incidentales, especiales o consecuenciales derivados del uso o la imposibilidad de uso del sitio. Esto incluye, pero no se limita a, pérdida de datos, pérdida de beneficios, interrupción del negocio u otros daños.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        La información publicada se ofrece con fines informativos y no constituye asesoramiento profesional de ninguna clase (legal, médico, financiero o de otro tipo). No garantizamos la exactitud, integridad o actualidad de la información. Cualquier acción basada en la información presentada es bajo tu propio riesgo.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>7. Indemnización</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        El usuario se compromete a indemnizar y mantener indemne a Nicaragua Informate, sus directores, empleados, afiliados, agentes y terceros de cualquier reclamo, demanda, responsabilidad, costo, gasto (incluyendo honorarios de abogados) o pérdida derivada del incumplimiento de estos términos, uso del sitio o violación de derechos de terceros.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>8. Ley aplicable y jurisdicción</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Estos términos se rigen e interpretan de conformidad con las leyes de la República de Nicaragua. Cualquier disputa, controversia o reclamación derivada de estos términos o del uso del sitio será sometida a la jurisdicción exclusiva de los tribunales competentes de la ciudad de Managua, Nicaragua.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>9. Severabilidad</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Si alguna disposición de estos términos es considerada inválida, ilegal o inaplicable por cualquier tribunal o autoridad competente, las demás disposiciones continuarán en pleno vigor y efecto. La disposición inválida será reemplazada por una disposición válida que refleje, en la medida de lo posible, la intención original.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>10. Modificaciones a los términos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nos reservamos el derecho de modificar estos términos en cualquier momento y por cualquier motivo. Los cambios entrarán en vigor inmediatamente después de su publicación en esta página. Es tu responsabilidad revisar estos términos periódicamente para estar al tanto de las modificaciones.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>11. Contacto</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Si tienes preguntas sobre estos términos, escríbenos a{' '}
        <a href="mailto:legal@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>legal@nicaraguainformate.com</a>{' '}
        o usa nuestro <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a>.
      </p>
    </LegalPageShell>
  );
}
