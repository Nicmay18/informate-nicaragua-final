# Detección de Contenido en Decadencia — NIOS CEO v2

Módulo para identificar artículos que pierden relevancia, tráfico o precisión.

## Señales de decaimiento

| Señal | Umbral | Acción recomendada |
|-------|--------|--------------------|
| Vistas 24 h = 0 durante 7 días consecutivos | `views24h === 0` durante 7 días | Revisar recirculación o republicar. |
| Fecha de publicación > 90 días | `age > 90` | Verificar actualidad de hechos. |
| `scoreMeni` < 85 | score obsoleto | Re-evaluar con editor V4.1. |
| `publicado === true` pero no indexado | GSC status | Verificar canonical y sitemap. |
| Categoría sin nuevas noticias > 30 días | `lastPublished` > 30 días | Considerar contenido de relleno oportunidad. |

## Clasificación de ciclo de vida

| Estado | Criterio | Acción CEO |
|--------|----------|------------|
| BREAKING | < 6 h | Hero / push / notificaciones. |
| DEVELOPING | 6-24 h, evolución activa | Actualizar con hechos nuevos. |
| EVERGREEN | Sin fecha de caducidad | Mantener en guías y recirculación. |
| REFERENCE | Guía/directorio | Revisar trimestralmente. |
| SEASONAL | Evento recurrente | Programar reciclaje. |
| DEAD | 0 vistas 30 días + obsoleto | Archivar o eliminar. |
| UPDATE_REQUIRED | Hechos desactualizados | Encolar para redactor. |

## Implementación propuesta

- Archivo: `lib/nios/intelligence/content-decay.ts`
- Consume `lib/analytics/traffic-reader.ts` y Firestore `noticias`.
- Devuelve `ContentDecayReport[]` con `slug`, `stage`, `confidence`, `action`.
- Integrar en `app/api/cron/nios-collect/route.ts` y en panel `/panel/nios`.

