# CEO MEMORY

Estado: **OPERATIVO** (2026-08-30)

## 1. Defecto P0 resuelto

El reporte anterior mostraba:

```text
autonomyReport.MEMORY = DEAD
```

Causa raíz: `recordCeoLoopRun` en `lib/nios/ceo-memory.ts` intentaba escribir el registro del ciclo en Firestore, pero el objeto contenía campos `undefined` y valores no serializables que Firestore rechazaba silenciosamente.

Reparación:

```typescript
export async function recordCeoLoopRun(record: Omit<CEOLoopRecord, 'id' | 'kind'>): Promise<string> {
  const ref = db().collection('nios_memory').doc();
  const cleanRecord = JSON.parse(JSON.stringify(record)) as Omit<CEOLoopRecord, 'id' | 'kind'>;
  await ref.set({
    ...cleanRecord,
    id: ref.id,
    kind: 'ceo_loop',
    createdAt: record.timestamp,
  });
  return ref.id;
}
```

## 2. Esquema de almacenamiento

- Colección: `nios_memory`
- Documentos de tipo: `kind = 'ceo_loop'`
- Contenido:
  - `id`: ID del documento
  - `timestamp`: ISO 8601 del ciclo
  - `mode`: modo de autonomía del CEO
  - `autonomyScore` / `autonomyMax`
  - `autonomyReport`: estado de cada fase
  - `observations`, `diagnoses`, `decisions`, `actions`, `learnings`
  - `business`: métricas del negocio
  - `record`: estado completo del ciclo

## 3. Carga de aprendizaje

`lib/nios/ceo-learning.ts`:

- Lee `nios_memory` filtrando `kind == 'ceo_loop'`.
- Extrae patrones de los `learnings` de cada registro.
- Calcula un `learning boost` para ajustar la prioridad de decisiones futuras.

Se eliminó la dependencia de un índice compuesto de Firestore; ahora se ordenan los documentos en memoria por `timestamp`.

## 4. Evidencia de dos ciclos

```text
Ciclo 1: business.learningPatterns = 19
Ciclo 2: business.learningPatterns = 28
```

El ciclo 2 leyó la memoria del ciclo 1, extrajo más patrones y usó ese conocimiento para recalcular prioridades.

## 5. Autonomía de la memoria

```text
autonomyReport.MEMORY = REAL
autonomyScore = 8/8
```

La memoria ya no es un punto muerto.
