# Análisis — 171.37 GiB de transferencia Firestore (US$19.36 en 19 días)

## Qué mide este SKU

"Cloud Firestore Internet Data Transfer Out" = **bytes que Firestore envía a la aplicación** (Vercel/serverless), NO bytes que el sitio envía a visitantes (eso lo factura Vercel). Cada documento leído viaja completo por la red aunque la app solo use 3 campos.

## Causa raíz

`contenido` (~90% del peso de cada doc, ~9–10 KB de HTML) viajaba en **todas** las consultas de listado:

| Consulta (antes) | Docs/viaje | Bytes/viaje |
|---|---|---|
| getNews pool (~500–750 docs) | ~750 | ~7.5 MB |
| 12× categorías + relacionadas + trending + masLeidas | ~1,500–3,000 | ~15–30 MB |
| **Total por regeneración de caches** | | **~25–80 MB** |

A ~1,000–1,500 regeneraciones/día → **~9 GiB/día ≈ 171 GiB/19 días**. Cuadra exacto con la factura.

## Correcciones (`606c887d`)

- `LIST_FIELDS` sin `contenido` → cada doc de listado pasa de ~10 KB a ~1–1.5 KB (**−85–90% bytes**).
- `getAllSlugs`, `/api/list-all`, sitemap: proyecciones sin `contenido`.
- `palabras` (campo ligero) sustituye al guard de renderabilidad.
- Detalle de artículo sigue descargando `contenido` completo — **necesario y correcto** (la página lo renderiza).
- Feeds RSS/JSON incluyen `contenido` — **necesario** (`content:encoded` para lectores/Google News); cache 24 h, 50 docs ≈ 500 KB/regeneración — despreciable.

## Lo que NO es Firestore egress (importante)

- HTML de páginas hacia usuarios/crawlers → lo factura **Vercel**, no Firestore.
- Imágenes → CDN/Vercel.
- Los US$15 adicionales sin identificar probablemente incluyan este tráfico de Vercel — ver `AUDITORIA_COSTOS_VERCEL.md` y `HISTORIAL_COSTOS_90_DIAS.md`.

## Estado de la medición

La reducción está **implementada y testeada** pero el ahorro real solo se confirma con la próxima factura. Proxy de verificación diaria: `cost_daily/{fecha}` (nuevo, vía traffic-cleanup) registra volumen de colecciones; la regeneración de caches se observa indirectamente por egress en billing.
