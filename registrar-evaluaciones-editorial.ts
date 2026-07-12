/**
 * Registro diario de evaluaciones del Editor Jefe IA V2
 * ======================================================
 * FASE 1 de estabilización: ejecutar periódicamente para registrar
 * decisiones, puntuaciones, sugerencias y cualquier contradicción.
 *
 * No corrige automáticamente; solo registra.
 *
 * Uso:
 *   npx tsx registrar-evaluaciones-editorial.ts
 *
 * Salida:
 *   - auditoria-editorial-v2.log.jsonl  (evaluaciones completas)
 *   - auditoria-contradicciones-v2.log.jsonl  (solo contradicciones)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getAdminDb } from './lib/firebase-admin';
import { analizarNoticia, type NoticiaInput, type ResultadoAnalisis } from './lib/analizador-noticias';
import { calcularConfianzaEstructurada, generarBenchmarkEstructurado } from './lib/editor-jefe/confianza';
import { detectarDerivaEditorial, formatearAlertasDeriva } from './lib/editor-jefe/deriva';
import { promises as fs } from 'fs';
import * as path from 'path';

const EVAL_LOG = path.resolve(process.cwd(), 'auditoria-editorial-v2.log.jsonl');
const CONTR_LOG = path.resolve(process.cwd(), 'auditoria-contradicciones-v2.log.jsonl');
const DERIVA_LOG = path.resolve(process.cwd(), 'auditoria-deriva-v2.log.jsonl');
const PROCESADOS_LOG = path.resolve(process.cwd(), 'auditoria-editorial-slugs.log.jsonl');

interface ContradiccionRegistrada {
  regla: string;
  modulo: string;
  descripcion: string;
}

interface EvaluacionRegistro {
  timestamp: string;
  slug: string;
  titulo: string;
  categoria: string;
  fecha: string;
  forense: {
    aprobado: boolean;
    nivel: string;
    puntuacion: number;
  };
  filtros: Record<string, { aprobado: boolean; puntuacion: number }>;
  editorial: {
    decisionPortada: string;
    veredicto: string;
    tipoArticulo: string;
    tipoNota: string;
    puntuacion: number;
  };
  evidencia: { criterio: string; detectado: string; puntaje: number; maximo: number }[];
  sugerencias: {
    oportunidades: string[];
    referencia: string[];
    nivel10: string[];
  };
  confianza: {
    global: number;
    fuentes: number;
    verificacion: number;
    originalidad: number;
    utilidad: number;
    riesgoLegal: number;
    documentoOficial: boolean;
    tituloGenerico: boolean;
  };
  benchmark: {
    tn8: { coberturaInmediata: boolean; titularEnVivo: boolean; actualizacionRapida: boolean };
    laPrensa: { antecedentes: boolean; contrastarFuentes: boolean; documentoOficial: boolean };
    nicaraguaInformate: { servicio: boolean; contexto: boolean; contrastarFuentes: boolean; utilidad: boolean };
  };
  contradicciones: ContradiccionRegistrada[];
}

async function safeDate(value: unknown): Promise<Date | null> {
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

function detectarContradicciones(r: ResultadoAnalisis, slug: string): ContradiccionRegistrada[] {
  const contradicciones: ContradiccionRegistrada[] = [];
  const vpr = r.reporteVPR;
  if (!vpr) return contradicciones;

  if (vpr.auditoriaInterna?.observaciones?.some((o: string) => o.includes('CONTRADICCIÓN'))) {
    contradicciones.push({
      regla: 'CONTRADICCION_INTERNA_V2',
      modulo: 'lib/editor-jefe/engine.ts:verificarConsistencia',
      descripcion: `El motor V2 detectó una inconsistencia interna en ${slug}: ${vpr.auditoriaInterna.observaciones.join('; ')}`,
    });
  }

  return contradicciones;
}

async function leerSlugsProcesados(): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(PROCESADOS_LOG, 'utf-8');
    return new Set(
      raw
        .split('\n')
        .map(line => line.trim().replace(/^"|"$/g, ''))
        .filter(Boolean)
    );
  } catch {
    return new Set();
  }
}

async function appendLine(file: string, obj: unknown) {
  await fs.appendFile(file, JSON.stringify(obj) + '\n', 'utf-8');
}

async function main() {
  const db = getAdminDb();
  const slugsProcesados = await leerSlugsProcesados();

  // Últimas 200 noticias publicadas. Al ejecutar diariamente se acumulan
  // evaluaciones nuevas sin duplicar slugs ya registrados.
  const snap = await db
    .collection('noticias')
    .orderBy('fecha', 'desc')
    .limit(200)
    .get();

  const docs = snap.docs.filter(d => {
    const data = d.data();
    if (data.estado === 'borrador') return false;
    if (data.publicado === false) return false;
    return true;
  });

  let evaluadas = 0;
  let nuevas = 0;
  let totalContradicciones = 0;

  for (const doc of docs) {
    const data = doc.data();
    const slug = data.slug || doc.id;

    if (slugsProcesados.has(slug)) continue;

    const fechaDate = await safeDate(data.fecha);

    const input: NoticiaInput = {
      titulo: data.titulo || '',
      contenido: data.contenido || '',
      resumen: data.resumen || '',
      categoria: data.categoria || 'Actualidad',
      autor: data.autor || '',
      fecha: fechaDate ? fechaDate.toISOString() : '',
      slug,
      keywords: data.keywords || '',
    };

    try {
      const r = await analizarNoticia(input);
      const vpr = r.reporteVPR;
      if (!vpr) {
        console.log(`[${slug}] Sin reporte VPR, se omite.`);
        continue;
      }

      const contradicciones = detectarContradicciones(r, slug);

      const registro: EvaluacionRegistro = {
        timestamp: new Date().toISOString(),
        slug,
        titulo: input.titulo,
        categoria: input.categoria,
        fecha: fechaDate ? fechaDate.toISOString() : '',
        forense: {
          aprobado: r.nivel !== 'RECHAZADO',
          nivel: r.nivel,
          puntuacion: r.puntuacion,
        },
        filtros: Object.fromEntries(
          Object.entries(r.filtros).map(([k, f]) => [k, { aprobado: f.aprobado, puntuacion: f.puntuacion }])
        ),
        editorial: {
          decisionPortada: vpr.decisionPortada,
          veredicto: vpr.veredicto,
          tipoArticulo: vpr.tipoArticulo,
          tipoNota: vpr.tipoNota,
          puntuacion: vpr.puntuacion,
        },
        evidencia: vpr.nivelEvidencia,
        sugerencias: {
          oportunidades: vpr.oportunidadesEditoriales.map(s => s.texto),
          referencia: vpr.comoConvertirReferencia.map(s => s.texto),
          nivel10: vpr.nivel10_oportunidades.map(s => s.texto),
        },
        confianza: calcularConfianzaEstructurada(input, r),
        benchmark: generarBenchmarkEstructurado(input, r),
        contradicciones,
      };

      await appendLine(EVAL_LOG, registro);
      await fs.appendFile(PROCESADOS_LOG, slug + '\n', 'utf-8');
      slugsProcesados.add(slug);
      evaluadas++;
      nuevas++;

      if (contradicciones.length > 0) {
        totalContradicciones += contradicciones.length;
        for (const c of contradicciones) {
          await appendLine(CONTR_LOG, {
            timestamp: new Date().toISOString(),
            slug,
            titulo: input.titulo,
            ...c,
          });
        }
        console.log(`[${slug}] ⚠ ${contradicciones.length} contradicción(es) registradas.`);
      } else {
        console.log(`[${slug}] OK — ${vpr.decisionPortada} (${vpr.veredicto})`);
      }
    } catch (err) {
      console.error(`[${slug}] ERROR: ${err instanceof Error ? err.message : String(err)}`);
      await appendLine(CONTR_LOG, {
        timestamp: new Date().toISOString(),
        slug,
        titulo: input.titulo,
        regla: 'ERROR_EVALUACION',
        modulo: 'registrar-evaluaciones-editorial.ts',
        descripcion: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log('\n=== Resumen ===');
  console.log(`Notas evaluadas en esta corrida: ${evaluadas}`);
  console.log(`Notas nuevas registradas: ${nuevas}`);
  console.log(`Contradicciones detectadas: ${totalContradicciones}`);
  console.log(`Total slugs en registro: ${slugsProcesados.size}`);
  console.log(`Archivos:`);
  console.log(`  ${EVAL_LOG}`);
  console.log(`  ${CONTR_LOG}`);
  console.log(`  ${DERIVA_LOG}`);
  console.log(`  ${PROCESADOS_LOG}`);

  // FASE 2.6 — Detector de Deriva Editorial
  try {
    const evaluacionesHistoricas = await cargarEvaluacionesLog();
    const alertas = detectarDerivaEditorial(evaluacionesHistoricas);

    if (alertas.length > 0) {
      await appendLine(DERIVA_LOG, {
        timestamp: new Date().toISOString(),
        totalEvaluaciones: evaluacionesHistoricas.length,
        alertas,
      });
      console.log('\n=== Detector de Deriva Editorial ===');
      console.log(formatearAlertasDeriva(alertas));
    } else {
      console.log('\n=== Detector de Deriva Editorial ===');
      console.log('No se detectó deriva editorial en el período analizado.');
    }
  } catch (err) {
    console.error('Error detectando deriva editorial:', err instanceof Error ? err.message : String(err));
  }
}

async function cargarEvaluacionesLog(): Promise<EvaluacionRegistro[]> {
  try {
    const raw = await fs.readFile(EVAL_LOG, 'utf-8');
    const porSlug = new Map<string, EvaluacionRegistro>();
    raw
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        try { return JSON.parse(line) as EvaluacionRegistro; } catch { return null; }
      })
      .filter((r): r is EvaluacionRegistro => r !== null && !!r.slug)
      .forEach(r => porSlug.set(r.slug, r)); // mantiene la última ocurrencia
    return Array.from(porSlug.values());
  } catch {
    return [];
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
