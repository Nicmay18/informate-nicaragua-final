# HANDOFF DE CIERRE — Nicaragua Informate (MENI 2.1.1 + NIOS)

Documento breve de entrega para operar sin Devin. Complementa (no sustituye)
`docs/ENTREGA_FINAL.md` y `docs/OPERACION_SIN_DEVIN.md`.

---

## 1. MENI 2.1.1

**PR de cierre:** [#24 `fix/meni-pulido-2-1-1`](https://github.com/Nicmay18/informate-nicaragua-final/pull/24) — checks verdes, mergeable. Incluye el fix de fuentes (`next/font/local`) que eliminó el crash intermitente de build en Vercel.

### Decisiones editoriales implementadas (principio rector)

> Integridad > evidencia > relevancia > utilidad > SEO > score.
> MENI ayuda a escribir mejor; nunca obliga a escribir para el algoritmo.

| Regla | Implementación | Archivo |
|---|---|---|
| Verbos noticiosos | Léxico ampliado (~80 infinitivos: elevar, llamar, instar, reconocer, exhortar, sancionar, instalar…) | `lib/meni/anti-clickbait/index.ts` |
| Longitud de titular | Bandas: 40–70 óptimo / 35–39 aceptable / 30–34 y 71–90 advertencia (**SUGERENCIA**) / <30 y >90 problema | `lib/meni/editorial-brain/index.ts` |
| Severidad | `esSugerencia` — las sugerencias se muestran pero **nunca** cambian el veredicto ni el score | `lib/meni/editorial-brain/index.ts` |
| Llamado ≠ decisión | `detectarActoComunicativo()` → `llamado|cambio|hecho`; preguntas de consecuencia → `no_aplicable` en llamados | `lib/meni/editorial-brain/reader-questions-engine.ts` |
| Cita textual | OPCIONAL en perfil nacional/política; atribución + paráfrasis fiel = evidencia válida | `lib/meni/forensic.ts` |
| Fuente incompleta | `dudasPendientes` registra "La fuente no especifica este elemento" — informativo, sin penalización | `lib/meni/editorial-brain/story-completeness-engine.ts` |
| Transiciones | Solo alerta por repetición real (mismo conector ≥2 o ≥3 en total); "sin embargo" aislado es correcto | `lib/meni/editorial-brain/index.ts` |
| Lenguaje emocional | El texto entrecomillado/citado se excluye del detector de relleno (es voz de la fuente) | `lib/meni/editorial-brain/index.ts` |
| Clasificación deportiva | `tipoEvento: 'instalacion'` para tecnología/infraestructura (TrackMan); preguntas de partido → no aplicables | `lib/meni/sports-classifier.ts` |
| Checklist suceso/persona | Solo si la nota trata un incidente o protagonista humano (no aplica a comunicados) | `lib/meni/editorial-brain/index.ts` |
| UI | Chips Cumple / Sugerencia / Revisar; "Datos insuficientes" cuando falta evidencia | `app/panel/meni/page.tsx` |

### Regresiones históricas

`tests/meni-pulido-2-1-1.test.ts` — **32 tests** que bloquean:
S&P (verbo `eleva` + atribución), GRUN (llamado ≠ regulación, `sin embargo`, cita oficial atribuida), TrackMan (instalación en presente **y pasado**: `instaló`/`instala`), titular 38/33/29 chars, paráfrasis ≠ transcripción, explicación causal de `puntosPerdidos`, severidad no-bloqueante.

### Cómo ejecutar

```bash
npx vitest run tests/meni-pulido-2-1-1.test.ts   # solo regresiones MENI
npx vitest run                                    # suite completa (~1740 tests)
npx tsc --noEmit && npx eslint . --ext .ts,.tsx --max-warnings 0
npm run build
npx tsx .audit/meni-casos-finales.ts              # validación funcional de los 5 casos
```

### Qué NO cambiar sin revisar regresiones

- `senalInstalacion`/`senalTecnologia` en `sports-classifier.ts` — orden: `instalacion` se evalúa **antes** que partido/serie/torneo (esas palabras aparecen como contexto).
- `detectarActoComunicativo` — si una señal de cambio ("en vigencia", "regulación") aparece, el acto es `cambio` aunque haya llamado: prioridad a la evidencia fuerte.
- Bandas de titular — las bandas intermedias deben seguir siendo `esSugerencia`; volverlas acciones reintroduce la penalización rígida.
- `MIN_APPROVED_SCORE = 90` en `lib/meni/scoring.ts` y `MIN_DNA_SCORE = 70` en `editorial-dna/engine.ts` — umbrales deliberados; una nota 89 con `publicar: true` es *publishable con mejoras*, no rechazada.
- La separación bloquear/revisar/sugerir: solo integridad (clickbait real, transcripción real, dato sin fuente) puede bloquear.

---

## 2. NIOS

**PR:** [#23 `fix/...nios...`](https://github.com/Nicmay18/informate-nicaragua-final/pull/23) — abierto, mergeable, checks verdes. **No mezclado con MENI.**

Correcciones (causa raíz verificada en producción):

- **Inventario `0 artículos`:** `loadNoticiasFromFirestore` no proyectaba `publicado`/`archived` → clasificador marcaba todo inconsistente. Post-fix sonda prod: **494 publicados / 6 archivados**.
- **Heartbeat `daily-report`:** el reporte corría vía cron `departamento-daily` (06:00) pero el heartbeat lo escribía el job encolado, hambriento tras ~180 P0. Ahora el cron escribe el heartbeat y el scheduler no duplica.
- **Alertas zombie:** `nios_alerts` no tenía ciclo de vida → el watchdog las resuelve cuando el componente se recupera (historial intacto).
- **Incidentes `Cola…NNN`:** variantes numeradas se consolidan en el incidente canónico.
- **`claimNextJob` `limit(200)` sin orden** → paginación estable por `documentId` (los jobs P1 ya no quedan fuera de la ventana).
- **"Lo que resolví" vacío** → `getIncidentsSummary` expone `resolvedItems`.
- **NIOS—STALE permanente** → ahora compara invalidación vs `collectedAt` del snapshot, no vs "ahora".
- **AdSense:** texto aclarado — `DISABLED_BY_SCOPE` = ausencia de integración API, **no** rechazo de Google.

### Pendientes conocidos NIOS (post-merge, por diseño)

1. Backlog de cola (~250 jobs): los P0 baratos drenan primero; `daily-report` pendientes drenan como `skipped`. ~10 días a ritmo normal. **No acelerar manualmente.**
2. El próximo `nios-collect` tras el merge produce el primer snapshot con inventario real.
3. Métricas históricas vacías permanecen (son historia real); solo los snapshots nuevos llevan inventario.

---

## 3. Cloudflare — PENDIENTE EXTERNO (propietario)

**Estado verificado (última comprobación):** `GET /api/admin/estado` → primera `EXPIRED`, segunda `HIT` — **el bypass de `/api/*` aún NO está aplicado.**

- Qué hacer: Caching → Cache Rules → regla `bypass-admin-panel` → agregar patrón OR `URI Full wildcard *nicaraguainformate.com/api*`.
- Verificar: dos `curl` seguidos → segundo debe ser `DYNAMIC`, nunca `HIT`.
- **Regla que NO debe volver:** ninguna caché que cubra `/api/*`, `/admin/*`, `/panel/*` — mientras exista, respuestas autenticadas quedan públicas 4 h.
- `/panel*` y `/admin*` ya tienen bypass; `/api*` es el único hueco.

---

## 4. Riesgos conocidos (documentados, NO corregir a última hora)

- **Vulnerabilidades npm pendientes:** revisar con `npm audit` periódicamente; **nunca** `npm audit fix --force`.
- **Sentry:** warnings no fatales — `withSentryConfig` deprecado, falta hook `onRequestError`, `sentry.client.config.ts` → `instrumentation-client.ts`. PR #22 abierto con la migración.
- **Lighthouse/performance:** baseline en `docs/BASELINES.md`; advertencias de caché webpack y edge-runtime son conocidas y no bloquean.
- **Credenciales externas:** GitHub token en `.env.local` expira (dotenv tokens devuelven 401; usar el credential manager de git). Vercel OIDC y tokens de cleanup rotan con el entorno.
- **PRs abiertos:** #20 (docs/sondas NIOS), #21 (saneamiento `completeJob`), #22 (Sentry), #23 (NIOS), #24 (MENI) — todos mergeables; la protección exige 1 aprobación del propietario.
- **Merge:** GitHub no permite auto-aprobarse; con `enforce_admins: true` el admin también necesita aprobación externa o el flujo documentado en `docs/ENTREGA_FINAL.md` §7.

---

## 5. Verificación final (fecha de cierre)

| Check | Comando | Resultado |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | 0 errores |
| ESLint | `npx eslint . --ext .ts,.tsx --max-warnings 0` | 0 errores |
| Tests | `npx vitest run` | ~1740 verdes, 0 fallos |
| Build | `npm run build` | exitoso |
| Checks CI PR #24 | GitHub check-runs en `bc0c3c3f`+ | todos `success` |

> Los contadores exactos de tests figuran en el informe de cierre de Devin; el
> requisito contractual es 0 fallos, no un número mágico.
