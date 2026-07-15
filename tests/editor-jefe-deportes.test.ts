import { describe, it, expect } from 'vitest';
import { analizarNoticia } from '../lib/analizador-noticias';
import type { NoticiaInput } from '../lib/analizador-noticias';
import { evaluarDeportes } from '../lib/editor-jefe/modulos';

function noticiaDeportes(
  titulo: string,
  contenido: string,
  resumen: string,
  categoria = 'Deportes'
): NoticiaInput {
  return {
    titulo,
    contenido,
    resumen,
    categoria,
    autor: 'Redacción Deportes',
    fecha: new Date().toISOString(),
    slug: 'test-deportes',
    imagenDestacada: '/images/test.webp',
    palabrasClave: ['futbol', 'fifa', 'mundial 2026'],
  };
}

const contenidoMundial = `
<h2>Calendario y sedes confirmados</h2>
<p>Según FIFA, el torneo comenzará el 11 de junio de 2026 y la final se disputará el 19 de julio de 2026 en el MetLife Stadium de Nueva Jersey. La FIFA confirmó este martes el calendario oficial de la <strong>Copa Mundial de la FIFA 2026</strong>, con 104 partidos distribuidos entre 16 sedes de Canadá, Estados Unidos y México.</p>
<blockquote>El formato de 48 selecciones fue aprobado por el Congreso de la FIFA y regirá desde la primera jornada.</blockquote>
<p>Asimismo, la entidad detalló que cada confederación recibió sus plazas asignadas: UEFA contará con 16 cupos, CONMEBOL con 6 cupos directos y 1 repechaje, mientras que CONCACAF tendrá 6 selecciones clasificadas directamente más 2 repechajes.</p>
<h2>Impacto en Nicaragua y CONCACAF</h2>
<p>En cuanto al impacto regional, el incremento de cupos representa una oportunidad histórica para selecciones como Nicaragua, que buscará su primera clasificación a una Copa del Mundo. De acuerdo con CONCACAF, las eliminatorias de la zona iniciarán en 2024 y se definirán en marzo de 2026.</p>
<p>Además, el calendario incluye jornadas dobles en septiembre, octubre y noviembre de 2025. Inicialmente se disputarán 3 fechas en 2024.</p>
<p>Posteriormente, en 2025, se jugarán las jornadas restantes. Los aficionados pueden consultar el fixture en la página oficial de la FIFA o seguir los partidos a través de las señales oficiales de cada federación.</p>
<h2>Figuras y reglamento del torneo</h2>
<p>En lo deportivo, el entrenador argentino Lionel Scaloni y el jugador Lionel Messi encabezan la lista de figuras que se perfilan para participar en su último Mundial. El reglamento aprobado establece 12 grupos de 4 selecciones, con los 2 primeros de cada grupo avanzando a la ronda de 32.</p>
<p>Nicaragua Informate consultó el calendario oficial y verificó las fechas con el documento publicado por el organismo rector del fútbol mundial. La actualización completa estará disponible en la web oficial de la FIFA.</p>
`;

describe('Módulo Deportes — notas correctamente documentadas', () => {
  it('una nota del Mundial FIFA alcanza el nivel más alto sin falsos positivos policiales', async () => {
    const titulo = 'FIFA confirma calendario, sedes y formato del Mundial 2026';
    const resumen = 'La FIFA presentó el calendario oficial del Mundial 2026 con fechas, sedes y formato de 48 selecciones. El torneo aumenta las posibilidades de Nicaragua y de la región centroamericana en las eliminatorias de CONCACAF.';
    const n = noticiaDeportes(titulo, contenidoMundial, resumen);
    const r = await analizarNoticia(n);

    expect(r.nivel).toBe('FORENSE');
    expect(r.puntuacion).toBe(100);

    const textoReportes = [
      ...r.reporteForenseV1.observaciones,
      ...r.reporteForenseV1.advertencias,
    ].join(' ');

    expect(textoReportes).not.toMatch(/v[ií]ctima|polic[ií]a|hospital|investigaci[oó]n\s+penal|seguridad\s+p[uú]blica|trabajo\s+de\s+campo/i);
    expect(r.reporteVPR?.perfilVertical?.vertical).toBe('Deportes');
    expect(r.filtros.eeat.aprobado).toBe(true);
    expect(r.filtros.valorEditorial.aprobado).toBe(true);
    expect(r.filtros.oro.aprobado).toBe(true);
    expect(r.reporteForenseV1.fase4_cadenaCustodia.parrafos.every(p => !p.marcaRoja)).toBe(true);
  });

  it('reconoce fuentes oficiales deportivas y no exige documentos policiales', () => {
    const n = noticiaDeportes(
      'CONCACAF define fixture de eliminatorias',
      '<p>CONCACAF publicó el fixture de las eliminatorias para el Mundial 2026. Las jornadas 1 y 2 se jugarán en junio de 2024.</p>',
      'CONCACAF confirmó las primeras jornadas de las eliminatorias rumbo al Mundial 2026.'
    );
    const v2 = {
      fase1_evidencia: {
        fuenteIdentificada: 100,
        documentoOficial: 0,
        dosFuentes: 0,
        trabajoDeCampo: 100,
        datosConcretos: 100,
        contexto: 60,
        utilidad: 60,
        servicio: 0,
        originalidad: 40,
      },
      fase2_tipoNota: { tipo: 'Noticia', confianza: 80, razon: '' },
      fase3_decision: { accion: 'publicar_destacado', prioridad: 70, justificacion: '' },
      fase4_contextoNicaragua: { pais: 'Nicaragua', tema: 'Deportes', trabajoDeCampoAusente: false, ausenciaCampoEsNormal: false, explicacion: '' },
      fase5_sugerencias: { oportunidadesEditoriales: [], comoConvertirReferencia: [], nivel10: [] },
      fase6_consistencia: { aprobado: true, contradicciones: [] },
    } as any;
    const r = evaluarDeportes(n, v2);
    expect(r.vertical).toBe('Deportes');
    expect(r.utilidad).toBeGreaterThanOrEqual(80);
    expect(r.sugerencias.oportunidadesEditoriales.every(s => !/(polic[ií]a|v[ií]ctima|hospital|seguridad p[uú]blica|investigaci[oó]n penal)/i.test(s.texto))).toBe(true);
  });

  it('no penaliza notas explicativas ni históricas por falta de trabajo de campo', async () => {
    const contenido = `
<h2>Historia del formato del Mundial</h2>
<p>La FIFA creó la Copa Mundial de Fútbol en 1930 con un formato de 13 selecciones. Desde entonces, el torneo evolucionó hasta llegar a 48 equipos en 2026.</p>
<p>Este artículo explica cómo funciona el sistema de competencia, la fase de grupos y la ronda de eliminación directa aprobados por el Congreso de la FIFA.</p>
`;
    const n = noticiaDeportes(
      'Así funciona el formato del Mundial 2026 explicado por la FIFA',
      contenido,
      'Repasamos el origen y el funcionamiento del formato de 48 selecciones del Mundial 2026, aprobado por la FIFA.'
    );
    const r = await analizarNoticia(n);
    const texto = r.reporteForenseV1.observaciones.join(' ');
    expect(texto).not.toMatch(/trabajo\s+de\s+campo|trabajo\s+period[ií]stico|presencial|en\s+el\s+lugar/i);
  });
});
