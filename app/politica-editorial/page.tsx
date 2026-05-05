import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Política Editorial | Nicaragua Informate',
  description: 'Política editorial de Nicaragua Informate, portal de noticias digital.',
  alternates: { canonical: 'https://nicaraguainformate.com/politica-editorial' },
};

const PRINCIPIOS = [
  { icon: 'fa-check-circle', title: 'Verificación', desc: 'Priorizamos información contrastada y contextualizada antes de publicar cada pieza periodística.' },
  { icon: 'fa-scale-balanced', title: 'Responsabilidad', desc: 'Evitamos afirmaciones engañosas, manipuladas o descontextualizadas que puedan generar confusión.' },
  { icon: 'fa-eye', title: 'Transparencia', desc: 'Distinguimos con claridad noticias, opinión, contenido patrocinado y publicidad comercial.' },
  { icon: 'fa-users', title: 'Interés público', desc: 'Damos prioridad a temas que impactan a la ciudadanía y la vida pública de Nicaragua.' },
];

export default function PoliticaEditorialPage() {
  return (
    <LegalPageShell title="Política Editorial">
      <div style={{ background: 'rgba(140,29,24,0.08)', borderLeft: '4px solid #8c1d18', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 5 de mayo de 2026
      </div>

      <p style={{ fontSize: '1.05rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.75 }}>
        Nicaragua Informate es un portal de noticias digital independiente. Nuestra línea editorial está orientada a informar con responsabilidad, claridad y criterio periodístico propio sobre los acontecimientos más relevantes en Nicaragua y el mundo.
      </p>

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #8c1d18', padding: '1rem 1.25rem', margin: '0 0 1.5rem', color: '#94a3b8', fontSize: '0.88rem' }}>
        Nicaragua Informate no guarda relación con cuentas, perfiles o páginas de terceros con nombres similares. Verifica siempre nuestros canales oficiales.
      </div>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>1. Autonomía editorial</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Nicaragua Informate desarrolla su cobertura con criterio periodístico propio. Nuestras decisiones editoriales no están sujetas a intereses políticos, comerciales ni de ningún grupo externo. Mantenemos independencia absoluta en la selección, tratamiento y publicación de noticias.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>2. Principios de cobertura</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.75rem', margin: '1.25rem 0 1.5rem' }}>
        {PRINCIPIOS.map((p) => (
          <div key={p.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: '#fff' }}>
              <i className={`fas ${p.icon}`} style={{ color: '#8c1d18', marginRight: 8 }} />{p.title}
            </h3>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem', lineHeight: 1.55 }}>{p.desc}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>3. Correcciones y actualizaciones</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Cuando se detecte un error relevante, Nicaragua Informate podrá corregir, ampliar o actualizar la pieza correspondiente, indicando claramente la fecha de modificación cuando sea pertinente.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>4. Fuentes e integridad de la información</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Valoramos el uso responsable de fuentes documentales, testimoniales e institucionales. Procuramos contrastar la información antes de su publicación y citamos las fuentes cuando corresponde.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>5. Separación entre contenido editorial y comercial</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        La publicidad comercial (incluidos los anuncios de Google AdSense) no determina la línea informativa del medio. Los contenidos patrocinados o publicitarios se identifican claramente como tales.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>6. Identidad y no afiliación</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem' }}>
        Nicaragua Informate utiliza su propia marca, estilo editorial y canales oficiales. No mantenemos relación de afiliación con cuentas, perfiles o páginas de terceros con nombres similares.
      </p>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>7. Director Editorial</h2>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.25rem' }}>
        <p style={{ color: '#fff', margin: '0 0 0.5rem', fontWeight: 700 }}>Keyling Rivera</p>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>
          Periodista y fundadora de Nicaragua Informate. Con más de 5 años de experiencia en comunicación digital y cobertura de noticias nacionales. Comprometida con el periodismo ético y la información verificada para la ciudadanía nicaragüense.
        </p>
      </div>

      <h2 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.6rem' }}>8. Contacto editorial</h2>
      <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
        Para aclaraciones, consultas o reportes sobre nuestro contenido, utiliza nuestro{' '}
        <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a>{' '}
        o escribe a <a href="mailto:redaccion@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>redaccion@nicaraguainformate.com</a>.
      </p>
    </LegalPageShell>
  );
}
