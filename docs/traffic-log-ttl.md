# TTL Policy: `traffic_log`

## Propósito

Limitar el crecimiento ilimitado de `traffic_log` y reducir costos de Firestore sin afectar lógica de MENI ni NIOS.

## Configuración requerida

Firebase Console → Firestore Database → TTL policies

- **Colección:** `traffic_log`
- **Campo TTL:** `timestamp`
- **Retención:** 30 días

## Acciones

1. Activar TTL en Firebase Console.
2. No eliminar `traffic_log` desde código.
3. No modificar el campo `timestamp` de documentos existentes.

## Periodo de observación

30 días.

Después del periodo, evaluar:

- Costo real vs estimado
- Presencia de `traffic_daily`
- Necesidad de mantener `traffic_log` o migrar a `traffic_daily` exclusivo

## Nota

El código no borra documentos. El borrado es gestionado por Firebase TTL.
