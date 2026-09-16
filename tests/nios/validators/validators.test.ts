// tests/nios/validators/validators.test.ts
// Tests de la primera etapa de NIOS Execution 005 Fase 2.1.

import { describe, it, expect } from 'vitest';
import type { Noticia } from '@/lib/types';
import {
  validateTitle,
  validateLead,
  validateContent,
  validatePuntoClave,
  validateFuente,
  validateImagen,
  validateSubtitulos,
  validateInternalLinks,
  findOriginalSentence,
  repairPuntosClave,
} from '@/lib/nios/validators';
import { antorchaNoticia, antorchaFuenteOrigen } from '@/tests/fixtures/antorcha';

function baseNoticia(partial: Partial<Noticia> = {}): Noticia {
  return {
    id: 'test-001',
    slug: 'test-001',
    titulo: 'Antorcha Centroamericana recorrerá Nicaragua del 10 al 13',
    resumen: 'La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre y será entregada a Costa Rica.',
    contenido: '',
    categoria: 'Nacionales',
    imagen: 'https://cdn.example/antorcha.jpg',
    fecha: new Date().toISOString(),
    estado: 'publicado',
    ...partial,
  } as Noticia;
}

const LONG_CONTENT = `<h2>Recorrido previsto</h2>
<p>La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre. La actividad comenzará en la frontera norte de Las Manos. Los organizadores recibirán el fuego proveniente de Honduras. El recorrido incluirá paradas en múltiples municipios. El objetivo es fortalecer la unión centroamericana.</p>
<p>Durante las jornadas participarán estudiantes de secundaria de todo el país. Las autoridades educativas coordinan la logística del evento. La Policía Nacional acompañará el trayecto. Se prevé un recibimiento masivo en la capital. La antorcha será custodiada por voluntarios certificados.</p>
<h2>Entrega en San Benito</h2>
<p>En el empalme de San Benito, Boaco, el diputado Juan Hernández entregó la antorcha. El delegado de Jinotega recibió el símbolo educativo. La actividad ocurrió en el peaje de Las Lomas. Cientos de jóvenes portaron banderas de los países centroamericanos. La caravana continuó rumbo al departamento de Matagalpa.</p>
<p>El alcalde de San Benito destacó la importancia del intercambio cultural. Los estudiantes entonaron el himno centroamericano. Se tomaron fotografías para el archivo histórico del municipio. La prensa local cubrió la ceremonia.</p>
<h2>Significado e historia</h2>
<p>La antorcha centroamericana simboliza la unión de los pueblos. Llegará a Costa Rica el próximo viernes. Los organizadores confirmaron la fecha en conferencia de prensa. La llama representa hermandad y paz. Cada país recorre un tramo del trayecto antes de entregar el fuego al siguiente destino.</p>
<p>El cierre de la jornada en Nicaragua está programado para el sábado 13 de septiembre. Los estudiantes sostendrán la antorcha durante el último tramo. El acto final se realizará en Peñas Blancas. La prensa internacional cubrirá el evento. Las autoridades invitan a la población a participar.</p>
<h2>Reacciones locales</h2>
<p>Los pobladores de Boaco expresaron su satisfacción por la visita. Los comercios cercanos al empalme recibieron más clientes. Los jóvenes aprovecharon para compartir mensajes de paz. La antorcha fue el tema principal de conversación durante la tarde.</p>
<p>El Ministerio de Educación publicó un comunicado sobre las actividades. Los centros escolares prepararon pancartas de bienvenida. La comunidad organizó una pequeña feria cultural. Los padres de familia acompañaron a los estudiantes.</p>
<h2>Próximos pasos</h2>
<p>La delegación nicaragüense entregará la antorcha a Costa Rica. El cruce fronterizo está previsto para la mañana del 13 de septiembre. Las autoridades de ambos países coordinan los detalles. La prensa invitada recibirá credenciales especiales. El evento será transmitido por redes sociales oficiales.</p>`;

describe('validateTitle', () => {
  it('passes for a valid title', () => {
    const n = baseNoticia({ titulo: 'Antorcha Centroamericana recorrerá Nicaragua del 10 al 13' });
    expect(validateTitle(n)).toEqual([]);
  });

  it('blocks on empty title', () => {
    const n = baseNoticia({ titulo: '' });
    expect(validateTitle(n).some((i) => i.code === 'T1.1' && i.blocking)).toBe(true);
  });

  it('blocks on title shorter than 10 chars', () => {
    const n = baseNoticia({ titulo: 'Corto' });
    expect(validateTitle(n).some((i) => i.code === 'T1.2' && i.blocking)).toBe(true);
  });

  it('blocks on title longer than 90 chars', () => {
    const n = baseNoticia({
      titulo: 'Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre con muchísimos detalles adicionales incluidos',
    });
    expect(validateTitle(n).some((i) => i.code === 'T1.2' && i.blocking)).toBe(true);
  });

  it('blocks on title identical to slug', () => {
    const n = baseNoticia({
      titulo: 'Antorcha Centroamericana recorrera Nicaragua del 10 al 13',
      slug: 'antorcha-centroamericana-recorrera-nicaragua-del-10-al-13',
    });
    expect(validateTitle(n).some((i) => i.code === 'T1.5')).toBe(true);
  });

  it('blocks on title ending in a preposition', () => {
    const n = baseNoticia({ titulo: 'Antorcha recorrerá Nicaragua del 10 al 13 de' });
    expect(validateTitle(n).some((i) => i.code === 'T1.8')).toBe(true);
  });

  it('blocks on too many all-caps words', () => {
    const n = baseNoticia({ titulo: 'URGENTE NOTICIA IMPORTANTE HISTORICA' });
    expect(validateTitle(n).some((i) => i.code === 'T1.7')).toBe(true);
  });
});

describe('validateLead', () => {
  it('passes for a valid lead', () => {
    const n = baseNoticia({
      resumen: 'La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre y será entregada a Costa Rica en Peñas Blancas. El recorrido busca fortalecer la unión de los pueblos centroamericanos. Autoridades locales, docentes y voluntarios acompañarán la antorcha en cada etapa.',
    });
    const issues = validateLead(n);
    const blocking = issues.filter((i) => i.blocking);
    expect(blocking).toEqual([]);
  });

  it('blocks on short lead (<25 words)', () => {
    const n = baseNoticia({ resumen: 'La Antorcha recorrerá Nicaragua.' });
    expect(validateLead(n).some((i) => i.code === 'R1.1' && i.blocking)).toBe(true);
  });

  it('blocks on long lead (>75 words)', () => {
    const n = baseNoticia({
      resumen: 'La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre y será entregada a Costa Rica en Peñas Blancas. El recorrido busca fortalecer la unión de los pueblos centroamericanos. Autoridades locales, docentes, voluntarios y estudiantes acompañarán la antorcha en cada etapa del trayecto nacional programado para esta semana. La ceremonia incluirá actos culturales en varios municipios del país y promoverá el intercambio educativo entre las comunidades. Los organizadores invitaron a la población a participar en las actividades previstas para los próximos días.',
    });
    expect(validateLead(n).some((i) => i.code === 'R1.1' && i.blocking)).toBe(true);
  });

  it('warns on short lead 25-34 words', () => {
    const n = baseNoticia({ resumen: 'La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre, luego de ingresar al país y será entregada en Peñas Blancas. El recorrido incluye paradas en departamentos del norte y del pacífico.' });
    expect(validateLead(n).some((i) => i.code === 'R1.1W' && !i.blocking)).toBe(true);
  });

  it('warns on long lead 61-75 words', () => {
    const n = baseNoticia({
      resumen: 'La Antorcha Centroamericana recorrerá Nicaragua del 10 al 13 de septiembre y será entregada a Costa Rica en Peñas Blancas. El recorrido busca fortalecer la unión de los pueblos centroamericanos. Autoridades locales, docentes, voluntarios y estudiantes acompañarán la antorcha en cada etapa del trayecto nacional programado para esta semana. La ceremonia incluirá actos culturales en varios municipios del país y promoverá el intercambio educativo entre las comunidades.',
    });
    expect(validateLead(n).some((i) => i.code === 'R1.1W' && !i.blocking)).toBe(true);
  });

  it('blocks on generic lead', () => {
    const n = baseNoticia({ resumen: 'Redaccion Nicaragua Informate' });
    expect(validateLead(n).some((i) => i.code === 'R1.7' && i.blocking)).toBe(true);
  });

  it('blocks on lead duplicating first paragraph', () => {
    const first = 'La Antorcha recorrerá Nicaragua del 10 al 13 de septiembre.';
    const n = baseNoticia({
      resumen: first,
      contenido: `<p>${first}</p><p>El recorrido incluye varias paradas.</p>`,
    });
    expect(validateLead(n).some((i) => i.code === 'R1.9' && i.blocking)).toBe(true);
  });

  it('warns on missing entity, time and place', () => {
    const n = baseNoticia({ resumen: 'Algo ocurrió en algún momento.' });
    const warnings = validateLead(n).filter((i) => !i.blocking && ['R1.4', 'R1.5', 'R1.6'].includes(i.code));
    expect(warnings.length).toBeGreaterThanOrEqual(1);
  });
});

describe('validateContent', () => {
  it('passes for long valid content', () => {
    const n = baseNoticia({ contenido: LONG_CONTENT });
    const issues = validateContent(n);
    const blocking = issues.filter((i) => i.blocking);
    expect(blocking).toEqual([]);
  });

  it('blocks on thin content', () => {
    const n = baseNoticia({ contenido: '<p>La Antorcha recorrerá Nicaragua.</p>' });
    expect(validateContent(n).some((i) => i.code === 'C1.2' && i.blocking)).toBe(true);
  });

  it('blocks on emoji in content', () => {
    const n = baseNoticia({ contenido: '<p>La Antorcha recorrerá Nicaragua. \u{1F389}</p>' });
    expect(validateContent(n).some((i) => i.code === 'C1.4' && i.blocking)).toBe(true);
  });
});

describe('validatePuntoClave', () => {
  it('passes for a complete point', () => {
    const point = antorchaFuenteOrigen.primerPunto;
    const issues = validatePuntoClave(point, antorchaNoticia.contenido, { titulo: antorchaNoticia.titulo, resumen: antorchaNoticia.resumen });
    expect(issues).toEqual([]);
  });

  it('detects PK_TRUNCATED and PK_ENDS_WITH_PREPOSITION (Antorcha real, punto 1)', () => {
    const point = antorchaNoticia.puntosClave?.[0] as string;
    const issues = validatePuntoClave(point, antorchaNoticia.contenido, { titulo: antorchaNoticia.titulo, resumen: antorchaNoticia.resumen });
    expect(issues.some((i) => i.code === 'PK_TRUNCATED')).toBe(true);
    expect(issues.some((i) => i.code === 'PK5' || i.code === 'PK6')).toBe(true);
  });

  it('detects PK_TRUNCATED for points ending in "el"', () => {
    const point = antorchaNoticia.puntosClave?.[2] as string;
    const issues = validatePuntoClave(point, antorchaNoticia.contenido, { titulo: antorchaNoticia.titulo, resumen: antorchaNoticia.resumen });
    expect(issues.some((i) => i.code === 'PK_TRUNCATED')).toBe(true);
  });

  it('blocks on too short point', () => {
    expect(validatePuntoClave('Recorrerá Nicaragua.').some((i) => i.code === 'PK2')).toBe(true);
  });

  it('blocks on missing punctuation', () => {
    expect(validatePuntoClave('La Antorcha recorrerá Nicaragua del 10 al 13').some((i) => i.code === 'PK3')).toBe(true);
  });

  it('blocks on not starting with capital', () => {
    expect(validatePuntoClave('la antorcha recorrerá Nicaragua.').some((i) => i.code === 'PK4')).toBe(true);
  });

  it('blocks on unclosed parenthesis', () => {
    expect(validatePuntoClave('La Antorcha (Centroamericana recorrerá Nicaragua.').some((i) => i.code === 'PK14')).toBe(true);
  });

  it('blocks on duplicated punctuation', () => {
    expect(validatePuntoClave('La Antorcha recorrerá Nicaragua..').some((i) => i.code === 'PK16')).toBe(true);
  });

  it('finds original sentence for a truncated point', () => {
    const point = antorchaNoticia.puntosClave?.[0] as string;
    const original = findOriginalSentence(point, antorchaNoticia.contenido || '');
    expect(original).toBe(antorchaFuenteOrigen.primerPunto);
  });
});

describe('validateFuente', () => {
  it('passes for a valid URL source', () => {
    const n = baseNoticia({ fuente: 'https://www.mined.gob.ni/nota' });
    expect(validateFuente(n)).toEqual([]);
  });

  it('passes for a valid textual source', () => {
    const n = baseNoticia({ fuente: 'Ministerio de Educación de Nicaragua' });
    expect(validateFuente(n)).toEqual([]);
  });

  it('blocks on empty source', () => {
    const n = baseNoticia({ fuente: '' });
    expect(validateFuente(n).some((i) => i.code === 'F1.1' && i.blocking)).toBe(true);
  });

  it('blocks on generic source', () => {
    const n = baseNoticia({ fuente: 'Redacción Nicaragua Informate' });
    expect(validateFuente(n).some((i) => i.code === 'F1.4' && i.blocking)).toBe(true);
  });

  it('blocks on invalid URL source', () => {
    const n = baseNoticia({ fuente: 'http://' });
    expect(validateFuente(n).some((i) => i.code === 'F1.2' && i.blocking)).toBe(true);
  });
});

describe('validateImagen', () => {
  it('passes for valid external image', () => {
    const n = baseNoticia({ imagen: 'https://cdn.example/antorcha.jpg' });
    expect(validateImagen(n)).toEqual([]);
  });

  it('blocks on missing image', () => {
    const n = baseNoticia({ imagen: '' });
    expect(validateImagen(n).some((i) => i.code === 'I1.1' && i.blocking)).toBe(true);
  });

  it('warns on fallback image', () => {
    const n = baseNoticia({ imagen: '/logo.webp' });
    expect(validateImagen(n).some((i) => i.code === 'I1.3' && !i.blocking)).toBe(true);
  });

  it('blocks on invalid image prefix', () => {
    const n = baseNoticia({ imagen: 'ftp://cdn.example/antorcha.jpg' });
    expect(validateImagen(n).some((i) => i.code === 'I1.2' && i.blocking)).toBe(true);
  });
});

describe('validateSubtitulos', () => {
  it('passes for valid h2s', () => {
    const n = baseNoticia({ contenido: LONG_CONTENT });
    expect(validateSubtitulos(n).filter((i) => i.blocking).length).toBe(0);
  });

  it('reports short h2', () => {
    const n = baseNoticia({ contenido: '<h2>Hola</h2>' });
    expect(validateSubtitulos(n).some((i) => i.code === 'S1.2')).toBe(true);
  });

  it('reports duplicate h2', () => {
    const n = baseNoticia({ contenido: '<h2>Recorrido previsto</h2><h2>Recorrido previsto</h2>' });
    expect(validateSubtitulos(n).some((i) => i.code === 'S1.4')).toBe(true);
  });
});

describe('validateInternalLinks', () => {
  it('warns when long article has no internal links', () => {
    const n = baseNoticia({ contenido: LONG_CONTENT + ' ' + LONG_CONTENT });
    expect(validateInternalLinks(n).some((i) => i.code === 'L1.1' && !i.blocking)).toBe(true);
  });

  it('passes when internal links exist', () => {
    const n = baseNoticia({
      contenido: LONG_CONTENT + '<p><a href="/noticias/otra-noticia">Leer también</a></p>',
    });
    expect(validateInternalLinks(n)).toEqual([]);
  });

  it('passes when related_links are internal', () => {
    const n = baseNoticia({
      contenido: LONG_CONTENT,
      related_links: [{ url: '/noticias/otra-noticia', anchor: 'Leer', type: 'related' }],
    });
    expect(validateInternalLinks(n)).toEqual([]);
  });
});

describe('repairPuntosClave', () => {
  it('repairs the real Antorcha points using the original sentences', () => {
    const result = repairPuntosClave(antorchaNoticia);

    expect(result.puntosClave).toHaveLength(3);
    expect(result.puntosClave?.[0]).toBe(antorchaFuenteOrigen.primerPunto);
    expect(result.puntosClave?.[1]).toBe(antorchaFuenteOrigen.segundoPunto);
    expect(result.puntosClave?.[2]).toBe(antorchaFuenteOrigen.tercerPunto);

    expect(result.records.length).toBe(3);
    expect(result.records[0].proposedChange).not.toBe(result.records[0].before);
    expect(result.records[0].validationResult.valid).toBe(true);
  });

  it('returns null when no safe repair exists and preserves no-invent policy', () => {
    const n = baseNoticia({
      contenido: '<p>La Antorcha recorrerá Nicaragua del 10 al 13 de septiembre.</p>',
      puntosClave: ['El avión aterrizó tarde.'],
    });
    const result = repairPuntosClave(n);

    expect(result.puntosClave).toBeNull();
    expect(result.records[0].proposedChange).toBeNull();
  });

  it('rolls back to the original point when the original sentence is also invalid', () => {
    const punto = 'La antorcha fue entregada en.';
    const contenido = `<p>La antorcha fue entregada en el empalme de San Benito, Boaco, cuando el diputado Juan Hernández llegó para hacer entrega oficial de la antorcha al delegado de Jinotega, cerca de la carretera Panamericana, después de recibir la bandera y de caminar junto a cientos de estudiantes que acompañaron el recorrido por varias calles del municipio.</p>`;
    const n = baseNoticia({ contenido, puntosClave: [punto] });

    const result = repairPuntosClave(n);

    expect(result.puntosClave).toBeNull();
    expect(result.records[0].proposedChange).not.toBe(result.records[0].before);
    expect(result.records[0].after).toBe(result.records[0].before);
    expect(result.records[0].validationResult.valid).toBe(false);
  });

  it('is idempotent: repairing an already-repaired noticia returns the same puntosClave', () => {
    const first = repairPuntosClave(antorchaNoticia);
    const repaired: Noticia = { ...antorchaNoticia, puntosClave: first.puntosClave };
    const second = repairPuntosClave(repaired);

    expect(second.puntosClave).toEqual(first.puntosClave);
  });

  it('records before, proposedChange, after and validationResult for every point', () => {
    const result = repairPuntosClave(antorchaNoticia);
    for (const r of result.records) {
      expect(r).toHaveProperty('before');
      expect(r).toHaveProperty('proposedChange');
      expect(r).toHaveProperty('after');
      expect(r).toHaveProperty('validationResult');
      expect(r.validationResult).toHaveProperty('valid');
      expect(r.validationResult).toHaveProperty('issues');
    }
  });
});
