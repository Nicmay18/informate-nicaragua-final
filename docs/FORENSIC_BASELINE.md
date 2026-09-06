# FORENSIC_BASELINE.md

> Baseline forense generado como parte del MASTER FORENSIC CLOSURE PROMPT.
> No declara PRODUCTION CLOSED. Solo registra el estado observable del repositorio y del entorno local en el momento de la auditoría.

---

## 1. IDENTIDAD DE LA AUDITORÍA

- **Fecha/hora local:** 2026-09-05 18:52 CST (UTC-6)
- **Auditor:** Cascade (autonomous forensic engineering run)
- **Scope:** Nicaragua Informate — NIOS / CEO / Centro de Comando
- **Repositorio:** `https://github.com/Nicmay18/informate-nicaragua-final`

---

## 2. GIT

### Branch & HEAD

- **Branch activa:** `master`
- **HEAD:** `abf3cbaad9feae0a805d0991ccbc786548367712` (`abf3cba`)
- **origin/HEAD:** apunta a `origin/master`
- **Estado con origin:** HEAD coincide con `origin/master` (sin commits no publicados observables)

### Commits recientes (top 20, abreviado)

```text
abf3cba fix(depto-workers): watchdog recovery ejecuta el worker del componente crítico para recuperar heartbeat
403c1ce fix(operational-loop): evita índices compuestos en team status, feed y summary
57ed9ab fix(editor-ia): evita puntuacion undefined/100 en panel.html con fallback en mapV4ToV3
1e5f638 fix(ceo-loop): persiste autonomyScore correctamente en el registro del ciclo CEO
7f9114b fix(centro,ceo-memory): consulta ceo_loop y learnings por kind/timestamp, evita documentId
07693e4 fix(depto): evita índices compuestos en watchdog, resumen, learnings y sanitiza trabajos
67cb8cb fix(depto-queue): sanitiza campos undefined antes de escribir trabajos en Firestore
5a80029 fix(depto-jobs,nios-memory): ajusta consultas para evitar índices compuestos no creados y que worker/scheduler operen
4652714 chore: elimina cdc.json local accidentalmente commiteado
b0390a1 fix(heartbeat): omite campos undefined al escribir depto_heartbeat para evitar rechazo de Firestore
7ba84cc P0 routing: /panel -> /panel/centro-de-comando, limpia enlaces /admin obsoletos en panel.html y Centro de Comando, redirecciones /admin/* a /panel/*
de57b00 fix(vercel): maxDuration 60s en nios loop para Hobby
5f8610b fix(vercel): ajusta nios-ceo-loop a diario para Hobby
263135a fix(admin/news): lazy-load POST-only deps to fix GET test timeouts; integrate operational loop and make real GSC/GA4 tests conditional
ead3b34 Centro de Comando: alimenta detectConflicts con ultimas noticias para juez forense MENI vs Forense
7a3b137 NIOS: refinamiento de conflictos + juez forense MENI vs Forense + pruebas
a9ce9df conflict-detector-nios
1b05745 nios-manual-cycle-button
2603ec1 nios-ceo-loop-ui-cron
0868681 fix(vercel): ajusta crons a diarios para Hobby
```

### Cambios sin commit (working tree)

- **22 archivos modificados** en working tree.
- **1 directorio sin rastrear:** `lib/utils/` (función canónica `countWords` y alias `cleanWordCount`).
- **Archivos con warning de CRLF:** `departamento-central/heartbeat.ts`, `departamento-central/summary.ts`, `meni/utils/helpers.ts`, `nios/content-intelligence/index.ts`, `nios/intelligence/adsense-recovery.ts`, `nios/intelligence/ceo-status.ts`, `nios/intelligence/data-merger.ts`, `nios/intelligence/google-trust.ts`, `nios/lifecycle/tracker.ts`. Git reemplazará LF por CRLF la próxima vez que toque esos archivos.

### Diff resumido (por archivo)

```text
 app/api/admin/dashboard-calidad/route.ts  | 140 ++++++++++++++++------------
 app/api/articles/route.ts                 |   5 +-
 app/api/auditor-wordcount/route.ts        |  17 +---
 lib/admin/centro-de-comando.ts            |  54 ++++++++----
 lib/departamento-central/heartbeat.ts     |   1 -
 lib/departamento-central/summary.ts       |   9 +-
 lib/departamento-central/workers.ts      |   9 +-
 lib/discover-score.ts                     |  12 +--
 lib/editorial-fix.ts                      |   6 +-
 lib/meni/utils/helpers.ts                 |   4 -
 lib/nios/conflict-detector.ts             |   6 +-
 lib/nios/content-intelligence/index.ts    |  13 ++-
 lib/nios/intelligence/adsense-recovery.ts |   5 +
 lib/nios/intelligence/ceo-status.ts       |  10 ++-
 lib/nios/intelligence/data-merger.ts      |   6 +-
 lib/nios/intelligence/diagnostics.ts      |  14 +--
 lib/nios/intelligence/google-trust.ts     |   5 +
 lib/nios/intelligence/types.ts            |   9 +
 lib/nios/lifecycle/tracker.ts             |   4 +-
 lib/nios/meni-forense-judge.ts            |   4 +-
 lib/nios/operating-mode.ts                |   4 +-
 tests/mission10-diagnostics.test.ts       |   4 +-
 22 files changed, 186 insertions(+), 155 deletions(-)
```

### Worktree previo

- **Branch:** `copilot/worktree-2026-05-23T14-05-52`
- **Commit del worktree:** `f32f96d`
- **Directorio del worktree:** `E:\PROYECTO\informate-nicaragua-final.worktrees\copilot-worktree-2026-05-23T14-05-52` → **NO EXISTE** (worktree perdido/missing)
- **Estado en `git worktree list`:** `prunable`
- **Relación con HEAD:** `f32f96d` es ancestro de `abf3cba` (`git merge-base --is-ancestor f32f96d HEAD` retorna 0).
- **Conclusión:** el commit del worktree está completamente fusionado en `master`. No hay trabajo perdido ni commits no fusionados provenientes de ese worktree.

### Branches divergentes / commits no fusionados

- No se detectaron commits en `master` no publicados en `origin/master` en esta sesión.
- No se detectaron branches locales con commits no fusionados a `master` (solo el worktree anterior, que ya es ancestro).

---

## 3. ENTORNO

### Node / npm

- **Node runtime local:** `v24.11.1`
- **npm local:** `11.6.2`
- **Node target en `package.json`:** `22.x`
- **Findings:** el runtime local es `24.x` mientras el proyecto declara `22.x`. Esto es un **mismatch de runtime**; no bloquea build/test local, pero debe alinearse con el runtime productivo de Vercel.

### Package engines / dependencias relevantes

- **Next.js:** `^15.5.23`
- **React:** `^19.0.0`
- **firebase-admin:** `^12.7.0`
- **firebase (cliente):** `^12.14.0`
- **TypeScript:** `^5`
- **Vitest:** `^3.2.7`
- **tsx:** `^4.23.13` (presente en devDependencies)

### Vercel config

- **Archivo:** `vercel.json`
- **Build command:** `npm run build`
- **Output directory:** `.next`
- **Install command:** `npm ci`
- **Crons declarados:** 6 rutas (ver sección Cron Matrix).

---

## 4. SECRETOS Y CONFIGURACIÓN

> **Regla:** no se imprimen valores de secretos. Solo existencia, nombres de variables y estado de tracking en Git.

### Archivos de entorno

- **`.env.local`:** existe (160 bytes), no está trackeado por Git (ignorado por `.gitignore`).
  - Claves presentes (nombres): `CRON_SECRET`, `ADMIN_API_KEY`.
- **`.env.local.example`:** trackeado. Define claves esperadas: `TG_TOKEN`, `TG_CHAT_ID`, `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `FB_PAGE_TOKEN`, `FB_PAGE_ID`, `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_REFRESH_TOKEN`, `TWITTER_BEARER_TOKEN`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `INDEXNOW_KEY`, `ADMIN_API_KEY`, `CRON_SECRET`, `ADMIN_EMAILS`.
- **`.env.example`:** trackeado. Añade: `FIREBASE_SERVICE_ACCOUNT_BASE64`, `NIOS_SITE_URL`, `NIOS_GSC_SITE_URL`, `NIOS_GA4_PROPERTY_ID`, `GOOGLE_ADSENSE_CLIENT_ID`, `NIOS_TRAFFIC_LOG_TTL`, `NIOS_TRAFFIC_LOG_TTL_DAYS`.
- **Findings:** `.env.local` local contiene solo 2 de las múltiples variables requeridas por el sistema. Integraciones como GSC, GA4, AdSense, Telegram, Facebook, OneSignal, Twitter, IndexNow y Firebase service account **no están configuradas en el entorno local**.

### Archivos de secretos sueltos en working tree

- **`admin-api-key.txt`**: presente en raíz (64 bytes), no trackeado por Git, ignorado por patrón `*.txt`.
- **`cron-secret.txt`**: presente en raíz (64 bytes), no trackeado por Git, ignorado por patrón `*.txt`.
- **`vercel-env.txt`**: presente en raíz (2,631 bytes), no trackeado por Git, ignorado explícitamente en `.gitignore`.
  - Contiene nombres de variables (sin exponer valores): `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_PROJECT_ID`, `CRON_SECRET`, `NIOS_SITE_URL`, `NIOS_GA4_PROPERTY_ID`, `ADMIN_API_KEY`, `ADMIN_EMAILS`, `NEXT_PUBLIC_FIREBASE_*`.

### Seguridad Git

- `.gitignore` prohíbe correctamente `.env*.local`, `vercel-env.txt`, `serviceAccountKey.json`, `*firebase-adminsdk*.json`, `tokens-backup.json`, `*key*.json`, `*secret*.json`.
- **Problema:** existen archivos `.txt` con nombres de secretos en el directorio de trabajo. No están en Git, pero representan riesgo de filtración local y podrían ser accidentalmente incluidos en un deploy si no se respeta `.gitignore`.

---

## 5. CRON MATRIX (declarado en `vercel.json`)

| Path | Schedule | Estado en config |
| ---- | -------- | ---------------- |
| `/api/cron/nios-collect` | `0 8 * * *` | declarado |
| `/api/cron/resumen-diario` | `0 12 * * *` | declarado |
| `/api/cron/departamento-central` | `0 0 * * *` | declarado |
| `/api/cron/departamento-daily` | `0 6 * * *` | declarado |
| `/api/cron/departamento-watchdog` | `0 1 * * *` | declarado |
| `/api/cron/nios-ceo-loop` | `0 2 * * *` | declarado |

- **Nota:** esta es la configuración declarativa. La existencia de routes y su protección se verifican en el inventory del Mapa Forense.

---

## 6. BUILD & TESTS (evidencia local)

### `npm run test:merge`

Ejecutado en background. Resultado:

```text
Test Files  69 passed (69)
Tests  664 passed | 2 skipped (666)
Duration  57.46s
```

Además incluye `npm run type-check` y `npm run lint`:

- `tsc --noEmit` → exit code 0
- `eslint . --ext .ts,.tsx --max-warnings 0` → exit code 0

### `npm run build`

- Build anterior ejecutado en esta sesión retornó **exit code 0**.
- Se generaron 102 páginas estáticas/dinámicas sin errores de compilación.

---

## 7. HALLAZGOS INICIALES DEL BASELINE

1. **Runtime mismatch:** Node local `v24.11.1` vs `package.json` `22.x`.
2. **Entorno local incompleto:** `.env.local` solo tiene `CRON_SECRET` y `ADMIN_API_KEY`; faltan credenciales para Firebase service account, GSC, GA4, AdSense, Telegram, Facebook, OneSignal, Twitter, IndexNow.
3. **Archivos secretos sueltos:** `admin-api-key.txt`, `cron-secret.txt`, `vercel-env.txt` existen en el directorio de trabajo pero no están trackeados. Deben ser removidos o movidos a `.env.local` y destruidos de forma segura.
4. **Worktree huérfano:** `copilot/worktree-2026-05-23T14-05-52` aparece como `prunable`, su directorio no existe y su commit `f32f96d` ya es ancestro de `HEAD`. Sin riesgo de trabajo perdido.
5. **Working tree con cambios sin commit:** 22 archivos modificados y `lib/utils/` sin trackear, producto de las fases de corrección previas (word count canónico, NIOS operating mode, pending actions/approvals, MENI/Forense idempotencia).
6. **Warnings CRLF:** varios archivos con LF serán reconvertidos a CRLF por Git; no es un blocker funcional pero genera ruido en diffs.

---

## 8. ESTADO DE CIERRE EN BASELINE

- **PRODUCTION CLOSED:** **NO** — aún no se ha completado la auditoría forense de componentes, cron, automatización, integrations, smoke de producción, continuidad ni despliegue.
- **Estado actual:** `INSPECCIÓN EN PROGRESO` → siguiente paso: `MAPA FORENSE DEL SISTEMA`.
