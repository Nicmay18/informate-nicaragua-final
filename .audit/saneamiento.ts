/**
 * FASE DE CIERRE — Saneamiento editorial real de las notas.
 *
 * Reclasifica cada señal del trust layer según si existe un PROBLEMA
 * EDITORIAL DEMOSTRABLE. Ausencia de fuente ≠ error. Los contadores no
 * se reducen por estética: se determina para cada nota si hay algo que
 * un editor humano deba corregir.
 *
 * Veredictos: CORRECTA | REVISION | CORRECCION_NECESARIA
 * Persiste la cola editorial en `editorial_review_queue` (Firestore).
 *
 * Ejecutar: npx tsx .audit/saneamiento.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { analyzeTrust, type TrustReport } from '../lib/editorial/trust';
import * as path from 'path';

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

type Veredicto = 'CORRECTA' | 'REVISION' | 'CORRECCION_NECESARIA';
type Prioridad = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
type TriState = 'SI' | 'NO' | 'NO_VERIFICABLE' | 'REVISAR';

const RE_DELITO = /\b(asesin|homicid|robo|hurt|violac|secuestr|narcotr|delito|crimen|femicidio|detenid|capturad|imputad|acusad|sospechos|víctima|cad[áa]ver|muert[oa] encontrad|atropell|allanamient|decomis|balacera|apuñal)\w*/i;
const RE_EVENTO = /\b(ocurrió|sucedió|registró|reportó|reportaron|se registró|tuvo lugar|realizó|realizaron|celebró|anunció|anunciaron|lanzó|inauguró|firmó|aprobó|murió|falleció|resultó|perdió|ganó|venció|empató|clasificó|subió|bajó|aumentó|disminuyó|inició|concluyó)\w*/i;
const CATS_DESCRIPTIVAS = new Set(['Deportes', 'Servicios', 'Tecnología', 'Espectáculos']);

interface Clasificacion {
  slug: string;
  titulo: string;
  categoria: string;
  publicado: boolean;
  veredicto: Veredicto;
  prioridad: Prioridad;
  confianza: string;
  principal_claim: string;
  problema: string;
  tipo_problema: string;
  evidencia_disponible: string;
  fuente: string;
  atribucion: string;
  que_falta: string[];
  accion_recomendada: string;
  sm_necesitaFuente: TriState | null;
  sm_problemaConfiabilidad: TriState | null;
  temporal: 'REAL' | 'NO_NECESARIO' | null;
  provisional: 'SIN_RESPALDO_REAL' | 'CORRECTA' | null;
}

function classify(slug: string, d: Record<string, unknown>, t: TrustReport): Clasificacion {
  const cat = String(d.categoria || '');
  const cuerpo = `${d.contenido || ''} ${d.titulo || ''}`;
  const esSuceso = cat === 'Sucesos' || RE_DELITO.test(cuerpo);
  const esDescriptiva = CATS_DESCRIPTIVAS.has(cat) && !RE_DELITO.test(cuerpo);
  const diag = t.diagnostico;

  const delitoSinAtrib = t.riesgos.filter(r => /delito afirmado/.test(r.detail ?? ''));
  const provSinFuenteCount = diag.provisionalesSinFuente;
  const provComoHecho = diag.provisionalesPresentadasComoHecho;
  const sinAtribucion = diag.afirmaciones > 0 && diag.atribuidas === 0;
  const sinFuente = diag.conFuenteNombrada === 0;
  const sinFecha = diag.tieneFecha === 'NO';
  const conEvento = RE_EVENTO.test(cuerpo);

  let veredicto: Veredicto = 'CORRECTA';
  let prioridad: Prioridad = 'BAJA';
  let problema = '';
  let tipo = '';
  let accion = 'NINGUNA';
  let evidencia = 'NINGUNA';

  // CRITICA: contradicción factual demostrable
  if (t.contradicciones.length > 0) {
    veredicto = 'CORRECCION_NECESARIA';
    prioridad = 'CRITICA';
    tipo = 'contradiccion_factual';
    problema = `Contradicción interna: ${t.contradicciones.map(c => c.text).join(' | ')}`;
    evidencia = t.contradicciones.map(c => c.text).join(' || ');
    accion = 'RESOLVER_CONTRADICCION_CON_FUENTE_ORIGINAL';
  // CRITICA: delito/acusación afirmado como hecho sin atribución
  } else if (delitoSinAtrib.length > 0 || provComoHecho > 0) {
    veredicto = 'CORRECCION_NECESARIA';
    prioridad = 'CRITICA';
    tipo = 'acusacion_sin_atribucion';
    const evid = [...delitoSinAtrib.map(r => r.text), ...t.noConfirmada.filter(n => !n.atribuida).map(n => n.text)];
    problema = `Delito afirmado sin atribución (${delitoSinAtrib.length} caso(s), ${provComoHecho} provisional presentada como hecho)`;
    evidencia = evid.slice(0, 3).join(' || ');
    accion = 'ATRIBUIR_A_FUENTE_REAL_O_REFORMULAR_COMO_INVESTIGACION';
  // ALTA: provisional sin fuente en contexto
  } else if (provSinFuenteCount > 0) {
    veredicto = 'REVISION';
    prioridad = 'ALTA';
    tipo = 'provisional_sin_respaldo';
    problema = `${provSinFuenteCount} afirmación(es) provisional(es) sin fuente en su párrafo`;
    evidencia = t.noConfirmada.filter(n => !n.atribuida).map(n => n.text).slice(0, 3).join(' || ');
    accion = 'VERIFICAR_FUENTE_O_MARCAR_EXPLICITAMENTE_COMO_NO_CONFIRMADO';
  // ALTA: nota de sucesos sin ninguna atribución
  } else if (esSuceso && sinAtribucion && sinFuente && diag.afirmaciones > 3) {
    veredicto = 'REVISION';
    prioridad = 'ALTA';
    tipo = 'suceso_sin_atribucion';
    problema = 'Nota de sucesos sin ninguna atribución ni fuente nombrada';
    evidencia = t.hechos.slice(0, 2).map(h => h.text).join(' || ');
    accion = 'IDENTIFICAR_FUENTE_ORIGINAL_DEL_MATERIAL';
  // MEDIA: noticia de evento donde la fecha importa para comprender
  } else if (sinFecha && (esSuceso || conEvento)) {
    veredicto = 'REVISION';
    prioridad = 'MEDIA';
    tipo = 'temporal_ambigua';
    problema = 'Noticia de evento sin referencia temporal que la ubique';
    accion = 'AÑADIR_REFERENCIA_TEMPORAL_SOLO_SI_EXISTE_EN_MATERIAL_ORIGINAL';
  // MEDIA: muchas afirmaciones sin atribución en nota no descriptiva
  } else if (sinAtribucion && !esDescriptiva && diag.afirmaciones >= 5) {
    veredicto = 'REVISION';
    prioridad = 'MEDIA';
    tipo = 'atribucion_insuficiente';
    problema = `${diag.afirmaciones} afirmaciones sin ninguna atribución identificable`;
    accion = 'REVISAR_SI_LA_FUENTE_DEBERIA_IDENTIFICARSE';
  }
  // Resto: señales técnicas sin problema editorial demostrable → CORRECTA

  // Regla 5 — reclasificación de SOURCE_MISSING
  let smNecesita: TriState | null = null;
  let smConf: TriState | null = null;
  if (sinFuente) {
    if (delitoSinAtrib.length > 0 || (esSuceso && diag.afirmaciones > 3)) smNecesita = 'SI';
    else if (esDescriptiva) smNecesita = 'NO';
    else if (diag.afirmaciones <= 3) smNecesita = 'NO';
    else smNecesita = 'NO_VERIFICABLE';
    smConf = delitoSinAtrib.length > 0 ? 'SI' : smNecesita === 'SI' ? 'REVISAR' : 'NO';
  }

  // Regla 7 — reclasificación temporal
  let temporal: 'REAL' | 'NO_NECESARIO' | null = null;
  if (sinFecha) temporal = (esSuceso || conEvento) ? 'REAL' : 'NO_NECESARIO';

  // Regla 6 — reclasificación provisional
  let provisional: 'SIN_RESPALDO_REAL' | 'CORRECTA' | null = null;
  if (diag.provisionales > 0) {
    provisional = provSinFuenteCount > 0 ? 'SIN_RESPALDO_REAL' : 'CORRECTA';
  }

  return {
    slug,
    titulo: String(d.titulo || ''),
    categoria: cat,
    publicado: Boolean(d.publicado),
    veredicto,
    prioridad,
    confianza: t.nivel,
    principal_claim: diag.afirmacionPrincipal,
    problema,
    tipo_problema: tipo,
    evidencia_disponible: evidencia,
    fuente: diag.fuentesDetectadas.join(', ') || 'NINGUNA',
    atribucion: `${diag.atribuidas}/${diag.afirmaciones}`,
    que_falta: diag.queFalta,
    accion_recomendada: accion,
    sm_necesitaFuente: smNecesita,
    sm_problemaConfiabilidad: smConf,
    temporal,
    provisional,
  };
}

async function main() {
  await initDb();
  const snap = await db.collection('noticias').get();
  const clasificaciones: Clasificacion[] = [];

  for (const doc of snap.docs) {
    const d = doc.data();
    const t = analyzeTrust({
      titulo: String(d.titulo || ''),
      cuerpo: String(d.contenido || ''),
      categoria: String(d.categoria || ''),
    });
    clasificaciones.push(classify(doc.id, d, t));
  }

  const porVeredicto = { CORRECTA: 0, REVISION: 0, CORRECCION_NECESARIA: 0 };
  const porPrioridad = { CRITICA: 0, ALTA: 0, MEDIA: 0, BAJA: 0 };
  let smReal = 0, smNoAplica = 0, temporalReal = 0, temporalNoNec = 0;
  let provSinRespaldo = 0, provCorrecta = 0;

  for (const c of clasificaciones) {
    porVeredicto[c.veredicto]++;
    if (c.veredicto !== 'CORRECTA') porPrioridad[c.prioridad]++;
    if (c.sm_necesitaFuente === 'SI') smReal++;
    else if (c.sm_necesitaFuente === 'NO') smNoAplica++;
    if (c.temporal === 'REAL') temporalReal++;
    else if (c.temporal === 'NO_NECESARIO') temporalNoNec++;
    if (c.provisional === 'SIN_RESPALDO_REAL') provSinRespaldo++;
    else if (c.provisional === 'CORRECTA') provCorrecta++;
  }

  const orden = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };
  const cola = clasificaciones
    .filter(c => c.veredicto !== 'CORRECTA')
    .sort((a, b) => orden[a.prioridad] - orden[b.prioridad]);
  const criticos = clasificaciones.filter(c => c.veredicto === 'CORRECCION_NECESARIA');

  const resumen = {
    TOTAL_NOTAS: clasificaciones.length,
    ...porVeredicto,
    ...porPrioridad,
    SOURCE_MISSING_REAL: smReal,
    SOURCE_MISSING_NO_APLICA: smNoAplica,
    TEMPORAL_REAL: temporalReal,
    TEMPORAL_NO_NECESARIO: temporalNoNec,
    PROVISIONAL_SIN_RESPALDO_REAL: provSinRespaldo,
    PROVISIONAL_CORRECTA: provCorrecta,
    CONTRADICTIONS: clasificaciones.filter(c => c.tipo_problema === 'contradiccion_factual').length,
    ENTITY_UNVERIFIED: clasificaciones.filter(c => c.tipo_problema === 'acusacion_sin_atribucion').length,
  };

  mkdirSync(path.join(process.cwd(), '.audit'), { recursive: true });
  writeFileSync(
    path.join(process.cwd(), '.audit/saneamiento-result.json'),
    JSON.stringify({ resumen, casos_graves: criticos, cola_editorial: cola, todas: clasificaciones }, null, 2),
  );

  // Persistir la cola editorial — consumidor: editor humano en Admin.
  // Se reemplazan docs por slug; las resueltas quedan con estado PENDING→RESOLVED manual.
  const batch = db.batch();
  for (const c of cola) {
    batch.set(db.collection('editorial_review_queue').doc(c.slug), {
      slug: c.slug, titulo: c.titulo, categoria: c.categoria,
      veredicto: c.veredicto, prioridad: c.prioridad,
      problema: c.problema, tipoProblema: c.tipo_problema,
      evidencia: c.evidencia_disponible, fuente: c.fuente,
      atribucion: c.atribucion, queFalta: c.que_falta,
      accionRecomendada: c.accion_recomendada,
      estado: 'PENDING', updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
  await batch.commit();

  console.log(JSON.stringify(resumen, null, 2));
  console.log('\nCASOS GRAVES (CORRECCION_NECESARIA):');
  for (const c of criticos) {
    console.log(`\n  SLUG: ${c.slug}`);
    console.log(`  TITULAR: ${c.titulo}`);
    console.log(`  PROBLEMA: ${c.problema}`);
    console.log(`  EVIDENCIA: ${c.evidencia_disponible}`);
    console.log(`  ACCION: ${c.accion_recomendada}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
