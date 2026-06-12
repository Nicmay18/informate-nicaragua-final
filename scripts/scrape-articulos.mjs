#!/usr/bin/env node
/**
 * Extrae contenido HTML de los 27 artículos NO APTO desde el sitio web
 */

import { readFileSync, writeFileSync } from 'fs';

const noAptos = JSON.parse(readFileSync('g:\\RESPALDO\\informate-nicaragua-worktree\\adsense-no-apto.json', 'utf8'));
const OUT = 'g:\\RESPALDO\\informate-nicaragua-worktree\\articulos-originales.json';

async function scrapeArticle(slug) {
  const url = `https://nicaraguainformate.com${slug}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    
    // Extraer contenido del artículo (buscar entre <article> o clase específica)
    // Intentar múltiples patrones comunes
    let content = '';
    
    // Patrón 1: contenido dentro de article o div con clase de contenido
    const patterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]*class="[^"]*(?:content|article|body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*prose[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<main[^>]*>([\s\S]*?)<\/main>/i,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        content = match[1];
        break;
      }
    }
    
    // Si no encontró nada, buscar párrafos después del título
    if (!content) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        const paras = bodyMatch[1].match(/<p[^>]*>[\s\S]*?<\/p>/gi);
        if (paras) content = paras.slice(0, 20).join('\n');
      }
    }
    
    // Limpiar scripts y estilos del contenido
    content = content
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '');
    
    return { slug, url, content: content.substring(0, 8000), success: true };
  } catch (e) {
    return { slug, url, error: e.message, success: false };
  }
}

async function main() {
  const resultados = [];
  
  for (let i = 0; i < noAptos.length; i++) {
    const item = noAptos[i];
    console.log(`[${i + 1}/${noAptos.length}] Scraping: ${item.slug}`);
    
    const data = await scrapeArticle(item.slug);
    resultados.push({ ...item, ...data });
    
    // Pausa para no saturar
    if (i < noAptos.length - 1) await new Promise(r => setTimeout(r, 1000));
  }
  
  writeFileSync(OUT, JSON.stringify(resultados, null, 2), 'utf8');
  
  const exitosos = resultados.filter(r => r.success).length;
  console.log(`\n✅ Exitosos: ${exitosos}/${noAptos.length}`);
  console.log(`Guardado en: ${OUT}`);
}

main().catch(console.error);
