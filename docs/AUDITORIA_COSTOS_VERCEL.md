# Auditoría de Costos Vercel — Nicaragua Informate

## Limitación

Sin acceso al dashboard de Vercel no puedo ver invocaciones, duración, ni transferencia facturada. Lo que sigue es la **auditoría del código** que determina el consumo + lo que el propietario debe verificar.

## Hallazgos del código

### Funciones y duración

- `maxDuration = 60` en todas las rutas cron (límite real del plan Hobby) — correcto, ninguna excede.
- Server actions y APIs admin con `maxDuration` 15–60 s — acotados.
- `removeConsole: true` en producción — reduce CPU de logging.

### ISR y regeneraciones (driver de Vercel Function invocations)

| Ruta | revalidate | Impacto en funciones |
|---|---|---|
| `/` portada | 60→**300 s** (corregido) | Antes: regeneración frecuente = invocaciones |
| `/noticias`, artículo | 300 s | Cada slug = función serverless por regeneración |
| Categorías | 3600 s | Bajo |
| Sitemap/feed | 3600 s / 86400 s | Mínimo |

**Punto clave**: ISR sirve desde caché edge; las funciones solo corren en regeneración o miss. Con ~730 artículos y crawlers, las regeneraciones de artículos son el mayor consumidor de Function Duration — cada una ejecuta `getNewsBySlug` (1 doc) + `getRelatedNews` + métricas. Ya optimizado: detalle = 1–2 docs, sin `contenido` extra.

### Middleware

Corre en Edge en cada request — costo por request pero liviano (solo path matching + headers). Sin Firestore. Los cambios recientes (`private, no-cache` en rutas admin) no agregan costo.

### Build

`npm run build` por deploy. Los merges a master disparan build + deploy — normal. `optimizePackageImports` activo para lucide/date-fns/firebase.

### Imágenes

`loader: 'custom'` (`lib/image-loader.ts`) con `minimumCacheTTL: 86400` — las imágenes se sirven vía loader externo (weserv/jsdelivr), no `_next/image` intensivo. Revisar si el loader custom bypasea Image Optimization facturable — si las imágenes se sirven directo, Vercel no cobra optimization.

## Los US$15 adicionales — hipótesis ordenadas

1. **Vercel Pro US$20/mes** (si el proyecto está en Pro, no Hobby — los crons Hobby de 60s y el comentario "este proyecto NO tiene Fluid compute" sugieren Hobby, pero verificar).
2. **Vercel usage overage**: Function invocations/duration, Fast Data Transfer (egress del sitio — los crawlers descargan HTML completo de cada artículo), ISR Writes.
3. **Cloud Logging** en GCP (retención >30 días o export).
4. **Firebase Storage** si las imágenes se guardan ahí.
5. Cargo de otro servicio GCP en la misma facturación.

## Acciones del propietario

1. Vercel Dashboard → proyecto `informate-nicaragua-nextjs` → **Usage**: anotar Function Invocations, Duration, Data Transfer, ISR reads/writes del ciclo 1–19 nov.
2. **Settings → Billing**: confirmar plan (Hobby gratis vs Pro US$20).
3. GCP Billing → agrupar por SKU los US$15 restantes.

## Controles ya activos en código

- TTLs ISR más largos → menos regeneraciones → menos invocaciones.
- `contenido` fuera de listados → menos bytes por invocación.
- `cost_daily` snapshot diario → trending de volumen Firestore.
- `config/cost_guard` → puede desactivar crons pesados sin deploy.
