import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';
import { CircleCheck, Scale, Eye, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política Editorial',
  description: 'Política editorial de Nicaragua Informate — Nuestros principios, autonomía y compromiso con el periodismo verificado.',
  alternates: { canonical: 'https://nicaraguainformate.com/politica-editorial' },
};

const PRINCIPIOS = [
  { icon: <CircleCheck size={16} color="#8c1d18" />, title: 'Verificación', desc: 'Priorizamos información contrastada y contextualizada antes de publicar cada pieza periodística.' },
  { icon: <Scale size={16} color="#8c1d18" />, title: 'Responsabilidad', desc: 'Evitamos afirmaciones engañosas, manipuladas o descontextualizadas que puedan generar confusión.' },
  { icon: <Eye size={16} color="#8c1d18" />, title: 'Transparencia', desc: 'Distinguimos con claridad noticias, opinión, contenido patrocinado y publicidad comercial.' },
  { icon: <Users size={16} color="#8c1d18" />, title: 'Interés público', desc: 'Damos prioridad a temas que impactan a la ciudadanía y la vida pública de Nicaragua.' },
];

export default function PoliticaEditorialPage() {
  return (
    <LegalPageShell title="Política Editorial">
      <div style={{ background: 'rgba(140,29,24,0.08)', borderLeft: '4px solid #8c1d18', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 5 de mayo de 2026
      </div>

      <p style={{ fontSize: '1.05rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.75 }}>
        Nicaragua Informate es un portal de noticias digital independiente. Nuestra línea editorial está orientada a informar con responsabilidad, claridad y criterio periodístico propio sobre los acontecimientos más relevantes en Nicaragua y el mundo. Esta política describe nuestros principios, procesos y compromisos.
      </p>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #8c1d18', padding: '1rem 1.25rem', margin: '0 0 1.5rem', color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
        <strong style={{ color: '#fff' }}>Importante:</strong> Nicaragua Informate no guarda relación con cuentas, perfiles o páginas de terceros con nombres similares. Verifica siempre nuestros canales oficiales listados en la sección de contacto.
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>1. Autonomía editorial</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nicaragua Informate desarrolla su cobertura con criterio periodístico propio. Nuestras decisiones editoriales no están sujetas a intereses políticos, comerciales ni de ningún grupo externo. Mantenemos independencia absoluta en la selección, tratamiento y publicación de noticias.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        No aceptamos presiones externas que comprometan nuestra línea editorial. La publicidad y el contenido patrocinado no influyen en nuestras decisiones informativas, y cuando existe contenido comercial, se identifica claramente como tal.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>2. Principios de cobertura</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.75rem', margin: '1.25rem 0 1.5rem' }}>
        {PRINCIPIOS.map((p) => (
          <div key={p.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: '#fff', fontWeight: 600 }}>
              <span style={{ marginRight: 8 }}>{p.icon}</span>{p.title}
            </h3>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem', lineHeight: 1.55 }}>{p.desc}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>3. Proceso de verificación</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Antes de publicar cualquier noticia, seguimos un proceso riguroso de verificación:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Contrastamos la información con al menos dos fuentes independientes cuando es posible</li>
        <li style={{ marginBottom: '0.5rem' }}>Verificamos la credibilidad y trayectoria de las fuentes</li>
        <li style={{ marginBottom: '0.5rem' }}>Cruzamos datos con fuentes oficiales cuando corresponde</li>
        <li style={{ marginBottom: '0.5rem' }}>Evaluamos el contexto para evitar desinformación o manipulación</li>
        <li style={{ marginBottom: '0.5rem' }}>Consultamos a expertos cuando el tema requiere conocimiento especializado</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>4. Correcciones y actualizaciones</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Cuando se detecte un error relevante, Nicaragua Informate procederá a corregir, ampliar o actualizar la pieza correspondiente de manera transparente. Las correcciones significativas se indicarán claramente en el contenido con la fecha de modificación.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Los usuarios pueden reportar errores o solicitar correcciones a través de nuestro <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a>. Evaluaremos cada reporte en un plazo razonable.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>5. Fuentes e integridad de la información</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Valoramos el uso responsable de fuentes documentales, testimoniales e institucionales. Procuramos contrastar la información antes de su publicación y citamos las fuentes cuando corresponde, protegiendo la identidad de fuentes confidenciales cuando sea necesario para su seguridad.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        No utilizamos material protegido por derechos de autor sin la autorización correspondiente o sin aplicar las excepciones legales aplicables (como el derecho de cita).
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>6. Separación entre contenido editorial y comercial</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        La publicidad comercial (incluidos los anuncios de Google AdSense) no determina la línea informativa del medio. Los contenidos patrocinados, publirreportajes o publicidad nativa se identifican claramente como tales para no confundir al lector.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Las opiniones expresadas en artículos de opinión, columnas o editoriales son responsabilidad exclusiva de sus autores y no necesariamente reflejan la posición editorial del medio.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>7. Identidad y canales oficiales</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Nicaragua Informate utiliza su propia marca, estilo editorial y canales oficiales. No mantenemos relación de afiliación con cuentas, perfiles o páginas de terceros con nombres similares.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        <strong style={{ color: '#fff' }}>Nuestros canales oficiales:</strong>
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Sitio web: <a href="https://nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>https://nicaraguainformate.com</a></li>
        <li style={{ marginBottom: '0.5rem' }}>Facebook: <a href="https://facebook.com/profile.php?id=61578261125687" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>facebook.com/NicaraguaInformate</a></li>
        <li style={{ marginBottom: '0.5rem' }}>WhatsApp: <a href="https://whatsapp.com/channel/0029VbBxKdvDTkKB9SpIwS17" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>Canal oficial</a></li>
        <li style={{ marginBottom: '0.5rem' }}>Telegram: <a href="https://t.me/+fHHjncJqMQM3NjZh" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>Canal oficial</a></li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>8. Director Editorial</h2>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 28, flexShrink: 0 }}>
            KR
          </div>
          <div>
            <p style={{ color: '#fff', margin: '0 0 0.5rem', fontWeight: 700, fontSize: '1.1rem' }}>Keyling Rivera</p>
            <p style={{ color: '#8c1d18', margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Periodista</p>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
              Periodista y fundadora de Nicaragua Informate. Con más de 5 años de experiencia en comunicación digital y cobertura de noticias nacionales. Comprometida con el periodismo ético, la verificación de fuentes y la información precisa para la ciudadanía nicaragüense.
            </p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>9. Contacto editorial</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Para aclaraciones, consultas, correcciones o reportes sobre nuestro contenido, utiliza nuestro{' '}
        <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a>{' '}
        seleccionando el asunto correspondiente. También puedes escribir directamente a{' '}
        <a href="mailto:redaccion@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>redaccion@nicaraguainformate.com</a>.
      </p>
      <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Para asuntos legales y derechos de autor, escribe a{' '}
        <a href="mailto:legal@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>legal@nicaraguainformate.com</a>.
      </p>
    </LegalPageShell>
  );
}
