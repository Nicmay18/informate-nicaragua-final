/**
 * FASE 3-8 — Auditoría individual forense de los 281 artículos.
 * Relee Firestore post-backfill. Genera ficha forense por artículo con:
 * - Identidad, editorial, MENI, SEO, provenance
 * - Originalidad (A/B/C/D)
 * - Título (OK/MEJORAR/REESCRIBIR)
 * - Resumen (OK/MEJORAR/REESCRIBIR)
 * - Contenido (hecho/contexto/relleno)
 * - Contexto (score + reasons)
 * - HTML (artefactos)
 * - Perfil (detectado vs almacenado)
 * Genera FORENSIC_281_FINAL_AUDIT.json
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

function stripHtml(h) { return (h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function cw(t) { return t.split(/\s+/).filter(Boolean).length; }
function normalize(t) { return stripHtml(t).toLowerCase().replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/[ñ]/g,'n').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim(); }
function jaccard(a, b) { const sa=new Set(a.split(' ').filter(w=>w.length>3)); const sb=new Set(b.split(' ').filter(w=>w.length>3)); if(sa.size===0||sb.size===0) return 0; let i=0; for(const w of sa) if(sb.has(w)) i++; return i/(sa.size+sb.size-i); }

// --- SEO ---
function checkSEO(titulo, resumen, contenido, tags, keywords) {
  const issues = [];
  const t = titulo || '', r = resumen || '';
  if (t.length < 30) issues.push('titulo_corto');
  if (t.length > 70) issues.push('titulo_largo');
  if (/\b(increible|impactante|escalofriante|no creeras|te sorprendera|viral|shock|brutal)\b/i.test(t)) issues.push('clickbait');
  if (r.length < 50) issues.push('resumen_corto');
  if (r.length > 200) issues.push('resumen_largo');
  if (r.trim() === t.trim()) issues.push('resumen_igual_titulo');
  if (/<[^>]+>/.test(r)) issues.push('resumen_con_html');
  if (!tags || tags.length < 2) issues.push('pocos_tags');
  if (!keywords || keywords.trim().length === 0) issues.push('sin_keywords');
  if (!/<h[23]/i.test(contenido) && cw(stripHtml(contenido)) > 300) issues.push('sin_subtitulos');
  // Title ends with period
  if (/\.$/.test(t.trim())) issues.push('titulo_termina_punto');
  return { issues, score: Math.max(0, 100 - issues.length * 12) };
}

// --- Context ---
function checkContext(tp) {
  let score = 0; const reasons = [];
  if (/\b(antecedentes|contexto|marco|historia|previamente|anteriormente|en\s+\d{4})\b/i.test(tp)) { score += 25; reasons.push('antecedentes'); }
  if (/\b(por\s+que|raz[oó]n|motivo|causa|explicaci[oó]n|significa)\b/i.test(tp)) { score += 25; reasons.push('explica_porque'); }
  if (/\b(consecuencia|impacto|afectaci[oó]n|implicaci|qu[eé]\s+puede\s+pasar|qu[eé]\s+viene|despu[eé]s\s+de)\b/i.test(tp)) { score += 25; reasons.push('consecuencias'); }
  if (/\b(seg[uú]n|indic[oó]|manifest[oó]|se[nñ]al[oó]|inform[oó]|declar[oó])\b/i.test(tp)) { score += 25; reasons.push('fuentes_citadas'); }
  return { score: Math.min(100, score), reasons };
}

// --- Utility ---
function checkUtility(tp) {
  let score = 0; const reasons = [];
  if (/\b(recomendaciones?|medidas|prevenci[oó]n|consejos?|gu[ií]a|pasos?)\b/i.test(tp)) { score += 30; reasons.push('servicio'); }
  if (/\b(qu[eé]\s+hacer|c[oó]mo|d[oó]nde|cu[aá]ndo|cu[aá]nto)\b/i.test(tp)) { score += 25; reasons.push('responde_preguntas'); }
  if (/\b(telefone|correo|direcci[oó]n|sitio\s+web|p[aá]gina\s+web|redes\s+sociales)\b/i.test(tp)) { score += 20; reasons.push('datos_contacto'); }
  return { score: Math.min(100, score), reasons };
}

// --- Value ---
function checkValue(tp, palabras) {
  let score = 0; const reasons = [];
  const cifras = (tp.match(/\d+/g) || []).length;
  const fechas = (tp.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;
  const nombres = (tp.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) || []).length;
  const densidad = palabras > 0 ? (cifras + fechas + nombres) / palabras * 100 : 0;
  if (densidad > 3) { score += 30; reasons.push('alta_densidad_datos'); }
  else if (densidad > 1.5) { score += 20; reasons.push('densidad_datos_media'); }
  if (/\b(seg[uú]n|fuente|declar[oó]|inform[oó]|manifest[oó]|se[nñ]al[oó])\b/i.test(tp)) { score += 25; reasons.push('cita_fuentes'); }
  if (/Nicaragua\s+Informate|este\s+medio|nuestra\s+redacci[oó]n|este\s+portal/i.test(tp)) { score += 25; reasons.push('aporte_propio'); }
  if (palabras >= 400) { score += 20; reasons.push('longitud_adecuada'); }
  return { score: Math.min(100, score), reasons, densidad: Math.round(densidad * 10) / 10 };
}

// --- Explain ---
function checkExplain(tp) {
  let score = 0;
  if (/\b(qu[eé]\s+es|qu[eé]\s+significa|c[oó]mo\s+funciona|por\s+qu[eé])\b/i.test(tp)) score += 40;
  if (/\b(esto\s+significa|en\s+otras\s+palabras|es\s+decir)\b/i.test(tp)) score += 30;
  if (/\b(impacto|afectaci[oó]n|consecuencia|implicaci)\b/i.test(tp)) score += 30;
  return Math.min(100, score);
}

// --- Originality classification ---
function classifyOriginality(titulo, resumen, contenido, tp, maxTitleSim, maxContentSim) {
  // Check for transcription patterns
  const transcripcionPatterns = /\b(seg[uú]n\s+un\s+comunicado|en\s+un\s+comunicado|inform[oó]\s+que|manifest[oó]\s+que|se\s+realiz[oó]\s+la\s+inauguraci|se\s+llev[oó]\s+a\s+cabo)\b/i;
  const isTranscripcion = transcripcionPatterns.test(tp) && !/Nicaragua\s+Informate|este\s+medio|nuestra\s+redacci[oó]n/i.test(tp);
  const isDuplicate = maxTitleSim > 0.6 || maxContentSim > 0.5;
  
  if (isDuplicate) return { grade: 'D', reason: 'contenido_duplicado' };
  if (isTranscripcion) return { grade: 'C', reason: 'transcripcion_dependiente_fuente' };
  
  // Check for editorial work
  const hasSubtitles = /<h[23]/i.test(contenido);
  const hasContext = /\b(antecedentes|contexto|marco|historia)\b/i.test(tp);
  const hasAnalysis = /\b(impacto|consecuencia|an[aá]lisis|perspectiva|implicaci)\b/i.test(tp);
  const hasOwnVoice = /Nicaragua\s+Informate|este\s+medio|nuestra\s+redacci[oó]n/i.test(tp);
  
  if (hasSubtitles && (hasContext || hasAnalysis) && hasOwnVoice) return { grade: 'A', reason: 'original_trabajado_editorialmente' };
  if (hasSubtitles || hasContext || hasAnalysis) return { grade: 'B', reason: 'mayormente_original_necesita_pulido' };
  return { grade: 'B', reason: 'original_estructura_basica' };
}

// --- Title review ---
function reviewTitle(titulo, contenido, tp) {
  const issues = [];
  if (/\.$/.test(titulo.trim())) issues.push('termina_con_punto');
  if (titulo.length < 30) issues.push('muy_corto');
  if (titulo.length > 70) issues.push('muy_largo');
  if (/\b(increible|impactante|escalofriante|viral|shock|brutal)\b/i.test(titulo)) issues.push('clickbait');
  // Title doesn't match content
  const titleWords = normalize(titulo).split(' ').filter(w => w.length > 4);
  const contentWords = normalize(tp).split(' ').filter(w => w.length > 4);
  const overlap = titleWords.filter(w => contentWords.includes(w)).length / Math.max(titleWords.length, 1);
  if (overlap < 0.3) issues.push('no_corresponde_contenido');
  
  if (issues.length === 0) return { verdict: 'OK', issues: [] };
  if (issues.length <= 2) return { verdict: 'MEJORAR', issues };
  return { verdict: 'REESCRIBIR', issues };
}

// --- Summary review ---
function reviewSummary(resumen, titulo, tp) {
  const issues = [];
  if (resumen.trim() === titulo.trim()) issues.push('igual_que_titulo');
  if (resumen.length < 50) issues.push('muy_corto');
  if (resumen.length > 200) issues.push('muy_largo');
  if (/<[^>]+>/.test(resumen)) issues.push('contiene_html');
  // Summary doesn't mention main fact
  const summaryWords = normalize(resumen).split(' ').filter(w => w.length > 4);
  const contentWords = normalize(tp).split(' ').filter(w => w.length > 4).slice(0, 100);
  const overlap = summaryWords.filter(w => contentWords.includes(w)).length / Math.max(summaryWords.length, 1);
  if (overlap < 0.2) issues.push('no_refleja_contenido');
  
  if (issues.length === 0) return { verdict: 'OK', issues: [] };
  if (issues.length <= 1) return { verdict: 'MEJORAR', issues };
  return { verdict: 'REESCRIBIR', issues };
}

// --- Content evaluation ---
function evaluateContent(tp, palabras, contexto, valor) {
  // Detect filler
  const fillerPatterns = /\b(cabe\s+destacar|cabe\s+señalar|es\s+importante\s+mencionar|hay\s+que\s+destacar|vale\s+la\s+pena\s+mencionar)\b/gi;
  const fillerCount = (tp.match(fillerPatterns) || []).length;
  const repeatedPhrases = detectRepeatedPhrases(tp);
  
  return {
    hechoPrincipal: palabras > 0,
    contextoScore: contexto.score,
    contextoReasons: contexto.reasons,
    valorScore: valor.score,
    valorReasons: valor.reasons,
    filler: { count: fillerCount, phrases: fillerPatterns.source },
    repeatedPhrases,
    palabras,
    veredicto: palabras < 150 ? 'THIN' : (contexto.score >= 50 && valor.score >= 50 ? 'COMPLETO' : (contexto.score < 25 ? 'FALTA_CONTEXTO' : 'ACEPTABLE')),
  };
}

function detectRepeatedPhrases(tp) {
  const sentences = tp.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
  const seen = new Set();
  const repeats = [];
  for (const s of sentences) {
    const n = normalize(s);
    if (seen.has(n)) repeats.push(s.slice(0, 60));
    seen.add(n);
  }
  return { count: repeats.length, examples: repeats.slice(0, 3) };
}

// --- Profile detection ---
function detectProfile(titulo, contenido, categoria) {
  const t = (titulo + ' ' + stripHtml(contenido)).toLowerCase();
  const signals = [];
  if (/\b(volc[aá]n|ceniza|ineter|comupred|actividad\s+volc[aá]nica|sismo|terremoto|magnitud|epicentro|deslizamiento|inundaci[oó]n|sequ[ií]a|clima|lluvia|tormenta|hurac[aá]n)\b/i.test(t)) signals.push('Ambiente');
  if (/\b(turismo|turista|hotel|playa|destino\s+tur[ií]stico|reserva|naturaleza|ecol[oó]gico|avistamiento|senderismo)\b/i.test(t)) signals.push('Turismo');
  if (/\b(interpol|honduras|el\s+salvador|guatemala|costa\s+rica|panam[aá]|estados\s+unidos|onu|oea|extradici[oó]n|notificaci[oó]n\s+roja|onu|tratado\s+internacional)\b/i.test(t)) signals.push('Internacionales');
  if (/\b(captura|contrabando|detenci[oó]n|arresto|operativo|incautaci[oó]n|delito|crimen|homicidio|robo|asalto|asesinato|secuestro|extorsi[oó]n|narcot[ríi]fico)\b/i.test(t)) signals.push('Sucesos');
  if (/\b(f[uú]tbol|baseball|b[eé]isbol|liga|campeonato|selecci[oó]n|jugador|equipo|partido|gol|torneo|medalla|olimp)\b/i.test(t)) signals.push('Deportes');
  if (/\b(tecnolog[ií]a|software|app|aplicaci[oó]n|internet|redes\s+sociales|digital|ciber|inteligencia\s+artificial)\b/i.test(t)) signals.push('Tecnología');
  if (/\b(concierto|espect[aá]culo|artista|m[uú]sica|cantante|actor|pel[ií]cula|festival|cine|teatro)\b/i.test(t)) signals.push('Espectáculos');
  if (/\b(presidencial|elecciones|gobierno|asamblea|partido|pol[ií]tica|diputado|alcalde|ministro)\b/i.test(t)) signals.push('Política');
  if (/\b(econom[ií]a|inflaci[oó]n|pib|remesas|exportaci[oó]n|importaci[oó]n|banco|cr[eé]dito|pr[eé]stamo|inversi[oó]n|d[oó]lar|c[oó]rdoba)\b/i.test(t)) signals.push('Economía');
  if (/\b(salud|hospital|enfermedad|virus|vacuna|m[eé]dico|cl[ií]nica|dengue|covid|epidemia)\b/i.test(t)) signals.push('Salud');
  if (/\b(cultura|tradici[oó]n|patrimonio|historia|museo|literatura|pintura|danza|folklore|gastronom[ií]a)\b/i.test(t)) signals.push('Cultura');
  if (/\b(juez|juzgado|fiscal[ií]a|tribunal|sentencia|proceso|judicial|abogado|querella|denuncia)\b/i.test(t)) signals.push('Judicial');
  
  const profile = signals.length > 0 ? signals[0] : (categoria || 'General');
  const match = signals.some(s => s === categoria);
  return { profile, signals, storedCategoria: categoria, match };
}

// --- Provenance ---
function checkProvenance(d) {
  const has = (v) => v !== undefined && v !== null;
  return {
    meniExecuted: has(d.scoreMeni) && has(d.aprobadoMeni) && has(d.calificacionMeni),
    scoreMeni: d.scoreMeni,
    aprobadoMeni: d.aprobadoMeni,
    calificacionMeni: d.calificacionMeni,
    diagnosticoMeni: d.diagnosticoMeni,
    editorialTier: d.editorialTier,
    nivel: d.nivel,
    nivelScore: d.nivelScore,
    nivelFecha: d.nivelFecha || null,
    scoreCalidadExists: has(d.scoreCalidad),
    scoreMeniFromCalidad: has(d.scoreCalidad) && d.scoreCalidad === d.scoreMeni,
    complete: has(d.scoreMeni) && has(d.aprobadoMeni) && has(d.calificacionMeni) && has(d.diagnosticoMeni) && has(d.editorialTier) && has(d.nivel) && has(d.nivelScore),
  };
}

async function main() {
  console.log('\n=== FASE 3-8: AUDITORÍA INDIVIDUAL FORENSE DE 281 ARTÍCULOS ===\n');
  const snap = await db.collection('noticias').get();
  console.log('Total:', snap.size);

  const articles = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    const c = typeof d.contenido === 'string' ? d.contenido : String(d.contenido || '');
    articles.push({ id: doc.id, data: d, contenido: c });
  }

  // Pre-compute normalized for similarity
  const norm = articles.map(a => ({ id: a.id, tituloNorm: normalize(a.data.titulo || ''), contentNorm: normalize(a.contenido).split(' ').slice(0, 500).join(' '), titulo: a.data.titulo || '' }));

  const audits = [];
  let origA=0, origB=0, origC=0, origD=0;
  let titleOK=0, titleMejorar=0, titleReescribir=0;
  let summaryOK=0, summaryMejorar=0, summaryReescribir=0;
  let contentCompleto=0, contentAceptable=0, contentFaltaContexto=0, contentThin=0;
  let profileMatch=0, profileMismatch=0;
  let provenanceComplete=0, provenanceIncomplete=0;

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const d = a.data;
    const id = a.id;
    const tp = stripHtml(a.contenido);
    const palabras = cw(tp);

    // Similarity
    let maxTitleSim = 0, maxContentSim = 0, dupId = null, dupTitle = '';
    for (let j = 0; j < norm.length; j++) {
      if (j === i) continue;
      const ts = jaccard(norm[i].tituloNorm, norm[j].tituloNorm);
      if (ts > maxTitleSim) { maxTitleSim = ts; dupId = norm[j].id; dupTitle = norm[j].titulo; }
      const cs = jaccard(norm[i].contentNorm, norm[j].contentNorm);
      if (cs > maxContentSim) maxContentSim = cs;
    }

    // SEO
    const seo = checkSEO(d.titulo, d.resumen, a.contenido, d.tags, d.keywords);
    // Context
    const contexto = checkContext(tp);
    // Utility
    const utilidad = checkUtility(tp);
    // Value
    const valor = checkValue(tp, palabras);
    // Explain
    const explica = checkExplain(tp);
    // Originality
    const originalidad = classifyOriginality(d.titulo, d.resumen, a.contenido, tp, maxTitleSim, maxContentSim);
    if (originalidad.grade === 'A') origA++; else if (originalidad.grade === 'B') origB++; else if (originalidad.grade === 'C') origC++; else origD++;
    // Title
    const tituloReview = reviewTitle(d.titulo, a.contenido, tp);
    if (tituloReview.verdict === 'OK') titleOK++; else if (tituloReview.verdict === 'MEJORAR') titleMejorar++; else titleReescribir++;
    // Summary
    const resumenReview = reviewSummary(d.resumen, d.titulo, tp);
    if (resumenReview.verdict === 'OK') summaryOK++; else if (resumenReview.verdict === 'MEJORAR') summaryMejorar++; else summaryReescribir++;
    // Content
    const contenidoEval = evaluateContent(tp, palabras, contexto, valor);
    if (contenidoEval.veredicto === 'COMPLETO') contentCompleto++; else if (contenidoEval.veredicto === 'ACEPTABLE') contentAceptable++; else if (contenidoEval.veredicto === 'FALTA_CONTEXTO') contentFaltaContexto++; else contentThin++;
    // Profile
    const perfil = detectProfile(d.titulo, a.contenido, d.categoria);
    if (perfil.match) profileMatch++; else profileMismatch++;
    // Provenance
    const provenance = checkProvenance(d);
    if (provenance.complete) provenanceComplete++; else provenanceIncomplete++;

    // HTML check
    const htmlArtifacts = [];
    if (/<[^>]*\bid\s*=/i.test(a.contenido)) htmlArtifacts.push('id');
    if (/<[^>]*\bstyle\s*=/i.test(a.contenido)) htmlArtifacts.push('style');
    if (/<[^>]*\bclass\s*=/i.test(a.contenido)) htmlArtifacts.push('class');
    if (/<[^>]*\bdata-/i.test(a.contenido)) htmlArtifacts.push('data');
    if (/```/.test(a.contenido)) htmlArtifacts.push('codefence');
    if (/<script/i.test(a.contenido)) htmlArtifacts.push('script');

    // Estado editorial
    let estadoEditorial;
    if (d.aprobadoMeni === true && d.scoreMeni >= 95) estadoEditorial = 'PUBLICABLE_ORO';
    else if (d.aprobadoMeni === true) estadoEditorial = 'PUBLICABLE';
    else if (d.scoreMeni >= 70) estadoEditorial = 'MEJORAR';
    else if (d.scoreMena >= 50) estadoEditorial = 'ACTUALIZAR';
    else estadoEditorial = 'NO_PUBLICABLE';

    audits.push({
      // Identidad
      id, slug: d.slug || id, titulo: d.titulo || '', fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString() : '',
      // Editorial
      resumen: d.resumen || '', categoria: d.categoria || 'General', tags: d.tags || [], keywords: d.keywords || '',
      autor: d.autor || '', publicado: d.publicado !== false,
      // MENI
      scoreMeni: d.scoreMeni, aprobadoMeni: d.aprobadoMeni, calificacionMeni: d.calificacionMeni,
      diagnosticoMeni: d.diagnosticoMeni, editorialTier: d.editorialTier, nivel: d.nivel, nivelScore: d.nivelScore,
      nivelFecha: d.nivelFecha || null,
      // Métricas calculadas
      palabrasReales: palabras,
      seo, contexto, utilidad, valor, explica,
      originalidad: { ...originalidad, maxTitleSimilarity: Math.round(maxTitleSim * 100) / 100, maxContentSimilarity: Math.round(maxContentSim * 100) / 100, dupId, dupTitle },
      tituloReview, resumenReview, contenidoEval, perfil, provenance, htmlArtifacts,
      estadoEditorial,
      // Cambios realizados (vacío por ahora — se llenará si se hacen correcciones)
      cambiosRealizados: [],
    });

    if ((i + 1) % 50 === 0) console.log(`  Procesados ${i + 1}/${articles.length}...`);
  }

  // Write
  const outPath = path.join(process.cwd(), 'FORENSIC_281_FINAL_AUDIT.json');
  fs.writeFileSync(outPath, JSON.stringify(audits, null, 2), 'utf8');
  console.log('\nAudit:', outPath, '(' + audits.length + ' registros)');

  // Summary
  console.log('\n--- RESUMEN AUDITORÍA FORENSE ---');
  console.log('Total:', audits.length);
  console.log('\nOriginalidad: A=' + origA + ' B=' + origB + ' C=' + origC + ' D=' + origD);
  console.log('Títulos: OK=' + titleOK + ' MEJORAR=' + titleMejorar + ' REESCRIBIR=' + titleReescribir);
  console.log('Resúmenes: OK=' + summaryOK + ' MEJORAR=' + summaryMejorar + ' REESCRIBIR=' + summaryReescribir);
  console.log('Contenido: COMPLETO=' + contentCompleto + ' ACEPTABLE=' + contentAceptable + ' FALTA_CONTEXTO=' + contentFaltaContexto + ' THIN=' + contentThin);
  console.log('Perfiles: match=' + profileMatch + ' mismatch=' + profileMismatch);
  console.log('Provenance: complete=' + provenanceComplete + ' incomplete=' + provenanceIncomplete);

  // Top issues
  const titleIssues = audits.filter(a => a.tituloReview.issues.includes('titulo_termina_punto'));
  if (titleIssues.length > 0) {
    console.log('\n--- TÍTULOS CON PUNTO FINAL ---');
    for (const a of titleIssues.slice(0, 10)) console.log(`  ${a.id} | "${a.titulo}"`);
  }

  const transcripcion = audits.filter(a => a.originalidad.grade === 'C');
  if (transcripcion.length > 0) {
    console.log('\n--- ORIGINALIDAD C (TRANSCRIPCIÓN) ---');
    for (const a of transcripcion) console.log(`  ${a.id} | score=${a.scoreMeni} | "${a.titulo?.slice(0, 60)}"`);
  }

  const duplicates = audits.filter(a => a.originalidad.grade === 'D');
  if (duplicates.length > 0) {
    console.log('\n--- ORIGINALIDAD D (DUPLICADOS) ---');
    for (const a of duplicates) console.log(`  ${a.id} | sim=${a.originalidad.maxTitleSimilarity} | "${a.titulo?.slice(0, 50)}" vs "${a.originalidad.dupTitle?.slice(0, 50)}"`);
  }

  const profileMismatches = audits.filter(a => !a.perfil.match && a.perfil.signals.length > 0);
  if (profileMismatches.length > 0) {
    console.log('\n--- PROFILE MISMATCHES (top 15) ---');
    for (const a of profileMismatches.slice(0, 15)) console.log(`  ${a.id} | stored=${a.categoria} | detected=${a.perfil.signals.join(',')} | "${a.titulo?.slice(0, 50)}"`);
  }

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
