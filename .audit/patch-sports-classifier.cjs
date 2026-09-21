const fs = require('fs');

// 1) editorial-brain/index.ts — routing de matriz por disciplina
let f = 'lib/meni/editorial-brain/index.ts';
let t = fs.readFileSync(f, 'utf8');
const oldImport = "import { INDIVIDUAL_SPORTS_KEYWORDS } from '../editorial-profiles';";
if (!t.includes(oldImport)) { console.log('index: import not found'); process.exit(1); }
t = t.replace(oldImport, "import { classifySports, isIndividualSport } from '../sports-classifier';");
const oldLine = "  if (matrizKey === 'deportes' && INDIVIDUAL_SPORTS_KEYWORDS.test(texto)) {";
const newLine = "  if (matrizKey === 'deportes' && isIndividualSport(classifySports(texto, '', '').disciplina)) {";
if (!t.includes(oldLine)) { console.log('index: matriz line not found'); process.exit(1); }
t = t.replace(oldLine, newLine);
fs.writeFileSync(f, t);
console.log('index.ts OK');

// 2) editorial-profiles.ts — getPerfilEditorial por disciplina
f = 'lib/meni/editorial-profiles.ts';
t = fs.readFileSync(f, 'utf8');
const oldCall = "  if (key === 'deportes' && textoPlano && INDIVIDUAL_SPORTS_KEYWORDS.test(textoPlano)) {";
const newCall = "  if (key === 'deportes' && textoPlano && isIndividualSport(classifySports(textoPlano, '', '').disciplina)) {";
if (!t.includes(oldCall)) { console.log('profiles: call not found'); process.exit(1); }
t = t.replace(oldCall, newCall);
const anchor = 'export const INDIVIDUAL_SPORTS_KEYWORDS';
const imp = "import { classifySports, isIndividualSport } from './sports-classifier';\n\n";
if (!t.includes(imp.trim())) t = t.replace(anchor, imp + anchor);
fs.writeFileSync(f, t);
console.log('editorial-profiles.ts OK');

// 3) category-intelligence.ts — 'quién o qué equipo' incluye piloto/competidor
f = 'lib/editorial/core/category-intelligence.ts';
t = fs.readFileSync(f, 'utf8');
const oldRx = "'quién o qué equipo': /\\b(?:selecci[oó]n|equipo|jugador[oa]?|atleta|[aá]rbitro|entrenador|FIFA|FIBA|FENIBAL|FENIFUT| Nicaragua)\\b/i,";
const newRx = "'quién o qué equipo': /\\b(?:selecci[oó]n|equipo|jugador[oa]?|atleta|[aá]rbitro|entrenador|piloto|competidor|boxeador|FIFA|FIBA|FENIBAL|FENIFUT|Nicaragua)\\b/i,";
if (!t.includes(oldRx)) { console.log('catintel: regex not found'); process.exit(1); }
t = t.replace(oldRx, newRx);
fs.writeFileSync(f, t);
console.log('category-intelligence.ts OK');
