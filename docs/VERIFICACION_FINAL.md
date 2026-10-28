# VERIFICACIÓN FINAL — comandos y resultados reales

Fecha: **2026-10-27** · Commit auditado: `origin/master = 5fa19c68` · Rama de este documento: `docs/entrega-final`
Entorno: Windows, Node 22.x (portable 22.21.0), git credential store para GitHub API, service account local para Firestore read-only.

## 1. Estado GitHub/producción (2026-10-27)

```bash
git log --oneline -3 origin/master      # 5fa19c68 Merge pull request #9 — nada nuevo desde 11-oct
node .audit/audit-prs.cjs               # lista PRs abiertos + checks + reviews → ver MATRIZ_PR_Y_DEPLOY.md
```

| Endpoint | Resultado |
|---|---|
| `GET /` | 200 |
| `GET /sitemap.xml` `/news-sitemap.xml` `/robots.txt` `/feed.xml` `/ads.txt` | 200 |
| `GET /negocios` `/admin/negocios` | 404 (PR #15 no desplegado) |
| `GET /api/admin/negocios` | 401 (middleware rechaza antes del 404) |
| HTML inicial contiene `google-adsense-account` | **no** (pendiente PR #13) |
| ads.txt | `google.com, pub-4115203339551838, DIRECT` (declaración ≠ aprobación) |

## 2. NIOS — medición real Firestore (2026-10-28 01:16 UTC)

Script: `node .audit/nios-cola-real.cjs` → `.audit/nios-cola-real.json` (read-only).

```
pending 315 | retry 2 | running 0 | completed 47 | dead-letter 3 | total 367
pendientes por tipo: watchdog 210, daily-report 36, health-check 36,
  article-pipeline 25, operational-repair 9, monetization-check 1
más antiguo: 2026-09-22 · más nuevo: 2026-10-28T01:04 (sigue creciendo)
último completedAt real: 2026-09-22
```

- Heartbeats (`depto_heartbeat`): crons ejecutándose a diario; `scheduler` reporta `"Enqueued 3, processed 0, workDone24h 0"` — encola sin procesar.
- `scheduledFor` es **string ISO** (no Timestamp): queries con `where('scheduledFor','<',now)` fallan por tipo/índice; PR #11 filtra en memoria — diseño correcto verificado.
- `depto_incidents` no existe; alertas en `nios_alerts` (159 docs, sin `status` en muestra).

## 3. Suite de tests (registrada en sesiones previas — reproducible)

Los comandos son los del manual `OPERACION_SIN_DEVIN.md` §3. Última ejecución registrada (rama `feat/negocios-mvp`, Node 22.21.0):

| Check | Resultado |
|---|---|
| `tsc --noEmit` | ✅ 0 errores |
| `eslint --max-warnings 0` | ✅ 0 warnings |
| `npx vitest run` | ✅ 120 archivos / 1537 tests / 2 skipped |
| `next build` | ✅ (warnings Sentry no fatales) |
| `playwright -c playwright.negocios.config.ts` | ✅ 4/4 (fixture en memoria, retries 0) |
| `npm run test:e2e` (general, con fixture) | ❌ 13 pass / 17 fail / 5 skip — fallos en `homepage.spec.ts`: selector `#content` obsoleto (el real es `#main-content`), nav oculto en móvil, entorno sin artículos. **Corregido en esta rama**: selector actualizado, hamburger test real, skip honesto sin datos. El workflow de CI corre este paso con `continue-on-error: true` — su verde no certifica nada. |

## 4. Advertencias y limitaciones de esta verificación

- **Sin acceso a Search Console** en esta sesión → impresiones/clics/CTR se verifican manual (manual §7).
- **gitleaks no instalado** → pre-commit omite scan de secretos.
- El doble de Firestore en memoria no reproduce índices ni contención real — la validación de concurrencia del claim es por diseño de query + tests, no por carga real.
- No se ejecutó `npm audit` en esta sesión; la tabla de advisories proviene del análisis previo (5 advisories, todos requieren majors).
- E2E general completo no se re-corrió tras el fix de `homepage.spec.ts` en esta rama (requiere build + browsers; el cambio está verificado contra el HTML real de producción).

## 5. Cómo repetir la verificación completa

```bash
npm ci && npm run type-check && npm run lint
npx vitest run                              # suite completa
npm run build                               # build producción
NEGOCIOS_TEST_FIXTURE=1 NODE_OPTIONS="--require ./tests/fixtures/negocios-server.cjs" npx next build
npx playwright test -c playwright.negocios.config.ts   # E2E comercial aislado
node .audit/nios-cola-real.cjs              # cola NIOS (read-only)
node .audit/audit-prs.cjs                   # estado PRs
```
