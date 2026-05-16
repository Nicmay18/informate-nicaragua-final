import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';
import { MapPin, Mail, Globe, Award, BookOpen, Users, Newspaper, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Keyling Elieth Rivera Muñoz | Directora Editorial | Nicaragua Informate',
  description: 'Conoce a Keyling Elieth Rivera Muñoz, Directora Editorial de Nicaragua Informate. Periodista nicaragüense con amplia trayectoria en cobertura de sucesos, política nacional y derechos humanos.',
  alternates: { canonical: 'https://nicaraguainformate.com/autor/keyling-rivera' },
};

export default function AutorKeylingRiveraPage() {
  return (
    <LegalPageShell title="Keyling Elieth Rivera Muñoz — Directora Editorial">
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 48, flexShrink: 0 }}>
          KR
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: 8, fontWeight: 800 }}>Keyling Elieth Rivera Muñoz</h2>
          <div style={{ color: '#8c1d18', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Directora Editorial — Nicaragua Informate</div>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 16 }}>
            Periodista nicaragüense, co-fundadora y directora editorial de Nicaragua Informate. Especializada en cobertura de sucesos, análisis político nacional y reportajes de investigación sobre derechos humanos. Firme defensora del periodismo verificado y la independencia editorial en Nicaragua.
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
        Keyling Elieth Rivera Muñoz ha construido una sólida trayectoria en el periodismo nicaragüense, cubriendo desde sucesos locales hasta temas de política nacional, economía y derechos humanos. Su trabajo se caracteriza por la rigurosidad en la verificación de fuentes, el contexto profundo y el compromiso con la verdad.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.75, fontSize: '0.95rem' }}>
        Como directora editorial de Nicaragua Informate, supervisa cada pieza informativa antes de su publicación, garantizando que cumpla con los estándares de veracidad, precisión y responsabilidad social que rigen al medio. Su liderazgo editorial ha sido fundamental para posicionar al portal como una fuente confiable de información nacional.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem', margin: '2.5rem 0' }}>
        {[
          { icon: <Award size={24} color="#8c1d18" />, title: 'Especialización', desc: 'Cobertura de sucesos, análisis político y reportajes de investigación sobre derechos humanos.' },
          { icon: <Newspaper size={24} color="#8c1d18" />, title: 'Experiencia', desc: 'Amplia trayectoria en medios de comunicación nicaragüenses, cubriendo temas de relevancia nacional.' },
          { icon: <BookOpen size={24} color="#8c1d18" />, title: 'Enfoque', desc: 'Verificación rigurosa, contextualización profunda y defensa de la independencia editorial.' },
          { icon: <Shield size={24} color="#8c1d18" />, title: 'Compromiso', desc: 'Periodismo verificado como pilar de la democracia y el derecho a la información ciudadana.' },
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

      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
          <Users size={24} color="#8c1d18" />
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Equipo fundador</div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0' }}>
              Nicaragua Informate fue fundado junto a <strong style={{ color: '#fff' }}>Maycol Josue Nicaragua Rivas</strong> y <strong style={{ color: '#fff' }}>Jose Luis Lopez Ramirez</strong>.
            </p>
          </div>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
          Conoce más sobre el equipo en nuestra página de <a href="/nosotros" style={{ color: '#60a5fa', textDecoration: 'none' }}>Sobre Nosotros</a>.
        </p>
      </div>

      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '2rem' }}>
        Consulta nuestra <a href="/politica-editorial" style={{ color: '#60a5fa', textDecoration: 'none' }}>Política Editorial</a> completa para más detalles sobre nuestros estándares de publicación.
      </p>
    </LegalPageShell>
  );
}
