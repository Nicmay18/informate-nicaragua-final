const fs = require('fs');
const f = 'lib/meni/editor-autonomo/engine.ts';
let t = fs.readFileSync(f, 'utf8');

const oldBlock = `    // Aprobado = EditorialDecision.publicar y no hay issues técnicos críticos
    generated.aprobado = decision.publicar && !qualityGatePost.bloqueado;`;

const newBlock = `    // DECISIÓN FINAL INMUTABLE — ninguna etapa posterior puede revertir un
    // bloqueo anterior. publicationAllowed = decision AND qualityGate AND
    // quoteGuard. No reasignar generated.aprobado después de esta línea.
    generated.aprobado = decision.publicar && !qualityGatePost.bloqueado && quoteGuard.ok;`;

const oldCrlf = oldBlock.replace(/\n/g, '\r\n');
if (t.includes(oldBlock)) t = t.replace(oldBlock, newBlock);
else if (t.includes(oldCrlf)) t = t.replace(oldCrlf, newBlock.replace(/\n/g, '\r\n'));
else { console.log('anchor not found'); process.exit(1); }

fs.writeFileSync(f, t);
console.log('immutable decision OK');
