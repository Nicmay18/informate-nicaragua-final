# 01 — ARCHITECTURE AUDIT

**Auditor:** CTO + Principal Software Architect
**Fecha:** 2026-08-03
**Proyecto:** Nicaragua Informate — `informate-nicaragua-final` v2.0.0

---

## 1. MAPA DEL SISTEMA

```
nicaraguainformate.com
├── Next.js 15.3.9 (App Router) + React 19 + TypeScript 5
├── Firebase Admin SDK (Firestore mode, no client SDK en SSR)
├── TailwindCSS 3.4 + CSS modules
├── Vercel (iad1) — ISR + Serverless
│
├── app/                    → 182 items (rutas App Router)
│   ├── page.tsx            → Home (ISR 300s)
│   ├── noticias/[slug]/    → Artículo (ISR 300s)
│   ├── categoria/[slug]/   → Categoría (ISR 3600s)
│   ├── api/                → 103 rutas API
│   ├── admin/              → 15 páginas admin
│   ├── feed.xml/           → RSS
│   ├── sitemap.ts          → Sitemap dinámico
│   └── robots.ts           → Robots
├── components/             → 82 componentes React
├── lib/                    → 281 módulos
│   ├── meni/               → 141 módulos (motor editorial)
│   ├── nios/               → 54 módulos (sistema operativo editorial)
│   ├── editorial/          → 33 módulos (motor core V4)
│   ├── seo/                → 4 módulos (schema, meta)
│   ├── db/                 → 2 módulos (homepage, data access)
│   └── firebase-admin.ts   → Singleton Firestore
├── middleware.ts           → CSP, bot blocking, admin auth, redirects
├── firestore.rules         → 152 líneas de reglas de seguridad
├── vercel.json             → Config deployment + cron
└── next.config.ts          → 418 líneas (redirects, headers, images)
```

## 2. HALLAZGOS

### H-ARCH-01: API Routes sin autenticación exponen datos de Firestore
- **Evidencia:** `/api/list-all`, `/api/list-empty`, `/api/check-content`, `/api/auditor`, `/api/auditor-wordcount`, `/api/top-noticias`, `/api/listar-categoria` — todas son GET públicos sin `isAdminRequest` ni verificación de token
- **Archivo:** `app/api/list-all/route.ts:4`, `app/api/auditor/route.ts:55`, `app/api/check-content/route.ts:4`, `app/api/auditor-wordcount/route.ts:34`
- **Impacto:** Cualquiera puede listar todos los artículos, ver contents, auditar scores. No ex datos sensibles pero permite scraping masivo
- **Riesgo:** MEDIO — información de negocio expuesta, posible vector de abuso
- **Prioridad:** P2
- **Solución:** Mover estas rutas a `/api/admin/` o agregar `isAdminRequest` check

### H-ARCH-02: `getNewsByCategory` descarga 500 docs para filtrar en memoria
- **Evidencia:** `lib/data.ts:193` — `fetchNoticiasList([...LIST_FIELDS], MAX_COUNT)` donde `MAX_COUNT=500`, luego `.filter(n => n.categoria === categoria).slice(0, count)`
- **Archivo:** `lib/data.ts:188-206`
- **Impacto:** Cada request de categoría lee 500 documentos de Firestore en lugar de usar query con `where('categoria','==',categoria)`
- **Riesgo:** ALTO — costo Firebase innecesario, latencia elevada
- **Prioridad:** P1
- **Solución:** Usar query Firestore con `where('categoria','==',categoria).orderBy('fecha','desc').limit(count)` + índice compuesto (ya definido en `firestore.indexes.json:11-19`)

### H-ARCH-03: `getMasLeidas` llama a `getNews(100)` que dispara otra query completa
- **Evidencia:** `lib/data.ts:213` — `const noticias = await getNews(100)` dentro de `_cachedGetMasLeidas`
- **Archivo:** `lib/data.ts:209-238`
- **Impacto:** Doble lectura: la cache de `getNews` puede servir, pero si expiró, son 100 docs adicionales
- **Riesgo:** MEDIO — costo duplicado en cache miss
- **Prioridad:** P2
- **Solución:** Reutilizar el resultado de `getLatestNews(100)` del caller

### H-ARCH-04: 67+ rutas API admin, muchas sin validación explícita de auth
- **Evidencia:** El middleware bloquea `/api/admin/*` con token check (`middleware.ts:63-88`), pero rutas como `/api/auditor`, `/api/auditor-wordcount`, `/api/pulir`, `/api/transform` están FUERA de `/api/admin/` y son públicas
- **Archivo:** `middleware.ts:63`, `app/api/auditor/route.ts:55`, `app/api/pulir/route.ts:13`
- **Impacto:** El middleware protege `/api/admin/*` pero no las rutas públicas que acceden a Firestore
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** Mover rutas internas a `/api/admin/` o agregar check de auth

### H-ARCH-05: `pro-design.css` tiene 167KB sin Tailwind purge
- **Evidencia:** `app/pro-design.css` = 167,321 bytes
- **Archivo:** `app/layout.tsx:9` — `import './pro-design.css'`
- **Impacto:** CSS masivo que se envía al cliente sin tree-shaking
- **Riesgo:** MEDIO — performance
- **Prioridad:** P2
- **Solución:** Auditar clases usadas, eliminar muertas, o migrar a Tailwind

### H-ARCH-06: `evergreen.ts` tiene 101KB en un solo archivo
- **Evidencia:** `lib/evergreen.ts` = 101,767 bytes
- **Archivo:** `lib/evergreen.ts`
- **Impacto:** Mantenibilidad — archivo monolítico con contenido evergreen hardcodeado
- **Riesgo:** BAJO
- **Prioridad:** P3
- **Solución:** Migrar a Firestore o archivos JSON separados

### H-ARCH-07: `appx/` directorio aparentemente huérfano
- **Evidencia:** `appx/` contiene 2 items, no referenciado en build
- **Archivo:** `appx/`
- **Impacto:** Código muerto
- **Riesgo:** BAJO
- **Prioridad:** P3
- **Solución:** Eliminar o documentar su propósito

### H-ARCH-08: 80+ archivos .md/.json sueltos en la raíz del proyecto
- **Evidencia:** Directorio raíz contiene ~80 archivos de reportes, auditorías, planes, JSONs de simulación
- **Impacto:** Clutter extremo, confusión para nuevos desarrolladores
- **Riesgo:** BAJO — pero afecta mantenibilidad
- **Prioridad:** P3
- **Solución:** Mover a `docs/history/` o eliminar

### H-ARCH-09: `scripts/` tiene 215 items — posible código muerto
- **Evidencia:** `scripts/` contiene 215 scripts, muchos probablemente one-off
- **Impacto:** Deuda técnica, confusión
- **Riesgo:** BAJO
- **Prioridad:** P3
- **Solución:** Auditar y eliminar scripts one-off

### H-ARCH-10: Arquitectura SSR/ISR correcta
- **Evidencia:** `app/page.tsx:21` — `revalidate = 300`, `app/noticias/[slug]/page.tsx` — ISR, `next.config.ts:304-413` — headers de cache correctos
- **Impacto:** Positivo — ISR bien configurado reduce costos Firebase
- **Riesgo:** N/A
- **Prioridad:** N/A

### H-ARCH-11: `unstable_cache` usado correctamente con tags
- **Evidencia:** `lib/data.ts:177-181` — cache con `tags: ['noticias']` y `revalidate: 300`
- **Impacto:** Positivo — invalidación granular via `revalidateTag('noticias')`
- **Riesgo:** N/A
- **Prioridad:** N/A

## 3. DEPENDENCIAS CIRCULARES

No se detectaron dependencias circulares explícitas. `lib/meni/` importa de `lib/types.ts` y `lib/formateo.ts` que no importan de vuelta. `lib/editorial/` es independiente. `lib/nios/` consume `lib/meni/` pero no al revés.

## 4. MÓDULOS HUÉRFANOS

- `appx/` — sin referencias
- `app/admin/crecimiento/` — redirige a `/admin/nios` (ver `next.config.ts:255`)
- `app/admin/growth/` — redirige a `/admin/nios`
- `app/admin/meni-dashboard/` — redirige a `/admin/nios`
- `app/admin/knowledge-center/` — redirige a `/admin/nios`
- `app/admin/entities/` — redirige a `/admin/nios`
- `scripts/` — 215 scripts, la mayoría one-off

## 5. SCORE DE ARQUITECTURA

| Dimensión | Score | Nota |
|---|---|---|
| Estructura | 7/10 | App Router correcto, pero exceso de archivos raíz |
| Acoplamiento | 8/10 | Buena separación meni/nios/editorial |
| Deuda técnica | 5/10 | 80+ .md raíz, 215 scripts, CSS 167KB |
| Escalabilidad | 7/10 | ISR + cache bueno, pero query de categorías ineficiente |
| Seguridad arquitectónica | 6/10 | Rutas API públicas exponen datos |
| **Total** | **6.6/10** | |
