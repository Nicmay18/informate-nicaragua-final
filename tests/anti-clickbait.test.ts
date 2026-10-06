import { describe, it, expect } from 'vitest';
import { runAntiClickbait } from '@/lib/meni/anti-clickbait';

describe('anti-clickbait: verbos noticiosos conjugados', () => {
  const aprobados = [
    'Janina Zúñiga obtiene tarjeta profesional de fisicoculturismo',
    'Nicaragua gana torneo internacional de béisbol',
    'Mueren cuatro personas en accidentes viales',
    'MINED anuncia calendario escolar 2027',
    'Policía captura a sospechoso de robo',
    'Granada vence a Estelí y llega a la final',
    'INSS estudia enfermedades profesionales en Nicaragua',
    'Gobierno inicia obras en Managua',
    'Atleta nicaragüense consigue medalla de oro',
  ];

  for (const t of aprobados) {
    it(`aprueba: "${t}"`, () => {
      const r = runAntiClickbait({ titulo: t });
      expect(r.veredicto).toBe('aprobado');
      expect(r.signals.some((s) => s.tipo === 'omision_clave')).toBe(false);
    });
  }

  const conjugados = [
    'X obtiene Y', 'X obtuvo Y', 'X gana Y', 'X ganó Y', 'X perdió Y', 'X muere Y',
    'X murió Y', 'X anunció Y', 'X informa Y', 'X reporta Y', 'X confirma Y',
    'X informó Y', 'X confirmó Y', 'X inicia Y', 'X comenzó Y', 'X concluyó Y',
    'X alcanza Y', 'X consigue Y', 'X consiguió Y', 'X registra Y', 'X registró Y',
    'X presenta Y', 'X presentó Y', 'X participa Y', 'X participó Y', 'X compite Y',
    'X compitió Y', 'X vence Y', 'X venció Y', 'X recibe Y', 'X recibió Y',
  ];

  for (const t of conjugados) {
    it(`reconoce "${t}"`, () => {
      const r = runAntiClickbait({ titulo: t });
      expect(r.veredicto).toBe('aprobado');
      expect(r.signals.some((s) => s.tipo === 'omision_clave')).toBe(false);
    });
  }

  const noInformativos = [
    'Una historia que inspira a Nicaragua',
    'Lo que todos quieren conocer',
    'Así fue su gran momento',
    'Descubrí lo que ocurrió',
    'No podrás creer lo que pasó',
  ];

  for (const t of noInformativos) {
    it(`no aprueba: "${t}"`, () => {
      const r = runAntiClickbait({ titulo: t });
      expect(r.veredicto).not.toBe('aprobado');
    });
  }
});
