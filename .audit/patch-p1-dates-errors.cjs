const fs = require('fs');

function patch(file, oldBlock, newBlock, label) {
  let t = fs.readFileSync(file, 'utf8');
  const crlf = oldBlock.replace(/\n/g, '\r\n');
  if (t.includes(oldBlock)) t = t.replace(oldBlock, newBlock);
  else if (t.includes(crlf)) t = t.replace(crlf, newBlock.replace(/\n/g, '\r\n'));
  else { console.log('anchor not found: ' + label); process.exit(1); }
  fs.writeFileSync(file, t);
  console.log(label + ' OK');
}

// ── 1) safeIsoDate en lib/seo/schema.ts — no fabricar fechas
patch('lib/seo/schema.ts',
`/** Prevent Invalid Date in JSON-LD */
function safeIsoDate(value?: string | Date): string {
  if (!value) return new Date().toISOString();
  const d = typeof value === 'string' ? new Date(value) : value;
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}`,
`/** Fecha editorial en JSON-LD: válida → ISO; inválida/ausente → undefined
 *  (nunca fabricar "hoy" — una fecha inventada es peor que campo ausente). */
function safeIsoDate(value?: string | Date): string | undefined {
  if (!value) return undefined;
  const d = typeof value === 'string' ? new Date(value) : value;
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}`,
'schema.ts safeIsoDate');

// Omitir campos cuando la fecha no es válida (undefined no se serializa)
patch('lib/seo/schema.ts',
`    datePublished: safeIsoDate(article.fecha),
    dateModified: safeIsoDate(article.fechaActualizacion || article.fecha),`,
`    ...(safeIsoDate(article.fecha) ? { datePublished: safeIsoDate(article.fecha) } : {}),
    ...(safeIsoDate(article.fechaActualizacion || article.fecha)
      ? { dateModified: safeIsoDate(article.fechaActualizacion || article.fecha) } : {}),`,
'schema.ts datePublished omit');

// ── 2) safeIsoDate en components/SEO/JsonLdSchema.tsx
patch('components/SEO/JsonLdSchema.tsx',
`/** Evita Invalid Date en JSON-LD; siempre retorna ISO string válida */
function safeIsoDate(value?: string | Date): string {
  if (!value) return new Date().toISOString();
  const d = typeof value === 'string' ? new Date(value) : value;
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}`,
`/** Fecha editorial en JSON-LD: válida → ISO; inválida/ausente → undefined
 *  (nunca fabricar "hoy" — una fecha inventada es peor que campo ausente). */
function safeIsoDate(value?: string | Date): string | undefined {
  if (!value) return undefined;
  const d = typeof value === 'string' ? new Date(value) : value;
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}`,
'JsonLdSchema safeIsoDate');

// ── 3) safeGet ERROR ≠ EMPTY en lib/data.ts
patch('lib/data.ts',
`  const safeGet = async (label: string, q: any): Promise<QueryDocumentSnapshot[]> => {
    try {
      return (await q.get()).docs;
    } catch (err) {
      logger.warn(\`[data.ts] query \${label} falló:\`, err instanceof Error ? err.message : String(err));
      return [];
    }
  };`,
`  // ERROR ≠ EMPTY: un query que falla NO significa "no hay documentos".
  // Se registra cada error y, si TODAS las sub-queries fallan, se lanza —
  // el caller puede distinguir "corpus vacío" de "Firestore caído".
  let queryErrors = 0;
  let queriesRun = 0;
  const safeGet = async (label: string, q: any): Promise<QueryDocumentSnapshot[]> => {
    queriesRun++;
    try {
      return (await q.get()).docs;
    } catch (err) {
      queryErrors++;
      logger.warn(\`[data.ts] query \${label} falló:\`, err instanceof Error ? err.message : String(err));
      return [];
    }
  };`,
'data.ts safeGet counter');

// Después del merge: si todo falló y el resultado es vacío → ERROR, no EMPTY.
patch('lib/data.ts',
`  const merged = new Map<string, QueryDocumentSnapshot>();
  for (const d of [...tsDocs, ...stringDocs, ...publishedAtDocs]) merged.set(d.id, d);`,
`  const merged = new Map<string, QueryDocumentSnapshot>();
  for (const d of [...tsDocs, ...stringDocs, ...publishedAtDocs]) merged.set(d.id, d);

  // Si todas las queries fallaron, un resultado vacío es ERROR — no EMPTY.
  if (merged.size === 0 && queryErrors > 0 && queryErrors >= queriesRun) {
    throw new Error(\`[data.ts] fetchPublishedDocs: \${queryErrors}/\${queriesRun} queries fallaron — Firestore no disponible, no corpus vacío\`);
  }`,
'data.ts ERROR≠EMPTY');

console.log('done');
