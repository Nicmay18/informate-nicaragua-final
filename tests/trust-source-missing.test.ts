import { describe, it, expect } from 'vitest';
import { analyzeTrust } from '../lib/editorial/trust';
import { detectFactualitySignals } from '../lib/editorial/factuality-signals';

// Nota real Caribe Sur (caso que disparó la investigación SOURCE_MISSING)
const CARIBE_SUR = `
<p>Dos hombres murieron este domingo 27 de septiembre en hechos separados ocurridos en municipios del Caribe Sur de Nicaragua, según reportes de medios locales.</p>
<p>Uno de los casos ocurrió en la comarca San Miguel, municipio de La Cruz de Río Grande, mientras el segundo fue reportado en el barrio La Loma, en Corn Island.</p>
<p>El primer caso ocurrió alrededor de las 4:00 de la madrugada en el bar El Bramadero, donde murió Darío Pérez Rugama, de aproximadamente 70 años, quien era propietario del establecimiento.</p>
<p>De acuerdo con versiones preliminares difundidas por medios locales, Pérez habría sostenido una discusión con su pareja. Según esos reportes, la mujer habría salido del lugar y posteriormente se habría producido un disparo que causó la muerte del hombre.</p>
<p>Las mismas versiones señalan que Pérez habría estado bajo los efectos del alcohol al momento del hecho. Las circunstancias exactas de la muerte deberán ser establecidas mediante las investigaciones correspondientes.</p>
<p>El segundo caso corresponde a Carlos Aníbal Romero Pérez, de 28 años, quien fue encontrado sin vida en una vivienda del barrio La Loma, cerca de los segundos tanques de agua, en Corn Island.</p>
<p>Romero Pérez, originario de Bluefields y residente en Corn Island desde hacía varios años, fue encontrado alrededor de las 7:00 de la mañana, cuando su pareja se percató de que no presentaba signos vitales y dio aviso a las autoridades.</p>
<p>La Policía llegó al lugar y realizó las diligencias correspondientes para determinar las circunstancias del fallecimiento.</p>
<p>Medios locales han señalado de manera preliminar una posible muerte autoinfligida; sin embargo, esta versión no ha sido confirmada oficialmente por las autoridades.</p>
<p>Romero Pérez era padre de un niño de 8 años.</p>
<p>Las dos muertes ocurrieron en circunstancias diferentes y en municipios distintos del Caribe Sur. Las investigaciones deberán determinar las causas y circunstancias de cada fallecimiento.</p>
<p>Por tratarse de casos en proceso de investigación, algunos detalles difundidos hasta ahora corresponden a versiones preliminares y podrían ser precisados o modificados conforme avancen las diligencias.</p>`;

const TITULO = 'Investigan muerte de dos hombres en hechos separados en el Caribe Sur';

describe('SOURCE_MISSING — especificación', () => {
  it('Caso A: nota con fuente estructurada válida no dispara SOURCE_MISSING', () => {
    const r = analyzeTrust({
      titulo: 'MINSA confirma 12 casos nuevos en Managua',
      cuerpo: '<p>El MINSA confirmó 12 casos nuevos este lunes en Managua.</p>',
      fuentesExternas: ['https://ejemplo.com/fuente-original'],
    });
    expect(r.factores).not.toContain('SOURCE_MISSING');
    expect(r.fuentes).toContain('https://ejemplo.com/fuente-original');
  });

  it('Caso B: nota sin fuente de ningún tipo sigue disparando SOURCE_MISSING', () => {
    const r = analyzeTrust({
      titulo: 'Dos personas resultaron heridas en accidente de tránsito',
      cuerpo: '<p>Dos personas resultaron heridas esta mañana en un accidente de tránsito ocurrido en el kilómetro 45 de la carretera. Una de las personas fue trasladada a un centro asistencial para recibir atención médica. El otro involucrado presenta lesiones leves según el primer reporte disponible.</p>',
    });
    expect(r.factores).toContain('SOURCE_MISSING');
  });

  it('Caso C: atribución vaga ("medios locales", "según fuentes") NO cuenta como fuente', () => {
    const r = analyzeTrust({
      titulo: 'Reportan aumento de precios en el mercado esta semana',
      cuerpo: '<p>Según fuentes del sector, los precios aumentaron 15 por ciento esta semana en el mercado. Medios locales reportaron que el alza afecta a 20 productos de la canasta básica. El cambio se registró desde el lunes pasado.</p>',
    });
    // La atribución vaga cuenta como atribución textual (no es "sin atribuir")
    // pero NO es una fuente nombrada → SOURCE_MISSING debe persistir.
    expect(r.factores).toContain('SOURCE_MISSING');
    expect(r.fuentes).toHaveLength(0);
  });

  it('Caso D: fuente nombrada en texto + enlace estructurado → sin SOURCE_MISSING', () => {
    const r = analyzeTrust({
      titulo: 'MINSA confirma 12 casos nuevos en Managua',
      cuerpo: '<p>El MINSA confirmó 12 casos nuevos este lunes en Managua. La información fue dada a conocer mediante un comunicado oficial difundido esta tarde.</p>',
      fuentesExternas: ['https://minsa.gob.ni/comunicado-12'],
    });
    expect(r.factores).not.toContain('SOURCE_MISSING');
    expect(r.fuentes).toContain('MINSA');
    expect(r.fuentes).toContain('https://minsa.gob.ni/comunicado-12');
  });

  it('Caso real (regresión): nota Caribe Sur con "la Policía" → sin SOURCE_MISSING', () => {
    const r = analyzeTrust({ titulo: TITULO, cuerpo: CARIBE_SUR, categoria: 'Sucesos' });
    expect(r.factores).not.toContain('SOURCE_MISSING');
    expect(r.fuentes).toContain('Policía');
    // "han señalado"/"señalan"/"difundidos" son atribución real: no PROVISIONAL_CLAIM
    expect(r.factores).not.toContain('PROVISIONAL_CLAIM');
    expect(r.requiereRevisionHumana).toBe(false);
  });

  it('formas verbales extendidas: "han señalado" y "señalan" cuentan como atribución', () => {
    const r = analyzeTrust({
      titulo: 'Medios han señalado posible cambio en el gabinete',
      cuerpo: '<p>Medios locales han señalado un posible cambio en el gabinete económico. Las mismas fuentes señalan que el anuncio podría darse esta semana.</p>',
    });
    expect(r.diagnostico.atribuidas).toBeGreaterThan(0);
  });
});

describe('VAGUE_ATTRIBUTION — protección intacta', () => {
  it('"según fuentes" con cifras sigue disparando VAGUE_ATTRIBUTION', () => {
    const signals = detectFactualitySignals({
      titulo: 'Precios suben 15 por ciento en el mercado',
      resumen: '',
      contenido: 'Según fuentes del sector, los precios aumentaron 15 por ciento. Medios reportaron que el alza afecta a 20 casos.',
      fuentesComplementarias: [],
    });
    expect(signals.map(s => s.code)).toContain('VAGUE_ATTRIBUTION');
  });

  it('"la Policía" nombrada como institución evita el falso VAGUE_ATTRIBUTION', () => {
    const signals = detectFactualitySignals({
      titulo: 'Policía reporta 3 detenidos tras operativo en Managua',
      resumen: '',
      contenido: 'Según reportes de medios locales, la Policía reportó 3 detenidos tras el operativo realizado el sábado. La institución indicó que 2 personas más están bajo investigación.',
      fuentesComplementarias: [],
    });
    expect(signals.map(s => s.code)).not.toContain('VAGUE_ATTRIBUTION');
  });

  it('"policía" minúscula (sustantivo común) no cuenta como fuente en Trust', () => {
    const r = analyzeTrust({
      titulo: 'Detenido tras robo en mercado de Managua',
      cuerpo: '<p>Un policía de tránsito detuvo a un hombre este martes tras un robo reportado en el mercado de Managua. El detenido quedó a la orden de las autoridades competentes para el proceso.</p>',
    });
    expect(r.fuentes).not.toContain('policía');
  });
});
