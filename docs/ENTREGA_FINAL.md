# ENTREGA FINAL — Nicaragua Informate

Fecha de la auditoría: **2026-10-27** (UTC 2026-10-28 01:16 en mediciones Firestore).
Auditoría ejecutada con acceso de solo lectura a GitHub API, producción HTTP y Firestore (service account local). Ninguna escritura en producción.

---

## 1. Estado real de producción

| Ítem | Estado | Evidencia |
|---|---|---|
| `master` | `5fa19c68` — sin cambios desde 11-oct | `git log origin/master`, API `branches/master` |
| Sitio `/` | 200 | curl |
| `/sitemap.xml`, `/news-sitemap.xml`, `/robots.txt`, `/feed.xml`, `/ads.txt` | 200, válidos | curl |
| `google-adsense-account` meta | **ausente del HTML** (está en PR #13, no mergeado) | curl + grep del HTML inicial |
| `ads.txt` | `google.com, pub-4115203339551838, DIRECT, f08c47fec0942fa` — declarado; **no prueba que AdSense esté aprobado o facturando** | curl |
| `/negocios`, `/admin/negocios` | 404 — PR #15 no desplegado | curl |
| `/api/admin/negocios` | 401 — el middleware protege rutas aunque no existan aún | curl |
| Branch protection | `enforce_admins: true`, 1 review obligatoria, checks requeridos: Lint & TypeScript, Unit & Integration Tests, Build Next.js, CI Summary | API `branches/master/protection` |

**Nada de los 6 PRs abiertos está en producción.** Todos esperan la única acción que no puede hacer un agente: la aprobación humana en GitHub.

## 2. Matriz de PRs (estado real, 2026-10-27)

| PR | Resuelve | SHA | Checks obligatorios | Reviews | En prod | Riesgo de no actuar |
|---|---|---|---|---|---|---|
| [#11](https://github.com/Nicmay18/informate-nicaragua-final/pull/11) | Cola NIOS congelada (query vieja saturada de completados) | `1df25d1b` | 9/9 ✅ | 0 — falta aprobación | No | **Crítico**: la cola sigue creciendo ~10/día; 317 trabajos acumulados |
| [#13](https://github.com/Nicmay18/informate-nicaragua-final/pull/13) | Cookie admin opaca HMAC, fix SHA-256 padding, cron-secret limitado a 5 rutas, meta AdSense | `3908093e` | 9/9 ✅ | 0 | No | Alto: credencial cron con alcance admin total sigue en producción |
| [#12](https://github.com/Nicmay18/informate-nicaragua-final/pull/12) | Artefactos de truncamiento en títulos | `6e196bb3` | 9/9 ✅ | 0 | No | Medio |
| [#14](https://github.com/Nicmay18/informate-nicaragua-final/pull/14) | Next 15.5.28 + parches semver-seguros | `5f779280` | 9/9 ✅ | 0 | No | Medio |
| [#10](https://github.com/Nicmay18/informate-nicaragua-final/pull/10) | Auspiciadores directos (producto vendible) | `ebf9ade1` | 9/9 ✅ | 0 | No | Bloquea ingreso directo; **modifica `firestore.rules` → deploy requiere autorización expresa** |
| [#15](https://github.com/Nicmay18/informate-nicaragua-final/pull/15) | Directorio Negocios + campañas + pilotos | `ea669a05` | 9/9 ✅ | 0 | No | Bloquea el segundo producto comercial |
| [#4](https://github.com/Nicmay18/informate-nicaragua-final/pull/4) | Evidencia MENI Nacionales | `19752fe7` | E2E/Lighthouse **failure** (viejo, 02-oct) | 0 | No | Bajo — evaluar si sigue vigente o cerrar |
| [#2](https://github.com/Nicmay18/informate-nicaragua-final/pull/2) | Errores runtime Vercel | `22cbeb75` | sin checks recientes (24-sep) | 0 | No | Evaluar si fue absorbido o cerrar |

### Ramas huérfanas (commits en origin sin PR)

- `fix/estabilizacion-forense` — auditoría forense grande (lotes A–E, 56 reemplazos editoriales, gate E2E real en `ci.yml`, toca `middleware.ts` y `panel.html`). **Chocará con #10, #13 y #15 al mergear.**
- `fix/ci-e2e-gate` — 1 commit: E2E como gate real + auth en reporte diario.
- `audit/afectado-p2-evidencia` — evidencia de la matriz P2.

### Conflictos entre PRs

| Par | Archivos en conflicto |
|---|---|
| #10 ↔ #13 | `app/layout.tsx` |
| #10 ↔ #15 | `app/publicidad/page.tsx`, `public/panel.html` |
| #13 ↔ #15 | **sin conflicto** — `isAdminRequest` mantiene firma; `ADMIN_SESSION_SECRET` tiene fallback a `ADMIN_API_KEY` |
| #11, #12, #14 | aislados (departamento-central, formateo, lockfile) |
| `fix/estabilizacion-forense` ↔ #10/#13/#15 | `middleware.ts`, `panel.html`, `ci.yml` |

**Orden de merge recomendado** (minimiza rebases): #11 → #13 → #12 → #14 → #10 → #15. El segundo de cada par en conflicto necesitará rebase.

## 3. NIOS — cola real (medido 2026-10-28 01:16 UTC)

| pending | retry | running | completed | dead-letter | total |
|---|---|---|---|---|---|
| **315** | 2 | 0 | 47 | 3 | **367** |

- **Creció +61 trabajos desde el 21-oct** (~10/día). Último `completedAt` real: **2026-09-22** — la cola no procesa nada hace más de un mes.
- Distribución de pendientes: watchdog **210**, daily-report 36, health-check 36, article-pipeline 25, operational-repair 9, monetization-check 1. **El propio watchdog genera 2/3 del backlog** (crea un job por ejecución que nunca se procesa).
- Heartbeats `depto_heartbeat`: los crons sí se ejecutan a diario (`departamento-central` hoy 00:58, `watchdog` 01:04, `nios-collect`, `resumen-diario`, `supervisor-watch`, `traffic-cleanup`, `departamento-daily`). El heartbeat `scheduler` dice: `"Enqueued 3, processed 0, workDone24h 0"` — encola pero procesa cero. Heartbeats de los *tipos de trabajo* (daily-report, health-check, growth, monetization-check) congelados en 22-sep porque sus jobs nunca corren.
- **Causa raíz confirmada en código**: el claim viejo pedía los N más viejos por `scheduledFor`; esa ventana quedó saturada de `completed`/`dead-letter` (los docs no se borran) y ningún `pending` entraba. PR #11 filtra `status in [pending,retry]` con `in` (igualdad, **sin índice compuesto**) y ordena `scheduledFor` en memoria — verificado contra la estructura real de docs (`scheduledFor` es string ISO).
- `depto_incidents` no existe en producción; alertas históricas están en `nios_alerts` (159 docs, sin campo `status` en la muestra — la dedup de PR #11 opera sobre esa colección).
- Drenaje estimado tras merge: ≤25 jobs/día (central 15 + watchdog 10) → ~13 días para 317. **No lanzar jobs manualmente**: los `article-pipeline` pueden publicar/distribuir; `operational-repair` puede reconstruir snapshots.
- Pendiente tras merge: observar `pending↓`, `completed↑`, `running` transitorio, cero duplicados por `dedupKey`, cierre de incidentes históricos.

## 4. Seguridad

- En producción sigue vigente el problema que corrige #13: `requireAdminAuth` acepta `x-cron-secret` en ~64 rutas admin cuando solo 5 handlers lo consumen. Credencial de cron = llave maestra admin **hoy**.
- Verificado: `/api/admin/negocios` responde 401 sin sesión; las rutas nuevas de #15 re-verifican `isAdminRequest` en cada handler (no dependen solo del middleware).
- Cookies/sesión opaca HMAC, fix de padding SHA-256, boundary de expiración, b64 unicode: implementados y testeados en #13 (86 tests de auth).
- gitleaks no instalado localmente — el pre-commit omite el scan (sin evidencia de secretos nuevos en el diff de #15).

### Vulnerabilidades npm (sin fix semver-compatible)

| Advisory | Cadena | Fix | Estado |
|---|---|---|---|
| node-forge (high) | firebase-admin@12 | firebase-admin@14 (major) | no aplicado — requiere evaluación |
| @grpc/grpc-js | firebase → @firebase/firestore | firebase@9.x (major) | no aplicado |
| uuid (moderate) | gaxios/google-gax | firebase-admin@14 | no aplicado |
| braces (high) | chokidar → tailwindcss (build-time) | tailwindcss@4 | no aplicado — no llega al runtime |
| postcss-selector-parser | postcss-nested | update major padre | no aplicado |

## 5. SEO / indexación (producción, hoy)

| Ítem | Estado |
|---|---|
| sitemap.xml / news-sitemap.xml | 200, generados dinámicos con URLs reales |
| robots.txt | 200 |
| feed.xml | 200 |
| Canonical + NewsArticle JSON-LD | presentes en artículos |
| `google-adsense-account` meta | **ausente** (pendiente de #13) |
| Títulos truncados / texto basura | fix preparado en #12 (19 títulos) + lote editorial en `fix/estabilizacion-forense` (sin PR) |
| Search Console | sin acceso API en esta sesión — verificación manual pendiente (sección 9 del manual) |

## 6. Correcciones realizadas en esta sesión

| Cambio | Commit | Prueba |
|---|---|---|
| `tests/e2e/homepage.spec.ts`: selector `#content`→`#main-content` (ancla real del sitio, verificada en producción), nav móvil via `.ni-hamburger`/`.ni-mobile-menu__nav`, tests de artículos con skip honesto cuando el entorno no tiene datos | en esta rama | selector verificado contra HTML real de producción |
| Documentos de entrega (este set) | en esta rama | — |

## 7. Riesgos residuales

1. **Cola NIOS crece ~10/día** — cada día sin merge de #11 suma backlog.
2. Cron-secret con alcance admin total en producción hasta que #13 se despliegue.
3. `fix/estabilizacion-forense` sin PR: trabajo de auditoría significativo dormido en una rama; al crear su PR habrá conflicto triple con #10/#13/#15.
4. `ci.yml` tiene `continue-on-error` en E2E y Lighthouse — un job verde no certifica que los tests pasaron (el gate real propuesto en `fix/ci-e2e-gate` sigue sin PR).
5. AdSense: `ads.txt` publicado pero meta de verificación ausente — la cuenta podría no estar vinculada.
6. Vulnerabilidades npm sin fix menor: todas requieren majors — evaluación pendiente, no aplicar `--force`.

## 8. Acciones que requieren intervención humana (ordenadas)

1. **Aprobar y mergear #11** → verificar SHA desplegado → medir cola en varias muestras (no declarar resuelto por el merge).
2. Aprobar y mergear #13 → verificar login admin + meta AdSense + rechazo de cron-secret en rutas no-cron.
3. Mergear #12, #14.
4. Mergear #10 → **luego autorizar explícitamente** `firebase deploy --only firestore:rules`.
5. Mergear #15 (rebase si #10 entró primero — conflicto en `publicidad/page.tsx` y `panel.html`).
6. Decidir sobre `fix/estabilizacion-forense` y `fix/ci-e2e-gate`: crear PR o archivar.
7. Evaluar majors de firebase/firebase-admin en sprint aparte.
8. Contactar prospectos del directorio **manualmente** (kit en `docs/comercial/`).
9. Confirmar pagos reales antes de marcar cualquier campaña `pagado`.
