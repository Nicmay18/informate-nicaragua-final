# FORENSIC REPAIR PLAN — NICARAGUA INFORMATE
Base: autopsia del corpus (597 publicados) + auditoría de arquitectura/editorial/seguridad + verificación en producción.
Todo ítem de contenido queda como PROPUESTA — ninguna acción destructiva ejecutada ni autorizada.

## P0 — Riesgo grave

### P0.1 Reparación del corpus corrompido por eufemismo "afectado" (29 artículos, clase D)
- **Evidencia**: regla "ANTI-PALABRAS SENSIBLES" del generador del panel (`panel.html`) ordenaba reemplazar "muere/fallecidos/heridos" por "resulta gravemente afectado". Resultado verificado en producción: titular "Estudiante de 13 años resulta afectado…" mientras el JSON-LD dice "murió" (contradicción indexable); "164 afectados y 971 afectados" (doble eufemismo incoherente); "fue hallado afectada" (concordancia rota); "el persona gravemente afectada" (gramática rota).
- **Acción propuesta (contenido — requiere aprobación)**: revertir cada caso al término real verificando el hecho. Script de dry-run que liste: slug, frase corrompida, término propuesto, fuente del hecho. Solo entonces aplicar por vía canónica (`PUT /api/admin/news/[id]`), nunca write directo.
- **Hechos ya verificados**: sismos Venezuela 24-jun-2026 (7.2+7.5, miles de fallecidos — AP/BBC); iPhone Duo (Apple, 9-sep-2026). Verificación pendiente para sucesos locales (nombres y cifras).
- **Hecho ya ejecutado (código)**: eliminada la regla "ANTI-PALABRAS SENSIBLES" del prompt del panel y sustituida por instrucción de exactitud factual → no se generan nuevas corrupciones.

### P0.2 Cerrar la fabricación de evidencia editorial (causa raíz de atribuciones vagas)
- **Evidencia**: `panel.html` inyectaba párrafos ("Fuentes cercanas al lugar de los hechos confirmaron…") y citas de especialistas/voceros inexistentes, y los persistía con `updateDoc` directo — saltando MENI, Supervisor, factuality y dejando `contentHash` stale. En el corpus: "autoridades competentes" en 50 artículos; párrafos-plantilla idénticos en ≥17–18; citas/atribuciones no verificables en ~90.
- **Hecho ya ejecutado (código)**: eliminados los bloques de inyección (contexto "verificado", atribución y citas fabricadas) de la función de mejora del panel.
- **Pendiente (propuesta)**: eliminar TODOS los `updateDoc` directos a `noticias` desde `panel.html` (líneas ~5335, ~5672, ~9195, ~9271) y enrutar por `PUT /api/admin/news/[id]` que exige reevaluación + contentHash vigente.

### P0.3 Endpoint abierto `/api/telemetry/ads` — fraude de métricas comerciales
- **Hecho ya ejecutado (código)**: rate limit 60 req/min por IP (best-effort, en memoria, sin persistir IP). Tests: 25/25 verdes.

### P0.4 `/panel.html` servido sin headers de seguridad (clickjackable)
- **Hecho ya ejecutado (código)**: aplicado el bloque completo menos CSP (Firebase inline lo necesita): `X-Frame-Options: SAMEORIGIN`, `nosniff`, HSTS, Referrer-Policy, Permissions-Policy.

### P0.5 Hacer que el render público exija el invariante editorial completo
- **Evidencia**: `isPublicArticle` (`lib/editorial/canonical.ts`) solo exige `aprobadoMeni && publicado && !archived`; NO verifica `supervisorApproved` ni `contentHash` vigente → una mutación directa deja contenido público bajo aprobación stale.
- **Acción propuesta (código)**: `getEditorialDecision` debe exigir `supervisorApproved === true` y `isApprovalCurrent(article)` (o `requiresReevaluation !== true` como mínimo). Pequeño, reversible, con tests del invariante ya existentes (`editorial-invariants.test.ts`).

## P1 — Impacto alto

### P1.1 Auditoría histórica de documentos con aprobación stale
- Buscar docs con `aprobadoMeni=true && publicado=true` pero `contentHash` no coincide con campos actuales, o `supervisorApproved !== true`, o `estado='publicado' && publicado!==true`. Marcar `requiresReevaluation` o reevaluar por vía canónica.

### P1.2 Limpieza de residuo `oaicite` en 9 documentos (clase D)
- Marcador `:contentReference[oaicite:N]{index=N}` persistido en `contenido` canónico. El render lo elimina (`cleanArticleBody` — verificado en producción: 0 ocurrencias en HTML vivo), pero el dato canónico está corrupto. Reparación mecánica con `stripAICitationMarkers` sobre los 9 docs, vía script canónico con dry-run.

### P1.3 Tres artículos con párrafo duplicado ×42 (clase E)
- `investigaciones-…-bluefields`, `tres-ataques-de-pitbull-…`, `dos-fallecidos-…-matagalpa-y-wiwili`: el disclaimer se repite 42 veces dentro del mismo artículo (52–57 párrafos, 10–15 únicos). scoreMeni les dio 100 — falso positivo del auditor, ya documentado.
- **Propuesta**: deduplicar mecánicamente (quedan ~10–15 párrafos únicos) y reevaluar; si el cuerpo residual no sostiene la nota → retirar con la lista de aprobación estándar.

### P1.4 Corrección del auditor interno (MENI)
- **Evidencia**: scoreMeni 89–100 en todo el corpus, incluido 100 a artículos con el mismo párrafo ×42 y concordancia rota. El score mide formato/longitud, no detecta la duplicación masiva ni el eufemismo corrupto.
- **Acción propuesta**: añadir checks a `content-integrity`/`factuality`: (a) párrafo repetido ≥3 veces en un doc → BLOCK; (b) patrón `result(ó|aron) … afectad` + vocabulario de muerte en slug/título → REVIEW/BLOCK; (c) "N afectados y M afectados" → BLOCK.

### P1.5 Separar AUTHORITY_FIELDS de TECHNICAL_FIELDS en `mutation-policy.ts`
- Hoy `aprobadoMeni`, `supervisorApproved`, `contentHash`, `supervisorDecision` son "técnicos" — un caller futuro podría mutarlos sin gate. Solo `guardarConMeni` debe escribir aprobaciones/hash.

### P1.6 `crecimiento-diario.yml` (CI) falla a diario por falta de auth
- Job hace `curl /api/admin/crecimiento` sin header → 401 permanente, entrena a ignorar fallos de CI. Añadir `-H "x-cron-secret: ${{ secrets.CRON_SECRET }}"` o retirar el workflow. Además `deploy-staging` es dead code (condición `develop`, trigger solo `master`).

### P1.7 IP/UA persistente en `analytics_traffic` sin TTL
- `/api/l/[id]` guarda IP cruda + UA + referer; el TTL solo cubre `traffic_log`. Hashear IP o extender retención a `analytics_traffic`. (Las rules de `analytics_traffic` ni siquiera incluyen los campos ip/ua — drift reglas↔código.)

## P2 — Mejoras importantes

### P2.1 Canonical paginado en `/categoria` (ya hecho) + validar en producción tras merge/deploy.

### P2.2 Revisión editorial de 67 artículos clase C
- Prioridad: 12 F1 (solo atribución vaga), Sucesos/Internacionales F0 con muerte, párrafos-plantilla (23 docs: quitar boilerplate), citas sin atribuir en noticias sensibles.

### P2.3 357 artículos con bajada duplicada como primer párrafo (clase B, patrón sistemático)
- Decisión editorial: mantener (patrón común) o diferenciar meta-description de lead. No urgente.

### P2.4 `publicado` debe ser booleano estricto en `guardar-directo`
- `publicado: "false"` produce `estado='publicado'` + pipeline de distribución aunque no sea público. Normalizar/rechazar no-booleanos.

### P2.5 Restringir `editorOverride`
- Solo aplica sobre `REVISAR` (correcto), pero debe exigir motivo obligatorio + usuario registrado en log, y no permitirse si hay señales CRITICAL de factuality.

### P2.6 Rate limiting real
- `X-RateLimit-*` hardcodeado a 60/60 en middleware; `RateLimiter` in-memory se reinicia en serverless. Añadir al mismo límite a `/api/newsletter` (creación ilimitada) y `/api/admin/session`.

### P2.7 Endpoints de inteligencia interna abiertos
- `/api/nios/brief`, `/api/nios/growth` públicos. Gatearlos (admin/cron) o moverlos a SENSITIVE_API_PATHS.

### P2.8 Token por query param
- `/api/articles?token=`, `/api/telegram?secret=`, `cache-purge?token=` → credenciales en logs. Header-only.

### P2.9 Hub pages huérfanas
- `/guia`, `/entidad`, `/autores`, `/mapa-del-sitio` sin enlaces en nav/footer. Añadir al footer.

## P3 — Pulido

- Imagen JSON-LD: 3 ImageObjects con dimensiones fijas para la misma URL → una sola sin width/height inventados.
- `lib/image-loader.ts`: imágenes locales sin optimizar (bypass del resize).
- `/autor/[slug]` force-dynamic → ISR como el resto.
- `robots.txt`: quitar `host:` (ignorado) y el disallow de `/buscar` (noindex ya lo cubre).
- Página duplicada `app/autor/keyling-eliet-rivera-munoz/page.tsx` (shadowed por 301) — dead code.
- `x-nonce` muerto mientras CSP usa `unsafe-inline`.
- `logout()` en panel no revoca `admin_session` cookie (24h). Añadir `/api/admin/logout`.
- iPhone Duo: retirar slug de `BLOCKED_SLUGS` tras la limpieza P1.2 (artículo factualmente correcto — Apple lo presentó oficialmente el 9-sep-2026).
- `x-cron-secret` válido para cualquier `/api/admin/*` → restringir a `/api/cron/*`; sacar `CLEANUP_TOKEN` de `verifyAdminOrCleanupToken` para `guardar-directo`.
- `comentarios/{id}` `allow read: if true` en rules → lectura pública de UGC (riesgo bajo, revisar).

## Lo que NO se hará

- No se despliega Firestore rules (prohibido por la misión; se documenta como propuesta: restringir escritura client-SDK a `noticias`).
- No se elimina contenido ni se hace bulk noindex sin aprobación de la lista E/D.
- No se toca AdSense ni se añaden servicios pagos.
- No se vende posición "portada" (no renderiza) — solo artículos.
- No se mergea/despliega PR #10 sin autorización.

## Verificación ejecutada

- `tsc --noEmit`: limpio.
- `vitest` (ads + pagination): 25/25 verdes.
- Producción (sitemap vs corpus): 581/597 en sitemap; 16 ausentes = 15 noindex correctos + iPhone Duo (bloqueado manual en `seo-toxic.ts` → 410).
- Los 3 slugs bloqueados → 410 verificado en producción.
