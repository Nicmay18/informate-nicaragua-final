/**
 * REESCRIBIR CON DEEPSEEK — Reescribe 206 noticias a estilo BBC/CNN
 * Usa DeepSeek V3 (muy barato, ~$2-3 USD para todo)
 * 
 * Requiere: DEEPSEEK_API_KEY en .env.local
 * Ejecutar: node scripts/reescribir-con-deepseek.mjs
 * Preview: node scripts/reescribir-con-deepseek.mjs --dry-run
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const DRY_RUN = process.argv.includes('--dry-run');
const API_KEY = process.env.DEEPSEEK_API_KEY;

if (!API_KEY) {
  console.error('❌ DEEPSEEK_API_KEY no configurada en .env.local');
  console.error('   1. Andá a https://platform.deepseek.com');
  console.error('   2. Creá una API Key');
  console.error('   3. Agregala a .env.local: DEEPSEEK_API_KEY=sk-...');
  process.exit(1);
}

function initDb() {
  if (getApps().length > 0) return getFirestore(getApp());
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
    return getFirestore();
  }
  const pk = process.env.FIREBASE_PRIVATE_KEY.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: pk }) });
  return getFirestore();
}

const db = initDb();

// ─── PROMPT DE REDACCIÓN PROFESIONAL ───────────────────────────

const SYSTEM_PROMPT = `Eres un redactor senior del portal de noticias Nicaragua Informate. Tu trabajo es transformar notas de prensa en artículos periodísticos profesionales, directos y sin relleno.

REGLAS ESTRICTAS:
1. Lead: En la primera oración deben aparecer obligatoriamente: Quién, Qué, Cuándo, Dónde
2. Párrafos cortos: Máximo 2-3 oraciones por párrafo
3. Subtítulos con <h2>: Concretos, máximo 6 palabras. NO uses "Desarrollo de la noticia", "Contexto", "Más detalles"
4. NO agregues firma al final
5. Frases PROHIBIDAS (nunca usar): "En este contexto", "por su parte", "por otro lado", "es importante destacar", "cabe señalar", "asimismo", "además de esto", "en conclusión", "un hito", "sin duda", "por ende", "consecuentemente", "Las autoridades investigan", "La comunidad se encuentra consternada", "Esta situación ha generado preocupación", "Un hecho que ha conmocionado", "Organizaciones de apoyo están brindando acompañamiento", "Se exhorta a la población", "La Policía Nacional insta a la ciudadanía"
6. Tonada periodística: Sé frío con los datos. El hecho ya es grave; no dramatices con adjetivos.
7. Si una oración no aporta dato nuevo, números, nombres propios, lugares específicos o cita textual: se borra.
8. Formato HTML limpio con <p> y <h2>. Sin listas <ul> vacías. Sin blockquotes vacíos.
9. NO inventes datos, nombres ni fechas. Mantén los hechos reales del texto original.
10. Incluye al menos 15 palabras en <strong> para datos importantes (nombres, lugares, cifras).
11. Incluye al menos 2 subtítulos <h2> relevantes.
12. Mínimo 500 palabras. Expande con contexto real si es necesario.

Responde SOLO con el HTML del artículo, sin explicaciones adicionales.`;

// ─── FUNCIONES ───────────────────────────────────────────────────

function limpiarHTML(t) { return (t || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function contarPalabras(t) { return limpiarHTML(t).split(/\s+/).filter(Boolean).length; }

async function reescribirNoticia(titulo, contenido) {
  const textoPlano = limpiarHTML(contenido);
  const palabras = contarPalabras(contenido);
  
  const prompt = `REESCRIBE esta noticia a estilo periodístico profesional (BBC/CNN). 

TÍTULO ORIGINAL: ${titulo}
PALABRAS ACTUALES: ${palabras}
TEXTO ORIGINAL:
${textoPlano.substring(0, 2500)}

REGLAS:
- Lead con Quién, Qué, Cuándo, Dónde en la primera oración
- Párrafos de 2-3 oraciones máximo
- Al menos 2 subtítulos <h2> concretos
- Al menos 15 <strong> en datos importantes
- Mínimo 500 palabras
- Tono frío, objetivo, sin adjetivos emocionales
- SIN frases como "en conclusión", "es importante destacar", "las autoridades investigan"
- NO inventes datos
- Responde SOLO el HTML, sin explicaciones`;

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat', // DeepSeek V3
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('DeepSeek devolvió respuesta vacía');
  
  return text.trim();
}

// ─── MAIN ────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  REESCRITOR MASIVO — DeepSeek V3');
  console.log(`  MODO: ${DRY_RUN ? 'DRY-RUN (preview 3 noticias)' : 'REESCRIBIR TODO'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();
  console.log(`📡 ${snapshot.docs.length} noticias encontradas\n`);

  const noticias = [];
  for (const doc of snapshot.docs) {
    const d = doc.data();
    noticias.push({ id: doc.id, titulo: d.titulo || '', contenido: d.contenido || '', categoria: d.categoria || 'General', fecha: d.fecha });
  }

  // Si es dry-run, solo 3 noticias
  const batch = DRY_RUN ? noticias.slice(0, 3) : noticias;

  const resultados = [];
  const fallos = [];
  let totalTokens = 0;

  for (let i = 0; i < batch.length; i++) {
    const n = batch[i];
    console.log(`\n[${i + 1}/${batch.length}] ${n.titulo.slice(0, 60)}...`);
    
    try {
      const inicio = Date.now();
      const nuevoContenido = await reescribirNoticia(n.titulo, n.contenido);
      const duracion = ((Date.now() - inicio) / 1000).toFixed(1);
      
      const palabrasAntes = contarPalabras(n.contenido);
      const palabrasDespues = contarPalabras(nuevoContenido);
      const strongs = (nuevoContenido.match(/<strong>/gi) || []).length;
      const h2s = (nuevoContenido.match(/<h2>/gi) || []).length;
      
      console.log(`   ✅ ${palabrasAntes} → ${palabrasDespues} palabras | ${strongs} strong | ${h2s} h2 | ${duracion}s`);
      
      resultados.push({
        id: n.id,
        titulo: n.titulo,
        palabrasAntes,
        palabrasDespues,
        strongs,
        h2s,
        contenido: nuevoContenido,
      });
      
      // Estimación de tokens: ~1.5 tokens por palabra
      totalTokens += (palabrasAntes + palabrasDespues) * 1.5;
      
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      fallos.push({ id: n.id, titulo: n.titulo, error: err.message });
    }
    
    // Espera 1s entre requests para no saturar
    if (!DRY_RUN && i < batch.length - 1) await new Promise(r => setTimeout(r, 1000));
  }

  // ─── RESUMEN ─────────────────────────────────────────────────
  console.log('\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log('┃                    RESUMEN FINAL                             ┃');
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
  console.log(`  ✅ Reescritas: ${resultados.length}`);
  console.log(`  ❌ Fallos:     ${fallos.length}`);
  console.log(`  💰 Tokens estimados: ${Math.round(totalTokens).toLocaleString()}`);
  console.log(`  💰 Costo estimado: ~$${(totalTokens / 1000000 * 0.28).toFixed(2)} USD (output)`);
  console.log(`  💰 Costo estimado: ~$${(totalTokens / 1000000 * 0.14).toFixed(2)} USD (input)`);
  console.log(`  💰 TOTAL: ~$${(totalTokens / 1000000 * 0.42).toFixed(2)} USD\n`);

  // Guardar resultados
  const outDir = resolve(process.cwd(), 'scripts/output');
  mkdirSync(outDir, { recursive: true });
  
  if (DRY_RUN) {
    writeFileSync(resolve(outDir, 'deepseek-preview.json'), JSON.stringify(resultados, null, 2), 'utf8');
    console.log('📄 Preview guardado: scripts/output/deepseek-preview.json');
    
    // Mostrar preview de la primera
    if (resultados.length > 0) {
      console.log('\n━━━ PREVIEW PRIMERA NOTICIA ━━━');
      console.log(`Título: ${resultados[0].titulo}`);
      console.log(`Palabras: ${resultados[0].palabrasAntes} → ${resultados[0].palabrasDespues}`);
      console.log(`Strong: ${resultados[0].strongs} | H2: ${resultados[0].h2s}`);
      console.log('\n─── CONTENIDO ───');
      console.log(resultados[0].contenido.substring(0, 800));
      console.log('... [truncado]');
    }
  } else {
    // Aplicar en Firestore
    console.log('📝 Aplicando correcciones en Firestore...');
    const batchWrite = db.batch();
    for (const r of resultados) {
      const ref = db.collection('noticias').doc(r.id);
      batchWrite.update(ref, { 
        contenido: r.contenido, 
        reescritaPorDeepSeek: true,
        fechaActualizacion: new Date(),
      });
    }
    await batchWrite.commit();
    console.log('✅ TODAS LAS CORRECCIONES APLICADAS');
    
    writeFileSync(resolve(outDir, 'deepseek-resultados.json'), JSON.stringify({ resultados, fallos }, null, 2), 'utf8');
    console.log('📄 Reporte guardado: scripts/output/deepseek-resultados.json');
  }

  process.exit(0);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
