# AUDITORIA_FORENSE_FINAL.md — revisión 360° (sin confiar en informes previos)

Fecha: 22-oct-2026 · Método: re-verificación independiente (Firestore fresco, sondas HTTP a producción, inspección de código, npm audit, escaneo completo del corpus). Los informes anteriores se trataron como hipótesis a re-probar, no como verdad.

Este documento consolida y referencia — no duplica los archivos detallados existentes.

## 1. NUEVOS HALLAZGOS — "lo que no vimos antes" (obligatorio)

| ID | Severidad | Hallazgo | Evidencia | Estado |
|---|---|---|---|---|
| N1 | **P1** | **~18-20 enlaces 404 reales** embebidos en bloques "Te puede interesar" de artículos publicados (docs despublicados/borrados: oklahoma, costanera, windows-11, frutinovelas, canal-panamá, larreynaga-afectados, miami-consulado, florinda-meza, taylor-swift, modric, zidane, sawe…). Otros ~8-10 links viejos redirigen correctamente (sufijo `-mxxxxxxx` / slug renombrado) | `curl -sL` 404 verificado por link; `.audit/dead-links.json` | DETECTADO — requiere barrido de enlaces embebidos o regeneración del bloque |
| N2 | P2 | **109 docs con espaciado tipográfico roto** ("Managua , Chontales", "delaFinca") | regex sobre corpus completo | DETECTADO — corregible por lote con backup |
| N3 | P2 | **11 docs con `<strong>` desbalanceado** en HTML almacenado | regex anidado | DETECTADO — impacto visual menor |
| N4 | **P1** | **CVEs de producción**: `next` ≤15.5.27 (crítico), `@sentry/nextjs` alfa (crítico), grpc-js, busboy, node-forge, brace-expansion (altos), prosemirror-view (moderado) | `npm audit --omit=dev` | CORREGIDO EN RAMA — PR #14 (`fix/deps-audit`, next 15.5.28) sin mergear |
| N5 | P2 | **`dateModified` obsoleto** en los ~45 docs reparados: muestra "Actualizado: agosto" para contenido editado el 22-oct — señal de frescura incorrecta para buscadores | HTML artículo: `dateModified 2026-08-08` | DETECTADO — decidir si las reparaciones deben registrar fechaModificacion |
| N6 | P2 | **Autoría inconsistente**: 356 artículos firmados por Maycol (128) y José Luis (228) cuyas bios son técnicas ("Ingeniero en Sistemas… infraestructura/operación"), no periodísticas. + 2 docs firmados "Directora Editorial" (rol, no persona) | `lib/authors.ts` + corpus | REQUIERE HUMANO — ¿escriben realmente o el byline es asignación automática? |
| N7 | P1 | **Lote-3 de eufemismo** (~50-60 ocurrencias, 14-15 docs) formalizado: heridos / muertos-mezcla / damnificados + títulos corruptos congelados en bloques relacionados | `INCIDENTES_FACTUALES.md` §3 + snapshot fresco | REQUIERE AUTORIZACIÓN (lote no aprobado) |
| N8 | P2 | **`el persona gravemente afectada`** residual ubicado exactamente: comerciante-rosita, motocicleta, diriomo | grep corpus fresco | dentro de N7 |

## 2. Reparaciones anteriores re-verificadas

- **P2 (22 docs / 56 reemplazos)**: APLICADO+VERIFICADO por re-lectura post-escritura. Backup + rollback selectivo existen y respetan cambios posteriores.
- **contentHash stale en docs reparados**: **CONSISTENTE POR DISEÑO** (`mutation-policy.ts:85` — edición post-aprobación invalida aprobación; `requiresReevaluation:true` es la señal prevista). NO es un defecto; confirma que el sistema detecta exactamente estas ediciones.
- **Enlaces de autoría**: FALSO POSITIVO corregido — los bylines reales resuelven `/autor/maycol-nicaragua` y `/autor/jose-lopez` (200) vía mapa por nombre; mis 404 eran slugs construidos manualmente.

## 3. Matriz maestra de hallazgos

| Área | Estado real |
|---|---|
| Corpus (597) | A131/B361/C67/D35/E3 + lote-3 residual ~50-60 ocurrencias |
| Factual | Eufemismo principal reparado (92 reemplazos verificados); residuo menor pendiente de lote; contradicción accidentes-viales documentada |
| SEO técnico | Fixes en rama (canonical/404s); canonicals+JSON-LD+sitemaps verificados en producción |
| Seguridad | panel fabricación+headers (rama), rate-limit telemetría (PR#10), endpoints sospechosos confirmados protegidos por middleware + rate-limit propio + SSRF-guard; CVEs deps → PR#14 |
| Autoría | estructura 3 personas coherente; bios vs volumen de firmas = REQUIERE HUMANO; slugs de perfil funcionan |
| Enlaces internos | ~18-20 404 embebidos (N1) + títulos congelados corruptos |
| Ads.txt/AdSense | VERIFICADO (pub-id en HTML, ads.txt, CSP) |
| Producción | sirve caché pre-reparación (eufemismo aún visible públicamente) |
| CI/CD | E2E gate real en rama; vitest 118/1482 PASS local; tsc limpio |
| NIOS/cron | auth crecimiento corregida en rama; jobs internos NO auditados en profundidad esta pasada |
| Performance/móvil/a11y | parcial: lighthouse/axe no ejecutados esta sesión — NO VERIFICADO en profundidad |
| Firestore reglas | auditadas de lectura; sin despliegue propuesto |

## 4. Pruebas ejecutadas

- `tsc --noEmit` PASS · `vitest run` 118/1482 PASS · `npm audit` (2 críticos documentados) · sonda producción 784 URLs · simulación/apply+post-verify P2 · 5 curls verificativos de 404/redirect/author.
- NO ejecutado: Playwright E2E local, Lighthouse, axe, penetración de endpoints.

## 5. Estado por dominio (síntesis)

🟢 CORRECTO: corpus clasificado completo, eufemismo principal reparado y verificado en DB, causa raíz eliminada (en rama), ads.txt/pub-id, autoría por nombre→slug, seguridad de endpoints sospechosos, tests verdes, rollback selectivo.

🟡 PENDIENTE: purga de caché (reparaciones invisibles al público), lote-3 (~60 occ), 3 E, merges de PRs (8+4 ramas), dateModified, 109 typos, 11 `<strong>`, cifras /publicidad, backfill isPublicArticle.

🔴 CRÍTICO (con resolución preparada): CVEs next/sentry en deps de producción — PR #14 sin mergear. Nada activamente explotable confirmado en endpoints.

🆕 DESCUBIERTO: N1-N8 de §1 — especialmente los ~18-20 404 embebidos y las CVEs críticas de producción.

**No declarado "terminado"**: quedan P1 abiertos (lote-3 sin autorización, 404 embebidos, deps sin merge, caché sin purga, 3 E sin decisión).
