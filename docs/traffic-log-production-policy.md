# Política de Producción: `traffic_log`

## Propósito

Establecer la retención controlada de eventos de tráfico crudos para reducir costos y almacenamiento, sin afectar la lógica editorial ni la inteligencia de NIOS.

## Política

| Atributo | Valor |
|----------|-------|
| Colección | `traffic_log` |
| Campo TTL | `timestamp` |
| Retención | 30 días |

## Motivo técnico

`traffic_log` crece linealmente con cada visita. A escala, esto genera:

- costos crecientes de escritura
- consultas más lentas
- almacenamiento infinito
- difícil análisis histórico

Con TTL de 30 días, los eventos crudos se autoeliminan. La inteligencia de tráfico se nutre de `traffic_daily`, que agrega 1 documento por artículo por día.

## Impacto esperado

- Reducción de documentos vivos en `traffic_log` a ~30 días de eventos.
- Menor carga de lectura en dashboards.
- Menor costo de almacenamiento a largo plazo.
- `traffic_daily` sigue disponible para análisis histórico.

## Procedimiento de activación

1. Entrar a Firebase Console.
2. Ir a Firestore Database → TTL policies.
3. Crear política para colección `traffic_log` usando el campo `timestamp`.
4. Establecer duración: 30 días.
5. Guardar.

## Rollback

1. Desactivar o eliminar la política TTL en Firebase Console.
2. Los documentos existentes no se recuperan si ya fueron eliminados por TTL.
3. Los documentos nuevos ya no se eliminarán.

## Nota de estabilidad

- No se ejecuta borrado desde código.
- No se modifica la colección `noticias`.
- NIOS puede seguir cayendo a `traffic_log` como fallback mientras existan datos.
