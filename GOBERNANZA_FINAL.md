# GOBERNANZA FINAL — reglas permanentes del proyecto

## Prioridades (no negociables)

ESTABILIDAD > REFACTORIZACIÓN · OPERACIÓN > NUEVAS FUNCIONES · SIMPLICIDAD > COMPLEJIDAD · EVIDENCIA > SUPOSICIONES

## Reglas de cambio

1. **No sistemas paralelos** — antes de crear algo, demostrar que ningún sistema existente cumple la función (MENI, NIOS, Forense, Supervisor, Editorial Brain, Analytics, Distribución).
2. **No bajar umbrales** para que pasen artículos. Un bloqueo real se corrige, no se evade.
3. **No modificar artículos** para satisfacer al sistema.
4. **No borrar sin prueba** — ver DEAD_CODE_FINAL.md (callers, ruta dinámica, cron, import, producción, tests, función histórica).
5. **recomendación ≠ advertencia ≠ bloqueo** — las tres capas se mantienen separadas en todo el pipeline y la UI.
6. **El Editor Jefe humano decide** — `REVISAR` siempre tiene vía de publicación con confirmación; `BLOQUEAR` nunca.
7. **La autoridad visible es una**: `editorialVerdict` → nunca mostrar al usuario dos veredictos contradictorios.
8. **Métricas con nombre correcto** — Originalidad, Diferencia Editorial y Transcripción son tres cosas distintas; ninguna puede alimentarse de otra (regresión ya corregida).
9. **Todas las capas evalúan el mismo cuerpo final** — si hay normalización, es una derivación explícita y documentada, no cuerpos divergentes.

## Trazabilidad

- Cada publicación guarda `scoreMeni`, `estado`, distribución por canal en Firestore.
- `distribuciones_envios` registra claim/estado por slug+canal.
- `resumenes_diarios/{fecha}` registra el envío diario.
- `recordCronHeartbeat` deja marca de ejecución de cada cron.
- El diagnóstico del panel guarda hallazgos con módulo+severidad+evidencia.

## Qué hacer si se quiere cambiar algo

| Cambio | Proceso |
|---|---|
| Ajustar detector/umbral | demostrar con 2+ notas reales que falla igual; test de regresión; nunca por una sola nota |
| Nueva capacidad editorial | primero: ¿la cubre MENI/NIOS/Category Intelligence? si no → diseñar dentro del pipeline, no al lado |
| Eliminar código | checklist DEAD completo + grep de referencias + confirmación de que no hay webhook/cron/URL externa |
| Nuevo cron | justificar frecuencia vs costo; heartbeat obligatorio |
| Cambio de métrica | actualizar nombre+semántica en diagnostics, tests y docs |

## Propiedad de dominios

- **Editorial**: MENI + Supervisor + perfiles — tocar solo con evidencia de producción.
- **Distribución**: lib/distribution + crons — cambios de texto por canal en `generateDistribution` (copy) o `buildTelegramCaption`/`enviarFacebook` (auto).
- **Infraestructura**: crons, revalidate, firebase-admin, auth.
- **NIOS**: inteligencia auxiliar — MEMORY si no hay caller; no expandir sin caso de uso.
