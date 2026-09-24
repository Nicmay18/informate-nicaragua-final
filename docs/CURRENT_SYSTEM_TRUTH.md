# CURRENT_SYSTEM_TRUTH — Nicaragua Informate / NIOS / MENI

> Fuente única de verdad del sistema. Todo aquí fue verificado contra código real.
> **verifiedAgainst:** commit `1c2c7c58` · branch `master` · 2026-09-24

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

## Deuda técnica real (P1, no bloqueante)

- `admin/news` fetchAdminDocs carga todo `noticias` en memoria (fecha tipo mixto impide orderBy). Paginación con cursor pendiente — a 5K notas reventará.
- `.get()` completo en `stats`, `dashboard-calidad`, `auditor-dashboard`, `enrich-links`, `enrich-strong`, `limpiar-noindex`, `repair-fechas`, `metrics-collector`.
- SEO conocido sin aplicar: redirect-loop `/noticia.html?slug=` y soft-404 `?page=99` — patch en `.audit/patch-seo-redirects.cjs` (aplicar como tarea SEO separada).
- `runLearningCycle` sin caller en producción (dormido).
