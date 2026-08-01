import type { Metadata } from 'next';
import LegalPageShell from '@/components/LegalPageShell';
import { BookOpen, Search, CheckCircle, Shield, Users, Award, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Metodología Editorial',
  description: 'Proceso de verificación, fuentes, estándares de calidad y criterios editoriales de Nicaragua Informate.',
  alternates: { canonical: 'https://nicaraguainformate.com/metodologia-editorial' },
};

export default function MetodologiaEditorialPage() {
  return (
    <LegalPageShell title="Metodología Editorial">
      <div style={{ background: 'rgba(140,29,24,0.08)', borderLeft: '4px solid #8c1d18', padding: '0.75rem 1.25rem', borderRadius: '0 0.5rem 0.5rem 0', marginBottom: '2rem', color: '#8c1d18', fontSize: '0.85rem' }}>
        <strong>Base normativa:</strong> Toda publicación sigue el Motor Editorial Nicaragua Informate (MENI) v1.1.
      </div>

      <p style={{ fontSize: '1.05rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.75 }}>
        En <strong>Nicaragua Informate</strong> no reproducimos comunicados ni reescribimos agencias. 
        Cada noticia se construye con contraste de fuentes, contexto local y aporte propio para quien lee.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <BookOpen size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        1. Principios editoriales
      </h2>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Independencia:</strong> no dependemos de partidos, empresas ni gobiernos para decidir qué cubrimos.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Verificación:</strong> toda afirmación relevante se contrasta con al menos una fuente primaria o directa.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Contexto:</strong> ubicamos el hecho en el lugar, el momento y las instituciones que lo rodean.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Responsabilidad:</strong> informamos sin explotar el dolor, especialmente en sucesos y tragedias.</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#0f172a' }}>Corrección pública:</strong> cuando cometemos un error, lo corregimos de forma visible.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <Search size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        2. Fuentes y verificación
      </h2>
      <p style={{ color: '#475569', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Trabajamos con fuentes oficiales, documentos públicos, declaraciones directas y reportes de campo. 
        No publicamos un dato hasta que sabemos quién lo dijo, cuándo y en qué condiciones.
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Identificamos la fuente en el cuerpo de la nota cuando es relevante.</li>
        <li style={{ marginBottom: '0.5rem' }}>Evitamos el anonimato innecesario; cuando se protege una fuente, explicamos el porqué.</li>
        <li style={{ marginBottom: '0.5rem' }}>No mezclamos opinión con hecho. Los análisis están claramente marcados como tales.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <CheckCircle size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        3. Proceso de publicación
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.75rem', margin: '1.25rem 0 1.5rem' }}>
        {[
          { step: '1', title: 'Recepción', desc: 'Recibimos el hecho, comunicado o dato.' },
          { step: '2', title: 'Análisis MENI', desc: 'Aplicamos las fases forense, EEAT y SEO.' },
          { step: '3', title: 'Redacción', desc: 'Construimos la noticia con ángulo propio.' },
          { step: '4', title: 'Revisión', desc: 'Verificación de datos, tono y cumplimiento legal.' },
          { step: '5', title: 'Publicación', desc: 'Publicamos con metadata, imagen y schema.' },
        ].map((s) => (
          <div key={s.step} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#8c1d18,#c41e3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{s.step}</div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: '#0f172a', fontWeight: 600 }}>{s.title}</h3>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem', lineHeight: 1.55 }}>{s.desc}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <Shield size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        4. Correcciones y transparencia
      </h2>
      <p style={{ color: '#475569', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Las correcciones se publican con la misma visibilidad de la nota original. 
        Consulta nuestra <a href="/correcciones" style={{ color: '#2563eb', textDecoration: 'none' }}>Política de Correcciones</a> para conocer plazos y derecho de réplica.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <Users size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        5. Autoría y experiencia
      </h2>
      <p style={{ color: '#475569', marginBottom: '1.25rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Cada noticia lleva autor, fecha de publicación y, cuando corresponde, fecha de actualización. 
        Los periodistas y colaboradores tienen perfil público con biografía, foto y áreas de cobertura.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <Award size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        6. Estándar MENI para publicación
      </h2>
      <p style={{ color: '#475569', marginBottom: '1rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        El Motor Editorial Nicaragua Informate evalúa cada pieza antes de salir. Para ser publicada debe cumplir:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Score editorial <strong style={{ color: '#0f172a' }}>≥ 85/100</strong>.</li>
        <li style={{ marginBottom: '0.5rem' }}>Originalidad aprobada: aporte propio, no copia de comunicados o agencias.</li>
        <li style={{ marginBottom: '0.5rem' }}>EEAT aprobado: experiencia, autoridad y confianza demostrab les.</li>
        <li style={{ marginBottom: '0.5rem' }}>Valor para el usuario: responde qué, dónde, cuándo, por qué importa y qué sigue.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: '#0f172a', marginTop: '2.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>
        <AlertCircle size={18} color="#8c1d18" style={{ marginRight: 8, display: 'inline', verticalAlign: 'text-bottom' }} />
        7. Criterios frente a Google AdSense
      </h2>
      <p style={{ color: '#475569', marginBottom: '1rem', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Rechazamos el contenido que Google identifica como poco valioso:
      </p>
      <ul style={{ marginLeft: '1.5rem', marginBottom: '1.5rem', color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
        <li style={{ marginBottom: '0.5rem' }}>Agregadores automáticos o republicaciones sin contexto.</li>
        <li style={{ marginBottom: '0.5rem' }}>Noticias recicladas de otras fuentes sin añadir valor.</li>
        <li style={{ marginBottom: '0.5rem' }}>Páginas vacías, con menos de 150 palabras o sin información confirmada.</li>
        <li style={{ marginBottom: '0.5rem' }}>Contenido generado sin supervisión editorial humana.</li>
        <li style={{ marginBottom: '0.5rem' }}>Cobertura de sucesos con lenguaje sensacionalista o sin datos verificables.</li>
      </ul>
      <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '2rem' }}>
        Cada pieza debe ser útil para un lector nicaragüense: lugar, contexto, instituciones involucradas, antecedentes y por qué merece existir.
      </p>
    </LegalPageShell>
  );
}
