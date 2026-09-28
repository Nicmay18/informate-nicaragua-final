import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  stripHtml,
  escTelegram,
  resolveTelegramSummary,
  extraerContexto,
  buildTelegramCaption,
  sendTelegramArticle,
} from '@/lib/distribution/telegram';
import { generateSocialCopy, buildArticleUrl } from '@/lib/distribution/social-copy';

// ── Mock Firestore mínimo con claim atómico ─────────────────
function makeDb(claims: Record<string, any> = {}) {
  const store = { ...claims };
  return {
    _store: store,
    collection(name: string) {
      if (name !== 'distribuciones_envios') throw new Error(`col inesperada: ${name}`);
      return {
        doc(id: string) {
          return {
            async create(data: any) {
              if (store[id]) { const e: any = new Error('ALREADY_EXISTS'); e.code = 6; throw e; }
              store[id] = { ...data };
            },
            async get() { return { exists: !!store[id], data: () => store[id] }; },
            async update(patch: any) { store[id] = { ...(store[id] || {}), ...patch }; },
          };
        },
      };
    },
  } as any;
}

const ART = {
  slug: 'medicina-legal-dictamen-ticuantepe',
  titulo: 'Medicina Legal determina estado mental de acusada en Managua',
  resumen: 'Peritajes de Medicina Legal se incorporan al expediente. La acusada enfrenta proceso penal por parricidio.',
  contenido: '<p>La Fiscalía informó el dictamen.</p><p>El caso sigue en tribunales.</p>',
  categoria: 'Sucesos',
  imagen: 'https://nicaraguainformate.com/img/x.webp',
};

let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  process.env.TG_TOKEN = 'test-token';
  process.env.TG_CHAT_ID = '-100test';
  fetchSpy = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, result: { message_id: 777 } }),
  })) as any;
  vi.stubGlobal('fetch', fetchSpy);
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('Telegram — escape y construcción de caption', () => {
  it('escapa &, <, > en título y resumen (sin "can\'t parse entities")', () => {
    const caption = buildTelegramCaption({
      slug: 'x', titulo: 'Alcaldía & comerciantes: nuevas medidas',
      resumen: 'La medida afecta a comercios < pequeños > del municipio.',
      contenido: '', categoria: 'Nacionales',
    }, 'https://nicaraguainformate.com/noticias/x');
    expect(caption).toContain('Alcaldía &amp; comerciantes');
    expect(caption).toContain('a comercios &lt; pequeños &gt;');
    expect(caption).not.toMatch(/<(?!b>|\/b>|a |\/a>)/); // ningún tag crudo fuera de los nuestros
  });

  it('truncado seguro: caption largo no corta entidades ni tags', () => {
    const largo = 'Información detallada con acentos áéíóú y entidades &amp; repita. '.repeat(40);
    const caption = buildTelegramCaption({
      slug: 'x', titulo: 'Título', resumen: largo, contenido: '', categoria: 'General',
    }, 'https://nicaraguainformate.com/noticias/x', 1024);
    expect(caption.length).toBeLessThanOrEqual(1024);
    expect(caption).toContain('<a href='); // cierre intacto
    expect(caption).not.toMatch(/&[a-z]+$/i); // sin entidad partida
    expect(caption).toContain('</b>');
  });

  it('caption exactamente en límite queda intacto', () => {
    const caption = buildTelegramCaption({ slug: 'x', titulo: 'T', resumen: 'Corto.', contenido: '' }, 'https://u/x');
    expect(caption.length).toBeLessThanOrEqual(1024);
    expect(caption).toContain('Corto.');
  });

  it('emojis y UTF-8 se preservan', () => {
    const caption = buildTelegramCaption({
      slug: 'x', titulo: 'Festival 🎉 en León', resumen: 'Celebración cultural con música.', contenido: '', categoria: 'Cultura',
    }, 'https://u/x');
    expect(caption).toContain('🎉');
    expect(caption).toContain('León');
  });
});

describe('Telegram — resumen con fallback', () => {
  it('usa resumen cuando existe', () => {
    expect(resolveTelegramSummary({ resumen: 'El resumen editorial correcto del artículo.' })).toBe('El resumen editorial correcto del artículo.');
  });
  it('cae a metaDescription si resumen vacío', () => {
    expect(resolveTelegramSummary({ resumen: '', metaDescription: 'Descripción SEO válida del artículo.' })).toBe('Descripción SEO válida del artículo.');
  });
  it('cae al primer párrafo limpio del HTML si no hay resumen ni meta', () => {
    const r = resolveTelegramSummary({ contenido: '<p>El primer párrafo tiene más de cuarenta caracteres útiles aquí.</p><p>Segundo.</p>' });
    expect(r).toContain('El primer párrafo tiene más de cuarenta');
    expect(r).not.toContain('<p>');
  });
  it('nunca devuelve HTML crudo', () => {
    const r = resolveTelegramSummary({ contenido: '<p><strong>Texto con formato</strong> suficiente para ser extraído.</p>' });
    expect(r).not.toMatch(/<[a-z]/i);
  });
  it('sin datos suficientes devuelve vacío (no inventa)', () => {
    expect(resolveTelegramSummary({})).toBe('');
    expect(resolveTelegramSummary({ resumen: 'abc' })).toBe('');
  });
  it('stripHtml limpia entidades y tags', () => {
    expect(stripHtml('<p>A&nbsp;B &amp; C</p>')).toBe('A B & C');
  });
});

describe('Telegram — envío: timeout, errores, retry, idempotencia', () => {
  it('envío exitoso con imagen → sendPhoto y ok', async () => {
    const r = await sendTelegramArticle(ART, { db: makeDb() });
    expect(r.ok).toBe(true);
    expect(r.messageId).toBe(777);
    expect(fetchSpy.mock.calls[0][0]).toContain('sendPhoto');
    const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(payload.caption).toContain('<b>');
    expect(payload.caption).toContain('Medicina Legal');
    expect(payload.parse_mode).toBe('HTML');
  });

  it('sin credenciales → NO_CREDENTIALS, sin fetch', async () => {
    delete process.env.TG_TOKEN;
    const r = await sendTelegramArticle(ART, { db: makeDb() });
    expect(r.ok).toBe(false);
    expect(r.errorCode).toBe('NO_CREDENTIALS');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('error parse → nonRetryable, sin reintento', async () => {
    fetchSpy.mockImplementation(async () => ({
      ok: true, status: 400,
      json: async () => ({ ok: false, description: "Bad Request: can't parse entities" }),
    }));
    const r = await sendTelegramArticle(ART, { db: makeDb() });
    expect(r.ok).toBe(false);
    expect(r.errorCode).toBe('PARSE');
    expect(r.retryable).toBe(false);
  });

  it('timeout → retryable, 1 reintento automático y éxito', async () => {
    let calls = 0;
    fetchSpy.mockImplementation(async () => {
      calls++;
      if (calls === 1) { const e: any = new Error('timed out'); e.name = 'TimeoutError'; throw e; }
      return { ok: true, status: 200, json: async () => ({ ok: true, result: { message_id: 42 } }) };
    });
    const r = await sendTelegramArticle(ART, { db: makeDb() });
    expect(r.ok).toBe(true);
    expect(calls).toBe(2);
  });

  it('429 → retryable; si el retry también falla, ok=false', async () => {
    fetchSpy.mockImplementation(async () => ({
      ok: true, status: 429,
      json: async () => ({ ok: false, description: 'Too Many Requests' }),
    }));
    const r = await sendTelegramArticle(ART, { db: makeDb() });
    expect(r.ok).toBe(false);
    expect(r.retryable).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2); // 1 + 1 retry
  });

  it('Unauthorized → nonRetryable, sin retry', async () => {
    fetchSpy.mockImplementation(async () => ({
      ok: true, status: 401,
      json: async () => ({ ok: false, description: 'Unauthorized' }),
    }));
    const r = await sendTelegramArticle(ART, { db: makeDb() });
    expect(r.errorCode).toBe('UNAUTHORIZED');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('imagen falla por URL → fallback a sendMessage', async () => {
    let calls = 0;
    fetchSpy.mockImplementation(async (u: any) => {
      calls++;
      if (String(u).includes('sendPhoto')) {
        return { ok: true, status: 400, json: async () => ({ ok: false, description: 'failed to get HTTP URL content' }) };
      }
      return { ok: true, status: 200, json: async () => ({ ok: true, result: { message_id: 9 } }) };
    });
    const r = await sendTelegramArticle(ART, { db: makeDb() });
    expect(r.ok).toBe(true);
    expect(calls).toBe(2);
  });

  it('idempotencia: segunda ejecución del mismo slug → skipped, sin fetch', async () => {
    const db = makeDb();
    const r1 = await sendTelegramArticle(ART, { db });
    expect(r1.ok).toBe(true);
    const n = fetchSpy.mock.calls.length;
    const r2 = await sendTelegramArticle(ART, { db });
    expect(r2.ok).toBe(true);
    expect(r2.skipped).toBe(true);
    expect(r2.reason).toBe('already_sent');
    expect(fetchSpy.mock.calls.length).toBe(n);
  });

  it('concurrencia: dos ejecuciones simultáneas → solo un envío', async () => {
    const db = makeDb();
    // Serializa el claim: el segundo create() falla con ALREADY_EXISTS
    const [a, b] = await Promise.all([
      sendTelegramArticle(ART, { db }),
      sendTelegramArticle(ART, { db }),
    ]);
    const enviados = [a, b].filter(r => r.ok && !r.skipped).length;
    const omitidos = [a, b].filter(r => r.skipped).length;
    expect(enviados + omitidos).toBe(2);
    expect(enviados).toBe(1); // exactamente un envío real
  });

  it('retry forzado tras fallo definitivo funciona (forceRetry)', async () => {
    const db = makeDb({ [`telegram_${ART.slug}`]: { status: 'failed', slug: ART.slug, channel: 'telegram' } });
    const r = await sendTelegramArticle(ART, { db, forceRetry: true });
    expect(r.ok).toBe(true);
    expect(db._store[`telegram_${ART.slug}`].status).toBe('sent');
  });

  it('sin forceRetry un claim failed queda como busy (no reenvía solo)', async () => {
    const db = makeDb({ [`telegram_${ART.slug}`]: { status: 'failed' } });
    const r = await sendTelegramArticle(ART, { db });
    expect(r.skipped).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('Facebook/WhatsApp — copy determinista', () => {
  const base = {
    slug: 'test-slug',
    titulo: 'Título de prueba del artículo',
    resumen: 'Resumen editorial del artículo con datos verificables.',
    contenido: '<p>Cuerpo.</p>',
  };

  it('genera copy por categoría sin IA', () => {
    for (const categoria of ['Sucesos', 'Nacionales', 'Deportes', 'Internacionales', 'Espectáculos', 'Tecnología', 'General']) {
      const r = generateSocialCopy({ ...base, categoria });
      expect(r.facebook.text.length).toBeGreaterThan(30);
      expect(r.facebook.text).toContain(base.titulo.split(' ')[0]);
      expect(r.facebook.link).toContain('utm_source=facebook');
      expect(r.whatsapp.text).toContain('*Título de prueba');
      expect(r.whatsapp.link).toContain('utm_source=whatsapp');
    }
  });

  it('mismo artículo → mismo copy (determinista, sin aleatoriedad)', () => {
    const a = generateSocialCopy({ ...base, categoria: 'Sucesos' });
    const b = generateSocialCopy({ ...base, categoria: 'Sucesos' });
    expect(a.facebook.text).toBe(b.facebook.text);
  });

  it('artículos distintos pueden usar plantillas distintas', () => {
    const variantes = new Set(
      [
        'medicina-legal-dictamen-ticuantepe',
        'terremoto-japon-71-muertos',
        'camiones-bomberos-inversion',
        'campo-girasoles-catarina-precios',
        'deportacion-panama-nicaraguenses',
        'festival-cultural-leon-agosto',
        'seleccion-sub20-clasificacion',
        'google-funcion-ia-android',
      ].map(s =>
        generateSocialCopy({ ...base, slug: s, categoria: 'General' }).facebook.text,
      ),
    );
    expect(variantes.size).toBeGreaterThan(1); // rotación de plantillas
  });

  it('artículo sin resumen no queda inutilizable ni inventa datos', () => {
    const r = generateSocialCopy({
      slug: 'x', titulo: 'Solo título disponible', contenido: '<p>Único párrafo del cuerpo con suficiente texto para usar.</p>', categoria: 'Nacionales',
    });
    expect(r.facebook.text).toContain('Solo título');
    expect(r.facebook.text).not.toContain('undefined');
    expect(r.whatsapp.text).not.toContain('null');
  });

  it('UTM correcta y sin doble "?"', () => {
    const u = buildArticleUrl('mi-slug', 'facebook');
    expect(u).toBe('https://nicaraguainformate.com/noticias/mi-slug?utm_source=facebook&utm_medium=social');
    expect((u.match(/\?/g) || []).length).toBe(1);
  });

  it('pregunta de engagement solo cuando se pide y nunca en Sucesos', () => {
    const con = generateSocialCopy({ ...base, categoria: 'Deportes' }, { includeQuestion: true });
    expect(con.facebook.text).toMatch(/¿/);
    const sin = generateSocialCopy({ ...base, categoria: 'Sucesos' }, { includeQuestion: true });
    expect(sin.facebook.text).not.toMatch(/¿Qué opinás|¿Ya conocías|¿Qué te parece/);
  });
});
