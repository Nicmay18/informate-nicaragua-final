# ENTREGA FINAL — Nicaragua Informate

Fecha de cierre: **2026-10-28** (mediciones Firestore/GitHub en UTC 01:54–02:30).
Fuentes: GitHub API (`pulls`, `check-runs`, `branches/master/protection`, `collaborators`, `deployments`), curl a producción, Firestore read-only, ejecución local completa de la suite con Node 22.21.0. Ninguna escritura en producción. Ningún secreto copiado a documentos.

---

## 1. Estado real de producción

| Ítem | Estado | Evidencia |
|---|---|---|
| `master` | `5fa19c68` — sin cambios desde 11-oct | API `branches/master` (`.audit/cierre-status.json`) |
| Último deploy Production | `5fa19c68`, 2026-10-11 21:30 UTC | API `deployments?environment=Production` |
| Sitio, sitemaps, robots, feed, ads.txt | 200 | curl |
| `google-adsense-account` meta | ausente del HTML (está en PR #13) | curl + grep |
| `/negocios`, `/admin/negocios`, módulo auspiciadores | no existen en producción | curl 404 |
| Branch protection | `enforce_admins: true`, **1 aprobación obligatoria**, `required_conversation_resolution: true`, checks requeridos: Lint & TypeScript, Unit & Integration Tests, Build Next.js, CI Summary | API `protection` |
| Colaboradores del repo | **solo `Nicmay18` (admin)** | API `collaborators` |

**Ningún PR está en producción.** GitHub no permite que el autor de un PR apruebe su propio PR, y todos los PRs (#2–#16) son de `Nicmay18`, único colaborador. Con `enforce_admins: true` la regla aplica también al administrador. Ver §7 para las dos salidas posibles.

## 2. Integración realizada: rama `release/cierre-final` → PR #17

Para no dejar el trabajo repartido en seis ramas que exigen seis aprobaciones y rebases encadenados, se construyó **una sola rama de integración** sobre `origin/master` que fusiona, en orden y sin un solo conflicto (`git merge` limpio en cada paso):

| Paso | PR | Commit de merge local | Contenido |
|---|---|---|---|
| 1 | #11 `fix/depto-cola-bloqueada` | `50fd8b1b` | claim NIOS filtrado por `status in [pending,retry]`, dedup incidentes |
| 2 | #13 `fix/admin-session-opaca` | `894936a6` | cookie opaca HMAC, SHA-256 padding, cron-secret acotado a 5 rutas, meta AdSense |
| 3 | #12 `fix/seo-tecnico` | `b0379d2e` | títulos sin artefactos de truncamiento |
| 4 | #14 `fix/deps-audit` | `b4a4b1a9` | Next 15.5.28 + parches semver |
| 5 | #10 `feat/auspiciadores-directos` | `a791ab8a` | auspiciadores, `/publicidad`, telemetría dedup, `firestore.rules` (sin desplegar) |
| 6 | #15 `feat/negocios-mvp` | (merge limpio) | directorio Negocios, pilotos, campañas con pago verificado |
| 7 | #16 `docs/entrega-final` | `f7073fc5` | documentación de entrega + kit comercial |

Corrección a informes anteriores: #10↔#13 (`app/layout.tsx`) y #10↔#15 (`app/publicidad/page.tsx`, `public/panel.html`) **tocan los mismos archivos pero en regiones distintas**; git los fusiona solo. No hubo que resolver nada a mano.

### Errores reales encontrados y corregidos sobre la integración

| Defecto | Dónde | Corrección | Prueba |
|---|---|---|---|
| El E2E de Negocios fijaba la cookie `admin_session` con el API key en crudo; tras #13 la cookie exige token HMAC firmado → el flujo admin fallaría en el árbol integrado | `tests/e2e/negocios.spec.ts` | el test emite un token `exp.email_b64.firma` con el secreto de la fixture; `ADMIN_EMAILS` sintético en la fixture | 14/14 E2E |
| `homepage.spec.ts` se saltaba los tests de artículos ("skip honesto") porque la fixture no tenía noticias — un skip no es una prueba | `tests/fixtures/negocios-server.cjs`, `negocios-db.ts` | la fixture siembra 1 noticia sintética (marcada como no real) y el doble de Firestore soporta `orderBy`, `>=`, `<`, `empty` | portada, detalle, skip-link, nav móvil: 10/10 sin skips |
| `nav` ambiguo (3 elementos `<nav>` en la página) | `homepage.spec.ts` | `header nav` | ✅ |
| CI: E2E con `continue-on-error: true` + `npm run dev` contra producción → verde sin significado | `.github/workflows/ci.yml` | E2E compila la fixture aislada y corre `playwright.negocios.config.ts` (chromium + Mobile Chrome) **como gate**; `CI Summary` ahora falla si E2E no es `success` (y si cualquier job queda `cancelled`/`skipped`, no solo `failure`) | se verificará en el CI de PR #17 |
| `@sentry/nextjs` **critical** (Middleware Bypass via tunnel route), `node-forge` high, `qs` moderate — todos con fix semver-compatible no aplicado | `package-lock.json` | `npm audit fix` (sin `--force`, `package.json` intacto): sentry 10.77.1, node-forge 1.4.2, qs 6.17.0 | suite completa tras el cambio (§3) |

## 3. Verificación de la rama integrada (Node 22.21.0, local)

| Check | Resultado | Log |
|---|---|---|
| `npx vitest run` (árbol integrado, antes de `audit fix`) | **126 archivos / 1677 tests ✅ / 2 skipped / 0 fallos** (incluye conexión real GSC: 352 páginas, 868 queries) | `.audit/cierre-unit.log` |
| `next build` con fixture aislada | ✅ 103 páginas | `.audit/cierre-build.log` |
| `playwright -c playwright.negocios.config.ts` | **14/14 ✅** (homepage ×5 + negocios ×2, chromium y Mobile Chrome, retries 0) | salida en `VERIFICACION_FINAL.md` |
| `tsc --noEmit --skipLibCheck`, `eslint --max-warnings 0`, `vitest` tras `audit fix` | ver `VERIFICACION_FINAL.md` §3 (resultado registrado al cerrar) | `.audit/cierre-tsc.log`, `cierre-lint.log`, `cierre-unit2.log` |
| `npm audit` tras fix | 16 restantes (2 critical son `vitest`/`tinypool` **devDependencies**, no llegan a producción); todos requieren major | `.audit/cierre-audit.json` |

## 4. NIOS — cola real (medido 2026-10-28 01:55 UTC, read-only)

```
pending 315 | retry 2 | running 0 | completed 47 | dead-letter 3
por tipo: watchdog 210, daily-report 36, health-check 36, article-pipeline 25, operational-repair 9, monetization-check 1
más antiguo 2026-09-22 · más nuevo 2026-10-28T01:04 · incidentes activos: 56
heartbeat scheduler: "Enqueued 3, processed 0, workDone24h 0" · watchdog: degraded
```

- La consulta `status in [...] + scheduledFor < now` devuelve `FAILED_PRECONDITION: The query requires an index` en producción — **esa es la causa raíz**: el worker en producción no puede seleccionar trabajos. PR #11 la evita (query por `status` solo, filtro de `scheduledFor` en memoria) y está cubierto por `tests/depto-queue-drain.test.ts`.
- **NIOS no está arreglado en producción.** Lo estará solo cuando #17 se despliegue y dos mediciones separadas (`node .audit/nios-cola-real.cjs`) muestren `pending↓` y `completed↑`. No se ejecutó ni cambió el estado de ningún job.
- Riesgo al drenar: los 25 `article-pipeline` pueden publicar/distribuir contenido atrasado. Revisar el primer día tras el deploy.

## 5. Seguridad

- En producción (hoy): `x-cron-secret` abre ~64 rutas `/api/admin/*`; la cookie admin contiene el API key. Ambos quedan corregidos en #17 (código de #13), no desplegados.
- Verificado en el árbol integrado: 86 tests de auth, matriz de autorización por endpoint de Negocios (57 tests), `/api/admin/*` → 401 sin credencial (E2E).
- `firestore.rules` de #10 endurece `views` (cierra escritura pública +1) y `traffic_daily`. **No desplegado** — requiere autorización expresa: `firebase deploy --only firestore:rules`.
- Sin cambios de secretos. `ADMIN_SESSION_SECRET` es opcional (fallback a `ADMIN_API_KEY`); recomendable definirlo en Vercel tras el deploy.

## 6. PRs antiguos #2 y #4 — obsoletos con evidencia

| PR | Qué proponía | Por qué es obsoleto | Acción segura |
|---|---|---|---|
| [#2](https://github.com/Nicmay18/informate-nicaragua-final/pull/2) `fix/vercel-runtime-errors` | guard `getAll()` vacío en `entity-page.ts`; `list-all` via `getNewsPaginated` | `master` ya contiene el guard (commits `5dcd5fc4`, `95d3f5d0`) y una versión **superior** de `list-all` (`fetchListAll` con filtro `estado=='publicado'` + `unstable_cache`; la de #2 no cacheaba). `git diff` de #2 contra master: 3 archivos, todos ya cubiertos | **Cerrar sin merge** con comentario (no borrar la rama) |
| [#4](https://github.com/Nicmay18/informate-nicaragua-final/pull/4) `fix/meni-evidence-profile-source-20261002` | regex de evidencia MENI Nacionales + `tests/meni-forensic-evidence.test.ts` | master tiene regex más amplias (`9bc7f059`: RACCN/RACCS, portavoz, familiares…). **Su propio test corre 7/7 en el árbol actual** sin los cambios de la rama. Está `behind` master | **Cerrar sin merge**; el test ya vive en master |

No se cerró ninguno: cerrar un PR es una acción del propietario (botón "Close pull request"); el texto sugerido está en `MATRIZ_PR_Y_DEPLOY.md`.

## 7. Bloqueo exacto y cómo salir

**Bloqueo**: `required_approving_review_count: 1` + `enforce_admins: true` + autor único = ningún PR es fusionable por nadie en el estado actual. No es un fallo de checks.

Salidas (ambas son decisión del propietario; ninguna fue ejecutada):

1. **Invitar un segundo colaborador de confianza** (Settings → Collaborators) que apruebe PR #17. Mantiene la protección intacta. Recomendada.
2. Bajar temporalmente `required_approving_review_count` a 0 (Settings → Branches → master), fusionar #17, **restaurar a 1**. No lo hice: es un cambio de protección de rama que exige tu autorización expresa.

Tras el merge, Vercel despliega `master` automáticamente (integración GitHub ya activa, como en el deploy de `5fa19c68`).

## 8. Riesgos residuales

1. NIOS sigue sin procesar hasta el deploy; crece ~10 jobs/día.
2. Cron-secret con alcance total y cookie con API key hasta el deploy.
3. `firestore.rules` de #10 sin desplegar: la telemetría de auspiciadores funciona vía Admin SDK, pero `views` sigue escribible desde cliente.
4. `fix/estabilizacion-forense` (sin PR) choca con `middleware.ts`/`panel.html`/`ci.yml` del árbol integrado; requiere rebase por quien lo retome.
5. 16 advisories npm requieren majors (firebase 9→12 **no**: la cadena pide `firebase@9.14.0` que es *downgrade* — ignorar ese consejo; `firebase-admin@14`, `zod@4`, `vitest@5` son migraciones reales).
6. AdSense: `ads.txt` declarado; la meta llega con #17; aprobación/ingresos no verificados.

## 9. Acciones humanas mínimas (ordenadas)

1. Elegir salida §7 → aprobar y **mergear PR #17** (squash o merge, no rebase: conserva los merges de los 6 PRs).
2. Cerrar #11, #13, #12, #14, #10, #15, #16 como "superseded by #17" (GitHub puede marcarlos merged automáticamente si detecta los commits; si no, cerrarlos a mano). Cerrar #2 y #4 con el texto de la matriz.
3. Verificar deploy: `curl -sI https://nicaraguainformate.com | grep -i x-vercel-id` y comparar SHA en Vercel → `master`.
4. Día +1 y +2: `node .audit/nios-cola-real.cjs` → `pending` debe bajar y `completed` subir. Solo entonces NIOS está arreglado.
5. Login real en `/panel.html` → comprobar que la cookie `admin_session` tiene formato `número.base64.hex` (no el API key).
6. Autorizar y ejecutar `firebase deploy --only firestore:rules` (opcional pero recomendado).
7. Crear el primer auspiciador/perfil **real y autorizado** desde `/admin/negocios`; sin eso la monetización sigue "instalada, no activa".
8. Prospección manual con `docs/comercial/kit-ventas.md` y `prospectos-seguimiento.csv`.
