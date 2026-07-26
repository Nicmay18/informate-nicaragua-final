/**
 * Context Engine — Detecta personas, lugares, instituciones, fechas
 * y decide qué contexto necesita el lector.
 */

import type { IntelligenceEngineInput, ContextDecision, Entity } from './types';

const DEPARTAMENTOS_NI = [
  'Managua', 'León', 'Granada', 'Masaya', 'Chinandega', 'Estelí',
  'Matagalpa', 'Jinotega', 'Rivas', 'Carazo', 'Tipitapa', 'Chontales',
  'Boaco', 'Nueva Segovia', 'Madriz', 'Río San Juan', 'RAAN', 'RAAS',
  'Bluefields', 'Corn Island', 'San Carlos', 'Juigalpa',
];

const INSTITUCIONES_NI: Record<string, string> = {
  'Policía Nacional': 'Cuerpo policial de Nicaragua',
  'Ejército de Nicaragua': 'Fuerza militar de Nicaragua',
  'MINED': 'Ministerio de Educación',
  'MINSA': 'Ministerio de Salud',
  'INETER': 'Instituto Nicaragüense de Estudios Territoriales',
  'MIFIC': 'Ministerio de Fomento, Industria y Comercio',
  'INSS': 'Instituto Nicaragüense de Seguridad Social',
  'CSE': 'Consejo Supremo Electoral',
  'BCN': 'Banco Central de Nicaragua',
  'ENATREL': 'Empresa Nacional de Transmisión Eléctrica',
  'ENACAL': 'Empresa Nicaragüense de Acueductos y Alcantarillados',
  'INTUR': 'Instituto Nicaragüense de Turismo',
  'INIDE': 'Instituto Nacional de Información de Desarrollo',
  'Procuraduría': 'Procuraduría General de la República',
  'Contraloría': 'Contraloría General de la República',
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectPersonas(text: string): string[] {
  const personas = new Set<string>();
  const patterns = [
    /\b(?:presidente|directora?|alcaldesa?|ministra|ministro|gobernadora?|comandante|coronel|capitán|general|doctora?|ingeniera?|licenciada?)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/g,
    /\bsegún\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/g,
    /\b(?:informó|confirmó|dijo|declaró|anunció|señaló)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/g,
  ];
  for (const p of patterns) {
    let m: RegExpExecArray | null;
    while ((m = p.exec(text)) !== null) {
      const nombre = m[1].trim();
      if (nombre.length > 5 && !['Nicaragua', 'Managua', 'Informate'].includes(nombre)) {
        personas.add(nombre);
      }
    }
  }
  return [...personas].slice(0, 10);
}

function detectLugares(text: string): string[] {
  const lugares = new Set<string>();
  for (const dep of DEPARTAMENTOS_NI) {
    const regex = new RegExp(`\\b${dep}\\b`, 'gi');
    if (regex.test(text)) lugares.add(dep);
  }
  const barrioPattern = /\b(barrio|colonia|residencial|sector|comunidad)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/g;
  let m: RegExpExecArray | null;
  while ((m = barrioPattern.exec(text)) !== null) {
    lugares.add(`${m[1]} ${m[2]}`.trim());
  }
  const carreteraPattern = /\b(carretera|autopista|km\.?)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){0,2})/g;
  while ((m = carreteraPattern.exec(text)) !== null) {
    lugares.add(`${m[1]} ${m[2]}`.trim());
  }
  return [...lugares].slice(0, 10);
}

function detectInstituciones(text: string): string[] {
  const instituciones = new Set<string>();
  for (const nombre of Object.keys(INSTITUCIONES_NI)) {
    const regex = new RegExp(`${nombre}`, 'i');
    if (regex.test(text)) instituciones.add(nombre);
  }
  const siglaPattern = /\b([A-Z]{3,6})\b/g;
  let m: RegExpExecArray | null;
  while ((m = siglaPattern.exec(text)) !== null) {
    const sigla = m[1];
    if (INSTITUCIONES_NI[sigla]) instituciones.add(sigla);
  }
  return [...instituciones].slice(0, 10);
}

function detectFechas(text: string): string[] {
  const fechas = new Set<string>();
  const patterns = [
    /\b(\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4})\b/gi,
    /\b(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\s+(\d{1,2}\s+de\s+[a-záéíóúñ]+)/gi,
    /\b(hoy|ayer|anteayer|esta\s+semana|este\s+mes|este\s+año)\b/gi,
    /\b(\d{1,2}:\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)?/gi,
  ];
  for (const p of patterns) {
    let m: RegExpExecArray | null;
    while ((m = p.exec(text)) !== null) {
      fechas.add(m[0].trim());
    }
  }
  return [...fechas].slice(0, 10);
}

function detectCifras(text: string): string[] {
  const cifras = new Set<string>();
  const patterns = [
    /\b\d+(?:\.\d{3})*(?:,\d+)?\s*(córdobas?|dólares?|kilos?|metros?|km|hectáreas?|personas?|familias?|millones?|mil)\b/gi,
    /\b\d+\s*%\b/g,
  ];
  for (const p of patterns) {
    let m: RegExpExecArray | null;
    while ((m = p.exec(text)) !== null) {
      cifras.add(m[0].trim());
    }
  }
  return [...cifras].slice(0, 10);
}

function buildEntities(
  personas: string[],
  lugares: string[],
  instituciones: string[],
  fechas: string[],
  cifras: string[],
): Entity[] {
  const entities: Entity[] = [];
  for (const p of personas) entities.push({ text: p, type: 'persona', needsExplanation: false });
  for (const l of lugares) entities.push({ text: l, type: 'lugar', needsExplanation: false });
  for (const inst of instituciones) {
    const desc = INSTITUCIONES_NI[inst];
    entities.push({ text: inst, type: 'institucion', needsExplanation: !!desc, explanation: desc });
  }
  for (const f of fechas) entities.push({ text: f, type: 'fecha', needsExplanation: false });
  for (const c of cifras) entities.push({ text: c, type: 'cifra', needsExplanation: false });
  return entities;
}

function decideContextoRequerido(
  personas: string[],
  lugares: string[],
  instituciones: string[],
  textoPlano: string,
): string[] {
  const ctx: string[] = [];
  if (lugares.length > 0) {
    ctx.push(`Ubicación geográfica de ${lugares[0]} en el contexto nacional`);
  }
  if (instituciones.length > 0) {
    for (const inst of instituciones.slice(0, 3)) {
      const desc = INSTITUCIONES_NI[inst];
      if (desc) ctx.push(`Qué es ${inst} (${desc}) y su rol en este hecho`);
    }
  }
  if (personas.length > 0) {
    ctx.push(`Quién es ${personas[0]} y por qué su declaración es relevante`);
  }
  if (/accidente|choque|colisión|volcadura|atropello/i.test(textoPlano)) {
    ctx.push('Estado de la vía donde ocurrió el accidente');
    ctx.push('Antecedentes de accidentes en esta ruta');
  }
  if (/incendio|fuego|siniestro/i.test(textoPlano)) {
    ctx.push('Tiempo de respuesta de los bomberos');
    ctx.push('Estado actual del lugar afectado');
  }
  if (/homicidio|asesinato|fallecido|muerto|víctima/i.test(textoPlano)) {
    ctx.push('Circunstancias del hecho sin exponer detalles sensibles');
  }
  return ctx;
}

function decideAntecedentes(textoPlano: string, lugares: string[]): string[] {
  const ant: string[] = [];
  if (/accidente|choque|colisión/i.test(textoPlano) && lugares.length > 0) {
    ant.push(`Accidentes previos reportados en ${lugares[0]}`);
  }
  if (/incendio/i.test(textoPlano)) {
    ant.push('Incendios recientes en la misma zona o tipo de establecimiento');
  }
  if (/inundación|deslave|lluvia|tormenta/i.test(textoPlano)) {
    ant.push('Eventos climáticos recientes en la región');
  }
  if (/dengue|malaria|covid|gripe|salud|epidemia/i.test(textoPlano)) {
    ant.push('Situación epidemiológica actual en Nicaragua');
  }
  return ant;
}

function computeScore(
  personas: string[],
  lugares: string[],
  instituciones: string[],
  fechas: string[],
  contextoRequerido: string[],
): number {
  let score = 40;
  if (personas.length > 0) score += 10;
  if (lugares.length > 0) score += 10;
  if (instituciones.length > 0) score += 10;
  if (fechas.length > 0) score += 10;
  if (contextoRequerido.length >= 3) score += 15;
  if (contextoRequerido.length >= 5) score += 5;
  return Math.min(score, 100);
}

export function runContextEngine(input: IntelligenceEngineInput): ContextDecision {
  const textoPlano = stripHtml(input.contenido) + ' ' + input.titulo;
  const personas = detectPersonas(textoPlano);
  const lugares = detectLugares(textoPlano);
  const instituciones = detectInstituciones(textoPlano);
  const fechas = detectFechas(textoPlano);
  const cifras = detectCifras(textoPlano);
  const entities = buildEntities(personas, lugares, instituciones, fechas, cifras);
  const contextoRequerido = decideContextoRequerido(personas, lugares, instituciones, textoPlano);
  const antecedentesNecesarios = decideAntecedentes(textoPlano, lugares);
  const score = computeScore(personas, lugares, instituciones, fechas, contextoRequerido);

  return {
    entities,
    personas,
    lugares,
    instituciones,
    fechas,
    antecedentesNecesarios,
    contextoRequerido,
    score,
  };
}
