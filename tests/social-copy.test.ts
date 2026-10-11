import { describe, it, expect } from 'vitest';
import { buildFacebookCopy, buildWhatsAppCopy, buildTelegramItem, buildTelegramDigest, selectDigestNews, buildArticleUrl, buildSocialCopies, getSocialOptions, validateSocialSelection } from '@/lib/distribution/social-copy';
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
    expect(fb.text).toMatch(/primer comentario/i);
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
    expect(b).toContain('#Deportes');
  });
});

describe('Facebook editorial basado en evidencia', () => {
  const forense = {
    slug: 'hombre-murio-en-masaya', categoria: 'Sucesos',
    titulo: 'Hombre murió por broncoaspiración tras ser hallado en Masaya',
    resumen: 'Fernando José Hernández Vilchez, de 44 años, fue hallado sin vida en la carretera Masaya-Catarina.',
    contenido: '<p>El dictamen forense estableció broncoaspiración.</p>',
  };
  it('reconoce el ángulo forense en el cuerpo sin inventar sospechosos', () => {
    const fb = buildFacebookCopy(forense);
    expect(fb.analysis.enfoque).toBe('Dictamen forense');
    expect(fb.analysis.evidencia).toContain('El dictamen forense estableció broncoaspiración.');
    expect(fb.text).toContain('dictamen forense');
    expect(fb.text).toContain('broncoaspiración');
    expect(fb.text).not.toMatch(/conmociona|asesinato|\bcomenta\b|\bcomparte\b/i);
    expect(fb.analysis.tono).toBe('Sobrio y respetuoso');
  });
  it('separa post y comentario, mantiene el sitio oficial y la marca', () => {
    const fb = buildFacebookCopy(forense);
    expect(fb.text).not.toContain('https://');
    expect(fb.text).toMatch(/primer comentario/i);
    expect(fb.text).toContain('Nicaragua Informate | Información responsable y verificable.');
    expect(fb.firstComment).toContain(fb.url);
    expect(fb.firstComment).toContain('sitio oficial');
  });
  it('no usa un ángulo forense cuando no aparece en la nota', () => {
    const fb = buildFacebookCopy(NACIONAL);
    expect(fb.text).not.toMatch(/forense|repatriación/);
    expect(fb.analysis.enfoque).not.toBe('Dictamen forense');
  });
  it('selección inválida de IA vuelve al enfoque respaldado', () => {
    expect(buildFacebookCopy(forense, 999)).toEqual(buildFacebookCopy(forense));
  });
});

describe('límites del análisis editorial', () => {
  it.each(['Murió en Managua', 'Falleció en León', 'Murieron dos personas', 'Hallado sin vida'])('reconoce tono sensible: %s', titulo => {
    expect(extractEditorialAngle({ titulo }).grave).toBe(true);
  });
  it('no confunde absoluto con luto ni final de programa con deporte', () => {
    expect(extractEditorialAngle({ titulo: 'Control absoluto del torneo' }).grave).toBe(false);
    expect(buildFacebookCopy({ ...NACIONAL, resumen: 'Al final del programa se entregarán becas.' }).analysis.enfoque).not.toBe('Resultado deportivo');
  });
  it('no promete recomendaciones ni alertas ausentes', () => {
    const copy = buildFacebookCopy(INTERNACIONAL);
    expect(copy.text).not.toMatch(/están en alerta|recomiendan|7\. 4/);
    expect(copy.analysis.evidencia).toContain('7.4');
  });
  it('no presenta como disponible un dictamen pendiente', () => {
    const copy = buildFacebookCopy({ ...SUCESO, contenido: 'El dictamen forense no ha sido divulgado.' });
    expect(copy.text).not.toContain('Qué estableció');
    expect(copy.analysis.evidencia).toContain('no ha sido divulgado');
  });
  it('no promete ayuda o próximos pasos en una repatriación', () => {
    expect(buildFacebookCopy(HUMANA).text).not.toMatch(/puede ayudarse|qué sigue|viene después/);
  });
  it('usa oraciones completas también en Facebook y WhatsApp', () => {
    const article = { ...SUCESO, resumen: 'Las autoridades investigan las circunstancias del...' };
    for (const text of [buildFacebookCopy(article).text, buildWhatsAppCopy(article)]) {
      expect(text).not.toMatch(/\.\.\.|…/);
      expect(text).toContain('ocurrido en el departamento de Matagalpa.');
    }
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
  it('agrupa categorías no consecutivas sin repetir encabezados', () => {
    const items = [SUCESO, NACIONAL, { ...SUCESO, slug: 'otro-suceso' }].map(buildTelegramItem);
    const msg = buildTelegramDigest(items, 'Domingo 11 de octubre de 2026');
    expect(msg.match(/<b>SUCESOS<\/b>/g)).toHaveLength(1);
    expect(msg.lastIndexOf(SUCESO.titulo)).toBeLessThan(msg.indexOf('<b>NACIONALES</b>'));
  });
  it('conserva decimales y una oración completa', () => {
    expect(buildTelegramItem(INTERNACIONAL).contexto).toBe(INTERNACIONAL.resumen);
  });
  it('no recorta una oración válida a 170 caracteres', () => {
    const resumen = 'Tres trabajadores de una empresa de telefonía, originarios de Masaya, murieron electrocutados mientras laboraban cerca del puente La Culebra, en San Carlos, según la información publicada.';
    expect(buildTelegramItem({ ...SUCESO, resumen }).contexto).toBe(resumen);
  });
  it('usa el cuerpo cuando el resumen termina truncado', () => {
    const item = buildTelegramItem({ ...SUCESO, resumen: 'Las autoridades investigan las circunstancias del...' });
    expect(item.contexto).toBe('Las autoridades investigan las circunstancias del caso ocurrido en el departamento de Matagalpa.');
  });
  it('omite contexto incompleto o demasiado largo en vez de inventarlo', () => {
    expect(buildTelegramItem({ ...NACIONAL, resumen: 'La información se confirmó en' }).contexto).toBe('');
    expect(buildTelegramItem({ ...NACIONAL, resumen: 'Información '.repeat(40) + 'confirmada.' }).contexto).toBe('');
  });
  it('preserva titulares completos aunque superen 120 caracteres', () => {
    const titulo = 'Información confirmada '.repeat(7).trim();
    const msg = buildTelegramDigest([buildTelegramItem({ ...NACIONAL, titulo })], 'Domingo');
    expect(msg).toContain(`<b>${titulo}</b>`);
  });
  it('ajusta el presupuesto por bloques sin romper HTML ni perder noticias', () => {
    const items = Array.from({ length: 6 }, (_, i) => buildTelegramItem({
      ...NACIONAL, slug: `nota-${i}-` + 'a'.repeat(160), titulo: `Noticia ${i}: ` + 'A & B '.repeat(15),
      resumen: 'La institución confirmó ' + 'A & B '.repeat(30) + 'para la población.',
    }));
    const msg = buildTelegramDigest(items, 'Domingo 11 de octubre de 2026');
    expect(msg.length).toBeLessThanOrEqual(4096);
    expect(msg.match(/Leer la noticia/g)).toHaveLength(6);
    expect(msg.match(/La institución confirmó/g)?.length || 0).toBeLessThan(6);
    expect(msg.match(/<b>/g)?.length).toBe(msg.match(/<\/b>/g)?.length);
    expect(msg.match(/<a /g)?.length).toBe(msg.match(/<\/a>/g)?.length);
    expect(msg.endsWith('#NicaraguaInformate')).toBe(true);
    expect(msg).not.toContain('[Leer la noticia]');
  });
  it('rechaza un boletín imposible de enviar sin cortar titulares', () => {
    expect(() => buildTelegramDigest([buildTelegramItem({ ...NACIONAL, titulo: 'A'.repeat(4200) })], 'Domingo')).toThrow(/límite/);
  });
  it('digest escapa < > & en títulos', () => {
    const it = buildTelegramItem({ ...NACIONAL, titulo: 'A & B <test>' });
    const msg = buildTelegramDigest([it], 'X');
    expect(msg).toContain('&amp;');
    expect(msg).toContain('&lt;test&gt;');
  });
});

describe('selección estructurada de IA', () => {
  it('acepta solo índices de enfoques y aperturas respaldados', () => {
    const options = getSocialOptions(NACIONAL);
    const selection = validateSocialSelection('{"angleIndex":0,"openingIndex":1}', NACIONAL);
    expect(selection).toEqual({ angleIndex: 0, openingIndex: 1 });
    expect(buildSocialCopies(NACIONAL, selection).facebookPost).toContain(options.openings[1]);
  });
  it.each([
    'texto libre', '{}', 'null', '[]', '{"angleIndex":"0","openingIndex":0}',
    '{"angleIndex":-1,"openingIndex":0}', '{"angleIndex":999,"openingIndex":0}',
    '{"angleIndex":0.5,"openingIndex":0}', '{"angleIndex":0,"openingIndex":100}',
    '{"angleIndex":0,"openingIndex":0,"copy":"Una persona inventada"}',
    '{"angleIndex":0,"openingIndex":0,"url":"https://otro.test"}',
  ])('rechaza salida inválida sin incorporar texto libre: %s', raw => {
    const selection = validateSocialSelection(raw, NACIONAL);
    expect(selection).toBeNull();
    expect(buildSocialCopies(NACIONAL, selection)).toEqual(buildSocialCopies(NACIONAL));
  });
  it('mantiene enlaces y separa los tres canales incluso con IA', () => {
    const data = buildSocialCopies(INTERNACIONAL, { angleIndex: 0, openingIndex: 1 });
    expect(data.facebookPost).not.toContain('https://');
    expect(data.firstComment).toContain(data.urls.facebook);
    expect(data.telegramText).not.toMatch(/<b>|<a |\[Leer/);
    expect(data.telegramText).toContain(data.urls.telegram);
    expect(data.whatsappText).toContain(data.urls.whatsapp);
    expect(data.whatsappText).toContain('*Sismo de 7.4');
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
