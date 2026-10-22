# INCIDENTES_FACTUALES.md — contradicciones y casos pendientes de verificación

Generado: 22-oct-2026 · Rama: `audit/afectado-p2-evidencia`
Estado: registro; ninguno modificado salvo donde se indica `APLICADO+VERIFICADO`.

## 1. Contradicción de cifra sin resolver (BLOQUEADO POR EVIDENCIA)

**`accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte`**
- Titular actual: "Cinco fallecidos" · Resumen: "cuatro fallecidos y un herido" · Slug: "seis-fallecidos"
- Tres valores distintos dentro del mismo documento. El resumen (texto original no corrompido) es la afirmación más detallada y coherente con el cuerpo, pero la cifra real no es verificable externamente.
- Titular y slug **intocados** por orden del propietario. La ocurrencia de Yorlan Sáenz quedó `CONFIRMADO_MUERTE` con confianza MEDIA (depende del 4+1 del resumen; fue trasladado vivo a cirugía).
- Acción pendiente: el propietario debe verificar la cifra con fuente externa y decidir corrección de titular/slug.

## 2. Resumen truncado de origen (PENDIENTE DE REVISIÓN)

**`tres-fallecidos-en-hechos-viales-este-viernes-en-managua-y-granada`**
- Resumen publicado comienza "res personas… figura." — truncado preexistente; P2 corrigió "afectados"→"fallecieron" pero el fragmento roto quedó.
- Requiere reescritura editorial del resumen (autoría humana).

## 3. Residuo de eufemismo "afectado" fuera del lote autorizado (PENDIENTE — lote 3)

Descubierto tras P2: el detector original solo capturaba patrones `verbo+afectado`; quedaron ocurrencias sustantivas y frases corrompidas ("deja un afectado", "el persona gravemente afectada", "signos de afectación"). Inventario sobre snapshot post-P2 (`.audit/afectado-residual-snapshot.json`, 22-oct-2026):

### 3a. Clasificación preliminar HERIDA (sobrevivieron — respaldo del propio doc)

| Doc | Ocurrencias | Evidencia interna |
|---|---|---|
| `familia-lesionada-…matagalpa` | tit + res + 2 cuerpo | "trasladados al hospital… fuera de peligro" → "lesionada(s)" |
| `accidentes-dejan-varios-lesionados-…` | tit + res + ~9 cuerpo | todos trasladados/atendidos → "lesionados" |
| `tres-ataques-de-pitbull-…` | res + ~7 cuerpo | menores atendidos en hospitales → "lesionados" (título ya rectificado en rectificación) |
| `bus-de-jalapa-colisiona-…` | 4 cuerpo | lesionados tras colisión → "lesionadas/lesiones" (incluye frase corrupta "gravedad de sus afectadas") |
| `bus-se-incendia-…` | 2 cuerpo | atendidos por lesiones leves → "lesionados" |
| `accidente-deja-lesionados-…carnavaleros` | 3 cuerpo | vocalista y otros atendidos → "lesionados" |

### 3b. Clasificación preliminar MUERTE / mezcla — requiere revisión caso por caso

| Doc | Ocurrencias | Complicación |
|---|---|---|
| `dos-fallecidos-…motocicleta` | res + ~7 cuerpo | Cuerpo narra ~4 hechos (Chinandega, menor de 12 **herido**, Tipitapa fallecido, Jinotega) — mezcla muertos y heridos y el resumen está corrupto. Mismo nivel de revisión que P2. |
| `nicaraguenses-…costa-rica` | ~7 cuerpo residual | "la gravedad de las afectadas"→"lesiones", "habría sido persona afectada"→"víctima", "la noticia de su afectación"→"muerte" — varias ocurrencias distintas. |
| `comerciante-fallece-…rosita` | ~2 residual | "La persona afectada" = fallecida; "afectada provocada" era "lesión provocada". |
| `estudiante-…diriomo` | ~2 residual | "signos de afectación"→"lesión"; "Atención médica y afectación"→"muerte". |
| `sismos-en-venezuela-cifra-…589` | res + ~4 cuerpo | "589 afectados"→"fallecidos" (Delcy Rodríguez reportó muertes); cuidado: "zona/estado más afectada" es uso legítimo y NO se toca. |
| `naufragio-en-caribe-norte-…` | ~2 residual | "las personas afectadas"→"víctimas"; "las dos personas gravemente afectadas"→"las fallecidas". |
| `doctora-…poptun-peten` | ~2 residual | "la persona afectada" ambiguo (doctora muerta vs acompañante herida) — cuidado de no mezclar identidades. |
| `cinco-accidentes-dejan-dos-muertos-…` | 3 cuerpo | "los afectados" mezcla a los 2 muertos con los trasladados — requiere lectura completa. |
| `tres-motociclistas-mueren-…` | ~2 residual | "personas afectadas viales"→"fallecidos"; revisar cada una. |

### 3c. CONFIRMADO_OTRO (no muerte ni herida — pérdida material)

| Doc | Ocurrencias | Corrección sugerida |
|---|---|---|
| `incendio-arrasa-negocio-…oriental` | 4 | "comerciantes afectados"→"damnificados/perjudicados" (pérdida de mercancía, sin lesiones) |
| `incendio-afecta-a-cuatro-familias-…` | ~3 | "familias afectadas"→"damnificadas" |
| `sismo-de-7-4-…colombia` | ~3 | "personas afectadas"→"damnificadas/heridos" según contexto |
| `investigan-ataque-en-el-riguero-…` | ~2 | "menor terminara afectado"→"herido" |

### 3d. Títulos corruptos incrustados en bloques "Te puede interesar"

Los cuerpos de varios artículos citan titulares de otros docs capturados al publicar:
"Cinco afectados en accidentes viales", "Pareja resulta gravemente afectado en accidente en semáforos de Larreynaga", "Nicaragüense de Ciudad Antigua resulta gravemente afectado en accidente en Miami".
- "Pareja…Larreynaga" y "Ciudad Antigua…Miami" **no tienen doc publicado** en el corpus actual (posiblemente despublicados o renombrados) → referencias congeladas corruptas; reparar el titular fuente no corrige el texto incrustado.
- `dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami`: **titular propio sigue "resultan afectados"** — el lote solo corrigió resumen+cuerpo. Titular pendiente ("fallecen").

**Total residual estimado: ~50–60 ocurrencias en 14–15 documentos.** Todas requieren la misma revisión ocurrencia-a-ocurrencia del proceso P2 antes de cualquier escritura. No hay lote autorizado para estos.

## 4. Verificaciones externas pendientes (NO VERIFICADO)

- Cifra real de `accidentes-viales` (4+1 vs 5 vs 6) — requiere fuente primaria externa.
- Sáenz: muerte apoyada solo en el resumen interno.
- Cifras de audiencia en `/publicidad` (4.3M, 17k/4.7k usuarios) — sin evidencia publicada; corrección ya preparada en PR #10 sin mergear.
