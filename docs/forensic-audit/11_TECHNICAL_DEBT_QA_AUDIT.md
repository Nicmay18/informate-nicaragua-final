# 11 — TECHNICAL DEBT & QA AUDIT

**Auditor:** Tech Lead + QA Engineer
**Fecha:** 2026-08-03

---

## 1. QA STATUS

### Build & Tests
| Check | Comando | Resultado |
|---|---|---|
| Type-check | `tsc --noEmit` | ✅ Pass (exit 0) |
| Tests | `npx vitest run` | ✅ 125 tests, 12 files, all pass |
| Lint | `eslint . --ext .ts,.tsx --max-warnings 0` | ✅ Pass (exit 0) |
| Full merge | `npm run test:merge` | ✅ Pass |

### Test Coverage
- `tests/meni-calibration.test.ts` — calibración MENI
- `tests/meni-closing.test.ts` — cierre MENI v2.1
- `tests/seo-effective.test.ts` — paridad SEO (10 tests)
- `tests/normalize-keywords.test.ts` — normalización (9 tests)
- `tests/lib/env.test.ts` — env validation (4 tests)
- Command Center integration (4 tests)
- CEO Daily Decision (5 tests)
- Content War Room (2 tests)
- Business Health (2 tests)

### E2E Tests
- `playwright.config.ts` existe (2,071 bytes)
- No hay evidencia de ejecución regular de E2E
- **Riesgo:** MEDIO — sin E2E, no se valida flujo completo

## 2. DEPENDENCIAS

### Versions
| Paquete | Versión | Estado |
|---|---|---|
| next | 15.3.9 | ⚠️ Vulnerabilidades conocidas (ver H-SEC-16) |
| react | 19.0.0 | ✅ |
| firebase | 12.14.0 | ✅ |
| firebase-admin | 12.7.0 | ⚠️ uuid vulnerable |
| tailwindcss | 3.4.17 | ✅ (no migrar a v4) |
| sharp | 0.34.5 | ⚠️ libvips CVEs |
| zod | 3.25.76 | ✅ |
| isomorphic-dompurify | 3.19.0 | ✅ |

### Vulnerabilidades (npm audit)
- **2 críticas:** `websocket-driver` (resource limit bypass, message corruption)
- **9 altas:** `next` (múltiples CVEs), `sharp`, `postcss`, `form-data`, `js-yaml`, `protobufjs`
- **10 moderadas:** `uuid`, dependencias transitivas
- **Total:** 21 vulnerabilidades

### Dependencias desactualizadas
- `firebase-admin@12.7.0` → latest 14.x (breaking)
- `next@15.3.9` → latest 15.5.22 (security fixes)
- `sharp@0.34.5` → latest 0.35.3 (breaking)

## 3. DEUDA TÉCNICA

### H-DEBT-01: 80+ archivos .md/.json en raíz del proyecto
- **Evidencia:** Directorio raíz contiene ~80 archivos de reportes, auditorías, simulaciones, planes
- **Impacto:** Clutter extremo, confusión
- **Riesgo:** BAJO
- **Prioridad:** P3
- **Solución:** Mover a `docs/history/`

### H-DEBT-02: 215 scripts en `scripts/`
- **Evidencia:** `scripts/` contiene 215 items, mayoría one-off
- **Impacto:** Código muerto, mantenimiento confuso
- **Riesgo:** BAJO
- **Prioridad:** P3
- **Solución:** Auditar y eliminar

### H-DEBT-03: `lib/evergreen.ts` = 101KB hardcodeado
- **Evidencia:** Contenido evergreen embebido en código
- **Impacto:** Difícil de mantener, no editable sin deploy
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** Migrar a Firestore o archivos JSON

### H-DEBT-04: `pro-design.css` = 167KB sin purge
- **Evidencia:** CSS masivo sin tree-shaking
- **Impacto:** Performance, mantenibilidad
- **Riesgo:** MEDIO
- **Prioridad:** P2

### H-DEBT-05: `appx/` directorio huérfano
- **Evidencia:** 2 items, no referenciado
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-DEBT-06: Múltiples páginas admin redirigen a `/admin/nios`
- **Evidencia:** `/admin/growth`, `/admin/crecimiento`, `/admin/meni-dashboard`, `/admin/knowledge-center`, `/admin/entities` — todos redirect
- **Impacto:** Código muerto mantenido
- **Riesgo:** BAJO
- **Prioridad:** P3
- **Solución:** Eliminar páginas redirect

### H-DEBT-07: `editorial-contract.ts` = 35KB monolítico
- **Evidencia:** `lib/meni/editorial-contract.ts` = 35,659 bytes
- **Impacto:** Difícil de mantener
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-DEBT-08: Duplicación de lógica de auditoría
- **Evidencia:** `/api/auditor` y `/api/auditor-wordcount` tienen lógica similar pero separada
- **Impacto:** Mantenimiento duplicado
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-DEBT-09: `tests/audit-context.test.ts` — test temporal no limpiado
- **Evidencia:** Archivo de test temporal creado para auditoría de context score
- **Impacto:** Debería eliminarse o integrarse en suite permanente
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-DEBT-10: Archivos temporales en raíz
- **Evidencia:** `body.txt`, `head.txt`, `temp-oraciones.txt`, `cdc551c`, `console.log(...)` (0 bytes), `build.log`, `build2.log`, etc.
- **Impacto:** Clutter
- **Riesgo:** BAJO
- **Prioridad:** P3
- **Solución:** `.gitignore` + eliminar

### H-DEBT-11: `tsconfig.tsbuildinfo` en repo
- **Evidencia:** `tsconfig.tsbuildinfo` = 535,744 bytes en raíz
- **Impacto:** No debería estar versionado
- **Riesgo:** BAJO
- **Prioridad:** P3
- **Solución:** Agregar a `.gitignore`

### H-DEBT-12: Múltiples logs de deploy/build en raíz
- **Evidencia:** `build.log`, `build2.log`, `build3.log`, `build4.log`, `vercel-deploy.log`, `vercel-deploy2.log`, `vercel-runtime.log`, `vercel-runtime2.log`, `test-log.txt`, `lint.log`, `lint-errors.txt`, `tsc-out.log`, `typecheck.log`, `menisync.log`
- **Impacto:** Clutter
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-DEBT-13: Pre-deploy script referenciado pero posiblemente roto
- **Evidencia:** `package.json:23` — `"pre-deploy": "bash scripts/pre-deploy-check.sh"` — requiere bash, no funciona en Windows nativo
- **Riesgo:** BAJO
- **Prioridad:** P3

### H-DEBT-14: `npm audit fix` disponible para vulnerabilidades no-breaking
- **Evidencia:** `form-data`, `js-yaml`, `protobufjs`, `websocket-driver` — fix con `npm audit fix` sin breaking changes
- **Riesgo:** MEDIO
- **Prioridad:** P1
- **Solución:** Ejecutar `npm audit fix`

### H-DEBT-15: Git hooks configurados
- **Evidencia:** `package.json:28` — `"prepare": "git config core.hooksPath .githooks"`
- **Impacto:** Positivo — pre-commit hooks
- **Riesgo:** N/A

### H-DEBT-16: `vitest.config.ts` bien configurado
- **Evidencia:** `vitest.config.ts` = 2,680 bytes
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-DEBT-17: `eslint.config.mjs` + `.eslintrc.json` — posible conflicto
- **Evidencia:** Ambos archivos existen. ESLint 9 usa flat config (`.mjs`), pero `.eslintrc.json` también presente
- **Impacto:** Posible conflicto de configuración
- **Riesgo:** BAJO
- **Prioridad:** P3
- **Solución:** Eliminar `.eslintrc.json` si se usa flat config

## 4. MATRIZ DE DEUDA TÉCNICA

| Item | Tipo | Riesgo | Prioridad | Esfuerzo |
|---|---|---|---|---|
| 80+ .md en raíz | Organización | Bajo | P3 | 1h |
| 215 scripts | Código muerto | Bajo | P3 | 4h |
| evergreen.ts 101KB | Arquitectura | Medio | P2 | 8h |
| pro-design.css 167KB | Performance | Medio | P2 | 8h |
| Dependencias vulnerables | Seguridad | Alto | P1 | 2h |
| API routes sin auth | Seguridad | Alto | P1 | 4h |
| Firestore rules abiertas | Seguridad | Crítico | P0 | 2h |
| Archivos temp en raíz | Organización | Bajo | P3 | 0.5h |
| appx/ huérfano | Código muerto | Bajo | P3 | 0.5h |

## 5. SCORE

| Dimensión | Score |
|---|---|
| Build/CI | 8/10 |
| Tests | 7/10 |
| Lint/Type-check | 9/10 |
| Deuda técnica | 4/10 |
| Dependencias | 5/10 |
| Organización repo | 3/10 |
| **Total** | **6.0/10** |
