import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { writeFileSync } from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyDVsqRGr7dtdi5ecO14THIdbnEzZKOJxcA",
  authDomain: "informate-instant-nicaragua.firebaseapp.com",
  projectId: "informate-instant-nicaragua",
  storageBucket: "informate-instant-nicaragua.firebasestorage.app",
  messagingSenderId: "24988088146",
  appId: "1:24988088146:web:d26a207508da055668ec8b",
  measurementId: "G-W1B5J61WEP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── PALABRAS PROHIBIDAS (relleno emocional / IA) ───
const TRANSICIONES_IA = ['además', 'por su parte', 'asimismo', 'en consecuencia',
  'es importante destacar', 'cabe señalar', 'por lo tanto', 'no obstante',
  'finalmente', 'sin embargo', 'por otro lado', 'en este sentido', 'en primer lugar',
  'en segundo lugar', 'dicho esto', 'de igual manera', 'en tanto que'];

const RELLENO_PATRONES = [
  'tragedia', 'trágico', 'trágica', 'consternación', 'consternada', 'consternado',
  'dolor', 'dolorosa', 'doloroso', 'lamentan', 'lamentable', 'lamentablemente',
  'perdió la batalla', 'perdió la vida', 'vida truncada', 'jóven promesa',
  'honras fúnebres', 'cristiana sepultura', 'amado', 'querido', 'enluta',
  'profundo dolor', 'profunda conmoción', 'asombro', 'indignación', 'escandalizado',
  'coraje', 'rabia', 'impotencia', 'tristeza', 'devastado', 'desolado'
];

// ─── FUNCIÓN DE ANÁLISIS (solo diagnóstico, no scoring) ───
function analizar(n) {
  const contenido = n.contenido || n.cuerpo || '';
  const texto = contenido.toLowerCase();
  const palabras = (contenido.match(/\b\w+\b/g) || []).length;

  const transiciones = TRANSICIONES_IA.filter(t => texto.includes(t));
  const relleno = RELLENO_PATRONES.filter(p => texto.includes(p));
  const citas = (contenido.match(/"[^"]+"/g) || []).length;
  const fuentes = (contenido.match(/(indicó|señaló|afirmó|declaró|confirmó|dijo|manifestó|expresó|precisó|detalló|explicó|agregó)\s+(que|el|la)/gi) || []).length;
  const edades = (contenido.match(/\b\d{1,2}\s*años\b/gi) || []).length;
  const horas = (contenido.match(/\b\d{1,2}:\d{2}\b/g) || []).length;
  const fechasDetalladas = (contenido.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;

  return {
    palabras,
    transiciones,
    relleno,
    citas,
    fuentes,
    edades,
    horas,
    fechasDetalladas
  };
}

// ─── GENERADOR DE PROMPT SEGURO (sin inventar datos) ───
function generarPrompt(noticia, analisis) {
  const faltas = [];
  
  // Solo sugerimos, no exigimos inventar
  if (analisis.palabras < 300) faltas.push(`- Expande el cuerpo a 300-500 palabras usando contexto de dominio público (geografía local, antecedentes del evento, datos históricos verificables). Actual: ${analisis.palabras} palabras.`);
  if (analisis.transiciones.length > 0) faltas.push(`- ELIMINA transiciones robóticas: ${analisis.transiciones.join(', ')}.`);
  if (analisis.relleno.length > 0) faltas.push(`- ELIMINA relleno emocional: ${analisis.relleno.join(', ')}.`);
  if (analisis.edades === 0 && /murió|falleció|muere|homicidio|accidente/i.test(noticia.titulo)) {
    faltas.push('- Si la edad de la víctima está mencionada en el texto original, incluila en el lead. Si NO está, NO la inventes.');
  }

  return `Eres un editor senior de un medio digital nicaragüense. REESCRIBÍ la siguiente noticia para elevarla a nivel ORO (máxima calidad periodística).

REGLAS ABSOLUTAS (INQUEBRANTABLES):
1. NO INVENTES NADA: nombres, edades, cargos, instituciones, citas, cifras o lugares que no estén en el texto original.
2. NO ALTERES EL SENTIDO: los mismos hechos, el mismo ángulo, las mismas víctimas/victimarios.
3. NO AGREGUES OPINIÓN: tono informativo, neutral, tercera persona.
4. NO USES RELLENO EMOCIONAL: prohibido "tragedia", "consternación", "dolor", "lamentable", "perdió la vida". Usá "falleció", "murió", "occiso", "víctima".
5. NO USES TRANSICIONES ROBÓTICAS DE IA: prohibido "además", "por otro lado", "asimismo", "en consecuencia", "sin embargo".
6. Título: máximo 12 palabras, específico (qué, quién, dónde).
7. Lead (resumen): 1 párrafo, 30-45 palabras. Responde: ¿Qué pasó? ¿Dónde? ¿Cuándo? ¿Quién?
8. Cuerpo: párrafos de 2-4 líneas. Orden cronológico o por relevancia. Elimina redundancias.
9. Si hay fuentes reales en el original (nombres, cargos), mantenelas. Si NO hay, NO inventes.
10. Si hay citas reales en el original, mantenelas. Si NO hay, NO inventes.
11. Contexto local: si el evento ocurre en un lugar de Nicaragua, podés mencionar el departamento/municipio de dominio público.
12. Slug sugerido y meta descripción al final.

CORRECCIONES ESPECÍFICAS PARA ESTA NOTICIA:
${faltas.length > 0 ? faltas.join('\n') : '- Pulir redacción, ortografía y estructura periodística sin agregar datos inexistentes.'}

CONTENIDO ACTUAL (REESCRIBÍ TODO ESTO MANTENIENDO LOS MISMOS HECHOS):
---
Título: ${noticia.titulo}
Resumen: ${noticia.resumen || 'No tiene'}
Contenido: ${noticia.contenido || noticia.cuerpo || ''}
---

FORMATO DE SALIDA:
Devolvé SOLO el artículo reescrito con este formato exacto:

TÍTULO: [título reescrito]
RESUMEN: [resumen reescrito]
CUERPO: [cuerpo reescrito]
NIVEL: 🟠 ORO
SCORE: 95
SLUG: [slug-seo]
META: [meta descripción 150-160 caracteres]

Sin explicaciones, sin "Aquí está la noticia", sin listas de cambios. Listo para publicar.`;
}

// ─── MAIN ───
async function main() {
  console.log('📡 Conectando a Firestore...');
  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));

  console.log(`📰 Total noticias: ${noticias.length}`);

  // Procesar TODAS las que NO estén en ORO
  const aProcesar = noticias.filter(n => !n.nivel?.includes('ORO'));
  console.log(`🔴🟡 A procesar (PELIGRO + BRONCE): ${aProcesar.length}`);

  // Generar HTML con prompts por lotes de 5
  const lotes = [];
  for (let i = 0; i < aProcesar.length; i += 5) {
    lotes.push(aProcesar.slice(i, i + 5));
  }

  let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prompts ORO - ${aProcesar.length} Noticias</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;padding:20px;max-width:1200px;margin:0 auto}
h1{color:#f8fafc;border-bottom:3px solid #f59e0b;padding-bottom:12px;margin-bottom:24px;font-size:24px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px}
.stat{background:#1e293b;padding:16px;border-radius:12px;text-align:center}
.stat-number{font-size:32px;font-weight:700;color:#f59e0b}
.stat-label{font-size:13px;color:#94a3b8;margin-top:4px}
.lote{background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;border-left:4px solid #f59e0b}
.lote-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.lote-title{font-size:16px;font-weight:600}
.noticia-mini{background:#0f172a;padding:12px;border-radius:8px;margin:8px 0;font-size:13px}
.noticia-mini strong{color:#f8fafc}
.prompt-box{background:#020617;border:1px solid #1e293b;padding:16px;border-radius:8px;font-family:monospace;font-size:12px;white-space:pre-wrap;max-height:500px;overflow-y:auto;position:relative}
.btn-copy{position:absolute;top:8px;right:8px;background:#f59e0b;color:#0f172a;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700}
.btn-copy:hover{background:#d97706}
.warning{background:#7f1d1d;color:#fecaca;padding:16px;border-radius:12px;margin-bottom:20px;font-size:14px}
.warning strong{color:#fff}
</style>
</head>
<body>
<h1>🟠 Prompts para ORO — ${aProcesar.length} Noticias</h1>

<div class="warning">
<strong>⚠️ Regla de Oro:</strong> Si ChatGPT inventa nombres, edades, cargos o citas que NO están en el texto original, DESCARTÁ esa respuesta y pedile que rehaga la noticia SIN inventar datos. La veracidad es prioridad absoluta.
</div>

<div class="stats">
  <div class="stat"><div class="stat-number">${aProcesar.length}</div><div class="stat-label">A Procesar</div></div>
  <div class="stat"><div class="stat-number">${lotes.length}</div><div class="stat-label">Lotes de 5</div></div>
</div>`;

  lotes.forEach((lote, idx) => {
    const promptsLote = lote.map((n, i) => {
      return `=== NOTICIA ${i + 1} ===\nID: ${n.id}\n${generarPrompt(n, analizar(n))}`;
    }).join('\n\n' + '='.repeat(60) + '\n\n');

    const batchPrompt = `Vas a reescribir ${lote.length} noticias nicaragüenses al nivel ORO (máxima calidad). Regla absoluta: NO INVENTES datos que no estén en el texto original. Devolvé cada noticia separada por === NOTICIA [N] ===.\n\n${promptsLote}`;

    html += `<div class="lote">
<div class="lote-header"><span class="lote-title">Lote ${idx + 1} de ${lotes.length} — ${lote.length} noticias</span></div>
${lote.map(n => `<div class="noticia-mini"><strong>${n.titulo}</strong> — ID: ${n.id}</div>`).join('')}
<div class="prompt-box" id="lote${idx}"><button class="btn-copy" onclick="copyPrompt('lote${idx}')">Copiar Prompt</button>${batchPrompt.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
</div>`;
  });

  html += `<script>
function copyPrompt(id) {
  const box = document.getElementById(id);
  const text = box.innerText.replace('Copiar Prompt','').trim();
  navigator.clipboard.writeText(text).then(() => {
    const btn = box.querySelector('.btn-copy');
    btn.textContent = '✓ Copiado';
    setTimeout(() => btn.textContent = 'Copiar Prompt', 2000);
  });
}
</script></body></html>`;

  writeFileSync('g:/RESPALDO/informate-nicaragua-final/prompts-oro.html', html, 'utf8');
  console.log(`✅ Generados ${aProcesar.length} prompts`);
  console.log(`✅ ${lotes.length} lotes de 5 noticias`);
  console.log(`📄 Archivo: prompts-oro.html`);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
