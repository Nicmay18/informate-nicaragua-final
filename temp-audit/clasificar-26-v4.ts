/**
 * Fase 1: Clasificar las 26 noticias problemáticas del V4.
 * Uso: npx tsx temp-audit/clasificar-26-v4.ts
 * Salida: temp-audit/clasificacion-26.json y .md
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { readFileSync, writeFileSync } from 'fs';
import { getAdminDb } from '../lib/firebase-admin';
import { type NoticiaInput } from '../lib/analizador-noticias';
import { pipelineV4 } from '../lib/editor-jefe-v4/pipeline';
import { loadProfile } from '../lib/editor-jefe-v4/profile-loader';

function safeDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
    try {
      const d = (value as any).toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : null;
    } catch { return null; }
  }
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    try {
      const sec = Number((value as any)._seconds);
      const ns = Number((value as any)._nanoseconds || 0);
      const d = new Date(sec * 1000 + ns / 1_000_000);
      return !isNaN(d.getTime()) ? d : null;
    } catch { return null; }
  }
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toInput(data: any, id: string): NoticiaInput {
  const fechaDate = safeDate(data.fecha);
  return {
    titulo: (data.titulo || '').toString(),
    contenido: (data.contenido || '').toString(),
    resumen: (data.resumen || '').toString(),
    categoria: (data.categoria || 'General').toString(),
    autor: (data.autor || '').toString(),
    fecha: fechaDate ? fechaDate.toISOString() : new Date().toISOString(),
    fechaActualizacion: safeDate(data.fechaActualizacion)?.toISOString(),
    slug: (data.slug || id).toString(),
    keywords: (data.keywords || '').toString(),
    palabrasClave: Array.isArray(data.palabrasClave) ? data.palabrasClave : undefined,
    imagenDestacada: data.imagenDestacada || data.imagen || undefined,
  };
}

function textoPlano(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function clasificarItem(
  regla: string,
  motivo: string,
  evidence: any,
  text: string,
  profile: any,
): 'real' | 'falsa_alarma' | 'dudoso' {
  const plain = text;

  if (regla === 'valorEditorial.parrafosSinDato') {
    const total = evidence?.valorEditorial?.parrafosTotal || 1;
    const sinDato = evidence?.valorEditorial?.parrafosSinDato || 0;
    const ratio = sinDato / total;
    return ratio > 0.6 ? 'real' : 'falsa_alarma';
  }

  if (regla === 'requiredUtility') {
    const utiles = /\b(?:recomendaciones?|consejos?|medidas|prevenci[oó]n|gu[ií]a|pasos?\s+a\s+seguir|cuidar|evitar|qu[eé]\s+hacer)\b/i.test(plain);
    return profile?.categoria === 'Servicio' || utiles ? 'dudoso' : 'falsa_alarma';
  }

  if (regla === 'requiredContext') {
    return /\b(?:antecedente|contexto|hist[oó]rico|anteriormente|desde\s+hace|relaci[oó]n|precedente|pasado)\b/i.test(plain) ? 'dudoso' : 'falsa_alarma';
  }

  if (regla === 'sources.numeroFuentes') {
    const hayFuente = /\b(polic[ií]a|fiscal[ií]a|bomberos|ministerio|entrevist|declar[oó]|indic[oó]|dijo|testigo|familiar|versiones|medios?\s+locales?|autoridades?|oficiales?)\b/i.test(plain);
    return hayFuente ? 'falsa_alarma' : 'real';
  }

  if (regla === 'eeat.atribucionesFalsas') {
    return /seg[uú]n\s+fuentes?\s+an[oó]nimas|trascendi[oó]|al\s+parecer/i.test(plain) ? 'real' : 'falsa_alarma';
  }

  if (regla === 'evidence.esNotaVerificable') {
    const d = evidence?.evidence?.datosConcretos || {};
    const total = (d.fechas || 0) + (d.cifras || 0) + (d.lugares || 0) + (d.nombres || 0);
    return total >= 3 ? 'falsa_alarma' : 'real';
  }

  if (regla === 'adsense.palabraCount') {
    const palabras = plain.split(/\s+/).filter(Boolean).length;
    return palabras < 300 ? 'real' : 'falsa_alarma';
  }

  if (regla === 'eeat.autorVisible') {
    return evidence?.eeat?.autorVisible ? 'falsa_alarma' : 'real';
  }

  if (regla === 'discover.tieneImagen') {
    return evidence?.discover?.tieneImagen ? 'falsa_alarma' : 'real';
  }

  if (regla.startsWith('requiredEvidence.')) {
    const key = regla.split('.')[1];
    if (key === 'cifras' && /\d/.test(plain)) return 'falsa_alarma';
    if (key === 'quien' && /\b(gobierno|ministerio|presidente|alcalde|autoridad|funcionario|instituci[oó]n|polic[ií]a|fiscal[ií]a|onu|ue|oms)\b/i.test(plain)) return 'falsa_alarma';
    if (key === 'donde' && /\b(barrio|municipio|departamento|carretera|km\s+\d+|ciudad|pa[ií]s|zona|comunidad|lugar)\b/i.test(plain)) return 'falsa_alarma';
    if (key === 'cuando' && /\b\d{1,2}\s+de\s+\w+|\d{1,2}:\d{2}|madrugada|mañana|tarde|noche|horas?\s+de\s+la\b/i.test(plain)) return 'falsa_alarma';
    if (key === 'estadoActual' && /\b(investigaci[oó]n|operativo|detenid[oa]|capturad[oa]|seguimiento|pesquisas|b[uú]squeda|trasladad[oa])\b/i.test(plain)) return 'falsa_alarma';
    if (key === 'seguimiento' && /\b(actualizaci[oó]n|pr[oó]ximas?|se\s+espera|en\s+desarrollo|m[aá]s\s+informaci[oó]n)\b/i.test(plain)) return 'falsa_alarma';
    if (key === 'impacto' && /\b(herid[oa]s?|fallecid[oa]s?|afectad[oa]s?|beneficiar[aá]?|p[eé]rdidas?|da[nñ]os?|v[ií]ctimas?)\b/i.test(plain)) return 'falsa_alarma';
    if (key === 'queOcurrio' && /\b(accidente|incidente|ocurri[oó]|sucedi[oó]|robo|incendio|colisi[oó]n|explosi[oó]n)\b/i.test(plain)) return 'falsa_alarma';
    if (key === 'quePaso' && /\b(acuerdo|anunci[oó]|firm[oó]|decisi[oó]n|programa|proyecto|construcci[oó]n|inaugur[oó]|report)\b/i.test(plain)) return 'falsa_alarma';
    if (key === 'cronograma' && /\b(202[5-9]|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|pr[oó]ximo|inicia|previsto)\b/i.test(plain)) return 'falsa_alarma';
    if (key === 'contexto' && /\b(tras|despu[eé]s|durante|marco|seg[uú]n|informe)\b/i.test(plain)) return 'falsa_alarma';
    if (key === 'resultado' && /\d+\s*[-–:]\s*\d+/.test(plain)) return 'falsa_alarma';
    if (key === 'tabla' && /\b(tabla|posiciones|puntos|puesto)\b/i.test(plain)) return 'falsa_alarma';
    if (key === 'estadisticas' && /\b(goles?|asistencias?|posesi[oó]n|tarjetas?|rebotes?|puntos|innings?)\b/i.test(plain)) return 'falsa_alarma';
    if (key === 'proximoPartido' && /\b(pr[oó]ximo|contra|vs\.?|jornada|fecha)\b/i.test(plain)) return 'falsa_alarma';
    if (key === 'figura' && /\b(figura|MVP|goleador|destac[oó]|jugador)\b/i.test(plain)) return 'falsa_alarma';
    return 'real';
  }

  return 'dudoso';
}

async function main() {
  const resumen = JSON.parse(readFileSync('temp-audit/auditoria-v4-resumen.json', 'utf8'));
  const problemas = resumen.detalleProblemas || [];
  const db = getAdminDb();

  const resultados: any[] = [];
  let realCount = 0;
  let falsaCount = 0;
  let dudosoCount = 0;

  console.log(`Clasificando ${problemas.length} noticias...`);

  for (let i = 0; i < problemas.length; i++) {
    const p = problemas[i];
    const snap = await db.collection('noticias').where('slug', '==', p.slug).limit(1).get();
    if (snap.empty) {
      console.log(`No encontrado: ${p.slug}`);
      continue;
    }
    const data = snap.docs[0].data();
    const input = toInput(data, snap.docs[0].id);
    const resultado = pipelineV4(input);
    const profile = loadProfile(resultado.categoria || input.categoria);
    const plain = textoPlano(input.contenido);

    const items: any[] = [];
    let falsas = 0;
    let reales = 0;
    let dudosos = 0;

    for (const e of resultado.explainability || []) {
      const tipo = clasificarItem(e.regla, e.motivo, resultado.evidence, plain, profile);
      if (tipo === 'real') reales++;
      else if (tipo === 'falsa_alarma') falsas++;
      else dudosos++;
      items.push({ regla: e.regla, tipo, parrafo: e.parrafo, motivo: e.motivo });
    }

    const tipoArticulo = reales >= falsas ? 'realmente_mala' : 'falsa_alarma';
    if (tipoArticulo === 'realmente_mala') realCount++;
    else falsaCount++;
    dudosoCount += dudosos;

    resultados.push({
      slug: p.slug,
      titulo: input.titulo,
      categoria: input.categoria,
      score: resultado.scores?.final,
      veredicto: resultado.veredicto,
      tipo: tipoArticulo,
      reales,
      falsas,
      dudosos,
      items,
    });

    console.log(`${i + 1}/${problemas.length} ${p.slug} → ${tipoArticulo} (r:${reales}, f:${falsas}, d:${dudosos})`);
  }

  const res = {
    total: resultados.length,
    realmente_malas: realCount,
    falsas_alarmas: falsaCount,
    dudosos: dudosoCount,
    articulos: resultados.sort((a, b) => (a.tipo === 'realmente_mala' ? -1 : 1) || a.score - b.score),
  };

  writeFileSync('temp-audit/clasificacion-26.json', JSON.stringify(res, null, 2), 'utf8');

  const md = [
    '# Clasificación V4 — 26 noticias problemáticas',
    `**Fecha:** ${new Date().toLocaleString('es-NI')}`,
    '',
    '## Resumen',
    `- Total analizadas: ${res.total}`,
    `- **Realmente malas:** ${res.realmente_malas}`,
    `- **Falsas alarmas:** ${res.falsas_alarmas}`,
    `- Dudosos (ítems): ${res.dudosos}`,
    '',
    '## Artículos',
    ...resultados.map(a => [
      `### ${a.titulo} (${a.categoria}) — score ${a.score} — **${a.tipo}**`,
      `slug: \`${a.slug}\``,
      `- Reales: ${a.reales}, Falsas alarmas: ${a.falsas}, Dudoso: ${a.dudosos}`,
      ...a.items.map((it: any) => `  - [${it.tipo}] \`${it.regla}\` — ${it.parrafo} — ${it.motivo}`),
      '',
    ].join('\n')),
  ].join('\n');

  writeFileSync('temp-audit/clasificacion-26.md', md, 'utf8');

  console.log('\n═══════════════════════════════════════════════');
  console.log('Clasificación finalizada');
  console.log(`Realmente malas: ${realCount}`);
  console.log(`Falsas alarmas: ${falsaCount}`);
  console.log(`Dudosos: ${dudosoCount}`);
  console.log('Archivos: temp-audit/clasificacion-26.json / .md');
  console.log('═══════════════════════════════════════════════');
}

main().catch(e => { console.error(e); process.exit(1); });
