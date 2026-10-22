# ESTADO REAL DEL PROYECTO — NICARAGUA INFORMATE
Fecha: 2026-10-22 | Rama base: `master` @ `5fa19c68` | Corpus: 597 publicados (export `.audit/corpus.json`)

## 1. SEPARACIÓN CÓDIGO / MERGE / DEPLOY / PRODUCCIÓN

| Cambio | Código listo | Mergeado | Desplegado | Verificado en prod |
|---|---|---|---|---|
| PR #10 auspiciadores (+rate limit `ebf9ade1`) | ✅ | ❌ abierta | ❌ (`/api/telemetry/ads` → 404 en prod) | ✅ verificado ausente |
| `fix/estabilizacion-forense` (panel, middleware, categoría, tema, entidad) | ✅ | ❌ rama nueva | ❌ | pendiente tras merge |
| `fix/ci-e2e-gate` (E2E gate, cron auth, dead code) | ✅ | ❌ rama nueva | ❌ | pendiente tras merge |
| Correcciones Firestore eufemismo (23 docs + 2 rectificaciones) | — | — | ✅ aplicadas a la base | ✅ leídas en DB; ⚠️ público ve caché CF (~36 min) |

## 2. ESTADO DE CADA PR

| PR | Rama | Propósito | Bloqueo |
|---|---|---|---|
| #10 | feat/auspiciadores-directos | Auspiciadores directos + a11y/SEO/perf + rate-limit | Falta revisión humana + merge + deploy |
| #11 | fix/depto-cola-bloqueada | Drenaje depto_jobs | Revisión pendiente |
| #12 | fix/seo-tecnico | Limpiar truncamiento en títulos | Revisión pendiente |
| #13 | fix/admin-session-opaca | Cookie admin opaca + meta AdSense | Revisión pendiente; solapa con mi middleware (no conflicto real — headers vs cookie) |
| #14 | fix/deps-audit | npm audit (next 15.5.28) | Revisión pendiente |
| #15 | feat/negocios-mvp | Directorio moderado + pilotos + campañas auditadas | Producto paralelo al de auspiciadores — decidir alcance antes de mergear (ver FASE 6) |
| #4, #2 | fix/meni-evidence…, fix/vercel-runtime | Antiguas | Revisar si siguen vigentes o cerrar |
| — | fix/estabilizacion-forense (nueva) | Fixes forenses + artefactos | PR por crear por el propietario/revisor |
| — | fix/ci-e2e-gate (nueva) | CI honesto | PR por crear; mergear cuando E2E esté verificable |

## 3. MATRIZ DE DEFECTOS CON EVIDENCIA Y ESTADO

### Editoriales (corpus Firestore)
| Defecto | Evidencia | Estado |
|---|---|---|
| Eufemismo "afectado" en 29 artículos | Autopsy §3; verificado en prod (h1 vs JSON-LD) | 23 docs corregidos (36 cambios HIGH); 2 rectificaciones; 47 ocurrencias → lista manual `.audit/repair-afectado-pendientes.json` |
| Error propio: "Cuatro obreros muertos" | Fase-1 convirtió "afectados" (2m+2h) en "muertos" | RECTIFICADO → "Dos obreros muertos y dos heridos" |
| Párrafo ×42 en 3 artículos (clase E) | `bluefields`, `pitbull`, `matagalpa-wiwili` (52 párrafos, ~10 únicos) | Sin tocar — esperan decisión dedup/retiro |
| Residuo `oaicite` en 9 docs | Marcador en `contenido` canónico | Render lo limpia (0 visible en prod); limpieza DB pendiente (P1) |
| Atribuciones vagas (~90) / "autoridades competentes" (50) / plantilla compartida (18–23) | Analizador forense | Causa raíz corregida en panel.html; revisión por nota pendiente (C=67) |
| Bajada duplicada como 1er párrafo (357) | Patrón sistemático | Clase B — decisión editorial, no urgente |
| "afectadas punzocortantes" (era "heridas"), "la persona afectada" (era "el fallecido") | Bluefields | Parches listos en `repair-afectado-p2.mjs` — NO aplicados (esperan aprobación) |

### Técnicos
| Defecto | Evidencia | Estado |
|---|---|---|
| Canonical paginado → pág.1 en `/categoria` | Prod: `/categoria/sucesos?page=2` canonical apuntaba a pág.1 | Corregido en rama `fix/estabilizacion-forense` |
| Clamp silencioso `/tema`, `/entidad` | Prod: `/entidad?page=9999` → 200 | Corregido → 404 real (rama) |
| `/entidad` sin canonical | Sonda | Añadido (rama) |
| `/panel.html` sin headers seguridad | Sonda (XFO presente por otra vía; CSP/no-store ausentes del branch) | Completado en rama |
| `isPublicArticle` no exige `supervisorApproved`/`contentHash` | 254/597 sin supervisorApproved, 261 sin hash | NO implementado: endurecerlo escondería ~43% del corpus — requiere backfill primero (propuesta) |
| `publicado`/`estado` divergencia | `estadoDiv: 0` en corpus actual | Sin evidencia activa — vigilar |
| CI: E2E `continue-on-error` + crecimiento-diario 401 diario + deploy-staging muerto | ci.yml, crecimiento-diario.yml | Corregido en `fix/ci-e2e-gate` |
| IP+UA crudos en `analytics_traffic` sin TTL | `/api/l/[id]` | Propuesta P1 — sin tocar |
| Secrets en query params (`?token=`, `?secret=`) | articles, telegram, cache-purge | Propuesta P1 — sin tocar |

### Seguridad
| Riesgo | Estado |
|---|---|
| `/api/telemetry/ads` mutador abierto | Rate limit 60/min añadido (commit `ebf9ade1` en PR #10) |
| `panel.html` updateDoc directo a `noticias`/`config/admin` | Fabricación eliminada; los updateDoc directos SIGUEN existiendo (fail-closed por reglas: requieren claim `admin` no emitido en repo) — P0 pendiente: enrutar por API canónica |
| `x-cron-secret` válido en todo `/api/admin/*` | Propuesta: restringir a `/api/cron/*` |
| `CLEANUP_TOKEN` con alcance de guardado editorial | Propuesta |
| `admin_session` cookie sin logout/revocación | PR #13 relacionada — revisar |
| `comentarios` lectura pública en reglas | Riesgo bajo — documentado |
| IP en analytics (arriba) | Propuesta |

## 4. PRUEBAS EJECUTADAS Y RESULTADO

- `tsc --noEmit`: limpio (post-cambios de rama).
- `vitest run tests/ads-api tests/pagination`: 25/25 ✅.
- Sonda producción: 784 URLs, 0 errores de red, 778×200 / 2×401 (APIs admin correctas) / 3×404 (fuera de rango correctos) / 1×410 (slug tóxico manual).
- E2E Playwright: NO ejecutado (requiere servidor local + Firebase; documentado como limitación, no como verde).
- Registro completo de comandos en este hilo + `.audit/` (logs de reparación).

## 5. PROCEDIMIENTO DE ROLLBACK

| Cambio | Rollback |
|---|---|
| Correcciones eufemismo Firestore | `.audit/repair-afectado-log.json` + `-p2` + `-rectificacion` contienen antes/después por frase y por doc; `.audit/corpus.json` es el snapshot pre-reparación completo |
| Ramas nuevas | No mergeadas — borrar rama remota si se descarta |
| Commit rate-limit en PR #10 | `git revert ebf9ade1` |
| Marcas `requiresReevaluation`/`reparacionForense` | Campos informativos — no afectan render actual (`isPublicArticle` no los lee) |

## 6. DECISIONES QUE REQUIEREN AL PROPIETARIO

1. **Mergear o no PR #10** (monetización lista) y autorizar deploy.
2. **47 frases REVIEW** del eufemismo — la lista `.audit/repair-afectado-pendientes.json` y el script `repair-afectado-p2.mjs` están listos; yo ya marqué decisión editorial por frase (muerte/herida/dejar) pero requieren tu confirmación porque algunas implican decidir quién murió y quién se hirió.
3. **3 artículos clase E** (párrafo ×42): deduplicar o retirar — ficha con evidencia en `FORENSIC_ARTICLE_AUTOPSY.md`.
4. **PR #15 (negocios-mvp) vs PR #10 (auspiciadores)**: dos productos comerciales solapados — elegir uno o definir límites.
5. **Endurecer `isPublicArticle`**: solo tras backfill de `supervisorApproved`/`contentHash` en los ~254-261 docs legacy (migración masiva — aprobar).
6. **updateDoc directos del panel legacy**: migrarlos a `PUT /api/admin/news/[id]` (cirugía mayor — aprobar alcance).
7. **`?page=N` count mismatch**: `accidentes-viales` slug dice "seis" y el título dice "cinco" — verificar el hecho real.
