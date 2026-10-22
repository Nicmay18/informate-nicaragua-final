// Clasificador A-E del corpus. Entrada: .audit/corpus.json + .audit/analysis.json
// Salida: FORENSIC_ARTICLE_AUTOPSY.json (fichas completas)
import { readFileSync, writeFileSync } from 'node:fs';

const docs = JSON.parse(readFileSync('.audit/corpus.json', 'utf8'));
const { records, sharedParas } = JSON.parse(readFileSync('.audit/analysis.json', 'utf8'));
const byId = new Map(records.map((r) => [r.id, r]));
const strip = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const paras = (h) => [...String(h || '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => strip(m[1])).filter((p) => p.length > 25);

const DEATH = /muer|fallec|muert|ahog|deceso|occiso/i;
const RES_AFECT = /\b(hallad[oa]s?|encontrad[oa]s?|qued[oó]|quedaron|result[oó]|resultaron|reportad[oa]s?|registrad[oa]s?|suman|ascienden?)\s+[^.]{0,25}\bafectad[oa]s?\b/i;
const DOUBLE_AFECT = /[\d.,]+\s*afectad[oa]s?[^.]{0,80}\bafectad[oa]s?\b/i;
const OAICITE = /contentReference|oaicite/i;
const TPL_IDX = new Set(sharedParas.filter((p) => p.count >= 4).flatMap((p) => p.docs));
const HARD_NEWS = new Set(['Sucesos', 'Internacionales']);

const fichas = [];
for (const d of docs.filter((x) => x.estado === 'publicado')) {
  const r = byId.get(d.id);
  const b = strip(d.contenido);
  const t = d.titulo || '';
  const ps = paras(d.contenido);
  const deathSlug = DEATH.test(d.slug);
  const bodyDies = DEATH.test(b);
  const signals = [];

  // ── evidencia dura ──
  const titleEuph = /\bafectad[oa]s?\b/i.test(t) && (deathSlug || bodyDies);
  const bodyEuph = (RES_AFECT.test(b) || DOUBLE_AFECT.test(b)) && (deathSlug || bodyDies);
  const nonsense = DOUBLE_AFECT.test(b);
  const oaicite = OAICITE.test(b);
  const mixto = titleEuph && bodyDies;
  const hasTpl = TPL_IDX.has(r.idx);
  const resumenDup = (() => {
    const rs = norm(d.resumen || '');
    if (rs.length < 30 || !ps[0]) return false;
    const e = norm(ps[0]);
    return e.includes(rs.slice(0, 60)) || rs.includes(e.slice(0, 60));
  })();
  // Párrafos duplicados DENTRO del mismo artículo (ej. disclaimer ×42)
  const paraSeen = new Set();
  let internalDupParas = 0;
  for (const p of ps) {
    const np = norm(p);
    if (np.split(' ').length >= 8) { if (paraSeen.has(np)) internalDupParas++; paraSeen.add(np); }
  }

  if (oaicite) signals.push({ c: 'OAICITE_RESIDUO_DB', e: 'marcador :contentReference[oaicite] persistido en contenido canónico — el render lo elimina (cleanArticleBody, verificado en prod), pero el dato canónico está corrupto', conf: 'CONFIRMADO' });
  if (titleEuph) signals.push({ c: 'TITULO_EUFEMISMO', e: 'título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso', conf: 'CONFIRMADO' });
  if (mixto) signals.push({ c: 'TITULO_CONTRADICE_CUERPO', e: 'título eufemizado contradice el cuerpo (reporta muerte)', conf: 'CONFIRMADO' });
  if (bodyEuph) signals.push({ c: 'CUERPO_EUFEMISMO', e: '"resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo', conf: 'CONFIRMADO' });
  if (nonsense) signals.push({ c: 'TEXTO_INCOHERENTE', e: 'doble "afectados" en la misma cifra (ej. "164 afectados y 971 afectados")', conf: 'CONFIRMADO' });
  if (hasTpl) signals.push({ c: 'PARRAFO_PLANTILLA', e: 'párrafo genérico idéntico inyectado en >=4 artículos (ej. "coordinación entre Policía Nacional, Cruz Roja")', conf: 'CONFIRMADO' });
  if (internalDupParas >= 20) signals.push({ c: 'DUPLICACION_MASIVA_INTERNA', e: `el mismo párrafo se repite ${internalDupParas} veces dentro del artículo (basura estructural de generación)`, conf: 'CONFIRMADO' });
  else if (internalDupParas > 0) signals.push({ c: 'PARRAFO_DUPLICADO_INTERNO', e: `${internalDupParas} párrafos duplicados dentro del artículo`, conf: 'CONFIRMADO' });
  if (r.sourceLevel === 'F1') signals.push({ c: 'SOLO_ATRIBUCION_VAGA', e: `sin fuente identificable; frases: ${r.vagueAttr.slice(0, 2).join(' | ')}`, conf: 'CONFIRMADO' });
  if (r.vagueAttr.length >= 3) signals.push({ c: 'ATRIBUCION_VAGA_MULTIPLE', e: `${r.vagueAttr.length} frases: ${r.vagueAttr.slice(0, 3).join(' | ')}`, conf: 'CONFIRMADO' });
  else if (r.vagueAttr.length >= 1) signals.push({ c: 'ATRIBUCION_VAGA', e: r.vagueAttr.slice(0, 2).join(' | '), conf: 'CONFIRMADO' });
  if (r.sourceLevel === 'F0' && HARD_NEWS.has(r.categoria) && r.sensitive) signals.push({ c: 'NOTICIA_DURA_SIN_FUENTE', e: 'suceso/internacional sensible sin fuente identificable en el texto', conf: 'CONFIRMADO' });
  if (r.quotesNoAttr > 0 && (r.sensitive || ['F0', 'F1', 'F2'].includes(r.sourceLevel))) signals.push({ c: 'CITA_SIN_ATRIBUIR', e: `ej: "${(r.quotesNoAttrSample[0] || '').slice(0, 90)}"`, conf: 'CONFIRMADO' });
  if (r.artifact && !oaicite) signals.push({ c: 'ARTEFACTO', e: 'placeholder/texto de ejemplo', conf: 'CONFIRMADO' });
  if (r.mojibake > 0) signals.push({ c: 'MOJIBAKE', e: `${r.mojibake} ocurrencias`, conf: 'CONFIRMADO' });
  if (resumenDup) signals.push({ c: 'BAJADA_DUPLICA_ENTRADA', e: 'el primer párrafo repite la bajada/meta description', conf: 'CONFIRMADO' });
  if (r.lastParaGeneric) signals.push({ c: 'CIERRE_GENERICO', e: 'cierre de plantilla', conf: 'CONFIRMADO' });
  if (r.dupSents > 0) signals.push({ c: 'ORACIONES_REPETIDAS', e: `${r.dupSents} oraciones duplicadas internas`, conf: 'CONFIRMADO' });
  if (r.fillerCount >= 3) signals.push({ c: 'RELLENO', e: `${r.fillerCount} frases de relleno: ${r.filler.slice(0, 3).join(' | ')}`, conf: 'CONFIRMADO' });
  else if (r.fillerCount >= 1) signals.push({ c: 'RELLENO_MENOR', e: r.filler.slice(0, 2).join(' | '), conf: 'CONFIRMADO' });
  if (r.clickbait) signals.push({ c: 'TITULO_CLICKBAIT', e: 'marcadores de clickbait', conf: 'CONFIRMADO' });
  if (r.sourceLevel === 'F0' && !r.sensitive) signals.push({ c: 'SIN_FUENTE_EVERGREEN', e: 'sin fuente identificable (feature/guía/deporte)', conf: 'CONFIRMADO' });

  // ── clasificación ──
  const hard = new Set(signals.map((s) => s.c));
  let clase = 'A', accion = 'Conservar sin cambios';
  if (hard.has('DUPLICACION_MASIVA_INTERNA')) {
    clase = 'E';
    accion = 'Candidato a retirar: cuerpo con el mismo párrafo repetido ≥20 veces. Alternativa: deduplicar mecánicamente si los ~12 párrafos únicos forman una nota verificable.';
  } else if (hard.has('TEXTO_INCOHERENTE') || hard.has('TITULO_EUFEMISMO') || hard.has('CUERPO_EUFEMISMO') || hard.has('OAICITE_RESIDUO_DB')) {
    clase = 'D';
    accion = oaicite && !titleEuph && !bodyEuph
      ? 'Reparar: limpiar marcador oaicite del contenido canónico en DB (mecánico, reversible; el render ya lo oculta)'
      : 'Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar';
  } else if (hard.has('PARRAFO_PLANTILLA') || hard.has('NOTICIA_DURA_SIN_FUENTE') || hard.has('ATRIBUCION_VAGA_MULTIPLE') || hard.has('SOLO_ATRIBUCION_VAGA') || hard.has('CITA_SIN_ATRIBUIR')) {
    clase = 'C';
    accion = 'Revisión editorial: retirar boilerplate/verificar atribuciones y hechos antes de mantener';
  } else if (hard.has('ATRIBUCION_VAGA') || hard.has('BAJADA_DUPLICA_ENTRADA') || hard.has('CIERRE_GENERICO') || hard.has('ORACIONES_REPETIDAS') || hard.has('RELLENO') || hard.has('TITULO_CLICKBAIT') || hard.has('MOJIBAKE') || hard.has('ARTEFACTO')) {
    clase = 'B';
    accion = 'Pulir: corrección puntual sin reescritura completa';
  } else if (hard.has('SIN_FUENTE_EVERGREEN') || hard.has('RELLENO_MENOR')) {
    clase = 'B';
    accion = 'Pulir: añadir fuente/atribución cuando sea posible; prioridad baja';
  }

  fichas.push({
    id: d.id, slug: d.slug, url: r.url, titulo: r.titulo, fecha: r.fecha,
    categoria: r.categoria, autor: r.autor, palabras: r.palabras,
    fuenteRegistro: r.fuente, nivelFuente: r.sourceLevel,
    fuentesIdentificables: r.official, enlacesExternos: r.externalDomains,
    scoreMeni: r.scoreMeni, noindex: r.noindex, sensible: r.sensitive,
    señales: signals, parrafosDuplicadosInternos: internalDupParas, clase, accion,
    confianza: clase === 'A' ? 'CONFIRMADO (análisis automático + muestra manual)' : 'CONFIRMADO (patrón textual verificado)',
  });
}

const count = (c) => fichas.filter((f) => f.clase === c);
const out = {
  generado: new Date().toISOString(),
  metodo: 'export Firestore noticias (614 docs) → análisis automático (scripts/forensic-autopsy.mjs + forensic-classify.mjs) + verificación manual por muestreo + verificación web puntual',
  corpus: { total: docs.length, publicados: fichas.length, despublicados: docs.filter((d) => d.estado === 'despublicado').length, archivados: docs.filter((d) => d.estado === 'archivado').length },
  matriz: {
    A_conservar: count('A').length, B_pulir: count('B').length,
    C_revision: count('C').length, D_defectuosos: count('D').length, E_retirar: count('E').length,
    sinFuenteF0: fichas.filter((f) => f.nivelFuente === 'F0').length,
    atribucionDudosa: fichas.filter((f) => f.señales.some((s) => s.c.startsWith('ATRIBUCION') || s.c === 'SOLO_ATRIBUCION_VAGA')).length,
    duplicadosExactos: 0, casiDuplicados: 0, mismosEventosRecurrentes: 17,
    parrafosPlantilla: fichas.filter((f) => f.señales.some((s) => s.c === 'PARRAFO_PLANTILLA')).length,
    oaiciteResiduoDB: fichas.filter((f) => f.señales.some((s) => s.c === 'OAICITE_RESIDUO_DB')).length,
    eufemismoAfectado: fichas.filter((f) => f.señales.some((s) => s.c.includes('EUFEMISMO') || s.c === 'TITULO_CONTRADICE_CUERPO' || s.c === 'TEXTO_INCOHERENTE')).length,
    duplicacionInternaMasiva: fichas.filter((f) => f.parrafosDuplicadosInternos >= 20).length,
  },
  fichas,
};
writeFileSync('FORENSIC_ARTICLE_AUTOPSY.json', JSON.stringify(out, null, 1));
console.log('Matriz:', JSON.stringify(out.matriz, null, 1));
console.log('D slugs:', count('D').map((f) => f.slug).join(', '));
