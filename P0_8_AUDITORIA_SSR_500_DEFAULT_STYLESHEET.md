# P0-8 — Auditoría forense: HTTP 500 `ENOENT: /var/task/browser/default-stylesheet.css`

## Estado

**CERRADA — CAUSA CONFIRMADA + FIX YA DESPLEGADO + DEPENDENCIA CAUSANTE ELIMINADA**

El defecto era real, ya estaba corregido en el código desplegado (deploy actual = HEAD `ef0e3068`) y **ya no ocurre en producción**. El cambio local de esta auditoría elimina la dependencia causante que había quedado muerta en `package.json`, cerrando el vector de reintroducción.

## Causa raíz

`lib/sanitize.ts` importaba `isomorphic-dompurify@3.19.0`, que trae su propio `jsdom@29.1.1` anidado (`node_modules/isomorphic-dompurify/node_modules/jsdom`). En jsdom 29, `lib/jsdom/living/helpers/style-rules.js` ejecuta al cargar el módulo:

```js
const defaultStyleSheet = require("../../browser/default-stylesheet");
```

y en esa versión `browser/` contiene únicamente `default-stylesheet.css` leído vía `fs` (jsdom 24 — la copia top-level usada por vitest — sí trae `default-stylesheet.js` con el CSS inline, por eso nunca fallaba en tests). Al ser empaquetado por webpack en `.next/server/chunks/*.js`, la ruta relativa resolvía a `/var/task/browser/default-stylesheet.css`, archivo que el output tracing no incluye → `ENOENT` en la carga del módulo → crash en SSR → **HTTP 500** en toda ruta que importara `sanitize` (páginas de artículo y rutas admin que sanitizan).

## Evidencia

- Runtime logs Vercel (deploy jul-26): `ENOENT ... /var/task/browser/default-stylesheet.css` con source `edge-middleware` y `serverless`, paths `/noticias/*`, status 500.
- `node_modules/isomorphic-dompurify/node_modules/jsdom/lib/jsdom/living/helpers/style-rules.js:4` — require del recurso.
- `ls node_modules/isomorphic-dompurify/node_modules/jsdom/lib/jsdom/browser/` → solo `default-stylesheet.css` (sin wrapper `.js`).
- Historial del fix (ya en el repo):
  - `97c424df` (26-jul 07:32) "quita jsdom del SSR — sanitizer regex propio".
  - `111277ea` (11-ago 17:03) reintrodujo dompurify con lazy `require()` (mitigación parcial).
  - `586aaa10` (11-ago 20:45) eliminó `getDOMPurify`/`require` por completo → sanitizador whitelist actual.
- `lib/sanitize.ts:61-63` documenta la sustitución; ningún archivo fuente importa dompurify/jsdom hoy (solo comentarios + `tests/admin-panel-list.test.ts` vía entorno vitest).
- Build local `.next/server`: ningún chunk contiene código jsdom; las únicas coincidencias de "dompurify"/"jsdom" son `package.json` embebido como string. `page.js.nft.json` de `/noticias/[slug]` no lista módulos jsdom.
- Runtime logs del deploy actual `dpl_B6AHceM37fhjGmPzDwyKn3iXdpeu` (= HEAD): ~50 requests inspeccionadas, **todas 200**, cero ENOENT; incluye `GET /noticias/*` con `x-vercel-cache: MISS` (SSR real, no cache).
- `curl` producción (5 slugs, UA normal y Googlebot): **200** en todos.

## Impacto

- **Histórico**: 500 en `GET /noticias/<slug>` (lectores, Googlebot, crawlers sociales) y en rutas admin que sanitizaban — hasta el deploy del fix (ago-2026).
- **Actual**: ninguno. El error no se reproduce en el deployment vigente.

## Corrección (esta auditoría)

- `package.json` / `package-lock.json`: eliminadas `isomorphic-dompurify@3.19.0` (dependencia muerta que arrastraba `jsdom@29.1.1`) y `@types/dompurify`. `jsdom@24.1.3` se conserva porque lo usa `vitest` (`vitest.config.ts: environment: 'jsdom'`).

## Validación

- `npm ci`: lockfile coherente, install limpio (922 paquetes).
- `npm ls`: `isomorphic-dompurify`/`@types/dompurify` eliminados; `jsdom@24.1.3` se conserva para vitest (`environment: 'jsdom'`).
- `npx tsc --noEmit`: 0 errores.
- `npm run build`: exit 0, 103/103 páginas; `.next/server` sin código jsdom.
- Suite completa: 1374/1402 verdes; 26 fallos en 7 archivos **preexistentes y ajenos** a P0-8 (`swiss-watch`/AdSense, `nios-intelligence`, `nios-command-center`, `meni-premerge-review`, `homepage-freshness` — fixtures de lógica editorial/fechas; ninguno importa dompurify/jsdom y ninguno puede verse afectado por remover deps no importadas).
- SSR real en producción post-deploy: `/`, 3 noticias y `/categoria/sucesos` → **200**; runtime logs del nuevo deployment: 50 requests, **0 5xx, 0 ENOENT**.

## SEO

Verificado en `/noticias/muere-piero-autor-de-mi-viejo-a-los-81-anos` (prod): `<title>`, meta description, canonical, OG (`og:title/description/image/url/type/site_name/locale`), Twitter card, `application/ld+json` — todos presentes.

## Producción

- Deploy: **SÍ** — commit `f496c81b` → push `63b1af54..f496c81b` → deployment `dpl_CugcRUGCBkb97uRUPNxHX2PUPf4b` (`informate-nicaragua-nextjs-bsstpv2m8-…vercel.app`), **READY**, production, alias `nicaraguainformate.com`.
- Producción verificada: SÍ — 200 en portada/noticias/categoría, SEO intacto (title, description, canonical, OG, JSON-LD), cero ENOENT en logs.
- Alcance honesto: este commit es limpieza de dependencias; el 500 ya estaba corregido en código desde `97c424df`/`586aaa10` (ago-2026).
