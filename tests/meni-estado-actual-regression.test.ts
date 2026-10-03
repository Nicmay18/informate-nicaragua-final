/**
 * Regresión MENI — evidencia "estado actual" (Sucesos) + coherencia de perfil.
 *
 * Caso real (Florentino Olivas): la nota declaraba
 *   "Hasta la última información proporcionada por sus familiares, Florentino
 *    Olivas permanece hospitalizado y en estado delicado en ese centro
 *    asistencial."
 * y MENI reportaba EVIDENCIA_REQUERIDA:estado actual + "Incluir estado actual
 * según el perfil de Sucesos" mientras la UI mostraba "Perfil: Nacionales".
 *
 * Causa 1: el patrón solo reconocía seguimiento procesal (investigación,
 * peritaje, expediente) — nunca la condición vigente de una persona.
 * Causa 2: profile_used mostraba el perfil almacenado, no el evaluado.
 *
 * Regla: NO se baja el estándar — eventos pasados puros ("fue trasladado")
 * siguen SIN contar como estado actual.
 */
import { describe, it, expect } from 'vitest';
import { evaluate } from '@/lib/editorial/core/pipeline';

const RELLENO_NEUTRO = 'Los detalles adicionales del informe fueron compartidos por el equipo de prensa durante la jornada informativa del mediodía en la capital.';

function pad(texto: string): string {
  const necesarias = 720 - texto.split(/\s+/).length;
  if (necesarias <= 0) return texto;
  let extra = '';
  while (extra.split(/\s+/).length < necesarias) extra += ' ' + RELLENO_NEUTRO;
  return texto + extra;
}

// Nota de sucesos realista: cubre qué pasó / dónde / cuándo / cómo / impacto
// para que la única variable bajo prueba sea la evidencia de estado actual.
const BASE_SUCESOS =
  'Un motociclista resultó herido en un accidente de tránsito ocurrido este sábado por la noche en la carretera que conecta el municipio con la capital, en el sector de la entrada principal del barrio. La Policía Nacional confirmó el hecho y el personal del Hospital departamental atendió a la víctima. Según testigos del lugar, el hecho se registró alrededor de las 9:45 pm cuando el conductor perdió el control del vehículo. Familiares de la víctima confirmaron las lesiones sufridas en el percance.';

function notaSucesos(estadoActual: string) {
  return {
    titulo: 'Motociclista herido en accidente de tránsito en carretera de Nicaragua',
    contenido: `<p>${BASE_SUCESOS} ${estadoActual}</p>`,
    resumen: 'Motociclista herido en accidente de tránsito, según familiares.',
    categoria: 'Sucesos',
    autor: 'Editorial',
    fecha: '2026-10-02T10:00:00Z',
    slug: 'nota-sucesos-test',
    palabrasClave: ['Nicaragua'],
    imagenDestacada: 'https://example.com/img.jpg',
  } as any;
}

const warningsDe = (r: ReturnType<typeof evaluate>) => r.valorEditorial.warnings.join(' ');

// ── A–E: variantes periodísticas de condición vigente ──────────────────────
describe('estado actual — evidencia de condición vigente (A–E)', () => {
  const casos: [string, string][] = [
    ['A: permanece hospitalizado', 'Florentino Olivas permanece hospitalizado en el centro asistencial de la zona.'],
    ['B: continúa hospitalizado', 'Florentino Olivas continúa hospitalizado tras el accidente registrado la noche anterior.'],
    ['C: se encuentra hospitalizado', 'Florentino Olivas se encuentra hospitalizado en la capital desde la noche del accidente.'],
    ['D: permanece en estado delicado', 'La víctima permanece en estado delicado en el centro asistencial, según sus familiares.'],
    ['E: continúa en estado delicado', 'La víctima continúa en estado delicado y bajo observación médica, indicaron allegados.'],
  ];
  for (const [nombre, frase] of casos) {
    it(`${nombre} => evidencia reconocida`, () => {
      const r = evaluate({ ...notaSucesos(frase), contenido: `<p>${pad(BASE_SUCESOS + ' ' + frase)}</p>` });
      expect(warningsDe(r)).not.toContain('EVIDENCIA_REQUERIDA:estado actual');
      expect(warningsDe(r)).not.toContain('evidencia requerida: estado actual');
    });
  }
});

// ── F–G: temporalidad + atribución ──────────────────────────────────────────
describe('estado actual — temporalidad y atribución (F–G)', () => {
  it('F: "hasta la última información proporcionada por sus familiares" => evidencia', () => {
    const frase = 'Hasta la última información proporcionada por sus familiares, la situación no ha cambiado en el centro asistencial.';
    const r = evaluate({ ...notaSucesos(frase), contenido: `<p>${pad(BASE_SUCESOS + ' ' + frase)}</p>` });
    expect(warningsDe(r)).not.toContain('estado actual');
  });

  it('G: "según información de sus familiares" => atribución válida', () => {
    const frase = 'Según información de sus familiares, la víctima continúa en estado delicado en el centro asistencial.';
    const r = evaluate({ ...notaSucesos(frase), contenido: `<p>${pad(BASE_SUCESOS + ' ' + frase)}</p>` });
    expect(warningsDe(r)).not.toContain('estado actual');
    expect(r.evidence.valorEditorial.tieneCitaEspecifica).toBe(true);
  });
});

// ── H: la frase real del caso ───────────────────────────────────────────────
describe('estado actual — frase real de Florentino Olivas (H)', () => {
  it('la oración real NO genera "falta estado actual"', () => {
    const frase = 'Hasta la última información proporcionada por sus familiares, Florentino Olivas permanece hospitalizado y en estado delicado en ese centro asistencial.';
    const r = evaluate({ ...notaSucesos(frase), contenido: `<p>${pad(BASE_SUCESOS + ' ' + frase)}</p>` });
    expect(warningsDe(r)).not.toContain('estado actual');
  });
});

// ── I: evento pasado puro NO cuenta como estado actual (estándar intacto) ──
describe('estado actual — el estándar sigue activo (I)', () => {
  it('"Fue trasladado al hospital" (evento pasado) => sigue detectando la ausencia', () => {
    const frase = 'La víctima fue trasladada al hospital minutos después del percance ocurrido esa noche.';
    const r = evaluate({ ...notaSucesos(frase), contenido: `<p>${pad(BASE_SUCESOS + ' ' + frase)}</p>` });
    expect(warningsDe(r)).toContain('estado actual');
  });
});

// ── J–L: coherencia perfil evaluado vs perfil mencionado ───────────────────
describe('coherencia perfil evaluado vs perfil en recomendación (J–L)', () => {
  const fraseSinEstado = 'La víctima fue trasladada al hospital minutos después del percance ocurrido esa noche.';

  it('J: perfil Sucesos => el mensaje dice Sucesos', () => {
    const r = evaluate({ ...notaSucesos(fraseSinEstado), contenido: `<p>${pad(BASE_SUCESOS + ' ' + fraseSinEstado)}</p>` });
    const rec = r.sugerencias.join(' ');
    if (rec.includes('estado actual')) {
      expect(rec).toContain('perfil de Sucesos');
    }
  });

  it('K: perfil Nacionales => los mensajes dicen Nacionales', () => {
    const base = 'Según el comunicado oficial del Ministerio de Educación (MINED) y la FAO, se publicaron los requisitos de inscripción. Los documentos necesarios deben presentarse en las oficinas correspondientes durante el plazo establecido.';
    const r = evaluate({
      titulo: 'Requisitos de inscripción escolar publicados',
      contenido: `<p>${pad(base)}</p>`,
      resumen: 'Requisitos escolares.',
      categoria: 'Nacionales',
      autor: 'Editorial',
      fecha: '2026-10-02T10:00:00Z',
      slug: 'nota-nac-test',
      palabrasClave: ['Nicaragua'],
      imagenDestacada: 'https://example.com/img.jpg',
    } as any);
    const rec = r.sugerencias.join(' ');
    expect(rec).not.toContain('perfil de Sucesos');
    if (rec.includes('según el perfil de')) {
      expect(rec).toContain('perfil de Nacionales');
    }
  });

  it('L: nunca Perfil Nacionales + mensaje Sucesos (incoherencia prohibida)', () => {
    const r = evaluate({ ...notaSucesos(fraseSinEstado), contenido: `<p>${pad(BASE_SUCESOS + ' ' + fraseSinEstado)}</p>` });
    const evaluada = r.evidence.category;
    const rec = r.sugerencias.join(' ');
    // La recomendación, si existe, debe nombrar la categoría realmente evaluada.
    if (rec.includes('según el perfil de')) {
      expect(rec).toContain(`perfil de ${evaluada}`);
    }
    expect(['Sucesos', 'Nacionales']).toContain(evaluada);
    if (evaluada === 'Sucesos') expect(rec).not.toContain('perfil de Nacionales');
  });
});
