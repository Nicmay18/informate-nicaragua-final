# CURRENT_SYSTEM_TRUTH — Nicaragua Informate / NIOS / MENI

> Fuente única de verdad del sistema. Todo aquí fue verificado contra código real.
> **verifiedAgainst:** commit `5060e699` · branch `master` · 2026-09-25

## Producción

- Next.js (App Router) desplegado en Vercel → `https://nicaraguainformate.com`
- Firestore: colección `noticias` (476 docs: 443 publicado / 33 archivado — verificado 2026-09-24)
- GA4 real (`525672447`), GSC real (`sc-domain:nicaraguainformate.com`)

## Flujo de publicación (verificado en código)

```
editor/API → guardarConMeni() → runMeniAsync() → MENI score → supervisor (decisión canónica)
→ Firestore (updateData solo desde meni.*) → revalidación
```

- `guardarConMeni` (`lib/editorial/guardar-con-meni.ts`) es el **único escritor canónico**.
- Callers verificados fail-closed: `guardar-directo`, `admin/news` (POST/PUT), `api/articles` → 400 si `!meniOk` o `!supervisorApproved`.
- Flujo autónomo `generarArticuloAutonomo` (`lib/meni/editor-autonomo/engine.ts`): Editorial Brain decide → Groq redacta → Quality Gate POST → **Quote Guard** → verificación → `runMeni` final. Fallas: LLM error → throw; QG bloquea → `aprobado=false`; runMeni falla → `aprobado=false`; quote-guard falla → `aprobado=false` + `riesgo ROJO`.
- **Decisión final inmutable**: `computePublicationAllowed` (`editor-autonomo/decision.ts`) exige `decision.publicar AND !qualityGate.bloqueado AND quoteGuard.ok` — ninguna etapa posterior puede reabrir un bloqueo. Tests: `tests/publication-gate.test.ts`.

## Integridad factual (anti-fabricación)

- `lib/editorial/quote-guard.ts` — cita textual o atribución que no existe en la fuente → bloquea publicación (aprobado=false, ROJO). Tolera HTML/espacios/diacríticos/comillas. Tests: `tests/quote-guard.test.ts` (10 casos).
- Prompt del LLM ya NO dice "autoridades no proporcionaron detalles" → regla: omitir o "la información disponible no lo precisa".
- `autoFix.ts` solo hace correcciones mecánicas (terminología, filler, sensacionalismo→neutralizar, dedup, whitespace). No toca hechos.

## Learning Engine (gobernado)

- Lifecycle: `OBSERVED→CANDIDATE→VALIDATING→APPROVED→ACTIVE→ROLLED_BACK` en `lifecycle.ts`, transiciones solo vía `POST /api/admin/meni-learning` (admin).
- `runLearningCycle` ya NO auto-persiste `active_adjustments` (auto-activación eliminada, commit `702d3540`). Sugerencias quedan en el ciclo para revisión.
- Consumo de ajustes en scoring solo si `ENABLE_MENI_LEARNING==='true'` (env, off por defecto) — `core.ts:450`.

## NIOS / Firestore

- Snapshots: `nios_daily_snapshots/{date}` + subcolecciones `articles`/`reports`. Articles en **chunks de 450** por batch (commit `73785eca`). Tests 501/1000 artículos: `tests/nios-batch-scaling.test.ts`.
- Feed (`lib/feed-articles.ts`): query acotada `publicado==true && estado=='publicado'` + límite — ya no lee el corpus completo.
- `loadNoticiasFromFirestore(db, 500)` — limitado pero sigue siendo una sola carga.

## Seguridad

- Middleware: `/api/admin/*` exige `x-admin-token`/`x-admin-key` o `x-cron-secret` (timing-safe). Públicas: `session`, `estado`, `config`, `repair-fechas` (esta última lleva auth propia `verifyAdminOrCleanupToken`).
- `SENSITIVE_API_PATHS` ahora incluye `/api/indexnow` y `/api/nios/*` (commit `dbab83a1`).
- `list-all` solo devuelve `estado=='publicado'` (commit `dbab83a1`).
- Crons: todos `verifyAdminOrCronToken` (Bearer / x-cron-secret / `?secret=` legacy).
- **Sesión admin por cookie HttpOnly** (commit `990ab5f9`): `/api/admin/session` verifica Firebase ID token + `ADMIN_EMAILS` y fija `admin_session` HttpOnly/SameSite=Strict/Secure. La `ADMIN_API_KEY` ya NO viaja al JS del navegador ni a `localStorage`; el middleware acepta la cookie además de los headers.

## Datos públicos (confiabilidad)

- `lib/pagination.ts` + `resolvePage`: política única de paginación — `page` decimal o `> totalPages` → `notFound()` (404 real, no soft-404); corpus vacío solo permite página 1. Ya no hay cap de 300 docs en `fetchPublishedDocs`. El `notFound()` corre también en `generateMetadata` para que el status 404 comprometa antes del streaming (verificado en prod: `/noticias?page=9999` → 404). Tests: `tests/pagination.test.ts` (13 casos).
- **ERROR ≠ EMPTY** (`lib/data.ts`): `safeGet` contabiliza fallos; si TODAS las sub-queries fallan lanza `FirestoreOutageError` que propaga por encima de los catches genéricos — un apagón de Firestore ya no se renderiza como "no hay noticias". Tests: `tests/p1-dates-errors.test.ts`.
- `entity-page` (`kb_entities`): no llama `db.getAll()` con array vacío. Tests: `tests/entity-page.test.ts`.

## SEO / renderizado

- `safeIsoDate` (`lib/seo/schema.ts`, `JsonLdSchema.tsx`) ya NO fabrica "ahora" — fecha inválida/ausente omite `datePublished`/`dateModified` del JSON-LD.
- `lib/nonce.ts` dejó de llamar `headers()` — el CSP actual no usa nonce y el `headers()` forzaba render dinámico en todo el árbol. Si el CSP adopta `'nonce-…'`/'strict-dynamic' hay que reactivar la propagación junto con la política.
- `firestore.rules`: `noticias` `allow get, list: if true` — la API key web de Firebase es pública por diseño; cualquiera puede leer los campos internos (`scoreMeni`, `diagnosticoMeni`) vía SDK cliente. Mitigación real = mover metadata editorial a colección privada. **P2 deuda**, no bloquea operación.

## Deuda técnica real (P1/P2, no bloqueante)

- `admin/news` fetchAdminDocs carga todo `noticias` en memoria (fecha tipo mixto impide orderBy). Paginación con cursor pendiente — a 5K notas reventará. **P1**.
- `.get()` completo en `stats`, `dashboard-calidad`, `auditor-dashboard`, `enrich-links`, `enrich-strong`, `limpiar-noindex`, `repair-fechas`, `metrics-collector`. **P2**.
- `public/validador.html` — herramienta forense pública que lee `noticias` con el SDK web. Dependiente de la regla `list: if true`; moverla fuera de `public/` o protegerla cuando se cierre la regla. **P2**.
- `?secret=` query-string en crons (legacy, funciona pero el secreto queda en URLs/logs) — migrar a `x-cron-secret` header. **P2**.
- SEO conocido sin aplicar: redirect-loop `/noticia.html?slug=` — patch en `.audit/patch-seo-redirects.cjs` (aplicar como tarea SEO separada). El soft-404 `?page=99` ya está corregido.
- `runLearningCycle` sin caller en producción (dormido).
- `/panel/nios/performance` ahora `force-dynamic` con acceso defensivo a telemetría (commit `5060e699`) — era lo que rompía los builds de Vercel (`undefined.reads` en prerender).
