import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Política Editorial | Nicaragua Informate',
  description: 'Política editorial de Nicaragua Informate — nuestros principios, autonomía y compromiso con el periodismo verificado.',
  alternates: { canonical: 'https://nicaraguainformate.com/politica-editorial' },
};

export default function PoliticaEditorialPage() {
  return (
    <LegalPageShell title="Política Editorial">
      <div style={{ background: '#fefce8', borderLeft: '4px solid #fbbf24', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 20 de mayo de 2026
      </div>

      <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>
        Nicaragua Informate es un portal de noticias digital. Informamos con responsabilidad y claridad sobre lo que pasa en Nicaragua y el mundo.
      </p>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', marginBottom: '2rem' }}>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7 }}>
          <strong style={{ color: '#0f172a' }}>Importante:</strong> No tenemos relación con cuentas, perfiles o páginas de terceros con nombres similares. Verificá siempre nuestros canales oficiales.
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>1. Criterio editorial</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Elegimos qué noticias cubrir y cómo tratarlas según nuestro criterio periodístico. Buscamos informar sobre temas de interés para la comunidad nicaragüense.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        La publicidad no influye en nuestras decisiones informativas. Cuando hay contenido comercial, lo identificamos claramente como tal.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>2. Principios de cobertura</h2>
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#fff' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Principio</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Qué significa</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: '#ffffff' }}>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 700 }}>Verificación</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Contrastamos la información antes de publicar</td>
            </tr>
            <tr style={{ background: '#f8fafc' }}>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 700 }}>Responsabilidad</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Evitamos afirmaciones engañosas o sacadas de contexto</td>
            </tr>
            <tr style={{ background: '#ffffff' }}>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 700 }}>Transparencia</td>
              <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Distinguimos noticias, opinión, publicidad y contenido patrocinado</td>
            </tr>
            <tr style={{ background: '#f8fafc' }}>
              <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 700 }}>Interés público</td>
              <td style={{ padding: '12px 16px', color: '#64748b' }}>Priorizamos temas que impactan en la vida de la gente</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>3. Cómo verificamos</h2>
      <p style={{ color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Antes de publicar una noticia hacemos lo siguiente:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Buscamos al menos dos fuentes independientes</li>
        <li>Verificamos que las fuentes sean confiables</li>
        <li>Cruzamos datos con fuentes oficiales cuando es posible</li>
        <li>Evaluamos el contexto completo para no caer en desinformación</li>
        <li>Consultamos expertos cuando el tema lo requiere</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>4. Correcciones</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Cuando nos equivocamos, corregimos. Las correcciones importantes se indican claramente en la noticia con la fecha de modificación.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Si ves un error, reportalo por el <Link href="/contacto" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>formulario de contacto</Link> del sitio. Lo revisamos y corregimos en un plazo razonable.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>5. Fuentes y derechos de autor</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Usamos fuentes documentales, testimoniales e institucionales de forma responsable. Contrastamos antes de publicar y citamos las fuentes cuando corresponde.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Protegemos la identidad de fuentes confidenciales cuando su seguridad lo requiere.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        No usamos material con derechos de autor sin autorización o sin las excepciones legales permitidas (como el derecho de cita).
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>6. Publicidad y contenido comercial</h2>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        La publicidad (incluidos los anuncios de Google AdSense) no determina qué noticias cubrimos ni cómo las tratamos.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Los contenidos patrocinados o publirreportajes se identifican claramente para que no se confundan con noticias.
      </p>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Las opiniones en columnas o artículos de opinión son de sus autores y no necesariamente reflejan la posición del medio.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>7. Canales oficiales</h2>
      <p style={{ color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Estos son nuestros únicos canales oficiales:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.25rem', color: '#64748b', lineHeight: 1.8, fontSize: '0.92rem' }}>
        <li>Sitio web: <a href="https://nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>nicaraguainformate.com</a></li>
        <li>Facebook: <a href="https://facebook.com/NicaraguaInformate" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>facebook.com/NicaraguaInformate</a></li>
        <li>WhatsApp: Canal oficial (enlace en el sitio)</li>
        <li>Telegram: Canal oficial (enlace en el sitio)</li>
      </ul>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        No nos hacemos responsables de información publicada en cuentas no oficiales.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>8. Equipo editorial</h2>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <img src="/keyling-rivera.jpg" alt="Keyling Elieth Rivera Muñoz" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #dc2626' }} />
          <div>
            <p style={{ color: '#0f172a', margin: '0 0 0.25rem', fontWeight: 700, fontSize: '1.1rem' }}>Keyling Elieth Rivera Muñoz</p>
            <p style={{ color: '#dc2626', margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Directora Editorial</p>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem', lineHeight: 1.65 }}>
              Licenciada en Periodismo. Especializada en cobertura de sucesos, nacionales, deportes e internacionales. Se encarga de revisar y aprobar el contenido antes de publicación.
            </p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>9. Contacto editorial</h2>
      <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.75, fontSize: '0.92rem' }}>
        Para aclaraciones, consultas, correcciones o reportes sobre nuestro contenido, usá el <Link href="/contacto" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>formulario de contacto</Link> del sitio, o escribinos a <a href="mailto:redaccion@nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>redaccion@nicaraguainformate.com</a> y <a href="mailto:contacto@nicaraguainformate.com" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>contacto@nicaraguainformate.com</a>.
      </p>
    </LegalPageShell>
  );
}
