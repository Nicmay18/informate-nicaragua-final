import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isMonetizablePath, adsAllowed, isAdsenseSafePath } from '@/lib/editorial/adsense-safety';
import { isSensitiveArticle } from '@/lib/editorial-cleanup';
import { hasAnalyticsConsent } from '@/lib/observability/consent';

describe('isMonetizablePath — allowlist de rutas públicas', () => {
  it('permite la portada y superficies editoriales públicas', () => {
    for (const p of ['/', '/noticias', '/noticias/slug-cualquiera', '/categoria/nacionales',
      '/categoria', '/guia/apostillar-documentos-nicaragua-2026', '/util', '/negocios',
      '/publicidad', '/nosotros', '/contacto', '/mapa-del-sitio', '/biblioteca',
      '/centro-confianza', '/newsletter', '/tema/economia', '/autor/fulano', '/autores',
      '/entidad/xyz', '/radio']) {
      expect(isMonetizablePath(p), p).toBe(true);
    }
  });

  it('bloquea rutas privadas, operativas y sin contenido', () => {
    for (const p of ['/admin', '/admin/noticias', '/panel', '/panel/ops', '/login',
      '/api/telemetry/journey', '/api/admin/news', '/buscar', '/buscar?q=x',
      '/feed.xml', '/feed.json', '/rss', '/news-sitemap.xml', '/sitemap.xml',
      '/robots.txt', '/autoridad', '/privacidad', '/cookies', '/terminos',
      '/correcciones', '/metodologia-editorial', '/ruta-inexistente-xyz']) {
      expect(isMonetizablePath(p), p).toBe(false);
    }
  });

  it('el bloqueo tiene precedencia sobre prefijos parecidos', () => {
    // /administracion NO existe pero /admin* sí está bloqueado
    expect(isMonetizablePath('/adminxyz')).toBe(false); // empieza con /admin pero sin /
    // prefijos bloqueados requieren límite de segmento
    expect(isMonetizablePath('/apisomething')).toBe(false); // no está en allowlist
  });

  it('la portada "/" no actúa como comodín universal', () => {
    // Regresión: un prefijo '/' mal implementado monetizaría TODO.
    expect(isMonetizablePath('/privacidad')).toBe(false);
    expect(isMonetizablePath('/cualquier-cosa')).toBe(false);
  });

  it('normaliza mayúsculas y query strings', () => {
    expect(isMonetizablePath('/NOTICIAS/Slug')).toBe(true);
    expect(isMonetizablePath('/admin/news?x=1')).toBe(false);
  });

  it('isAdsenseSafePath es alias compatible', () => {
    expect(isAdsenseSafePath('/')).toBe(true);
    expect(isAdsenseSafePath('/admin')).toBe(false);
  });
});

describe('adsAllowed — decisión final con sensibilidad de contenido', () => {
  it('permite anuncios en rutas monetizables no sensibles', () => {
    expect(adsAllowed('/')).toBe(true);
    expect(adsAllowed('/noticias/deportes-futbol')).toBe(true);
    expect(adsAllowed('/guia/salario-minimo-nicaragua-2026')).toBe(true);
  });

  it('bloquea anuncios en rutas no monetizables aunque no sean sensibles', () => {
    expect(adsAllowed('/admin')).toBe(false);
    expect(adsAllowed('/login')).toBe(false);
  });

  it('bloquea anuncios en cualquier ruta si el artículo es sensible', () => {
    expect(adsAllowed('/noticias/crimen-violento', true)).toBe(false);
    expect(adsAllowed('/', true)).toBe(false);
  });
});

describe('isSensitiveArticle — clasificación por contenido (gate de anuncios)', () => {
  it('detecta contenido sensible aunque la categoría sea neutral', () => {
    // El punto clave: la protección NO depende del nombre de la categoría.
    expect(isSensitiveArticle(
      'Sucesos en León',
      'Un hombre murió tras un accidente.',
      'La víctima mortal fue trasladada al hospital.',
    )).toBe(true);
  });

  it('no marca contenido normal como sensible', () => {
    expect(isSensitiveArticle(
      'Nuevo salario mínimo para 2026',
      'La comisión aprobó un ajuste del 4%.',
      'Los trabajadores recibirán el incremento desde marzo.',
    )).toBe(false);
    expect(isSensitiveArticle(
      'Guía para apostillar documentos',
      'Requisitos y pasos del trámite.',
      'La cita se agenda en línea.',
    )).toBe(false);
  });
});

describe('lib/adsense/loader — carga única y reintento real', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    vi.resetModules();
  });

  it('dos llamadas no duplican el <script>', async () => {
    const { loadAdsenseScript } = await import('@/lib/adsense/loader');
    const p1 = loadAdsenseScript();
    const p2 = loadAdsenseScript();
    expect(p1).toBe(p2); // misma promesa compartida mientras carga
    const scripts = document.head.querySelectorAll('script#ni-adsense-script');
    expect(scripts.length).toBe(1);
    const s = scripts[0] as HTMLScriptElement;
    expect(s.src).toContain('adsbygoogle.js?client=ca-pub-4115203339551838');
    expect(s.async).toBe(true);
    expect(s.crossOrigin).toBe('anonymous');
    // Simular carga exitosa para no dejar promesa colgada.
    s.dispatchEvent(new Event('load'));
    await p1;
  });

  it('tras error, una segunda llamada crea una solicitud NUEVA', async () => {
    const { loadAdsenseScript, adsenseLoadState } = await import('@/lib/adsense/loader');
    const p1 = loadAdsenseScript();
    const s1 = document.head.querySelector('script#ni-adsense-script') as HTMLScriptElement;
    expect(s1).toBeTruthy();
    s1.dispatchEvent(new Event('error'));
    await p1;
    expect(adsenseLoadState()).toBe('failed');
    // La etiqueta rota debe haberse eliminado: si quedara, la siguiente
    // llamada resolvería como si el script hubiera cargado (bug reportado).
    expect(document.head.querySelector('script#ni-adsense-script')).toBeNull();

    const p2 = loadAdsenseScript();
    const s2 = document.head.querySelector('script#ni-adsense-script') as HTMLScriptElement;
    expect(s2).toBeTruthy();
    expect(s2).not.toBe(s1);
    expect(adsenseLoadState()).toBe('loading');
    s2.dispatchEvent(new Event('load'));
    await p2;
    expect(adsenseLoadState()).toBe('loaded');
    // Una vez cargado, llamadas extra no crean más etiquetas.
    await loadAdsenseScript();
    expect(document.head.querySelectorAll('script#ni-adsense-script').length).toBe(1);
  });
});

describe('hasAnalyticsConsent — gate de telemetría', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sin decisión registrada → no consentido (no recopilar)', () => {
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('preferencias con analytics=true → consentido', () => {
    localStorage.setItem('ni_cookie_preferences', JSON.stringify({ analytics: true, ads: false }));
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('preferencias con analytics=false → denegado aunque haya consent legacy', () => {
    localStorage.setItem('cookie_consent_ni', 'accepted');
    localStorage.setItem('ni_cookie_preferences', JSON.stringify({ analytics: false, ads: true }));
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('consent legacy "accepted" sin preferencias → consentido', () => {
    localStorage.setItem('cookie_consent_ni', 'accepted');
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('consent "rejected"/"denied" → denegado', () => {
    localStorage.setItem('ni_cookie_consent', 'rejected');
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('JSON corrupto en preferencias → denegado, sin lanzar', () => {
    localStorage.setItem('ni_cookie_preferences', '{roto');
    expect(hasAnalyticsConsent()).toBe(false);
  });
});
