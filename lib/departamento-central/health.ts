import { openIncident, resolveIncident } from './incidents';
import { recordLearning } from './learning';
import type { SiteHealthCheck } from './types';

export const SITE_ROOT = 'https://nicaraguainformate.com';
export const TIMEOUT_MS = 20000;

export async function checkUrl(path: string): Promise<SiteHealthCheck> {
  const url = `${SITE_ROOT}${path}`;
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    return {
      url,
      status: res.status,
      ok: res.status >= 200 && res.status < 400,
      responseMs: Date.now() - started,
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      url,
      status: 0,
      ok: false,
      responseMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function handleSiteHealth(root: SiteHealthCheck, noticias: SiteHealthCheck): Promise<{
  status: 'ok' | 'warning' | 'critical';
  items: string[];
}> {
  const now = new Date().toISOString();
  const status: 'ok' | 'warning' | 'critical' =
    root.ok && noticias.ok ? 'ok' : 'critical';
  const items: string[] = [];

  if (!root.ok) {
    const title = `Disponibilidad de la página principal: ${root.status || 'timeout'}`;
    await openIncident({
      type: 'site-availability',
      severity: 'critical',
      title,
      url: root.url,
      status: 'active',
      detectedAt: now,
    });
    items.push(`Página principal responde ${root.status || 'error'}: ${root.error || 'sin respuesta'}`);
  } else {
    const titleRoot = 'Disponibilidad de la página principal';
    await resolveIncident(titleRoot, {
      diagnosis: 'Se detectó una respuesta correcta en la página principal.',
      correction: 'No se requieren correcciones.',
      verification: `Verificación real: HTTP ${root.status} en ${root.responseMs}ms.`,
      learning: 'El sitio responde correctamente.',
    });

    if (root.status === 403) {
      await recordLearning({
        source: 'departamento-central',
        kind: 'learning',
        note: 'Una respuesta 403 generada por un bot puede ser cacheada por el CDN y afectar a todos: reforzar Cache-Control en middleware.',
        tags: ['disponibilidad', 'cdn', 'cache', 'middleware'],
      });
    }
  }

  if (!noticias.ok) {
    const title = `Disponibilidad de /noticias: ${noticias.status || 'timeout'}`;
    await openIncident({
      type: 'site-availability',
      severity: 'critical',
      title,
      url: noticias.url,
      status: 'active',
      detectedAt: now,
    });
    items.push(`Sección /noticias responde ${noticias.status || 'error'}`);
  } else {
    const titleNews = 'Disponibilidad de la sección /noticias';
    await resolveIncident(titleNews, {
      diagnosis: 'La sección de noticias responde correctamente.',
      correction: 'No se requiere acción.',
      verification: `Verificación real: HTTP ${noticias.status} en ${noticias.responseMs}ms.`,
      learning: 'La sección de noticias está disponible.',
    });
  }

  return { status, items };
}
