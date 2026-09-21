const fs = require('fs');
const f = 'lib/meni/sports-classifier.ts';
let t = fs.readFileSync(f, 'utf8');

// 1) Insertar helper rx() antes de SportSignal (o antes de DISCIPLINE_SIGNALS)
const anchor = 'type SportSignal';
const helper = `/**
 * \\b de JavaScript no trata las vocales acentuadas como word-chars:
 * /\\bgan[oó]\\b/ NO matchea 'ganó ' ('ó' y ' ' son ambos non-\\w → no hay
 * boundary). Toda señal que termina en vocal acentuada quedaba rota.
 * rx() sustituye \\b por boundaries que tratan áéíóúüñ como letras.
 */
const WC = 'a-zA-Z0-9_áéíóúüñÁÉÍÓÚÜÑ';
const WORD_BOUNDARY = '(?:(?<![' + WC + '])(?=[' + WC + '])|(?<=[' + WC + '])(?![' + WC + ']))';
function rx(src: string): RegExp {
  return new RegExp(src.replace(/\\\\b/g, WORD_BOUNDARY), 'i');
}

`;
if (!t.includes(anchor)) { console.log('anchor not found'); process.exit(1); }
t = t.replace(anchor, helper + anchor);

// 2) Convertir { patron: /…/i, peso: N } → { patron: rx('…'), peso: N }
const re = /\{ patron: \/((?:[^/\\]|\\.)*)\/i, peso: (\d+(?:\.\d+)?) \}/g;
let count = 0;
t = t.replace(re, (m, src, peso) => {
  count++;
  const esc = src.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `{ patron: rx('${esc}'), peso: ${peso} }`;
});
console.log('patrones convertidos:', count);

// 3) Regex inline en classifySports (estructura / tipoEvento): envolver en rx()
//    .test(t) sobre literales /\b…\b/i — reemplazar literales problemáticos.
//    Solo los que terminan alternativa en vocal acentuada fallan, pero
//    convertimos TODOS los literales con \b del cuerpo para consistencia.
const inline = /\/(\\b(?:[^/\\]|\\.)*)\/i\.test\(/g;
let inlineCount = 0;
t = t.replace(inline, (m, src) => {
  if (!src.includes('[oó]') && !src.includes('[ií]') && !src.includes('[aá]') && !src.includes('[eé]') && !src.includes('[uú]')) {
    // sin vocales acentuadas en clase final: verificar igualmente si el
    // último carácter del alternante puede ser acentuado — por seguridad
    // convertimos todos igualmente.
  }
  inlineCount++;
  const esc = src.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `rx('${esc}').test(`;
});
console.log('inline convertidos:', inlineCount);

fs.writeFileSync(f, t);
console.log('sports-classifier OK');
