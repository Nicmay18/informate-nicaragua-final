/**
 * FORENSIC CLASSIFY INVENTORY
 * Clasifica los 286 artículos en acciones editoriales concretas.
 * No requiere conexión a Firestore. Lee FORENSIC_CURRENT_INVENTORY.json.
 */
const fs = require('fs');

const inv = JSON.parse(fs.readFileSync('FORENSIC_CURRENT_INVENTORY.json', 'utf8'));

const hoy = new Date('2026-08-13T00:00:00.000Z');

function diasDesde(fecha) {
  if (!fecha) return 999;
  const d = new Date(fecha);
  return Math.floor((hoy - d) / (1000 * 60 * 60 * 24));
}

function stripHtml(h) {
  return (h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function tieneEventoVencido(titulo, contenido, resumen) {
  const t = (titulo + ' ' + resumen + ' ' + contenido).toLowerCase();
  if (t.includes('copa 2026') || t.includes('mundial 2026') || t.includes('previo al mundial')) return 'COPA_2026';
  if (t.includes('convocatoria') && diasDesde(null) > 30) return 'CONVOCATORIA';
  if (t.includes('desfile') && diasDesde(null) > 30) return 'DESFILE';
  if (t.includes('feria') && t.includes('2026') && diasDesde(null) > 30) return 'FERIA';
  if (t.includes('agenda') || t.includes('calendario') || t.includes('programación')) return 'AGENDA';
  return null;
}

const clasificados = [];
const resumen = { KEEP: 0, FIX: 0, ENRICH: 0, REWRITE: 0, ARCHIVE: 0, DO_NOT_PUBLISH: 0, DUPLICATE: 0, HUMAN_REVIEW: 0 };

for (const a of inv.articles) {
  const palabras = a.contenidoPalabras || 0;
  const dias = diasDesde(a.fecha);
  const score = a.scoreMeni ?? null;
  const aprobado = a.aprobadoMeni === true;
  const titulo = a.titulo || '';
  const resumenTxt = a.resumen || '';
  const contenidoTxt = stripHtml(a.contenido || '');
  const textoCompleto = (titulo + ' ' + resumenTxt + ' ' + contenidoTxt).toLowerCase();

  let accion = 'HUMAN_REVIEW';
  let motivo = '';

  const vencido = tieneEventoVencido(titulo, contenidoTxt, resumenTxt);

  if (vencido && dias > 60) {
    accion = 'ARCHIVE';
    motivo = `Evento vencido o agenda caducada: ${vencido}`;
  } else if (a.archived) {
    accion = 'ARCHIVE';
    motivo = 'Ya marcado como archivado';
  } else if (score === null) {
    accion = 'HUMAN_REVIEW';
    motivo = 'Sin evaluación MENI';
  } else if (aprobado && score >= 90 && dias <= 180) {
    accion = 'KEEP';
    motivo = 'Aprobado, score >= 90, reciente';
  } else if (aprobado && score >= 90 && dias > 180) {
    accion = 'ARCHIVE';
    motivo = 'Aprobado pero obsoleto (> 180 días)';
  } else if (score >= 88 && score < 90 && !aprobado) {
    accion = 'FIX';
    motivo = 'Score 88-89: correcciones estructurales pueden aprobar';
  } else if (score >= 80 && score < 88 && !aprobado) {
    accion = 'ENRICH';
    motivo = 'Score 80-87: requiere contexto verificable';
  } else if (score >= 70 && score < 80 && !aprobado) {
    accion = 'REWRITE';
    motivo = 'Score 70-79: requiere reescritura o enriquecimiento profundo';
  } else if (score < 70 && !aprobado) {
    accion = 'DO_NOT_PUBLISH';
    motivo = 'Score < 70: no alcanza estándar mínimo';
  } else if (!aprobado && palabras < 300) {
    accion = 'REWRITE';
    motivo = 'No aprobado y menos de 300 palabras';
  } else {
    accion = 'HUMAN_REVIEW';
    motivo = 'Caso no clasificado automáticamente';
  }

  resumen[accion]++;
  clasificados.push({
    id: a.id,
    titulo: titulo.slice(0, 100),
    score,
    aprobado,
    palabras,
    dias,
    categoria: a.categoria,
    perfil: a.perfil,
    accion,
    motivo,
    vencido,
    resumenIncoherente: a.resumenIncoherente,
  });
}

const out = {
  timestamp: new Date().toISOString(),
  total: clasificados.length,
  resumen,
  articles: clasificados.sort((a, b) => a.score - b.score),
};

fs.writeFileSync('FORENSIC_CLASSIFICATION.json', JSON.stringify(out, null, 2));

console.log('=== FORENSIC CLASSIFICATION ===');
console.log('Total:', out.total);
for (const [k, v] of Object.entries(resumen)) {
  console.log(`  ${k}: ${v}`);
}
