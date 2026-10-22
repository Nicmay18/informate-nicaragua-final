# AUDITORIA_MAESTRA.md — estado inicial, alcance y resumen ejecutivo

Fecha de cierre: 22-oct-2026 · Repo: `Nicmay18/informate-nicaragua-final` · Sitio: nicaraguainformate.com
Este documento consolida; no reemplaza los archivos detallados. `ESTADO_REAL_DEL_PROYECTO.md` sigue siendo la referencia del estado repo↔producción.

## 1. Estado real del sistema (VERIFICADO)

| Componente | Estado | Evidencia |
|---|---|---|
| master | `5fa19c6` (sin cambios esta misión) | `origin/master` |
| PRs abiertos | 8 (#2,#4,#10,#11,#12,#13,#14,#15) | GitHub API, 22-oct |
| Ramas de esta misión | `fix/estabilizacion-forense`, `fix/ci-e2e-gate`, `audit/afectado-p2-evidencia` (sin PR aún) | `git ls-remote` |
| Producción vs master | Código de master desplegado; contenido de DB más nuevo que HTML servido | Age/caché CF + lecturas Firestore |
| Deploys en esta misión | NINGUNO | — |

## 2. Corpus (597 publicados — matriz completa)

`A:131 · B:361 · C:67 · D:35 · E:3` — `AUDITORIA_EDITORIAL_CORPUS.csv` (597 filas), `FORENSIC_ARTICLE_AUTOPSY.md/.json`.

- **Reparados y verificados en DB**: 29+2+22 docs del eufemismo "afectado" (36+56 reemplazos puntuales con backup).
- **Nuevo hallazgo**: residuo adicional ~50–60 ocurrencias en ~14 docs (lote 3 — `INCIDENTES_FACTUALES.md`).
- **3 E** sin tocar (párrafo ×42) — expedientes listos, decisión pendiente.

## 3. Problemas por gravedad

**P0 (hechos/seguridad)**
- CORREGIDO (DB): 92 reemplazos de eufemismo en 51 ocurrencias verificadas una a una; 2 auto-errores rectificados ("cuatro obreros muertos"→"2 muertos y 2 heridos"; "tres afectados"→"tres lesionados").
- CORREGIDO (rama): fabricación de fuentes/citas en panel + regla anti-palabras-sensibles (causa raíz).
- CORREGIDO (rama): /panel.html clickjacking (headers), rate-limit en mutador de telemetría, canonical de paginación, 404s reales, auth en workflow de crecimiento.
- PENDIENTE: purga de caché para que lo corregido sea visible; `isPublicArticle` requiere backfill previo.

**P1 (editorial)**
- Atribuciones vagas masivas ("autoridades competentes" ×50) — causa raíz eliminada; corpus marcado.
- ~50–60 ocurrencias residuales de eufemismo (lote 3, no autorizado).
- Contradicciones documentadas: cifra accidentes-viales; resumen truncado; garbles residuales.

**P2 (SEO técnico)**
- Canonical paginación corregido (rama); páginas fuera de rango con 404 real (rama); sitemaps/robots íntegros; JSON-LD verificado por sonda; canonicals consistentes (784 URLs).

**P3 (transparencia/monetización)**
- /nosotros + JSON-LD coinciden con la estructura real de 3 personas.
- /publicidad con cifras sin evidencia → corrección en PR #10.
- ads.txt + pub-id AdSense presentes en HTML entregado.

## 4. Evaluación de preparación AdSense: **INCONCLUSO**

Requisitos técnicos verificados (ads.txt, pub-id, institucionales, rastreo). Bloqueantes: visibilidad real de las reparaciones (caché), residuo de eufemismo, 3 E, cifras sin evidencia, PRs sin mergear. Sin promesas de aprobación.

## 5. Mapa de documentos

| Doc | Contenido |
|---|---|
| `ESTADO_REAL_DEL_PROYECTO.md` | repo↔producción↔PRs detallado |
| `FORENSIC_ARTICLE_AUTOPSY.md/.json` + `AUDITORIA_EDITORIAL_CORPUS.csv` | matriz por artículo |
| `INCIDENTES_FACTUALES.md` | contradicciones + lote-3 residual |
| `AUDITORIA_ADSENSE.md` | requisitos, hallazgos, preparación |
| `RESULTADOS_QA.md` | pruebas ejecutadas |
| `PENDIENTES_HUMANOS.md` | decisiones del propietario |
| `PLAN_DE_REVERSIÓN.md` | rollback por cambio |
| `AUTOPSIA_FORENSE_TOTAL.md`, `FORENSIC_REPAIR_PLAN.md`, `PLAN_DE_REPARACION_PRIORIZADO.md`, `MONETIZACION_ESTADO.md` | documentos previos vigentes |
| `repair-afectado-decisiones.json` + `.audit/p2-diff-exacto.md` | matriz P2 + diff exacto aplicado |
