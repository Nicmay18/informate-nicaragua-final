/**
 * FASE 15 — Triage y Rescate Editorial Automatizado.
 * Clasifica 281 artículos: KEEP, AUTO_FIX, EDITORIAL_ENRICHMENT, ARCHIVE, DUPLICATE, DO_NOT_PUBLISH.
 * DRY RUN — no escribe a Firestore.
 */
const fs = require('fs');
const path = require('path');
try { const e = path.join(process.cwd(), '.env.local'); if (fs.existsSync(e)) { for (const l of fs.readFileSync(e, 'utf8').split('\n')) { const l2 = l.replace(/\r$/, ''); const m = l2.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n'); } } } catch {}
const admin = require('firebase-admin');
let sa;
const saPath = 'g:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
try { sa = JSON.parse(fs.readFileSync(saPath, 'utf8')); } catch {
  let pk = process.env.FIREBASE_PRIVATE_KEY;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) { sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')); }
  else if (pk) { sa = { projectId: process.env.FIREBASE_PROJECT_ID || 'informate-instant-nicaragua', clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: pk }; }
  else { console.error('FALTA KEY'); process.exit(1); }
}
if (sa.privateKey && sa.privateKey.includes('\\n')) sa.privateKey = sa.privateKey.replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

function stripHtml(h) { return (h || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim(); }
function cw(t) { return t.split(/\s+/).filter(Boolean).length; }
function normalize(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }

function jaccardSimilarity(a, b) {
  const wa = new Set(a.split(' ').filter(w => w.length > 2));
  const wb = new Set(b.split(' ').filter(w => w.length > 2));
  if (wa.size === 0 || wb.size === 0) return 0;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / (wa.size + wb.size - inter);
}

// Obsolescence detection
const NOW = new Date('2026-08-11T23:59:59-06:00');
const EVENT_END_KEYWORDS = [
  'arrancó', 'inició', 'comenzó', 'abrió sus puertas', 'se realizó', 'se efectuó',
  'se llevó a cabo', 'celebró', 'concluyó', 'finalizó', 'terminó',
];
const PREVIEW_KEYWORDS = [
  'anuncia', 'anuncian', 'se realizara', 'se efectuara', 'se llevara a cabo',
  'arrancara', 'iniciara', 'comenzara', 'abrira', 'se prepara',
  'previsto', 'programado', 'agendado', 'proximo', 'proxima',
  'inscripciones abiertas', 'abren inscripciones',
  'abre ante', 'debuta', 'se estrena',
  'enfrentara', 'aspira',
];

function detectObsolescence(titulo, contenido, fecha, categoria) {
  const t = normalize(titulo);
  const c = normalize(contenido.slice(0, 1000));
  const fechaDate = new Date(fecha);
  const dias = Math.floor((NOW - fechaDate) / (1000 * 60 * 60 * 24));

  // Check if article is a preview/announcement of a specific event
  const isPreview = PREVIEW_KEYWORDS.some(k => t.includes(normalize(k)));
  const isAnnouncement = /anuncia|anuncian|convocatoria|inscripciones/.test(t);

  // Check if the event has a specific date in the content that's already past
  const dateMatches = contenido.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi) || [];
  const monthMap = { enero:0, febrero:1, marzo:2, abril:3, mayo:4, junio:5, julio:6, agosto:7, septiembre:8, octubre:9, noviembre:10, diciembre:11 };
  let hasPastEventDate = false;
  for (const dm of dateMatches) {
    const m = dm.match(/(\d{1,2})\s+de\s+(\w+)/i);
    if (m) {
      const day = parseInt(m[1]);
      const month = monthMap[m[2].toLowerCase()];
      if (month !== undefined) {
        const eventDate = new Date(2026, month, day);
        if (eventDate < NOW && dias > 5) hasPastEventDate = true;
      }
    }
  }

  // Handle missing fecha — use content clues
  const effectiveDias = isNaN(dias) ? 999 : dias;

  // Sports previews for events that already happened
  const isSportsPreview = categoria === 'Deportes' && isPreview && effectiveDias > 7;
  // Concert/event announcements for events that already happened
  const isEventAnnouncement = (isAnnouncement || isPreview) && effectiveDias > 14 && hasPastEventDate;

  // Specific known events that already ended
  const santoDomingoEnded = (/santo domingo 2026|juegos centroamericanos/i.test(titulo) || /santo domingo 2026|juegos centroamericanos/i.test(contenido.slice(0, 500))) && (isPreview || /abre|debuta|va por nuevas|204 representantes/i.test(titulo)) && effectiveDias > 7;
  const feriaGanaderaEnded = /feria ganadera/i.test(titulo) && /arranc.|inici.|abri./i.test(titulo) && effectiveDias > 9;
  const feriaGanaderaContentEnded = /feria ganadera agostina/i.test(contenido.slice(0, 300)) && /abri.|arranc.|inici./i.test(contenido.slice(0, 300)) && /2 al 10 de agosto|del 2 al 10/i.test(contenido) && effectiveDias > 9;
  const mundialEnded = /mundial 2026/i.test(titulo) && !/record|historico|analisis|balance|consecuencia|impacto|legado/i.test(titulo) && isPreview && effectiveDias > 30;
  const feriaViviendaEnded = /feria nacional de la vivienda/i.test(titulo) && /anuncia/i.test(titulo) && effectiveDias > 11;
  const kfcInaugurationCallEnded = /kfc/i.test(titulo) && /inaugurar|fans/i.test(titulo) && effectiveDias > 14;

  if (feriaGanaderaEnded || feriaGanaderaContentEnded) return { obsolete: true, reason: 'FERIA_GANADERA_FINALIZADA', value: 'event_ended' };
  if (santoDomingoEnded) return { obsolete: true, reason: 'JUEGOS_SANTO_DOMINGO_FINALIZADOS', value: 'event_ended' };
  if (isEventAnnouncement) return { obsolete: true, reason: 'EVENTO_ANUNCIADO_YA_PASO', value: 'event_ended' };
  if (mundialEnded) return { obsolete: true, reason: 'MUNDIAL_PREVIEW_OBSOLETO', value: 'event_ended' };
  if (feriaViviendaEnded) return { obsolete: true, reason: 'FERIA_VIVIENDA_ANUNCIO_PASADO', value: 'event_ended' };
  if (kfcInaugurationCallEnded) return { obsolete: true, reason: 'KFC_INAUGURACION_YA_REALIZADA', value: 'event_ended' };

  return { obsolete: false, reason: null, value: null };
}

// Auto-fix detection (what can be safely fixed)
function detectAutoFixNeeds(contenido, titulo) {
  const fixes = [];
  if (/<em>/.test(contenido)) fixes.push('em_tags');
  if (/<p>\s*<\/p>/.test(contenido) || /<p>\s*<p>/.test(contenido)) fixes.push('p_vacios_anidados');
  if (/<p>\s*<strong>[A-Z\s]+\/[A-Z\s]+<\/strong>\s*—/.test(contenido)) fixes.push('dateline');
  if (/\.$/.test(titulo.trim())) fixes.push('titulo_punto_final');
  if (/.*:.*:.*/.test(titulo)) fixes.push('titulo_doble_dospuntos');
  if (/&nbsp;|&amp;|&lt;|&gt;/.test(contenido)) fixes.push('entidades_html');
  if (/```/.test(contenido)) fixes.push('code_fences');
  if (/<div|<span|<section/.test(contenido)) fixes.push('wrappers_tecnicos');
  return fixes;
}

// Context need detection
function detectContextNeed(contenido, titulo, categoria) {
  const c = stripHtml(contenido);
  const palabras = cw(c);
  const needs = [];

  // Very short articles likely need context
  if (palabras < 250) needs.push('contenido_breve');

  // No subheadings
  if (!/<h[23]/i.test(contenido) && palabras > 300) needs.push('sin_subtitulos');

  // Starts with em (press release)
  if (/<p>\s*<em>/.test(contenido)) needs.push('formato_comunicado');

  // No explanation of why it matters
  if (!/por qué|importa|impacto|consecuencia|significa|implic/i.test(c) && palabras > 200) needs.push('falta_explicacion_relevancia');

  return needs;
}

async function main() {
  console.log('\n=== FASE 15: TRIAGE Y RESCATE EDITORIAL (DRY RUN) ===\n');

  const audit = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'FORENSIC_281_FINAL_AUDIT.json'), 'utf8'));
  const auditMap = {};
  for (const a of audit) auditMap[a.id] = a;

  const snap = await db.collection('noticias').get();
  const articles = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    const id = doc.id;
    const contenido = typeof d.contenido === 'string' ? d.contenido : String(d.contenido || '');
    const fecha = d.fecha?.toDate ? d.fecha.toDate().toISOString() : '';
    const a = auditMap[id] || {};
    articles.push({
      id,
      titulo: d.titulo || '',
      resumen: d.resumen || '',
      contenido,
      categoria: d.categoria || 'General',
      autor: d.autor || '',
      fecha,
      scoreMeni: d.scoreMeni,
      aprobadoMeni: d.aprobadoMeni,
      calificacionMeni: d.calificacionMeni || '',
      publicado: d.publicado !== false,
      palabrasReales: cw(stripHtml(contenido)),
      originalidad: a.originalidad?.grade || 'N/A',
      contextoScore: a.contexto?.score || 0,
      contenidoVeredicto: a.contenidoEval?.veredicto || 'N/A',
      blockingIssues: a.blockingIssues?.map(b => b.code) || [],
    });
  }

  console.log('Total artículos:', articles.length);

  // === PASO 2: DUPLICATES ===
  console.log('\n--- Detectando duplicados ---');
  const duplicates = [];
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const a = articles[i];
      const b = articles[j];
      const titleSim = jaccardSimilarity(normalize(a.titulo), normalize(b.titulo));
      if (titleSim > 0.55) {
        const contentA = normalize(stripHtml(a.contenido).slice(0, 500));
        const contentB = normalize(stripHtml(b.contenido).slice(0, 500));
        const contentSim = jaccardSimilarity(contentA, contentB);
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        const diasDiff = Math.abs(fechaA - fechaB) / (1000 * 60 * 60 * 24);

        if (contentSim > 0.45 && titleSim > 0.55) {
          duplicates.push({
            id1: a.id, id2: b.id,
            titulo1: a.titulo, titulo2: b.titulo,
            titleSim: Math.round(titleSim * 100) / 100,
            contentSim: Math.round(contentSim * 100) / 100,
            diasDiff: Math.round(diasDiff),
            veredicto: diasDiff < 2 && contentSim > 0.6 ? 'DUPLICADO_REAL' : 'NOTICIAS_SIMILARES',
          });
        }
      }
    }
  }
  console.log('Pares similares encontrados:', duplicates.length);
  duplicates.forEach(d => console.log(`  ${d.id1} vs ${d.id2} | title=${d.titleSim} | content=${d.contentSim} | dias=${d.diasDiff} | ${d.veredicto}`));

  // === PASO 3: OBSOLESCENCIA ===
  console.log('\n--- Detectando obsolescencia ---');
  const obsolete = [];
  for (const a of articles) {
    const obs = detectObsolescence(a.titulo, a.contenido, a.fecha, a.categoria);
    if (obs.obsolete) {
      obsolete.push({ ...a, obsReason: obs.reason });
      console.log(`  ARCHIVE: ${a.id} | ${a.scoreMeni} | ${obs.reason} | ${a.titulo?.slice(0, 60)}`);
    }
  }
  console.log('Obsoletos:', obsolete.length);

  // === PASO 1: CLASIFICAR TODOS ===
  console.log('\n--- Clasificando 281 artículos ---');
  const duplicateIds = new Set();
  for (const d of duplicates) {
    if (d.veredicto === 'DUPLICADO_REAL') {
      // Mark the one with lower score as duplicate
      const a1 = articles.find(a => a.id === d.id1);
      const a2 = articles.find(a => a.id === d.id2);
      if (a1 && a2) {
        if (a1.scoreMeni <= a2.scoreMeni) duplicateIds.add(d.id1);
        else duplicateIds.add(d.id2);
      }
    }
  }

  const obsoleteIds = new Set(obsolete.map(o => o.id));

  const classified = [];
  for (const a of articles) {
    let classification = 'KEEP';
    let motivo = 'aprobado_y_correcto';
    let accion = 'conservar';

    // Check duplicate first
    if (duplicateIds.has(a.id)) {
      classification = 'DUPLICATE';
      motivo = 'duplicado_real_menor_score';
      accion = 'archivar_como_duplicado';
    }
    // Check obsolete
    else if (obsoleteIds.has(a.id)) {
      classification = 'ARCHIVE';
      motivo = obsolete.find(o => o.id === a.id)?.obsReason || 'obsoleto';
      accion = 'archivar';
    }
    // Check DO_NOT_PUBLISH (score < 65)
    else if (a.scoreMeni < 65) {
      classification = 'DO_NOT_PUBLISH';
      motivo = `score_${a.scoreMeni}_insuficiente`;
      accion = 'archivar_low_editorial_value';
    }
    // Check rejected articles
    else if (!a.aprobadoMeni) {
      const autoFixes = detectAutoFixNeeds(a.contenido, a.titulo);
      const contextNeeds = detectContextNeed(a.contenido, a.titulo, a.categoria);

      if (autoFixes.length > 0 && a.scoreMeni >= 84) {
        classification = 'AUTO_FIX';
        motivo = `corregible_tecnico: ${autoFixes.join(',')}`;
        accion = 'aplicar_fix_tecnico_y_reevaluar';
      } else if (contextNeeds.length > 0) {
        classification = 'EDITORIAL_ENRICHMENT';
        motivo = `necesita_enriquecimiento: ${contextNeeds.join(',')}`;
        accion = 'intervencion_editorial_manual';
      } else {
        classification = 'EDITORIAL_ENRICHMENT';
        motivo = `rechazado_score_${a.scoreMeni}_sin_mejoras_automaticas`;
        accion = 'intervencion_editorial_manual';
      }
    }
    // Check approved articles — per PASO 9, do not modify if score >= 85 and content correct
    else {
      const autoFixes = detectAutoFixNeeds(a.contenido, a.titulo);
      // Only AUTO_FIX if there are actual HTML contamination issues (not just minor formatting)
      const hasContamination = autoFixes.some(f => f === 'wrappers_tecnicos' || f === 'code_fences');
      if (hasContamination) {
        classification = 'AUTO_FIX';
        motivo = `contaminacion_html: ${autoFixes.filter(f => f === 'wrappers_tecnicos' || f === 'code_fences').join(',')}`;
        accion = 'limpiar_html_y_conservar';
      } else {
        classification = 'KEEP';
        motivo = autoFixes.length > 0 ? `aprobado_con_issues_menores: ${autoFixes.join(',')}` : 'aprobado_y_correcto';
        accion = 'conservar';
      }
    }

    classified.push({
      id: a.id,
      titulo: a.titulo,
      scoreMeni: a.scoreMeni,
      aprobadoMeni: a.aprobadoMeni,
      fecha: a.fecha,
      categoria: a.categoria,
      perfil: a.originalidad,
      palabras: a.palabrasReales,
      motivo,
      accion,
      classification,
      blockingIssues: a.blockingIssues,
      autoFixes: detectAutoFixNeeds(a.contenido, a.titulo),
      contextNeeds: detectContextNeed(a.contenido, a.titulo, a.categoria),
    });
  }

  // Summary
  const counts = { KEEP: 0, AUTO_FIX: 0, EDITORIAL_ENRICHMENT: 0, ARCHIVE: 0, DUPLICATE: 0, DO_NOT_PUBLISH: 0 };
  for (const c of classified) counts[c.classification]++;

  console.log('\n--- RESUMEN CLASIFICACIÓN ---');
  console.log('KEEP:', counts.KEEP);
  console.log('AUTO_FIX:', counts.AUTO_FIX);
  console.log('EDITORIAL_ENRICHMENT:', counts.EDITORIAL_ENRICHMENT);
  console.log('ARCHIVE:', counts.ARCHIVE);
  console.log('DUPLICATE:', counts.DUPLICATE);
  console.log('DO_NOT_PUBLISH:', counts.DO_NOT_PUBLISH);
  console.log('TOTAL:', classified.length);

  // Write JSON
  const jsonPath = path.join(process.cwd(), 'FORENSIC_PHASE15_TRIAGE.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    summary: counts,
    duplicates,
    obsolete: obsolete.map(o => ({ id: o.id, titulo: o.titulo, scoreMeni: o.scoreMeni, reason: o.obsReason, categoria: o.categoria, fecha: o.fecha })),
    classified,
  }, null, 2), 'utf8');
  console.log('\nJSON:', jsonPath);

  // Write CSV
  const csvLines = ['id|titulo|scoreMeni|aprobadoMeni|fecha|categoria|perfil|palabras|classification|motivo|accion|blockingIssues'];
  for (const c of classified) {
    csvLines.push([c.id, '"' + (c.titulo || '').replace(/"/g, '""').slice(0, 80) + '"', c.scoreMeni, c.aprobadoMeni, c.fecha?.slice(0, 10), c.categoria, c.perfil, c.palabras, c.classification, c.motivo, c.accion, (c.blockingIssues || []).join(';')].join('|'));
  }
  fs.writeFileSync(path.join(process.cwd(), 'FORENSIC_PHASE15_TRIAGE.csv'), csvLines.join('\n'), 'utf8');
  console.log('CSV: FORENSIC_PHASE15_TRIAGE.csv');

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
