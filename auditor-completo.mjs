import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const sa = JSON.parse(fs.readFileSync('scripts/firebase-admin-key.json'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const RELLENO_EMOCIONAL = ["consternada","consternado","conmoción","conmocionó","último adiós","ultimo adios","perdió la batalla","perdio la batalla","fatal desenlace","cristiana sepultura","honras fúnebres","honras funebres","enlutó","enluta","consternación","consternacion","ambiente de dolor","salir del asombro","familiares lamentan","lamentan la pérdida","lamentan la perdida","comunidad consternada","hecho conmocionó","conmocionó a","profundo dolor","profunda tristeza","vida truncada","jóven promesa","joven promesa","incomprensible","indignante","irresponsable","brindan apoyo","organizaciones brindan","darán el último","recibirá cristiana","perdió la vida"];
const TRANSICIONES_IA = ["además","por otro lado","en cuanto a","en relación a","por su parte","asimismo","del mismo modo","en consecuencia","en conclusión","finalmente","para finalizar","es importante destacar","cabe señalar","cabe senalar","en este sentido","al respecto","por lo tanto","de igual manera","de la misma forma","en tanto que","no obstante","sin embargo","por el contrario","en primer lugar","en segundo lugar","en tercer lugar"];
const FUENTES_GENERICAS = ["autoridades confirmaron","autoridades investigan","fuentes policiales","fuentes oficiales","testigos indicaron","testigos señalaron","se presume que","se supone que","hasta el cierre","hasta el momento","se espera que","se estima que"];
const LUGARES_NIC = ["managua","león","leon","granada","masaya","estelí","esteli","chinandega","matagalpa","jinotega","rivas","madriz","nueva segovia","boaco","chontales","raan","raccs","carazo","san juan del sur","jinotepe","diriamba","tipitapa","ciudad sandino","el sauce","la paz centro","nagarote","wiwilí","wiwili","ocotal","somoto","sébaco","sebaco","juigalpa","camoapa"];

function txtPlano(html) { return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function contarPal(t) { const p = t.match(/\b[a-záéíóúñA-ZÁÉÍÓÚÑ]+\b/g); return p ? p.length : 0; }
function detRelleno(t) { const l = t.toLowerCase(); return RELLENO_EMOCIONAL.filter(f => l.includes(f)); }
function detTrans(t) { const l = t.toLowerCase(); let tot=0; const f=[]; for (const tr of TRANSICIONES_IA){const c=l.split(tr).length-1; if(c>0){tot+=c; f.push(tr+'('+c+')');}} return {tot,f}; }
function detFuentesGen(t) { const l = t.toLowerCase(); return FUENTES_GENERICAS.filter(f => l.includes(f)); }
function detFuentesAtrib(t) {
  const patrones = [
    /[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)?,\s*(?:vocero|director|jefe|sargento|comisionado|coordinador|testigo|vecino|residente)/gi,
    /(?:afirmó|indicó|declaró|señaló|dijo|relató|manifestó|comentó)\s+[A-Z][a-záéíóúñ]+/gi,
    /(?:según|de acuerdo con|informaron|reportaron|indicaron)\s+(?:las|los)?\s*(?:autoridades|cuerpo de bomberos|bomberos|policía|testigos|vecinos|fuentes)/gi,
    /(?:testigos|vecinos|residentes|personas)\s+(?:que\s+presenciaron|en\s+la\s+zona|del\s+lugar)/gi,
    /(?:ambulancia|estación)\s+(?:de\s+)?(?:bomberos|policía)/gi
  ];
  const f = [];
  for (const p of patrones) { const m = t.match(p); if (m) f.push(...m); }
  return [...new Set(f)];
}
function detCitas(t) { const c = t.match(/["'\u201c\u201d]([^"'\u201c\u201d]{10,})["'\u201c\u201d]/g); return c ? c.filter(x => x.length > 12) : []; }
function detDatos(t) {
  return {
    edades: (t.match(/\b\d{1,2}\s+años\b/g) || []).length,
    horas: (t.match(/\b\d{1,2}:\d{2}\s*(?:horas|a\.m\.|p\.m\.|am|pm)?\b/g) || []).length,
    fechas: (t.match(/\b(?:lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/gi) || []).length,
    km: (t.match(/\b\d+(?:\.\d+)?\s*(?:km|kilómetros|kilometros)\b/gi) || []).length,
    cantidades: (t.match(/\b\d+(?:\.\d+)?\s*(?:metros|cúbicos|toneladas|personas|heridos|muertos)\b/gi) || []).length,
    lugares: (t.match(/\b(?:kilómetro|km|carretera|puente|río|rio|comunidad|barrio|municipio)\b/gi) || []).length,
    nombres: (t.match(/[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+(?:\s+[A-Z][a-záéíóúñ]+)?/g) || []).length,
  };
}
function detContexto(t) { const l = t.toLowerCase(); return [...new Set(LUGARES_NIC.filter(x => l.includes(x)))]; }

// FASE 5: datos GLOBALES verificables (para noticias internacionales/tech)
function detDatosGlobales(t) {
  return {
    porcentajes: (t.match(/\b\d+(?:[.,]\d+)?\s*(?:%|por ciento|por cien)/gi) || []).length,
    dinero: (t.match(/(?:\$|US\$|\u20ac|\u00a3)\s*\d|\b\d+(?:[.,]\d+)?\s*(?:millones|mil millones|billones|d\u00f3lares|euros|c\u00f3rdobas)/gi) || []).length,
    magnitudes: (t.match(/\b\d{1,3}(?:[.,]\d{3})+\b|\b\d+(?:[.,]\d+)?\s*(?:millones|usuarios|empleados|acciones|unidades|chips|modelos|d\u00edas|a\u00f1os|meses|horas)\b/gi) || []).length,
    anios: (t.match(/\b(?:19|20)\d{2}\b/g) || []).length,
    trimestres: (t.match(/\b(?:Q[1-4]|primer|segundo|tercer|cuarto)\s*(?:trimestre|cuatrimestre|semestre)\b/gi) || []).length,
    entidades: (t.match(/\b(?:Reuters|AP|Bloomberg|TechCrunch|The Verge|SEC|FTC|OpenAI|Apple|Google|Microsoft|Nvidia|Amazon|Meta|Tesla|FIFA|UEFA|NASA|OMS|ONU|UE|FMI)\b/g) || []).length,
  };
}
function densidadGlobal(t, datos) { const p = contarPal(t); if (!p) return 0; const tot = Object.values(datos).reduce((a,b)=>a+b,0); return Math.round((tot/p)*1000)/10; }
function densidad(t, datos) { const p = contarPal(t); if (!p) return 0; const tot = Object.values(datos).reduce((a,b)=>a+b,0); return Math.round((tot/p)*1000)/10; }
function variacion(t) {
  const or = t.split(/[.!?]+/).map(o=>o.trim()).filter(o=>o.length>5);
  if (or.length < 3) return 'BAJA';
  const len = or.map(o => o.split(/\s+/).length);
  const desv = Math.max(...len) - Math.min(...len);
  if (desv < 5) return 'BAJA'; if (desv < 10) return 'MEDIA'; return 'ALTA';
}

function auditar(html, titulo, categoria) {
  const t = txtPlano(html);
  const palabras = contarPal(t);
  const relleno = detRelleno(t);
  const tr = detTrans(t);
  const fGen = detFuentesGen(t);
  const fAtrib = detFuentesAtrib(t);
  const citas = detCitas(t);
  const datos = detDatos(t);
  const datosG = detDatosGlobales(t);
  const varOr = variacion(t);
  const lugares = detContexto(t);

  // FASE 5: criterio category-aware ADITIVO (toma el mejor de local o global, nunca resta)
  const catNorm = (categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const esLocal = catNorm === 'sucesos' || catNorm === 'nacionales';

  // Densidad: el mejor entre datos locales y datos globales verificables
  const dens = Math.max(densidad(t, datos), densidadGlobal(t, datosG));
  // "Contexto": el mejor entre lugares de Nicaragua y entidades/datos globales
  const globalCtx = datosG.entidades + datosG.porcentajes + datosG.dinero + datosG.trimestres;
  const contextoCount = Math.max(lugares.length, globalCtx);

  // SCORING category-aware con UMBRALES PERIODÍSTICOS REALISTAS.
  // Las instituciones NIC no dan declaraciones => fuentes no obligatorias.
  // Densidad 2 = excelente para noticia real; contexto 1 = suficiente.
  let score = 0;
  if (palabras >= 450) score += 20; else if (palabras >= 350) score += 14; else if (palabras >= 250) score += 7;
  if (!relleno.length) score += 20; else if (relleno.length <= 2) score += 8;
  if (tr.tot === 0) score += 20; else if (tr.tot <= 2) score += 8;
  if (dens >= 2) score += 15; else if (dens >= 1) score += 11; else if (dens > 0) score += 6;
  if (varOr === 'ALTA') score += 10; else if (varOr === 'MEDIA') score += 6;
  if (contextoCount >= 1) score += 10; else score += 0;
  // BONUS opcional: fuentes atribuidas/institucionales o citas
  if (fAtrib.length >= 1 || citas.length >= 1) score += 5;
  if (score > 100) score = 100;

  let nivel = 'PELIGRO';
  if (score >= 90) nivel = 'ORO'; else if (score >= 75) nivel = 'BRONCE';

  return { palabras, score, nivel, densidad: dens, relleno, transiciones: tr, fGen, fAtrib, citas: citas.length, varOr, lugares, esLocal, contextoCount };
}

(async () => {
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').get();
  const resultados = [];
  snap.forEach(d => {
    const data = d.data();
    const a = auditar(data.contenido || '', data.titulo || '', data.categoria || '');
    let fechaStr = '';
    if (data.fecha) {
      if (typeof data.fecha === 'string') fechaStr = data.fecha.split('T')[0];
      else if (data.fecha.toDate) fechaStr = data.fecha.toDate().toISOString().split('T')[0];
      else if (data.fecha._seconds) fechaStr = new Date(data.fecha._seconds * 1000).toISOString().split('T')[0];
    }
    resultados.push({ id: d.id, titulo: data.titulo, categoria: data.categoria, fecha: fechaStr, ...a });
  });

  // Ordenar por score ascendente (peores primero)
  resultados.sort((a, b) => a.score - b.score);

  // Guardar JSON completo
  fs.writeFileSync('auditor-resultado.json', JSON.stringify(resultados, null, 2));

  // Generar reporte HTML estático autocontenido (abre sin Firebase / sin CORS)
  generarHTML(resultados);

  // Resumen
  const oro = resultados.filter(r => r.nivel === 'ORO').length;
  const bronce = resultados.filter(r => r.nivel === 'BRONCE').length;
  const peligro = resultados.filter(r => r.nivel === 'PELIGRO').length;

  console.log('═══════════════════════════════════════════════════');
  console.log('AUDITOR DE CALIDAD - RESUMEN GENERAL');
  console.log('═══════════════════════════════════════════════════');
  console.log('Total noticias:', resultados.length);
  console.log('🟢 ORO (90+):    ', oro, '(' + (oro/resultados.length*100).toFixed(0) + '%)');
  console.log('🟡 BRONCE (80-89):', bronce, '(' + (bronce/resultados.length*100).toFixed(0) + '%)');
  console.log('🔴 PELIGRO (<80): ', peligro, '(' + (peligro/resultados.length*100).toFixed(0) + '%)');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Mostrar lote (de 10 en 10) según argumento
  const lote = parseInt(process.argv[2] || '1');
  const inicio = (lote - 1) * 10;
  const fin = Math.min(inicio + 10, resultados.length);

  console.log(`>>> LOTE ${lote} (noticias ${inicio + 1} a ${fin} de ${resultados.length}) - PEORES PRIMERO <<<`);
  console.log('');

  for (let i = inicio; i < fin; i++) {
    const r = resultados[i];
    const emoji = r.nivel === 'ORO' ? '🟢' : r.nivel === 'BRONCE' ? '🟡' : '🔴';
    console.log(`${i+1}. ${emoji} [${r.score}/100] ${r.nivel} | ${r.categoria} | ${(r.titulo||'').substring(0,55)}`);
    console.log(`   Palabras: ${r.palabras} | Densidad: ${r.densidad} | Variación: ${r.varOr} | Fuentes: ${r.fAtrib.length} | Citas: ${r.citas} | Contexto: ${r.lugares.length}`);
    if (r.relleno.length) console.log(`   🎭 RELLENO: ${r.relleno.join(', ')}`);
    if (r.transiciones.tot) console.log(`   🤖 TRANSICIONES IA: ${r.transiciones.f.join(', ')}`);
    if (r.fGen.length) console.log(`   📵 FUENTES GENÉRICAS: ${r.fGen.join(', ')}`);
    if (r.fAtrib.length === 0) console.log(`   ⚠️  SIN FUENTES ATRIBUIDAS (nombres + cargos)`);
    console.log('');
  }

  console.log('───────────────────────────────────────────────────');
  console.log(`Para ver el siguiente lote: node auditor-completo.mjs ${lote + 1}`);
  console.log(`Total de lotes: ${Math.ceil(resultados.length / 10)}`);
  console.log('');
  console.log('📄 Reporte HTML generado: reporte-auditor.html (ábrelo en el navegador)');
  process.exit(0);
})();

function generarHTML(resultados) {
  const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const oro = resultados.filter(r => r.nivel === 'ORO').length;
  const bronce = resultados.filter(r => r.nivel === 'BRONCE').length;
  const peligro = resultados.filter(r => r.nivel === 'PELIGRO').length;
  const total = resultados.length;

  const filas = resultados.map((r, i) => {
    const badge = r.nivel === 'ORO' ? 'oro' : r.nivel === 'BRONCE' ? 'bronce' : 'peligro';
    const probs = [];
    if (r.relleno.length) probs.push('🎭 Relleno: ' + r.relleno.map(esc).join(', '));
    if (r.transiciones.tot) probs.push('🤖 Transiciones IA: ' + r.transiciones.f.map(esc).join(', '));
    if (r.fGen.length) probs.push('📵 Genéricas: ' + r.fGen.map(esc).join(', '));
    if (r.fAtrib.length === 0) probs.push('⚠️ Sin fuentes atribuidas');
    const detalle = probs.length ? `<tr class="det"><td colspan="11">${probs.join(' &nbsp;·&nbsp; ')}</td></tr>` : '';
    const ok = v => `<span class="ok">${v}</span>`, bad = v => `<span class="bad">${v}</span>`, wn = v => `<span class="wn">${v}</span>`;
    return `<tr>
      <td>${i+1}</td>
      <td><span class="b b-${badge}">${r.nivel}</span></td>
      <td><b style="color:${r.score>=90?'#10b981':r.score>=75?'#f59e0b':'#ef4444'}">${r.score}</b></td>
      <td><span class="cat">${esc(r.categoria)}</span></td>
      <td class="tit" title="${esc(r.titulo)}">${esc((r.titulo||'').substring(0,60))}</td>
      <td>${r.palabras>=500?ok(r.palabras):r.palabras>=350?wn(r.palabras):bad(r.palabras)}</td>
      <td>${r.relleno.length===0?ok('0'):bad(r.relleno.length)}</td>
      <td>${r.transiciones.tot===0?ok('0'):bad(r.transiciones.tot)}</td>
      <td>${r.densidad>=3?ok(r.densidad):r.densidad>=1?wn(r.densidad):bad(r.densidad)}</td>
      <td>${r.varOr==='ALTA'?ok('A'):r.varOr==='MEDIA'?wn('M'):bad('B')}</td>
      <td>${r.contextoCount>=2?ok(r.contextoCount):r.contextoCount>=1?wn(r.contextoCount):bad('0')}</td>
    </tr>${detalle}`;
  }).join('\n');

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Auditor de Calidad - Reporte</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:20px}
h1{text-align:center;margin-bottom:6px}
.sub{text-align:center;color:#94a3b8;margin-bottom:20px;font-size:.85rem}
.stats{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:18px}
.s{background:#1e293b;border-radius:10px;padding:14px 22px;text-align:center;min-width:110px}
.s .n{font-size:1.9rem;font-weight:700}.s .l{font-size:.7rem;text-transform:uppercase;color:#94a3b8}
.s.oro .n{color:#fbbf24}.s.bronce .n{color:#f59e0b}.s.peligro .n{color:#ef4444}
.bar{height:18px;background:#334155;border-radius:9px;overflow:hidden;display:flex;max-width:900px;margin:0 auto 6px}
.bar div{height:100%}.seg-oro{background:#fbbf24}.seg-bronce{background:#f59e0b}.seg-peligro{background:#ef4444}
.flt{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:16px 0}
.flt button{background:#334155;border:none;color:#e2e8f0;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:.8rem}
.flt button.on,.flt button:hover{background:#6366f1}
table{width:100%;border-collapse:collapse;background:#1e293b;border-radius:10px;overflow:hidden;max-width:1200px;margin:0 auto}
th{background:#334155;padding:10px 8px;text-align:left;font-size:.7rem;text-transform:uppercase;color:#94a3b8}
td{padding:8px;border-bottom:1px solid #2d3748;font-size:.82rem}
tr:hover{background:#2d3748}
.b{padding:3px 8px;border-radius:4px;font-size:.7rem;font-weight:700}
.b-oro{background:#fbbf24;color:#000}.b-bronce{background:#f59e0b;color:#000}.b-peligro{background:#ef4444;color:#fff}
.cat{background:#475569;padding:2px 7px;border-radius:4px;font-size:.7rem}
.tit{max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ok{color:#10b981;font-weight:700}.bad{color:#ef4444;font-weight:700}.wn{color:#f59e0b;font-weight:700}
.det{background:#0f172a;font-size:.72rem;color:#fca5a5}.det td{padding:6px 14px}
</style></head><body>
<h1>🕵️ Auditor de Calidad Periodística</h1>
<div class="sub">Generado: ${new Date().toLocaleString('es-NI')} · AdSense · Discover · Google News · SEO · E-E-A-T · Anti-IA</div>
<div class="stats">
  <div class="s"><div class="n">${total}</div><div class="l">Total</div></div>
  <div class="s oro"><div class="n">${oro}</div><div class="l">ORO 90+</div></div>
  <div class="s bronce"><div class="n">${bronce}</div><div class="l">BRONCE 75-89</div></div>
  <div class="s peligro"><div class="n">${peligro}</div><div class="l">PELIGRO &lt;75</div></div>
</div>
<div class="bar">
  <div class="seg-oro" style="width:${(oro/total*100).toFixed(1)}%"></div>
  <div class="seg-bronce" style="width:${(bronce/total*100).toFixed(1)}%"></div>
  <div class="seg-peligro" style="width:${(peligro/total*100).toFixed(1)}%"></div>
</div>
<div class="flt">
  <button class="on" data-f="todos">Todos (${total})</button>
  <button data-f="ORO">🟢 ORO (${oro})</button>
  <button data-f="BRONCE">🟡 BRONCE (${bronce})</button>
  <button data-f="PELIGRO">🔴 PELIGRO (${peligro})</button>
</div>
<table><thead><tr>
<th>#</th><th>Nivel</th><th>Score</th><th>Cat</th><th>Título</th><th>Pal</th>
<th title="Relleno">🎭</th><th title="Transiciones IA">🤖</th><th title="Densidad">📊</th><th title="Variación">📏</th><th title="Contexto">📍</th>
</tr></thead><tbody>
${filas}
</tbody></table>
<script>
document.querySelectorAll('.flt button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.flt button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');
  const f=b.dataset.f;
  document.querySelectorAll('tbody tr').forEach(tr=>{
    if(tr.classList.contains('det')){tr.style.display='';return;}
    const badge=tr.querySelector('.b');
    const show=f==='todos'||(badge&&badge.textContent===f);
    tr.style.display=show?'':'none';
    const next=tr.nextElementSibling;
    if(next&&next.classList.contains('det'))next.style.display=show?'':'none';
  });
});
</script>
</body></html>`;

  fs.writeFileSync('reporte-auditor.html', html);
}
