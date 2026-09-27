import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';
import { BookOpen, Search, CheckCircle, Shield, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Metodología Editorial',
  description: 'Cómo trabajamos en Nicaragua Informate: verificación, contraste de fuentes, contexto y responsabilidad editorial.',
  alternates: { canonical: 'https://nicaraguainformate.com/metodologia-editorial' },
};

export default function MetodologiaEditorialPage() {
  return (
    <LegalPageShell title="Metodología Editorial">
      <p style={{ fontSize: '1.05rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75 }}>
        En <strong>Nicaragua Informate</strong> no reproducimos comunicados ni reescribimos agencias.
        Cada noticia se construye con contraste de fuentes, contexto local y aporte propio para quien lee.
        Esta página explica, de forma pública, los principios periodísticos que guían nuestro trabajo.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <BookOpen size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        1. Principios editoriales
      </h2>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Independencia:</strong> nuestras decisiones editoriales no dependen de partidos, empresas ni gobiernos.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Verificación:</strong> las afirmaciones relevantes se contrastan con fuentes confiables y, cuando es posible, con fuentes primarias o directas.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Contexto:</strong> ubicamos cada hecho en el lugar, el momento y las instituciones que lo rodean.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Responsabilidad:</strong> informamos sin explotar el dolor, especialmente en sucesos y tragedias.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Corrección pública:</strong> cuando cometemos un error, lo corregimos de forma visible y transparente.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <Search size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        2. Fuentes y verificación
      </h2>
      <p style={{ color: '#475569', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Trabajamos con fuentes oficiales, documentos públicos, declaraciones directas y reportes de campo.
        Antes de publicar un dato procuramos establecer quién lo dijo, cuándo y en qué condiciones.
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Identificamos la fuente en el cuerpo de la nota cuando es relevante.</li>
        <li style={{ marginBottom: '0.5rem' }}>Evitamos el anonimato innecesario; cuando protegemos una fuente, explicamos el motivo.</li>
        <li style={{ marginBottom: '0.5rem' }}>Diferenciamos claramente hechos, declaraciones y análisis. Los artículos de opinión se identifican como tales.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <CheckCircle size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        3. Cómo producimos una noticia
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.75rem', margin: '1.25rem 0 1.5rem' }}>
        {[
          { step: '1', title: 'Recepción', desc: 'Registramos el hecho, comunicado o dato relevante.' },
          { step: '2', title: 'Verificación', desc: 'Contrastamos la información con fuentes confiables.' },
          { step: '3', title: 'Redacción', desc: 'Construimos la noticia con contexto y ángulo propio.' },
          { step: '4', title: 'Revisión', desc: 'Comprobamos datos, tono y exactitud antes de publicar.' },
          { step: '5', title: 'Publicación', desc: 'Publicamos con autoría, fecha y fuentes identificadas.' },
        ].map((s) => (
          <div key={s.step} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{s.step}</div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: '#0f172a', fontWeight: 600 }}>{s.title}</h3>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem', lineHeight: 1.55 }}>{s.desc}</p>
          </div>
        ))}
      </div>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Toda publicación pasa por revisión editorial humana antes de salir. Las decisiones sobre qué
        publicar y cómo tratarlo son responsabilidad del equipo de redacción.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <Shield size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        4. Correcciones y transparencia
      </h2>
      <p style={{ color: '#475569', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Las correcciones se publican con la misma visibilidad de la nota original.
        Consulta nuestra <a href="/correcciones" style={{ color: '#2563eb', textDecoration: 'none' }}>Política de Correcciones</a> para conocer cómo reportar un error.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <Users size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        5. Autoría y responsabilidad
      </h2>
      <p style={{ color: '#475569', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Cada noticia lleva autor, fecha de publicación y, cuando corresponde, fecha de actualización.
        Los periodistas y colaboradores tienen perfil público con biografía y áreas de cobertura.
        Una persona responsable revisa cada publicación antes de que salga.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <CheckCircle size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        6. Contenido patrocinado
      </h2>
      <p style={{ color: '#475569', marginBottom: '1.5rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        La publicidad no determina qué noticias cubrimos ni cómo las tratamos. Cuando publicamos
        contenido patrocinado o de carácter comercial, lo identificamos claramente para que no se
        confunda con nuestro contenido editorial.
      </p>
    </LegalPageShell>
  );
}
