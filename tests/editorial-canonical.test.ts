// @vitest-environment node
import { test, expect } from 'vitest';
import { evaluate } from '../lib/editorial/core/pipeline';
import type { NoticiaInput } from '../lib/editorial/core/types';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const canonical: { slug: string; titulo: string; categoria: string; tipoContenido: string; input: NoticiaInput; expected: any }[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures/canonical-noticias.json'), 'utf8')
);

test.each(canonical)('Dataset canónico — $slug', ({ input, expected, categoria, tipoContenido }) => {
  const result = evaluate(input);

  expect(result.scoreFinal, `scoreFinal difiere para ${input.slug}`).toBe(expected.scoreFinal);
  expect(result.veredicto, `veredicto difiere para ${input.slug}`).toBe(expected.veredicto);
  expect(result.seo.score).toBe(expected.scores.SEO);
  expect(result.eeat.score).toBe(expected.scores.EEAT);
  expect(result.discover.score).toBe(expected.scores.DISCOVER);
  expect(result.adsense.score).toBe(expected.scores.ADSENSE);
  expect(result.valorEditorial.score).toBe(expected.scores.VALOR_EDITORIAL);
  expect(result.forense.score).toBe(expected.scores.FORENSE);

  // Sanity de categorización: si el motor cambia la categoría o tipo, rompe para revisar
  expect(result.evidence.category, `categoría detectada para ${input.slug}`).toBe(categoria);
  expect(result.evidence.tipoContenido, `tipoContenido para ${input.slug}`).toBe(tipoContenido);
});
