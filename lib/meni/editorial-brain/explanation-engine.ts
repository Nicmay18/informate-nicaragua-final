/**
 * Explanation Engine 2.0
 * ======================
 * No explica solo siglas. Explica:
 * ¿Por qué ocurrió? ¿Qué significa? ¿Qué cambia? ¿Cómo afecta?
 */

import type { EditorialBrainInput, ExplanationDecision, ExplanationItem } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectarTipo(texto: string): string {
  const t = texto.toLowerCase();
  if (/\b(apertura|sucursal|franquicia|restaurante|comida rápida|marca|cadena|inaugura)\b/i.test(t)) return 'comercial';
  if (/muerte|fallecido|muerto/i.test(t)) return 'muerte';
  if (/accidente|choque|colisión/i.test(t)) return 'accidente';
  if (/detención|captura/i.test(t)) return 'delito';
  if (/precio|inflación|salario|economía/i.test(t)) return 'economia';
  if (/salud|dengue|covid/i.test(t)) return 'salud';
  if (/política|gobierno|asamblea/i.test(t)) return 'politica';
  if (/deporte|fútbol|baseball/i.test(t)) return 'deporte';
  if (/inundación|deslave|tormenta/i.test(t)) return 'desastre';
  return 'general';
}

function explicarPorQueOcurrio(tipo: string, texto: string): string {
  const t = texto.toLowerCase();
  const causas: Record<string, string> = {
    accidente: 'Exceso de velocidad, imprudencia, mal estado de la vía o falla mecánica son las causas más comunes de accidentes en Nicaragua.',
    muerte: 'La causa debe ser determinada por las autoridades competentes. Es importante no especular mientras hay investigación abierta.',
    delito: 'El delito presuntamente cometido debe ser investigado por la Policía Nacional y procesado por el sistema judicial.',
    economia: 'Los cambios de precios responden a factores del mercado internacional, oferta y demanda, y decisiones del Banco Central.',
    salud: 'Los brotes de enfermedades en Nicaragua suelen estar relacionados con condiciones climáticas, saneamiento y densidad poblacional.',
    politica: 'Las decisiones políticas del gobierno o la Asamblea Nacional responden a la agenda oficial y pueden tener impacto directo en la población.',
    desastre: 'Los desastres naturales en Nicaragua están vinculados a su geografía volcánica, sísmica y tropical, expuesta a huracanes y lluvias extremas.',
    deporte: 'El resultado deportivo se enmarca en el contexto del torneo, el momento del equipo y las decisiones tácticas del entrenador.',
    general: 'Las causas del hecho deben ser investigadas y verificadas antes de ser publicadas.',
  };
  let base = causas[tipo] ?? causas.general;
  if (/lluvia|inundación/i.test(t)) base += ' Nicaragua es vulnerable a fenómenos climáticos especialmente en la temporada de lluvias (mayo-noviembre).';
  if (/dengue|zika|chikungunya/i.test(t)) base += ' Estas enfermedades son transmitidas por el mosquito Aedes aegypti, que se cría en agua estancada.';
  return base;
}

function explicarQueSignifica(tipo: string): string {
  const significados: Record<string, string> = {
    accidente: 'Un accidente de tránsito es un evento donde uno o más vehículos colisionan, causando daños materiales y/o personales. En Nicaragua, la Ley 431 regula la seguridad vial.',
    muerte: 'Una muerte, sea por accidente, violencia o causa natural, tiene implicaciones legales: debe haber investigación, certificado de defunción y, si aplica, proceso penal.',
    delito: 'Una detención significa que la Policía Nacional tiene indicios de que una persona cometió un delito. El detenido tiene derecho a defensa y a un juicio debido.',
    economia: 'Un cambio de precios o salarios afecta directamente el poder adquisitivo de las familias nicaragüenses. La canasta básica en Nicaragua incluye arroz, frijoles, maíz, azúcar y aceite.',
    salud: 'Un brote epidemiológico significa que hay más casos de lo normal de una enfermedad. MINSA es la institución encargada de declarar alertas y coordinar la respuesta.',
    politica: 'Una decisión política puede cambiar leyes, regulaciones o políticas públicas que afectan directamente la vida de los ciudadanos.',
    desastre: 'Un desastre natural implica que la población, infraestructura y servicios se ven afectados. SINAPRED coordina la respuesta de emergencia en Nicaragua.',
    deporte: 'Un resultado deportivo afecta la posición del equipo en el torneo, su clasificación y su futuro en la competencia.',
    general: 'El significado del hecho depende del contexto, las causas y las consecuencias que se investiguen.',
  };
  return significados[tipo] ?? significados.general;
}

function explicarQueCambia(tipo: string): string {
  const cambios: Record<string, string> = {
    accidente: 'Puede haber cambios en el tráfico de la zona, investigación de tránsito, y posible llamado a revisar la seguridad vial en el punto del accidente.',
    muerte: 'Puede abrirse una investigación penal, haber cambios en la seguridad de la zona, y impacto en la familia y comunidad de la víctima.',
    delito: 'El detenido enfrenta un proceso legal. Puede haber cambios en la percepción de seguridad de la zona.',
    economia: 'El cambio de precios afecta el gasto familiar. Los nicaragüenses deben ajustar su presupuesto.',
    salud: 'Puede haber alertas sanitarias, campañas de prevención, y cambios en la rutina de las familias para protegerse.',
    politica: 'La decisión puede cambiar regulaciones, derechos o beneficios para los ciudadanos.',
    desastre: 'Las familias afectadas pueden necesitar reubicación, apoyo de autoridades, y cambios en su rutina.',
    deporte: 'El resultado cambia la posición del equipo y puede afectar su clasificación o eliminación del torneo.',
    general: 'Los cambios dependen de la naturaleza del hecho y sus consecuencias.',
  };
  return cambios[tipo] ?? cambios.general;
}

function explicarComoAfecta(tipo: string, texto: string): string {
  const t = texto.toLowerCase();
  let base = `Para el lector nicaragüense, este hecho `;
  const impactos: Record<string, string> = {
    accidente: 'puede significar retrasos en la vía, precaución al transitar por la zona, y conciencia sobre la seguridad vial.',
    muerte: 'puede generar preocupación en la comunidad, preguntas sobre seguridad, y necesidad de información clara sobre lo ocurrido.',
    delito: 'puede afectar la percepción de seguridad en la zona y generar preguntas sobre la efectividad de las autoridades.',
    economia: 'afecta directamente cuánto paga por productos o servicios, y cómo distribuye su presupuesto familiar.',
    salud: 'significa que debe tomar precauciones, conocer los síntomas, y saber dónde acudir si presenta síntomas.',
    politica: 'puede cambiar sus derechos, beneficios, obligaciones o acceso a servicios.',
    desastre: 'puede requerir que tome medidas de seguridad, evacue si es necesario, o siga indicaciones de SINAPRED.',
    deporte: 'afecta el seguimiento del equipo, las expectativas del torneo, y el orgullo deportivo.',
    general: 'puede tener implicaciones que se aclaran con el contexto y las consecuencias del hecho.',
  };
  base += impactos[tipo] ?? impactos.general;
  if (/tipitapa|masaya|granada|estelí|león|chinandega/i.test(t)) {
    base += ' Especialmente para los habitantes de la zona mencionada.';
  }
  return base;
}

export function runExplanationEngine(input: EditorialBrainInput): ExplanationDecision {
  const texto = stripHtml(`${input.titulo} ${input.contenido}`);
  const tipo = detectarTipo(texto);

  const porQueOcurrio = explicarPorQueOcurrio(tipo, texto);
  const queSignifica = explicarQueSignifica(tipo);
  const queCambia = explicarQueCambia(tipo);
  const comoAfecta = explicarComoAfecta(tipo, texto);

  const explicaciones: ExplanationItem[] = [
    { pregunta: '¿Por qué ocurrió?', respuesta: porQueOcurrio, tipo: 'causa' },
    { pregunta: '¿Qué significa?', respuesta: queSignifica, tipo: 'significado' },
    { pregunta: '¿Qué cambia?', respuesta: queCambia, tipo: 'consecuencia' },
    { pregunta: '¿Cómo afecta?', respuesta: comoAfecta, tipo: 'impacto' },
  ];

  let score = 70;
  if (porQueOcurrio.length > 50) score += 10;
  if (comoAfecta.length > 50) score += 10;
  if (/nicaragua|nicaragüense/i.test(comoAfecta)) score += 10;
  score = Math.min(score, 100);

  return { explicaciones, porQueOcurrio, queSignifica, queCambia, comoAfecta, score };
}
