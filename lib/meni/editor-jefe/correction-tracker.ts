/**
 * Editor Jefe — Fase 1: Aprendizaje del Editor
 * ============================================
 * Registra correcciones manuales del editor humano,
 * detecta patrones repetitivos, y los aplica automáticamente
 * en futuras evaluaciones.
 *
 * No guarda diferencias de texto: guarda CONOCIMIENTO EDITORIAL.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { EditorPattern, CorreccionRegistrada, CampoCorreccion } from '@/lib/meni/editorial-brain/types';

const COLLECTION = 'editor_corrections';
const PATTERNS_COLLECTION = 'editor_patterns';
const MIN_CORRECTIONS_FOR_PATTERN = 3;
const MIN_CONFIDENCE = 0.6;

/**
 * Registra una corrección manual del editor.
 * Compara el texto antes/después y clasifica el tipo de cambio.
 */
export async function registerCorrection(
  db: Firestore,
  correction: Omit<CorreccionRegistrada, 'fecha' | 'diferenciaTipo'> & { fecha?: string },
): Promise<void> {
  const diferenciaTipo = classifyCorrection(correction.antes, correction.despues, correction.campo);
  const record: CorreccionRegistrada = {
    ...correction,
    fecha: correction.fecha || new Date().toISOString(),
    diferenciaTipo,
  };

  await db.collection(COLLECTION).add(record);

  // Intentar detectar patrón después de cada corrección
  await detectAndPersistPattern(db, correction.campo, correction.categoria);
}

/**
 * Clasifica el tipo de corrección basándose en el diff antes/después.
 */
function classifyCorrection(antes: string, despues: string, campo: CampoCorreccion): CorreccionRegistrada['diferenciaTipo'] {
  const lenAntes = antes.trim().length;
  const lenDespues = despues.trim().length;

  if (lenDespues < lenAntes * 0.7) return 'acortar';
  if (lenDespues > lenAntes * 1.3) {
    // Si el campo es contexto o entrada, es agregar contexto
    if (campo === 'contexto' || campo === 'entrada') return 'agregar_contexto';
    if (campo === 'servicio') return 'agregar_servicio';
    return 'ampliar';
  }
  if (campo === 'orden') return 'reordenar';
  if (campo === 'frases') return 'eliminar_relleno';

  // Heurística: si añade palabras clave de contexto
  const contextoKeywords = ['anteriormente', 'en 2024', 'en 2025', 'en 2026', 'según', 'historia', 'antecedente', 'contexto'];
  if (contextoKeywords.some(k => despues.toLowerCase().includes(k) && !antes.toLowerCase().includes(k))) {
    return 'agregar_contexto';
  }

  return 'otro';
}

/**
 * Detecta patrones en un campo específico después de suficientes correcciones.
 * Si encuentra un patrón repetido (>= MIN_CORRECTIONS_FOR_PATTERN), lo persiste.
 */
async function detectAndPersistPattern(
  db: Firestore,
  campo: CampoCorreccion,
  categoria: string,
): Promise<EditorPattern | null> {
  const snap = await db.collection(COLLECTION)
    .where('campo', '==', campo)
    .where('categoria', '==', categoria)
    .orderBy('fecha', 'desc')
    .limit(50)
    .get();

  if (snap.size < MIN_CORRECTIONS_FOR_PATTERN) return null;

  const corrections = snap.docs.map(d => d.data() as CorreccionRegistrada);

  // Agrupar por tipo de diferencia
  const byType = new Map<string, CorreccionRegistrada[]>();
  for (const c of corrections) {
    const list = byType.get(c.diferenciaTipo) || [];
    list.push(c);
    byType.set(c.diferenciaTipo, list);
  }

  // Encontrar el tipo más frecuente
  let maxType = 'otro';
  let maxCount = 0;
  for (const [type, list] of byType) {
    if (list.length > maxCount) {
      maxCount = list.length;
      maxType = type;
    }
  }

  if (maxCount < MIN_CORRECTIONS_FOR_PATTERN) return null;

  const confidence = Math.min(1, maxCount / corrections.length);
  if (confidence < MIN_CONFIDENCE) return null;

  const descripciones: Record<string, string> = {
    acortar: `El editor tiende a acortar ${campo}s largos en ${categoria}`,
    ampliar: `El editor tiende a ampliar ${campo}s cortos en ${categoria}`,
    agregar_contexto: `El editor siempre agrega contexto histórico en ${categoria}`,
    eliminar_relleno: `El editor elimina frases de relleno en ${categoria}`,
    agregar_servicio: `El editor añade servicio al lector en ${categoria}`,
    reordenar: `El editor reordena el contenido en ${categoria}`,
    otro: `El editor hace ajustes en ${campo} de ${categoria}`,
  };

  const pattern: EditorPattern = {
    campo,
    descripcion: descripciones[maxType] || `Patrón detectado en ${campo} de ${categoria}`,
    frecuencia: maxCount,
    categorias: [categoria],
    ejemploAntes: corrections[0].antes.slice(0, 200),
    ejemploDespues: corrections[0].despues.slice(0, 200),
    confianzaNivel: confidence,
    ultimaVez: corrections[0].fecha,
  };

  const patternId = `${campo}_${categoria}_${maxType}`;
  await db.collection(PATTERNS_COLLECTION).doc(patternId).set({
    ...pattern,
    updatedAt: new Date().toISOString(),
  });

  return pattern;
}

/**
 * Carga todos los patrones aprendidos desde Firestore.
 * Se llama al inicio de runEditorialBrain para aplicarlos.
 */
export async function loadEditorPatterns(db: Firestore): Promise<EditorPattern[]> {
  try {
    const snap = await db.collection(PATTERNS_COLLECTION).get();
    if (snap.empty) return [];
    return snap.docs.map(d => d.data() as unknown as EditorPattern);
  } catch {
    return [];
  }
}

/**
 * Aplica patrones aprendidos al diagnóstico editorial.
 * Genera correcciones sugeridas basadas en lo que el editor suele cambiar.
 */
export function applyPatternsToDiagnostic(
  patterns: EditorPattern[],
  categoria: string,
): { patronesAplicados: EditorPattern[]; correccionesSugeridas: string[] } {
  const relevant = patterns.filter(
    p => p.categorias.includes(categoria) || p.categorias.includes('General'),
  );

  const correccionesSugeridas = relevant.map(p => {
    const verbMap: Record<string, string> = {
      acortar: `Acortar ${p.campo} — el editor suele reducirlo (${Math.round(p.confianzaNivel * 100)}% de las veces)`,
      ampliar: `Ampliar ${p.campo} — el editor suele expandirlo`,
      agregar_contexto: `Agregar contexto histórico — el editor siempre lo añade en esta categoría`,
      eliminar_relleno: `Eliminar frases de relleno — el editor las quita sistemáticamente`,
      agregar_servicio: `Agregar servicio al lector — el editor lo incluye siempre`,
      reordenar: `Reordenar contenido — el editor cambia el orden habitualmente`,
      otro: `Revisar ${p.campo} — el editor suele ajustarlo`,
    };
    return verbMap[p.campo] || p.descripcion;
  });

  return {
    patronesAplicados: relevant,
    correccionesSugeridas,
  };
}
