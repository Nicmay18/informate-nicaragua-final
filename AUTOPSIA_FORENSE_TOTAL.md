# NICARAGUA INFORMATE — AUTOPSIA FORENSE TOTAL
Fecha: 2026-10 | Rama: `feat/auspiciadores-directos` @ `dbefa4d1` | Corpus: Firestore `noticias` (614 docs, 597 publicados) | Producción: 784 URLs sondadas, 0 errores.

## 1. VEREDICTO

El sistema técnico está sano (SEO técnico, render, indexación, seguridad de APIs). **El problema real es editorial y de proceso**: una regla anti-palabras-sensibles pensada para AdSense corrompió el vocabulario de muerte en ~29 artículos publicados; el panel legacy fabrica atribuciones y citas y las escribe directo a Firestore saltando todas las barreras; y el auditor interno (MENI) no detecta ni la corrupción ni la duplicación masiva (score 89–100 en todo el corpus, incluido 100 a un artículo con el mismo párrafo ×42). La calidad base del corpus es mejor de lo que sugería "contenido de poco valor": hay nombres, placas, fechas y método transparente en la mayoría de las notas revisadas manualmente. No hay duplicados exactos ni casi-duplicados de texto.

## 2. LAS 10 FALLAS MÁS IMPORTANTES (por impacto real)

| # | Falla | Estado | Impacto |
|---|---|---|---|
| 1 | Regla "anti-palabras sensibles" del generador eufemizó muertes → titulares/cuerpos falsos ("afectado" por "muerto"; "164 afectados y 971 afectados"; "hallado afectada") en 29 artículos | CONFIRMADO en prod | Titulares factualmente falsos indexados; contradicción h1↔meta |
| 2 | `panel.html` fabrica atribuciones/citas ("Fuentes cercanas…", "especialistas señalaron") y las persiste con updateDoc directo saltando MENI/Supervisor/contentHash | CONFIRMADO código + corpus (50 docs "autoridades competentes", ~90 atribuciones vagas) | Evidencia editorial fabricada a escala |
| 3 | MENI/auditor: score 89–100 universal; 100 a artículo con párrafo ×42 y concordancia rota | CONFIRMADO | La barrera de calidad no detecta defectos reales |
| 4 | Render público no exige `supervisorApproved` ni `contentHash` vigente → mutación directa queda pública bajo aprobación stale | CONFIRMADO código | Cadena de integridad editorial rota |
| 5 | 3 artículos con el mismo párrafo repetido ×42 (basura estructural) | CONFIRMADO | Públicos e indexables |
| 6 | `/api/telemetry/ads` mutador público sin auth ni rate limit → inflación de contadores comerciales | CONFIRMADO (ya corregido en código) | Métricas de venta corruptibles |
| 7 | `/panel.html` sin headers de seguridad (clickjacking de consola admin) | CONFIRMADO (ya corregido en código) | Seguridad |
| 8 | `/publicidad` en producción sigue mostrando cifras de audiencia sin evidencia (PR #10 sin mergear) | CONFIRMADO | Credibilidad comercial |
| 9 | Canonicales paginados rotos en `/categoria` (todas apuntan a pág.1) y clamp silencioso en `/tema`/`/entidad` (200 en `?page=9999`) | CONFIRMADO en prod (ya corregido en código) | Equidad de crawl desperdiciada |
| 10 | PII: IP+UA crudos persistidos sin TTL en `analytics_traffic` (`/api/l/[id]`) | CONFIRMADO | Privacidad/retención |

## 3. ARTÍCULOS PROBLEMÁTICOS (resumen — expedientes completos en FORENSIC_ARTICLE_AUTOPSY.md/.json)

- **D (35)**: 29 por eufemismo "afectado" con evidencia textual (slug dice muerte, título dice afectado; doble "afectados" incoherente; concordancia rota) + 9 con residuo `oaicite` en DB (solapa 3). Acción: reparar, no retirar.
- **E (3, candidatos — NO eliminados)**: `investigaciones-por-fallecimiento-en-barrio-old-bank-bluefields`, `tres-ataques-de-pitbull-en-nicaragua-dejan-tres-lesionados`, `dos-fallecidos-en-accidentes-ocurridos-en-matagalpa-y-wiwili`. Cada uno repite el párrafo-disclaimer ×42. Alternativa: deduplicar mecánicamente si los párrafos únicos sostienen la nota.
- **C (67)**: párrafos-plantilla inyectados (23), solo atribución vaga (12 F1), noticia dura sin fuente, citas sin atribuir en contenido sensible.
- **Falsos positivos separados**: iPhone Duo (producto real — Apple 9-sep-2026, verificado); sismos Venezuela (evento real — AP/BBC); Pomares (cobertura secuencial legítima); "persona afectada" en guías legales (uso correcto); accidentes de fin de semana (eventos distintos, no duplicados).

## 4. ARTÍCULOS QUE NO DEBEN TOCARSE

- Los 131 clase A + los 361 clase B solo por patrón bajada-duplicada/relleno menor — pulir no es urgente.
- Cobertura deportiva secuencial (Pomares, ligas) — no son duplicados.
- Guías evergreen sin fuente (Peñas Blancas, Granada colonial, récord policial) — F0 aceptable en features.

## 5. CAUSAS RAÍZ

1. **`panel.html` prompt + "mejora"**: la regla anti-sensibles eufemizó la generación y la herramienta de mejora inyectó evidencia fabricada — dos vectores del mismo origen.
2. **Escritura directa Firestore desde el panel** (Client SDK): saltó el invariante editorial; el render no exige `contentHash` → la corrupción quedó pública e invisible para las barreras.
3. **Auditor que mide formato, no hechos**: score inflado por longitud/metadata/atribución superficial; no chequea duplicación interna ni contradicción título↔cuerpo.
4. **Pasadas masivas históricas** (limpiezas, "mejoras") sin dry-run ni revisión por muestra — el daño se aplicó a escala sin verificación.

## 6–9. SEO / EDITORIAL / SEGURIDAD / ARQUITECTURA

- **SEO técnico**: sano. Sitemap honesto (581 URLs, 15 noindex excluidos correctamente, 0 publicados-no-en-sitemap salvo bloqueo manual), news-sitemap correcto, robots/canonicals/JSON-LD verificados en 784 URLs con 0 errores. Defectos puntuales ya corregidos en código: canonical `/categoria?page=N`, clamp 404 en `/tema`/`/entidad`. Hub pages huérfanas del nav/footer (P2.9).
- **Editorial**: ver §2 y §5. La solución no es más score — es quitar la fabricación (hecho), exigir el invariante en render (propuesto P0.5), y añadir detecciones de duplicación/eufemismo al gate (P1.4).
- **Seguridad**: 2 fallas ya corregidas (ads rate-limit, panel headers). Pendientes: IP en analytics_traffic, `/api/nios/*` abiertos, token en query params, `x-cron-secret` de scope amplio, `CLEANUP_TOKEN` con alcance de publicación, cookie `admin_session` sin revocación.
- **Arquitectura**: doble panel (React + panel.html legacy ~9k líneas con lógica duplicada y escritura directa) es la deuda que permite los P0. Doble flag de publicación (`publicado`/`estado`) ya mitigada en rutas canónicas pero frágil.

## 10. MONETIZACIÓN

| Estado | Detalle |
|---|---|
| Código listo | PR #10 completo (CRUD, banner artículo, telemetría, panel, CSV) — verificado 30/30 tests |
| Mergeado | NO — PR #10 sigue abierto |
| Desplegado | NO — prod: `/api/telemetry/ads` 404, panel sin pestaña Publicidad |
| Verificado en prod | NO |
| Puede venderse HOY | Banner en artículos US$20/14d — solo tras mergear PR #10 y desplegar |
| No vender | Posición "portada" (no renderiza), cifras de `/publicidad` en prod (sin evidencia) |

## 11. PLAN DE REPARACIÓN → `FORENSIC_REPAIR_PLAN.md` (P0–P3)

## 12. CAMBIOS REALMENTE HECHOS (código, en esta rama)

1. `panel.html`: eliminada inyección de contexto/atribución/citas fabricadas en la función de "mejora" (−30 líneas).
2. `panel.html`: regla "ANTI-PALABRAS SENSIBLES" sustituida por "EXACTITUD FACTUAL" en el prompt del generador.
3. `middleware.ts`: headers de seguridad completos (menos CSP) en `/panel.html`.
4. `app/api/telemetry/ads/route.ts`: RateLimiter 60/min por IP.
5. `app/categoria/[slug]/page.tsx`: canonical self-referencial + noindex en paginadas (política igual a `/noticias`).
6. `app/tema/[slug]/page.tsx` + `app/entidad/page.tsx`: `resolvePage` → 404 real fuera de rango; canonical añadido a `/entidad`.

## 13. CAMBIOS PENDIENTES (con motivo)

- Reparar 29 artículos D por eufemismo → requiere aprobación (contenido).
- Dedup/retiro de 3 artículos E → requiere aprobación.
- Limpiar residuo oaicite en 9 docs → script canónico con dry-run.
- Endurecer `isPublicArticle` con `contentHash`/`supervisorApproved` → propuesto, no aplicado aún.
- Eliminar `updateDoc` directos de `panel.html` → mayor cirugía, propuesta P0.2.
- Mergear PR #10 + deploy → requiere autorización.
- Reglas de Firestore → prohibido en esta misión; documentado como propuesta.

## 14. ELEMENTOS NO VERIFICADOS

- Si las cuentas del panel tienen el custom claim `admin` (los updateDoc directos fallarían con permission-denied si no).
- Verificación factual individual de sucesos locales (nombres/cifras) — revisión humana pendiente por nota.
- CWV reales (solo lab, no RUM agregado).
- Origen exacto de cada frase fabricada en el corpus (panel vs script batch vs generación) — el patrón coincide con las funciones del panel, sin trazabilidad por documento.

## 15. VERIFICACIÓN FINAL

- `tsc --noEmit` limpio; `vitest` ads+pagination 25/25; sonda HTTP de producción 784 URLs / 0 errores / 778×200.
- CI: sin `continue-on-error` en gates críticos (lint, vitest, build, summary) — solo Playwright/Lighthouse no-gates. Defecto: `crecimiento-diario.yml` falla a diario por falta de auth (P1.6).
- Nada destructivo ejecutado. Ningún deploy. Ningún cambio en Firestore.
