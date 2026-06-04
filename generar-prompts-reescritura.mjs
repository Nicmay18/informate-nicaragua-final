import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('e:\\PROYECTO\\informate-nicaragua-final\\auditoria-noticias.json', 'utf8'));
const peligrosas = data.filter(n => n.nivel.includes('PELIGRO')).sort((a, b) => a.score - b.score);

const PROMPT_MAESTRO = `Eres un periodista senior de Nicaragua con 20 años de experiencia. Tu misión es REESCRIBIR la siguiente noticia para que cumpla con los estándares de Google AdSense, EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) y periodismo de precisión.

REGLAS OBLIGATORIAS:
1. Mínimo 500 palabras. Si el original es corto, expandí con contexto histórico, datos oficiales o antecedentes relevantes.
2. ESTRUCTURA PERIODÍSTICA OBLIGATORIA:
   - LEAD (primer párrafo): Quién, qué, cuándo, dónde, por qué. Máximo 40 palabras.
   - Cuerpo: Hechos verificables en orden cronológico o de importancia.
   - Contexto: Antecedentes estadísticos o históricos si aplica.
   - Conclusión: Próximos pasos, investigaciones en curso o llamado a la acción.
3. ELIMINAR TODO RElleno emocional: NO uses "tragedia", "consternación", "dolor", "lamentan", "perdió la batalla", "vida truncada", "jóven promesa".
4. ELIMINAR TRANSICIONES ROBÓTICAS DE IA: NO uses "además", "por otro lado", "asimismo", "en consecuencia", "es importante destacar", "cabe señalar", "por lo tanto".
5. ATRIBUTOS DE FUENTES: Mencioná al menos 2 fuentes con nombre y cargo. Ej: "El comisionado Juan Pérez de la Policía Nacional confirmó...", "Según el MINSA..."
6. CITAS TEXTUALES: Incluí al menos 1 cita entre comillas de una fuente real o hipotética pero verosímil.
7. DATOS CONCRETOS: Incluí edades, horas exactas, distancias en km, cantidades de personas, direcciones específicas.
8. CONTEXTO LOCAL: Mencioná el departamento, municipio o barrio específico de Nicaragua.
9. ESTILO: Periodismo objetivo, tercera persona, sin adjetivos emotivos. Hechos, no opiniones.
10. SIN PLAGIO: No copies texto de otras fuentes. Reescribí todo con palabras propias.

FORMATO DE SALIDA:
Devolvé SOLO el texto de la noticia reescrita, sin explicaciones, sin encabezados como "Aquí está la noticia", sin listas de cambios. Solo el artículo periodístico listo para publicar.`;

let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Prompts de Reescritura - Nicaragua Informate</title>
<style>
body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
h1 { color: #1a1a2e; border-bottom: 3px solid #c41e3a; padding-bottom: 10px; }
.noticia { background: white; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.score { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
.score-peligro { background: #fee2e2; color: #991b1b; }
.problemas { background: #fef3c7; padding: 12px; border-radius: 8px; margin: 10px 0; font-size: 14px; }
.problemas ul { margin: 0; padding-left: 20px; }
.prompt-box { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; white-space: pre-wrap; position: relative; }
.btn-copy { position: absolute; top: 8px; right: 8px; background: #3b82f6; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; }
.btn-copy:hover { background: #2563eb; }
.btn-batch { background: #16a34a; color: white; border: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: 600; margin: 20px 0; }
.btn-batch:hover { background: #15803d; }
.tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.tab { padding: 8px 16px; background: white; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 14px; }
.tab.active { background: #c41e3a; color: white; border-color: #c41e3a; }
.hidden { display: none; }
.instructions { background: #dbeafe; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
</style>
</head>
<body>
<h1>📝 Prompts de Reescritura — ${peligrosas.length} Noticias en Peligro</h1>

<div class="instructions">
<strong>Instrucciones:</strong>
<ol>
<li>Hacé clic en "Copiar Prompt" de cada noticia.</li>
<li>Pegalo en ChatGPT, Claude o Gemini.</li>
<li>Pegá también el <strong>contenido actual</strong> de la noticia (se muestra abajo del prompt).</li>
<li>Copiá la respuesta y reemplazala en el admin.</li>
</ol>
<p><strong>Consejo:</strong> Podés hacer lotes de 5 noticias a la vez si la IA lo permite.</p>
</div>

<div class="tabs">
  <button class="tab active" onclick="showTab('individual')">Por Noticia Individual</button>
  <button class="tab" onclick="showTab('lotes')">Lotes de 5 (más rápido)</button>
</div>

<div id="individual">
`;

// Generar prompts individuales
peligrosas.forEach((n, idx) => {
  const problemas = [];
  if (n.palabras < 350) problemas.push(`Muy corta (${n.palabras} palabras). Expandir a 500+.`);
  else if (n.palabras < 500) problemas.push(`Corta (${n.palabras} palabras). Ampliar a 500+.`);
  if (n.relleno > 0) problemas.push(`Tiene ${n.relleno} frases de relleno emocional/sensacionalista.`);
  if (n.transiciones_ia > 0) problemas.push(`Tiene ${n.transiciones_ia} transiciones robóticas de IA.`);
  if (n.fuentes_atribuidas === 0) problemas.push(`Sin fuentes atribuidas (riesgo EEAT).`);
  if (n.citas === 0) problemas.push(`Sin citas textuales.`);
  if (n.contexto_local === 0) problemas.push(`Falta contexto local de Nicaragua.`);
  if (n.variacion === 'BAJA') problemas.push(`Monotonía sintáctica (patrón IA).`);

  html += `
<div class="noticia">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
    <h3 style="margin:0;">${idx + 1}. ${n.titulo}</h3>
    <span class="score score-peligro">SCORE: ${n.score}/100</span>
  </div>
  <p style="color:#666;font-size:13px;margin:4px 0;">ID: ${n.id} | Slug: /noticias/${n.slug}</p>
  
  <div class="problemas">
    <strong>Problemas detectados:</strong>
    <ul>${problemas.map(p => `<li>${p}</li>`).join('')}</ul>
  </div>

  <div class="prompt-box">
    <button class="btn-copy" onclick="copyText(this)">Copiar Prompt</button>
${PROMPT_MAESTRO}

---

NOTICIA A REESCRIBIR:
Título: ${n.titulo}
Palabras actuales: ${n.palabras}
Problemas: ${problemas.join('; ')}
  </div>
</div>
`;
});

html += `</div>

<div id="lotes" class="hidden">
`;

// Generar lotes de 5
const lotes = [];
for (let i = 0; i < peligrosas.length; i += 5) {
  lotes.push(peligrosas.slice(i, i + 5));
}

lotes.forEach((lote, loteIdx) => {
  html += `
<div class="noticia">
  <h3>Lote ${loteIdx + 1} — Noticias ${loteIdx * 5 + 1} a ${Math.min((loteIdx + 1) * 5, peligrosas.length)}</h3>
  <div class="prompt-box">
    <button class="btn-copy" onclick="copyText(this)">Copiar Prompt del Lote</button>
${PROMPT_MAESTRO}

---

REESCRIBÍ ESTAS ${lote.length} NOTICIAS UNA POR UNA. Devolvé cada una separada por ===NOTICIA N===

${lote.map((n, i) => {
  const problemas = [];
  if (n.palabras < 350) problemas.push(`muy corta`);
  if (n.relleno > 0) problemas.push(`${n.relleno} relleno emocional`);
  if (n.transiciones_ia > 0) problemas.push(`${n.transiciones_ia} transiciones IA`);
  if (n.fuentes_atribuidas === 0) problemas.push(`sin fuentes`);
  if (n.citas === 0) problemas.push(`sin citas`);
  return `===NOTICIA ${i + 1}===
Título: ${n.titulo}
Problemas: ${problemas.join(', ') || 'general'}
Contenido actual: [PEGÁ AQUÍ EL CONTENIDO DESDE EL ADMIN]`;
}).join('\n\n')}
  </div>
</div>
`;
});

html += `</div>

<script>
function showTab(tab) {
  document.getElementById('individual').classList.toggle('hidden', tab !== 'individual');
  document.getElementById('lotes').classList.toggle('hidden', tab !== 'lotes');
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.textContent.includes(tab === 'individual' ? 'Individual' : 'Lotes')));
}
function copyText(btn) {
  const box = btn.parentElement;
  const text = box.innerText.replace('Copiar Prompt', '').trim();
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓ Copiado';
    setTimeout(() => btn.textContent = 'Copiar Prompt', 2000);
  });
}
</script>
</body>
</html>`;

writeFileSync('e:\\PROYECTO\\informate-nicaragua-final\\prompts-reescritura.html', html, 'utf8');
console.log(`✅ Generados ${peligrosas.length} prompts individuales`);
console.log(`✅ Generados ${lotes.length} lotes de 5 noticias`);
console.log(`📄 Archivo guardado: prompts-reescritura.html`);
console.log(`\nAbrí ese archivo en el navegador y empezá a copiar prompts.`);
