# CEO OPERATING MODEL

## Ciclo canónico

```
OBSERVE → DIAGNOSE → DECIDE → PLAN → EXECUTE → VERIFY → LEARN → MEMORY
```

## Fases

### OBSERVE

Recolecta datos reales:

- Noticias de Firestore
- Tráfico
- GSC / GA4
- AdSense
- Snapshots NIOS
- Alertas

### DIAGNOSE

Detecta anomalías y las clasifica por severidad:

- `critical`
- `high`
- `medium`
- `low`

### DECIDE

Clasifica cada acción en:

- `AUTO_EXECUTE` — segura y reversible
- `QUEUE_FOR_HUMAN` — requiere aprobación humana
- `BLOCKED` — dependencia externa bloqueada
- `NO_ACTION` — no existe acción automática segura

### PLAN

Asigna prioridad con factores:

- `impact`
- `confidence`
- `effort`
- `risk`
- `urgency`

Aplica `learning boost` para ajustar por aprendizaje histórico.

### EXECUTE

Ejecuta reparaciones seguras:

- `nios-cache-refresh`
- `nios-snapshot-inconsistent`
- otras acciones con `risk < 0.5` y `reversibility = 'high'`

### VERIFY

Cada acción registrada con:

- `BEFORE`
- `AFTER`
- `RESULT`
- `VERIFICATION`

### LEARN

Extrae patrones de:

- `nios_memory` `kind = 'ceo_loop'`
- `learnings` de ciclos anteriores

### MEMORY

Persiste el ciclo completo en `nios_memory`:

- `recordCeoLoopRun` escribe el registro
- `loadCeoLearningPatterns` lee patrones para el siguiente ciclo

## Estados finales

Los hallazgos se resuelven en:

- `FIXED`
- `VERIFIED`
- `PARTIALLY_FIXED`
- `BLOCKED_HUMAN`
- `WAITING_EXTERNAL`
- `KEEP`
- `DEPRECATE`
- `REMOVE`
- `MONITOR`
