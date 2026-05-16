import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';
import { MapPin, Mail, Globe, Award, BookOpen, Users, Newspaper } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Juan Pérez | Director Editorial | Nicaragua Informate',
  description: 'Conoce a Juan Pérez, Director Editorial de Nicaragua Informate. Periodista nicaragüense con más de una década de trayectoria en cobertura política, análisis económico y reportajes de investigación.',
  alternates: { canonical: 'https://nicaraguainformate.com/autor/juan-perez' },
};

export default function AutorJuanPerezPage() {
  return (
    <LegalPageShell title="Juan Pérez — Director Editorial">
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 48, flexShrink: 0 }}>
          JP
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: 8, fontWeight: 800 }}>Juan Pérez</h2>
          <div style={{ color: '#8c1d18', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Director Editorial — Nicaragua Informate</div>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 16 }}>
            Periodista nicaragüense con más de una década de trayectoria profesional. Desde que inició su carrera en 2015, Juan ha trabajado en distintos medios de comunicación del país, cubriendo desde sucesos locales hasta temas de política nacional, economía y derechos humanos.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13 }}>
              <MapPin size={14} /> Managua, Nicaragua
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13 }}>
              <Mail size={14} /> contacto@nicaraguainformate.com
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13 }}>
              <Globe size={14} /> nicaraguainformate.com
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.75rem', fontWeight: 700 }}>Trayectoria profesional</h3>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', lineHeight: 1.75, fontSize: '0.95rem' }}>
        Juan Pérez se especializa en cobertura política, análisis económico y reportajes de investigación. Ha colaborado en medios nacionales e internacionales, desarrollando una metodología de verificación rigurosa que prioriza la contextualización y la contrastación de fuentes antes de publicar cualquier información.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>
        Su compromiso es con la verdad periodística y el derecho del ciudadano a estar informado. Bajo su dirección, Nicaragua Informate mantiene estándares de calidad que priorizan la veracidad, la independencia editorial y el respeto a la dignidad humana en cada pieza publicada.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem', margin: '2.5rem 0' }}>
        {[
          { icon: <Award size={24} color="#8c1d18" />, title: 'Especialización', desc: 'Cobertura política, análisis económico y reportajes de investigación.' },
          { icon: <Newspaper size={24} color="#8c1d18" />, title: 'Experiencia', desc: 'Más de 10 años de trayectoria en medios de comunicación nacionales e internacionales.' },
          { icon: <BookOpen size={24} color="#8c1d18" />, title: 'Enfoque', desc: 'Verificación rigurosa, contextualización y contrastación de fuentes independientes.' },
          { icon: <Users size={24} color="#8c1d18" />, title: 'Compromiso', desc: 'Derecho del ciudadano a estar informado con verdad y responsabilidad social.' },
        ].map((v) => (
          <div key={v.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '0.75rem' }}>{v.icon}</div>
            <h4 style={{ color: '#fff', marginBottom: '0.4rem', fontSize: '1.05rem' }}>{v.title}</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.55 }}>{v.desc}</p>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: '1.15rem', color: '#fff', marginTop: '2rem', marginBottom: '0.75rem', fontWeight: 700 }}>Principios editoriales</h3>
      <ul style={{ color: '#cbd5e1', lineHeight: 1.8, paddingLeft: '1.5rem', listStyleType: 'disc', marginBottom: '2rem', fontSize: '0.95rem' }}>
        <li><strong style={{ color: '#fff' }}>Verificación:</strong> Toda información es contrastada con al menos dos fuentes independientes antes de su publicación.</li>
        <li><strong style={{ color: '#fff' }}>Correcciones:</strong> Cuando se detecta un error, se corrige de forma transparente y se notifica al lector.</li>
        <li><strong style={{ color: '#fff' }}>Independencia:</strong> No se aceptan presiones externas que comprometan la línea editorial.</li>
        <li><strong style={{ color: '#fff' }}>Separación editorial-comercial:</strong> El contenido informativo es independiente de los anunciantes.</li>
        <li><strong style={{ color: '#fff' }}>Respeto y dignidad:</strong> No se publica contenido que atente contra la dignidad humana o incite al odio.</li>
      </ul>

      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '2rem' }}>
        Consulta nuestra <a href="/politica-editorial" style={{ color: '#60a5fa', textDecoration: 'none' }}>Política Editorial</a> completa para más detalles sobre nuestros estándares de publicación.
      </p>
    </LegalPageShell>
  );
}
