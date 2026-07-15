import { describe, it, expect } from 'vitest';
import { analizarNoticia } from '../lib/analizador-noticias';

const notaConDocumentoYContexto = {
  titulo: 'Comunidad de la RACCS reporta impacto tras circular sobre regulación naval',
  resumen:
    'Habitantes de Corn Island, Monkey Point y la Fuerza Naval de la RACCS analizan una Nota Informativa N.° 028/2026 emitida por la DGTA y el Distrito Naval. Antecedentes en junio y condiciones meteorológicas adversas evidencian un impacto económico según registros históricos.',
  contenido: `
<p>La Región Autónoma de la Costa Caribe Sur (RACCS) fue escenario de una intensa discusión comunitaria después de que la Dirección General de Transporte Acuático (DGTA) y el Distrito Naval difundieran la <strong>Nota Informativa N.° 028/2026</strong>, firmada por la Fuerza Naval.</p>
<p>De acuerdo con los registros oficiales, el documento establece un protocolo operativo para embarcaciones en aguas cercanas a Corn Island y Monkey Point.</p>
<p>Según María Hodgson, presidenta de un comité comunitario, la medida afecta directamente a pescadores y comerciantes locales. Por su parte, el representante de una cooperativa en Bluefields explicó que el reglamento generaría un impacto económico.</p>
<p>En junio de años anteriores se registraron episodios similares asociados a condiciones meteorológicas adversas. Los antecedentes muestran un patrón de regulaciones que no consideraron el contexto social de las comunidades.</p>
<p>Las autoridades informaron que se mantendrá un seguimiento de la situación y se publicará una actualización cuando se consolide el proceso.</p>
  `.trim(),
  categoria: 'Nacionales',
  autor: 'Redacción Nicaragua Informate',
  fecha: new Date().toISOString(),
  slug: 'raccs-circular-regulacion-naval',
};

describe('Constitución Forense — Contexto, documentos e investigación breve', () => {
  it('detecta documento oficial en triage y EEAT', async () => {
    const r = await analizarNoticia(notaConDocumentoYContexto);
    const triage = r.reporteForenseV1!.fase1_triage.items;
    expect(triage.find((i) => i.pregunta === '¿Existe evidencia?')?.respuesta).toBe('Sí');
    expect(triage.find((i) => i.pregunta === '¿Existe contexto?')?.respuesta).toBe('Sí');

    const fase9 = r.reporteForenseV1!.fase9_resonanciaEEAT.checks;
    expect(fase9.find((c) => c.criterio === 'Documento o dato oficial')?.presente).toBe(true);
    expect(fase9.find((c) => c.criterio === 'Contexto aportado')?.presente).toBe(true);
  });

  it('clasifica nota documentada como Investigación breve, no como Sucesos simple', async () => {
    const r = await analizarNoticia({ ...notaConDocumentoYContexto, categoria: 'Sucesos' });
    expect(r.reporteForenseV1!.fase0_identificacion.tipoNota).toBe('Investigación');
    expect(r.reporteForenseV1!.fase0_identificacion.observacion).not.toContain(
      'Nunca se clasifica como Reportaje o Investigación'
    );
  });
});
