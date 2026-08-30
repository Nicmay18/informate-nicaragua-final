# SEO INTELLIGENCE — NIOS CEO v1

| Campo | Valor |
|-------|-------|
| Estado | OPERATIVO con dependencias externas (P1) |
| Última revisión | 2026-08-30 |

## Módulos

1. `lib/nios/seo/` — análisis SEO, recomendaciones y oportunidades.
2. `lib/nios/google-trust/` — métricas de confianza de Google.
3. `lib/seo.ts` — helpers y generación de metadatos.
4. `app/sitemap.xml/route.ts` y `app/news-sitemap.xml/route.ts` — mapas del sitio.
5. `app/feed.xml/route.ts`, `app/rss.xml/route.ts`, `app/feed.json/route.ts` — feeds.

## Fuentes

- Google Search Console API (`lib/gsc.ts`)
- Google Analytics 4 API (`lib/ga4.ts`)
- Datos propios de Firestore (`lib/data.ts`, `lib/nios/intelligence/data-merger.ts`)

## Métricas

- Impresiones, clics, CTR, posición media.
- Consultas principales y emergentes.
- Cumplimiento AdSense y `EEAT`.

## Limitaciones

- GSC requiere `NIOS_GSC_SITE_URL` y permisos del service account.
- GA4 requiere `NIOS_GA4_PROPERTY_ID`.
- Sin credenciales, el sistema reporta `NO_DATA` y no inventa métricas.

## Verificación

- `npm run type-check` OK.
- `npm run build` OK.
