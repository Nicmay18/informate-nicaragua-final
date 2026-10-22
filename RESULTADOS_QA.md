# RESULTADOS_QA.md — pruebas ejecutadas y resultados reales

Fecha: 22-oct-2026 · Rama: `audit/afectado-p2-evidencia` (master + ramas de fix pendientes de merge)

## Ejecutadas esta sesión

| Prueba | Comando | Resultado |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | **PASS** — limpio tras eliminar `.next/types` obsoleto (artefacto de build de otra rama; no era error del código) |
| Vitest | `npx vitest run` | **PASS — 118 archivos, 1,482 tests, 0 fallos** (incluye ads telemetry, panel, SEO, NIOS, growth) |
| Sonda producción | scripts/forensic (784 URLs) | **PASS** — 0 errores 5xx/4xx inesperados; 778×200 |
| Simulación P2 | `repair-afectado-p2.mjs` (sin --apply) | **PASS** — 22/22 aplicables, 0 drift, 0 dobles, MANTENER excluidos |
| Post-verificación P2 | re-lectura Firestore tras apply | **PASS** — 22/22 `APLICADO+VERIFICADO`, contenido almacenado = esperado |

## Ejecutadas en sesiones previas (registro)

- ESLint en archivos modificados — sin errores bloqueantes.
- Playwright E2E: **NO ejecutado localmente** (limitación declarada); en CI quedó convertido en gate real (`fix/ci-e2e-gate`, sin merge).
- Lighthouse CI: workflow existente; sin nueva ejecución esta sesión.

## No ejecutadas y por qué

- **E2E completo en producción** — requiere Playwright instalado localmente; el gate real quedará activo cuando `fix/ci-e2e-gate` se mergee.
- **Preview deploy** — no autorizado.
- **Pruebas de accesibilidad automatizadas (axe)** — no instaladas; hallazgos de a11y de PR #10 verificados por diff.

## Datos relevantes

- `tsc` sobre `.next/types` generado en otra rama produce falsos errores (rutas de PR #10 inexistentes localmente). Regenerar `.next` o limpiar `types` antes de evaluar — documentado para quien corra typecheck cruzando ramas.
