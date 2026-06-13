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

const SYSTEM_PROMPT = `Eres un periodista senior de Nicaragua Informate con 20 años de experiencia. Tu estilo es BBC/CNN: frío, preciso, con datos concretos y cero relleno emocional.

REGLAS ESTRICTAS PARA APROBAR ADSENSE:
1. Lead PERFECTO: Primera oración con Quién, Qué, Cuándo, Dónde exactos.
2. MÍNIMO 500 palabras. Si el texto original es corto, EXPANDE con contexto real: antecedentes históricos, cifras comparativas, implicaciones legales/sociales, o datos oficiales. NUNCA resumas.
3. Párrafos de 2-3 oraciones máximo.
4. Al menos 2 subtítulos <h2> concretos (máx 6 palabras). Ej: "Cifras del accidente", "Quién era la víctima", "Investigaciones en curso". PROHIBIDO: "Contexto", "Más detalles", "Desarrollo de la noticia".
5. Al menos 15 <strong> obligatorios en: nombres completos, edades, fechas exactas, horas, direcciones específicas, placas de vehículos, montos en córdobas/dólares, nombres de instituciones, kilómetros, barrios.
6. Al menos 2 <blockquote> con fuentes atribuidas. Ejemplo: <blockquote><p>"El vehículo no contaba con dispositivos de seguridad", señaló la Policía Nacional en informe preliminar.</p></blockquote>
7. APORTA VALOR: Incluye cifras comparativas ("en 2025 ocurrieron X casos similares"), contexto legal ("la Ley 431 establece..."), o implicaciones prácticas. Esto es lo que AdSense valora.
8. Tono periodístico: Frío con los datos. El hecho ya es grave; NO uses adjetivos emocionales. No inventes datos.
9. FRASES PROHIBIDAS (nunca): "En este contexto", "por su parte", "es importante destacar", "cabe señalar", "asimismo", "en conclusión", "sin duda", "Las autoridades investigan", "La comunidad se encuentra consternada", "Esta situación ha generado preocupación", "Un hecho que ha conmocionado", "Se exhorta a la población".
10. NO inventes nombres de personas, fechas ni cifras. Si no conoces un dato, no lo menciones o usa "se desconoce".
11. NO agregues firma al final.
12. Formato HTML limpio. Solo <p> y <h2>. Sin listas vacías. Sin blockquotes vacíos.

Responde SOLO con el HTML del artículo, sin explicaciones.`;

// ─── FUNCIONES ───────────────────────────────────────────────────

function limpiarHTML(t) { return (t || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function contarPalabras(t) { return limpiarHTML(t).split(/\s+/).filter(Boolean).length; }

async function reescribirNoticia(titulo, contenido) {
  const textoPlano = limpiarHTML(contenido);
  const palabras = contarPalabras(contenido);
  
  const prompt = `REESCRIBE esta noticia como un periodista de BBC/CNN. NO la resumas — EXPÁNDELA a mínimo 500 palabras.

TÍTULO: ${titulo}
PALABRAS ACTUALES: ${palabras}
TEXTO ORIGINAL:
${textoPlano.substring(0, 2500)}

INSTRUCCIONES OBLIGATORIAS:
- Lead: primera oración con Quién, Qué, Cuándo, Dónde exactos
- EXPANDE: Si el texto tiene menos de 500 palabras, agrega contexto real (antecedentes, cifras comparativas, implicaciones legales, datos oficiales). NUNCA lo acortes.
- 15+ <strong>: nombres, edades, fechas, horas, direcciones, placas, montos, instituciones
- 2+ <h2>: subtítulos concretos, máx 6 palabras
- 2+ <blockquote>: con fuentes atribuidas (ej: "señaló la Policía Nacional")
- APORTA VALOR: Incluye al menos UN dato de contexto (estadística histórica, marco legal, comparación con años anteriores, o consecuencia práctica)
- Tono: frío, preciso, sin adjetivos emocionales
- PROHIBIDO: "en conclusión", "es importante destacar", "las autoridades investigan", "la comunidad se encuentra consternada"
- NO inventes nombres de personas, fechas ni cifras

Responde SOLO el HTML del artículo completo.`;

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
