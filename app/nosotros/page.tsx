import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';
import { Target, Eye, HeartHandshake, Mail, Globe, MapPin, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | Nicaragua Informate',
  description: 'Conoce a Nicaragua Informate. Periodismo de precisión, verificado e independiente desde Managua, Nicaragua. Fundado por Maycol Nicaragua, Jose Luis Lopez y Keyling Rivera.',
  alternates: { canonical: 'https://nicaraguainformate.com/nosotros' },
};

export default function NosotrosPage() {
  return (
    <LegalPageShell title="Sobre Nicaragua Informate">
      <p style={{ fontSize: '1.15rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.8 }}>
        <strong style={{ color: '#fff' }}>Nicaragua Informate</strong> es un portal de noticias digitales independiente, fundado con el propósito de ofrecer a la ciudadanía nicaragüense —y a la diáspora en el exterior— información verificada, contextualizada y oportuna sobre los acontecimientos que marcan la vida nacional y regional.
      </p>

      <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.75 }}>
        En un entorno informativo cada vez más saturado y polarizado, creemos firmemente que el periodismo tiene una función social irrenunciable: servir como contrapeso del poder, dar voz a los ciudadanos y mantener a la población informada con rigor y responsabilidad. Por eso, cada noticia que publicamos pasa por un estricto proceso de verificación, análisis y revisión editorial antes de llegar a nuestros lectores.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem', margin: '0 0 2.5rem' }}>
        {[{ icon: <Target size={24} color="#8c1d18" />, title: 'Misión', desc: 'Brindar información verificada, contextualizada y oportuna que contribuya a la formación de ciudadanos informados y al fortalecimiento de la democracia en Nicaragua.' },
          { icon: <Eye size={24} color="#8c1d18" />, title: 'Visión', desc: 'Ser la fuente de noticias digitales más confiable y consultada por nicaragüenses dentro del país y en el extranjero.' },
          { icon: <HeartHandshake size={24} color="#8c1d18" />, title: 'Valores', desc: 'Veracidad, precisión, responsabilidad social, ética periodística, independencia editorial y respeto a la dignidad humana.' }].map((v) => (
          <div key={v.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '0.75rem' }}>{v.icon}</div>
            <h3 style={{ color: '#fff', marginBottom: '0.4rem', fontSize: '1.05rem' }}>{v.title}</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.55 }}>{v.desc}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2rem', marginBottom: '0.75rem' }}>¿Quién está detrás?</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.75 }}>
        <strong style={{ color: '#fff' }}>Nicaragua Informate</strong> es fruto del esfuerzo conjunto de tres profesionales nicaragüenses comprometidos con el periodismo verificado y el derecho a la información. Cada uno aporta su experiencia desde distintas áreas para mantener un medio digital riguroso, independiente y cercano a la realidad del país.
      </p>

      {/* Fundador 1 */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
            MN
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Maycol Josue Nicaragua Rivas</div>
            <div style={{ color: '#8c1d18', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Director Ejecutivo y Fundador</div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
              Co-fundador de Nicaragua Informate. Encargado de la estrategia general, desarrollo tecnológico y visión de crecimiento del medio. Su liderazgo impulsa la innovación digital y la expansión de la plataforma informativa a nivel nacional.
            </p>
          </div>
        </div>
      </div>

      {/* Fundador 2 */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
            JL
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Jose Luis Lopez Ramirez</div>
            <div style={{ color: '#8c1d18', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Director de Operaciones y Co-fundador</div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
              Co-fundador de Nicaragua Informate. Responsable de la operación diaria, coordinación editorial y gestión de recursos. Su enfoque en la eficiencia garantiza la publicación oportuna y la calidad constante de cada pieza informativa.
            </p>
          </div>
        </div>
      </div>

      {/* Fundador 3 */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
            KR
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Keyling Elieth Rivera Muñoz</div>
            <div style={{ color: '#8c1d18', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Directora Editorial y Co-fundadora</div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
              Co-fundadora y directora editorial de Nicaragua Informate. Periodista con amplia trayectoria en cobertura de sucesos, política nacional y derechos humanos. Firme defensora del periodismo verificado y la independencia editorial. <a href="/autor/keyling-rivera" style={{ color: '#60a5fa', textDecoration: 'none' }}>Ver perfil completo →</a>
            </p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2rem', marginBottom: '0.75rem' }}>¿Por qué creamos este sitio?</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', lineHeight: 1.75 }}>
        Nicaragua Informate nació de la convicción de que la información libre, verificada y accesible es un pilar fundamental para cualquier sociedad democrática. En un contexto donde la desinformación se propaga con velocidad alarmante, decidimos construir un espacio donde la rigurosidad periodística fuera la norma, no la excepción.
      </p>
      <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.75 }}>
        Cubrimos las áreas de sucesos, política nacional, economía, deportes, cultura, tecnología, espectáculos e internacionales. Publicamos contenido original las 24 horas del día, los 7 días de la semana, con un enfoque en la precisión, el contexto y la relevancia para la población nicaragüense.
      </p>

      <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2rem', marginBottom: '0.75rem' }}>Compromiso con la veracidad</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={20} color="#fff" />
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Verificación rigurosa</div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.55 }}>
            Cada pieza informativa es contrastada con múltiples fuentes antes de su publicación.
          </p>
        </div>
      </div>
      <ul style={{ color: '#cbd5e1', lineHeight: 1.8, paddingLeft: '1.5rem', listStyleType: 'disc', marginBottom: '2rem' }}>
        <li><strong style={{ color: '#fff' }}>Verificación:</strong> Toda información es contrastada con al menos dos fuentes independientes antes de su publicación.</li>
        <li><strong style={{ color: '#fff' }}>Correcciones:</strong> Cuando se detecta un error, se corrige de forma transparente y se notifica al lector.</li>
        <li><strong style={{ color: '#fff' }}>Independencia:</strong> No aceptamos presiones externas que comprometan nuestra línea editorial.</li>
        <li><strong style={{ color: '#fff' }}>Separación editorial-comercial:</strong> El contenido informativo es independiente de los anunciantes.</li>
      </ul>

      <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem' }}>Equipo y operación</h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.75 }}>
        Contamos con un equipo multidisciplinario de reporteros, editores y colaboradores distribuidos en distintas regiones de Nicaragua. Esta red territorial nos permite cubrir noticias desde Managua, León, Granada, Estelí, Matagalpa y otras zonas del país en tiempo real.
      </p>

      <h2 style={{ fontSize: '1.3rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem' }}>Ubicación y contacto</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', margin: '0.5rem 0 1.5rem' }}>
        {[
          { icon: <MapPin size={16} color="#8c1d18" />, label: 'Dirección', val: 'Managua, Nicaragua, Centroamérica' },
          { icon: <Mail size={16} color="#8c1d18" />, label: 'Correo', val: 'contacto@nicaraguainformate.com' },
          { icon: <Globe size={16} color="#8c1d18" />, label: 'Sitio web', val: 'www.nicaraguainformate.com' },
        ].map(c => (
          <div key={c.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem' }}>
            <div style={{ marginBottom: 8 }}>{c.icon}</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.label}</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{c.val}</div>
          </div>
        ))}
      </div>
      <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
        Consulta nuestra <a href="/politica-editorial" style={{ color: '#60a5fa', textDecoration: 'none' }}>Política Editorial</a> completa para más detalles.
      </p>
    </LegalPageShell>
  );
}
