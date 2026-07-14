import { describe, it, expect } from 'vitest';
import type { NoticiaInput } from '../lib/analizador-noticias';
import type { ResultadoEditorJefeV2, EvidenciaPuntuada } from '../lib/editor-jefe/engine';
import {
  evaluarSucesos,
  evaluarNacionales,
  evaluarInternacionales,
  evaluarDeportes,
  evaluarEspectaculos,
  evaluarTecnologia,
  evaluarEconomia,
  evaluarOpinion,
  evaluarReportajes,
  evaluarGuias,
  detectarEvidenciaPeriodistica,
  evaluarRiesgoEditorial,
  detectoresCoberturaContinua,
  detectoresLegal,
} from '../lib/editor-jefe/modulos';

const baseEvidencia = (): EvidenciaPuntuada => ({
  fuenteIdentificada: 50,
  documentoOficial: 0,
  dosFuentes: 40,
  trabajoDeCampo: 60,
  datosConcretos: 60,
  contexto: 50,
  utilidad: 40,
  servicio: 30,
  originalidad: 30,
});

function baseV2(overrides?: Partial<EvidenciaPuntuada>, tipoNota?: string): ResultadoEditorJefeV2 {
  return {
    fase1_evidencia: { ...baseEvidencia(), ...overrides },
    fase2_tipoNota: { tipo: (tipoNota as any) || 'Noticia', confianza: 60, razon: '' },
    fase3_decision: { accion: 'publicar_estandar', prioridad: 65, justificacion: '' },
    fase4_contextoNicaragua: { pais: 'Nicaragua', tema: 'General', trabajoDeCampoAusente: false, ausenciaCampoEsNormal: false, explicacion: '' },
    fase5_sugerencias: { oportunidadesEditoriales: [], comoConvertirReferencia: [], nivel10: [] },
    fase6_consistencia: { aprobado: true, contradicciones: [] },
  };
}

const noticiaBase = (categoria: string, titulo: string, contenido: string): NoticiaInput => ({
  titulo,
  contenido,
  resumen: contenido.slice(0, 120),
  categoria,
  autor: 'Redacción',
  fecha: new Date().toISOString(),
  slug: 'test',
});

describe('RFC-011 — Sucesos', () => {
  it('no pide documento oficial en hechos en desarrollo; informa que aún no está disponible', () => {
    const n = noticiaBase('Sucesos', 'Incendio ahora', '<p>Última hora: incendio en fábrica. Bomberos atienden el lugar. Hace minutos se reportó. Nicaragua Informate dará seguimiento.</p>');
    const r = evaluarSucesos(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /solicitar|obtener copia|parte policial/i.test(s.texto))).toBe(false);
    expect(r.valorAgregado.some(v => v.includes('Documento oficial aún no disponible'))).toBe(true);
    expect(r.utilidad).toBeGreaterThanOrEqual(60);
  });

  it('detecta evidencia periodística verificable y no sugiere “no hay evidencia”', () => {
    const n = noticiaBase('Sucesos', 'Accidente con video', '<p>Video del accidente muestra el momento del impacto. La Policía Nacional confirmó el hecho. Testigo Juan Pérez relató lo ocurrido.</p>');
    const r = evaluarSucesos(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => s.texto.includes('Evidencia periodística verificable detectada'))).toBe(true);
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /no hay evidencia|sin evidencia/i.test(s.texto))).toBe(false);
  });

  it('detecta presunción de inocencia y no agrega advertencia legal', () => {
    const n = noticiaBase('Sucesos', 'Captura en investigación', '<p>La Policía capturó presuntamente al sospechoso. Según información preliminar se investiga el hecho.</p>');
    const r = evaluarSucesos(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => s.texto.includes('presunción de inocencia'))).toBe(false);
  });

  it('detecta seguimiento y suma puntos de cobertura continua', () => {
    const n = noticiaBase('Sucesos', 'Caso en desarrollo', '<p>El caso continúa bajo investigación. Se espera información oficial en las próximas horas.</p>');
    const r = evaluarSucesos(n, baseV2());
    expect(detectoresCoberturaContinua.haySeguimiento(n)).toBe(true);
    expect(r.utilidad).toBeGreaterThanOrEqual(60);
  });
});

describe('RFC-011 — Nacionales', () => {
  it('no sugiere citar hospitales en notas políticas', () => {
    const n = noticiaBase('Política', 'Reforma electoral', '<p>La Asamblea Nacional aprobó reforma electoral. Beneficiará a más de 3 millones de ciudadanos desde 2026.</p>');
    const r = evaluarNacionales(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /hospital|cl[ií]nica|medicina legal/i.test(s.texto))).toBe(false);
    expect(r.utilidad).toBeGreaterThanOrEqual(80);
  });

  it('detecta qué cambia, desde cuándo y quiénes son afectados', () => {
    const n = noticiaBase('Nacionales', 'Nuevo impuesto', '<p>El nuevo impuesto a productos importados rige a partir del 1 de enero y afecta a pymes importadoras.</p>');
    const r = evaluarNacionales(n, baseV2());
    expect(r.consistencia.contradicciones).not.toContain('faltó explicación del impacto');
    expect(r.utilidad).toBeGreaterThanOrEqual(70);
  });

  it('evalúa impacto ciudadano con empresas y empleo', () => {
    const n = noticiaBase('Nacionales', 'Empresas contratarán', '<p>Grandes empresas del sector tecnológico anunciaron que contratarán a 500 trabajadores este año.</p>');
    const r = evaluarNacionales(n, baseV2());
    expect(r.consistencia.contradicciones).not.toContain('faltó impacto ciudadano');
  });
});

describe('RFC-011 — Internacionales', () => {
  it('detecta ONU, OMS y cancillerías como fuentes internacionales', () => {
    const n = noticiaBase('Internacionales', 'ONU alerta', '<p>La ONU y la OMS alertaron sobre una nueva cepa. El Gobierno de Costa Rica y la Cancillería emitieron un comunicado.</p>');
    const r = evaluarInternacionales(n, baseV2());
    expect(r.consistencia.contradicciones).not.toContain('faltó fuente internacional reconocida');
  });

  it('no exige trabajo de campo en Nicaragua', () => {
    const n = noticiaBase('Internacionales', 'Elecciones en Francia', '<p>Reuters reportó resultados preliminares de elecciones en Francia. BBC confirmó la tendencia.</p>');
    const r = evaluarInternacionales(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /trabajo de campo|corresponsal en nicaragua/i.test(s.texto))).toBe(false);
  });

  it('valora relación con Nicaragua', () => {
    const n = noticiaBase('Internacionales', 'Sube el dólar', '<p>El dólar subió en Centroamérica. Esto podría encarecer remesas e importaciones para Nicaragua.</p>');
    const r = evaluarInternacionales(n, baseV2());
    expect(r.consistencia.contradicciones).not.toContain('faltó impacto para Nicaragua');
  });
});

describe('RFC-011 — Deportes', () => {
  it('detecta fixture, convocatoria y récord', () => {
    const n = noticiaBase('Deportes', 'Liga inicia', '<p>El fixture del torneo se publicó ayer. La convocatoria incluye 22 jugadores. Diriangén busca romper su récord de puntos.</p>');
    const r = evaluarDeportes(n, baseV2());
    expect(r.consistencia.contradicciones).not.toContain('faltó tabla o contexto del torneo');
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /contexto legal|documento oficial/i.test(s.texto))).toBe(false);
  });

  it('valora estadísticas y figuras', () => {
    const n = noticiaBase('Deportes', 'Goleador destacó', '<p>Pérez anotó 3 goles y es el goleador del torneo con 15 anotaciones. El Real Estelí lidera la tabla.</p>');
    const r = evaluarDeportes(n, baseV2());
    expect(r.utilidad).toBeGreaterThanOrEqual(80);
  });

  it('no pide contexto legal', () => {
    const n = noticiaBase('Deportes', 'Lesión', '<p>El jugador sufrió una lesión en el partido. El entrenador dijo que será baja dos semanas.</p>');
    const r = evaluarDeportes(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /ley|decreto|marco legal|normativa/i.test(s.texto))).toBe(false);
  });
});

describe('RFC-011 — Espectáculos', () => {
  it('distingue rumor y exige fuente oficial antes de afirmar datos sensibles', () => {
    const n = noticiaBase('Espectáculos', 'Supuesta separación', '<p>Se rumorea que la pareja se separó. Supuestamente discutieron en público.</p>');
    const r = evaluarEspectaculos(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => s.texto.includes('rumor'))).toBe(true);
    expect(r.sugerencias.oportunidadesEditoriales.some(s => s.texto.includes('rupturas') || s.texto.includes('embarazos') || s.texto.includes('fallecimientos'))).toBe(true);
  });

  it('aprueba si hay representante, comunicado o red social oficial', () => {
    const n = noticiaBase('Espectáculos', 'Concierto confirmado', '<p>La productora publicó un comunicado oficial y la red social oficial del artista confirmó el concierto en Managua.</p>');
    const r = evaluarEspectaculos(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => s.texto.includes('rumor'))).toBe(false);
  });

  it('no afirma ruptura si solo existe rumor', () => {
    const n = noticiaBase('Espectáculos', 'Rumor de romance', '<p>Según fuentes no oficiales, podrían estar juntos.</p>');
    const r = evaluarEspectaculos(n, baseV2());
    expect(r.valorAgregado).not.toContain('Sin aporte propio detectado');
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /afirmar|publicar datos sensibles|oficial/i.test(s.texto))).toBe(true);
  });
});

describe('RFC-011 — Tecnología', () => {
  it('detecta OpenAI, Google, Apple y ciberseguridad', () => {
    const n = noticiaBase('Tecnología', 'Nueva IA de Google', '<p>Google anunció una nueva IA. Apple y OpenAI también presentaron actualizaciones. La ciberseguridad es clave.</p>');
    const r = evaluarTecnologia(n, baseV2());
    expect(r.utilidad).toBeGreaterThanOrEqual(65);
  });

  it('valora compatibilidad, dispositivos y requisitos', () => {
    const n = noticiaBase('Tecnología', 'App disponible', '<p>La app funciona en Android 12+, iOS 16+ y requiere 2 GB de RAM. Los usuarios de pymes reducirán costos.</p>');
    const r = evaluarTecnologia(n, baseV2());
    expect(r.consistencia.contradicciones).not.toContain('faltó compatibilidad');
    expect(r.consistencia.contradicciones).not.toContain('faltó quién se beneficia');
  });

  it('no pide trabajo de campo', () => {
    const n = noticiaBase('Tecnología', 'Windows update', '<p>Microsoft lanzó una actualización de Windows con mejoras de seguridad.</p>');
    const r = evaluarTecnologia(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /trabajo de campo|entrevista en el lugar/i.test(s.texto))).toBe(false);
  });
});

describe('RFC-011 — Economía', () => {
  it('detecta inflación, dólar, bancos y precios', () => {
    const n = noticiaBase('Economía', 'Sube el dólar', '<p>El dólar subió a C$36.50. Los bancos ajustaron precios. La inflación anual supera el 5%.</p>');
    const r = evaluarEconomia(n, baseV2());
    expect(r.consistencia.contradicciones).not.toContain('faltó cifras o datos concretos');
  });

  it('evalúa quién gana, quién pierde y cómo afecta', () => {
    const n = noticiaBase('Economía', 'Impuesto a combustible', '<p>El nuevo impuesto al combustible perjudica a transportistas y beneficia a importadores. Las familias pagarán más por transporte.</p>');
    const r = evaluarEconomia(n, baseV2());
    expect(r.consistencia.contradicciones).not.toContain('faltó impacto económico');
    expect(r.utilidad).toBeGreaterThanOrEqual(70);
  });

  it('sugiere citar institución o fuente del dato', () => {
    const n = noticiaBase('Economía', 'Sube la inflación', '<p>La inflación subió.</p>');
    const r = evaluarEconomia(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /instituci[oó]n|banco central|fuente/i.test(s.texto))).toBe(true);
  });
});

describe('RFC-011 — Opinión', () => {
  it('no exige objetividad absoluta pero sí argumentación', () => {
    const n = noticiaBase('Opinión', 'Columna educativa', '<p>En mi opinión, la reforma educativa es necesaria porque mejora la equidad. Por un lado, aumenta presupuesto; por otro, requiere capacitación.</p>');
    const r = evaluarOpinion(n, baseV2());
    expect(r.consistencia.contradicciones).not.toContain('faltó argumentación');
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /objetividad absoluta|imparcialidad total/i.test(s.texto))).toBe(false);
  });

  it('exige fuentes y contexto', () => {
    const n = noticiaBase('Opinión', 'Opinión sin fuentes', '<p>Está mal la política actual. Es obvio.</p>');
    const r = evaluarOpinion(n, baseV2());
    expect(r.consistencia.contradicciones).toContain('faltó fuentes o datos');
    expect(r.consistencia.contradicciones).toContain('faltó contexto');
  });

  it('detecta columna/editorial/análisis', () => {
    const n = noticiaBase('Opinión', 'Análisis judicial', '<p>Este análisis examina la reciente sentencia. Según el experto Juan López, la corte se basó en datos técnicos.</p>');
    const r = evaluarOpinion(n, baseV2());
    expect(r.utilidad).toBeGreaterThanOrEqual(70);
  });
});

describe('RFC-011 — Reportajes', () => {
  it('exige cronología, contexto, múltiples fuentes y documentación', () => {
    const n = noticiaBase('Reportajes', 'Caso de corrupción', '<p>En este contexto, primero en 2020 se detectó el desvío. Luego, en 2022, la Contraloría emitió un informe. No es la primera vez que ocurre. De acuerdo con Juan Perez y de acuerdo con Maria Lopez, el monto creció. El documento oficial confirma las cifras.</p>');
    const r = evaluarReportajes(n, baseV2(undefined, 'Reportaje'));
    expect(r.consistencia.contradicciones).not.toContain('faltó cronología');
    expect(r.consistencia.contradicciones).not.toContain('faltó contexto');
    expect(r.consistencia.contradicciones).not.toContain('faltó más de dos fuentes');
    expect(r.consistencia.contradicciones).not.toContain('faltó documentación');
  });

  it('sugiere múltiples fuentes cuando faltan', () => {
    const n = noticiaBase('Reportajes', 'Investigación', '<p>El problema persiste desde hace años.</p>');
    const r = evaluarReportajes(n, baseV2(undefined, 'Reportaje'));
    expect(r.sugerencias.oportunidadesEditoriales.some(s => s.texto.includes('más de dos fuentes'))).toBe(true);
  });

  it('prioriza reportaje por tipo de nota aunque la categoría sea otra', () => {
    const n = noticiaBase('Nacionales', 'Reportaje de fondo', '<p>En este reportaje de fondo se analiza la situación con múltiples testimonios y documentos.</p>');
    const r = evaluarReportajes(n, baseV2(undefined, 'Reportaje'));
    expect(r.vertical).toBe('Reportajes');
  });
});

describe('RFC-011 — Guías', () => {
  it('detecta pasos y recomendaciones', () => {
    const n = noticiaBase('Servicio', 'Cómo renovar pasaporte', '<p>Paso 1: solicitar cita. Paso 2: pagar arancel. Paso 3: acudir a la oficina de migración.</p>');
    const r = evaluarGuias(n, baseV2());
    expect(r.consistencia.contradicciones).not.toContain('faltó pasos o estructura secuencial');
  });

  it('sugiere contacto o advertencia si faltan', () => {
    const n = noticiaBase('Servicio', 'Guía simple', '<p>Cómo hacer una cita.</p>');
    const r = evaluarGuias(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /tel[eé]fono|direcci[oó]n|d[oó]nde acudir/i.test(s.texto))).toBe(true);
  });

  it('nunca pide parte policial', () => {
    const n = noticiaBase('Servicio', 'Guía de emergencias', '<p>Llame al 118 para bomberos. Tenga a mano la dirección exacta.</p>');
    const r = evaluarGuias(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /parte policial|expediente|denuncia/i.test(s.texto))).toBe(false);
  });
});

describe('RFC-011 — Detectores compartidos', () => {
  it('diferencia evidencia periodística de documento oficial', () => {
    const n1 = noticiaBase('Sucesos', 'Testigo habla', '<p>Testigo Pedro Ruiz relató el hecho. Videos del incidente circulan en redes.</p>');
    const n2 = noticiaBase('Sucesos', 'Parte oficial', '<p>La Fiscalía emitió un informe oficial y un parte policial con los detalles.</p>');
    expect(detectarEvidenciaPeriodistica(n1)).toBe(true);
    expect(evaluarRiesgoEditorial(n1)).toBe('Bajo');
    expect(detectarEvidenciaPeriodistica(n2)).toBe(true);
  });

  it('detecta presunción de inocencia', () => {
    const n = noticiaBase('Sucesos', 'Imputado', '<p>El imputado habría participado presuntamente. La investigación continúa.</p>');
    expect(detectoresLegal.presuncionInocencia(n)).toBe(true);
  });

  it('evalúa riesgo alto en temas sensibles', () => {
    const n = noticiaBase('Sucesos', 'Violencia sexual', '<p>Se investiga un caso de violencia sexual contra una menor de edad.</p>');
    expect(evaluarRiesgoEditorial(n)).toBe('Alto');
  });

  it('detecta cobertura continua', () => {
    const n = noticiaBase('Sucesos', 'Continúa', '<p>Seguiremos informando. La institución actualizará en las próximas horas.</p>');
    expect(detectoresCoberturaContinua.haySeguimiento(n)).toBe(true);
  });
});
