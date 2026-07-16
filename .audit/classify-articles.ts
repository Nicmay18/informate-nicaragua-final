import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getAdminDb } from '../lib/firebase-admin';
import fs from 'fs';

const db = getAdminDb();

function wordCount(text?: string) {
  if (!text) return 0;
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length;
}

function matches(text: string, pattern: string) {
  return new RegExp(pattern, 'i').test(text);
}

// Políticas estrictas: contenido explícito, promoción ilegal, pornografía, gore, discriminación, piratería, apuestas ilegales.
const SEX_EXPLICIT = '\\b(pornograf[ií]a|porno|video porno|sexo explicito|video sexual explicito|contenido sexual explicito|solo para adultos|sitio para adultos)\\b';
const DRUG_PROMO = '\\b(c[oó]mo consumir marihuana|c[oó]mo preparar drogas|venta de drogas|comprar drogas|comprar marihuana|comprar coca[ií]na|d[oó]nde comprar drogas|vender drogas|traficar drogas|laboratorio de drogas|tutorial drogas|fomenta el consumo de drogas|compra coca[ií]na|vende marihuana)\\b';
const GORE = '\\b(sangre explícita|im[aá]genes sangrientas|descuartizad[oa]|decapitad[oa]|mutilad[oa]|desangrad[oa]|quemad[oa] viv[oa]|golpead[oa] hasta morir|cad[aá]ver putrefacto|im[aá]genes fuertes|video del cad[aá]ver|muerte en vivo)\\b';
const GANG_PROMO = '\\b(ms[- ]?13|barrio 18|mara salvatrucha)\\b.*\\b(orgullo|poderoso|mejor|controlamos|dominamos|leales|reclutamiento|neta|pandilla unida)\\b';
const GAMBLE = '\\b(casino online ilegal|apuestas ilegales|poker online|ruleta online|apuesta desde nicaragua ilegal)\\b';
const HATE = '\\b(limpieza [eé]tnica|exterminio|genocidio|mata[aá]mos a todos|odio racial|discapacitados de mierda|mujeres de mierda|odio de g[eé]nero)\\b';
const PIRACY = '\\b(descargar pel[ií]cula gratis|ver pel[ií]cula online gratis|serie completa gratis|torrent|crack|keygen|pirater[ií]a de contenido)\\b';
const AI_SPEC = '\\biphone\\s*18|samsumg\\s*galax[yi]\\s*s30\\b';

const HAS_SOURCE = '\\b(polic[ií]a|migob|mimitur|intur|inss|mefcca|asamblea|fiscal[ií]a|ej[eé]rcito|hospital|cortes? suprema|alcald[ií]a|ministerio|delegaci[oó]n|instituto|report[oó]|indic[oó]|señal[oó]|dijo|seg[uú]n|afirm[oó]|comunicad[oa]|comunicado oficial|entrevist|declar[oó]|informaron|precisaron|fuentes? oficiales?)\\b';

async function main() {
  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();
  const rows = snap.docs.map(d => {
    const data = d.data() as any;
    const titulo = (data.titulo || '').trim();
    const resumen = (data.resumen || '').trim();
    const contenido = (data.contenido || '').trim();
    const fullText = `${titulo} ${resumen} ${contenido}`;
    const wc = wordCount(contenido) || (data.palabras || 0);
    const fuentes = data.fuentes || data.fuente || '';
    const autor = data.autor || '';
    const categoria = data.categoria || '';

    const flags: string[] = [];
    if (matches(fullText, SEX_EXPLICIT)) flags.push('sexo explícito');
    if (matches(fullText, DRUG_PROMO)) flags.push('promoción drogas');
    if (matches(fullText, GORE)) flags.push('gore gráfico');
    if (matches(fullText, GANG_PROMO)) flags.push('promoción pandillas');
    if (matches(fullText, GAMBLE)) flags.push('apuestas ilegales');
    if (matches(fullText, HATE)) flags.push('discurso de odio');
    if (matches(fullText, PIRACY)) flags.push('piratería');
    if (matches(fullText, AI_SPEC)) flags.push('especulación IA');
    if (wc < 200) flags.push('contenido delgado');
    if (!autor) flags.push('sin autor');
    if (!fuentes && !matches(fullText, HAS_SOURCE)) flags.push('sin fuente verificable');

    let grade = 'A';
    let action = 'CONSERVAR';
    let reason = 'Completo, con autor, fuente verificable y sin señales de riesgo.';

    const policyFlags = ['sexo explícito', 'promoción drogas', 'gore gráfico', 'promoción pandillas', 'apuestas ilegales', 'discurso de odio', 'piratería'];
    if (policyFlags.some(f => flags.includes(f))) {
      grade = 'D';
      action = 'ELIMINAR';
      reason = 'Incumplimiento literal de políticas de contenido: ' + flags.filter(f => policyFlags.includes(f)).join(', ');
    } else if (wc < 200 || flags.includes('sin autor') || flags.includes('especulación IA')) {
      grade = 'C';
      action = 'REESCRIBIR';
      reason = 'Problemas de calidad/EEAT: ' + flags.join(', ');
    } else if (flags.includes('sin fuente verificable')) {
      grade = 'B';
      action = 'CONSERVAR';
      reason = 'Periodísticamente plausible pero falta fuente explícita; se recomienda añadir fuente.';
    } else if (flags.length > 0) {
      grade = 'B';
      action = 'CONSERVAR';
      reason = 'Temas sensibles tratados informativamente: ' + flags.join(', ');
    }

    return {
      slug: data.slug || d.id,
      url: `https://nicaraguainformate.com/noticias/${data.slug || d.id}`,
      titulo,
      categoria,
      autor,
      fecha: data.fecha?._seconds ? new Date(data.fecha._seconds * 1000).toISOString() : data.fecha,
      palabras: wc,
      grade,
      action,
      reason,
      flags,
    };
  });

  fs.writeFileSync('.audit/article-classification.json', JSON.stringify(rows, null, 2));
  const summary = { total: rows.length, A: rows.filter(r => r.grade === 'A').length, B: rows.filter(r => r.grade === 'B').length, C: rows.filter(r => r.grade === 'C').length, D: rows.filter(r => r.grade === 'D').length };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
