/**
 * Sports Classifier — capa de clasificación semántica deportiva
 * =============================================================
 * NOTA → categoría → DISCIPLINA → tipo de evento → etapa temporal →
 * estructura competitiva → preguntas aplicables.
 *
 * La disciplina se determina por señales ponderadas del texto (no por el
 * string de categoría). Si la confianza es insuficiente la disciplina es
 * `no_determinada` y sólo se emiten preguntas que no dependen de disciplina.
 * Extensible: agregar señales en DISCIPLINE_SIGNALS y un banco en
 * QUESTION_BANK.
 */

export type SportDiscipline =
  | 'futbol'
  | 'beisbol'
  | 'baloncesto'
  | 'voleibol'
  | 'balonmano'
  | 'boxeo'
  | 'artes_marciales'
  | 'motocross'
  | 'automovilismo'
  | 'motociclismo'
  | 'deportes_motor'
  | 'ciclismo'
  | 'atletismo'
  | 'natacion'
  | 'tenis'
  | 'individual'
  | 'colectivo'
  | 'otro'
  | 'no_determinada';

export type EventStage =
  | 'previa'
  | 'en_desarrollo'
  | 'posterior'
  | 'resultados'
  | 'analisis'
  | 'perfil'
  | 'cronica'
  | 'general';

export type EventType =
  | 'partido'
  | 'juego'
  | 'serie'
  | 'fecha'
  | 'carrera'
  | 'pelea'
  | 'jornada'
  | 'torneo'
  | 'campeonato'
  | 'clasificacion'
  | 'etapa'
  | 'final'
  | 'previa'
  | 'general';

export interface SportStructure {
  tieneTabla: boolean;
  tieneCampeonato: boolean;
  tieneCategorias: boolean;
  tieneParticipantes: boolean;
}

export interface SportsClassification {
  disciplina: SportDiscipline;
  confianza: number;
  evidencia: string[];
  tipoEvento: EventType;
  etapa: EventStage;
  estructura: SportStructure;
}

/**
 * \b de JavaScript no trata las vocales acentuadas como word-chars:
 * /\bgan[oó]\b/ NO matchea 'ganó ' ('ó' y ' ' son ambos non-\w → no hay
 * boundary). Toda señal que termina en vocal acentuada quedaba rota.
 * rx() sustituye \b por boundaries que tratan áéíóúüñ como letras.
 */
const WC = 'a-zA-Z0-9_áéíóúüñÁÉÍÓÚÜÑ';
const WORD_BOUNDARY = '(?:(?<![' + WC + '])(?=[' + WC + '])|(?<=[' + WC + '])(?![' + WC + ']))';
function rx(src: string): RegExp {
  return new RegExp(src.replace(/\\b/g, WORD_BOUNDARY), 'i');
}

type SportSignal = { patron: RegExp; peso: number };

const DISCIPLINE_SIGNALS: Record<Exclude<SportDiscipline, 'no_determinada' | 'otro' | 'individual' | 'colectivo' | 'deportes_motor'>, SportSignal[]> = {
  futbol: [
    { patron: rx('\\bf[uú]tbol\\b'), peso: 3 },
    { patron: rx('\\b(?:gol|goles|golazo)\\b'), peso: 2 },
    { patron: rx('\\bFIFA\\b'), peso: 3 },
    { patron: rx('\\b(?:delantero|portero|lateral|mediocampista|zaguero)\\b'), peso: 2 },
    { patron: rx('\\b(?:penalti|penal|tiro\\s+de\\s+esquina|fuera\\s+de\\s+juego|tarjeta\\s+roja)\\b'), peso: 2 },
    { patron: rx('\\bmundial\\b'), peso: 1 },
    { patron: rx('\\bselecci[oó]n\\b'), peso: 0.8 },
    { patron: rx('\\bpartido\\b'), peso: 0.8 },
  ],
  beisbol: [
    { patron: rx('\\bb[eé]isbol\\b'), peso: 3 },
    { patron: rx('\\b(?:jonr[oó]n|cuadrangular)\\b'), peso: 3 },
    { patron: rx('\\b(?:pitcher|lanzador|bateador|catcher|jardinero|relevista)\\b'), peso: 2.5 },
    { patron: rx('\\b(?:inning|innings|episodio)\\b'), peso: 3 },
    { patron: rx('\\b(?:MLB|grandes\\s+ligas|ligamayorista)\\b'), peso: 3 },
    { patron: rx('\\bPomares\\b'), peso: 3 },
    { patron: rx('\\bpelota\\b'), peso: 1 },
    { patron: rx('\\bserie\\b'), peso: 0.8 },
  ],
  baloncesto: [
    { patron: rx('\\b(?:baloncesto|b[aá]squetbol|b[aá]squet)\\b'), peso: 3 },
    { patron: rx('\\bFIBA\\b'), peso: 3 },
    { patron: rx('\\bcanastas?\\b'), peso: 1.5 },
    { patron: rx('\\b(?:triple|triples)\\b'), peso: 1 },
  ],
  voleibol: [
    { patron: rx('\\b(?:voleibol|v[oó]ley|voleybol)\\b'), peso: 3 },
  ],
  balonmano: [
    { patron: rx('\\bbalonmano\\b'), peso: 3 },
    { patron: rx('\\bhandball\\b'), peso: 3 },
    { patron: rx('\\bIHF\\b'), peso: 3 },
  ],
  boxeo: [
    { patron: rx('\\bboxeo\\b'), peso: 3 },
    { patron: rx('\\bboxeador(?:a|es)?\\b'), peso: 3 },
    { patron: rx('\\b(?:nocaut|n[oó]caut|knockout|K\\.?O\\.?)\\b'), peso: 2.5 },
    { patron: rx('\\bcartelera\\b'), peso: 2 },
    { patron: rx('\\bpelea\\b'), peso: 1.5 },
    { patron: rx('\\bring\\b'), peso: 1.5 },
    { patron: rx('\\bcintur[oó]n\\b'), peso: 1.5 },
    { patron: rx('\\bpeso\\s+(?:mosca|pluma|ligero|welter|medio|pesado|gallo|supermosca|supergallo)\\b'), peso: 2 },
  ],
  artes_marciales: [
    { patron: rx('\\b(?:sanda|wushu|karate|k[aá]rate|judo|taekwondo|muay\\s+thai|kickboxing|MMA|artes\\s+marciales)\\b'), peso: 3 },
    { patron: rx('\\b(?:judoka|karateca|taekwondista|taekwondin|luchador|luchadora)\\b'), peso: 2 },
    { patron: rx('\\bcombate\\b'), peso: 1 },
  ],
  motocross: [
    { patron: rx('\\bmotocross\\b'), peso: 4 },
    { patron: rx('\\bsupercross\\b'), peso: 4 },
    { patron: rx('\\benduro\\b'), peso: 3 },
    { patron: rx('\\bMX\\d{0,2}\\b'), peso: 2.5 },
    { patron: rx('\\bmotociclismo\\b'), peso: 2.5 },
  ],
  automovilismo: [
    { patron: rx('\\bautomovilismo\\b'), peso: 4 },
    { patron: rx('\\b(?:1\\/4\\s+de\\s+milla|cuarto\\s+de\\s+milla|arrancones?)\\b'), peso: 4 },
    { patron: rx('\\brally\\b'), peso: 3 },
    { patron: rx('\\bkarting\\b'), peso: 3 },
    { patron: rx('\\b(?:f[oó]rmula\\s*\\d|F1)\\b'), peso: 3 },
    { patron: rx('\\bdrift\\b'), peso: 2 },
  ],
  motociclismo: [
    { patron: rx('\\b(?:MotoGP|Moto2|Moto3|Superbike|WSBK)\\b'), peso: 4 },
    { patron: rx('\\bgran\\s+premio\\s+de\\s+motos\\b'), peso: 3 },
  ],
  ciclismo: [
    { patron: rx('\\bciclismo\\b'), peso: 3 },
    { patron: rx('\\bciclistas?\\b'), peso: 3 },
    { patron: rx('\\bpelot[oó]n\\b'), peso: 2 },
    { patron: rx('\\bvuelta\\b'), peso: 1.5 },
  ],
  atletismo: [
    { patron: rx('\\batletismo\\b'), peso: 3 },
    { patron: rx('\\b(?:relevos?|4x100|4x400|marat[oó]n|media\\s+marat[oó]n|sprinter|velocista)\\b'), peso: 2.5 },
    { patron: rx('\\b(?:100|200|400|800|1500|5000|10000)\\s*metros\\b'), peso: 2.5 },
    { patron: rx('\\b(?:jabalina|salto\\s+de\\s+longitud|salto\\s+alto|triple\\s+salto|lanzamiento)\\b'), peso: 2 },
  ],
  natacion: [
    { patron: rx('\\bnataci[oó]n\\b'), peso: 3 },
    { patron: rx('\\bnadador(?:a|es)?\\b'), peso: 3 },
    { patron: rx('\\bestilo\\s+(?:libre|mariposa|espalda|pecho)\\b'), peso: 2.5 },
  ],
  tenis: [
    { patron: rx('\\btenis\\b'), peso: 3 },
    { patron: rx('\\btenistas?\\b'), peso: 3 },
    { patron: rx('\\b(?:Roland\\s+Garros|Wimbledon|US\\s+Open|Australian\\s+Open|Grand\\s+Slam)\\b'), peso: 3 },
    { patron: rx('\\bsets?\\b'), peso: 1 },
  ],
};

const MOTOR_SIGNALS: SportSignal[] = [
  { patron: rx('\\bpilotos?\\b'), peso: 2 },
  { patron: rx('\\bcircuito\\b'), peso: 1.5 },
  { patron: rx('\\bparrilla\\b'), peso: 1.5 },
];

const PREVIA_SIGNALS: SportSignal[] = [
  { patron: rx('\\b(?:se\\s+(?:disputar[aá]|realizar[aá]|llevar[aá]|jugar[aá]|efectuar[aá])|ser[aá]|ser[aá]n)\\b'), peso: 2 },
  { patron: rx('\\b(?:enfrentar[aá]|viajar[aá]|debutar[aá]|medir[aá]|competir[aá]|disputar[aá]|participar[aá]|jugar[aá]|pelear[aá]|correr[aá])\\b'), peso: 2 },
  { patron: rx('\\b(?:previa|pr[oó]xim[oa]s?|agenda|programad[oa]|est[eé]\\s+(?:s[aá]bado|domingo|lunes|martes|mi[eé]rcoles|jueves|viernes)|ma[nñ]ana|fin\\s+de\\s+semana)\\b'), peso: 1.5 },
  { patron: rx('\\b(?:se\\s+alista|se\\s+prepara|se\\s+entrena|convocatoria|n[oó]mina)\\b'), peso: 1.5 },
];

const POSTERIOR_SIGNALS: SportSignal[] = [
  { patron: rx('\\b(?:gan[oó]|venci[oó]|perdi[oó]|empat[oó]|derrot[oó]|super[oó]|avanz[oó]|elimin[oó]|clasific[oó]|qued[oó]|finaliz[oó]|obtuvo|logr[oó]|consigui[oó]|conquist[oó]|se\\s+coron[oó]|celebr[oó])\\b'), peso: 2 },
  { patron: rx('\\b(?:resultado|marcador|medalla|t[ií]tulo|campe[oó]n|subcampe[oó]n|oro|plata|bronce)\\b'), peso: 1.5 },
  { patron: rx('\\b(?:se\\s+disput[oó]|se\\s+realiz[oó]|se\\s+jug[oó]|se\\s+efectu[oó]|fue\\s+recibid[oa]|compiti[oó]|compitieron|participaron|particip[oó])\\b'), peso: 2 },
  { patron: rx('\\b(?:hizo\\s+historia|hace\\s+historia)\\b'), peso: 1 },
];

const ANALISIS_PERFIL_SIGNALS: SportSignal[] = [
  { patron: rx('\\b(?:perfil|trayectoria|qui[eé]n\\s+es|an[aá]lisis|favoritos?|pron[oó]stico|as[ií]\\s+avanza|cr[oó]nica)\\b'), peso: 1.5 },
];

function normalize(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreSignals(texto: string, signals: SportSignal[]): { peso: number; evidencia: string[] } {
  let peso = 0;
  const evidencia: string[] = [];
  for (const s of signals) {
    if (s.patron.test(texto)) {
      peso += s.peso;
      evidencia.push(s.patron.source.slice(0, 40));
    }
  }
  return { peso, evidencia };
}

const MIN_CONFIDENCE = 2;

export function classifySports(titulo: string, contenido: string, resumen = ''): SportsClassification {
  const textoTitulo = normalize(titulo || '');
  const textoCuerpo = normalize(`${resumen} ${contenido}`);

  // El título pesa doble: es la declaración del tema.
  const resultados: { disciplina: SportDiscipline; peso: number; evidencia: string[] }[] = [];
  for (const [disciplina, signals] of Object.entries(DISCIPLINE_SIGNALS)) {
    const a = scoreSignals(textoTitulo, signals);
    const b = scoreSignals(textoCuerpo, signals);
    const peso = a.peso * 2 + b.peso;
    if (peso > 0) resultados.push({ disciplina: disciplina as SportDiscipline, peso, evidencia: [...a.evidencia, ...b.evidencia] });
  }
  resultados.sort((x, y) => y.peso - x.peso);

  let disciplina: SportDiscipline = 'no_determinada';
  let confianza = 0;
  let evidencia: string[] = [];
  const top = resultados[0];
  if (top && top.peso >= MIN_CONFIDENCE) {
    disciplina = top.disciplina;
    confianza = top.peso;
    evidencia = top.evidencia;
  }

  // Motor genérico: señales de motor sin disciplina específica suficiente.
  if (disciplina === 'no_determinada') {
    const motor = scoreSignals(`${textoTitulo} ${textoCuerpo}`, MOTOR_SIGNALS);
    if (motor.peso >= 3) {
      disciplina = 'deportes_motor';
      confianza = motor.peso;
      evidencia = motor.evidencia;
    }
  }

  // Etapa temporal: posterior gana si hay evidencia de resultado consumado.
  const previa = scoreSignals(textoCuerpo, PREVIA_SIGNALS);
  const posterior = scoreSignals(textoCuerpo, POSTERIOR_SIGNALS);
  const analisis = scoreSignals(textoCuerpo, ANALISIS_PERFIL_SIGNALS);

  let etapa: EventStage = 'general';
  if (posterior.peso >= 2) etapa = 'posterior';
  else if (previa.peso >= 2) etapa = 'previa';
  else if (analisis.peso >= 1.5) etapa = 'analisis';
  else if (previa.peso > 0) etapa = 'previa';

  const t = textoCuerpo.toLowerCase();
  const estructura: SportStructure = {
    tieneTabla: rx('\\b(?:tabla|posiciones|clasificaci[oó]n|liderato|l[ií]der|standings)\\b').test(t),
    tieneCampeonato: rx('\\b(?:campeonato|torneo|liga|copa|fecha|clasificaci[oó]n)\\b').test(t),
    tieneCategorias: rx('\\b(?:categor[ií]as?|50cc|65cc|85cc|MX\\d|peso\\s+\\w+|division)\\b').test(t),
    tieneParticipantes: rx('\\b(?:pilotos?|jugadores?|atletas?|equipos?|competidores?|boxeadores?|ciclistas?|nadadores?|participantes?)\\b').test(t),
  };

  // Tipo de evento según disciplina + texto.
  let tipoEvento: EventType = 'general';
  if (rx('\\bprevia\\b').test(t)) tipoEvento = 'previa';
  else if (rx('\\bfinal\\b').test(t)) tipoEvento = 'final';
  else if (rx('\\b(?:pelea|combate|cartelera)\\b').test(t) && (disciplina === 'boxeo' || disciplina === 'artes_marciales')) tipoEvento = 'pelea';
  else if (rx('\\b(?:carrera|fecha|jornada)\\b').test(t) && (disciplina === 'motocross' || disciplina === 'automovilismo' || disciplina === 'motociclismo' || disciplina === 'deportes_motor' || disciplina === 'ciclismo')) tipoEvento = rx('\\bcarrera\\b').test(t) ? 'carrera' : 'fecha';
  else if (rx('\\bserie\\b').test(t) && disciplina === 'beisbol') tipoEvento = 'serie';
  else if (rx('\\betapa\\b').test(t) && disciplina === 'ciclismo') tipoEvento = 'etapa';
  else if (rx('\\b(?:partido|encuentro)\\b').test(t)) tipoEvento = 'partido';
  else if (rx('\\bjuego\\b').test(t) && disciplina === 'beisbol') tipoEvento = 'juego';
  else if (rx('\\bcampeonato\\b').test(t)) tipoEvento = 'campeonato';
  else if (rx('\\btorneo\\b').test(t)) tipoEvento = 'torneo';
  else if (rx('\\bclasificaci[oó]n\\b').test(t)) tipoEvento = 'clasificacion';

  return { disciplina, confianza, evidencia, tipoEvento, etapa, estructura };
}

const INDIVIDUAL_DISCIPLINES = new Set<SportDiscipline>([
  'boxeo', 'artes_marciales', 'motocross', 'automovilismo', 'motociclismo',
  'deportes_motor', 'ciclismo', 'atletismo', 'natacion', 'tenis', 'individual',
]);

export function isIndividualSport(disciplina: SportDiscipline): boolean {
  return INDIVIDUAL_DISCIPLINES.has(disciplina);
}

// ═══════════════════════════════════════════════════════════════
// Banco de preguntas por disciplina × etapa.
// `requiere` condiciona la pregunta a evidencia de estructura en el texto:
//   'tabla'      → existe clasificación/tabla mencionada
//   'campeonato' → existe campeonato/torneo/fecha mencionado
//   'categorias' → existen categorías/mención de categorías
// ═══════════════════════════════════════════════════════════════

type StructureReq = 'tabla' | 'campeonato' | 'categorias';

interface BankQuestion {
  q: string;
  requiere?: StructureReq;
}

interface DisciplineBank {
  siempre: BankQuestion[];
  previa: BankQuestion[];
  posterior: BankQuestion[];
  perfil?: BankQuestion[];
}

const SIEMPRE: BankQuestion[] = [
  { q: 'Donde y cuando ocurre u ocurrio el evento?' },
  { q: 'Quienes participan o son protagonistas?' },
];

const QUESTION_BANK: Partial<Record<SportDiscipline, DisciplineBank>> = {
  futbol: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde es el partido?' },
      { q: 'Quienes se enfrentan?' },
      { q: 'Que esta en disputa?' },
      { q: 'Hay antecedentes entre ambos?' },
    ],
    posterior: [
      { q: 'Cual fue el resultado?' },
      { q: 'Quienes jugaron?' },
      { q: 'Que significa este resultado?' },
      { q: 'Hubo figuras destacadas?' },
      { q: 'Cual es el proximo partido?' },
      { q: 'Como queda la tabla?', requiere: 'tabla' },
    ],
  },
  beisbol: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde es el juego o la serie?' },
      { q: 'Quienes se enfrentan?' },
      { q: 'Que esta en disputa?' },
      { q: 'Quien lanza o cuales son las figuras?' },
    ],
    posterior: [
      { q: 'Cual fue el resultado del juego?' },
      { q: 'Quienes fueron los equipos?' },
      { q: 'Cuantas carreras y quienes se destacaron?' },
      { q: 'Como queda la serie o la clasificacion?', requiere: 'tabla' },
      { q: 'Cual es el proximo juego o compromiso?' },
    ],
  },
  baloncesto: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde es el partido?' },
      { q: 'Quienes se enfrentan?' },
      { q: 'Que esta en disputa?' },
    ],
    posterior: [
      { q: 'Cual fue el resultado?' },
      { q: 'Quienes jugaron?' },
      { q: 'Que significa este resultado?' },
      { q: 'Como queda la tabla?', requiere: 'tabla' },
      { q: 'Cual es el proximo partido?' },
    ],
  },
  voleibol: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde es el partido?' },
      { q: 'Quienes se enfrentan?' },
      { q: 'Que esta en disputa?' },
    ],
    posterior: [
      { q: 'Cual fue el resultado y en cuantos sets?' },
      { q: 'Quienes jugaron?' },
      { q: 'Que significa este resultado?' },
      { q: 'Como queda la clasificacion?', requiere: 'tabla' },
    ],
  },
  balonmano: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde es el partido?' },
      { q: 'Quienes se enfrentan?' },
      { q: 'Que esta en disputa?' },
    ],
    posterior: [
      { q: 'Cual fue el resultado?' },
      { q: 'Quienes jugaron?' },
      { q: 'Que significa este resultado?' },
      { q: 'Como queda la clasificacion?', requiere: 'tabla' },
    ],
  },
  boxeo: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde es la pelea?' },
      { q: 'Quienes se enfrentan?' },
      { q: 'En que peso se disputa?' },
      { q: 'Hay un titulo en juego?' },
      { q: 'Como es la cartelera?' },
    ],
    posterior: [
      { q: 'Quien gano la pelea y como?' },
      { q: 'Fue por decision, nocaut u otro resultado?' },
      { q: 'Que sigue para el boxeador?' },
    ],
  },
  artes_marciales: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde es la competencia?' },
      { q: 'Quien compite y en que categoria o modalidad?' },
      { q: 'Que esta en disputa?' },
    ],
    posterior: [
      { q: 'Quien gano y en que categoria?' },
      { q: 'Que resultado o medalla obtuvo?' },
      { q: 'Que sigue para el atleta?' },
    ],
  },
  motocross: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Que fecha del campeonato se disputa?', requiere: 'campeonato' },
      { q: 'Cuantas fechas contempla el campeonato?', requiere: 'campeonato' },
      { q: 'Donde se realizara y en que pista o circuito?' },
      { q: 'Que categorias participan?' },
      { q: 'Quienes competiran?' },
      { q: 'Que esta en disputa?' },
      { q: 'Que antecedentes existen?' },
    ],
    posterior: [
      { q: 'Quienes ganaron en cada categoria?' },
      { q: 'Que fecha del campeonato fue?', requiere: 'campeonato' },
      { q: 'Como quedo la clasificacion general del campeonato?', requiere: 'tabla' },
      { q: 'Cual es la proxima fecha?', requiere: 'campeonato' },
      { q: 'Hubo pilotos destacados?' },
    ],
  },
  automovilismo: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde es la carrera?' },
      { q: 'Que pilotos o categorias participan?' },
      { q: 'Que esta en disputa?' },
      { q: 'En que tipo de competencia o formato?' },
    ],
    posterior: [
      { q: 'Quien gano la carrera y en que categoria?' },
      { q: 'Cuales fueron los tiempos o posiciones?' },
      { q: 'Como quedo el campeonato?', requiere: 'campeonato' },
      { q: 'Cual es la proxima fecha o carrera?', requiere: 'campeonato' },
    ],
  },
  motociclismo: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde es la carrera?' },
      { q: 'Que pilotos participan?' },
      { q: 'Que esta en disputa?' },
    ],
    posterior: [
      { q: 'Quien gano la carrera?' },
      { q: 'Como quedo el campeonato?', requiere: 'campeonato' },
      { q: 'Cual es la proxima fecha?', requiere: 'campeonato' },
    ],
  },
  deportes_motor: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde es la competencia?' },
      { q: 'Que pilotos o categorias participan?' },
      { q: 'Que esta en disputa?' },
    ],
    posterior: [
      { q: 'Quien gano y en que categoria?' },
      { q: 'Cuales fueron los resultados o posiciones?' },
      { q: 'Como quedo el campeonato?', requiere: 'campeonato' },
      { q: 'Cual es la proxima fecha?', requiere: 'campeonato' },
    ],
  },
  ciclismo: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde es la carrera o etapa?' },
      { q: 'Quienes participan?' },
      { q: 'Que esta en disputa?' },
    ],
    posterior: [
      { q: 'Quien gano la etapa o la carrera?' },
      { q: 'Como quedo la clasificacion general?', requiere: 'tabla' },
      { q: 'Cual es la proxima etapa o fecha?' },
    ],
  },
  atletismo: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde compite?' },
      { q: 'En que prueba o modalidad participa?' },
      { q: 'Que esta en disputa?' },
    ],
    posterior: [
      { q: 'Que resultado, marca o medalla obtuvo?' },
      { q: 'En que prueba compitio?' },
      { q: 'Que sigue para el atleta?' },
    ],
  },
  natacion: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde compite?' },
      { q: 'En que prueba o estilo participa?' },
      { q: 'Que esta en disputa?' },
    ],
    posterior: [
      { q: 'Que resultado, tiempo o medalla obtuvo?' },
      { q: 'En que prueba compitio?' },
      { q: 'Que sigue para el nadador?' },
    ],
  },
  tenis: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde es el partido?' },
      { q: 'Quienes se enfrentan y en que ronda?' },
      { q: 'Que esta en disputa?' },
    ],
    posterior: [
      { q: 'Cual fue el resultado y en cuantos sets?' },
      { q: 'Quien gano y contra quien?' },
      { q: 'A que ronda avanza o que sigue?' },
    ],
  },
  individual: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde compite?' },
      { q: 'En que disciplina o categoria participa?' },
      { q: 'Que esta en disputa?' },
    ],
    posterior: [
      { q: 'Que resultado obtuvo?' },
      { q: 'En que disciplina o categoria compitio?' },
      { q: 'Que sigue para el atleta?' },
    ],
  },
  colectivo: {
    siempre: SIEMPRE,
    previa: [
      { q: 'Cuando y donde es el partido?' },
      { q: 'Quienes se enfrentan?' },
      { q: 'Que esta en disputa?' },
    ],
    posterior: [
      { q: 'Cual fue el resultado?' },
      { q: 'Quienes jugaron?' },
      { q: 'Que significa este resultado?' },
      { q: 'Como queda la clasificacion?', requiere: 'tabla' },
      { q: 'Cual es el proximo compromiso?' },
    ],
  },
  no_determinada: {
    siempre: [
      { q: 'De que evento o disciplina deportiva se trata?' },
      { q: 'Donde y cuando ocurre u ocurrio?' },
      { q: 'Quienes participan?' },
    ],
    previa: [
      { q: 'Que esta en disputa?' },
      { q: 'Hay antecedentes o informacion oficial disponible?' },
    ],
    posterior: [
      { q: 'Cual fue el resultado?' },
      { q: 'Que significa este resultado?' },
      { q: 'Que sigue?' },
    ],
  },
};

function estructuraCumple(req: StructureReq | undefined, e: SportStructure): boolean {
  if (!req) return true;
  if (req === 'tabla') return e.tieneTabla;
  if (req === 'campeonato') return e.tieneCampeonato;
  if (req === 'categorias') return e.tieneCategorias;
  return true;
}

export interface SportsQuestionsSelection {
  aplicables: string[];
  noAplicables: string[];
}

/**
 * Selecciona preguntas aplicables según disciplina + etapa + estructura.
 * `noAplicables` registra preguntas evaluadas y descartadas (transparencia):
 * incluye la plantilla genérica de fútbol cuando la disciplina no es fútbol.
 */
export function selectSportsQuestions(
  clasificacion: SportsClassification,
  plantillaGenericaDeportes: string[],
): SportsQuestionsSelection {
  const bank = QUESTION_BANK[clasificacion.disciplina] || QUESTION_BANK.no_determinada!;
  const etapa = clasificacion.etapa;

  const candidatas: BankQuestion[] = [...bank.siempre];
  if (etapa === 'previa' || etapa === 'en_desarrollo' || etapa === 'general') {
    candidatas.push(...bank.previa);
  }
  if (etapa === 'posterior' || etapa === 'resultados' || etapa === 'cronica') {
    candidatas.push(...bank.posterior);
  }
  if (etapa === 'analisis' || etapa === 'perfil') {
    candidatas.push(...(bank.perfil || []), ...bank.previa, ...bank.posterior.slice(0, 2));
  }

  const aplicables: string[] = [];
  const noAplicables: string[] = [];
  const seen = new Set<string>();
  for (const c of candidatas) {
    if (seen.has(c.q)) continue;
    seen.add(c.q);
    if (estructuraCumple(c.requiere, clasificacion.estructura)) aplicables.push(c.q);
    else noAplicables.push(c.q);
  }

  // Transparencia: preguntas de la plantilla genérica (fútbol) que esta
  // disciplina/etapa descartó — quedan registradas como NO APLICABLE.
  for (const p of plantillaGenericaDeportes) {
    if (!seen.has(p) && !aplicables.includes(p)) {
      noAplicables.push(p);
      seen.add(p);
    }
  }

  return { aplicables, noAplicables };
}
