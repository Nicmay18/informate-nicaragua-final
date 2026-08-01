import { describe, it, expect } from 'vitest';
import { analyzeUtilidad } from '@/lib/meni/utilidad';
import { analyzeProfundidad } from '@/lib/meni/profundidad';
import { analyzeEEAT } from '@/lib/meni/eeat';
import type { EditorialBrainInput } from '@/lib/meni/editorial-brain/types';
import type { EvaluacionEditorial } from '@/lib/editorial';

function baseInput(contenido: string): EditorialBrainInput {
  return {
    slug: 'test',
    titulo: 'Título',
    contenido,
    resumen: '',
    categoria: 'Nacionales',
    autor: 'Redacción',
    fecha: new Date().toISOString(),
  };
}

function ev(partial: any): EvaluacionEditorial {
  return {
    evidence: {
      eeat: { autor: 'Redacción', autorVisible: false, fuentesDetectadas: [], tieneAtribuciones: false, tieneAtribucionesFalsas: false, tieneCitasEstructuradas: false },
      sources: { fuentesIdentificadas: [], numeroFuentes: 0, dosFuentesIndependientes: false, documentoOficial: false, trabajoCampo: false },
      utility: { preguntasRespondidas: [], tieneServicio: false, tieneRecomendaciones: false, oportunidades: [] },
      adsense: { palabraCount: 0, tieneDatosConcretos: false, tieneClickbait: false, ratioUnicidad: 0, palabrasSensibles: [] },
      chronology: { fechasMencionadas: [], horasMencionadas: [], tieneCronologia: false },
      context: { tipo: '', patronesEncontrados: [], contextoLegal: false, contextoHistorico: false, contextoInstitucional: false },
      valorEditorial: { tieneFuentePropia: false, tieneCitaEspecifica: false, tieneAtribucionVaga: false, nombresPropiosCount: 0, institucionesCount: 0, parrafosSinDato: 0, parrafosTotal: 0, tieneDatosInventados: false, tieneFuentesAnonimas: false },
      forense: { nivelRiesgo: 'Bajo', adjetivosEmocionales: [], transicionesIA: [], tieneRedundancia: false, estructuraHtml: { h2: 0, strong: 0, blockquote: 0 }, riesgosLegales: [], tiposContaminacion: [] },
      risk: { nivel: 'Bajo', cierreGenerico: false, atribucionesFalsas: false },
      evidence: { datosConcretos: { fechas: 0, cifras: 0, lugares: 0, nombres: 0 }, densidadVerificable: 0, esNotaVerificable: false },
      ...partial,
    },
  } as any;
}

describe('MENI V3 dimensiones', () => {
  it('utilidad: bajo < medio < alto', () => {
    const bajo = analyzeUtilidad(
      baseInput('Ocurrió un incidente. Más información próximamente.'),
      ev({}),
    );
    const medio = analyzeUtilidad(
      baseInput('El siniestro ocurrió ayer en Managua. Según la Policía, hay dos heridos.'),
      ev({ adsense: { tieneDatosConcretos: true }, valorEditorial: { parrafosTotal: 4, parrafosSinDato: 1, nombresPropiosCount: 3, institucionesCount: 1 }, sources: { numeroFuentes: 1 } }),
    );
    const alto = analyzeUtilidad(
      baseInput('El Ministerio de Salud informó que la vacunación se realizará hoy de 8:00 a 16:00 en el Centro de Salud. Para agendar llame al 1234-5678. Cómo acceder: presentar cédula y carnet.'),
      ev({ utility: { tieneServicio: true, tieneRecomendaciones: true }, adsense: { tieneDatosConcretos: true }, chronology: { tieneCronologia: true }, valorEditorial: { parrafosTotal: 5, parrafosSinDato: 0, nombresPropiosCount: 5, institucionesCount: 2 }, sources: { numeroFuentes: 2 } }),
    );

    expect(bajo).toBeLessThan(medio);
    expect(medio).toBeLessThan(alto);
    expect(bajo).toBeGreaterThanOrEqual(0);
    expect(alto).toBeLessThanOrEqual(100);
    expect(bajo).toBeLessThan(45);
    expect(alto).toBeGreaterThan(70);
  });

  it('profundidad: bajo < medio < alto', () => {
    const bajo = analyzeProfundidad(
      baseInput('Un accidente de tránsito dejó daños.'),
      ev({}),
    );
    const medio = analyzeProfundidad(
      baseInput('El accidente ocurrió en la carretera Norte. Según el INSS, hay cinco lesionados. El evento se registró el lunes.'),
      ev({ context: { contextoInstitucional: true }, chronology: { tieneCronologia: true }, valorEditorial: { parrafosTotal: 5, parrafosSinDato: 2, nombresPropiosCount: 4, institucionesCount: 1 }, sources: { numeroFuentes: 1 }, evidence: { datosConcretos: { cifras: 1 } } }),
    );
    const alto = analyzeProfundidad(
      baseInput('El accidente responde al mal estado de la vía, según MOPT. Históricamente esta ruta ha registrado 12 siniestros en 2024. Las autoridades indicaron que se reforzará el mantenimiento. El perito presentó un documento oficial con cifras actualizadas.'),
      ev({ context: { contextoHistorico: true, contextoInstitucional: true, contextoLegal: true }, chronology: { tieneCronologia: true }, valorEditorial: { parrafosTotal: 6, parrafosSinDato: 0, nombresPropiosCount: 7, institucionesCount: 2 }, sources: { numeroFuentes: 3, documentoOficial: true }, evidence: { datosConcretos: { cifras: 3 } } }),
    );

    expect(bajo).toBeLessThan(medio);
    expect(medio).toBeLessThan(alto);
    expect(bajo).toBeLessThan(45);
    expect(alto).toBeGreaterThan(70);
  });

  it('eeat: bajo < medio < alto', () => {
    const bajo = analyzeEEAT(
      ev({ eeat: { autor: 'Redacción Nicaragua Informate', autorVisible: false, fuentesDetectadas: [], tieneAtribuciones: false, tieneAtribucionesFalsas: false, tieneCitasEstructuradas: false } }),
    );
    const medio = analyzeEEAT(
      ev({ eeat: { autor: 'Juan Pérez', autorVisible: true, fuentesDetectadas: ['Policía Nacional'], tieneAtribuciones: true, tieneAtribucionesFalsas: false, tieneCitasEstructuradas: false }, sources: { numeroFuentes: 1 } }),
    );
    const alto = analyzeEEAT(
      ev({ eeat: { autor: 'María López', autorVisible: true, fuentesDetectadas: ['Policía Nacional', 'MINSA'], tieneAtribuciones: true, tieneAtribucionesFalsas: false, tieneCitasEstructuradas: true }, sources: { numeroFuentes: 2, dosFuentesIndependientes: true, documentoOficial: true }, valorEditorial: { tieneAtribucionVaga: false, tieneFuentesAnonimas: false } }),
    );

    expect(bajo.score).toBeLessThan(medio.score);
    expect(medio.score).toBeLessThan(alto.score);
    expect(bajo.score).toBeLessThan(45);
    expect(alto.score).toBeGreaterThan(70);
  });
});
