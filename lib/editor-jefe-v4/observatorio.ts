/**
 * Observatorio Editorial V4.1 — FASE DE OBSERVACIÓN
 * ================================================
 * Registra la decisión del motor vs la decisión del editor humano.
 * No modifica el motor. Solo observa y aprende.
 */

import { getAdminDb } from '../firebase-admin';

export interface EditorialDecision {
  // Identificación
  slug: string;
  titulo: string;
  categoria: string;
  fechaPublicacion: string;
  editor: string; // nombre del editor humano
  
  // Decisión del motor
  motorDecision: {
    score: number;
    veredicto: string;
    scoresPorModulo: {
      seo: number;
      eeat: number;
      forense: number;
      adsense: number;
      discover: number;
      valorEditorial: number;
    };
    reglasActivadas: string[]; // reglas que penalizaron
    reglasNegativas: string[]; // reglas que no se dispararon pero podrían haberlo
    explainability: string[]; // recomendaciones completas
    tiempoMs: number;
  };
  
  // Decisión del editor humano
  editorDecision: {
    veredicto: string; // lo que el editor finalmente decidió
    razon: string; // por qué el editor cambió o confirmó la decisión
  };
  
  // Diferencia
  diferencia: {
    coinciden: boolean;
    tipo: 'coincidencia' | 'editor_sobre_motor' | 'motor_sobre_editor' | 'cambio_categoria';
    deltaScore?: number; // si el editor ajustó el score manualmente
  };
  
  // Timestamp
  timestamp: string;
}

/**
 * Registra la decisión del motor vs la decisión del editor humano.
 * Se llama cuando el editor publica o cambia el veredicto de un artículo.
 */
export async function recordEditorialDecision(decision: EditorialDecision): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection('editorial_decisions').doc(decision.slug).set(decision);
  } catch (error) {
    console.error('[observatorio] Error registrando decisión:', error);
  }
}

/**
 * Recupera el historial de decisiones editoriales.
 */
export async function getEditorialDecisions(limit = 100): Promise<EditorialDecision[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('editorial_decisions')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map(doc => doc.data() as EditorialDecision);
  } catch (error) {
    console.error('[observatorio] Error leyendo decisiones:', error);
    return [];
  }
}

/**
 * Recupera decisiones por categoría.
 */
export async function getDecisionsByCategory(categoria: string, limit = 100): Promise<EditorialDecision[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('editorial_decisions')
      .where('categoria', '==', categoria)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map(doc => doc.data() as EditorialDecision);
  } catch (error) {
    console.error('[observatorio] Error leyendo por categoría:', error);
    return [];
  }
}

/**
 * Recupera decisiones donde el motor y el editor discreparon.
 */
export async function getDisagreements(limit = 100): Promise<EditorialDecision[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('editorial_decisions')
      .where('diferencia.coinciden', '==', false)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    return snapshot.docs.map(doc => doc.data() as EditorialDecision);
  } catch (error) {
    console.error('[observatorio] Error leyendo discrepancias:', error);
    return [];
  }
}

/**
 * Calcula estadísticas de discrepancias por categoría.
 */
export async function getDisagreementStats(): Promise<{
  total: number;
  coincidencias: number;
  discrepancias: number;
  porcentajeCoincidencia: number;
  porCategoria: Record<string, { total: number; discrepancias: number; porcentaje: number }>;
  diferenciasMasFrecuentes: { motor: string; editor: string; frecuencia: number }[];
}> {
  const decisions = await getEditorialDecisions(1000);
  const total = decisions.length;
  const coincidencias = decisions.filter(d => d.diferencia.coinciden).length;
  const discrepancias = total - coincidencias;
  
  const porCategoria: Record<string, { total: number; discrepancias: number; porcentaje: number }> = {};
  const diffMap: Record<string, number> = {};
  
  for (const d of decisions) {
    const cat = d.categoria;
    if (!porCategoria[cat]) {
      porCategoria[cat] = { total: 0, discrepancias: 0, porcentaje: 0 };
    }
    porCategoria[cat].total++;
    if (!d.diferencia.coinciden) {
      porCategoria[cat].discrepancias++;
    }
    porCategoria[cat].porcentaje = (porCategoria[cat].discrepancias / porCategoria[cat].total) * 100;
    
    // Registrar patrones de diferencia
    if (!d.diferencia.coinciden) {
      const key = `${d.motorDecision.veredicto} -> ${d.editorDecision.veredicto}`;
      diffMap[key] = (diffMap[key] || 0) + 1;
    }
  }
  
  const diferenciasMasFrecuentes = Object.entries(diffMap)
    .map(([key, frecuencia]) => {
      const [motor, editor] = key.split(' -> ');
      return { motor, editor, frecuencia };
    })
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .slice(0, 20);
  
  return {
    total,
    coincidencias,
    discrepancias,
    porcentajeCoincidencia: total > 0 ? (coincidencias / total) * 100 : 0,
    porCategoria,
    diferenciasMasFrecuentes,
  };
}

/**
 * Detecta patrones de errores reales (10+ artículos con el mismo problema).
 */
export async function detectErrorPatterns(): Promise<{
  patrones: {
    categoria: string;
    regla: string;
    frecuencia: number;
    descripcion: string;
  }[];
}> {
  const decisions = await getEditorialDecisions(1000);
  const patternMap: Record<string, { categoria: string; regla: string; frecuencia: number }> = {};
  
  for (const d of decisions) {
    // Si el editor sobre-escribió al motor, buscar qué regla causó la discrepancia
    if (!d.diferencia.coinciden && d.diferencia.tipo === 'motor_sobre_editor') {
      for (const regla of d.motorDecision.reglasActivadas) {
        const key = `${d.categoria}|${regla}`;
        if (!patternMap[key]) {
          patternMap[key] = { categoria: d.categoria, regla, frecuencia: 0 };
        }
        patternMap[key].frecuencia++;
      }
    }
  }
  
  const patrones = Object.values(patternMap)
    .filter(p => p.frecuencia >= 10)
    .map(p => ({
      ...p,
      descripcion: `La regla "${p.regla}" en ${p.categoria} causó discrepancia en ${p.frecuencia} artículos`,
    }))
    .sort((a, b) => b.frecuencia - a.frecuencia);
  
  return { patrones };
}

/**
 * Calcula el porcentaje de contribución de cada módulo al score final.
 */
export async function getModuleContributionStats(): Promise<{
  promedioPorModulo: {
    seo: number;
    eeat: number;
    forense: number;
    adsense: number;
    discover: number;
    valorEditorial: number;
  };
  modulosEnDesacuerdo: number;
}> {
  const decisions = await getEditorialDecisions(1000);
  
  if (decisions.length === 0) {
    return {
      promedioPorModulo: { seo: 0, eeat: 0, forense: 0, adsense: 0, discover: 0, valorEditorial: 0 },
      modulosEnDesacuerdo: 0,
    };
  }
  
  const sum = { seo: 0, eeat: 0, forense: 0, adsense: 0, discover: 0, valorEditorial: 0 };
  let modulosEnDesacuerdo = 0;
  
  for (const d of decisions) {
    sum.seo += d.motorDecision.scoresPorModulo.seo;
    sum.eeat += d.motorDecision.scoresPorModulo.eeat;
    sum.forense += d.motorDecision.scoresPorModulo.forense;
    sum.adsense += d.motorDecision.scoresPorModulo.adsense;
    sum.discover += d.motorDecision.scoresPorModulo.discover;
    sum.valorEditorial += d.motorDecision.scoresPorModulo.valorEditorial;
    
    // Detectar si algún módulo está en desacuerdo (score muy bajo vs otros)
    const scores = Object.values(d.motorDecision.scoresPorModulo);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const lowModules = scores.filter(s => s < avg - 20).length;
    if (lowModules >= 2) {
      modulosEnDesacuerdo++;
    }
  }
  
  const n = decisions.length;
  return {
    promedioPorModulo: {
      seo: sum.seo / n,
      eeat: sum.eeat / n,
      forense: sum.forense / n,
      adsense: sum.adsense / n,
      discover: sum.discover / n,
      valorEditorial: sum.valorEditorial / n,
    },
    modulosEnDesacuerdo: (modulosEnDesacuerdo / n) * 100,
  };
}
