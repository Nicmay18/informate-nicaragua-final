/**
 * Explainability V4 — REGLA 10
 * =============================
 * Cada punto perdido debe decir: regla, párrafo, motivo, cómo solucionarlo.
 * Nunca "Falta contexto." Debe decir "No se encontró X entre los párrafos Y y Z."
 */

import type {
  ArticleEvidence,
  NormalizedResults,
  EditorialProfile,
  ExplainabilityItem,
} from './types';

export function generateExplainability(
  evidence: ArticleEvidence,
  _results: NormalizedResults,
  profile: EditorialProfile,
): ExplainabilityItem[] {
  const items: ExplainabilityItem[] = [];
  const texto = evidence.textoPlano;
  const parrafos = evidence.parrafos;

  // ── Evidencia faltante ──────────────────────
  for (const [key, regex] of Object.entries(profile.requiredEvidence)) {
    if (!regex.test(texto)) {
      const parrafoReferencia = findBestParagraph(parrafos, key);
      items.push({
        regla: `requiredEvidence.${key}`,
        parrafo: parrafoReferencia,
        motivo: `No se encontró el patrón "${key}" en el contenido del artículo. Se buscó con la expresión regular del perfil de ${profile.categoria}.`,
        solucion: getSolutionForEvidence(key, profile.categoria),
        puntosPerdidos: 0, // Se calcula en el engine
      });
    }
  }

  // ── Contexto faltante ───────────────────────
  const contextFound = profile.requiredContext.patrones.some(r => r.test(texto));
  if (!contextFound) {
    items.push({
      regla: 'requiredContext',
      parrafo: parrafos.length > 1 ? `Párrafos 1-${parrafos.length}` : 'Párrafo 1',
      motivo: `No se encontró contexto de tipo "${profile.requiredContext.tipo}" en el artículo. Se buscaron patrones contextuales del perfil de ${profile.categoria}.`,
      solucion: `Agregar contexto sobre ${profile.requiredContext.tipo} citando fuentes o antecedentes relevantes.`,
      puntosPerdidos: 0,
    });
  }

  // ── Utilidad faltante ───────────────────────
  const utilityFound = profile.requiredUtility.preguntas.some(p =>
    new RegExp(p, 'i').test(texto)
  );
  if (!utilityFound) {
    items.push({
      regla: 'requiredUtility',
      parrafo: parrafos.length > 0 ? `Párrafo ${Math.min(2, parrafos.length)}` : 'Párrafo 1',
      motivo: `El artículo no responde claramente las preguntas clave de ${profile.categoria}: ${profile.requiredUtility.preguntas.join(', ')}.`,
      solucion: `Estructurar el contenido para responder: ${profile.requiredUtility.preguntas.slice(0, 3).join(', ')}.`,
      puntosPerdidos: 0,
    });
  }

  // ── Fuentes faltantes ───────────────────────
  if (evidence.sources.numeroFuentes === 0) {
    items.push({
      regla: 'sources.numeroFuentes',
      parrafo: parrafos.length > 1 ? `Párrafos 2-${Math.min(4, parrafos.length)}` : 'Párrafo 1',
      motivo: 'No se detectaron fuentes oficiales identificables en el artículo. Las fuentes aceptadas para esta categoría son: ' + profile.allowedSources.slice(0, 5).join(', ') + '.',
      solucion: `Citar al menos una fuente de: ${profile.allowedSources.slice(0, 3).join(', ')}.`,
      puntosPerdidos: 0,
    });
  }

  // ── Atribuciones falsas ─────────────────────
  if (evidence.eeat.tieneAtribucionesFalsas) {
    const parrafoAtribucion = findParagraphWith(parrafos, /seg[uú]n\s+fuentes?\s+an[oó]nimas?|trascendi[oó]|al\s+parecer/i);
    items.push({
      regla: 'eeat.atribucionesFalsas',
      parrafo: parrafoAtribucion || 'Párrafo no identificado',
      motivo: 'Se detectaron atribuciones vagas o anónimas en el artículo. Esto viola el principio de verificabilidad editorial.',
      solucion: 'Reemplazar "según fuentes anónimas" con una fuente identificable por nombre o institución.',
      puntosPerdidos: 0,
    });
  }

  // ── Datos concretos insuficientes ───────────
  if (!evidence.evidence.esNotaVerificable) {
    items.push({
      regla: 'evidence.esNotaVerificable',
      parrafo: parrafos.length > 1 ? `Párrafos 2-${Math.min(4, parrafos.length)}` : 'Párrafo 1',
      motivo: `Densidad de datos verificables insuficiente. Se encontraron ${evidence.evidence.datosConcretos.fechas} fechas, ${evidence.evidence.datosConcretos.cifras} cifras, ${evidence.evidence.datosConcretos.lugares} lugares y ${evidence.evidence.datosConcretos.nombres} nombres propios.`,
      solucion: 'Incluir al menos 3 datos verificables (fechas, cifras, lugares o nombres propios) en el contenido.',
      puntosPerdidos: 0,
    });
  }

  // ── Párrafos sin dato ───────────────────────
  if (evidence.valorEditorial.parrafosSinDato > 0 && evidence.valorEditorial.parrafosTotal > 0) {
    const ratio = evidence.valorEditorial.parrafosSinDato / evidence.valorEditorial.parrafosTotal;
    if (ratio > 0.4) {
      items.push({
        regla: 'valorEditorial.parrafosSinDato',
        parrafo: `Párrafos 2-${evidence.valorEditorial.parrafosTotal}`,
        motivo: `${evidence.valorEditorial.parrafosSinDato} de ${evidence.valorEditorial.parrafosTotal} párrafos no contienen datos verificables (cifras, nombres propios o instituciones).`,
        solucion: 'Cada párrafo debe contener al menos un dato verificable: cifra, nombre propio, institución o fecha.',
        puntosPerdidos: 0,
      });
    }
  }

  // ── Contenido corto ─────────────────────────
  if (evidence.adsense.palabraCount < 300) {
    items.push({
      regla: 'adsense.palabraCount',
      parrafo: 'Artículo completo',
      motivo: `El artículo tiene ${evidence.adsense.palabraCount} palabras. El mínimo recomendado es 300 para evitar clasificación como thin content.`,
      solucion: 'Ampliar el contenido a al menos 300 palabras con información relevante y verificable.',
      puntosPerdidos: 0,
    });
  }

  // ── Sin imagen ──────────────────────────────
  if (!evidence.discover.tieneImagen) {
    items.push({
      regla: 'discover.tieneImagen',
      parrafo: 'N/A (metadata del artículo)',
      motivo: 'El artículo no tiene imagen destacada. Esto afecta la distribución en Google Discover y redes sociales.',
      solucion: 'Agregar una imagen destacada de calidad con texto alternativo descriptivo.',
      puntosPerdidos: 0,
    });
  }

  // ── Sin autor visible ───────────────────────
  if (!evidence.eeat.autorVisible) {
    items.push({
      regla: 'eeat.autorVisible',
      parrafo: 'N/A (metadata del artículo)',
      motivo: `El autor del artículo es "${evidence.eeat.autor}" que no cumple con los criterios de visibilidad (nombre completo, no genérico).`,
      solucion: 'Usar el nombre completo del autor en lugar de "Redacción" o genéricos.',
      puntosPerdidos: 0,
    });
  }

  return items;
}

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────

function findBestParagraph(parrafos: string[], key: string): string {
  if (parrafos.length === 0) return 'Sin párrafos detectados';
  if (parrafos.length === 1) return 'Párrafo 1';
  const lowerKey = key.toLowerCase();
  for (let i = 0; i < parrafos.length; i++) {
    if (parrafos[i].toLowerCase().includes(lowerKey)) {
      return `Párrafo ${i + 1}`;
    }
  }
  return `Párrafos 2-${Math.min(4, parrafos.length)}`;
}

function findParagraphWith(parrafos: string[], regex: RegExp): string | null {
  for (let i = 0; i < parrafos.length; i++) {
    if (regex.test(parrafos[i])) {
      return `Párrafo ${i + 1}`;
    }
  }
  return null;
}

function getSolutionForEvidence(key: string, categoria: string): string {
  const solutions: Record<string, string> = {
    queOcurrio: 'Incluir una descripción clara del evento en el primer párrafo.',
    donde: 'Especificar la ubicación exacta: barrio, municipio, carretera o km.',
    cuando: 'Incluir la fecha y hora del evento.',
    estadoActual: 'Mencionar el estado de la investigación o seguimiento.',
    seguimiento: 'Indicar si habrá actualizaciones en próximas horas.',
    impacto: 'Cifrar el número de heridos, fallecidos o afectados.',
    resultado: 'Incluir el marcador final del partido.',
    tabla: 'Mencionar la posición del equipo en la tabla.',
    estadisticas: 'Agregar estadísticas del partido: goles, posesión, etc.',
    proximoPartido: 'Indicar el próximo rival y fecha.',
    figura: 'Mencionar al jugador destacado del partido.',
    especificaciones: 'Incluir especificaciones técnicas: RAM, procesador, cámara.',
    precio: 'Incluir el precio del producto en córdobas o dólares.',
    queCambia: 'Comparar con el modelo o versión anterior.',
    disponibilidad: 'Indicar dónde y desde cuándo está disponible.',
    compatibilidad: 'Mencionar sistemas compatibles o conectividad.',
    municipios: 'Listar los municipios o departamentos afectados.',
    fenomeno: 'Identificar el fenómeno climático por su nombre.',
    rios: 'Mencionar ríos, cuencas o cuerpos de agua afectados.',
    comunidades: 'Cifrar el número de viviendas o familias afectadas.',
    recomendaciones: 'Incluir recomendaciones de seguridad de INETER o SINAPRED.',
    enfermedad: 'Identificar la enfermedad por su nombre médico.',
    cifras: 'Incluir número de casos confirmados.',
    fuente: 'Citar al MINSa, hospital o médico con nombre.',
    ubicacion: 'Especificar barrios o municipios afectados.',
    evento: 'Nombrar el evento cultural o artístico.',
    artista: 'Identificar al artista o grupo con nombre.',
    lugar: 'Especificar el teatro, galería o recinto del evento.',
    fecha: 'Incluir la fecha y hora del evento.',
  };
  return solutions[key] || `Agregar la información requerida para "${key}" según el perfil de ${categoria}.`;
}
