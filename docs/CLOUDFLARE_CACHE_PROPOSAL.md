# Propuesta Cloudflare — caché de HTML para crawlers (SIN aplicar aún)

**Estado**: propuesta para revisión. NO aplicar en producción sin autorización
y sin verificar primero las reglas actuales en el dashboard.

## Contexto medido

- Las lecturas de Firestore solo ocurren en regeneraciones ISR
  (`metrics_daily`: ~388 regens, ~22K docs el 23-nov).
- Cada request que llega a Vercel puede disparar una regeneración si el TTL
  expiró. Crawlers (Googlebot, Bingbot, Facebook, WhatsApp) generan la
  mayoría de requests sin ejecutar JS — invisibles en `traffic_log`.
- Cachear HTML en el edge de Cloudflare reduce las llegadas a Vercel →
  menos eventos de regeneración → menos lecturas Firestore, **sin tocar
  SEO**: el HTML servido es idéntico al de origen.

## Reglas actuales — PENDIENTE DE VERIFICACIÓN MANUAL

Antes de proponer cambios hay que revisar en Cloudflare Dashboard:
`Rules → Cache Rules` y `Configuration Rules`:

- ¿Existe "Cache Everything" o Page Rules con `Cache Level: Cache Everything`?
- ¿Bypass por cookies (`__cf_bm`, sesión admin) o por `Authorization`?
- ¿Edge TTL / Browser TTL configurados?
- ¿Hay Workers o Transform Rules que afecten la caché?

## Propuesta de Cache Rule (borrador)

**Nombre**: `html-public-cache-5m`

**When incoming requests match** (todas):
- Hostname equals `nicaraguainformate.com` (y `www.` si aplica)
- URI Path starts with cualquiera de:
  `/noticias/`, `/categoria/`, `/tema/`, `/entidad/`, `/autor/`,
  `/guia/`, `/feed`, `/rss`, `/sitemap`, `/news-sitemap`
- **AND** Cookie does not contain `admin_token` / `session` (nombre real
  de la cookie de sesión — verificar en `lib/auth.ts`)
- **AND** Authorization header does not exist

**Then**:
- Cache eligibility: Eligible for cache
- Edge TTL: respect origin, máximo 300s (o "Ignore origin TTL" + 300s)
- Browser TTL: respect origin
- Cache key: incluir `Cookie` NO; query strings solo si la ruta los usa
  (`/buscar` queda EXCLUIDA explícitamente por tener `?q=`)

**Exclusiones obligatorias** (nunca cachear en edge):
- `/admin`, `/panel`, `/login`, `/api/`, `/buscar`
- Cualquier respuesta con `Set-Cookie` o status ≠ 200
- Rutas con `noindex` dinámico por artículo — el HTML cacheado es el mismo
  para todos, no hay problema: el meta robots va dentro del HTML.

## Compatibilidad SEO — análisis

| Riesgo | Evaluación |
|---|---|
| Frescura de noticias | Edge TTL ≤300s = máximo 5 min de atraso; el origen ISR ya sirve hasta 5 min (revalidate=300). Equivalente. |
| Googlebot | Recibe HTML idéntico; Google rastrea y renderiza igual. Sin cloaking: la caché no cambia contenido por User-Agent. |
| Publicación nueva | `revalidateTag('noticias')` invalida Vercel pero NO Cloudflare → la noticia puede tardar hasta edge TTL en aparecer en edge. Aceptable si TTL=300s; si se requiere instantáneo, añadir Cache Rule de bypass para requests con header `x-purge` o llamar la API de purge de Cloudflare desde el pipeline de publicación (requiere token — decisión posterior). |
| AdSense | Sin impacto: mismo HTML, mismos slots. |
| Seguridad | Bypass por cookie de admin + Authorization + exclusión /api. El edge no debe cachear respuestas autenticadas. |

## Beneficio esperado (estimación, no medida)

Si el 60-70% de las regeneraciones ISR vienen de crawlers (hipótesis a
confirmar con metrics_daily + Vercel Analytics), reducir la llegada de
requests a Vercel en ~50% podría reducir regeneraciones en proporción
similar → ahorro de lecturas del orden de **miles a decenas de miles de
reads/día**. El ahorro real se medirá comparando `m.regen.*` antes/después.

## Alternativa sin Cloudflare

Subir `revalidate` de 300s a 600-900s en páginas públicas: menos
regeneraciones temporales, mismo contenido indexable, cambios mínimos.
Trade-off: noticias tardan hasta 15 min en aparecer sin revalidateTag —
pero el tag invalida al instante, así que el TTL solo afecta contenido
no-noticioso (vistas, trending). **Candidato más simple y seguro.**

## Pasos para activar (cuando se autorice)

1. Verificar reglas actuales en dashboard (capturas).
2. Crear la Cache Rule en modo "Log" primero si Cloudflare lo permite, o
   aplicar con TTL 300s y monitorear 24h.
3. Revertir = desactivar la regla (un clic, sin deploy).
