/**
 * TEST DE REGRESIÓN PERMANENTE — REGLA 3
 * Casos obligatorios que DEBEN pasar siempre.
 * Si cualquiera falla, el sistema está roto.
 */
import { describe, it, expect } from 'vitest';
import { detectContentProfile } from '@/lib/meni/profile-detector';
import { resolvePublicCategory } from '@/lib/editorial/canonical';
import type { Noticia, PublicCategory } from '@/lib/types';
import { isPublicCategory, PUBLIC_CATEGORIES } from '@/lib/types';

describe('REGLA 2 — Taxonomía pública canónica', () => {
  it('solo existen 6 categorías públicas', () => {
    expect(PUBLIC_CATEGORIES).toEqual([
      'Nacionales',
      'Sucesos',
      'Internacionales',
      'Deportes',
      'Espectáculos',
      'Tecnología',
    ]);
  });

  it('Salud NO es categoría pública', () => {
    expect(isPublicCategory('Salud')).toBe(false);
  });

  it('Ambiente NO es categoría pública', () => {
    expect(isPublicCategory('Ambiente')).toBe(false);
  });

  it('Cultura NO es categoría pública', () => {
    expect(isPublicCategory('Cultura')).toBe(false);
  });

  it('Turismo NO es categoría pública', () => {
    expect(isPublicCategory('Turismo')).toBe(false);
  });

  it('Economía NO es categoría pública', () => {
    expect(isPublicCategory('Economía')).toBe(false);
  });

  it('Educación NO es categoría pública', () => {
    expect(isPublicCategory('Educación')).toBe(false);
  });

  it('Gastronomía NO es categoría pública', () => {
    expect(isPublicCategory('Gastronomía')).toBe(false);
  });

  it('Política NO es categoría pública', () => {
    expect(isPublicCategory('Política')).toBe(false);
  });
});

describe('REGLA 3 — Casos de regresión obligatorios', () => {
  const casos: Array<{ titulo: string; contenido: string; expected: PublicCategory; descripcion: string }> = [
    {
      titulo: 'Toro embiste a hombre durante Tope de Toros en Granada',
      contenido: 'Un hombre resultó herido tras ser embestido por un toro durante el Tope de Toros en Granada. El lesionado fue trasladado al hospital para recibir atención médica.',
      expected: 'Sucesos',
      descripcion: 'Caso crítico: persona herida por toro = Sucesos, NO Salud/Cultura/Turismo',
    },
    {
      titulo: 'MINSA activa mega ferias de salud en Jinotega, Rivas y Tola',
      contenido: 'El Ministerio de Salud anunció ferias médicas en tres departamentos para atender a la población nicaragüense.',
      expected: 'Nacionales',
      descripcion: 'MINSA no convierte en categoría Salud pública',
    },
    {
      titulo: 'Nicaragua gana plata tras caer ante Panamá en la final de béisbol',
      contenido: 'La selección nacional de béisbol de Nicaragua obtuvo medalla de plata en el torneo internacional tras perder la final contra Panamá.',
      expected: 'Deportes',
      descripcion: 'Béisbol internacional = Deportes',
    },
    {
      titulo: 'Coyote vs. Acme llega a Nicaragua',
      contenido: 'La película Coyote vs. Acme se estrena en cines de Nicaragua este fin de semana. Warner Bros presenta esta comedia animada.',
      expected: 'Espectáculos',
      descripcion: 'Película/cine = Espectáculos',
    },
    {
      titulo: 'Nicaragua estrenará centro de monitoreo de emergencias',
      contenido: 'El gobierno de Nicaragua inaugurará un nuevo centro de monitoreo de emergencias para mejorar la respuesta ante desastres naturales.',
      expected: 'Nacionales',
      descripcion: 'Infraestructura gubernamental nacional = Nacionales',
    },
    {
      titulo: 'Volcán Telica expulsa gases y ceniza',
      contenido: 'El volcán Telica registró actividad con emisión de gases y ceniza. El INETER monitorea la situación de cerca.',
      expected: 'Nacionales',
      descripcion: 'Volcán NO es categoría Ambiente pública, es Nacionales',
    },
    {
      titulo: 'Nicaragua produce 10.3 millones de aguacates en 2026',
      contenido: 'La producción de aguacate en Nicaragua alcanzó 10.3 millones de unidades en 2026, según datos del Ministerio Agropecuario.',
      expected: 'Nacionales',
      descripcion: 'Producción agrícola nacional = Nacionales, NO Ambiente',
    },
    {
      titulo: 'Messi iguala récord histórico de 16 goles en Mundiales',
      contenido: 'Lionel Messi igualó el récord de 16 goles en Mundiales de fútbol durante el partido de Argentina.',
      expected: 'Deportes',
      descripcion: 'Fútbol internacional = Deportes, NO Internacionales',
    },
    {
      titulo: 'NASA registra bola de fuego que cruzó seis estados de EE.UU.',
      contenido: 'La NASA confirmó que una bola de fuego cruzó seis estados de Estados Unidos. El fenómeno fue visible desde tierra.',
      expected: 'Internacionales',
      descripcion: 'Evento en EE.UU. = Internacionales',
    },
    {
      titulo: 'Sismo de 7.7 sacude Indonesia y deja al menos dos muertos',
      contenido: 'Un sismo de magnitud 7.7 dejó al menos dos muertos y daños en viviendas en la isla de Flores, Indonesia. La BMKG emitió y luego canceló una alerta de tsunami.',
      expected: 'Internacionales',
      descripcion: 'Sismo en país extranjero = Internacionales, NO Ambiente',
    },
    {
      titulo: 'Samsung lanza One UI 9 y Android 17',
      contenido: 'Samsung presentó oficialmente One UI 9 basada en Android 17 con nuevas funciones para sus dispositivos Galaxy.',
      expected: 'Tecnología',
      descripcion: 'Samsung/Android = Tecnología',
    },
  ];

  for (const caso of casos) {
    it(`${caso.descripcion}: "${caso.titulo}" → ${caso.expected}`, () => {
      const article: Partial<Noticia> = {
        titulo: caso.titulo,
        contenido: caso.contenido,
        resumen: caso.contenido,
      };
      const result = resolvePublicCategory(article);
      expect(result).toBe(caso.expected);
    });
  }
});

describe('REGLA 5 — Perfil interno nunca escapa a capa pública', () => {
  it('perfil=salud → Nacionales (no Salud)', () => {
    const article: Partial<Noticia> = {
      titulo: 'MINSA activa ferias',
      contenido: 'Ferias de salud',
      resumen: 'Ferias',
      perfil: 'salud',
      categoria: 'Salud',
    };
    expect(resolvePublicCategory(article)).toBe('Nacionales');
  });

  it('perfil=ambiente → Nacionales (no Ambiente)', () => {
    const article: Partial<Noticia> = {
      titulo: 'Volcán Telica',
      contenido: 'Actividad volcánica',
      resumen: 'Volcán',
      perfil: 'ambiente',
      categoria: 'Ambiente',
    };
    expect(resolvePublicCategory(article)).toBe('Nacionales');
  });

  it('perfil=cultura → Nacionales (no Cultura)', () => {
    const article: Partial<Noticia> = {
      titulo: 'Festival de música',
      contenido: 'Concierto',
      resumen: 'Música',
      perfil: 'cultura',
      categoria: 'Cultura',
    };
    expect(resolvePublicCategory(article)).toBe('Nacionales');
  });

  it('perfil=turismo → Nacionales (no Turismo)', () => {
    const article: Partial<Noticia> = {
      titulo: 'Turismo en Granada',
      contenido: 'Destino turístico',
      resumen: 'Turismo',
      perfil: 'turismo',
      categoria: 'Turismo',
    };
    expect(resolvePublicCategory(article)).toBe('Nacionales');
  });

  it('perfil=economia → Nacionales (no Economía)', () => {
    const article: Partial<Noticia> = {
      titulo: 'Precios suben',
      contenido: 'Inflación',
      resumen: 'Economía',
      perfil: 'economia',
      categoria: 'Economía',
    };
    expect(resolvePublicCategory(article)).toBe('Nacionales');
  });

  it('perfil=educacion → Nacionales (no Educación)', () => {
    const article: Partial<Noticia> = {
      titulo: 'Escuelas abren',
      contenido: 'Calendario escolar',
      resumen: 'Educación',
      perfil: 'educacion',
      categoria: 'Educación',
    };
    expect(resolvePublicCategory(article)).toBe('Nacionales');
  });
});

describe('REGLA 13 — Prueba de contradicción (one source of truth)', () => {
  it('resolvePublicCategory siempre devuelve una categoría pública válida', () => {
    const articles: Partial<Noticia>[] = [
      { titulo: 'Accidente', contenido: 'Heridos', resumen: '', perfil: 'sucesos' },
      { titulo: 'Fútbol', contenido: 'Gol', resumen: '', perfil: 'deportes' },
      { titulo: 'Cine', contenido: 'Película', resumen: '', perfil: 'espectaculos' },
      { titulo: 'Salud', contenido: 'MINSA', resumen: '', perfil: 'salud', categoria: 'Salud' },
      { titulo: 'Ambiente', contenido: 'Volcán', resumen: '', perfil: 'ambiente', categoria: 'Ambiente' },
      { titulo: 'Random', contenido: 'Random', resumen: '' },
    ];
    for (const a of articles) {
      const result = resolvePublicCategory(a);
      expect(isPublicCategory(result)).toBe(true);
    }
  });
});
