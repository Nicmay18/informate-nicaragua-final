const fs = require('fs');
const f = 'lib/meni/editor-autonomo/engine.ts';
let t = fs.readFileSync(f, 'utf8');

// import
const impAnchor = "import { validateQuotesAndAttributions } from '@/lib/editorial/quote-guard';";
if (t.includes(impAnchor) && !t.includes('computePublicationAllowed')) {
  t = t.replace(impAnchor, impAnchor + "\nimport { computePublicationAllowed } from './decision';");
}

// uso
const oldLine = 'generated.aprobado = decision.publicar && !qualityGatePost.bloqueado && quoteGuard.ok;';
const newLine = `generated.aprobado = computePublicationAllowed({
      editorialPublicar: decision.publicar,
      qualityGateBloqueado: qualityGatePost.bloqueado,
      quoteGuardOk: quoteGuard.ok,
    });`;
if (t.includes(oldLine)) {
  t = t.replace(oldLine, newLine);
} else { console.log('decision line not found'); process.exit(1); }

fs.writeFileSync(f, t);
console.log('computePublicationAllowed wired');
