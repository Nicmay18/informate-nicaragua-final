/**
 * Regression test for profile classifier and HTML sanitization fixes.
 * Run: node scripts/test-profile-fixes.mjs
 */
import { readFileSync } from 'fs';

let passed = 0, failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}

console.log('\n=== Profile Classifier Regression Tests ===\n');

// --- Test 1: turismo no longer has 'volcan' or 'laguna' ---
const detector = readFileSync('lib/meni/profile-detector.ts', 'utf8');
const turismoMatch = detector.match(/turismo:\s*\[([\s\S]*?)\]/);
const turismoSignals = turismoMatch ? turismoMatch[1] : '';
assert(!/volcan/.test(turismoSignals), 'turismo signals should NOT contain "volcan"');
assert(!/laguna/.test(turismoSignals), 'turismo signals should NOT contain "laguna"');

// --- Test 2: ambiente has volcan, ceniza, ineter ---
const ambienteMatch = detector.match(/ambiente:\s*\[([\s\S]*?)\]/);
const ambienteSignals = ambienteMatch ? ambienteMatch[1] : '';
assert(/volcan/.test(ambienteSignals), 'ambiente signals should contain "volcan"');
assert(/ceniza/.test(ambienteSignals), 'ambiente signals should contain "ceniza"');
assert(/ineter/.test(ambienteSignals), 'ambiente signals should contain "ineter"');
assert(/comupred/.test(ambienteSignals), 'ambiente signals should contain "comupred"');

// --- Test 3: internacional has honduras, el salvador, interpol ---
const intlMatch = detector.match(/internacional:\s*\[([\s\S]*?)\]/);
const intlSignals = intlMatch ? intlMatch[1] : '';
assert(/honduras/.test(intlSignals), 'internacional signals should contain "honduras"');
assert(/el\s+salvador/.test(intlSignals), 'internacional signals should contain "el salvador"');
assert(/interpol/.test(intlSignals), 'internacional signals should contain "interpol"');
assert(/extradicion/.test(intlSignals), 'internacional signals should contain "extradicion"');

// --- Test 4: sucesos has captura, contrabando ---
const sucesosMatch = detector.match(/sucesos:\s*\[([\s\S]*?)\]/);
const sucesosSignals = sucesosMatch ? sucesosMatch[1] : '';
assert(/captura/.test(sucesosSignals), 'sucesos signals should contain "captura"');
assert(/contrabando/.test(sucesosSignals), 'sucesos signals should contain "contrabando"');

// --- Test 5: turismo boost removed ---
assert(!/turismo\s*\+=\s*2/.test(detector), 'turismo +2 boost should be removed');

// --- Test 6: MIN_PROFILE_CONFIDENCE raised ---
const core = readFileSync('lib/meni/core.ts', 'utf8');
const confMatch = core.match(/MIN_PROFILE_CONFIDENCE\s*=\s*([\d.]+)/);
const confValue = confMatch ? parseFloat(confMatch[1]) : 0;
assert(confValue >= 0.40, `MIN_PROFILE_CONFIDENCE should be >= 0.40 (got ${confValue})`);

// --- Test 7: category-detector Turismo doesn't have volcan/laguna ---
const catDetector = readFileSync('lib/editorial/category-detector.ts', 'utf8');
const catTurismoMatch = catDetector.match(/categoria:\s*'Turismo'[^}]+/);
const catTurismo = catTurismoMatch ? catTurismoMatch[0] : '';
assert(!/volc[aá]n/.test(catTurismo), 'category-detector Turismo should NOT contain volcan');
assert(/laguna\\s\+de\\s\+apoyo/.test(catTurismo) && !/[^a-z]laguna[^a-z\\]/.test(catTurismo.replace(/laguna\\s\+de\\s\+apoyo/, '')), 'category-detector Turismo should only have laguna as "laguna de apoyo"');

// --- Test 8: category-detector Sucesos has captura, contrabando ---
const catSucesosMatch = catDetector.match(/categoria:\s*'Sucesos'[^}]+/);
const catSucesos = catSucesosMatch ? catSucesosMatch[0] : '';
assert(/captura/.test(catSucesos), 'category-detector Sucesos should contain captura');
assert(/contrabando/.test(catSucesos), 'category-detector Sucesos should contain contrabando');
assert(/interpol/i.test(catSucesos), 'category-detector Sucesos should contain interpol');

// --- Test 9: category-detector Internacionales has Interpol, extradicion ---
const catIntlMatch = catDetector.match(/categoria:\s*'Internacionales'[^}]+/);
const catIntl = catIntlMatch ? catIntlMatch[0] : '';
assert(/Interpol/.test(catIntl), 'category-detector Internacionales should contain Interpol');
assert(/extradici/.test(catIntl), 'category-detector Internacionales should contain extradicion');

// --- Test 10: 'id' removed from ALLOWED_ATTR in sanitize.ts ---
const sanitize = readFileSync('lib/sanitize.ts', 'utf8');
const allowedAttrMatch = sanitize.match(/ALLOWED_ATTR\s*=\s*\[([\s\S]*?)\]/);
const allowedAttr = allowedAttrMatch ? allowedAttrMatch[1] : '';
assert(!/['"]id['"]/.test(allowedAttr), 'ALLOWED_ATTR should NOT contain "id"');

// --- Test 11: editor-autonomo sanitizes articuloCompleto ---
const editorEngine = readFileSync('lib/meni/editor-autonomo/engine.ts', 'utf8');
assert(/sanitizeArticleHtml/.test(editorEngine), 'editor-autonomo should import sanitizeArticleHtml');
assert(/sanitizeArticleHtml\(getString\('articuloCompleto'\)\)/.test(editorEngine), 'editor-autonomo should sanitize articuloCompleto');

// --- Test 12: guardar-directo sanitizes contenido ---
const guardarDirecto = readFileSync('app/api/admin/guardar-directo/route.ts', 'utf8');
assert(/sanitizeArticleHtml/.test(guardarDirecto), 'guardar-directo should import sanitizeArticleHtml');
assert(/sanitizeArticleHtml\(contenido\.trim\(\)\)/.test(guardarDirecto), 'guardar-directo should sanitize contenido');

// --- Test 13: admin/news/[id] sanitizes contenido ---
const adminNews = readFileSync('app/api/admin/news/[id]/route.ts', 'utf8');
assert(/sanitizeArticleHtml/.test(adminNews), 'admin/news/[id] should import sanitizeArticleHtml');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
