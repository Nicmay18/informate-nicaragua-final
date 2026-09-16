// tests/nios/validators/validators.adversarial.test.ts
// Suite adversarial de NIOS Execution 005 Fase 2.1.
// Propósito: someter a los validators a casos límite y falsos positivos potenciales.
// No depende de datos de producción ni de Firestore.

import { describe, it, expect } from 'vitest';
import type { Issue } from '@/lib/nios/validators/types';
import { FALLBACK_IMAGE } from '@/lib/types';
import {
  findOriginalSentence,
  repairPuntosClave,
  validateContent,
  validateFuente,
  validateImagen,
  validateInternalLinks,
  validateLead,
  validatePuntoClave,
  validateSubtitulos,
  validateTitle,
} from '@/lib/nios/validators';
import { sentenceCount, wordCount } from '@/lib/nios/validators/text';
import { antorchaContenido, antorchaNoticia } from '@/tests/fixtures/antorcha';
import {
  baseNoticia,
  makeContent,
  makeParagraph,
  makePunto,
  makeResumen,
} from './adversarial-helpers';

function has(issues: Issue[], code: string, blocking?: boolean): boolean {
  return issues.some((i) => i.code === code && (blocking === undefined || i.blocking === blocking));
}

function onlyCodes(issues: Issue[]): string[] {
  return issues.map((i) => i.code);
}

// TÍTULO
// =============================================================================

describe('validateTitle — adversarial', () => {
  function titleOfLength(n: number): string {
    return `Ant${'x'.repeat(Math.max(0, n - 3))}`;
  }

  it('boundary lengths: blocks 9, passes 10, passes 90, blocks 91', () => {
    expect(has(validateTitle(baseNoticia({ titulo: titleOfLength(9) })), 'T1.2', true)).toBe(true);
    expect(validateTitle(baseNoticia({ titulo: titleOfLength(10) }))).toEqual([]);
    expect(validateTitle(baseNoticia({ titulo: titleOfLength(90) }))).toEqual([]);
    expect(has(validateTitle(baseNoticia({ titulo: titleOfLength(91) })), 'T1.2', true)).toBe(true);
  });

  it('blocks punctuation at start or end (including Spanish ¡ ¿)', () => {
    expect(has(validateTitle(baseNoticia({ titulo: '!Noticia' })), 'T1.3', true)).toBe(true);
    expect(has(validateTitle(baseNoticia({ titulo: 'Noticia!' })), 'T1.3', true)).toBe(true);
    expect(has(validateTitle(baseNoticia({ titulo: '¿Noticia?' })), 'T1.3', true)).toBe(true);
    expect(has(validateTitle(baseNoticia({ titulo: 'Noticia.' })), 'T1.3', true)).toBe(true);
    expect(has(validateTitle(baseNoticia({ titulo: '(Noticia)' })), 'T1.3', true)).toBe(true);
  });

  it('blocks title identical to slug, even with accents normalization', () => {
    const n = baseNoticia({
      titulo: 'Antorcha Recorré Nicarágua',
      slug: 'antorcha-recorre-nicaragua',
    });
    expect(has(validateTitle(n), 'T1.5', true)).toBe(true);
  });

  it('blocks title identical to metaDescription', () => {
    const n = baseNoticia({
      titulo: 'Antorcha recorre Nicaragua',
      metaDescription: 'Antorcha recorre Nicaragua',
    });
    expect(has(validateTitle(n), 'T1.6', true)).toBe(true);
  });

  it('blocks three consecutive all-caps words, allows two', () => {
    expect(has(validateTitle(baseNoticia({ titulo: 'ONU FDA aprobó resolución' })), 'T1.7', true)).toBe(false);
    expect(has(validateTitle(baseNoticia({ titulo: 'ONU FDA OMS aprobaron resolución' })), 'T1.7', true)).toBe(true);
  });

  it('blocks titles ending in preposition or conjunction', () => {
    expect(has(validateTitle(baseNoticia({ titulo: 'Antorcha recorre de' })), 'T1.8', true)).toBe(true);
    expect(has(validateTitle(baseNoticia({ titulo: 'Antorcha recorre y' })), 'T1.8', true)).toBe(true);
    expect(has(validateTitle(baseNoticia({ titulo: 'Antorcha recorre del' })), 'T1.8', true)).toBe(true);
    expect(has(validateTitle(baseNoticia({ titulo: 'Antorcha recorre al' })), 'T1.8', true)).toBe(true);
  });

  it('blocks titles without a significant word (>=4 chars)', () => {
    expect(has(validateTitle(baseNoticia({ titulo: 'la y en de' })), 'T1.4', true)).toBe(true);
  });
});

// LEAD
// =============================================================================

describe('validateLead — adversarial', () => {
  it('word-count boundaries are exact', () => {
    const boundaries: [number, 'blocking' | 'warning' | 'ok'][] = [
      [24, 'blocking'],
      [25, 'warning'],
      [34, 'warning'],
      [35, 'ok'],
      [60, 'ok'],
      [61, 'warning'],
      [75, 'warning'],
      [76, 'blocking'],
    ];
    for (const [n, expected] of boundaries) {
      const resumen = makeResumen(n, 1);
      expect(wordCount(resumen)).toBe(n);
      const issues = validateLead(baseNoticia({ resumen }));
      if (expected === 'blocking') {
        expect(has(issues, 'R1.1', true)).toBe(true);
        expect(has(issues, 'R1.1W')).toBe(false);
      } else if (expected === 'warning') {
        expect(has(issues, 'R1.1W')).toBe(true);
        expect(has(issues, 'R1.1', true)).toBe(false);
      } else {
        expect(has(issues, 'R1.1')).toBe(false);
        expect(has(issues, 'R1.1W')).toBe(false);
      }
    }
  });

  it('sentence-count boundaries are exact (1-3 ok, 0 and >3 blocked)', () => {
    expect(validateLead(baseNoticia({ resumen: '' })).some((i) => i.code === 'R1.1')).toBe(true);

    for (const s of [1, 2, 3]) {
      const resumen = makeResumen(40, s);
      expect(sentenceCount(resumen)).toBe(s);
      const issues = validateLead(baseNoticia({ resumen }));
      expect(has(issues, 'R1.2', true)).toBe(false);
      expect(has(issues, 'R1.1', true)).toBe(false);
    }

    const four = makeResumen(40, 4);
    expect(sentenceCount(four)).toBe(4);
    expect(has(validateLead(baseNoticia({ resumen: four })), 'R1.2', true)).toBe(true);
  });

  it('blocks lead that is simply the title expanded', () => {
    const titulo = 'Antorcha Centroamericana recorrerá Nicaragua del 10 al 13';
    const resumen = `${titulo} de septiembre y será entregada a Costa Rica en Peñas Blancas.`;
    const issues = validateLead(baseNoticia({ titulo, resumen }));
    expect(has(issues, 'R1.10', true)).toBe(true);
  });

  it('blocks lead that duplicates the first paragraph (jaccard >= 0.70)', () => {
    const contenido = makeContent(80, 2);
    const first = contenido.match(/<p>(.*?)<\/p>/)?.[1] ?? '';
    const resumen = first.replace(/<[^>]+>/g, '');
    const issues = validateLead(baseNoticia({ contenido, resumen }));
    expect(has(issues, 'R1.9', true)).toBe(true);
  });

  it('flags generic leads via denylist even if short', () => {
    const issues = validateLead(baseNoticia({ resumen: 'comunicado de prensa de redaccion nicaragua informate' }));
    expect(has(issues, 'R1.7', true)).toBe(true);
  });

  it('blocks leads ending in preposition or conjunction', () => {
    const base = makeResumen(35, 1);
    const words = base.split(' ');
    words[words.length - 1] = 'de.';
    const resumen = words.join(' ');
    expect(wordCount(resumen)).toBe(35);
    const issues = validateLead(baseNoticia({ resumen }));
    expect(has(issues, 'R1.8', true)).toBe(true);
  });

  it('R1.3: warns when the lead lacks a predicative or qué signal', () => {
    const resumen =
      'La Antorcha Centroamericana en Nicaragua del 10 al 13 de septiembre, con delegación de todo el departamento del país en actos de cultura y encuentro comunitario en comunidad local, además de participación de representación de cada zona del territorio nacional en el próximo día.';
    const issues = validateLead(baseNoticia({ resumen }));
    expect(has(issues, 'R1.3')).toBe(true);
    expect(has(issues, 'R1.1', true)).toBe(false);
    expect(has(issues, 'R1.2', true)).toBe(false);
    expect(has(issues, 'R1.7', true)).toBe(false);
    expect(has(issues, 'R1.8', true)).toBe(false);
  });

  it('R1.3: passes when the lead has a valid predicative', () => {
    const resumen = makeResumen(40, 1);
    const issues = validateLead(baseNoticia({ resumen }));
    expect(has(issues, 'R1.3')).toBe(false);
    expect(onlyCodes(issues)).toEqual([]);
  });
});

// CONTENIDO
// =============================================================================

describe('validateContent — adversarial', () => {
  it('boundary word count: 349 blocks (C1.2), 350 passes', () => {
    const c349 = makeContent(349, 3);
    const c350 = makeContent(350, 3);
    expect(wordCount(c349)).toBe(349);
    expect(wordCount(c350)).toBe(350);
    expect(has(validateContent(baseNoticia({ contenido: c349 })), 'C1.2', true)).toBe(true);
    expect(has(validateContent(baseNoticia({ contenido: c350 })), 'C1.2', true)).toBe(false);
  });

  it('sanitizes broken but readable HTML without crashing', () => {
    const contenido = '<p>La Antorcha recorrerá Nicaragua del 10 al 13 de septiembre. <br> <span>Texto extra';
    const issues = validateContent(baseNoticia({ contenido }));
    expect(has(issues, 'C1.1')).toBe(false);
  });

  it('blocks H1 tags', () => {
    const contenido = '<h1>Título</h1><p>La Antorcha recorrerá Nicaragua.</p>';
    expect(has(validateContent(baseNoticia({ contenido })), 'C1.9', true)).toBe(true);
  });

  it('blocks script tags', () => {
    const contenido = "<p>Texto</p><script>alert('x')</script>";
    expect(has(validateContent(baseNoticia({ contenido })), 'C1.7', true)).toBe(true);
  });

  it('blocks iframe tags', () => {
    const contenido = '<p>Texto</p><iframe src="https://example.com"></iframe>';
    expect(has(validateContent(baseNoticia({ contenido })), 'C1.8', true)).toBe(true);
  });

  it('flags paragraphs with too many words', () => {
    const contenido = makeParagraph(130, 3);
    expect(has(validateContent(baseNoticia({ contenido })), 'C1.6')).toBe(true);
  });

  it('flags paragraphs with sentence count outside 2-5', () => {
    const one = makeParagraph(40, 1);
    const six = makeParagraph(80, 6);
    expect(has(validateContent(baseNoticia({ contenido: one })), 'C1.5')).toBe(true);
    expect(has(validateContent(baseNoticia({ contenido: six })), 'C1.5')).toBe(true);
  });
});

// PUNTOS CLAVE
// =============================================================================

describe('validatePuntoClave — adversarial', () => {
  it('word-count boundaries are exact (6-40 ok, outside blocking)', () => {
    const cases: [number, boolean][] = [
      [5, true],
      [6, false],
      [40, false],
      [41, true],
    ];
    for (const [n, shouldBlock] of cases) {
      const p = makePunto(n);
      expect(wordCount(p)).toBe(n);
      const issues = validatePuntoClave(p);
      expect(has(issues, 'PK2', true)).toBe(shouldBlock);
    }
  });

  it('passes for a clean 6-word point', () => {
    expect(validatePuntoClave(makePunto(6))).toEqual([]);
  });

  it('blocks missing terminal punctuation', () => {
    const p = makePunto(6).slice(0, -1);
    expect(has(validatePuntoClave(p), 'PK3', true)).toBe(true);
  });

  it('blocks lowercase start', () => {
    const p = makePunto(6).replace(/^La/, 'la');
    expect(has(validatePuntoClave(p), 'PK4', true)).toBe(true);
  });

  it('blocks points ending in preposition or conjunction', () => {
    expect(has(validatePuntoClave('La Antorcha recorrerá Nicaragua en septiembre y será entregada a.'), 'PK5', true)).toBe(true);
    expect(has(validatePuntoClave('La Antorcha recorrerá Nicaragua en septiembre y.'), 'PK6', true)).toBe(true);
  });

  it('blocks points without a predicative or content token', () => {
    expect(has(validatePuntoClave('La Antorcha de septiembre en Nicaragua.'), 'PK7', true)).toBe(true);
    expect(has(validatePuntoClave('La de el y a en.'), 'PK8', true)).toBe(true);
  });

  it('blocks duplicated or artificial punctuation', () => {
    expect(has(validatePuntoClave('La Antorcha recorrerá Nicaragua en septiembre..'), 'PK16', true)).toBe(true);
  });

  it('blocks word truncated with hyphen or em-dash at the end', () => {
    expect(has(validatePuntoClave('La Antorcha recorrerá Nicaragua en septiembre-.'), 'PK13', true)).toBe(true);
  });

  it('blocks unclosed parenthesis and quotes', () => {
    expect(has(validatePuntoClave('La Antorcha recorrerá (Nicaragua en septiembre.'), 'PK14', true)).toBe(true);
    expect(has(validatePuntoClave('La Antorcha "recorrerá Nicaragua en septiembre.'), 'PK15', true)).toBe(true);
  });

  it('detects PK_TRUNCATED + PK_ENDS_WITH_PREPOSITION on Antorcha real points', () => {
    const [p1, p2, p3] = antorchaNoticia.puntosClave ?? [];
    expect(has(validatePuntoClave(p1 as string, antorchaContenido), 'PK_TRUNCATED', true)).toBe(true);
    expect(has(validatePuntoClave(p2 as string, antorchaContenido), 'PK_TRUNCATED', true)).toBe(true);
    expect(has(validatePuntoClave(p3 as string, antorchaContenido), 'PK_TRUNCATED', true)).toBe(true);
  });

  it('does not flag a complete prefix sentence as truncated if it is grammatically closed', () => {
    const p = 'La antorcha centroamericana simboliza la unión de los pueblos.';
    const issues = validatePuntoClave(p, antorchaContenido);
    expect(has(issues, 'PK_TRUNCATED')).toBe(false);
  });

  it('does not flag PK_TRUNCATED when the point is not in the content', () => {
    const p = 'La Antorcha recorrerá España en octubre.';
    const issues = validatePuntoClave(p, antorchaContenido);
    expect(has(issues, 'PK_TRUNCATED')).toBe(false);
    expect(has(issues, 'PK2', true)).toBe(false);
  });

  it('PK11: blocks a point that is exactly the title', () => {
    const titulo = 'La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13';
    const p = `${titulo}.`;
    const issues = validatePuntoClave(p, undefined, { titulo, resumen: 'Otro texto cualquiera con suficientes palabras de prueba.' });
    expect(has(issues, 'PK11', true)).toBe(true);
    expect(onlyCodes(issues)).toEqual(['PK11']);
  });

  it('PK12: blocks a point that is exactly the lead', () => {
    const resumen = 'La Antorcha recorrerá Nicaragua en septiembre y será entregada a Costa Rica.';
    const p = resumen;
    const issues = validatePuntoClave(p, undefined, {
      titulo: 'Viaje de la Antorcha por el istmo centroamericano',
      resumen,
    });
    expect(has(issues, 'PK12', true)).toBe(true);
    expect(onlyCodes(issues)).toEqual(['PK12']);
  });
});

// findOriginalSentence & repair
// =============================================================================

describe('findOriginalSentence & repairPuntosClave — adversarial', () => {
  it('finds original when the point omits the leading article', () => {
    const source = 'La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13.';
    expect(findOriginalSentence('Antorcha Centroamericana recorrerá Nicaragua', source)).toBe(source);
  });

  it('does not pick a sentence where the point only appears mid-sentence (substring, not prefix)', () => {
    const source = 'El delegado recibió la antorcha en Boaco durante la ceremonia oficial.';
    expect(findOriginalSentence('la antorcha en Boaco', source)).toBe(null);
  });

  it('is deterministic with multiple prefix matches (first source sentence wins)', () => {
    const source = 'La Antorcha recorrerá Nicaragua. La Antorcha llegará a Costa Rica.';
    expect(findOriginalSentence('La Antorcha', source)).toBe('La Antorcha recorrerá Nicaragua.');
  });

  it('rolls back when the repaired sentence is itself invalid (>40 words)', () => {
    const longSentence = 'La comisión organizadora del recorrido de la antorcha centroamericana confirmó que las delegaciones estudiantiles de todos los departamentos del país participarán en los actos culturales programados durante la semana de celebraciones patrias junto a docentes autoridades locales y familias de las comunidades cercanas al trayecto oficial.';
    const truncated = 'La comisión organizadora del recorrido de la antorcha centroamericana confirmó que las delegaciones estudiantiles de.';
    const noticia = baseNoticia({
      contenido: `<p>${longSentence}</p>`,
      puntosClave: [truncated],
    });
    const { records, puntosClave } = repairPuntosClave(noticia);
    const rec = records[0];
    expect(rec.proposedChange).toBe(longSentence);
    expect(rec.after).toBe(rec.before);
    expect(rec.validationResult.valid).toBe(false);
    expect(puntosClave).toBe(null);
  });

  it('does not invent a repair when no safe original sentence exists', () => {
    const noticia = baseNoticia({
      contenido: antorchaContenido,
      puntosClave: ['La Antorcha recorrerá España en octubre de.'],
    });
    const result = repairPuntosClave(noticia);
    expect(result.puntosClave).toBe(null);
    expect(result.records[0]?.proposedChange).toBe(null);
  });

  it('is idempotent on already-repaired points', () => {
    const noticia = baseNoticia({
      contenido: antorchaContenido,
      puntosClave: antorchaNoticia.puntosClave,
    });
    const first = repairPuntosClave(noticia);
    const second = repairPuntosClave({ ...noticia, puntosClave: first.puntosClave ?? undefined });
    expect(second.puntosClave).toEqual(first.puntosClave);
  });
});

// FUENTE
// =============================================================================

describe('validateFuente — adversarial', () => {
  it('blocks invalid URLs', () => {
    expect(has(validateFuente(baseNoticia({ fuente: 'http://' })), 'F1.2', true)).toBe(true);
    expect(has(validateFuente(baseNoticia({ fuente: 'httpx://example.com' })), 'F1.2', true)).toBe(true);
  });

  it('passes valid external URL and valid textual source', () => {
    expect(validateFuente(baseNoticia({ fuente: 'https://example.com/noticia' }))).toEqual([]);
    expect(validateFuente(baseNoticia({ fuente: 'Ministerio de Educación de Nicaragua' }))).toEqual([]);
  });

  it('blocks generic/own sources regardless of complementarias', () => {
    const n1 = baseNoticia({
      fuente: 'Redaccion Nicaragua Informate',
      fuentesComplementarias: ['https://example.com/concreto'],
    });
    expect(has(validateFuente(n1), 'F1.4', true)).toBe(true);

    const n2 = baseNoticia({
      fuente: 'Nicaragua Informate',
      fuentesComplementarias: ['https://example.com/concreto'],
    });
    expect(has(validateFuente(n2), 'F1.4', true)).toBe(true);
  });

  it('blocks textual source with fewer than 2 tokens', () => {
    expect(has(validateFuente(baseNoticia({ fuente: 'ABC' })), 'F1.3', true)).toBe(true);
  });
});

// IMAGEN
// =============================================================================

describe('validateImagen — adversarial', () => {
  it('blocks missing image', () => {
    expect(has(validateImagen(baseNoticia({ imagen: '' })), 'I1.1', true)).toBe(true);
  });

  it('blocks invalid prefix', () => {
    expect(has(validateImagen(baseNoticia({ imagen: 'logo.webp' })), 'I1.2', true)).toBe(true);
    expect(has(validateImagen(baseNoticia({ imagen: 'ftp://example.com/img.jpg' })), 'I1.2', true)).toBe(true);
  });

  it('warns on fallback image', () => {
    const issues = validateImagen(baseNoticia({ imagen: FALLBACK_IMAGE }));
    expect(has(issues, 'I1.3', false)).toBe(true);
    expect(issues.every((i) => !i.blocking)).toBe(true);
  });

  it('accepts valid prefixes', () => {
    expect(validateImagen(baseNoticia({ imagen: '/imagen.jpg' }))).toEqual([]);
    expect(validateImagen(baseNoticia({ imagen: 'data:image/png;base64,abc' }))).toEqual([]);
    expect(validateImagen(baseNoticia({ imagen: 'https://cdn.example/img.jpg' }))).toEqual([]);
  });
});

// SUBTÍTULOS
// =============================================================================

describe('validateSubtitulos — adversarial', () => {
  it('reports empty, short, duplicated and emoji H2s', () => {
    const contenido = '<h2></h2><h2>El recorrido previsto</h2><h2>El recorrido previsto</h2><h2>Recorrido 🎉</h2>';
    const issues = validateSubtitulos(baseNoticia({ contenido }));
    expect(has(issues, 'S1.1')).toBe(true);
    expect(has(issues, 'S1.2')).toBe(true);
    expect(has(issues, 'S1.3')).toBe(true);
    expect(has(issues, 'S1.4')).toBe(true);
  });

  it('passes valid H2s', () => {
    const contenido = '<h2>Recorrido previsto nacional</h2><h2>Entrega en San Benito</h2>';
    expect(validateSubtitulos(baseNoticia({ contenido }))).toEqual([]);
  });
});

// ENLACES INTERNOS
// =============================================================================

describe('validateInternalLinks — adversarial', () => {
  it('boundary word count: only >=450 triggers L1.1', () => {
    const c449 = makeContent(449, 3);
    const c450 = makeContent(450, 3);
    expect(wordCount(c449)).toBe(449);
    expect(wordCount(c450)).toBe(450);

    expect(validateInternalLinks(baseNoticia({ contenido: c449 }))).toEqual([]);
    expect(has(validateInternalLinks(baseNoticia({ contenido: c450 })), 'L1.1', false)).toBe(true);
  });

  it('accepts internal links in content or related_links', () => {
    const c450 = makeContent(450, 3);
    const withLink = `${c450}<p><a href="/noticias/otra">Otra noticia</a></p>`;
    expect(validateInternalLinks(baseNoticia({ contenido: withLink }))).toEqual([]);

    const withRelated = baseNoticia({
      contenido: c450,
      related_links: [{ url: '/noticias/relacionada', anchor: 'Relacionada', type: 'internal' }],
    });
    expect(validateInternalLinks(withRelated)).toEqual([]);
  });

  it('does not count malformed or non-internal links', () => {
    const c450 = makeContent(450, 3);
    const malformed = `${c450}<p><a href="noticias/otra">Otra</a></p>`;
    expect(has(validateInternalLinks(baseNoticia({ contenido: malformed })), 'L1.1', false)).toBe(true);
  });
});
