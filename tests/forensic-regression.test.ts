// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { runMeni } from '@/lib/meni';
import { evaluate } from '@/lib/editorial';
import { extract } from '@/lib/editorial/extractor';
import type { NoticiaInput } from '@/lib/meni';

function noticia(overrides: Partial<NoticiaInput>): NoticiaInput {
  return {
    titulo: overrides.titulo || 'Noticia de prueba',
    contenido: overrides.contenido || 'Contenido de prueba.',
    resumen: overrides.resumen ?? '',
    categoria: overrides.categoria || 'General',
    autor: overrides.autor ?? 'Redacción Nicaragua Informate',
    fecha: new Date().toISOString(),
    slug: 'prueba',
    ...overrides,
  } as NoticiaInput;
}

describe('Forensic regression — falsos negativos', () => {
  const titulo = 'Gobierno entrega 1,500 mochilas y útiles a 650 estudiantes de 95 centros escolares';
  const contenido = `
<p>El <strong>Ministerio de Educación</strong> (MINED) y el <strong>Instituto Nicaragüense de Turismo</strong> (INTUR) anunciaron este martes 4 de agosto de 2026 la entrega de 1,500 paquetes escolares y 650 uniformes a estudiantes de 95 centros educativos de Managua.</p>
<p>La actividad fue encabezada por la <strong>Copresidenta de Nicaragua, Compañera Rosario Murillo</strong>, quien informó que la inversión alcanza los C$30 millones y beneficiará al <strong>95 por ciento</strong> de las familias capitalinas.</p>
<blockquote>"Estamos garantizando que cada niño y niña inicie el año escolar 2027 con los útiles que necesita", dijo Murillo.</blockquote>
<p>El <strong>Gobierno de Nicaragua</strong>, a través de la <strong>Presidencia</strong> y el <strong>Ministerio de Economía Familiar</strong>, confirmó que el próximo ciclo escolar inicia el 10 de enero de 2027.</p>
<p><strong>Nicaragua Informate</strong> reportó desde el lugar de la entrega y verificó la lista de beneficiarios.</p>
`;

  it('pipelineV4 detecta instituciones, cifras, citas y aporte propio', () => {
    const input = noticia({ titulo, contenido, resumen: 'Entrega de paquetes escolares en Managua.', categoria: 'Nacionales' });
    const ev = extract(input as any);

    console.log('EVIDENCE', {
      instituciones: ev.valorEditorial.institucionesCount,
      fuentes: ev.eeat.fuentesDetectadas,
      datosConcretos: ev.adsense.tieneDatosConcretos,
      citaEspecifica: ev.valorEditorial.tieneCitaEspecifica,
      citaEstructurada: ev.eeat.tieneCitasEstructuradas,
      fuentePropia: ev.valorEditorial.tieneFuentePropia,
      cifras: ev.evidence.datosConcretos,
      categoria: ev.category,
    });

    expect(ev.valorEditorial.institucionesCount).toBeGreaterThanOrEqual(2);
    expect(ev.adsense.tieneDatosConcretos).toBe(true);
    expect(ev.valorEditorial.tieneCitaEspecifica).toBe(true);
    expect(ev.eeat.tieneCitasEstructuradas).toBe(true);
    expect(ev.valorEditorial.tieneFuentePropia).toBe(true);
  });

  it('runMeni no reporta falsos negativos en instituciones, cifras, citas ni aporte propio', { timeout: 30000 }, () => {
    const input = noticia({ titulo, contenido, resumen: 'Entrega de paquetes escolares en Managua.', categoria: 'Nacionales' });
    const result = runMeni(input);

    const issues = [
      ...(result.editorialDecision?.puntosPerdidos || []),
      ...(result.puntosPerdidos || []),
    ].map((p) => (typeof p === 'string' ? p : p?.concepto || p?.mensaje || JSON.stringify(p)));
    const recomendaciones = result.recomendaciones?.map((r) => r.mensaje) || [];
    const textos = [...issues, ...recomendaciones].join(' ').toLowerCase();

    console.log('RUNMENI', {
      scoreFinal: result.scoreFinal,
      aprobado: result.aprobado,
      calificacion: result.calificacion,
      puntosPerdidos: (result.editorialDecision?.puntosPerdidos || []).slice(0, 10),
      recomendaciones: result.recomendaciones?.slice(0, 5),
      forense: result.forense,
    });

    expect(textos).not.toContain('pocas_instituciones');
    expect(textos).not.toContain('evidencia_requerida:cifras');
    expect(textos).not.toContain('sin_citas');
    expect(textos).not.toContain('sin_aporte_propio');
    expect(result.forense.evidencias.every((e) => e.estado !== 'FALTANTE')).toBe(true);
  });
});
