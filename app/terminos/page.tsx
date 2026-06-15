import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Nicaragua Informate',
  description: 'Términos y condiciones de uso de Nicaragua Informate.',
  alternates: { canonical: 'https://nicaraguainformate.com/terminos' },
};

export default function TerminosPage() {
  return (
    <LegalPageShell title="Términos y Condiciones de Uso">
      <div style={{ background: '#fefce8', borderLeft: '4px solid #fbbf24', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 15 de junio de 2026
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', marginBottom: '2rem' }}>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7 }}>
          Al usar Nicaragua Informate, aceptás estas reglas. Si no estás de acuerdo, no uses el sitio.
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>1. Aceptación</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Entrar a <a href="https://nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>nicaraguainformate.com</a> significa que aceptás estos términos. Podemos cambiarlos cuando sea necesario. Si seguís usando el sitio después de un cambio, significa que aceptás la versión nueva.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>2. Qué podés hacer</h2>
      <p style={{ color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.75, fontWeight: 600, fontSize: '0.92rem' }}>
        Te damos permiso para:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Leer y compartir noticias</li>
        <li>Navegar por las secciones del sitio</li>
        <li>Suscribirte al boletín (si querés)</li>
        <li>Compartir contenido en redes sociales</li>
        <li>Contactarnos por el formulario oficial</li>
      </ul>
      <p style={{ color: '#0f172a', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.92rem' }}>
        Qué NO podés hacer:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Copiar o redistribuir nuestro contenido sin permiso</li>
        <li>Usar el sitio para actividades ilegales o fraudulentas</li>
        <li>Intentar hackear el sitio o acceder a áreas restringidas</li>
        <li>Extraer datos automáticamente (scraping) sin autorización</li>
        <li>Usar programas o scripts para acceder masivamente al sitio</li>
        <li>Hacerte pasar por otra persona o entidad</li>
        <li>Introducir virus o código malicioso</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>3. Propiedad intelectual</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Todo el contenido de Nicaragua Informate —textos, imágenes, videos, logos, diseño— es nuestro o de quienes nos autorizaron a usarlo. Está protegido por derechos de autor.
      </p>
      <p style={{ color: '#64748b', marginBottom: '0.5rem', lineHeight: 1.75, fontWeight: 600, fontSize: '0.92rem' }}>
        Podés:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Leer y compartir los enlaces en redes sociales</li>
      </ul>
      <p style={{ color: '#64748b', marginBottom: '0.5rem', lineHeight: 1.75, fontWeight: 600, fontSize: '0.92rem' }}>
        No podés:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Copiar, modificar, distribuir o crear obras derivadas sin permiso escrito</li>
        <li>Usar nuestro nombre o logo sin autorización</li>
      </ul>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Si querés usar algo de nuestro contenido, escribinos por el <Link href="/contacto" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>formulario de contacto</Link>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>4. Contenido del sitio</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Nos esforzamos por publicar información verificada y de calidad. Pero:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>La información es solo para fines informativos, no es asesoramiento profesional (legal, médico, financiero, etc.)</li>
        <li>No garantizamos que todo esté 100% actualizado o completo</li>
        <li>Las decisiones que tomes basadas en lo que leás acá son tu responsabilidad</li>
      </ul>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        <strong>Correcciones:</strong> Si encontrás un error, avisanos y lo corregimos.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>5. Enlaces a otros sitios</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        A veces linkeamos a páginas de terceros (redes sociales, fuentes, anunciantes). Eso no significa que los respaldemos. No somos responsables de lo que hagan esos sitios ni de sus políticas de privacidad.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>6. Responsabilidad</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Nicaragua Informate no se hace responsable de daños directos o indirectos que puedan derivarse del uso del sitio. Esto incluye pérdida de datos, interrupciones, virus o cualquier otro problema técnico. Usás el sitio bajo tu propio riesgo.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>7. Indemnización</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Si alguien nos reclama por algo que hiciste vos (violación de estos términos, uso indebido del sitio, etc.), te comprometés a cubrirnos de ese reclamo, incluyendo gastos legales razonables.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>8. Ley aplicable</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Estos términos se rigen por las leyes de la República de Nicaragua. Cualquier disputa se resolverá en los tribunales competentes de Managua, Nicaragua.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>9. Cierre de acceso</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Podemos suspender o bloquear tu acceso al sitio si:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Violás estos términos</li>
        <li>Tu conducta representa un riesgo para el sitio o para terceros</li>
        <li>Es necesario por cuestiones legales o de seguridad</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>10. Si alguna parte no aplica</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Si alguna cláusula de estos términos es inválida, el resto sigue vigente. Reemplazaremos la parte inválida por otra que sea lo más parecida posible a lo que queríamos decir.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>11. Cambios a estos términos</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Podemos modificar estos términos cuando sea necesario. Los cambios entran en vigor al publicarse acá. Es tu responsabilidad revisarlos de vez en cuando.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>12. Contacto</h2>
      <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Si tenés preguntas sobre estos términos, escribinos a través del <Link href="/contacto" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>formulario de contacto</Link> disponible en nuestro sitio, o al correo <a href="mailto:legal@nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>legal@nicaraguainformate.com</a>.
      </p>
    </LegalPageShell>
  );
}
