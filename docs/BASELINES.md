# Baselines — NIOS CEO v2

Líneas base medibles del sistema Nicaragua Informate Operating System a 2025-05-20.

## Inventario técnico

| Métrica | Valor | Fuente |
|---------|-------|--------|
| Total archivos auditados | 1 432 | `docs/HEALTH_MATRIX.md` |
| HEALTHY | 220 (15,4 %) | `docs/HEALTH_MATRIX.md` |
| NEEDS_REPAIR | 658 (45,9 %) | `docs/HEALTH_MATRIX.md` |
| DEAD | 537 (37,5 %) | `docs/HEALTH_MATRIX.md` |
| ORPHAN | 17 (1,2 %) | `docs/HEALTH_MATRIX.md` |
| OUTDATED | 0 | `docs/HEALTH_MATRIX.md` |
| DUPLICATED | 0 | `docs/HEALTH_MATRIX.md` |

## Acoplamiento crítico

Los 5 archivos con más importadores:

1. `lib/logger.ts` — 129 importadores
2. `lib/types.ts` — 121 importadores
3. `lib/firebase-admin.ts` — 108 importadores
4. `lib/auth.ts` — 59 importadores
5. `lib/evergreen.ts` — 45 importadores

Fuente: `docs/DEPENDENCY_GRAPH.md`.

## Verificación

| Prueba | Estado | Detalle |
|--------|--------|---------|
| `npm run type-check` | ✅ OK | `tsc --noEmit` |
| `npm run lint` | ✅ OK | `eslint` 0 advertencias |
| `npm run build` | ✅ OK | Next.js build completo |
| `npx vitest run` | ⚠️ 2 flaky | `admin-news-estado` y `admin-news-hotfix` fallan por timeout en paralelo; pasan al ejecutarse aisladas |

## Baselines de negocio (requieren datos reales)

| KPI | Valor actual | Fuente | Acción |
|-----|--------------|--------|--------|
| Tráfico 24 h | PENDIENTE | Firestore `traffic_daily` | Activar `validateTrafficReader` en `nios-collect` cron |
| Tráfico 7 días | PENDIENTE | `lib/analytics/traffic-reader.ts` | Idem |
| Tráfico 30 días | PENDIENTE | `lib/analytics/traffic-reader.ts` | Idem |
| Artículos indexados | PENDIENTE | Google Search Console | Requiere credenciales |
| CTR promedio | PENDIENTE | GSC / `journey` events | Requiere credenciales |
| Ingresos AdSense | PENDIENTE | AdSense API | Sin integración aún |
| Suscriptores newsletter | PENDIENTE | Firestore `newsletter` | Sin métrica aún |

## Baseline de UX

- Bloque "También te puede interesar" ahora usa clases semánticas `.ni-related*` en `app/article-page.css` y el builder compartido `buildRelatedContentBlock` en `lib/article-links.ts`.
- La ruta `app/api/admin/enrich-links/route.ts` usa el builder compartido.

## Baseline de seguridad

- `lib/auth.ts` acepta `Authorization: Bearer`, `x-cron-secret` y fallback `?token=`.
- `app/api/cron/nios-collect/route.ts` soporta los tres canales.
- Deuda: eliminar `?token=` requiere aprobación humana y configuración Vercel.

