# EDITORIAL FACTUALITY — IMPLEMENTATION REPORT

Fecha: 2026-09-25 · Fase 5
Base: `EDITORIAL_BRAIN_10_STORY_EVALUATION.md` (`8d5beb88`)

## 1. Arquitectura final de contenido

```
INPUT externo
 ↓
stripAICitationMarkers (AUTO_REMOVE) ──── aiArtifactsRemoved → provenance
 ↓
runMeniAsync (editorial-brain + analyzers + quality-gate → textoCorregido)
 ↓
stripAICitationMarkers (defensa en profundidad sobre la salida de MENI)
 ↓
detectFactualitySignals → SIGNALS (no decide)
 ↓
makeEditorialDecision (Supervisor — única autoridad)
   CRITICAL  → REVISION_HUMANA  (no publica)
   IMPORTANT → INVESTIGAR_MAS   (no publica, pide evidencia)
 ↓
canonical { titulo, resumen, contenido }  ← única versión persistible
 ↓
Firestore (updateData incluye contenido/resumen canónicos + factuality[])
```

`guardarConMeni` ahora devuelve `canonical` y `updateData` incluye
`contenido`/`resumen` canónicos, `factuality.signals` y `aiArtifactsRemoved`.

## 2. OBJ1 — Una sola versión editorial

| Ruta | Antes | Ahora |
|---|---|---|
| guardar-directo | persistía `meni.articulo.contenido` ✓ | igual (via `canonical.contenido`) |
| news POST | persistía `contenido` **crudo del body** | usa `meniUpdateData.contenido` canónico |
| /api/articles | persistía `contenido` **crudo** | igual que news |
| news/[id] PUT | pisaba con `body.contenido`/`body.resumen` crudos | canonical de meniUpdateData |
| mutation-policy (mutadores) | `ref.update({contenido: merged.contenido})` crudo | `canonical?.contenido || merged.contenido` |

Archivos: `lib/editorial/guardar-con-meni.ts`, `app/api/admin/news/route.ts`,
`app/api/articles/route.ts`, `app/api/admin/news/[id]/route.ts`,
`app/api/admin/guardar-directo/route.ts`, `lib/editorial/mutation-policy.ts`.

## 3. OBJ2 — Barrera factual mínima

Nuevo detector puro `lib/editorial/factuality-signals.ts` (sin IO, sin decisión):

| Código | Severidad | Dispara cuando |
|---|---|---|
| `AI_PROVENANCE_ARTIFACT` | CRITICAL | el input traía marcadores IA ya removidos |
| `EXTRAORDINARY_UNSOURCED_CLAIM` | CRITICAL | "primer modelo/historia/récord" sin atribución ni evidencia |
| `INTERNAL_CONTRADICTION` | CRITICAL | misma métrica de víctimas con valores distintos |
| `UNEVIDENCED_ENTITY` | IMPORTANT | entidad propia + verbo de lanzamiento, sin evidencia |
| `UNSOURCED_MATERIAL_FIGURES` | IMPORTANT | ≥2 cifras materiales sin atribución |
| `NO_ATTRIBUTION` | IMPORTANT | afirmaciones factuales sin atribución ni research |

Evidencia que suprime señales: marcadores de atribución en el texto,
`fuentesComplementarias` extraídas, `research`, `story`.

## 4. OBJ3 — Artefactos de IA

`content-integrity.ts` ahora clasifica cada defecto con `action`:

- `BLOCK`: defectos fabricados existentes (citas plantilla, concat imposible, etc.).
- `AUTO_REMOVE`: `:contentReference[`, `oaicite:N`, `【...†...】`, `cite_turn`,
  `utm_source=chatgpt.com` — patrones reales observados en el corpus (iPhone Duo).
- `REVIEW`: fuga de prompt/disclaimer de IA en texto.

`findBlockingDefects()` = subset BLOCK — es lo que rechaza en las rutas.
`AUTO_REMOVE` ejecuta `stripAICitationMarkers` en `guardarConMeni` (entrada y
salida de MENI) y deja provenance (`aiArtifactsRemoved` + señal CRITICAL).

## 5. OBJ4 — Detección ≠ decisión

El detector no publica ni bloquea: produce `FactualitySignal[]` que entran por
`ArticleContext.factualitySignals` → `makeEditorialDecision` los convierte en
issues `domain: 'FACTUALIDAD'` (nuevo dominio en `IssueDomain`):
- CRITICAL → `REVISION_HUMANA`
- IMPORTANT → `INVESTIGAR_MAS` (FACTUALIDAD agregado a `needsResearch`)

MENI → Quality Gate → Supervisor sigue siendo la única cadena de decisión.

## 6. OBJ5 — confianza:BAJA

Ver `CONFIDENCE_POLICY_ANALYSIS.md`. Resultado: `confianza` cuenta *frases
atributivas*, no fuentes — iPhone Duo obtuvo ALTA siendo fabricado.
**No se cambió la política de producción**; se recomienda usar `factores`/
`queFalta` como señales al Supervisor en una fase posterior.

## 7. OBJ6 — isToxicSlug (documentado, NO migrado)

- **Dónde se calcula:** `lib/seo-toxic.ts` — `BLOCKED_SLUGS` (lista manual,
  3 slugs; fecha del archivo 2026-05-16).
- **Dónde se consume:** `lib/data.ts` — filtra en ~10 consultas públicas
  (home, categorías, relacionadas, sitemap, búsqueda).
- **Efecto:** modifica **visibilidad al lector** — NO modifica `publicado`,
  `estado`, SEO metadata del doc, ni la decisión editorial.
- **Contradicción con la autoridad:** el iPhone Duo está
  `publicado:true, aprobadoMeni:true, scoreMeni:95` e invisible al lector.
  La predicción asociada lo validaría como "acierto" → aprendizaje contaminado.

**Migración conceptual propuesta (NO implementada):**
1. `BLOCKED_SLUGS` → estado editorial real: `estado:'retirado'` +
   `editorialState:'REMOVED_TOXIC'` + `noindex:true` en el doc.
2. `isToxicSlug` en lectura queda como red de seguridad temporal hasta migrar.
3. El retiro debe pasar por mutation-policy (provenance + log) — nunca por
   lista paralela.
4. El validador de predicciones debe excluir docs `estado:'retirado'`.

## 8. OBJ7 — Regresión iPhone Duo

`tests/factuality-barrier.test.ts` modela la **clase** (afirmación
extraordinaria + entidad camelCase sin evidencia + marcador de cita IA),
no el string exacto. Resultado post-fase:

```
Antes:  score 95 · PUBLICABLE ORO · PUBLICAR_CON_CAMBIOS · publicado
Después: artefacto AUTO_REMOVE + AI_PROVENANCE_ARTIFACT (CRITICAL)
         + EXTRAORDINARY_UNSOURCED_CLAIM (CRITICAL) → REVISION_HUMANA
         supervisorApproved=false → no publica
```

## 9. Tests / typecheck / build

- `tests/factuality-barrier.test.ts`: **20/20 nuevos** (artefactos, señales,
  consumo por Supervisor, contenido canónico, regresión iPhone Duo).
- Suite completa: fallos solo en tests de integración de red reales
  (GSC/GA4/Firestore timeouts 60s — preexistentes, flaky, sin credenciales
  completas); tests de esta fase y los de autoridad/publicación: **58/58**.
- `tsc --noEmit`: 0 errores.
- `npm run build`: PASS.

## 9b. Deploy + smoke

- Commit `c0f5fd1b` → master → deploy Vercel prod → `nicaraguainformate.com`.
- Smoke: `/`, `/noticias`, `/feed.xml`, `/sitemap.xml`, artículo real → **200**.
- Sin auth: `expandir-7`, `clean-seo`, `guardar-directo`, `news`, `articles` → **401**.
- No se realizaron escrituras de prueba sobre artículos reales.

## 10. Riesgos restantes

- `INTERNAL_CONTRADICTION` puede marcar evolución legítima de cifras
  ("10 lesionados... luego 14") — por diseño va a REVISION_HUMANA, no a
  rechazo; el humano resuelve. Mitigación posible: ignorar si el segundo
  valor va atribuido temporalmente ("posteriormente", "al cierre").
- `NO_ATTRIBUTION` elevará a INVESTIGAR_MAS notas institucionales cortas sin
  "según/informó" — intencional (la barrera pide evidencia), pero puede
  aumentar carga de revisión.
- `findBlockingDefects` en `news POST` corre sobre el **input crudo**;
  patrones BLOCK que el AUTO_REMOVE eliminaría igual llegan limpios —
  comportamiento correcto (BLOCK nunca se auto-remueve).
- Noticias históricas con artefactos almacenados no se reprocesan
  (fuera de scope) — el strippeo en render sigue protegiendo al lector.
