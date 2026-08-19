/**
 * Competition Engine
 * ==================
 * Predice qué harían TN8, Canal 4 y La Prensa.
 * Define qué hará Nicaragua Informate DIFERENTE.
 */

import type { EditorialBrainInput, CompetitionDecision } from './types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectarTipo(texto: string): string {
  const t = texto.toLowerCase();
  if (/muerte|fallecido|muerto|asesinato/i.test(t)) return 'muerte';
  if (/accidente|choque|colisión|atropello/i.test(t)) return 'accidente';
  if (/detención|captura|allanamiento/i.test(t)) return 'delito';
  if (/(?:\b)(?:cine|pelicula|película|estreno|cinemark|marvel|warner|disney|actor|actriz|taquilla|personaje|protagonista|secuela|remake|estrenar|netflix|streaming|hbo|amazon prime|disney\+|disney plus)(?:\b)/i.test(t)) return 'espectaculo';
  if (/precio|inflación|salario|economía/i.test(t)) return 'economia';
  if (/salud|dengue|covid|epidemia/i.test(t)) return 'salud';
  if (/política|gobierno|asamblea/i.test(t)) return 'politica';
  if (/deporte|fútbol|baseball/i.test(t)) return 'deporte';
  if (/inundación|deslave|tormenta/i.test(t)) return 'desastre';
  return 'general';
}

function predecirTN8(tipo: string): string {
  const enfoques: Record<string, string> = {
    muerte: 'Nota roja sensacionalista: foto del cuerpo, detalles morbosos, "conmoción en el barrio"',
    accidente: 'Cobertura visual del siniestro: fotos del choque, declaraciones de testigos',
    delito: 'Reportaje policial: "capturado en flagrancia", fotos del detenido, lista de cargos',
    economia: 'Nota fría con cifras oficiales, sin explicar cómo afecta al ciudadano',
    salud: 'Alerta con declaraciones de MINSA, sin explicar prevención al lector',
    politica: 'Nota oficialista o alineada, declaraciones de autoridades, sin análisis crítico',
    deporte: 'Resultado y declaraciones del entrenador, sin contexto del torneo',
    desastre: 'Cobertura de emergencia con imágenes, sin guía de prevención',
    general: 'Nota informativa estándar sin agregado',
  };
  return enfoques[tipo] ?? enfoques.general;
}

function predecirCanal4(tipo: string): string {
  const enfoques: Record<string, string> = {
    muerte: 'Reportaje televisivo con imágenes fuertes, entrevista a vecinos afectados',
    accidente: 'Transmisión en vivo desde el lugar, declaraciones de bomberos',
    delito: 'Nota policial con imágenes del operativo, declaración de la Policía',
    economia: 'Cobertura oficial de anuncios económicos del gobierno',
    salud: 'Comunicado de MINSA leído en noticiero, sin profundización',
    politica: 'Cobertura alineada con narrativa oficial, sin voces alternativas',
    deporte: 'Resumen del partido con goles, sin análisis táctico',
    desastre: 'Imágenes del desastre, declaración de SINAPRED',
    general: 'Nota breve en bloque de noticias, sin profundización',
  };
  return enfoques[tipo] ?? enfoques.general;
}

function predecirLaPrensa(tipo: string): string {
  const enfoques: Record<string, string> = {
    muerte: 'Nota roja con foto, detalles del hecho, declaración de autoridad',
    accidente: 'Reporte con cifras de accidentes, declaración de Policía y bomberos',
    delito: 'Reportaje policial con expediente, antecedentes del detenido',
    economia: 'Nota con cifras del BCN o INEC, declaración de economista, sin impacto ciudadano',
    salud: 'Reporte con datos epidemiológicos, declaración de MINSA, sin guía práctica',
    politica: 'Nota con declaración de oposición o gobierno, sin análisis de impacto',
    deporte: 'Crónica del partido, estadísticas, declaración del jugador estrella',
    desastre: 'Reporte con cifras de afectados, declaración de autoridades',
    general: 'Nota informativa estándar con declaración de fuente oficial',
  };
  return enfoques[tipo] ?? enfoques.general;
}

function definirEnfoqueNI(tipo: string, texto: string): string {
  const enfoques: Record<string, string> = {
    muerte: 'Explicar las causas del siniestro, contexto de seguridad vial o violencia, cómo prevenir, estado de víctimas, sin morbo',
    accidente: 'Por qué ocurrió, estado de víctimas, qué hacen las autoridades, cómo evitarlo, datos de accidentes en la zona',
    delito: 'El delito, el proceso legal, qué significa la captura, derechos del detenido, contexto delictivo en la zona',
    economia: 'Cómo afecta al bolsillo del nicaragüense, qué subió, qué bajó, qué hacer, comparación con meses anteriores',
    salud: 'Qué es la enfermedad, cómo se contagia, cómo prevenir, síntomas, dónde atenderse, datos en Nicaragua',
    politica: 'Cómo afecta esta decisión al ciudadano, qué cambia, qué sigue, sin alineación política',
    deporte: 'El resultado, el contexto del torneo, qué sigue para el equipo, historial deportivo',
    desastre: 'Qué pasó, qué hacer, dónde evacuar, prevención, antecedentes climáticos en la zona',
    general: 'Contexto, explicación, impacto para el lector, preguntas que el lector tendría',
  };
  let base = enfoques[tipo] ?? enfoques.general;
  const t = texto.toLowerCase();
  if (/tipitapa|ciudad sandino|masaya|granada|estelí/i.test(t)) {
    base += '. Enfoque local: qué significa para los habitantes de esa zona específica';
  }
  return base;
}

function calcularDiferencia(enfoqueNI: string, enfoqueCompetencia: string): string {
  const palabrasNI = new Set(enfoqueNI.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const palabrasComp = new Set(enfoqueCompetencia.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  let diferenciales = 0;
  for (const w of palabrasNI) {
    if (!palabrasComp.has(w)) diferenciales++;
  }
  const total = Math.max(palabrasNI.size, 1);
  const pct = Math.round((diferenciales / total) * 100);
  if (pct > 60) return `Diferencia alta (${pct}%): enfoque claramente diferenciado`;
  if (pct > 30) return `Diferencia media (${pct}%): algunos elementos diferenciales`;
  return `Diferencia baja (${pct}%): riesgo de parecer igual a la competencia`;
}

export function runCompetitionEngine(input: EditorialBrainInput): CompetitionDecision {
  const texto = stripHtml(`${input.titulo} ${input.contenido}`);
  const tipo = detectarTipo(texto);

  const enfoqueTN8 = predecirTN8(tipo);
  const enfoqueCanal4 = predecirCanal4(tipo);
  const enfoqueLaPrensa = predecirLaPrensa(tipo);
  const enfoqueNicaraguaInformate = definirEnfoqueNI(tipo, texto);
  const diferencia = calcularDiferencia(enfoqueNicaraguaInformate, enfoqueTN8);

  const palabrasNI = new Set(enfoqueNicaraguaInformate.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const palabrasComp = new Set(enfoqueTN8.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  let diff = 0;
  for (const w of palabrasNI) if (!palabrasComp.has(w)) diff++;
  const pct = Math.round((diff / Math.max(palabrasNI.size, 1)) * 100);
  const score = Math.min(pct, 100);

  return { enfoqueTN8, enfoqueCanal4, enfoqueLaPrensa, enfoqueNicaraguaInformate, diferencia, score };
}
