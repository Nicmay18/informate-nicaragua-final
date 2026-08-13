/**
 * FASE 16-A — Ejecución de 6 correcciones simples (BAJO riesgo).
 *
 * Para cada artículo:
 * 1. Lee de Firestore
 * 2. Aplica corrección estructural (HTML/título/resumen/H2)
 * 3. Pasa por sanitizeArticleHtml()
 * 4. Re-evalúa MENI con runMeniAsync (canónico)
 * 5. Guarda cambios + campos MENI del resultado + provenance
 * 6. Log antes/después
 *
 * NO inventa contenido. NO fabrica scores. NO modifica thresholds.
 */
import * as fs from 'fs';
import * as path from 'path';
import admin from 'firebase-admin';
import { runMeniAsync } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { mapMeniScoreToNivel } from '@/lib/editorial/guardar-con-meni';
import { extractPuntosClave, extractFuente, getAutorFoto } from '@/lib/eeat-helpers';

// Load .env.local
try {
  const e = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(e)) {
    for (const l of fs.readFileSync(e, 'utf8').split('\n')) {
      const l2 = l.replace(/\r$/, '');
      const m = l2.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    }
  }
} catch {}

const sa = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
};
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const FASE = 'PHASE16A';
const ACTOR = 'forensic-phase16a-script';

// ─── Helpers de corrección estructural ───

/** Envuelve texto suelto (entre </h2> y <h2> o finales) en etiquetas <p> */
function envolverTextoSueltosEnP(html: string): string {
  // Dividir por h2, envolver el contenido entre h2s que no esté ya en <p>
  const parts = html.split(/(<h2[^>]*>.*?<\/h2>)/gis);
  const out: string[] = [];
  for (const part of parts) {
    if (/^<h2/i.test(part)) {
      out.push(part);
    } else {
      // Es texto entre h2s. Dividir por dobles saltos de línea y envolver cada bloque en <p>
      const blocks = part.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
      for (const block of blocks) {
        if (/^<p>/i.test(block)) {
          out.push(block);
        } else if (/^<(h[3-6]|ul|ol|blockquote|figure|table|div)/i.test(block)) {
          out.push(block);
        } else {
          // Texto suelto — envolver en <p>
          out.push(`<p>${block}</p>`);
        }
      }
    }
  }
  return out.join('\n');
}

/** Reemplaza <br> por cierre de <p> y apertura de <p> */
function reemplazarBrPorP(html: string): string {
  // Si hay <br> dentro de texto que no está en <p>, primero envolver
  // Reemplazar <br> (y variantes) por </p>\n<p>
  let result = html.replace(/<br\s*\/?\s*>/gi, '</p>\n<p>');
  // Si el documento no empieza con <p>, agregar uno al inicio
  if (!/^<p>/i.test(result.trim()) && !/^<h[1-6]/i.test(result.trim())) {
    // Buscar el primer </p> y asegurar que haya un <p> antes del primer texto
    const firstCloseP = result.indexOf('</p>');
    if (firstCloseP > 0 && !result.slice(0, firstCloseP).includes('<p>')) {
      result = '<p>' + result;
    }
  }
  return result;
}

/** Agrega H2 adicionales dividiendo secciones largas */
function agregarH2(html: string, minSectionWords: number = 80): string {
  const parts = html.split(/(<h2[^>]*>.*?<\/h2>)/gis);
  const out: string[] = [];
  for (const part of parts) {
    if (/^<h2/i.test(part)) {
      out.push(part);
      continue;
    }
    // Sección de texto — si es larga, dividir en 2 y agregar H2
    const words = part.split(/\s+/).filter(Boolean).length;
    if (words > minSectionWords * 2) {
      const sentences = part.split(/(?<=\.)\s+/);
      const midIdx = Math.floor(sentences.length / 2);
      const firstHalf = sentences.slice(0, midIdx).join(' ');
      const secondHalf = sentences.slice(midIdx).join(' ');
      out.push(firstHalf);
      out.push('<h2>Continúa el reportaje</h2>');
      out.push(secondHalf);
    } else {
      out.push(part);
    }
  }
  return out.join('\n');
}

// ─── Definición de las 6 correcciones A ───
interface CorreccionA {
  id: string;
  tituloAfter?: string;
  resumenAfter?: string;
  accion: 'envolver_p' | 'reemplazar_br' | 'agregar_h2' | 'resumen';
  descripcion: string;
}

const CORRECCIONES: CorreccionA[] = [
  {
    id: '1HmobwfngxeXoUofqosD',
    tituloAfter: 'Primeros bebés del Día de las Madres nacen en hospitales de Managua',
    accion: 'envolver_p',
    descripcion: 'Envolver texto suelto en <p>, corregir título truncado',
  },
  {
    id: 'JOfOW7uTxkgDSIezo7Wn',
    accion: 'reemplazar_br',
    descripcion: 'Reemplazar 7 <br> por </p><p>',
  },
  {
    id: 'i88RK0Ulgkkzyq6YV4Um',
    resumenAfter: 'Chinandega estrena 75 viviendas con servicios completos en nuevo complejo habitacional del INVUR.',
    accion: 'resumen',
    descripcion: 'Corregir resumen erróneo (era de otro artículo) + acortar a <160 chars',
  },
  {
    id: 'ic2YGP8NQAc6r3VMvy9K',
    tituloAfter: 'Venezuela: 920 víctimas y miles sin rastro tras sismos',
    accion: 'reemplazar_br',
    descripcion: 'Reemplazar 13 <br> por </p><p>, corregir título 65→54 chars',
  },
  {
    id: 'kJZTSfqmUGHJKA8SFaE8',
    accion: 'agregar_h2',
    descripcion: 'Agregar 1-2 H2 dividiendo secciones existentes',
  },
  {
    id: 'Ilzcy77tyF8oFNPytokN',
    accion: 'agregar_h2',
    descripcion: 'Agregar 2-3 H2 dividiendo secciones existentes',
  },
];

function stripHtml(h: string): string {
  return (h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function procesarCorreccion(correccion: CorreccionA): Promise<any> {
  const { id } = correccion;
  console.log(`\n--- ${id}: ${correccion.descripcion} ---`);

  const docRef = db.collection('noticias').doc(id);
  const snap = await docRef.get();
  if (!snap.exists) {
    console.log(`  ✗ Documento no existe`);
    return { id, error: 'not_found' };
  }
  const d = snap.data()!;
  const contenidoBefore = typeof d.contenido === 'string' ? d.contenido : String(d.contenido || '');
  const tituloBefore = d.titulo || '';
  const resumenBefore = d.resumen || '';
  const scoreMeniBefore = d.scoreMeni ?? null;
  const aprobadoMeniBefore = d.aprobadoMeni ?? null;

  // Aplicar corrección estructural
  let contenidoAfter = contenidoBefore;
  let tituloAfter = tituloBefore;
  let resumenAfter = resumenBefore;

  switch (correccion.accion) {
    case 'envolver_p':
      contenidoAfter = envolverTextoSueltosEnP(contenidoBefore);
      break;
    case 'reemplazar_br':
      contenidoAfter = reemplazarBrPorP(contenidoBefore);
      break;
    case 'agregar_h2':
      contenidoAfter = agregarH2(contenidoBefore);
      break;
    case 'resumen':
      // Solo resumen, no tocar contenido
      break;
  }
  if (correccion.tituloAfter) tituloAfter = correccion.tituloAfter;
  if (correccion.resumenAfter) resumenAfter = correccion.resumenAfter;

  // Sanitizar
  contenidoAfter = sanitizeArticleHtml(contenidoAfter);

  // Si no hubo cambios reales, skip
  if (contenidoAfter === contenidoBefore && tituloAfter === tituloBefore && resumenAfter === resumenBefore) {
    console.log(`  → Sin cambios reales después de sanitización. Skip.`);
    return { id, skip: true, motivo: 'sin_cambios' };
  }

  // Re-evaluar MENI
  console.log(`  Re-evaluando MENI...`);
  const input: NoticiaInput = {
    id,
    titulo: tituloAfter,
    contenido: contenidoAfter,
    resumen: resumenAfter,
    categoria: d.categoria || 'General',
    autor: d.autor || '',
    fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString() : new Date().toISOString(),
    imagen: d.imagen || undefined,
    slug: d.slug || id,
  };

  const meni = await runMeniAsync(input, { db, skipEditorBrain: true });
  const scoreMeniAfter = meni.scoreFinal;
  const aprobadoMeniAfter = meni.aprobado;
  console.log(`  MENI: ${scoreMeniBefore} → ${scoreMeniAfter} | aprobado: ${aprobadoMeniBefore} → ${aprobadoMeniAfter}`);

  // Preparar update data (campos MENI canónicos del resultado)
  const finalContenido = meni.articulo?.contenido || contenidoAfter;
  const palabras = stripHtml(finalContenido).split(/\s+/).filter(Boolean).length;
  const { fuente, fuentesComplementarias } = extractFuente(finalContenido, resumenAfter);
  const puntosClave = extractPuntosClave(finalContenido, 4);
  const autorFoto = getAutorFoto(d.autor || '');

  const updateData: Record<string, unknown> = {
    titulo: tituloAfter,
    resumen: resumenAfter,
    contenido: finalContenido,
    scoreMeni: meni.scoreFinal,
    aprobadoMeni: meni.aprobado,
    calificacionMeni: meni.calificacion,
    nivel: mapMeniScoreToNivel(meni.scoreFinal, meni.aprobado),
    nivelScore: meni.scoreFinal,
    nivelFecha: new Date().toISOString(),
    diagnosticoMeni: meni.diagnostico,
    editorialTier: meni.editorialTier,
    editorialReason: meni.editorialReason,
    recomendacionesMeni: meni.recomendaciones.map((r: any) => `${r.area}: ${r.mensaje}`),
    palabras,
    puntosClave,
    fuente: fuente || 'Redacción Nicaragua Informate',
    fuentesComplementarias,
    autorFoto,
    cambiosRealizados: admin.firestore.FieldValue.arrayUnion({
      fase: FASE,
      fecha: new Date().toISOString(),
      accion: correccion.accion,
      descripcion: correccion.descripcion,
      camposModificados: ['contenido', 'titulo', 'resumen'].filter(c =>
        (c === 'contenido' && contenidoAfter !== contenidoBefore) ||
        (c === 'titulo' && tituloAfter !== tituloBefore) ||
        (c === 'resumen' && resumenAfter !== resumenBefore)
      ),
      scoreMeniBefore, scoreMeniAfter,
      aprobadoMeniBefore, aprobadoMeniAfter,
      actor: ACTOR,
    }),
  };

  // Si MENI aprueba, restaurar estado=publicado
  if (meni.aprobado) {
    updateData.estado = 'publicado';
    updateData.publicado = true;
    console.log(`  → APROBADO. Restaurando estado=publicado`);
  }

  await docRef.update(updateData);
  console.log(`  ✓ Guardado`);

  return {
    id,
    accion: correccion.accion,
    tituloBefore, tituloAfter,
    resumenBefore: resumenBefore.slice(0, 80), resumenAfter: resumenAfter.slice(0, 80),
    contenidoChanged: contenidoAfter !== contenidoBefore,
    scoreMeniBefore, scoreMeniAfter,
    aprobadoMeniBefore, aprobadoMeniAfter,
    aprobado: meni.aprobado,
    calificacion: meni.calificacion,
    nivel: mapMeniScoreToNivel(meni.scoreFinal, meni.aprobado),
    editorialTier: meni.editorialTier,
  };
}

async function main() {
  console.log('=== FASE 16-A: 6 CORRECCIONES SIMPLES ===\n');
  const ts0 = new Date().toISOString();

  const resultados = [];
  for (const correccion of CORRECCIONES) {
    try {
      const r = await procesarCorreccion(correccion);
      resultados.push(r);
    } catch (e: any) {
      console.error(`  ERROR en ${correccion.id}: ${e.message}`);
      resultados.push({ id: correccion.id, error: e.message });
    }
  }

  // Resumen
  console.log('\n=== RESUMEN FASE 16-A ===');
  let aprobados = 0, mejoraron = 0, empeoraron = 0, sinCambios = 0, errores = 0;
  for (const r of resultados) {
    if (r.error) { errores++; continue; }
    if (r.skip) { sinCambios++; continue; }
    if (r.aprobado) aprobados++;
    if (r.scoreMeniAfter > r.scoreMeniBefore) mejoraron++;
    if (r.scoreMeniAfter < r.scoreMeniBefore) empeoraron++;
    console.log(`  ${r.id} | ${r.scoreMeniBefore} → ${r.scoreMeniAfter} | ${r.aprobado ? 'APROBADO' : 'rechazado'} | ${r.accion}`);
  }
  console.log(`\nAprobados: ${aprobados}/${CORRECCIONES.length}`);
  console.log(`Mejoraron: ${mejoraron}`);
  console.log(`Empeoraron: ${empeoraron}`);
  console.log(`Sin cambios: ${sinCambios}`);
  console.log(`Errores: ${errores}`);

  fs.writeFileSync('FORENSIC_PHASE16A_EXECUTION.json', JSON.stringify({
    fase: FASE, timestamp: ts0, actor: ACTOR,
    total: CORRECCIONES.length, resultados,
  }, null, 2));
  console.log('\n✓ FORENSIC_PHASE16A_EXECUTION.json');

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
