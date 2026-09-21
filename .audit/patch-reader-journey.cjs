const fs = require('fs');
const f = 'lib/meni/reader-journey/index.ts';
let t = fs.readFileSync(f, 'utf8');

// 1) import del clasificador
const impAnchor = "import type { ReaderJourneyInput, ReaderJourneyResult } from './types';";
if (!t.includes(impAnchor)) { console.log('import anchor not found'); process.exit(1); }
t = t.replace(impAnchor, impAnchor + "\nimport { classifySports, isIndividualSport, type SportsClassification } from '../sports-classifier';");

// 2) función de adaptación por disciplina+etapa, antes de computeScore
const fnAnchor = 'function computeScore(';
const lines = [
  "/**",
  " * JOURNEY DEPORTE adaptado por clasificación.",
  " * La plantilla base era de fútbol: exigía 'El resultado' y 'Quiénes jugaron'",
  " * a cualquier disciplina y en cualquier etapa. Ahora la brecha depende de",
  " * disciplina (protagonista) y etapa (una previa no puede tener resultado).",
  " */",
  "function journeyDeporte(clas: SportsClassification): (typeof JOURNEYS)['deporte'] {",
  "  const individual = isIndividualSport(clas.disciplina);",
  "  const protagonista = individual ? 'el atleta o los pilotos/participantes' : 'los equipos o participantes';",
  "  const esPrevia = clas.etapa === 'previa' || clas.etapa === 'en_desarrollo' || clas.etapa === 'general';",
  "",
  "  const queNecesitaSaber = esPrevia",
  "    ? [",
  "        'Cuándo y dónde es el evento',",
  "        'Qué está en disputa',",
  "        'Quiénes participan: ' + protagonista,",
  "        'Contexto del campeonato, torneo o competencia',",
  "        'Antecedentes disponibles',",
  "      ]",
  "    : [",
  "        'El resultado o desenlace',",
  "        'Quiénes participaron: ' + protagonista,",
  "        'Qué significa el resultado',",
  "        'Contexto del campeonato, torneo o competencia',",
  "        'Qué sigue: próxima fecha o compromiso',",
  "      ];",
  "",
  "  return {",
  "    queSabe: [",
  "      'Nicaragua tiene atletas y equipos en varias disciplinas',",
  "      'Los campeonatos tienen fechas, categorías o jornadas',",
  "    ],",
  "    queNecesitaSaber,",
  "    queEntendera: esPrevia",
  "      ? [",
  "          'Qué se disputa y por qué importa',",
  "          'Quiénes participan y en qué condiciones',",
  "          'Cómo se inserta el evento en el campeonato o calendario',",
  "        ]",
  "      : [",
  "          'El contexto deportivo del resultado',",
  "          'La posición o situación de los protagonistas',",
  "          'Qué viene para la competencia',",
  "        ],",
  "    queRecordara: esPrevia",
  "      ? [",
  "          'Cuándo y dónde es el evento',",
  "          'Qué está en disputa',",
  "        ]",
  "      : [",
  "          'El resultado o desenlace',",
  "          'La figura o protagonista destacado',",
  "          'Qué viene para la competencia',",
  "        ],",
  "    objetivoPedagogico: 'Que el lector entienda el contexto deportivo del evento, no solo el resultado.',",
  "  };",
  "}",
  "",
];
if (!t.includes(fnAnchor)) { console.log('fn anchor not found'); process.exit(1); }
t = t.replace(fnAnchor, lines.join('\n') + fnAnchor);

// 3) usar journey adaptado cuando tipo==='deporte'
const oldRun = "  const tipo = detectarTipo(textoPlano);\n  const journey = JOURNEYS[tipo];";
const oldRunCrlf = "  const tipo = detectarTipo(textoPlano);\r\n  const journey = JOURNEYS[tipo];";
const newRun = "  const tipo = detectarTipo(textoPlano);\n  const journey = tipo === 'deporte'\n    ? journeyDeporte(classifySports(input.titulo || '', input.contenido || ''))\n    : JOURNEYS[tipo];";
if (t.includes(oldRun)) t = t.replace(oldRun, newRun);
else if (t.includes(oldRunCrlf)) t = t.replace(oldRunCrlf, newRun.replace(/\n/g, '\r\n'));
else { console.log('run anchor not found'); process.exit(1); }

fs.writeFileSync(f, t);
console.log('reader-journey OK');
