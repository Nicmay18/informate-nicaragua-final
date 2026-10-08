import { describe, it, expect } from 'vitest';
import { buildFacebookCopy, buildWhatsAppCopy, buildTelegramItem, buildTelegramDigest, selectDigestNews, buildArticleUrl } from '@/lib/distribution/social-copy';
import { extractEditorialAngle } from '@/lib/distribution/editorial-angle';

const SUCESO = {
  slug: 'investigan-muerte-mujer-matagalpa',
  titulo: 'Investigan la muerte de una mujer de 70 años en Matagalpa',
  resumen: 'Las autoridades investigan las circunstancias del caso ocurrido en el departamento de Matagalpa. La víctima fue encontrada sin vida en su vivienda.',
  categoria: 'Sucesos',
  contenido: '<p>Las autoridades investigan las circunstancias del caso ocurrido en el departamento de Matagalpa.</p>',
};

const NACIONAL = {
  slug: 'minsa-activa-mega-ferias-salud',
  titulo: 'Minsa activa mega ferias de salud en Jinotega, Rivas y Tola',
  resumen: 'El Ministerio de Salud anunció ferias gratuitas con atención médica en tres departamentos durante este fin de semana.',
  categoria: 'Nacionales',
};

const DEPORTE = {
  slug: 'nicaragua-gana-plata-beisbol',
  titulo: 'Nicaragua gana plata tras caer ante Panamá en la final de béisbol',
  resumen: 'La selección nicaragüense de béisbol obtuvo la medalla de plata tras perder la final en Santo Domingo 2026.',
  categoria: 'Deportes',
};

const HUMANA = {
  slug: 'familia-nicaraguense-repatriar-espana',
  titulo: 'Joven nicaragüense muere en España y familia gestiona repatriación',
  resumen: 'Familia de Reynaldo José Castillo Torres busca recaudar fondos para repatriar sus restos desde España y sepultarlo en Nicaragua.',
  categoria: 'Internacionales',
};

const INTERNACIONAL = {
  slug: 'sismo-colombia-danos',
  titulo: 'Sismo de 7.4 sacude Colombia y deja daños y heridos',
  resumen: 'Un terremoto de magnitud 7.4 afectó varias zonas de Colombia durante la madrugada de este martes.',
  categoria: 'Internacionales',
};

describe('editorial-angle', () => {
  it('clasifica suceso grave', () => {
    const a = extractEditorialAngle(SUCESO);
    expect(a.kind).toBe('suceso');
    expect(a.grave).toBe(true);
    expect(a.lugar).toBe('Matagalpa');
    expect(a.contexto).toContain('autoridades investigan');
  });
  it('detecta historia humana', () => {
    const a = extractEditorialAngle(HUMANA);
    expect(a.kind).toBe('historia_humana');
    expect(a.grave).toBe(true);
  });
  it('nunca inventa contexto: sin resumen usa contenido o vacío', () => {
    const a = extractEditorialAngle({ titulo: 'X', categoria: 'Nacionales' });
    expect(a.contexto).toBe('');
  });
});

describe('UTM canónico', () => {
  it('cada canal lleva su source + medium=social', () => {
    for (const c of ['telegram', 'facebook', 'whatsapp'] as const) {
      expect(buildArticleUrl('abc', c)).toBe(`https://nicaraguainformate.com/noticias/abc?utm_source=${c}&utm_medium=social`);
    }
  });
});

describe('Facebook copy', () => {
  it('genera estructura completa con CTA y primer comentario', () => {
    const fb = buildFacebookCopy(SUCESO);
    expect(fb.text).toContain('Investigan la muerte');
    expect(fb.text).toContain('primer comentario');
    expect(fb.firstComment).toContain('utm_source=facebook');
    expect(fb.url).toContain('utm_source=facebook&utm_medium=social');
  });
  it('no usa clickbait prohibido', () => {
    for (const n of [SUCESO, NACIONAL, DEPORTE, HUMANA, INTERNACIONAL]) {
      const t = buildFacebookCopy(n).text.toLowerCase();
      expect(t).not.toMatch(/no vas a creer|te sorprender|tienes que ver|nadie esperaba|la verdad detrás|causando conmoción/);
    }
  });
  it('difiere por categoría', () => {
    const a = buildFacebookCopy(SUCESO).text;
    const b = buildFacebookCopy(DEPORTE).text;
    expect(a).not.toBe(b);
    expect(b).toContain('deportivo');
  });
});

describe('WhatsApp copy', () => {
  it('corto, negritas, enlace con UTM whatsapp', () => {
    const w = buildWhatsAppCopy(NACIONAL);
    expect(w).toContain('*Minsa activa mega ferias');
    expect(w).toContain('utm_source=whatsapp&utm_medium=social');
    expect(w.length).toBeLessThan(500);
  });
  it('se entiende fuera de contexto (titular + contexto + link)', () => {
    const w = buildWhatsAppCopy(INTERNACIONAL);
    expect(w).toMatch(/\*.*\*/);
    expect(w).toContain('https://nicaraguainformate.com/');
  });
});

describe('Telegram', () => {
  it('item lleva emoji, titulo, contexto, URL telegram', () => {
    const it = buildTelegramItem(DEPORTE);
    expect(it.emoji).toBe('⚽');
    expect(it.url).toContain('utm_source=telegram');
  });
  it('selectDigestNews prioriza diversidad de categorías', () => {
    const pool = [SUCESO, SUCESO && { ...SUCESO, slug: 'otro-suceso' }, NACIONAL, DEPORTE, INTERNACIONAL, HUMANA];
    const sel = selectDigestNews(pool as any, 6);
    const cats = new Set(sel.map((n) => n.categoria));
    expect(cats.size).toBeGreaterThanOrEqual(4);
  });
  it('digest tiene secciones por categoría y escapa HTML', () => {
    const items = [SUCESO, NACIONAL, DEPORTE].map(buildTelegramItem);
    const msg = buildTelegramDigest(items, 'Jueves 8 de octubre de 2026');
    expect(msg).toContain('BUENOS DÍAS, NICARAGUA');
    expect(msg).toContain('SUCESOS');
    expect(msg).toContain('NACIONALES');
    expect(msg).toContain('DEPORTES');
    expect(msg).toContain('Leer la noticia');
    expect(msg).toContain('#NicaraguaInformate');
  });
  it('digest escapa < > & en títulos', () => {
    const it = buildTelegramItem({ ...NACIONAL, titulo: 'A & B <test>' });
    const msg = buildTelegramDigest([it], 'X');
    expect(msg).toContain('&amp;');
    expect(msg).toContain('&lt;test&gt;');
  });
});

describe('diferenciación de canales', () => {
  it('los 3 canales producen textos distintos para la misma noticia', () => {
    const fb = buildFacebookCopy(SUCESO).text;
    const wa = buildWhatsAppCopy(SUCESO);
    const tg = buildTelegramItem(SUCESO);
    const tgText = `${tg.titulo} ${tg.contexto}`;
    expect(new Set([fb, wa, tgText]).size).toBe(3);
  });
});
