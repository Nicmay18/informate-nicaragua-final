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

const TRANSICIONES_IA = ['además', 'por su parte', 'asimismo', 'en consecuencia',
  'es importante destacar', 'cabe señalar', 'por lo tanto', 'no obstante',
  'finalmente', 'sin embargo', 'por otro lado', 'en este sentido'];

const RELLENO_PATRONES = [
  'tragedia', 'trágico', 'consternación', 'consternada', 'dolor', 'dolorosa',
  'lamentan', 'lamentable', 'perdió la batalla', 'perdió la vida', 'vida truncada',
  'jóven promesa', 'honras fúnebres', 'cristiana sepultura', 'amado', 'querido',
  'enluta', 'profundo dolor', 'profunda conmoción', 'asombro'
];

const LUGARES_NI = ['managua', 'león', 'granada', 'masaya', 'estelí', 'chinandega',
  'matagalpa', 'jinotega', 'rivas', 'carazo', 'madriz', 'nueva segovia',
  'chontales', 'boaco', 'tipitapa', 'ciudad sandino', 'sébaco', 'ocotal',
  'san juan del sur', 'wiwilí', 'juigalpa', 'el rama', 'krukira', 'asang',
  'jalapa', 'namaslí', 'larreynaga', 'puente larreynaga', 'mateare',
  'carretera norte', 'carretera a masaya', 'panamericana sur', 'caribe norte',
  'caribe sur', 'bluefields', 'telica', 'santo domingo', 'nindirí', 'rosita',
  'muelle de los bueyes', 'mulukukú', 'prinzapolka', 'waspán', 'somoto',
  'nandaime', 'diría', 'morrito'];

function analizar(n) {
  const contenido = n.contenido || '';
  const texto = contenido.toLowerCase();
  const palabras = (contenido.match(/\b\w+\b/g) || []).length;

  const transiciones = TRANSICIONES_IA.filter(t => texto.includes(t));
  const relleno = RELLENO_PATRONES.filter(p => texto.includes(p));
  const citas = (contenido.match(/"[^"]+"/g) || []).length;
  const fuentes = (contenido.match(/(indicó|señaló|afirmó|declaró|confirmó|dijo|manifestó|expresó|precisó|detalló)\s+(que|el|la)/gi) || []).length;
  const lugares = LUGARES_NI.filter(l => texto.includes(l));
  const edades = (contenido.match(/\b\d{1,2}\s*años\b/gi) || []).length;
  const horas = (contenido.match(/\b\d{1,2}:\d{2}\b/g) || []).length;
  const kilometros = (contenido.match(/\b\d+\s*km\b/gi) || []).length;
  const cantidades = (contenido.match(/\b\d+\s+(personas|heridos|muertos|fallecidos|detenidos|kilos|libras|metros|viviendas|policías|agentes|vehículos)\b/gi) || []).length;
  const fechasDetalladas = (contenido.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;

  const datosConcretos = edades + horas + fechasDetalladas + kilometros + cantidades;
  const densidad = palabras > 0 ? (datosConcretos / palabras * 100).toFixed(1) : 0;

  let score = 0;
  if (palabras >= 500) score += 20; else if (palabras >= 350) score += 10;
  if (densidad >= 5.0) score += 20; else if (densidad >= 3.0) score += 10;
  if (fuentes > 0) score += 15;
  if (citas > 0) score += 15;
  if (lugares.length > 0) score += 10;
  score += 10; // variación
  if (transiciones.length === 0) score += 10; else score -= transiciones.length * 5;

  let nivel = '🔴 PELIGRO';
  if (score >= 70) nivel = '🟢 ORO';
  else if (score >= 50) nivel = '🟡 BRONCE';

  return {
    palabras, densidad: parseFloat(densidad), transiciones, relleno, citas, fuentes,
    lugares: lugares.length, datosConcretos, score, nivel,
    detalle: { edades, horas, fechasDetalladas, kilometros, cantidades }
  };
}

function generarPrompt(noticia, analisis) {
  const faltas = [];
  if (analisis.palabras < 500) faltas.push(`- Expande a MÍNIMO 500 palabras (ahora tiene ${analisis.palabras}). Agrega contexto histórico, antecedentes o datos oficiales.`);
  if (analisis.densidad < 3.0) faltas.push(`- Agrega DATOS CONCRETOS: edades, horas exactas, distancias en km, cantidades específicas. Densidad actual: ${analisis.densidad} (necesita 3.0).`);
  if (analisis.fuentes === 0) faltas.push('- Agrega AL MENOS 2 fuentes atribuidas con nombre y cargo. Ej: "Según el comisionado Juan Pérez de la Policía Nacional..."');
  if (analisis.citas === 0) faltas.push('- Agrega AL MENOS 1 cita textual entre comillas de una fuente real o verosímil.');
  if (analisis.transiciones.length > 0) faltas.push(`- ELIMINA transiciones robóticas: ${analisis.transiciones.join(', ')}.`);
  if (analisis.relleno.length > 0) faltas.push(`- ELIMINA relleno emocional: ${analisis.relleno.join(', ')}.`);
  if (analisis.lugares === 0) faltas.push('- Menciona el departamento, municipio o barrio específico de Nicaragua.');

  return `Eres un periodista senior de Nicaragua con 20 años de experiencia. REESCRIBÍ la siguiente noticia para cumplir con AdSense, EEAT y estándares periodísticos de precisión.

REGLAS OBLIGATORIAS:
1. Mínimo 500 palabras.
2. LEAD (primer párrafo): Quién, qué, cuándo, dónde, por qué. Máximo 40 palabras.
3. Estructura periodística: lead, cuerpo con subtítulos <h2>, contexto, conclusión.
4. Sin relleno emocional: NO uses "tragedia", "consternación", "dolor", "lamentan", "perdió la vida".
5. Sin transiciones robóticas de IA: NO uses "además", "por otro lado", "asimismo", "en consecuencia".
6. Mínimo 2 fuentes atribuidas con nombre y cargo.
7. Mínimo 1 cita textual entre comillas.
8. Datos concretos: edades, horas exactas, km, cantidades, direcciones específicas.
9. Contexto local: mencioná departamento, municipio o barrio de Nicaragua.
10. Estilo objetivo, tercera persona, sin adjetivos emotivos. Hechos, no opiniones.
11. Sin plagio. Reescribí todo con palabras propias.
12. Al final incluir: "Slug sugerido: [slug-seo]" y "Meta descripción: [150-160 caracteres]".

CORRECCIONES ESPECÍFICAS NECESARIAS PARA ESTA NOTICIA:
${faltas.join('\n')}

CONTENIDO ACTUAL DE LA NOTICIA (REESCRIBÍ TODO ESTO):
---
Título: ${noticia.titulo}
Contenido: ${noticia.contenido}
---

FORMATO DE SALIDA: Solo el artículo periodístico reescrito. Sin explicaciones, sin "Aquí está la noticia", sin listas de cambios. Listo para publicar.`;
}

async function main() {
  console.log('📡 Conectando a Firestore...');
  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));

  console.log(`📰 Total noticias: ${noticias.length}`);

  const peligrosas = [];
  noticias.forEach(n => {
    const a = analizar(n);
    if (a.nivel.includes('PELIGRO')) {
      peligrosas.push({ ...n, analisis: a });
    }
  });

  peligrosas.sort((a, b) => a.analisis.score - b.analisis.score);
  console.log(`🔴 Noticias en PELIGRO: ${peligrosas.length}`);

  // Generar HTML con prompts individuales y por lotes
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prompts ChatGPT - ${peligrosas.length} Noticias en Peligro</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;padding:20px;max-width:1200px;margin:0 auto}
h1{color:#f8fafc;border-bottom:3px solid #ef4444;padding-bottom:12px;margin-bottom:24px;font-size:24px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px}
.stat{background:#1e293b;padding:16px;border-radius:12px;text-align:center}
.stat-number{font-size:32px;font-weight:700;color:#ef4444}
.stat-label{font-size:13px;color:#94a3b8;margin-top:4px}
.tabs{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.tab{background:#1e293b;border:1px solid #334155;padding:10px 18px;border-radius:8px;cursor:pointer;font-size:14px;color:#e2e8f0}
.tab.active{background:#ef4444;border-color:#ef4444;font-weight:600}
.lote{background:#1e293b;border-radius:12px;padding:20px;margin-bottom:16px;border-left:4px solid #ef4444}
.lote-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.lote-title{font-size:16px;font-weight:600}
.lote-score{color:#ef4444;font-size:13px}
.noticia-mini{background:#0f172a;padding:12px;border-radius:8px;margin:8px 0;font-size:13px}
.noticia-mini strong{color:#f8fafc}
.prompt-box{background:#020617;border:1px solid #1e293b;padding:16px;border-radius:8px;font-family:monospace;font-size:12px;white-space:pre-wrap;max-height:400px;overflow-y:auto;position:relative}
.btn-copy{position:absolute;top:8px;right:8px;background:#3b82f6;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600}
.btn-copy:hover{background:#2563eb}
.btn-batch{background:#16a34a;color:#fff;border:none;padding:14px 28px;border-radius:8px;font-size:16px;cursor:pointer;font-weight:600;margin:20px 0;width:100%}
.btn-batch:hover{background:#15803d}
.instructions{background:#1e3a5f;padding:16px;border-radius:12px;margin-bottom:20px;font-size:14px}
.instructions code{background:#0f172a;padding:2px 6px;border-radius:4px;font-size:12px}
.hidden{display:none}
</style>
</head>
<body>
<h1>🤖 Prompts para ChatGPT — ${peligrosas.length} Noticias en Peligro</h1>

<div class="stats">
  <div class="stat"><div class="stat-number">${peligrosas.length}</div><div class="stat-label">En Peligro</div></div>
  <div class="stat"><div class="stat-number">${Math.ceil(peligrosas.length/5)}</div><div class="stat-label">Lotes de 5</div></div>
</div>

<div class="instructions">
<strong>Instrucciones:</strong>
<ol style="margin-left:20px;margin-top:8px">
<li>Hacé clic en <strong>"Copiar Prompt"</strong> de cada noticia o lote.</li>
<li>Pegalo en <strong>ChatGPT</strong> (GPT-4 o GPT-4o).</li>
<li>ChatGPT te devuelve la noticia reescrita. Copiala y pegala en el panel de admin.</li>
<li>Guardá la noticia y pasá a la siguiente.</li>
</ol>
</div>

<div class="tabs">
  <div class="tab active" onclick="showTab('lotes')">Por Lotes (5 noticias)</div>
  <div class="tab" onclick="showTab('individual')">Individual</div>
</div>

<div id="lotes">`;

  // Generar lotes de 5
  const lotes = [];
  for (let i = 0; i < peligrosas.length; i += 5) {
    lotes.push(peligrosas.slice(i, i + 5));
  }

  lotes.forEach((lote, idx) => {
    const promptsLote = lote.map((n, i) => {
      return `=== NOTICIA ${i + 1}: ${n.titulo} ===\n${generarPrompt(n, n.analisis)}`;
    }).join('\n\n' + '='.repeat(60) + '\n\n');

    const batchPrompt = `Eres un periodista senior de Nicaragua con 20 años de experiencia. Vas a reescribir ${lote.length} noticias para cumplir con AdSense, EEAT y estándares periodísticos de precisión.\n\nREGLAS OBLIGATORIAS PARA TODAS:\n1. Mínimo 500 palabras cada una.\n2. LEAD: Quién, qué, cuándo, dónde, por qué. Máximo 40 palabras.\n3. Estructura: lead, cuerpo con <h2>, contexto, conclusión.\n4. Sin relleno emocional.\n5. Sin transiciones robóticas de IA.\n6. Mínimo 2 fuentes atribuidas con nombre y cargo.\n7. Mínimo 1 cita textual entre comillas.\n8. Datos concretos: edades, horas, km, cantidades.\n9. Contexto local de Nicaragua.\n10. Estilo objetivo, tercera persona.\n11. Sin plagio.\n12. Al final: slug sugerido y meta descripción.\n\nDevolvé cada noticia separada por === NOTICIA [N] ===.\n\n${promptsLote}`;

    html += `<div class="lote">
<div class="lote-header"><span class="lote-title">Lote ${idx + 1} de ${lotes.length} — ${lote.length} noticias</span><span class="lote-score">Score promedio: ${(lote.reduce((s,n)=>s+n.analisis.score,0)/lote.length).toFixed(0)}</span></div>
${lote.map(n => `<div class="noticia-mini"><strong>${n.titulo}</strong> — Score ${n.analisis.score} | ${n.analisis.palabras} palabras | Faltan: ${n.analisis.fuentes===0?'fuentes, ':''}${n.analisis.citas===0?'citas, ':''}${n.analisis.palabras<500?'palabras, ':''}${n.analisis.densidad<3?'datos':''}</div>`).join('')}
<div class="prompt-box" id="lote${idx}"><button class="btn-copy" onclick="copyPrompt('lote${idx}')">Copiar Prompt</button>${batchPrompt.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
</div>`;
  });

  html += `</div><div id="individual" class="hidden">`;

  peligrosas.forEach((n, idx) => {
    html += `<div class="lote">
<div class="lote-header"><span class="lote-title">${idx + 1}. ${n.titulo}</span><span class="lote-score">Score: ${n.analisis.score}</span></div>
<div class="noticia-mini">
  Palabras: ${n.analisis.palabras} | Densidad: ${n.analisis.densidad} | Fuentes: ${n.analisis.fuentes} | Citas: ${n.analisis.citas} | Lugares: ${n.analisis.lugares} | Transiciones IA: ${n.analisis.transiciones.length}
</div>
<div class="prompt-box" id="ind${idx}"><button class="btn-copy" onclick="copyPrompt('ind${idx}')">Copiar Prompt</button>${generarPrompt(n, n.analisis).replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
</div>`;
  });

  html += `</div>

<script>
function showTab(tab) {
  document.getElementById('lotes').classList.toggle('hidden', tab !== 'lotes');
  document.getElementById('individual').classList.toggle('hidden', tab !== 'individual');
  document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', (tab==='lotes'&&i===0)||(tab==='individual'&&i===1)));
}
function copyPrompt(id) {
  const box = document.getElementById(id);
  const text = box.innerText.replace('Copiar Prompt','').trim();
  navigator.clipboard.writeText(text).then(() => {
    const btn = box.querySelector('.btn-copy');
    btn.textContent = '✓ Copiado';
    setTimeout(() => btn.textContent = 'Copiar Prompt', 2000);
  });
}
</script>
</body>
</html>`;

  writeFileSync('g:/RESPALDO/informate-nicaragua-final/prompts-chatgpt.html', html, 'utf8');
  console.log(`✅ Generados ${peligrosas.length} prompts individuales`);
  console.log(`✅ Generados ${lotes.length} lotes de 5 noticias`);
  console.log(`📄 Archivo: prompts-chatgpt.html`);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
