import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prompts y Plantillas para Redacción',
  robots: { index: false, follow: false },
};

const PROMPT_SISTEMA = `Eres el redactor principal de "Nicaragua Informate", medio digital de información general con estilo de agencia (Reuters / AP / BBC adaptado para web latinoamericana).

Actúa como un corresponsal senior destacado en Nicaragua y redacta una noticia basada en el título y categoría indicados.

PRINCIPIOS ABSOLUTOS:
- Redactas exclusivamente noticias informativas. Nunca emites opiniones ni juicios de valor.
- Lenguaje: neutro, claro, directo y verificable. Jamás uses adjetivos emocionales ("trágico", "terrible", "impactante", "conmocionó").
- Estilo: oraciones cortas. Párrafos de 2 a 3 oraciones. Voz activa. Pensado para móvil.
- FUENTES REALISTAS: En Nicaragua, instituciones NO dan declaraciones a medios independientes. Usa: testigos, familiares, videos de ciudadanos, comunicados cuando existan, cobertura directa. NUNCA inventes "la Policía informó" o "el MINSA confirmó".

ESTRUCTURA OBLIGATORIA:
1. TITULAR: Máx 60 caracteres. SIEMPRE incluye dato concreto: número, nombre propio o lugar.
2. LEAD: 35-50 palabras. Quién, qué, cuándo, dónde. Incluye AL MENOS una entidad real.
3. CUERPO: Mínimo 5 bloques <h2>. Mínimo 600 palabras. Incluye 1 cita con nombre+cargo y 2 preguntas naturales para FAQ.
4. ENTIDADES: Nombres completos de personas, organizaciones, lugares específicos. Marca con <strong> en primera mención.
5. ANTI-TEMPLATE: Prohibido "según informes preliminares", "fuentes policiales indicaron", "las autoridades confirmaron", "la víctima fue identificada como".
6. METADATOS: slug SEO, meta descripción (150-160 chars), keywords (5-8 palabras clave).

AL FINAL DEL CUERPO agregá:
'Slug sugerido: [slug-seo]'
'Meta descripción: [150-160 caracteres]'`;

const PROMPT_IMAGEN = `Fotografía de estilo fotoperiodismo de [escena específica en Nicaragua], 
luz natural de atardecer, alta resolución, aspecto realista, 
sin texto ni marcas de agua, composición periodística`;

const CATEGORIAS = [
  { nombre: 'Sucesos', emoji: '🚨', tip: 'Prioriza: quién, edad, qué pasó, dónde, cuándo. Siempre nombre completo en primera mención.' },
  { nombre: 'Nacionales', emoji: '📌', tip: 'Contexto político-social breve. Cifras oficiales cuando existan, si no, testimonios ciudadanos.' },
  { nombre: 'Deportes', emoji: '⚽', tip: 'Marcador, minuto, estadio, nombres completos de jugadores. Estadísticas concretas.' },
  { nombre: 'Espectáculos', emoji: '🎬', tip: 'Nombre artístico + nombre real, lugar del evento, fecha. Sin chisme ni especulación.' },
  { nombre: 'Tecnología', emoji: '💻', tip: 'Modelos, precios en córdobas/dólares, disponibilidad en Nicaragua. Fuentes: tiendas locales, usuarios.' },
  { nombre: 'Internacionales', emoji: '🌍', tip: 'Ángulo nicaragüense si aplica: cómo afecta a Nicaragua, compatriotas en el lugar, reacciones locales.' },
];

export default function CrecimientoPage() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: 1.6, color: '#1f2937' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#111827' }}>🛠️ Prompts y Plantillas para Redacción</h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Copiá y pegá estos prompts en ChatGPT, Claude, Gemini o cualquier agente de IA para redactar noticias con la estructura editorial de Nicaragua Informate.</p>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827', borderBottom: '2px solid #2563eb', paddingBottom: 8 }}>📋 Prompt Sistema (Principal)</h2>
        <p style={{ color: '#6b7280', marginBottom: 12, fontSize: 14 }}>Copiá este prompt, completá el título, categoría y departamento, y pegalo junto con cualquier información que tengas del hecho.</p>
        <pre style={{ background: '#f3f4f6', padding: 20, borderRadius: 12, overflow: 'auto', fontSize: 13, lineHeight: 1.7, border: '1px solid #e5e7eb', whiteSpace: 'pre-wrap' }}>{PROMPT_SISTEMA}</pre>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827', borderBottom: '2px solid #059669', paddingBottom: 8 }}>🖼️ Prompt para Generar Imagen de Portada</h2>
        <p style={{ color: '#6b7280', marginBottom: 12, fontSize: 14 }}>Usalo en Gemini Image Generation, DALL-E, Midjourney o similar. Reemplazá [escena específica] con la descripción del hecho.</p>
        <pre style={{ background: '#f3f4f6', padding: 20, borderRadius: 12, overflow: 'auto', fontSize: 13, lineHeight: 1.7, border: '1px solid #e5e7eb', whiteSpace: 'pre-wrap' }}>{PROMPT_IMAGEN}</pre>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827', borderBottom: '2px solid #d97706', paddingBottom: 8 }}>📌 Tips por Categoría</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {CATEGORIAS.map((cat) => (
            <div key={cat.nombre} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{cat.emoji} {cat.nombre}</div>
              <div style={{ fontSize: 14, color: '#4b5563' }}>{cat.tip}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827', borderBottom: '2px solid #dc2626', paddingBottom: 8 }}>🚫 Palabras Prohibidas (AdSense / SEO)</h2>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 20, fontSize: 14, color: '#7f1d1d' }}>
          <p style={{ margin: 0, fontWeight: 600, marginBottom: 10 }}>NUNCA uses estas palabras en titulares, resúmenes ni leads:</p>
          <p style={{ margin: 0, lineHeight: 1.8 }}>
            trágico · terrible · impactante · desgarrador · conmocionó · indignante · horroroso · escalofriante · macabro · sangriento · brutal ejecución · asesinato a sangre fría · descuartizado · calcinado · desmembrado · violación (como titular) · abuso sexual (como titular) · prostitución infantil · pornografía infantil · narcosatanicos · sicario · sicariato (como categoría) · tragedia (como adjetivo)
          </p>
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#111827', borderBottom: '2px solid #7c3aed', paddingBottom: 8 }}>✅ Checklist antes de Publicar</h2>
        <ul style={{ fontSize: 14, color: '#374151', lineHeight: 2, paddingLeft: 20 }}>
          <li>Título: máximo 60 caracteres, con dato concreto</li>
          <li>Lead: 35-50 palabras, quién/qué/cuándo/dónde</li>
          <li>Mínimo 5 subtítulos &lt;h2&gt; descriptivos</li>
          <li>Mínimo 600 palabras en el cuerpo</li>
          <li>1 cita con nombre completo + cargo/relación</li>
          <li>2 preguntas naturales para FAQ Schema</li>
          <li>Nombres completos de personas en &lt;strong&gt; en primera mención</li>
          <li>Contexto o antecedentes al final (50-75 palabras)</li>
          <li>Slug SEO y meta descripción al final del cuerpo</li>
          <li>Sin emojis en el cuerpo de la noticia</li>
          <li>Sin adjetivos emocionales ni opiniones subjetivas</li>
        </ul>
      </section>

      <footer style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
        Nicaragua Informate — Estructura Editorial obligatoria desde junio 2026
      </footer>
    </div>
  );
}
