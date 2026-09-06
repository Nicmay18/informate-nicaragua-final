/**
 * NIOS — Sala de Expertos.
 *
 * Registro declarativo de los expertos y su dominio de responsabilidad.
 * Este archivo NO contiene logica de estado: solo define quien es
 * responsable de que. El estado se calcula en `probes.ts` con evidencia real.
 */

import type { ExpertId, SwissPriority } from './types';

export interface ExpertDefinition {
  id: ExpertId;
  name: string;
  domain: string;
  /** Prioridad base del experto segun la seccion 49 (orden de ejecucion). */
  basePriority: SwissPriority;
  /** Orden de ejecucion declarado en la seccion 49 del protocolo. */
  executionOrder: number;
  /** Responsabilidades concretas y accionables. */
  responsibilities: string[];
}

/**
 * Sala de expertos completa.
 * El orden refleja la prioridad de ejecucion de la seccion 49:
 * infraestructura, errores criticos, Firebase, NIOS, MENI, AdSense,
 * SEO, UX, velocidad, distribucion, monetizacion, crecimiento, refinamiento.
 */
export const EXPERTS: ExpertDefinition[] = [
  {
    id: 'CEO',
    name: 'CEO / Orchestrator',
    domain: 'Direccion de NIOS: prioridades, delegacion, verificacion y aprendizaje.',
    basePriority: 'P0',
    executionOrder: 1,
    responsibilities: [
      'Establecer prioridades y asignar tareas a los expertos',
      'Evitar duplicacion de trabajo entre expertos',
      'Detectar cuellos de botella y escalar bloqueos',
      'Cerrar el ciclo OBSERVE -> PRIORITIZE -> DELEGATE -> EXECUTE -> VERIFY -> LEARN',
    ],
  },
  {
    id: 'RELIABILITY',
    name: 'Reliability',
    domain: 'Heartbeat, health checks, recuperacion, alertas y snapshots.',
    basePriority: 'P0',
    executionOrder: 2,
    responsibilities: [
      'Mantener heartbeat fresco por componente',
      'Detectar, registrar, diagnosticar y recuperar fallos',
      'Escalar cuando la recuperacion automatica no es segura',
    ],
  },
  {
    id: 'WATCHDOG',
    name: 'Watchdog',
    domain: 'Vigilancia activa de procesos, jobs colgados y componentes stale.',
    basePriority: 'P0',
    executionOrder: 3,
    responsibilities: [
      'Detectar componentes con heartbeat vencido',
      'Reencolar trabajo perdido de forma idempotente',
      'Abrir incidentes cuando la recuperacion falla',
    ],
  },
  {
    id: 'CRONS',
    name: 'Crons',
    domain: 'Programacion, ejecucion, resultado y reintento de los cron jobs.',
    basePriority: 'P0',
    executionOrder: 4,
    responsibilities: [
      'Garantizar que cada cron declarado tenga proposito, auth e idempotencia',
      'Registrar resultado de cada ejecucion',
      'Detectar fallos y aplicar retry o escalado',
    ],
  },
  {
    id: 'SECURITY',
    name: 'Security',
    domain: 'Secretos, autenticacion, autorizacion, reglas, CSP y dependencias.',
    basePriority: 'P0',
    executionOrder: 5,
    responsibilities: [
      'Mantener secretos fuera del repositorio',
      'Proteger APIs de administracion y cron',
      'Evaluar vulnerabilidades de dependencias por impacto en runtime',
    ],
  },
  {
    id: 'FIREBASE',
    name: 'Firebase',
    domain: 'Inicializacion del Admin SDK, credenciales y Storage.',
    basePriority: 'P0',
    executionOrder: 6,
    responsibilities: [
      'Garantizar inicializacion correcta del Admin SDK',
      'Validar credenciales sin exponerlas',
      'Mantener Storage y reglas coherentes',
    ],
  },
  {
    id: 'FIRESTORE',
    name: 'Firestore',
    domain: 'Colecciones, indices, lecturas, escrituras, retencion y limpieza.',
    basePriority: 'P1',
    executionOrder: 7,
    responsibilities: [
      'Evitar colecciones innecesarias y basura historica',
      'Garantizar consistencia de lecturas y escrituras',
      'Aplicar politicas de retencion y limpieza',
    ],
  },
  {
    id: 'MENI',
    name: 'MENI',
    domain: 'Motor editorial: scoring contextual, diagnostico y forense.',
    basePriority: 'P1',
    executionOrder: 8,
    responsibilities: [
      'Evaluar por genero periodistico, no con plantilla unica',
      'Eliminar falsos positivos y falsos negativos de scoring',
      'Detectar afirmaciones sin fuente e inconsistencias',
      'No inventar informacion para mejorar el score',
    ],
  },
  {
    id: 'EDITORIAL',
    name: 'Editorial / Periodismo',
    domain: 'Redaccion, precision, contexto, atribucion y utilidad.',
    basePriority: 'P1',
    executionOrder: 9,
    responsibilities: [
      'Mejorar titulares, estructura y contexto',
      'Verificar atribucion, fechas, nombres, lugares y cifras',
      'Prohibir sensacionalismo y especulacion presentada como hecho',
    ],
  },
  {
    id: 'ADSENSE_READINESS',
    name: 'AdSense Readiness',
    domain: 'Evaluacion objetiva de preparacion para solicitar revision de AdSense.',
    basePriority: 'P1',
    executionOrder: 10,
    responsibilities: [
      'Revisar el sitio completo, no una sola pagina',
      'Identificar bloqueadores internos concretos y su politica relacionada',
      'Declarar READY_FOR_REVIEW solo con cero bloqueadores internos',
      'No prometer nunca la aprobacion de Google',
    ],
  },
  {
    id: 'SEO',
    name: 'SEO / Google',
    domain: 'Sitemap, robots, canonical, metadata, schema e indexacion.',
    basePriority: 'P2',
    executionOrder: 11,
    responsibilities: [
      'Garantizar descubribilidad e indexabilidad',
      'Mantener JSON-LD NewsArticle y breadcrumbs validos',
      'Detectar paginas huerfanas, 404 y redirecciones',
    ],
  },
  {
    id: 'GOOGLE_INTELLIGENCE',
    name: 'Google Intelligence',
    domain: 'GA4 y Search Console convertidos en decisiones.',
    basePriority: 'P1',
    executionOrder: 12,
    responsibilities: [
      'Recolectar metricas reales de GSC y GA4',
      'Convertir datos en tareas editoriales concretas',
      'No declarar datos reales sin respuesta verificada de la API',
    ],
  },
  {
    id: 'UX',
    name: 'UX / Producto',
    domain: 'Navegacion, jerarquia, lectura, movil, busqueda y descubrimiento.',
    basePriority: 'P2',
    executionOrder: 13,
    responsibilities: [
      'Revisar el sitio como un lector real',
      'Garantizar navegacion clara y busqueda funcional',
      'Evitar elementos molestos y paginas innecesarias',
    ],
  },
  {
    id: 'PERFORMANCE',
    name: 'Performance',
    domain: 'JavaScript, CSS, imagenes, cache, bundle y Core Web Vitals.',
    basePriority: 'P2',
    executionOrder: 14,
    responsibilities: [
      'Optimizar para telefonos y conexiones reales',
      'Reducir bundle y trabajo en el hilo principal',
      'Mantener cache y streaming coherentes',
    ],
  },
  {
    id: 'DESIGN',
    name: 'Design',
    domain: 'Identidad visual, tipografia, componentes y consistencia.',
    basePriority: 'P3',
    executionOrder: 15,
    responsibilities: [
      'Mantener coherencia visual y jerarquia',
      'Eliminar componentes abandonados y estilos contradictorios',
      'Garantizar accesibilidad y responsive',
    ],
  },
  {
    id: 'DISTRIBUTION',
    name: 'Distribution',
    domain: 'Facebook, Telegram, WhatsApp, X, OneSignal e IndexNow.',
    basePriority: 'P1',
    executionOrder: 16,
    responsibilities: [
      'Garantizar el ciclo publicacion -> distribucion -> confirmacion -> retry -> registro',
      'No perder silenciosamente ninguna distribucion',
      'Evitar duplicados al reintentar',
    ],
  },
  {
    id: 'MONETIZATION',
    name: 'Monetization',
    domain: 'AdSense, RPM, CTR, posiciones y oportunidades comerciales.',
    basePriority: 'P2',
    executionOrder: 17,
    responsibilities: [
      'Medir rendimiento por pagina y dispositivo',
      'Detectar paginas con trafico y baja monetizacion',
      'No sacrificar UX ni arriesgar politicas por ingresos',
    ],
  },
  {
    id: 'CODEBASE',
    name: 'Codebase',
    domain: 'Archivos obsoletos, codigo muerto, duplicacion y documentacion.',
    basePriority: 'P2',
    executionOrder: 18,
    responsibilities: [
      'Detectar imports muertos y endpoints sin consumidor',
      'Actualizar archivos desactualizados respecto al sistema real',
      'Eliminar duplicacion cuando sea seguro',
    ],
  },
  {
    id: 'DEVELOPMENT',
    name: 'Development',
    domain: 'Implementacion de funciones faltantes, tipos, tests y observabilidad.',
    basePriority: 'P2',
    executionOrder: 19,
    responsibilities: [
      'Programar funciones necesarias en lugar de dejar TODO',
      'Añadir tipos, validaciones y manejo de errores',
      'Mantener tests y logging utiles',
    ],
  },
];

/** Mapa de acceso rapido por id. */
export const EXPERT_BY_ID: Record<ExpertId, ExpertDefinition> = EXPERTS.reduce(
  (acc, expert) => {
    acc[expert.id] = expert;
    return acc;
  },
  {} as Record<ExpertId, ExpertDefinition>,
);

/** Devuelve la definicion de un experto o lanza si el id no existe. */
export function getExpert(id: ExpertId): ExpertDefinition {
  const expert = EXPERT_BY_ID[id];
  if (!expert) throw new Error(`Experto desconocido: ${id}`);
  return expert;
}
