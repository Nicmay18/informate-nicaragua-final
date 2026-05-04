import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política Editorial | Nicaragua Informate',
  description: 'Política editorial de Nicaragua Informate, portal de noticias digital.',
  alternates: { canonical: 'https://nicaraguainformate.com/politica-editorial' },
};

const PRINCIPIOS = [
  { icon: 'fa-check-circle', title: 'Verificación', desc: 'Priorizamos información contrastada y contextualizada antes de publicar.' },
  { icon: 'fa-scale-balanced', title: 'Responsabilidad', desc: 'Evitamos afirmaciones engañosas, manipuladas o descontextualizadas.' },
  { icon: 'fa-eye', title: 'Transparencia', desc: 'Distinguimos con claridad noticias, opinión, contenido patrocinado y publicidad.' },
  { icon: 'fa-users', title: 'Interés público', desc: 'Damos prioridad a temas que impactan a la ciudadanía y la vida pública.' },
];

export default function PoliticaEditorialPage() {
  return (
    <div style={{ fontFamily: "'Source Sans 3', system-ui, sans-serif", background: '#f7f4ee', color: '#18181b', lineHeight: 1.7 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,253,249,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #ddd6ce' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '1rem 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          <Link href="/" style={{ color: '#8c1d18', textDecoration: 'none', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Nicaragua Informate
            <small style={{ display: 'block', fontFamily: "'Source Sans 3', system-ui, sans-serif", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.16em', color: '#756d66', marginTop: 2 }}>Portal de noticias digital</small>
          </Link>
          <nav><ul style={{ display: 'flex', gap: '1.25rem', listStyle: 'none', margin: 0, padding: 0 }}>
            <li><Link href="/" style={{ color: '#5b5b5f', textDecoration: 'none', fontWeight: 600 }}>Inicio</Link></li>
            <li><Link href="/nosotros" style={{ color: '#5b5b5f', textDecoration: 'none', fontWeight: 600 }}>Quiénes somos</Link></li>
            <li><Link href="/terminos" style={{ color: '#5b5b5f', textDecoration: 'none', fontWeight: 600 }}>Términos</Link></li>
          </ul></nav>
        </div>
      </header>
      <main style={{ padding: '3rem 0 4rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '2.5rem', color: '#8c1d18', textDecoration: 'none', fontWeight: 700 }}>← Volver al inicio</Link>
          <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #ddd6ce' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8c1d18', marginBottom: 14 }}>Política Editorial</div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(2.2rem,5vw,3.5rem)', lineHeight: 1.05, marginBottom: '1rem', letterSpacing: '-0.04em' }}>Compromiso editorial de Nicaragua Informate</h1>
            <p style={{ fontSize: '1.1rem', color: '#5b5b5f', maxWidth: 720 }}>Nicaragua Informate es un portal de noticias digital. Nuestra línea editorial está orientada a informar con responsabilidad, claridad y criterio periodístico propio.</p>
          </div>
          <div style={{ background: '#f1ece4', border: '1px solid #ddd6ce', borderLeft: '4px solid #8c1d18', padding: '1rem 1.25rem', margin: '0 0 2rem', color: '#5b5b5f' }}>
            Nicaragua Informate no guarda relación con cuentas, perfiles o páginas de terceros con nombres similares.
          </div>
          <article style={{ background: '#fffdf9', border: '1px solid #ddd6ce', borderRadius: 16, padding: '2.25rem', boxShadow: '0 8px 24px rgba(24,24,27,0.08)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', margin: '2rem 0 1rem', color: '#18181b' }}>1. Autonomía editorial</h2>
            <p style={{ color: '#5b5b5f', marginBottom: '1rem' }}>Nicaragua Informate desarrolla su cobertura con criterio periodístico propio.</p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', margin: '2rem 0 1rem', color: '#18181b' }}>2. Principios de cobertura</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', margin: '1.5rem 0 2rem' }}>
              {PRINCIPIOS.map((p) => (
                <div key={p.title} style={{ background: '#f7f4ee', border: '1px solid #ddd6ce', borderRadius: 10, padding: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#18181b' }}>
                    <i className={`fas ${p.icon}`} style={{ color: '#8c1d18', marginRight: 8 }} />{p.title}
                  </h3>
                  <p style={{ color: '#5b5b5f', margin: 0, fontSize: '0.9rem' }}>{p.desc}</p>
                </div>
              ))}
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', margin: '2rem 0 1rem', color: '#18181b' }}>3. Correcciones y actualizaciones</h2>
            <p style={{ color: '#5b5b5f', marginBottom: '1rem' }}>Cuando se detecte un error relevante, Nicaragua Informate podrá corregir, ampliar o actualizar la pieza correspondiente.</p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', margin: '2rem 0 1rem', color: '#18181b' }}>4. Fuentes e integridad de la información</h2>
            <p style={{ color: '#5b5b5f', marginBottom: '1rem' }}>Valoramos el uso responsable de fuentes documentales, testimoniales e institucionales.</p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', margin: '2rem 0 1rem', color: '#18181b' }}>5. Separación entre contenido editorial y comercial</h2>
            <p style={{ color: '#5b5b5f', marginBottom: '1rem' }}>La publicidad no debe determinar la línea informativa del medio.</p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', margin: '2rem 0 1rem', color: '#18181b' }}>6. Identidad y no afiliación</h2>
            <p style={{ color: '#5b5b5f', marginBottom: '1rem' }}>Nicaragua Informate utiliza su propia marca, estilo editorial y canales oficiales.</p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', margin: '2rem 0 1rem', color: '#18181b' }}>7. Contacto editorial</h2>
            <p style={{ color: '#5b5b5f' }}>Para aclaraciones o consultas: <Link href="/nosotros" style={{ color: '#8c1d18', textDecoration: 'none' }}>nuestra página de contacto</Link>.</p>
          </article>
        </div>
      </main>
      <footer style={{ borderTop: '1px solid #ddd6ce', padding: '2rem 0 3rem', color: '#756d66', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          © 2025-2026 Nicaragua Informate. Portal de noticias digital. Sitio sin relación con cuentas, perfiles o páginas de terceros con nombres similares.
        </div>
      </footer>
    </div>
  );
}
