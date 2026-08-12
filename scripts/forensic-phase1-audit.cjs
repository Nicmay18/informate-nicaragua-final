/**
 * FASE 1 — Auditoría individual de los 281 artículos.
 * Lee FORENSIC_281_BEFORE.json y produce FORENSIC_281_AUDIT.json
 * Para cada artículo calcula: originalidad, SEO, contexto, valor, utilidad,
 * explica, perfil, thin type, estado editorial, duplicados.
 * NO modifica Firestore.
 */
const fs = require('fs');
const path = require('path');

function stripHtml(h) { return (h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function cw(t) { return t.split(/\s+/).filter(Boolean).length; }

// Normalized text for similarity comparison
function normalize(t) {
  return stripHtml(t).toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Jaccard similarity on word sets
function jaccard(a, b) {
  const sa = new Set(a.split(' ').filter(w => w.length > 3));
  const sb = new Set(b.split(' ').filter(w => w.length > 3));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  return inter / (sa.size + sb.size - inter);
}

// Title similarity
function titleSim(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na.length < 5 || nb.length < 5) return 0;
  return jaccard(na, nb);
}

// Content similarity (first 500 words for performance)
function contentSim(a, b) {
  const na = normalize(a).split(' ').slice(0, 500).join(' ');
  const nb = normalize(b).split(' ').slice(0, 500).join(' ');
  return jaccard(na, nb);
}

// SEO checks
function checkSEO(titulo, resumen, contenido, tags, keywords) {
  const issues = [];
  const t = titulo || '';
  const r = resumen || '';
  // Title length
  if (t.length < 30) issues.push('titulo_corto');
  if (t.length > 70) issues.push('titulo_largo');
  // Clickbait patterns
  const clickbait = /\b(increible|impactante|escalofriante|no creeras|te sorprendera|viral|shock|brutal)\b/i;
  if (clickbait.test(t)) issues.push('clickbait');
  // Resumen length
  if (r.length < 50) issues.push('resumen_corto');
  if (r.length > 200) issues.push('resumen_largo');
  // Resumen equals title
  if (r.trim() === t.trim()) issues.push('resumen_igual_titulo');
  // HTML in resumen
  if (/<[^>]+>/.test(r)) issues.push('resumen_con_html');
  // Tags
  if (!tags || tags.length < 2) issues.push('pocos_tags');
  // Keywords
  if (!keywords || keywords.trim().length === 0) issues.push('sin_keywords');
  // Subtitles in content
  if (!/<h[23]/i.test(contenido) && cw(stripHtml(contenido)) > 300) issues.push('sin_subtitulos');
  return { issues, score: Math.max(0, 100 - issues.length * 12) };
}

// Context checks
function checkContext(textoPlano) {
  let score = 0;
  const reasons = [];
  if (/\b(antecedentes|contexto|marco|historia|previamente|anteriormente|en\s+\d{4})\b/i.test(textoPlano)) { score += 25; reasons.push('antecedentes'); }
  if (/\b(por\s+que|raz[oó]n|motivo|causa|explicaci[oó]n|significa)\b/i.test(textoPlano)) { score += 25; reasons.push('explica_porque'); }
  if (/\b(consecuencia|impacto|afectaci[oó]n|implicaci|qu[eé]\s+puede\s+pasar|qu[eé]\s+viene|despu[eé]s\s+de)\b/i.test(textoPlano)) { score += 25; reasons.push('consecuencias'); }
  if (/\b(seg[uú]n|indic[oó]|manifest[oó]|se[nñ]al[oó]|inform[oó]|declar[oó])\b/i.test(textoPlano)) { score += 25; reasons.push('fuentes_citadas'); }
  return { score: Math.min(100, score), reasons };
}

// Utility checks
function checkUtility(textoPlano) {
  let score = 0;
  const reasons = [];
  if (/\b(recomendaciones?|medidas|prevenci[oó]n|consejos?|gu[ií]a|pasos?)\b/i.test(textoPlano)) { score += 30; reasons.push('servicio'); }
  if (/\b(qu[eé]\s+hacer|c[oó]mo|d[oó]nde|cu[aá]ndo|cu[aá]nto)\b/i.test(textoPlano)) { score += 25; reasons.push('responde_preguntas'); }
  if (/\b(telefone|correo|direcci[oó]n|sitio\s+web|p[aá]gina\s+web|redes\s+sociales)\b/i.test(textoPlano)) { score += 20; reasons.push('datos_contacto'); }
  if (/\b(-alerta|precauci[oó]n|cuidado|atenci[oó]n)\b/i.test(textoPlano)) { score += 25; reasons.push('alerta'); }
  return { score: Math.min(100, score), reasons };
}

// Value check
function checkValue(textoPlano, palabras) {
  let score = 0;
  const reasons = [];
  // Data density
  const cifras = (textoPlano.match(/\d+/g) || []).length;
  const fechas = (textoPlano.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;
  const nombres = (textoPlano.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/g) || []).length;
  const densidad = palabras > 0 ? (cifras + fechas + nombres) / palabras * 100 : 0;
  if (densidad > 3) { score += 30; reasons.push('alta_densidad_datos'); }
  else if (densidad > 1.5) { score += 20; reasons.push('densidad_datos_media'); }
  // Sources
  if (/\b(seg[uú]n|fuente|declar[oó]|inform[oó]|manifest[oó]|se[nñ]al[oó])\b/i.test(textoPlano)) { score += 25; reasons.push('cita_fuentes'); }
  // Own contribution
  if (/Nicaragua\s+Informate|este\s+medio|nuestra\s+redacci[oó]n|este\s+portal|seg[uú]n\s+pudo\s+constatar/i.test(textoPlano)) { score += 25; reasons.push('aporte_propio'); }
  // Length value
  if (palabras >= 400) { score += 20; reasons.push('longitud_adecuada'); }
  return { score: Math.min(100, score), reasons, densidad: Math.round(densidad * 10) / 10 };
}

// Explain check
function checkExplain(textoPlano) {
  let score = 0;
  if (/\b(qu[eé]\s+es|qu[eé]\s+significa|c[oó]mo\s+funciona|por\s+qu[eé])\b/i.test(textoPlano)) score += 40;
  if (/\b(esto\s+significa|en\s+otras\s+palabras|es\s+decir|es\s+decir\s+que)\b/i.test(textoPlano)) score += 30;
  if (/\b(impacto|afectaci[oó]n|consecuencia|implicaci)\b/i.test(textoPlano)) score += 30;
  return Math.min(100, score);
}

// Thin content classification
function classifyThin(palabras, contexto, valor, utilidad, contenido) {
  if (palabras >= 400) return { type: 'NO_THIN', reason: 'longitud_adecuada' };
  if (palabras < 150) {
    if (contexto.score < 25 && valor.score < 25) return { type: 'E', reason: 'contenido_debil' };
    return { type: 'C', reason: 'falta_informacion_esencial' };
  }
  if (contexto.score >= 50 && valor.score >= 50) return { type: 'A', reason: 'corto_completo' };
  if (contexto.score < 25) return { type: 'B', reason: 'falta_contexto' };
  if (palabras < 250) return { type: 'D', reason: 'noticia_breve_historica' };
  return { type: 'A', reason: 'corto_periodisticamente_valido' };
}

// Profile detection (simplified from category-detector)
function detectProfile(titulo, contenido, categoria) {
  const t = (titulo + ' ' + contenido).toLowerCase();
  const signals = [];
  // Ambiente
  if (/\b(volc[aá]n|ceniza|ineter|comupred|actividad\s+volc[aá]nica|sismo|terremoto|magnitud|epicentro)\b/i.test(t)) { signals.push('ambiente'); }
  // Turismo
  if (/\b(turismo|turista|hotel|playa|destino\s+tur[ií]stico|reserva|naturaleza|ecol[oó]gico)\b/i.test(t)) { signals.push('turismo'); }
  // Internacional
  if (/\b(interpol|honduras|el\s+salvador|guatemala|costa\s+rica|panam[aá]|estados\s+unidos|onu|oea|extradici[oó]n|notificaci[oó]n\s+roja)\b/i.test(t)) { signals.push('internacional'); }
  // Sucesos
  if (/\b(captura|contrabando|detenci[oó]n|arresto|operativo|incautaci[oó]n|delito|crimen|homicidio|robo|asalto)\b/i.test(t)) { signals.push('sucesos'); }
  // Deportes
  if (/\b(f[uú]tbol|baseball|b[eé]isbol|liga|campeonato|selecci[oó]n|jugador|equipo|partido|gol)\b/i.test(t)) { signals.push('deportes'); }
  // Tecnologia
  if (/\b(tecnolog[ií]a|software|app|aplicaci[oó]n|internet|redes\s+sociales|digital|ciber)\b/i.test(t)) { signals.push('tecnologia'); }
  // Espectaculos
  if (/\b(concierto|espect[aá]culo|artista|m[uú]sica|cantante|actor|pel[ií]cula|festival)\b/i.test(t)) { signals.push('espectaculos'); }
  // Determine primary
  const profile = signals.length > 0 ? signals[0] : (categoria || 'General').toLowerCase();
  return { profile, signals };
}

// Estado editorial
function estadoEditorial(hasMeni, scoreMeni, aprobadoMeni, thinType, seoScore) {
  if (!hasMeni) return 'NO_EVALUADO';
  if (thinType === 'E') return 'ARCHIVAR';
  if (scoreMeni >= 95 && aprobadoMeni) return 'PUBLICABLE_ORO';
  if (scoreMeni >= 85 && aprobadoMeni) return 'PUBLICABLE';
  if (scoreMeni >= 70) return 'MEJORAR';
  if (scoreMeni < 70) return 'RECHAZADO';
  return 'MEJORAR';
}

async function main() {
  console.log('\n=== FASE 1: AUDITORÍA INDIVIDUAL DE 281 ARTÍCULOS ===\n');
  const raw = fs.readFileSync(path.join(process.cwd(), 'FORENSIC_281_BEFORE.json'), 'utf8');
  const articles = JSON.parse(raw);
  console.log('Artículos cargados:', articles.length);

  // Pre-compute normalized texts for similarity
  const normData = articles.map(a => ({
    id: a.id,
    tituloNorm: normalize(a.titulo),
    contentNorm: normalize(a.contenido).split(' ').slice(0, 500).join(' '),
    titulo: a.titulo,
  }));

  const audits = [];
  let dupCount = 0;
  let thinA = 0, thinB = 0, thinC = 0, thinD = 0, thinE = 0;
  let profilesCorrect = 0, profilesSuspect = 0;

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const tp = stripHtml(a.contenido);
    const palabras = cw(tp);

    // SEO
    const seo = checkSEO(a.titulo, a.resumen, a.contenido, a.tags, a.keywords);

    // Context
    const contexto = checkContext(tp);

    // Utility
    const utilidad = checkUtility(tp);

    // Value
    const valor = checkValue(tp, palabras);

    // Explain
    const explica = checkExplain(tp);

    // Profile
    const prof = detectProfile(a.titulo, a.contenido, a.categoria);

    // Thin classification
    const thin = classifyThin(palabras, contexto, valor, utilidad, a.contenido);
    if (thin.type === 'A') thinA++;
    else if (thin.type === 'B') thinB++;
    else if (thin.type === 'C') thinC++;
    else if (thin.type === 'D') thinD++;
    else if (thin.type === 'E') thinE++;

    // Duplicate detection — compare with all others
    let maxTitleSim = 0, maxContentSim = 0, dupId = null, dupTitle = '';
    for (let j = 0; j < normData.length; j++) {
      if (j === i) continue;
      const ts = titleSim(a.titulo, normData[j].titulo);
      if (ts > maxTitleSim) { maxTitleSim = ts; dupId = normData[j].id; dupTitle = normData[j].titulo; }
      const cs = jaccard(normData[i].contentNorm, normData[j].contentNorm);
      if (cs > maxContentSim) { maxContentSim = cs; }
    }
    const isDuplicate = maxTitleSim > 0.6 || maxContentSim > 0.5;
    if (isDuplicate) dupCount++;

    // Profile check
    const storedCat = (a.categoria || 'General').toLowerCase();
    if (prof.signals.length === 0 || prof.profile === storedCat) profilesCorrect++;
    else profilesSuspect++;

    // Estado editorial
    const estado = estadoEditorial(a.hasMeni, a.scoreMeni, a.aprobadoMeni, thin.type, seo.score);

    audits.push({
      id: a.id,
      slug: a.slug,
      titulo: a.titulo,
      resumen: a.resumen,
      categoria: a.categoria,
      autor: a.autor,
      fecha: a.fecha,
      palabrasReales: palabras,
      palabrasStored: a.palabrasStored,
      scoreMeni: a.scoreMeni,
      aprobadoMeni: a.aprobadoMeni,
      calificacionMeni: a.calificacionMeni,
      nivel: a.nivel,
      nivelScore: a.nivelScore,
      editorialTier: a.editorialTier,
      hasMeni: a.hasMeni,
      // Computed metrics
      seo: seo,
      contexto: contexto,
      valor: valor,
      utilidad: utilidad,
      explica: explica,
      perfil: prof,
      thin: thin,
      originalidad: {
        maxTitleSimilarity: Math.round(maxTitleSim * 100) / 100,
        maxContentSimilarity: Math.round(maxContentSim * 100) / 100,
        isDuplicate,
        dupId,
        dupTitle,
      },
      htmlArtifacts: a.htmlArtifacts,
      estadoEditorial: estado,
      publicado: a.publicado,
      vistas: a.vistas,
      tags: a.tags,
      keywords: a.keywords,
    });

    if ((i + 1) % 50 === 0) console.log(`  Procesados ${i + 1}/${articles.length}...`);
  }

  // Write audit JSON
  const outPath = path.join(process.cwd(), 'FORENSIC_281_AUDIT.json');
  fs.writeFileSync(outPath, JSON.stringify(audits, null, 2), 'utf8');
  console.log('\nAudit JSON:', outPath, '(' + audits.length + ' registros)');

  // Summary
  console.log('\n--- RESUMEN AUDITORÍA ---');
  console.log('Total:', audits.length);
  const conMeni = audits.filter(a => a.hasMeni).length;
  const sinMeni = audits.length - conMeni;
  console.log('CON MENI:', conMeni, '| SIN MENI:', sinMeni);
  console.log('Thin A (corto completo):', thinA);
  console.log('Thin B (falta contexto):', thinB);
  console.log('Thin C (falta info):', thinC);
  console.log('Thin D (breve historico):', thinD);
  console.log('Thin E (debil):', thinE);
  console.log('Duplicados:', dupCount);
  console.log('Perfiles correctos:', profilesCorrect, '| Sospechosos:', profilesSuspect);

  // Estado editorial distribution
  const estados = {};
  for (const a of audits) estados[a.estadoEditorial] = (estados[a.estadoEditorial] || 0) + 1;
  console.log('Estados editoriales:', JSON.stringify(estados));

  // Score distribution
  const sc = { '0-49': 0, '50-69': 0, '70-89': 0, '90-100': 0, 'null': 0 };
  for (const a of audits) {
    if (a.scoreMeni === null) sc['null']++;
    else if (a.scoreMeni < 50) sc['0-49']++;
    else if (a.scoreMeni < 70) sc['50-69']++;
    else if (a.scoreMeni < 90) sc['70-89']++;
    else sc['90-100']++;
  }
  console.log('Scores:', JSON.stringify(sc));

  // Top duplicates
  const dups = audits.filter(a => a.originalidad.isDuplicate).sort((a, b) => b.originalidad.maxTitleSimilarity - a.originalidad.maxTitleSimilarity);
  if (dups.length > 0) {
    console.log('\n--- TOP DUPLICADOS ---');
    for (const d of dups.slice(0, 10)) {
      console.log(`  ${d.id} | sim=${d.originalidad.maxTitleSimilarity} | "${d.titulo}" vs "${d.originalidad.dupTitle}"`);
    }
  }

  // Top SEO issues
  const seoIssues = {};
  for (const a of audits) for (const iss of a.seo.issues) seoIssues[iss] = (seoIssues[iss] || 0) + 1;
  console.log('\nSEO issues:', JSON.stringify(seoIssues));

  // Profile mismatches
  const mismatches = audits.filter(a => a.perfil.signals.length > 0 && a.perfil.profile !== a.categoria.toLowerCase());
  if (mismatches.length > 0) {
    console.log('\n--- PROFILE MISMATCHES ---');
    for (const m of mismatches.slice(0, 10)) {
      console.log(`  ${m.id} | stored=${m.categoria} | detected=${m.perfil.profile} | signals=${m.perfil.signals.join(',')}`);
    }
  }

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
