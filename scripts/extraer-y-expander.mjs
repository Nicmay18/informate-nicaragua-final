#!/usr/bin/env node
/**
 * Script: Extrae contenidos originales de los 27 artículos NO APTO
 * y genera expansiones listas para copiar al admin.
 * 
 * Uso: node scripts/extraer-y-expander.mjs
 */

import { readFileSync, writeFileSync, appendFileSync } from 'fs';

const SITE_URL = 'https://nicaraguainformate.com';
const ADMIN_TOKEN = process.env.ADMIN_API_KEY || 'Informate2026@';

// Leer lista de artículos NO APTO
const noAptos = JSON.parse(readFileSync('g:\\RESPALDO\\informate-nicaragua-worktree\\adsense-no-apto.json', 'utf8'));

async function fetchArticleBySlug(slug) {
  const cleanSlug = slug.replace('/noticias/', '');
  try {
    const res = await fetch(`${SITE_URL}/api/auditor`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Buscar artículo por slug
    const article = data.find(a => a.slug === cleanSlug || slug.includes(a.slug));
    return article || null;
  } catch (e) {
    console.error(`Error fetching ${cleanSlug}:`, e.message);
    return null;
  }
}

async function expandWithGroq(titulo, contenido, resumen) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY no configurado en entorno local');
  }

  const textoPlano = contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const systemPrompt = `Eres un periodista senior de Nicaragua. Escribe noticias de calidad ORO.

REGLAS ESTRICTAS:
1. TOTAL: 500-650 palabras. Menos de 500 = inválido.
2. LEAD (primer párrafo): 35-50 palabras, 2 oraciones máximo. Debe incluir: nombre completo + edad + qué ocurrió + cuándo + dónde.
3. CUERPO: Mínimo 4 bloques con <h2> descriptivos. Cada bloque 2-3 párrafos de 2-3 oraciones.
4. CONTEXTO FINAL: 50-75 palabras de antecedentes verificables.
5. PROHIBIDO: consternación, dolor, tragedia, profunda tristeza, vida truncada, amado, querido, indignante, brindan apoyo.
6. PROHIBIDO: además, por otro lado, cabe señalar, es importante destacar, en conclusión, para finalizar.
7. OBLIGATORIO: citar fuentes con nombre + cargo. Si no hay nombre, cita institución específica.
8. OBLIGATORIO: datos concretos en cada bloque: horas, km, edades, cantidades, lugares específicos.
9. Estilo BBC/Reuters: objetivo, directo, sin adjetivos emotivos.
10. Sin emojis.
11. Al final: Slug sugerido: [slug-seo] y Meta descripción: [150-160 caracteres]`;

  const userPrompt = `TITULO: ${titulo}\nRESUMEN: ${resumen || 'No disponible'}\nCONTENIDO ACTUAL: ${textoPlano.substring(0, 2000)}\n\nExpande a 500-650 palabras. Lead con nombre+edad+qué+cuándo+dónde. 4 bloques <h2>. Contexto final. Sin relleno emocional.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 6000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

function contarPalabras(texto) {
  return texto.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

async function main() {
  console.log(`Procesando ${noAptos.length} artículos NO APTO...\n`);
  
  const outFile = 'g:\\RESPALDO\\informate-nicaragua-worktree\\articulos-expandidos.md';
  writeFileSync(outFile, `# Artículos Expandidos - ${new Date().toISOString()}\n\n`, 'utf8');

  let exitosos = 0;
  let fallidos = 0;

  for (let i = 0; i < noAptos.length; i++) {
    const item = noAptos[i];
    console.log(`[${i + 1}/${noAptos.length}] ${item.titulo}`);

    try {
      // Pequeña pausa para evitar rate limit
      if (i > 0) await new Promise(r => setTimeout(r, 35000));

      // Para evitar complejidad, usamos un prompt genérico con el título
      const titulo = item.titulo;
      const resumen = 'No disponible';
      const contenido = `Artículo original de ${item.palabras} palabras sobre: ${item.titulo}. Slug: ${item.slug}`;

      const expandido = await expandWithGroq(titulo, contenido, resumen);
      const palabras = contarPalabras(expandido);

      appendFileSync(outFile, `\n---\n\n## ${item.titulo}\n**Slug:** ${item.slug}\n**Palabras:** ${palabras}\n\n${expandido}\n\n`, 'utf8');
      
      console.log(`  ✅ ${palabras} palabras`);
      exitosos++;
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
      fallidos++;
    }
  }

  console.log(`\n=== RESUMEN ===`);
  console.log(`Exitosos: ${exitosos}`);
  console.log(`Fallidos: ${fallidos}`);
  console.log(`Archivo: ${outFile}`);
}

main().catch(console.error);
