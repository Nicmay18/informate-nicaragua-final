/**
 * Tests de regresión MENI — detección de perfil
 * Verifica que el motor semántico clasifique correctamente por categoría real.
 *
 * Caso problemático histórico: "Coyote vs. Acme" fue clasificado como AMBIENTE
 * cuando debería ser ESPECTACULOS. Estos tests garantizan que no vuelva a ocurrir.
 */
import { describe, it, expect } from 'vitest';
import { detectContentProfile } from '@/lib/meni/profile-detector';

describe('MENI Profile Detector — Tests de regresión', () => {
  describe('Caso 1: Coyote vs. Acme => ESPECTACULOS (no ambiente)', () => {
    it('clasifica como espectaculos, no ambiente', () => {
      const titulo = 'Coyote vs. Acme llega a Nicaragua: el Coyote va contra ACME';
      const contenido = `
        La película Coyote vs. Acme llega a los cines de Nicaragua este fin de semana.
        Se trata de una comedia que combina animación con acción en vivo, protagonizada
        por el legendario personaje de Looney Tunes. Warner Bros. produce esta cinta
        que promete entretener a toda la familia. El estreno está programado para viernes.
        El elenco incluye actores de Hollywood y el personaje animado del Coyote.
        La taquilla abre desde el jueves. La secuela ya está en planeación.
      `;
      const resumen = 'La película de Warner Bros llega a los cines del país.';

      const result = detectContentProfile(titulo, contenido, resumen);

      expect(result.profile_detected).toBe('espectaculos');
      expect(result.profile_detected).not.toBe('ambiente');
    });
  });

  describe('Caso 2: Volcán Telica => AMBIENTE', () => {
    it('clasifica como ambiente', () => {
      const titulo = 'Volcán Telica expulsa gases y ceniza con columnas de 200 metros';
      const contenido = `
        El volcán Telica registró este lunes una nueva emisión de gases y ceniza,
        con una columna que alcanzó hasta 200 metros sobre el cráter y que se desplazó
        hacia el suroeste. El INETER informó que la actividad volcánica se mantiene
        en niveles normales. No se descartan nuevas emisiones en los próximos días.
      `;
      const resumen = 'El volcán registró una nueva emisión de gases y ceniza.';

      const result = detectContentProfile(titulo, contenido, resumen);

      expect(result.profile_detected).toBe('ambiente');
    });
  });

  describe('Caso 3: Prichard Colón => DEPORTES', () => {
    it('clasifica como deportes', () => {
      const titulo = 'Muere Prichard Colón, boxeador que enfrentó años de secuelas';
      const contenido = `
        El boxeador puertorriqueño Prichard Colón falleció tras años de batallar
        las secuelas de una lesión cerebral sufrida en un combate en 2015.
        El atleta participó en 19 peleas como profesional y su caso conmocionó
        al mundo del boxeo. La selección de boxeo de Puerto Rico le rindió homenaje.
      `;
      const resumen = 'El boxeador murió tras años de secuelas por lesión en combate.';

      const result = detectContentProfile(titulo, contenido, resumen);

      expect(result.profile_detected).toBe('deportes');
    });
  });

  describe('Caso 4: Accidente en Wapi => SUCESOS', () => {
    it('clasifica como sucesos', () => {
      const titulo = 'Accidente en Wapi deja un fallecido y un herido tras vuelco';
      const contenido = `
        Un accidente de tránsito ocurrido la tarde de este jueves en el sector
        conocido como La Gran Bajada de Wapi dejó un fallecido y un herido.
        El vehículo volcó tras perder el control en una curva. Bomberos acudieron
        al rescate. La policía de tránsito investiga las causas del accidente.
      `;
      const resumen = 'Un accidente de tránsito dejó un muerto y un herido.';

      const result = detectContentProfile(titulo, contenido, resumen);

      expect(result.profile_detected).toBe('sucesos');
    });
  });

  describe('Caso 5: Aguacates => NACIONALES o ECONOMIA (no ambiente)', () => {
    it('clasifica como nacionales o economia, no ambiente', () => {
      const titulo = 'Nicaragua produce 10.3 millones de aguacates en 2026';
      const contenido = `
        Nicaragua produjo 10.3 millones de aguacates durante 2026, según datos
        del Ministerio Agropecuario. El gobierno de Nicaragua impulsó políticas
        para aumentar la producción agrícola. Los agricultores reportaron una
        cosecha récord este año. El precio del aguacate se mantuvo estable en
        el mercado local.
      `;
      const resumen = 'Nicaragua alcanzó producción récord de aguacates.';

      const result = detectContentProfile(titulo, contenido, resumen);

      // Debe ser nacionales o economia, NUNCA ambiente
      expect(['nacionales', 'economia']).toContain(result.profile_detected);
      expect(result.profile_detected).not.toBe('ambiente');
    });
  });

  describe('Caso 6: Noticia internacional => INTERNACIONAL', () => {
    it('clasifica como internacional', () => {
      const titulo = 'Sismo de 7.4 sacude Colombia y deja daños y heridos';
      const contenido = `
        Un sismo de magnitud 7.4 sacudió el territorio de Colombia esta madrugada,
        dejando al menos 15 heridos y daños materiales en varias estructuras.
        El terremoto fue sentido en varias ciudades del país. Las autoridades
        internacionales de Estados Unidos y la ONU ofrecieron ayuda.
      `;
      const resumen = 'Un sismo de 7.4 sacudió Colombia con daños y heridos.';

      const result = detectContentProfile(titulo, contenido, resumen);

      // Puede ser internacional o ambiente (por sismo/terremoto), pero no espectaculos
      expect(['internacional', 'ambiente']).toContain(result.profile_detected);
    });
  });

  describe('Caso 7: Noticia tecnológica => TECNOLOGIA', () => {
    it('clasifica como tecnologia', () => {
      const titulo = 'Galaxy Z Flip8 ya está en Nicaragua: qué cambia y cuánto cuesta';
      const contenido = `
        El nuevo smartphone Galaxy Z Flip8 de Samsung ya está disponible en Nicaragua.
        Esta tecnología de pantalla plegable representa la última generación de
        celulares. El precio en el mercado local es de $1,200. El software incluye
        inteligencia artificial para mejorar las fotos.
      `;
      const resumen = 'El smartphone plegable de Samsung llega al país.';

      const result = detectContentProfile(titulo, contenido, resumen);

      expect(result.profile_detected).toBe('tecnologia');
    });
  });

  describe('Caso 8: Noticia cultural => CULTURA', () => {
    it('clasifica como cultura', () => {
      const titulo = 'Santo Domingo se despide de Managua y regresa a Las Sierritas';
      const contenido = `
        Managua despidió este lunes a Santo Domingo de Guzmán, quien salió durante
        la mañana desde la iglesia del barrio 19 de Julio. La tradición religiosa
        reunió a miles de fieles en un festival de fe y cultura popular. El
        patrimonio cultural de Nicaragua se vio reflejado en esta celebración.
      `;
      const resumen = 'Managua se despidió de Santo Domingo con tradición y fe.';

      const result = detectContentProfile(titulo, contenido, resumen);

      // Puede ser cultura o nacionales (por Managua/Nicaragua), pero no ambiente
      expect(['cultura', 'nacionales']).toContain(result.profile_detected);
    });
  });

  describe('Caso 9: Noticia turística => TURISMO', () => {
    it('clasifica como turismo', () => {
      const titulo = 'Mirador de Catarina: precios, horarios y qué hacer';
      const contenido = `
        El Mirador de Catarina es uno de los destinos turísticos más populares
        de Nicaragua. Ofrece vistas espectaculares de la Laguna de Apoyo. Los
        precios van desde $2 para nacionales. Los horarios son de 8am a 6pm.
        Es un atractivo turístico imperdible en cualquier gira por el país.
      `;
      const resumen = 'Guía turística del Mirador de Catarina.';

      const result = detectContentProfile(titulo, contenido, resumen);

      expect(result.profile_detected).toBe('turismo');
    });
  });

  describe('Caso 10: Noticia de salud => SALUD', () => {
    it('clasifica como salud', () => {
      const titulo = 'MINSA refuerza vacunación contra el dengue en Managua';
      const contenido = `
        El Ministerio de Salud (MINSA) intensificó la campaña de vacunación
        contra el dengue en los barrios de Managua. Los síntomas incluyen fiebre
        alta, dolor de cabeza y dolores musculares. La prevención es fundamental
        para evitar el contagio. El brote de dengue ha afectado a cientos de
        personas en lo que va del año.
      `;
      const resumen = 'El MINSA intensifica la vacunación contra el dengue.';

      const result = detectContentProfile(titulo, contenido, resumen);

      expect(result.profile_detected).toBe('salud');
    });
  });

  describe('Confianza del perfil', () => {
    it('devuelve un valor de confianza entre 0 y 1', () => {
      const result = detectContentProfile(
        'Accidente fatal en carretera',
        'Un accidente de tránsito dejó un fallecido.',
        'Accidente de tránsito con víctima fatal.'
      );
      expect(result.profile_confidence).toBeGreaterThanOrEqual(0);
      expect(result.profile_confidence).toBeLessThanOrEqual(1);
    });

    it('devuelve scores para todos los perfiles', () => {
      const result = detectContentProfile('test', 'test', 'test');
      expect(result.scores).toBeDefined();
      expect(result.scores.sucesos).toBeDefined();
      expect(result.scores.espectaculos).toBeDefined();
      expect(result.scores.ambiente).toBeDefined();
      expect(result.scores.astronomia).toBeDefined();
    });
  });

  describe('Caso 11: Eclipse lunar => ASTRONOMIA (no espectáculos ni nacionales)', () => {
    it('clasifica un eclipse como astronomia', () => {
      const titulo = 'Eclipse lunar visible en Nicaragua: cómo y a qué hora verlo';
      const contenido = `
        Este martes se podrá observar un eclipse lunar desde Nicaragua. El
        fenómeno astronómico ocurrirá durante la madrugada y será visible a
        simple vista en gran parte del territorio nacional. Los astrónomos
        recomiendan buscar un lugar despejado y alejado de la contaminación
        lumínica. La sombra terrestre oscurecerá la luna de sangre por varias
        horas.
      `;
      const resumen = 'Un eclipse lunar será visible desde Nicaragua este martes.';

      const result = detectContentProfile(titulo, contenido, resumen);

      expect(result.profile_detected).toBe('astronomia');
      expect(result.profile_detected).not.toBe('espectaculos');
      expect(result.profile_detected).not.toBe('nacionales');
    });
  });

  describe('Caso 12: Medicina Legal y parricidio => SUCESOS (no salud)', () => {
    it('clasifica una noticia forense como sucesos', () => {
      const titulo = 'Medicina Legal determina estado mental de acusada de parricidio';
      const contenido = `
        La Fiscalía General informó que Medicina Legal evaluó el estado mental
        de la mujer acusada de parricidio. El proceso penal continúa en el
        tribunal correspondiente. La investigación policial recabó un dictamen
        forense y peritajes para establecer responsabilidades. La causa penal
        sigue abierta mientras se determina la condena.
      `;
      const resumen = 'Medicina Legal evalúa a acusada de parricidio.';

      const result = detectContentProfile(titulo, contenido, resumen);

      expect(result.profile_detected).toBe('sucesos');
      expect(result.profile_detected).not.toBe('salud');
    });
  });
});
