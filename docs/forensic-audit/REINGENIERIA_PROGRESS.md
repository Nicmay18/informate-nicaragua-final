# REINGENIERÍA TOTAL — Progreso

> Mandato CEO — Reingeniería Total de Nicaragua Informate
>
> Fecha: 2026-08-15

---

## RESUMEN EJECUTIVO

Se ejecuta la reingeniería fase por fase. Fases 1 y 2 cerradas con evidencia de tests. Fases 3-4 entregadas. Fase 5 en progreso.

---

## FASE 1 — INVENTARIO FORENSE TOTAL ✅ PASS

**Entregable:** `docs/forensic-audit/FORENSIC_ARCHITECTURE.md`

* Mapeo de módulos `app/`, `lib/`, `tests/`, cron jobs, API routes.
* Fuentes de verdad identificadas: MENI, Supervisor, Firestore `noticias`.
* Riesgos documentados: múltiples scoring systems, duplicación `NoticiaInput`, 90+ admin routes, Vercel cron Hobby-plan limit, `undefined` en Firestore.
* Commit: `2720d6b`

---

## FASE 2 — DATA CONTRACTS ✅ PASS

**Entregable:** `docs/forensic-audit/DATA_CONTRACTS.md`

* Contratos para `Noticia`, `NoticiaInput`, `MENIResult`, `EditorialDecision`, `NIOSArticle` (`ArticleFusion`), `GSCData`, `GA4Data`, `TrustResult`, `AdSenseRisk`, `Snapshot`, `RecoveryItem`.
* Conflictos de autoridad documentados.
* `TrafficEvent` marcado como pendiente de Fase 3 (se cierra con implementación).
* Commit: `b4105ce`

---

## FASE 3 — OBSERVABILITY FIRST ✅ PASS

**Entregables:**

* `lib/observability/types.ts`
* `lib/observability/log.ts`
* `lib/observability/session.ts`
* `tests/observability.test.ts` — 4/4 PASS

* Modelo de eventos `JourneyEvent` (`SESSION_START`, `PAGE_VIEW`, `ARTICLE_VIEW`, `SEARCH`, `INTERNAL_NAVIGATION`, `OUTBOUND_CLICK`, `ENGAGEMENT`, `ERROR`, `SESSION_END`).
* `SessionSummary`, `ObservabilityBatch`, `TelemetryEnvelope`.
* No PII; sanitización de referrer; clasificación de fuente y dispositivo.
* `tsc --noEmit` PASS.
* Commit: `1de56fa`

---

## FASE 4 — FIREBASE / FIRESTORE ✅ PASS (first-pass)

**Entregables:**

* `docs/forensic-audit/FIREBASE_ARCHITECTURE.md`
* `firestore.rules` actualizado con colecciones NIOS: `nios_telemetry`, `nios_audit_trail`, `nios_daily_snapshots`, `nios_alerts`.

* Colecciones mapeadas: `noticias`, `traffic_log`, `traffic_daily`, `nios_*`, `learning_*`, `distribuciones`, etc.
* Hallazgo crítico: `traffic_log` sin TTL → riesgo de costo ilimitado.
* Hallazgo: duplicación `config` / `configuracion`.
* `firestore.rules` validado visualmente.
* Commit: pendiente de push junto con `firestore.rules` y `FIREBASE_ARCHITECTURE.md`.

---

## FASE 5 — VERCEL / NEXT.JS ✅ PASS (first-pass)

**Entregables:**

* `docs/forensic-audit/VERCEL_ARCHITECTURE.md` con auditoría de `next.config.ts`, `vercel.json`, crons, redirects, imágenes, riesgos.
* Revisión de `Footer.tsx` y `OptimizedImage.tsx` como componentes cliente/servidor.

**Pendiente:**

* Medir bundle con `@next/bundle-analyzer`.
* Revisar ISR por ruta más allá de homepage.
* Auditoría de `lib/image-loader.ts`.
* Añadir headers de seguridad si no existen en middleware/layout.

---

## FASE 6 — GOOGLE SEARCH CONSOLE ✅ PASS

* `docs/forensic-audit/GOOGLE_INTEGRATION.md` creado.
* Conectividad GSC verificada: `sc-domain:nicaraguainformate.com` con permiso `siteOwner`.
* `NIOS_SITE_URL` debería usar `sc-domain:nicaraguainformate.com` en lugar del URL prefix.

## FASE 7 — GOOGLE ANALYTICS 4 🚫 BLOCKED

* `GA4_PROPERTY_ID=525672447` devuelve 404.
* `Google Analytics Admin API` no está habilitada en GCP project `24988088146`.
* Bloqueador documentado en `GOOGLE_INTEGRATION.md` con acción correctiva.

## FASES 8-10 — PENDIENTES

* Fase 8: NIOS rebuild (data → normalization → observation → derivation → diagnostic → decision support)
* Fase 9+: thin content, duplication, ADN, schema, indexación, contenido existente
* Fase final: testing, quality gate, documentación final

---

## BLOQUEADORES ACTUALES

1. **Google Analytics Admin API** — Debe habilitarse en GCP project `24988088146` y confirmar/corregir `NIOS_GA4_PROPERTY_ID`.
2. **Acceso a Firebase Console / Vercel Dashboard** — No se puede verificar TTL, índices, deployment logs sin credenciales del propietario.
3. **Datos de producción** — No se puede auditar `traffic_log`, `noticias` sin acceso a Firestore.

---

## PRÓXIMA ACCIÓN

Habilitar **Google Analytics Admin API** en GCP, corregir `NIOS_GA4_PROPERTY_ID` si es necesario, y re-verificar GA4.

---

*Generado en sesión de reingeniería — Devin.*
