# MATRIZ PR Y DEPLOY — verificado 2026-10-28

Fuente: GitHub API (`.audit/cierre-status.cjs` → `.audit/cierre-status.json`), curl a producción, Firestore read-only. Nada se asume de informes anteriores.

## Producción

| Ítem | Valor |
|---|---|
| `master` | `5fa19c68` |
| Deploy Production (GitHub Deployments API) | `5fa19c68` — 2026-10-11 21:30 UTC |
| Protection | `enforce_admins: true` · `required_approving_review_count: 1` · `required_conversation_resolution: true` · checks requeridos: Lint & TypeScript, Unit & Integration Tests, Build Next.js, CI Summary |
| Colaboradores | `Nicmay18` (admin) — único |
| Consecuencia | el autor no puede aprobarse; **ningún PR es fusionable hasta que exista un segundo revisor o se ajuste la regla** (decisión del propietario, ver `ENTREGA_FINAL.md` §7) |

## PR de integración (el único que hay que aprobar)

| PR | Rama | Contiene | Checks requeridos | Review | Prod |
|---|---|---|---|---|---|
| **#17** | `release/cierre-final` | #11 + #13 + #12 + #14 + #10 + #15 + #16 fusionados sin conflictos, más correcciones de cierre (E2E con cookie HMAC, fixture con noticia sintética, CI con E2E real como gate, `npm audit fix` semver-seguro) | ver estado en el PR (CI corre en GitHub al abrirlo) | 0 — bloqueo humano | No |

## PRs individuales (quedan superseded por #17)

| PR | Rama | SHA | Problema que resuelve | Checks req. (API 2026-10-28) | Review | Prod | Riesgo de no actuar | Acción |
|---|---|---|---|---|---|---|---|---|
| [#11](https://github.com/Nicmay18/informate-nicaragua-final/pull/11) | `fix/depto-cola-bloqueada` | `1df25d1b` | Cola NIOS: query requiere índice compuesto → 0 procesados desde 22-sep | 4/4 ✅ (`mergeable_state: blocked`) | 0 | No | Cola +10/día, 315 pendientes, 56 incidentes activos | Cerrar al mergear #17 |
| [#13](https://github.com/Nicmay18/informate-nicaragua-final/pull/13) | `fix/admin-session-opaca` | `3908093e` | Cookie opaca HMAC, SHA-256 padding, cron-secret acotado, meta AdSense | 4/4 ✅ | 0 | No | Credencial cron = admin total en prod | Cerrar al mergear #17 |
| [#12](https://github.com/Nicmay18/informate-nicaragua-final/pull/12) | `fix/seo-tecnico` | `6e196bb3` | Títulos con artefactos de truncamiento | 4/4 ✅ | 0 | No | SEO medio | Cerrar al mergear #17 |
| [#14](https://github.com/Nicmay18/informate-nicaragua-final/pull/14) | `fix/deps-audit` | `5f779280` | Next 15.5.28 + parches | 4/4 ✅ | 0 | No | Medio | Cerrar al mergear #17 |
| [#10](https://github.com/Nicmay18/informate-nicaragua-final/pull/10) | `feat/auspiciadores-directos` | `ebf9ade1` | Publicidad directa vendible | 4/4 ✅ | 0 | No | Sin producto de ingresos | Cerrar al mergear #17; luego Rules con autorización |
| [#15](https://github.com/Nicmay18/informate-nicaragua-final/pull/15) | `feat/negocios-mvp` | `ea669a05` | Directorio comercial + pilotos + pagos auditados | 4/4 ✅ | 0 | No | Segundo producto sin lanzar | Cerrar al mergear #17 |
| [#16](https://github.com/Nicmay18/informate-nicaragua-final/pull/16) | `docs/entrega-final` | `54e81808` | Documentación + kit comercial | 4/4 ✅ (E2E informativo ❌: corría `npm run dev` contra prod; corregido en #17) | 0 | No | — | Cerrar al mergear #17 |
| [#4](https://github.com/Nicmay18/informate-nicaragua-final/pull/4) | `fix/meni-evidence-profile-source-20261002` | `19752fe7` | Regex evidencia MENI Nacionales | `behind` master; E2E/LH ❌ (02-oct) | 0 | No | Ninguno | **Cerrar: obsoleto** (abajo) |
| [#2](https://github.com/Nicmay18/informate-nicaragua-final/pull/2) | `fix/vercel-runtime-errors` | `22cbeb75` | `getAll()` vacío, `list-all` | sin CI moderno | 0 | No | Ninguno | **Cerrar: obsoleto** (abajo) |

### Texto sugerido para cerrar #2

> Cerrado sin merge: ambos fixes ya están en `master`. El guard de `getAll()` vacío entró en `5dcd5fc4`/`95d3f5d0` (`lib/meni/knowledge-base/entity-page.ts` L74-78). `app/api/list-all/route.ts` fue reescrito con filtro `estado=='publicado'` y `unstable_cache`, que cubre y supera este cambio. La rama se conserva.

### Texto sugerido para cerrar #4

> Cerrado sin merge: `master` ya contiene patrones de evidencia más amplios para Nacionales (`9bc7f059`), y `tests/meni-forensic-evidence.test.ts` pasa 7/7 sobre el árbol actual sin los cambios de esta rama. La rama está `behind` master; se conserva por si se quiere rescatar algún patrón concreto.

## Ramas sin PR

| Rama | Contenido | Estado respecto a #17 |
|---|---|---|
| `fix/ci-e2e-gate` | E2E como gate, `x-cron-secret` en `crecimiento-diario.yml`, borra `deploy-staging` | El gate E2E queda cubierto por #17 (de forma más estricta: fixture aislada). El header en `crecimiento-diario.yml` y la limpieza de `deploy-staging` **no** están en #17 — mini-PR posterior si se desea |
| `fix/estabilizacion-forense` | auditoría forense grande (editorial + middleware + ci.yml) | Conflicto seguro con #17 en `middleware.ts`, `public/panel.html`, `.github/workflows/ci.yml`. Quien lo retome debe rebasar sobre `master` post-#17 |
| `audit/afectado-p2-evidencia` | evidencia P2 | Solo documentación |

## Solapes reales entre PRs (medidos con `git merge`, no con listas de archivos)

```
#10 ↔ #13  app/layout.tsx            → regiones distintas, auto-merge limpio
#10 ↔ #15  app/publicidad/page.tsx   → regiones distintas, auto-merge limpio
#10 ↔ #15  public/panel.html         → listas de navegación distintas, auto-merge limpio
#13 ↔ #15  lib/auth.ts (consumidor)  → sin conflicto; pero el E2E de #15 asumía cookie=API key → corregido en #17
```

## Verificación post-deploy (después de mergear #17)

| Área | Cómo verificar | Criterio |
|---|---|---|
| Deploy | Vercel → Deployments → Production: SHA = `master` | SHA coincide |
| NIOS | `node .audit/nios-cola-real.cjs` día +1 y +2 | `pending` baja, `completed` sube, `scheduler` heartbeat `processed > 0` |
| Seguridad | login en `/panel.html`; DevTools → cookie `admin_session` | formato `exp.b64.hex`, no el API key; `curl -H "x-cron-secret: X" /api/admin/negocios` → 401 |
| AdSense | `curl -s https://nicaraguainformate.com | grep google-adsense-account` | meta presente (≠ aprobación) |
| Auspiciadores | `/panel.html` → pestaña Publicidad → crear, activar, ver banner con `rel="sponsored"` | impresión/clic suman en `ads_daily` |
| Negocios | `/negocios` 200 vacío → `/admin/negocios` crear+aprobar perfil **real autorizado** → visible, en sitemap, clic wa.me en `negocios_daily`, CSV | ningún dato sintético en prod |
| Rules | `firebase deploy --only firestore:rules` **solo con autorización** | `views` ya no escribible desde cliente |
