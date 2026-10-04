// @vitest-environment node
// Sala de Redacción Digital — verifica la capa de consolidación:
// cada nota produce informe por especialista + decisión + informe del
// propietario en lenguaje humano. Corre la cadena real (runMeni).
import { describe, it, expect } from 'vitest';
import { runMeni } from '../lib/meni/core';
import { buildInformeSala } from '../lib/meni/sala-redaccion';

const BASE = {
  autor: 'Redacción Nicaragua Informate',
  fecha: '2026-10-03T10:00:00Z',
  slug: 'test-sala',
} as any;

const NOTAS: Record<string, { titulo: string; resumen: string; contenido: string; categoria: string }> = {
  Sucesos: {
    titulo: 'Lluvias dejan viviendas afectadas en varios municipios',
    resumen: 'Las lluvias provocaron afectaciones en viviendas y caminos en varios municipios.',
    contenido: '<p>Las lluvias registradas este sábado dejaron afectaciones en viviendas, puentes y caminos en varios municipios de Nicaragua. El balance disponible reporta al menos 14 viviendas afectadas y dos puentes con daños en Siuna, El Tuma-La Dalia y Wiwilí.</p><p>En El Tuma-La Dalia una familia de cinco personas fue evacuada tras un deslizamiento. En Wiwilí cinco viviendas resultaron anegadas en la comunidad San Pedro de Kinowas.</p>',
    categoria: 'Sucesos',
  },
  Deportes: {
    titulo: 'Rivas y Granada disputarán la final del Pomares 2026',
    resumen: 'Rivas y Granada jugarán la final del Pomares este fin de semana en Managua.',
    contenido: '<p>Rivas y Granada disputarán la final del Pomares 2026 este fin de semana en el estadio Nacional de Managua. Ambos equipos llegan tras ganar sus semifinales respectivas.</p><p>Rivas venció 3-1 a Chinandega el sábado, mientras Granada eliminó a Boaco por 2-0 el domingo. El partido decisivo está programado para el domingo a las 3 de la tarde.</p>',
    categoria: 'Deportes',
  },
  Nacionales: {
    titulo: 'MINSA inaugura nueva sala de emergencias en hospital de León',
    resumen: 'El Ministerio de Salud inauguró una sala de emergencias en el hospital de León.',
    contenido: '<p>El Ministerio de Salud inauguró este martes una nueva sala de emergencias en el hospital Oscar Danilo Rosales de León, con capacidad para 40 pacientes.</p><p>La inversión fue de 2.5 millones de córdobas, según informó la ministra durante el acto inaugural. La sala atenderá a pacientes de toda la región occidental.</p>',
    categoria: 'Nacionales',
  },
  Internacionales: {
    titulo: 'Huracán toca tierra en Florida y deja miles sin electricidad',
    resumen: 'El huracán tocó tierra en Florida causando cortes eléctricos masivos.',
    contenido: '<p>Un huracán de categoría 2 tocó tierra este lunes en la costa de Florida, dejando más de 500 mil hogares sin electricidad, informaron las autoridades estatales.</p><p>El gobernador declaró estado de emergencia en 12 condados. Los vientos máximos alcanzaron los 160 km/h según el Centro Nacional de Huracanes.</p>',
    categoria: 'Internacionales',
  },
};

describe('Sala de Redacción — informe por especialista', () => {
  for (const [cat, nota] of Object.entries(NOTAS)) {
    it(`${cat}: produce informe con todos los roles + decisión`, () => {
      const meni = runMeni({ ...BASE, ...nota });
      const sala = buildInformeSala({ meni: meni as any });

      // Estructura del informe (título puede venir normalizado por MENI)
      expect(sala.titulo.length).toBeGreaterThan(10);
      expect(sala.especialistas.length).toBeGreaterThanOrEqual(7); // 6 roles + REDES
      const roles = sala.especialistas.map(e => e.rol);
      expect(roles).toContain('MESA');
      expect(roles).toContain('ESTRUCTURA');
      expect(roles).toContain('FUENTES');
      expect(roles).toContain('LENGUAJE');
      expect(roles).toContain('SEO');
      expect(roles).toContain('LECTOR');
      expect(roles).toContain('REDES');
      expect(['PUBLICAR', 'PUBLICAR_CON_CAMBIOS', 'REVISAR', 'BLOQUEAR']).toContain(sala.decisionFinal.decision);
      expect(sala.informeTexto).toContain('DECISIÓN:');
      expect(sala.informeTexto).toContain('JEFE DE REDACCIÓN:');

      console.log(`\n===== INFORME ${cat} =====`);
      console.log(sala.informeTexto);
    });
  }

  it('distribución se refleja en REDES cuando hay resultados', () => {
    const meni = runMeni({ ...BASE, ...NOTAS.Deportes });
    const sala = buildInformeSala({
      meni: meni as any,
      distribucion: { telegram: { ok: true }, facebook: { ok: true }, whatsapp: { skipped: true } },
    });
    const redes = sala.especialistas.find(e => e.rol === 'REDES');
    expect(redes?.estado).toBe('GENERADAS');
    expect(sala.distribucion?.find(d => d.canal === 'TELEGRAM')?.estado).toBe('ENVIADO');
  });
});
