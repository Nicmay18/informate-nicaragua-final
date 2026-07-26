/**
 * Clarity Engine — Detecta conceptos difíciles, siglas, instituciones,
 * leyes y programas, y genera explicaciones automáticas.
 */

import type { IntelligenceEngineInput, ClarityDecision } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const SIGLAS_NI: Record<string, string> = {
  MINED: 'Ministerio de Educación',
  MINSA: 'Ministerio de Salud',
  INETER: 'Instituto Nicaragüense de Estudios Territoriales',
  MIFIC: 'Ministerio de Fomento, Industria y Comercio',
  INSS: 'Instituto Nicaragüense de Seguridad Social',
  CSE: 'Consejo Supremo Electoral',
  BCN: 'Banco Central de Nicaragua',
  ENATREL: 'Empresa Nacional de Transmisión Eléctrica',
  ENACAL: 'Empresa Nicaragüense de Acueductos y Alcantarillados',
  INTUR: 'Instituto Nicaragüense de Turismo',
  INIDE: 'Instituto Nacional de Información de Desarrollo',
  PGR: 'Procuraduría General de la República',
  CGR: 'Contraloría General de la República',
  AN: 'Asamblea Nacional',
  FFAA: 'Fuerzas Armadas',
  EP: 'Ejército de Nicaragua',
  PN: 'Policía Nacional',
  SIN: 'Sistema Nacional de Información',
  INAFOR: 'Instituto Nacional Forestal',
  INPESCA: 'Instituto Nicaragüense de la Pesca y Acuicultura',
  MAG: 'Ministerio Agropecuario y Forestal',
  MTI: 'Ministerio de Transporte e Infraestructura',
  MARENA: 'Ministerio del Ambiente y los Recursos Naturales',
  SETEQ: 'Secretaría de Educación y Calidad',
};

const INSTITUCIONES_DESC: Record<string, string> = {
  'Policía Nacional': 'Cuerpo policial encargado de la seguridad ciudadana en Nicaragua',
  'Ejército de Nicaragua': 'Institución militar encargada de la defensa nacional',
  'Asamblea Nacional': 'Órgano legislativo de Nicaragua, conformado por 92 diputados',
  'Banco Central de Nicaragua': 'Ente rector de la política monetaria y cambiaria del país',
  'Corte Suprema de Justicia': 'Máximo tribunal del Poder Judicial de Nicaragua',
  'Contraloría General': 'Órgano encargado de fiscalizar el uso de recursos públicos',
  'Procuraduría General': 'Institución que defiende los intereses del Estado',
};

const TERMINOS_TECNICOS: Record<string, string> = {
  'inflación': 'aumento general y sostenido de los precios de bienes y servicios',
  'devaluación': 'pérdida de valor de la moneda nacional frente al dólar',
  'recesión': 'contracción de la actividad económica durante dos trimestres consecutivos',
  'oferta y demanda': 'principio económico que determina precios según disponibilidad y deseo de compra',
  'tasa de interés': 'porcentaje que cobran los bancos por prestar dinero',
  'PIB': 'Producto Interno Bruto: valor total de bienes y servicios producidos en el país',
  'balanza comercial': 'diferencia entre lo que un país exporta y lo que importa',
  'presupuesto nacional': 'plan de gastos e ingresos del gobierno para un año',
  'estado de excepción': 'medida legal que otorga poderes especiales al gobierno en emergencias',
  'habeas corpus': 'recurso legal que protege contra detenciones arbitrarias',
  'amparo': 'recurso legal para proteger derechos constitucionales',
  'inmunidad parlamentaria': 'protección legal que tienen los diputados contra procesamientos',
};

function detectarSiglas(texto: string): { sigla: string; significado: string }[] {
  const siglas = new Map<string, string>();
  const pattern = /\b([A-Z]{3,8})\b/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(texto)) !== null) {
    const sigla = m[1];
    if (SIGLAS_NI[sigla]) {
      siglas.set(sigla, SIGLAS_NI[sigla]);
    }
  }
  return [...siglas.entries()].map(([sigla, significado]) => ({ sigla, significado }));
}

function detectarInstituciones(texto: string): { nombre: string; descripcion: string }[] {
  const detectadas = new Map<string, string>();
  for (const [nombre, desc] of Object.entries(INSTITUCIONES_DESC)) {
    if (texto.includes(nombre)) {
      detectadas.set(nombre, desc);
    }
  }
  return [...detectadas.entries()].map(([nombre, descripcion]) => ({ nombre, descripcion }));
}

function detectarConceptosDificiles(texto: string): { termino: string; explicacion: string }[] {
  const conceptos: { termino: string; explicacion: string }[] = [];
  const textoLower = texto.toLowerCase();
  for (const [termino, explicacion] of Object.entries(TERMINOS_TECNICOS)) {
    if (textoLower.includes(termino)) {
      conceptos.push({ termino, explicacion });
    }
  }
  return conceptos;
}

function detectarTerminosTecnicos(texto: string): { termino: string; alternativaSimple: string }[] {
  const alternativas: { termino: string; alternativaSimple: string }[] = [];
  const mapa: Record<string, string> = {
    'conflagración': 'incendio grande',
    'siniestro': 'accidente o desgracia',
    'imputación': 'acusación formal',
    'diligencias': 'trámites legales',
    'aprehensión': 'detención',
    'ocurrencia': 'evento o suceso',
    'incautación': 'decomiso',
    'flagrancia': 'ser atrapado en el acto',
    'jurisdicción': 'territorio donde aplica una autoridad',
    'evitaron': 'impidieron',
  };
  const textoLower = texto.toLowerCase();
  for (const [termino, alt] of Object.entries(mapa)) {
    if (textoLower.includes(termino)) {
      alternativas.push({ termino, alternativaSimple: alt });
    }
  }
  return alternativas;
}

function computeScore(
  siglas: { sigla: string; significado: string }[],
  instituciones: { nombre: string; descripcion: string }[],
  conceptos: { termino: string; explicacion: string }[],
  terminos: { termino: string; alternativaSimple: string }[],
): number {
  let score = 60;
  const totalDetectado = siglas.length + instituciones.length + conceptos.length + terminos.length;
  if (totalDetectado === 0) score = 90;
  else {
    score -= totalDetectado * 5;
    if (siglas.every((s) => s.significado)) score += 10;
    if (instituciones.every((i) => i.descripcion)) score += 10;
  }
  return Math.max(0, Math.min(score, 100));
}

export function runClarityEngine(input: IntelligenceEngineInput): ClarityDecision {
  const texto = stripHtml(`${input.titulo} ${input.contenido}`);
  const siglasDetectadas = detectarSiglas(texto);
  const institucionesMencionadas = detectarInstituciones(texto);
  const conceptosDificiles = detectarConceptosDificiles(texto);
  const terminosTecnicos = detectarTerminosTecnicos(texto);
  const score = computeScore(siglasDetectadas, institucionesMencionadas, conceptosDificiles, terminosTecnicos);

  return {
    conceptosDificiles,
    siglasDetectadas,
    institucionesMencionadas,
    terminosTecnicos,
    score,
  };
}
