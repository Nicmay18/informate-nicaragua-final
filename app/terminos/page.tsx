import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Nicaragua Informate',
  description: 'Términos y condiciones de uso de Nicaragua Informate. Uso del sitio, propiedad intelectual, limitación de responsabilidad y leyes aplicables.',
  alternates: { canonical: 'https://nicaraguainformate.com/terminos' },
};

export default function TerminosPage() {
  return (
    <LegalPageShell title="Términos y Condiciones de Uso">
      <div style={{ background: 'rgba(196,30,58,0.08)', borderLeft: '4px solid #c41e3a', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 15 de mayo de 2026
      </div>

      <div style={{ background: 'rgba(196,30,58,0.08)', border: '1px solid rgba(196,30,58,0.25)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '2rem' }}>
        <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.92rem', lineHeight: 1.7 }}>
          Al acceder y utilizar Nicaragua Informate, aceptas cumplir con estos términos y condiciones de uso. Si no estás de acuerdo con estos términos, por favor no utilices nuestro sitio web.
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>1. Aceptación de los términos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        El uso del sitio web Nicaragua Informate (<a href="https://nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>nicaraguainformate.com</a>) implica la aceptación plena y sin reservas de estas condiciones de uso. Nos reservamos el derecho de modificar estos términos en cualquier momento sin previo aviso individual. El uso continuado del sitio después de cualquier modificación constituye aceptación de los términos actualizados. Te recomendamos revisar esta página periódicamente.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>2. Uso permitido del sitio</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nicaragua Informate te otorga una licencia limitada, no exclusiva, intransferible y revocable para acceder y utilizar nuestro sitio web con fines personales y no comerciales. Puedes usar Nicaragua Informate para:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Leer, compartir y comentar noticias y artículos publicados</li>
        <li style={{ marginBottom: '0.5rem' }}>Navegar por las distintas secciones y categorías del portal</li>
        <li style={{ marginBottom: '0.5rem' }}>Suscribirte a nuestro boletín informativo (previo consentimiento explícito)</li>
        <li style={{ marginBottom: '0.5rem' }}>Compartir contenido en redes sociales a través de los botones proporcionados</li>
        <li style={{ marginBottom: '0.5rem' }}>Contactarnos a través de los formularios oficiales del sitio</li>
      </ul>
      <p style={{ color: '#fca5a5', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Queda estrictamente prohibido:</p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Copiar, reproducir, distribuir, redistribuir o transmitir contenido sin autorización expresa por escrito</li>
        <li style={{ marginBottom: '0.5rem' }}>Usar el sitio para actividades ilegales, fraudulentas, difamatorias o que violen derechos de terceros</li>
        <li style={{ marginBottom: '0.5rem' }}>Intentar vulnerar la seguridad del sitio, acceder a áreas restringidas o interferir con su funcionamiento</li>
        <li style={{ marginBottom: '0.5rem' }}>Publicar o difundir contenido ofensivo, discriminatorio, violento, obsceno o que incite al odio</li>
        <li style={{ marginBottom: '0.5rem' }}>Extraer datos de forma automatizada (scraping, crawling, spidering) sin autorización previa y expresa</li>
        <li style={{ marginBottom: '0.5rem' }}>Utilizar robots, scripts, herramientas automatizadas o acceso masivo no autorizado al sitio</li>
        <li style={{ marginBottom: '0.5rem' }}>Suplantar la identidad de cualquier persona o entidad, o realizar declaraciones falsas sobre tu relación con Nicaragua Informate</li>
        <li style={{ marginBottom: '0.5rem' }}>Introducir virus, malware, troyanos, gusanos o cualquier código malicioso que pueda dañar el sitio</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>3. Propiedad intelectual</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Todo el contenido publicado en Nicaragua Informate —incluyendo pero no limitado a artículos, textos, imágenes, fotografías, videos, logotipos, diseño gráfico, código fuente, marcas comerciales y nombre del sitio— está protegido por derechos de autor, marcas registradas y otras leyes de propiedad intelectual aplicables en la República de Nicaragua y a nivel internacional, de conformidad con los tratados de la OMPI y el Convenio de Berna.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Se concede una licencia limitada, no exclusiva, intransferible y revocable para visualizar el contenido únicamente para uso personal y no comercial. Cualquier uso no autorizado del contenido, incluyendo pero no limitado a reproducción, modificación, distribución, exhibición pública, transmisión o creación de obras derivadas, está estrictamente prohibido y puede constituir una infracción de las leyes de derechos de autor, marcas registradas y otras leyes aplicables.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nicaragua Informate, su logotipo, nombre comercial y todo el contenido original son propiedad exclusiva de Nicaragua Informate o de sus licenciantes. Todos los derechos están reservados. Para solicitar permiso de uso de contenido, contáctanos a través de nuestro <Link href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</Link> o escribe a <a href="mailto:legal@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>legal@nicaraguainformate.com</a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>4. Política de contenido</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nicaragua Informate se compromete a mantener estándares de calidad, veracidad y respeto en todo el contenido publicado. Nuestra política de contenido se rige por los siguientes principios:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Veracidad:</strong> Priorizamos información contrastada y contextualizada antes de publicar cada pieza periodística.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Correcciones:</strong> Cuando se detecta un error, se corrige de forma transparente y visible para el lector.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Independencia editorial:</strong> El contenido informativo es independiente de anunciantes, patrocinadores y grupos de interés.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Respeto y dignidad:</strong> No publicamos contenido que atente contra la dignidad humana, promueva la violencia o incite al odio.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#fff' }}>Derecho de réplica:</strong> Las personas mencionadas en nuestras noticias tienen derecho a solicitar espacio para aclaraciones o réplicas.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>5. Enlaces a terceros</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nuestro sitio puede contener enlaces a sitios web de terceros, incluyendo redes sociales, fuentes informativas y anunciantes. Estos enlaces se proporcionan únicamente para tu conveniencia informativa y no implican nuestro respaldo, afiliación o aprobación del contenido, productos, servicios o políticas de dichos sitios. Nicaragua Informate no revisa, controla ni es responsable por el contenido, exactitud, opiniones, productos, servicios o políticas de privacidad de sitios de terceros.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Tu interacción con estos sitios externos se rige íntegramente por sus propios términos y condiciones, políticas de privacidad y prácticas comerciales. Te recomendamos revisar dichos documentos antes de proporcionar cualquier información personal en sitios de terceros.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>6. Limitación de responsabilidad</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nicaragua Informate no se hace responsable, en la medida permitida por la ley aplicable, de daños directos, indirectos, incidentales, especiales, consecuenciales o punitivos derivados del acceso, uso o imposibilidad de uso del sitio. Esto incluye, pero no se limita a, pérdida de datos, pérdida de beneficios, interrupción del negocio, daños a la reputación u otros daños, incluso si se nos ha advertido de la posibilidad de dichos daños.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        La información publicada en Nicaragua Informate se ofrece exclusivamente con fines informativos y educativos, y no constituye asesoramiento profesional de ninguna clase (legal, médico, financiero, fiscal o de otro tipo). No garantizamos la exactitud, integridad, actualidad o idoneidad de la información para fines particulares. Cualquier acción o decisión basada en la información presentada en este sitio es bajo tu propio riesgo y responsabilidad.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>7. Indemnización</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Al utilizar nuestro sitio, te comprometes a indemnizar y mantener indemne a Nicaragua Informate, sus directores, empleados, colaboradores, afiliados, agentes, licenciantes y terceros proveedores de servicios, de cualquier reclamo, demanda, responsabilidad, costo, gasto (incluyendo honorarios razonables de abogados) o pérdida derivada del incumplimiento de estos términos, del uso indebido del sitio, de la violación de derechos de terceros o de cualquier actividad relacionada con tu cuenta o dispositivo.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>8. Ley aplicable y jurisdicción</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Estos términos y condiciones se rigen e interpretan de conformidad con las leyes de la República de Nicaragua, sin dar efecto a sus principios de conflictos de leyes. Cualquier disputa, controversia o reclamación derivada de estos términos, del uso del sitio o de la interpretación de los mismos será sometida a la jurisdicción exclusiva de los tribunales competentes de la ciudad de Managua, República de Nicaragua.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Si eres consumidor residente en la Unión Europea, puedes tener derechos adicionales de conformidad con el Derecho de la Unión Europea, incluyendo el derecho a presentar reclamaciones ante las autoridades de protección del consumidor de tu país de residencia.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>9. Rescisión</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nicaragua Informate se reserva el derecho de suspender o terminar tu acceso al sitio, en cualquier momento y sin previo aviso, si determinamos que has violado estos términos y condiciones o que tu conducta representa un riesgo para la seguridad, integridad o reputación del sitio o de terceros. La rescisión no afectará los derechos y obligaciones acumulados antes de la fecha de terminación.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>10. Severabilidad e integridad del acuerdo</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Si alguna disposición de estos términos es considerada inválida, ilegal o inaplicable por cualquier tribunal o autoridad competente, dicha disposición será modificada o eliminada en la medida mínima necesaria, y las demás disposiciones continuarán en pleno vigor y efecto. La disposición inválida será reemplazada por una disposición válida que refleje, en la medida de lo posible, la intención original de las partes.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Estos términos constituyen el acuerdo completo entre tú y Nicaragua Informate respecto al uso del sitio web, y reemplazan cualquier acuerdo, comunicación o propuesta previa, ya sea oral o escrita, entre tú y nosotros.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>11. Modificaciones a los términos</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nos reservamos el derecho de modificar, suspender o discontinuar estos términos en cualquier momento y por cualquier motivo, incluyendo cambios legislativos, regulatorios, comerciales o técnicos. Los cambios entrarán en vigor inmediatamente después de su publicación en esta página. Es tu responsabilidad revisar estos términos periódicamente para estar al tanto de las modificaciones. El uso continuado del sitio después de la publicación de cambios constituirá tu aceptación de dichos cambios.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>12. Contacto</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Si tienes preguntas, comentarios o inquietudes sobre estos términos y condiciones, escríbenos a{' '}
        <a href="mailto:legal@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>legal@nicaraguainformate.com</a>{' '}
        o usa nuestro <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a>.{' '}
        Responderemos a tu solicitud en un plazo razonable, de conformidad con la legislación aplicable.
      </p>
    </LegalPageShell>
  );
}
