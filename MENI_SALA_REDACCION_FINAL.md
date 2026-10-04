# MENI — SALA DE REDACCIÓN DIGITAL (implementada)

## La capa de consolidación

`lib/meni/sala-redaccion.ts` — `buildInformeSala()`: función **pura y determinista** que toma el resultado canónico de MENI (editorialVerdict + factualidad + supervisor + distribución) y produce:

1. **Informe por especialista** — una línea por rol con estado real
2. **Razonamiento del Jefe de Redacción** — por qué se decidió así
3. **Informe al propietario** (`informeTexto`) — lenguaje humano, una decisión clara

**No es un motor nuevo**: reagrupa los hallazgos que los motores existentes ya producen. Sin IA, sin costo adicional, sin cambiar ninguna regla editorial.

## Roles → motores existentes (mapeo real)

| Rol del organigrama | Motor existente | Módulos de hallazgo atribuidos |
|---|---|---|
| Mesa especializada (Nacionales, Sucesos, Deportes, Espectáculos, Internacionales, Tecnología…) | `editorial-brain/profiles/*` + `editorial/profiles/*` | `supervisor` (field=categoria) |
| Editor de estructura (5W+H) | `story-completeness-engine` + `structure-engine` + CHECK LEAD 5W | `quality-gate`, `meni-core`, `supervisor` (contenido), `score:estructura` |
| Editor de fuentes y credibilidad | `factuality-signals` + `trust` + forense | `factualidad`, `forense`, `duplicados`, `editorial-dna` transcripción |
| Editor de lenguaje | `clarity-engine` + content-integrity | `score:claridad`, `score:lenguaje`, `score:redaccion` |
| Editor SEO / Google | `google-engine` + seo + discover + enrich | `score:seo`, `score:titulo`, `supervisor` (field=titulo) |
| Editor de experiencia del lector | `reader-value` + `reader-retention` + `reader-questions` + `editorial-dna` | `score:lector/valor/utilidad`, `editorial-dna`, `editorial` |
| Editor de redes sociales | `lib/distribution/*` | resultados reales por canal (ENVIADO/OMITIDO/ERROR/PENDIENTE) |
| **Jefe de Redacción** | `editorialVerdict` + Supervisor | hallazgos de umbral/score global (no se atribuyen a especialistas) |
| **Supervisor** (control independiente) | `editorial-supervisor` | veredicto propio |
| **CEO Editorial / decisión final** | `editorialVerdict.decision` | PUBLICAR / PUBLICAR_CON_CAMBIOS / REVISAR / BLOQUEAR |

Hallazgos de score/umbral (ej. "score por debajo del umbral") **no se atribuyen a ningún especialista** — los decide el Jefe de Redacción. Esto evita informes falsos como "estructura requiere revisión: score bajo".

## Dónde aparece el informe

- `POST /api/admin/meni/evaluar` → campo `salaRedaccion` en la respuesta
- `POST /api/admin/guardar-directo` → `salaRedaccion` en éxito (con distribución real por canal) y en ambos errores 400 (MENI/Supervisor)
- Panel: `renderInformeSala()` muestra la tarjeta "INFORME DE SALA — MESA DE X" en el diagnóstico de evaluar y en el modal de guardado

## Formato del informe al propietario

```
NOTA: <título>
MESA: <categoría> (perfil: <perfil>)

MESA DE <X>: APROBADO / REVISAR / BLOQUEADO
EDITOR DE ESTRUCTURA (5W+H): ...
EDITOR DE FUENTES Y CREDIBILIDAD: ...
EDITOR DE LENGUAJE Y CALIDAD: ...
EDITOR SEO / GOOGLE: ...
EDITOR DE EXPERIENCIA DEL LECTOR: ...
EDITOR DE REDES SOCIALES: ENVIADO/PENDIENTE por canal

JEFE DE REDACCIÓN: <estado> — <razonamiento>
SUPERVISOR: <verdict>
DECISIÓN: <decisión final>
CAMBIOS REALIZADOS: <autoCorrections | Ninguno>
RECOMENDACIONES: <lista | Ninguna>
```

## La cadena editorial queda

```
PERIODISTA → Mesa → Estructura → Fuentes → Lenguaje → SEO → Lector
  → JEFE DE REDACCIÓN (consolida, deduplica, razona)
  → SUPERVISOR (veredicto, veto si CRITICAL)
  → DECISIÓN (PUBLICAR/CON_CAMBIOS/REVISAR/BLOQUEAR)
  → REVISAR = humano confirma ("Confirmar como Editor Jefe")
  → DISTRIBUCIÓN (texto por canal)
  → Analytics + Learning
```

## Regresión permanente

- `tests/meni-lluvias-repro.test.ts` — la nota real de lluvias: MENI aprueba, Supervisor INVESTIGAR_MAS, REVISAR con override
- `tests/sala-redaccion.test.ts` — informe por categoría (Sucesos, Deportes, Nacionales, Internacionales) + distribución en REDES
