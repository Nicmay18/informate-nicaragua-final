import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';
import { AlertCircle, Mail, Clock, FileText, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Correcciones | Nicaragua Informate',
  description: 'Nuestro compromiso con la precisión. Cómo reportamos errores y el proceso de corrección en Nicaragua Informate.',
  alternates: { canonical: 'https://www.nicaraguainformate.com/correcciones' },
};

export default function CorreccionesPage() {
  return (
    <LegalPageShell title="Política de Correcciones">
      <div style={{ background: 'rgba(140,29,24,0.08)', borderLeft: '4px solid #8c1d18', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <strong>Última actualización:</strong> 12 de mayo de 2026
      </div>

      <p style={{ fontSize: '1.05rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.75 }}>
        En <strong>Nicaragua Informate</strong> creemos que la confianza de nuestros lectores se construye con transparencia. 
        Cuando cometemos un error, lo corregimos de manera visible y oportuna. Esta política describe nuestro proceso de correcciones.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <AlertCircle size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        1. Nuestro compromiso con la exactitud
      </h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Antes de publicar cualquier noticia, contrastamos la información con múltiples fuentes. Sin embargo, el periodismo 
        es un trabajo en tiempo real y errores pueden ocurrir. Cuando esto sucede, actuamos con prontitud para rectificar.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <FileText size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        2. Qué consideramos una corrección
      </h2>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Datos fácticos incorrectos (nombres, fechas, cifras, lugares)</li>
        <li style={{ marginBottom: '0.5rem' }}>Atribuciones erróneas de citas o declaraciones</li>
        <li style={{ marginBottom: '0.5rem' }}>Información descontextualizada que induzca a error</li>
        <li style={{ marginBottom: '0.5rem' }}>Errores significativos en el análisis interpretativo</li>
        <li style={{ marginBottom: '0.5rem' }}>Información obsoleta que haya sido superada por nuevos hechos</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <Clock size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        3. Proceso de corrección
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.75rem', margin: '1.25rem 0 1.5rem' }}>
        {[
          { step: '1', title: 'Reporte', desc: 'Recibimos el reporte del lector o detectamos el error internamente.' },
          { step: '2', title: 'Verificación', desc: 'Contrastamos la información con fuentes primarias y expertos.' },
          { step: '3', title: 'Corrección', desc: 'Actualizamos la noticia con la información correcta.' },
          { step: '4', title: 'Notificación', desc: 'Añadimos una nota visible indicando el cambio realizado.' },
        ].map((s) => (
          <div key={s.step} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '1rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{s.step}</div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: '#fff', fontWeight: 600 }}>{s.title}</h3>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem', lineHeight: 1.55 }}>{s.desc}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <CheckCircle size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        4. Cómo identificamos las correcciones
      </h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Cuando una noticia es corregida después de su publicación, agregamos una nota al pie del artículo con el siguiente formato:
      </p>
      <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ color: '#fbbf24', margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
          <AlertCircle size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'text-bottom' }} />
          Nota de corrección
        </p>
        <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.88rem', lineHeight: 1.65 }}>
          <em>Este artículo fue actualizado el [fecha] para corregir [descripción del error]. La información previa indicaba [dato incorrecto] y ha sido rectificada a [dato correcto].</em>
        </p>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <Mail size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        5. Reportar un error
      </h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Si detectas un error en alguna de nuestras publicaciones, te agradecemos que nos lo hagas saber. Puedes reportarlo a través de:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Nuestro <a href="/contacto" style={{ color: '#60a5fa', textDecoration: 'none' }}>formulario de contacto</a> seleccionando "Solicitar corrección"</li>
        <li style={{ marginBottom: '0.5rem' }}>Correo directo: <a href="mailto:redaccion@nicaraguainformate.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>redaccion@nicaraguainformate.com</a></li>
      </ul>
      <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '2rem' }}>
        Procesamos los reportes en un plazo de 24 a 48 horas hábiles. Si el error es confirmado, publicamos la corrección dentro de las siguientes 24 horas.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#fff', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        6. Alcance de esta política
      </h2>
      <p style={{ color: '#cbd5e1', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Esta política aplica a todo el contenido publicado en Nicaragua Informate, incluyendo noticias, análisis, 
        entrevistas y reportajes. No aplica a errores tipográficos menores que no alteren el significado de la información.
      </p>
    </LegalPageShell>
  );
}
