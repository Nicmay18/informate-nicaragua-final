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

function baseV2(overrides?: Partial<EvidenciaPuntuada>): ResultadoEditorJefeV2 {
  return {
    fase1_evidencia: { ...baseEvidencia(), ...overrides },
    fase2_tipoNota: { tipo: 'Noticia', confianza: 60, razon: '' },
    fase3_decision: { accion: 'publicar_estandar', prioridad: 65, justificacion: '' },
    fase4_contextoNicaragua: {
      pais: 'Nicaragua',
      tema: 'Sucesos',
      trabajoDeCampoAusente: false,
      ausenciaCampoEsNormal: false,
      explicacion: '',
    },
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

describe('Sucesos', () => {
  it('detecta servicio y ajusta utilidad cuando hay recomendaciones de prevención', () => {
    const n = noticiaBase(
      'Sucesos',
      'Accidente en carretera',
      '<p>Un accidente ocurrió a las 6:00 a.m. en la carretera El Almendro. La Policía Nacional informó que una camioneta impactó contra un árbol.</p><p>Se recomienda a los conductores reducir la velocidad en la zona y respetar señales de tránsito.</p>'
    );
    const r = evaluarSucesos(n, baseV2());
    expect(r.utilidad).toBeGreaterThanOrEqual(80);
    expect(r.diferenciadorNI.elementosDetectados.length).toBeGreaterThan(0);
    expect(r.valorAgregado.some(v => v.includes('recomendaciones') || v.includes('datos concretos'))).toBe(true);
  });

  it('sugiere cronología y seguimiento cuando faltan', () => {
    const n = noticiaBase('Sucesos', 'Robo en Managua', '<p>Robaron una casa en Managua.</p>');
    const r = evaluarSucesos(n, baseV2());
    expect(r.consistencia.contradicciones).toContain('faltó cronología');
    expect(r.consistencia.contradicciones).toContain('faltó seguimiento');
    expect(r.sugerencias.oportunidadesEditoriales.some(s => s.texto.includes('cronología'))).toBe(true);
  });

  it('no pide documento oficial cuando hay evidencia institucional', () => {
    const n = noticiaBase(
      'Sucesos',
      'Incendio en mercado',
      '<p>Bomberos controlaron el incendio en el mercado Roberto Huembes. No hubo heridos graves.</p>'
    );
    const r = evaluarSucesos(n, baseV2({ fuenteIdentificada: 100 }));
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /solicitar|obtener copia|parte policial/i.test(s.texto))).toBe(false);
  });
});

describe('Nacionales', () => {
  it('premia utilidad cuando hay impacto ciudadano y trámite', () => {
    const n = noticiaBase(
      'Nacionales',
      'Nuevo trámite para pensiones',
      '<p>El INSS anunció un nuevo trámite para pensiones que beneficiará a 20,000 personas. Requisitos: cédula, boleta de pago y formulario.</p><p>Los afectados deben acudir a las oficinas del INSS.</p>'
    );
    const r = evaluarNacionales(n, baseV2());
    expect(r.utilidad).toBeGreaterThanOrEqual(80);
    expect(r.consistencia.contradicciones).not.toContain('faltó impacto ciudadano');
  });

  it('detecta marco legal e institución', () => {
    const n = noticiaBase(
      'Nacionales',
      'Reforma educativa',
      '<p>La Asamblea Nacional aprobó una reforma a la Ley 582. La normativa incluye cambios en el currículo escolar.</p>'
    );
    const r = evaluarNacionales(n, baseV2());
    expect(r.consistencia.contradicciones).not.toContain('faltó marco legal o antecedentes');
  });

  it('sugiere impacto ciudadano cuando falta', () => {
    const n = noticiaBase('Nacionales', 'Decreto nuevo', '<p>Se publicó un decreto.</p>');
    const r = evaluarNacionales(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => s.texto.includes('impacto directo en el ciudadano'))).toBe(true);
  });
});

describe('Internacionales', () => {
  it('detecta contexto regional e impacto para Nicaragua', () => {
    const n = noticiaBase(
      'Internacionales',
      'Crisis en vecino país afecta remesas',
      '<p>La crisis económica en El Salvador podría impactar las remesas que reciben familias en Nicaragua. Latinoamérica observa con atención.</p>'
    );
    const r = evaluarInternacionales(n, baseV2());
    expect(r.utilidad).toBeGreaterThanOrEqual(70);
    expect(r.consistencia.contradicciones).not.toContain('faltó impacto para Nicaragua');
  });

  it('pide fuente internacional reconocida cuando no hay', () => {
    const n = noticiaBase('Internacionales', 'Conflictos en el exterior', '<p>Hay conflictos.</p>');
    const r = evaluarInternacionales(n, baseV2());
    expect(r.consistencia.contradicciones).toContain('faltó fuente internacional reconocida');
  });

  it('no exige utilidad práctica como sucesos', () => {
    const n = noticiaBase('Internacionales', 'Elecciones en Europa', '<p>Reuters reportó resultados preliminares de elecciones en Francia.</p>');
    const r = evaluarInternacionales(n, baseV2({ fuenteIdentificada: 100 }));
    expect(r.sugerencias.oportunidadesEditoriales.some(s => s.texto.includes('trámite') || s.texto.includes('Policía'))).toBe(false);
  });
});

describe('Deportes', () => {
  it('detecta estadísticas y próximo partido', () => {
    const n = noticiaBase(
      'Deportes',
      'Diriangén ganó 2-1',
      '<p>Diriangén venció 2-1 al Walter Ferretti con goles de Pérez y López. El equipo se mantiene en tercer lugar de la Liga Primera. Su próximo partido es el sábado contra Real Estelí.</p>'
    );
    const r = evaluarDeportes(n, baseV2());
    expect(r.utilidad).toBeGreaterThanOrEqual(80);
    expect(r.consistencia.contradicciones).not.toContain('faltó estadística');
    expect(r.consistencia.contradicciones).not.toContain('faltó calendario');
  });

  it('sugiere tabla y figuras cuando faltan', () => {
    const n = noticiaBase('Deportes', 'Ganó un equipo', '<p>Ganó un equipo ayer.</p>');
    const r = evaluarDeportes(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => s.texto.includes('estadísticas') || s.texto.includes('marcador'))).toBe(true);
  });

  it('no pide documentos oficiales', () => {
    const n = noticiaBase('Deportes', 'Resultado del fin de semana', '<p>El Real Madrid ganó la Liga.</p>');
    const r = evaluarDeportes(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /solicitar|documento oficial|expediente/i.test(s.texto))).toBe(false);
  });
});

describe('Espectáculos', () => {
  it('detecta trayectoria y declaraciones', () => {
    const n = noticiaBase(
      'Espectáculos',
      'Artista regresa a Nicaragua',
      '<p>La cantante, con una trayectoria de 20 años y múltiples premios, anunció una gira. En declaraciones a este medio dijo que Managua será una de las paradas.</p>'
    );
    const r = evaluarEspectaculos(n, baseV2());
    expect(r.consistencia.contradicciones).not.toContain('faltó trayectoria');
    expect(r.consistencia.contradicciones).not.toContain('faltó declaraciones');
  });

  it('no exige utilidad práctica', () => {
    const n = noticiaBase('Espectáculos', 'Estreno de película', '<p>Se estrenó una película importante.</p>');
    const r = evaluarEspectaculos(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /trámite|Policía|hospital/i.test(s.texto))).toBe(false);
  });

  it('sugiere reacción pública cuando falta', () => {
    const n = noticiaBase('Espectáculos', 'Concierto anunciado', '<p>Anunciaron un concierto.</p>');
    const r = evaluarEspectaculos(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => s.texto.includes('reacción del público'))).toBe(true);
  });
});

describe('Tecnología', () => {
  it('detecta qué cambia, beneficiarios y compatibilidad', () => {
    const n = noticiaBase(
      'Tecnología',
      'Nueva app de pagos',
      '<p>La nueva app permite pagos entre personas de forma inmediata. Funciona en Android 8+ e iOS 14+. Para los usuarios de pymes significa reducir comisiones.</p>'
    );
    const r = evaluarTecnologia(n, baseV2());
    expect(r.utilidad).toBeGreaterThanOrEqual(80);
    expect(r.consistencia.contradicciones).not.toContain('faltó compatibilidad');
    expect(r.consistencia.contradicciones).not.toContain('faltó quién se beneficia');
  });

  it('sugiere guía y riesgos cuando faltan', () => {
    const n = noticiaBase('Tecnología', 'Lanzamiento de red social', '<p>Lanzaron una red social.</p>');
    const r = evaluarTecnologia(n, baseV2());
    expect(r.consistencia.contradicciones).toContain('faltó guía');
    expect(r.consistencia.contradicciones).toContain('faltó riesgos');
  });

  it('no pide documentos oficiales ni entrevistas institucionales', () => {
    const n = noticiaBase('Tecnología', 'Nuevo teléfono', '<p>Salió un nuevo teléfono.</p>');
    const r = evaluarTecnologia(n, baseV2());
    expect(r.sugerencias.oportunidadesEditoriales.some(s => /entrevistar|solicitar expediente|parte policial/i.test(s.texto))).toBe(false);
  });
});

