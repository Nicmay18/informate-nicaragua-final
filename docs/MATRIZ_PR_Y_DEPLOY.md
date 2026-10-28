# MATRIZ PR Y DEPLOY — verificado 2026-10-27

Fuente: GitHub API (`pulls`, `check-runs`, `branches/master/protection`) + curl a producción + Firestore read-only. Ningún estado se asume de informes anteriores.

## Producción

| Ítem | Valor |
|---|---|
| master | `5fa19c68` |
| Último deploy prod | merge #9 (11-oct) |
| Protection | `enforce_admins: true` + 1 review + checks: Lint & TypeScript, Unit & Integration Tests, Build Next.js, CI Summary |

## PRs abiertos

| PR | Rama | SHA | Problema | Checks req. | Otros checks | Review | Prod | Riesgo si no actúa | Acción |
|---|---|---|---|---|---|---|---|---|---|
| [#11](https://github.com/Nicmay18/informate-nicaragua-final/pull/11) | `fix/depto-cola-bloqueada` | `1df25d1b` | Cola NIOS: claim saturado de completados → 0 jobs procesables | ✅×4 | E2E✅ LH✅ Vercel✅ | 0 | No | Cola +10/día (317 acumulados, último procesado 22-sep) | Aprobar+merge **primero** |
| [#13](https://github.com/Nicmay18/informate-nicaragua-final/pull/13) | `fix/admin-session-opaca` | `3908093e` | Sesión opaca HMAC, SHA-256 padding, cron-secret acotado a 5 rutas, meta AdSense | ✅×4 | E2E✅ LH✅ Vercel✅ | 0 | No | Cron-secret = llave admin total sigue en prod | Aprobar+merge segundo; post: login + meta + rechazo cron |
| [#12](https://github.com/Nicmay18/informate-nicaragua-final/pull/12) | `fix/seo-tecnico` | `6e196bb3` | Artefactos de truncamiento en títulos | ✅×4 | E2E✅ LH✅ Vercel✅ | 0 | No | SEO: títulos con artefactos | Aprobar+merge; post: muestra de títulos |
| [#14](https://github.com/Nicmay18/informate-nicaragua-final/pull/14) | `fix/deps-audit` | `5f779280` | Next 15.5.28 + parches semver | ✅×4 | E2E✅ LH✅ Vercel✅ | 0 | No | Vulnerabilidades con fix compatible sin aplicar | Aprobar+merge; post: `next` version en build |
| [#10](https://github.com/Nicmay18/informate-nicaragua-final/pull/10) | `feat/auspiciadores-directos` | `ebf9ade1` | Publicidad directa vendible | ✅×4 | E2E✅ LH✅ Vercel✅ | 0 | No | Sin producto de ingresos en prod | Aprobar+merge; luego `firebase deploy --only firestore:rules` **solo con autorización** |
| [#15](https://github.com/Nicmay18/informate-nicaragua-final/pull/15) | `feat/negocios-mvp` | `ea669a05` | Directorio comercial + pilotos + campañas auditadas | ✅×4 | E2E✅ LH✅ Vercel✅ | 0 | No | Segundo producto sin lanzar | Aprobar+merge (rebase si #10 entró antes: `publicidad/page.tsx`, `panel.html`) |
| [#4](https://github.com/Nicmay18/informate-nicaragua-final/pull/4) | `fix/meni-evidence-profile-source-20261002` | `19752fe7` | Evidencia MENI Nacionales | Lint✅ Tests✅ Build✅ | E2E❌ LH❌ (02-oct, continue-on-error) | 0 | No | Bajo | Re-correr CI o cerrar si quedó obsoleto |
| [#2](https://github.com/Nicmay18/informate-nicaragua-final/pull/2) | `fix/vercel-runtime-errors` | `22cbeb75` | Errores runtime list-all/entidades | sin CI moderno (24-sep) | Vercel✅ | 0 | No | Probablemente obsoleto | Verificar si el error sigue; cerrar o rehacer |

## Dependencias entre PRs

```
#11 ── aislado (lib/departamento-central + test)
#12 ── aislado (lib/formateo.ts + test)
#14 ── aislado (package-lock.json; rebase si otro PR toca deps)
#13 ── app/layout.tsx ═══════════════════════╗
#10 ── app/layout.tsx, publicidad/page.tsx, ║ public/panel.html, firestore.rules
#15 ──                 publicidad/page.tsx, ═╝ public/panel.html, sitemap.ts, AdminNav
fix/estabilizacion-forense (sin PR) ── middleware.ts, panel.html, ci.yml → conflicto triple
```

- `#15` usa `isAdminRequest` de `lib/auth` — firma intacta en #13 → sin conflicto semántico.
- `#15` necesita `ADMIN_SESSION_SECRET` solo como refuerzo: cae a `ADMIN_API_KEY` si no existe → funciona sin #13.

## Orden de merge recomendado

1. **#11** (riesgo operativo creciente, aislado)
2. **#13** (riesgo de seguridad activo, aislado excepto layout.tsx)
3. **#12**, **#14** (aislados)
4. **#10** → después deploy de `firestore.rules` con autorización
5. **#15** → rebase si #10 mergeó primero (resolver `publicidad/page.tsx` + `panel.html`: conservar bloques de ambos)

## Post-merge: verificación por PR

| PR | Verificación |
|---|---|
| #11 | SHA en Vercel prod → `node .audit/nios-cola-real.cjs` en ≥2 mediciones separadas: `pending↓`, `completed↑`, `running` transitorio, dedupKey sin duplicados, heartbeat `jobsCompleted>0` |
| #13 | Login real → cookie `admin_session` opaca (no contiene API key); `curl /` muestra meta `google-adsense-account`; `x-cron-secret` en `/api/admin/negocios` → 401 |
| #12 | Muestra de las URLs corregidas sin `…` ni artefactos |
| #14 | Build prod con Next 15.5.28 |
| #10 | CRUD auspiciador en `/panel`, banner con `rel="sponsored"`, telemetría dedup, Rules desplegadas |
| #15 | `/negocios` 200 vacío → crear+aprobar perfil de prueba autorizado → visible, sitemap lo incluye, clic wa.me agrega a `negocios_daily`, CSV descarga |
