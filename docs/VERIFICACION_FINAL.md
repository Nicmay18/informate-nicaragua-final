# VERIFICACIÓN FINAL — comandos y resultados reales

Fecha: **2026-10-28** · Commit verificado: rama `release/cierre-final` (HEAD = merge de #16 sobre los 6 PRs + correcciones de cierre) · `origin/master = 5fa19c68` · producción = `5fa19c68` (Deployments API, 11-oct).
Entorno: Windows, Node **22.21.0** (portable, `engines: 22.x`), git credential store para GitHub API, service account local Firestore read-only.

## 1. Estado GitHub / producción

```bash
node .audit/cierre-status.cjs github   # → .audit/cierre-status.json
```

- `master = 5fa19c68`; deploy Production más reciente = `5fa19c68` (2026-10-11).
- PRs #10–#16: `state: open`, `mergeable_state: blocked`, `reviews: []`, checks requeridos ✅ en cada uno.
- Protección: `enforce_admins: true`, 1 review, `required_conversation_resolution: true`.
- Colaboradores: `Nicmay18` (admin, único). Autor de todos los PRs: `Nicmay18` → **nadie puede aprobarlos**; ver `ENTREGA_FINAL.md` §7.
- #4 `mergeable_state: behind`; #2 sin CI moderno.

## 2. NIOS — medición real (2026-10-28 01:55 UTC, `.audit/nios-cola-real.json`)

```
pending 315 | retry 2 | running 0 | completed 47 | dead-letter 3
pendientes por tipo: watchdog 210, daily-report 36, health-check 36, article-pipeline 25, operational-repair 9, monetization-check 1
P0 255 / P1 36 / P2 26 · más antiguo 2026-09-22 · más nuevo 2026-10-28T01:04 · incidentes activos 56
query 'status in + scheduledFor <' → FAILED_PRECONDITION (índice compuesto ausente) = causa raíz
heartbeat scheduler: "Enqueued 3, processed 0, workDone24h 0" · watchdog: degraded · crons wrapper: healthy a diario
```

`node .audit/nios-cola-real.cjs` — read-only, reproducible.

## 3. Suite sobre la rama integrada (Node 22.21.0)

| Check | Comando | Resultado | Log |
|---|---|---|---|
| Tipos | `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --skipLibCheck` | ver nota abajo* | `.audit/cierre-tsc.log` |
| Lint | `npx eslint . --ext .ts,.tsx --max-warnings 0` | **exit 0** | `.audit/cierre-lint.log` |
| Unit/integración | `npx vitest run` | **126 archivos / 1677 ✅ / 2 skipped / 0 fallos** — ejecutado dos veces: antes y después de `npm audit fix` | `.audit/cierre-unit.log`, `cierre-unit2.log` |
| Build fixture | `NEGOCIOS_TEST_FIXTURE=1 NODE_OPTIONS="--require ./tests/fixtures/negocios-server.cjs --max-old-space-size=4096" next build` | ✅ 103 páginas | `.audit/cierre-build.log` |
| E2E aislado | `npx playwright test -c playwright.negocios.config.ts` | **14/14 ✅** — homepage 5×2 (carga, artículos, detalle, skip-link `#main-content`, nav móvil hamburguesa) + negocios 2×2 (auth + flujo completo). retries 0, sin skips | salida registrada |
| npm audit | `npm audit fix` → `npm audit` | 19 → **16 vulns**; resueltas: @sentry/nextjs critical, node-forge high, qs moderate. Restantes: todos requieren major (vitest/tinypool = devDeps; zod@4; firebase-admin@14; cadena `firebase` es consejo de downgrade — ignorar) | `.audit/cierre-audit.json` |

\* `tsc` sin `NODE_OPTIONS` murió por OOM del heap (exit 134, stack V8) — no es un error de tipos; el re-run con 6 GB se registró en el log. En CI (ubuntu + npm ci limpio) `npx tsc --noEmit --skipLibCheck` corre dentro del job "Lint & TypeScript" como antes.

## 4. Cambios de esta sesión (rama `release/cierre-final`)

| Archivo | Cambio | Por qué |
|---|---|---|
| `tests/e2e/negocios.spec.ts` | cookie `admin_session` = token HMAC firmado (`createHmac` + `ADMIN_SESSION_SECRET` de fixture) | tras #13 la cookie cruda del API key ya no autentica — el test fallaba en el árbol integrado |
| `tests/fixtures/negocios-server.cjs` | `ADMIN_EMAILS` sintético + siembra 1 noticia marcada sintética | allowlist requerida por `verifySessionToken`; habilita E2E de portada sin datos reales |
| `tests/fixtures/negocios-db.ts` | `orderBy`, `>=`/`<=`/`<`/`>`, `empty` | `getNews` ordena y filtra por rango de fecha; sin eso la portada quedaba vacía y los tests se saltaban |
| `tests/e2e/homepage.spec.ts` | assert de navegación por `href`, `header nav` | `page.url().not.toContain('/')` era tautología; `nav` coincidía 3 elementos |
| `playwright.negocios.config.ts` | incluye `homepage.spec.ts`, `forbidOnly` | la suite aislada cubre la superficie pública |
| `.github/workflows/ci.yml` | E2E con fixture como gate real; summary exige `success` en los 4 jobs | `continue-on-error` + `dev` contra prod = verde sin significado |
| `package-lock.json` | `npm audit fix` (3 fixes semver-seguros) | 1 critical + 1 high + 1 moderate resueltos sin tocar `package.json` |

## 5. Limitaciones honestas

- Doble de Firestore en memoria: sin índices, contención ni reintentos reales — la concurrencia del claim se valida por diseño de query + tests, no por carga.
- `gitleaks` no instalado localmente (pre-commit lo omite).
- Sin Search Console API; sin token Vercel para inspección de env vars (deploys vía GitHub Deployments API).
- Vercel link local ausente (`.vercel/repo.json` existe, `project.json` no) — la verificación de deploy se hace por Deployments API.
- PR #17 se abre sin review posible: es el bloqueo humano documentado, no un workaround.

## 6. Repetir todo

```bash
export PATH=/path/to/node22:$PATH       # engines: 22.x
npm ci
NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --skipLibCheck
npx eslint . --ext .ts,.tsx --max-warnings 0
npx vitest run
NEGOCIOS_TEST_FIXTURE=1 NODE_OPTIONS="--require ./tests/fixtures/negocios-server.cjs --max-old-space-size=4096" npx next build
npx playwright test -c playwright.negocios.config.ts
node .audit/nios-cola-real.cjs          # cola NIOS (read-only)
node .audit/cierre-status.cjs github    # estado PRs/protección/deploys
npm audit                               # advisories actuales
```
