/**
 * Auditoría de las notas reales — trust layer + chequeos estructurales.
 * Uso: npx tsx .audit/audit-notas.ts
 * Solo lectura. Reporta X/Y notas analizadas y clasifica problemas.
 */
import { readFileSync, writeFileSync } from 'fs';
import { analyzeTrust } from '../lib/editorial/trust';

// ── Firebase admin desde .env.local ──
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
);
let db: import('firebase-admin/firestore').Firestore;
async function initDb() {
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  db = getFirestore(initializeApp({
    credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))),
  }));
}

function stripHtml(s: string): string {
  return String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(s: string): number {
  return stripHtml(s).split(/\s+/).filter(Boolean).length;
}

function normalizeTitle(t: string): string {
  return stripHtml(t).toLowerCase().replace(/[^a-záéíóúñ0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

interface NotaDoc { [k: string]: any }

async function main() {
  await initDb();
  const snap = await db.collection('noticias').get();
  const total = snap.size;
  console.log(`Auditando ${total} notas...`);

  const issues = {
    factual: 0, estructural: 0, editorial: 0, seo: 0, duplicacion: 0,
    insuficiente: 0, atribucion: 0, titulo: 0, metadata: 0, clasificacion: 0,
    contradiccion: 0, riesgoEditorial: 0,
  };
  const porCategoria: Record<string, number> = {};
  const porNivelConfianza = { ALTA: 0, MEDIA: 0, BAJA: 0 };
  const factores: Record<string, number> = {};
  let provisionalesCorrectas = 0;
  let provisionalesRequierenRevision = 0;
  const diagnosticosBaja: { slug: string; nivel: string; factores: string[]; diagnostico: unknown }[] = [];
  const problemasPorNota: { slug: string; titulo: string; problemas: string[]; nivel: string }[] = [];
  const titleMap = new Map<string, string[]>();
  const slugSet = new Set<string>();
  let publicadas = 0; let noindexPublicadas = 0; let conConfianzaCampo = 0; let escritas = 0;

  for (const doc of snap.docs) {
    const d = doc.data() as NotaDoc;
    const slug = String(d.slug || doc.id);
    const titulo = String(d.titulo || '');
    const cuerpo = String(d.contenido || d.cuerpo || '');
    const resumen = String(d.resumen || d.entrada || '');
    const cat = String(d.categoria || 'General');
    const pub = d.publicado === true && d.estado !== 'archivado';
    if (pub) publicadas++;
    if (d.noindex === true && pub) noindexPublicadas++;
    if (d.confianza) conConfianzaCampo++;

    const problemas: string[] = [];
    const words = wordCount(cuerpo);

    // ── estructurales / metadata ──
    if (!titulo.trim()) problemas.push('metadata:titulo_vacio');
    if (titulo.length > 110) problemas.push('titulo:demasiado_largo');
    if (!resumen.trim()) problemas.push('metadata:sin_resumen');
    if (!d.imagen && !d.imagenDestacada) problemas.push('metadata:sin_imagen');
    if (!d.autor) problemas.push('atribucion:sin_autor');
    if (!d.categoria) problemas.push('clasificacion:sin_categoria');
    if (!slug || slugSet.has(slug)) problemas.push('duplicacion:slug_repetido');
    slugSet.add(slug);

    // ── contenido insuficiente ──
    if (words < 80) problemas.push(`insuficiente:${words}_palabras`);
    else if (words < 200) problemas.push(`insuficiente:corto_${words}p`);

    // ── duplicación de título ──
    const nt = normalizeTitle(titulo);
    if (nt) {
      const list = titleMap.get(nt) ?? [];
      list.push(slug);
      titleMap.set(nt, list);
    }

    // ── trust layer ──
    const trust = analyzeTrust({ titulo, cuerpo: cuerpo + ' ' + resumen, categoria: cat });
    porNivelConfianza[trust.nivel]++;
    porCategoria[cat] = (porCategoria[cat] ?? 0) + 1;
    for (const f of trust.factores) factores[f] = (factores[f] ?? 0) + 1;

    // --write: persiste el campo confianza en la nota (mismo shape que
    // escribe guardar-directo / PUT news/[id]). No destructivo: solo update.
    if (process.argv.includes('--write')) {
      await doc.ref.update({
        confianza: {
          nivel: trust.nivel,
          resumen: trust.resumen,
          requiereRevisionHumana: trust.requiereRevisionHumana,
          factores: trust.factores,
          riesgos: trust.riesgos.map(r => r.detail ?? r.text).slice(0, 10),
          noDisponible: trust.noDisponible.length,
          provisionalesSinFuente: trust.diagnostico.provisionalesSinFuente,
          fuentes: trust.fuentes,
          queFalta: trust.diagnostico.queFalta,
          at: new Date().toISOString(),
        },
      });
      escritas++;
    }

    // Clasificación honesta de provisionales:
    //   PROVISIONAL + atribuida (oración o párrafo) = correcto
    //   PROVISIONAL sin fuente en todo el contexto = revisión
    for (const n of trust.noConfirmada) {
      if (n.atribuida) provisionalesCorrectas++;
      else provisionalesRequierenRevision++;
    }

    if (trust.requiereRevisionHumana) problemas.push('editorial:requiere_revision');
    for (const r of trust.riesgos) problemas.push(`riesgo:${r.detail ?? r.text.slice(0, 60)}`);
    for (const c of trust.contradicciones) problemas.push(`contradiccion:${c.detail ?? ''}`);
    if (/sucesos/i.test(cat) && trust.atribuciones.length === 0 && words > 100) {
      problemas.push('atribucion:suceso_sin_fuente');
    }

    // clasificar en buckets
    for (const p of problemas) {
      const key = p.split(':')[0] as keyof typeof issues;
      if (key in issues) issues[key]++;
      if (key === 'riesgo') issues.riesgoEditorial++;
    }
    if (trust.atribuciones.length === 0 && trust.fuentes.length === 0 && words > 150) {
      issues.atribucion++;
    }

    if (trust.nivel === 'BAJA') {
      diagnosticosBaja.push({ slug, nivel: trust.nivel, factores: trust.factores, diagnostico: trust.diagnostico });
    }
    if (problemas.length > 0) {
      problemasPorNota.push({ slug, titulo: titulo.slice(0, 90), problemas, nivel: trust.nivel });
    }
  }

  // duplicados reales
  let duplicados = 0;
  for (const [, slugs] of titleMap) if (slugs.length > 1) duplicados += slugs.length - 1;

  const report = {
    fecha: new Date().toISOString(),
    notasAnalizadas: `${total} / ${total}`,
    publicadas,
    noindexPublicadas,
    conCampoConfianza: conConfianzaCampo,
    confianzaEscritas: escritas,
    confianza: porNivelConfianza,
    factores,
    provisionales: {
      total: provisionalesCorrectas + provisionalesRequierenRevision,
      correctas_atribuidas: provisionalesCorrectas,
      requierenRevision_sinFuente: provisionalesRequierenRevision,
    },
    porCategoria,
    issues,
    titulosDuplicados: duplicados,
    notasConProblemas: problemasPorNota.length,
    detalle: problemasPorNota,
    diagnosticosBaja,
  };

  writeFileSync('.audit/audit-notas-result.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, detalle: `${problemasPorNota.length} notas con problemas (ver .audit/audit-notas-result.json)` }, null, 2));
}

main().catch(e => { console.error('ERROR', e); process.exit(1); });
