import { describe, it, expect } from 'vitest';
import { analizarNoticia } from '../lib/analizador-noticias';
import type { NoticiaInput } from '../lib/analizador-noticias';
import {
  detectarEvidenciaPeriodistica,
  evaluarDiferenciadorNI,
} from '../lib/editor-jefe/modulos';

const noticiaBase = (titulo: string, contenido: string, categoria = 'Sucesos'): NoticiaInput => ({
  titulo,
  contenido,
  resumen: contenido.slice(0, 120),
  categoria,
  autor: 'Redacción',
  fecha: new Date().toISOString(),
  slug: 'test-rfc012',
  imagenes: [],
  palabrasClave: [],
});

describe('RFC-012 — Contaminación', () => {
  it('elimina bloques tipo panel/CMS del contenido analizado', async () => {
    const contenido =
      '<p>[panel] texto del administrador [/panel] La Policía Nacional confirmó el accidente.</p>';
    const r = await analizarNoticia(noticiaBase('Accidente', contenido));
    const textoReportes = [
      ...r.reporteForenseV1.observaciones,
      ...r.reporteForenseV1.advertencias,
      ...r.reporteForenseV1.hallazgos,
      r.reporteVPR.resumenAnalisis,
    ].join(' ');
    expect(textoReportes).not.toMatch(/panel/i);
    expect(r.reporteForenseV1.fase1_triage.items.find(i => i.pregunta === '¿Existe fuente?')?.respuesta).toBe('Sí');
  });

  it('ignora mensajes del sistema y textos de UI', async () => {
    const contenido =
      '<p>Mensaje del sistema: revisar nota antes de publicar. El Ministerio de Salud informó sobre la campaña.</p>';
    const r = await analizarNoticia(noticiaBase('Campaña', contenido));
    const texto = [
      ...r.reporteForenseV1.observaciones,
      ...r.reporteForenseV1.advertencias,
    ].join(' ');
    expect(texto).not.toMatch(/mensaje del sistema/i);
  });

  it('no mezcla instrucciones o prompts del sistema en el análisis', async () => {
    const contenido =
      '<p>Instrucciones del sistema: usa tono neutral. Un testigo declaró que vio el incidente.</p>';
    const r = await analizarNoticia(noticiaBase('Incidente', contenido));
    const texto = [
      ...r.reporteForenseV1.observaciones,
      ...r.reporteForenseV1.hallazgos,
    ].join(' ');
    expect(texto).not.toMatch(/instrucciones/i);
  });
});

describe('RFC-012 — Especulación jurídica válida', () => {
  it('no marca condicional "podría" en contexto legal como especulación', async () => {
    const contenido =
      '<p>El juez podría dictar sentencia si se confirman los hechos, según el Ministerio Público.</p>';
    const r = await analizarNoticia(noticiaBase('Audiencia', contenido));
    const especulaciones = r.reporteForenseV1.fase5_detectorContaminacion.hallazgos.filter(
      h => h.tipo === 'especulacion'
    );
    expect(especulaciones).toHaveLength(0);
  });

  it('no etiqueta condicionales legales como SIN ORIGEN', async () => {
    const contenido =
      '<p>De confirmarse la resolución, el fiscal dijo que eventualmente se activaría el proceso judicial.</p>';
    const r = await analizarNoticia(noticiaBase('Proceso', contenido));
    const origenes = r.reporteForenseV1.fase3_necropsiaEvidencia.oraciones.map(o => o.origen);
    expect(origenes).not.toContain('SIN ORIGEN');
  });

  it('sí sigue marcando especulación sin contexto legal', async () => {
    const contenido =
      '<p>Podría llover mañana y supuestamente mucha gente se quedará en casa.</p>';
    const r = await analizarNoticia(noticiaBase('Clima', contenido));
    const especulaciones = r.reporteForenseV1.fase5_detectorContaminacion.hallazgos.filter(
      h => h.tipo === 'especulacion'
    );
    expect(especulaciones.length).toBeGreaterThan(0);
  });
});

describe('RFC-012 — Evidencia verificable', () => {
  it('reconoce testimonios, videos y fuentes institucionales', async () => {
    const contenido =
      '<p>Video del incidente muestra el momento del choque. La Policía Nacional confirmó el hecho. Testigo Ana López declaró que vio todo.</p>';
    const n = noticiaBase('Choque', contenido);
    expect(detectarEvidenciaPeriodistica(n)).toBe(true);
  });

  it('reconoce trabajo de campo como evidencia', async () => {
    const contenido =
      '<p>Desde el lugar, nuestro corresponsal constató que el mercado permanecía cerrado.</p>';
    const n = noticiaBase('Mercado cerrado', contenido);
    expect(detectarEvidenciaPeriodistica(n)).toBe(true);
  });

  it('reconoce documentos oficiales y comunicados institucionales', async () => {
    const contenido =
      '<p>La Fiscalía emitió un comunicado oficial y presentó el expediente ante el juzgado.</p>';
    const n = noticiaBase('Comunicado', contenido);
    expect(detectarEvidenciaPeriodistica(n)).toBe(true);
  });
});

describe('RFC-012 — Originalidad y aporte propio', () => {
  it('detecta reorganización editorial y cronología', () => {
    const n = noticiaBase('Cronología', '<p>Primero ocurrió el incendio. Luego llegaron los bomberos. Finalmente, aquí te explicamos qué debes saber.</p>');
    const d = evaluarDiferenciadorNI(n);
    expect(d.elementosDetectados.some(e => /cronología|reorganizó/i.test(e))).toBe(true);
  });

  it('detecta explicación legal como aporte propio', () => {
    const n = noticiaBase('Explicación', '<p>La ley explica que el artículo afecta cómo se tramita el proceso y qué cambia para el ciudadano.</p>');
    const d = evaluarDiferenciadorNI(n);
    expect(d.elementosDetectados.some(e => /explicación legal/i.test(e))).toBe(true);
  });

  it('detecta valor de servicio como aporte propio', () => {
    const n = noticiaBase('Servicio', '<p>Pasos para denunciar: requisito, dónde acudir y la línea telefónica.</p>');
    const d = evaluarDiferenciadorNI(n);
    expect(d.elementosDetectados.some(e => /recomendaciones|servicio/i.test(e))).toBe(true);
    expect(d.puntuacion).toBeGreaterThan(0);
  });
});

describe('RFC-012 — Consistencia interna Forense ↔ Editor Jefe', () => {
  it('si Editor Jefe detecta evidencia, Forense no afirma que no existe', async () => {
    const contenido =
      '<p>La Policía Nacional confirmó el robo. Testigo Pedro Ramírez dijo que vio todo. El Ministerio Público recibió la denuncia.</p>';
    const r = await analizarNoticia(noticiaBase('Robo', contenido));
    const itemEvidencia = r.reporteForenseV1.fase1_triage.items.find(i => i.pregunta === '¿Existe evidencia?');
    const itemFuente = r.reporteForenseV1.fase1_triage.items.find(i => i.pregunta === '¿Existe fuente?');
    expect(itemEvidencia?.respuesta).toBe('Sí');
    expect(itemFuente?.respuesta).toBe('Sí');
    const observaciones = r.reporteForenseV1.observaciones.join(' ');
    expect(observaciones).not.toMatch(/No se detectan señales de evidencia/i);
    expect(observaciones).not.toMatch(/No se identifica una fuente atribuible/i);
  });

  it('si Editor Jefe detecta trabajo de campo, Forense no desecha la cadena de custodia', async () => {
    const contenido =
      '<p>En el lugar, nuestro periodista constató que las autoridades recogieron evidencia. La Fiscalía confirmó el procedimiento.</p>';
    const r = await analizarNoticia(noticiaBase('Procedimiento', contenido));
    const observaciones = r.reporteForenseV1.observaciones.join(' ');
    expect(observaciones).not.toMatch(/sin atribución ni fuente identificable/i);
  });

  it('el diferenciador refleja evidencia reconocida por Editor Jefe', async () => {
    const contenido =
      '<p>La Asamblea Nacional emitió una resolución. Documento oficial establece la medida que regirá desde enero.</p>';
    const r = await analizarNoticia(noticiaBase('Resolución', contenido));
    const diferenciador = r.reporteForenseV1.fase15_forenseDiferenciador;
    expect(diferenciador.observacion).not.toMatch(/No se detecta una razón objetiva/i);
  });
});
