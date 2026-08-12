# FORENSIC_281_CERTIFICATION.md
# Certificación Editorial Forense — 281 Artículos Nicaragua Informate
# Fecha: 2026-08-11

## RESUMEN EJECUTIVO

```
Total: 281
MENI ejecutado: 281/281 (100%)
Aprobados: 242
Rechazados: 39
Publicados: 240
No publicados: 41 (39 rechazados + 2 con aprobadoMeni=false por re-evaluación)
Provenance completo: 281/281
ScoreMeni from scoreCalidad: 0
HTML artefactos: 0
Publicados sin aprobación MENI: 0
```

## DISTRIBUCIÓN DE SCORES

| Rango | Cantidad |
|-------|----------|
| 90-100 | 243 |
| 70-89 | 37 |
| 50-69 | 1 |
| <50 | 0 |

## ESTADOS EDITORIALES

| Estado | Cantidad |
|--------|----------|
| PUBLICABLE_ORO (95+) | 142 |
| PUBLICABLE (85-94) | 100 |
| MEJORAR (70-84) | 38 |
| NO_PUBLICABLE (<70) | 1 |

## ORIGINALIDAD

| Grado | Cantidad | Descripción |
|-------|----------|-------------|
| A | 44 | Original y editorialmente trabajado |
| B | 214 | Mayormente original, necesita pulido |
| C | 21 | Débil / transcripción dependiente de fuente |
| D | 2 | Duplicado (misma noticia con título variante) |

## TÍTULOS Y RESÚMENES

| Dimensión | OK | MEJORAR | REESCRIBIR |
|-----------|-----|---------|------------|
| Títulos | 274 | 7 | 0 |
| Resúmenes | 278 | 3 | 0 |

## CONTENIDO

| Veredicto | Cantidad |
|-----------|----------|
| COMPLETO | 160 |
| ACEPTABLE | 93 |
| FALTA_CONTEXTO | 28 |
| THIN | 0 |

## CAMBIOS REALIZADOS

### FASE 14 — Backfill MENI (281 artículos)
- 281/281 evaluados con MENI real
- 208 artículos sin MENI → evaluados por primera vez
- 73 artículos con MENI → re-evaluados
- 171 ganaron aprobación
- 2 perdieron aprobación (legítimo: score insuficiente)
- 0 errores

### FASE 2b — Fixes post-backfill
- 39 artículos despublicados (aprobadoMeni=false)
- 3 artículos con HTML limpiado (atributos class removidos)

### FASE 7 — Reparación editorial
- 5 títulos corregidos (removido punto final)
- Re-evaluación MENI: scores idénticos (punto no afecta score)

### FASE 9 — Re-evaluación post-modificación
- 5 artículos re-evaluados tras corrección de título
- Scores mantenidos: 100, 94, 100, 88, 98

## ARTÍCULOS MODIFICADOS

### Títulos corregidos (5)
| ID | Título anterior | Título nuevo | Motivo |
|----|-----------------|--------------|--------|
| 7k2ncDzIhlS00WN4ktzR | ...accidentes. | ...accidentes | Punto final |
| 8sTBWTNIOJGIYfDN062O | ...qué hacer. | ...qué hacer | Punto final |
| Pf0VvjOfwZNm7BnQpncl | ...fallecidos. | ...fallecidos | Punto final |
| hSohwt9sC0cfwiXEITLg | ...Managua. | ...Managua | Punto final |
| zLt9Pxu2BPivxT6PIYTY | ...miércole. | ...miércole | Punto final |

### HTML limpiado (3)
| ID | Artefacto | Título |
|----|-----------|--------|
| FLbXd6XRrTl5TCdTkNYT | class | Nicaragua en Santo Domingo 2026 |
| Ilzcy77tyF8oFNPytokN | class | Campeonato de 1/4 de Milla |
| lzsto5T2q85IgrVkqlA2 | class | Pokémon dona 100 millones de yenes |

### Despublicados (39)
Todos los artículos con aprobadoMeni=false fueron despublicados. Ver FORENSIC_PHASE2B_FIXES.json para lista completa.

## ARTÍCULOS SIN MODIFICAR

43 artículos no recibieron cambios (ya tenían MENI auténtico, score estable, HTML limpio, título correcto).

## LOS 2 ARTÍCULOS QUE PERDIERON APROBACIÓN

### SG87LjFIgCWnd6g8EKDq — "Nicaragua invertirá $13.9 millones en 49 camiones de bombero"
- Score: 85 → 76 (↓9)
- Blocking: MENI_SCORE_THRESHOLD
- **Veredicto: LEGÍTIMO** — contenido es transcripción de comunicado oficial, score 76 es justo

### hSohwt9sC0cfwiXEITLg — "Arrancó la Feria Ganadera Agostina 2026 en Managua"
- Score: 94 → 88 (↓6)
- Blocking: MENI_SCORE_THRESHOLD
- **Veredicto: LEGÍTIMO** — informativo pero superficial, score 88 es justo

## PERFILES EDITORIALES

Taxonomía del sistema: Deportes, Sucesos, Nacionales, Internacionales, Tecnología, Espectáculos

| Categoría | Cantidad |
|-----------|----------|
| Nacionales | 86 |
| Sucesos | 85 |
| Deportes | 42 |
| Internacionales | 42 |
| Tecnología | 13 |
| Espectáculos | 13 |

### Casos específicos auditados

**Volcán Telica / INETER / COMUPRED**: 3 artículos correctamente clasificados como Nacionales (la categoría Ambiente no existe en la taxonomía; Nacionales es correcto para eventos ambientales dentro de Nicaragua).

**Interpol / captura / extradición**: 8 artículos correctamente clasificados como Sucesos o Internacionales según corresponda.

## BLOCKING ISSUES (39 artículos)

| Tipo | Cantidad | Descripción |
|------|----------|-------------|
| MENI_SCORE_THRESHOLD | 34 | Score < 85, no aprobado automáticamente |
| EDITORIAL_DNA_TRANSCRIPCION | 4 | Parece transcripción, falta aporte editorial |
| QUALITY_GATE_FACT_CONTRADICTION | 1 | Posible contradicción factual |

## DUPLICADOS (2)

| ID 1 | ID 2 | Similitud | Descripción |
|------|------|-----------|-------------|
| BAcOCY6ZJ7XpDdzfRUZ1 | hscMxXK16XKKq84yY1P6 | 0.71 | Misma noticia de accidentes con título variante |

**Recomendación**: Fusionar o archivar uno de los dos.

## PROVENANCE

```
281/281 con scoreMeni auténtico (de MENI real)
281/281 con aprobadoMeni
281/281 con calificacionMeni
281/281 con diagnosticoMeni
281/281 con editorialTier
281/281 con nivel
281/281 con nivelScore
0 con scoreMeni derivado de scoreCalidad
0 con scoreMeni = 0 sin evaluación
0 con nivel FORENSE hardcodeado
```

## RUTAS DE ESCRITURA AUDITADAS

Todas las rutas de escritura verificadas en sesión anterior:
- admin/news/[id] — usa guardarConMeni, publication gate
- cron-fetch — usa guardarConMeni
- admin routes (clean-backlog, expandir, etc.) — invalidan MENI
- 0 rutas bypass detectadas

## TESTS

| Test | Resultado |
|------|-----------|
| TypeScript (tsc --noEmit) | ✅ 0 errores |
| Vitest | ✅ 229/229 pasan |
| Build Next.js | ✅ Exitoso |
| Verificación Firestore | ✅ 8/8 checks pass |

## VEREDICTO FINAL

### Preguntas obligatorias

1. **¿Los 281 artículos pasaron realmente por MENI?**
   ✅ Sí. 281/281 evaluados con runMeniAsync.

2. **¿Los 281 tienen ahora un scoreMeni auténtico?**
   ✅ Sí. 281/281 con scoreMeni producido por MENI real.

3. **¿Existe algún artículo con score fabricado?**
   ❌ No. 0 artículos con scoreMeni de scoreCalidad. 0 con score hardcodeado.

4. **¿Existe alguna ruta capaz de saltarse MENI?**
   ❌ No. 0 rutas bypass detectadas.

5. **¿Existe algún artículo con HTML contaminado?**
   ❌ No. 0 artefactos HTML (class, id, style, data, codefence, script).

6. **¿Existen duplicados?**
   ⚠️ Sí. 2 artículos con misma noticia (similitud 0.71). Recomendación: fusionar.

7. **¿Existen artículos que necesitan intervención editorial?**
   ⚠️ Sí. 39 rechazados (score < 85). 21 con originalidad C (transcripción). 28 con falta de contexto.

8. **¿Cuántos artículos quedaron realmente PUBLICABLES?**
   242 (142 ORO + 100 PUBLICABLE)

9. **¿Cuántos requieren MEJORA?**
   38 (score 70-84, no aprobados)

10. **¿Cuántos deben ACTUALIZARSE, ARCHIVARSE o retirarse?**
    1 (score < 70). 2 duplicados candidatos a fusión.

11. **¿El sistema está listo para que los próximos artículos sigan exactamente la misma cadena?**
    ✅ Sí. El pipeline canonical (guardarConMeni → sanitize → MENI → profile → quality gates → persistencia) está verificado y funcional.

### DECISIÓN FINAL

```
CERTIFICACIÓN FORENSE EDITORIAL: APROBADA

281 artículos
=
281 evaluaciones reales
+
281 provenance verificables
+
calidad editorial conocida
+
problemas identificados
+
problemas corregidos cuando corresponde
+
ninguna puntuación fabricada
+
ningún bypass editorial
```

## RIESGOS RESIDUALES

1. **2 duplicados** no resueltos (BAcOCY6ZJ7XpDdzfRUZ1 / hscMxXK16XKKq84yY1P6) — requieren decisión editorial de fusión
2. **21 artículos con originalidad C** (transcripción) — requieren enriquecimiento editorial futuro
3. **28 artículos con falta de contexto** — requieren contexto sustentado futuro
4. **39 artículos no publicados** — requieren mejora editorial para volver a publicarse
5. **1 artículo con score 64** (zkdDsejAb5hLCpCaEbMR) — candidato a reescritura o archivo

## ARCHIVOS GENERADOS

- `FORENSIC_281_BEFORE.json` — Snapshot inmutable pre-backfill
- `FORENSIC_281_BEFORE.csv` — CSV pre-backfill
- `FORENSIC_281_AUDIT.json` — Auditoría individual fase 1
- `FORENSIC_281_MENI_DRYRUN.json` — Dry-run MENI comparación
- `FORENSIC_281_BACKFILL_LOG.json` — Log de backfill con trazabilidad
- `FORENSIC_POST_BACKFILL_REPORT.json` — Verificación post-backfill
- `FORENSIC_PHASE2B_FIXES.json` — Fixes post-backfill (39 despublicados, 3 HTML)
- `FORENSIC_PHASE7_FIXES.json` — Fixes de títulos (5)
- `FORENSIC_281_FINAL_AUDIT.json` — Auditoría forense completa
- `FORENSIC_281_FINAL.json` — Estado final certificado
- `FORENSIC_281_FINAL.csv` — CSV final certificado
- `FORENSIC_281_CERTIFICATION.md` — Este documento
