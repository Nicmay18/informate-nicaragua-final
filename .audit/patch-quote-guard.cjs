const fs = require('fs');
const f = 'lib/meni/editor-autonomo/engine.ts';
let t = fs.readFileSync(f, 'utf8');

// 1) import
const impAnchor = "import { sanitizeArticleHtml } from '@/lib/sanitize';";
if (!t.includes(impAnchor)) { console.log('import anchor not found'); process.exit(1); }
if (!t.includes('quote-guard')) {
  t = t.replace(impAnchor, impAnchor + "\nimport { validateQuotesAndAttributions } from '@/lib/editorial/quote-guard';");
}

// 2) wiring tras qualityGatePost
const anchor = "  generated.articuloCompleto = qualityGatePost.textoCorregido;\n  generated.correccionesAplicadas = [\n    ...generated.correccionesAplicadas,\n    ...qualityGatePost.corregidos.map((c) => c.descripcion),\n  ];";
const anchorCrlf = anchor.replace(/\n/g, '\r\n');

const guard = `

  // ═══════════════════════════════════════════════════════════
  // QUOTE GUARD — defensa técnica anti citas/atribuciones fabricadas.
  // Toda cita textual y toda atribución del texto generado debe existir
  // en la fuente original. Si no existe → FABRICATED → NO PUBLICAR.
  // El prompt dice "no inventar" — esto es la garantía técnica, no el prompt.
  // ═══════════════════════════════════════════════════════════
  const quoteGuard = validateQuotesAndAttributions(input.fuente, generated.articuloCompleto);
  if (!quoteGuard.ok) {
    generated.aprobado = false;
    generated.riesgoEditorial = 'ROJO';
    generated.estadoEditorial = 'no_aporta';
    generated.recomendacionEditorial = 'revisar';
    generated.diagnosticoTecnico = \`Quote Guard: \${quoteGuard.reason}\`;
    generated.recomendaciones = [
      \`CITA FABRICADA — \${quoteGuard.reason}\`,
      ...quoteGuard.fabricatedQuotes.map(q => \`Cita sin respaldo: "\${q}"\`),
      ...quoteGuard.fabricatedAttributions.map(a => \`Atribución sin respaldo: \${a}\`),
      ...generated.recomendaciones,
    ];
  }`;

if (t.includes(anchor)) {
  t = t.replace(anchor, anchor + guard);
} else if (t.includes(anchorCrlf)) {
  t = t.replace(anchorCrlf, anchorCrlf + guard.replace(/\n/g, '\r\n'));
} else { console.log('wiring anchor not found'); process.exit(1); }

fs.writeFileSync(f, t);
console.log('quote-guard wiring OK');
