# INFORME FORENSE — Nicaragua Informate
## Fecha: 2026-06-19 | Análisis de costos Vercel + Firebase

---

## RESUMEN EJECUTIVO

**Alertas activas:**
- Vercel: 100% Fluid Active CPU (4 horas) consumidas
- Firebase: 90% de budget $5.00 alcanzado

**Causa raíz:** 4 bugs críticos en el código que causaban lecturas masivas de Firestore y regeneraciones constantes de la homepage, sumados a 110+ console.logs que consumían CPU en cada visita.

**Estado:** 5 fixes P0 ya aplicados y deployados. Reducción estimada del 80-90% en lecturas Firestore.

---

## HALLAZGOS P0 — CRÍTICOS (YA ARREGLADOS)

### 1. Race Condition en fetchAllNoticias (lib/db/homepage.ts)
**Problema:** `getLatestNews`, `getTrendingNews`, `getPopularNews` se ejecutaban en paralelo en la homepage. Cada una llamaba `fetchAllNoticias()` que leía 250 documentos de Firestore. Como el cache era de solo 15 segundos, las 3 funciones disparaban 3 lecturas simultáneas = **750 lecturas por visita**.

**Fix aplicado:**
- Cache TTL aumentado de 15s a 5 minutos
- Agregada "promesa compartida": si un fetch está en curso, las demás esperan el mismo resultado
- Limit aumentado a 500 para cubrir más noticias

**Impacto:** ~95% reducción en lecturas duplicadas de la homepage.

### 2. Regeneración de Homepage cada 60 segundos (app/api/view/route.ts)
**Problema:** Cada vez que alguien visitaba una noticia (tráfico de Facebook/Telegram), el endpoint `/api/view` verificaba si pasaron 60 segundos desde la última revalidación. Si sí, regeneraba la homepage. Con tráfico social constante, esto era un loop infinito.

**Fix aplicado:** Cooldown de revalidación aumentado de 60 segundos a 1 hora.

**Impacto:** La homepage solo se revalida 1 vez por hora máximo, en vez de cada minuto.

### 3. Fallback Destructivo en getRelatedNews (lib/data.ts)
**Problema:** Si fallaba el índice compuesto de Firestore (ocurre frecuentemente), el fallback leía **todos los documentos** de la colección (250-500) solo para mostrar 3 noticias relacionadas.

**Fix aplicado:** El fallback ahora usa `getNews(30)` del cache existente. Cero lecturas extra de Firestore.

**Impacto:** Eliminación de hasta 500 lecturas Firestore por visita a noticia individual.

### 4. ISR Homepage cada 5 minutos (app/page.tsx)
**Problema:** La homepage se regeneraba cada 300 segundos, disparando las 3 consultas de nuevo incluso sin visitas.

**Fix aplicado:** ISR aumentado de 300s (5 min) a 3600s (1 hora). Las noticias individuales ya se revalidan vía `revalidateTag` desde el panel al publicar.

**Impacto:** 12x menos regeneraciones automáticas de la homepage.

### 5. 110+ console.logs en rutas críticas
**Problema:** 86 console.log en `app/` + 24 en `lib/`. Cada visita a una noticia ejecutaba `/api/view` con múltiples logs. En Vercel, escribir a stdout consume CPU medible.

**Fix aplicado:**
- Creado `lib/logger.ts` helper que silencia logs en producción (`NODE_ENV=production`)
- Reemplazados 50+ console.log/error en rutas de ALTO TRÁFICO (view, data, homepage, page, sitemap, noticias, view-counter)
- Los errores críticos siguen logueándose; los informativos se silencian en prod

**Impacto:** Reducción de escrituras a stdout en producción.

---

## HALLAZGOS P1 — ALTO

### 6. Archivos Muertos en Raíz (200+ archivos)
**Problema:** Más de 200 scripts `.mjs`, `.js`, `.ts`, JSON, MD, TXT, HTML sueltos en la raíz del proyecto. Son herramientas de auditoría, migraciones, backups, reportes. Se incluyen en cada deploy a Vercel y aumentan el build time.

**Recomendación:** Mover todo a `scripts/` o eliminar. Los backups mantenerlos fuera del repo (local).

### 7. Posibles Dependencias No Usadas
**A revisar:** `@tiptap/*` (editor de texto rico) — si el admin panel usa HTML plano, podría eliminarse. `swiper` — si no hay carruseles activos. `googleapis` — solo para Indexing API que ya no funciona para noticias.

---

## HALLAZGOS P2 — MEDIO

### 8. console.logs restantes en rutas admin
**Archivos:** `app/api/admin/*/route.ts` tienen console.logs pero son de bajo tráfico (solo usados desde el panel). No crítico para costos.

---

## ESTIMACIÓN DE AHORRO

| Métrica | Antes | Después | Reducción |
|---------|-------|---------|-----------|
| Lecturas Firestore por visita homepage | ~750 | ~500 cada 5min | ~95% en repetidas |
| Regeneraciones homepage por hora | ~60+ | ~1 | ~98% |
| Lecturas fallback related | 250-500 | 0 | 100% |
| Logs stdout por visita noticia | 5-10 | 0-1 (errores solo) | ~80% |
| **Estimación total** | **$5/mes agotado** | **<$1/mes** | **~80%** |

---

## PRÓXIMOS PASOS RECOMENDADOS

1. **Verificar en 24-48h:** Firebase Console → Firestore → Usage. Las lecturas deberían bajar drásticamente.
2. **Verificar en Vercel:** Dashboard → Usage → CPU. Debería estabilizarse por debajo del 50%.
3. **Solicitar indexación manual** en Google Search Console cada semana (5-10 URLs).
4. **Limpiar raíz** del proyecto: mover scripts de auditoría a `scripts/backup/`.
5. **Publicar noticias originales diarias** — la única forma de que Google indexe automáticamente.

---

## ARCHIVOS MODIFICADOS EN ESTE FIX

- `lib/db/homepage.ts` — race condition fix, cache 15s→5min
- `app/api/view/route.ts` — cooldown 60s→1hora
- `lib/data.ts` — fallback usa cache, reemplazo logs
- `app/page.tsx` — ISR 300s→3600s
- `lib/logger.ts` — nuevo helper (creado)
- `app/sitemap.ts` — logs silenciados
- `app/noticias/[slug]/page.tsx` — logs silenciados
- `lib/view-counter.ts` — logs silenciados

---

*Informe generado automáticamente tras análisis forense de código.*
