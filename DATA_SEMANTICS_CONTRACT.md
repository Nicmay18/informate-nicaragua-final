# Data Universe Contract (Data Semantics Contract)

## Propósito

Definir una sola tabla de verdad para cada métrica del sistema. Ningún dashboard, agente ni informe puede llamar a una métrica con un nombre que no esté en este contrato. `0`, `NO_DATA`, `ACCESS_BLOCKED` y `NOT_VERIFIED` son estados distintos.

## Estados permitidos

| Estado | Significado | Cuándo usar |
| --- | --- | --- |
| `VERIFIED` | Valor medido en fuente primaria, trazable. | La fuente respondió con datos reales y se documenta ventana/métrica. |
| `USER_EVIDENCE` | Valor entregado por usuario (captura, reporte). | Útil, pero no replicable desde la API local. |
| `NOT_VERIFIED` | Cifra mencionada sin fuente verificable. | Aparece en un reporte sin rastro de consulta o archivo. |
| `NO_DATA` | Fuente consultada y vacía. | La API/colección responde sin registros. |
| `ACCESS_BLOCKED` | Credenciales, permisos o configuración impiden consultar. | Error 403, key faltante, property ID faltante. |
| `STALE_DATA` | Datos de una fecha anterior al periodo de interés. | Snapshot congelado mientras la fuente tiene datos nuevos. |
| `DATA_CONFLICT` | Dos fuentes reportan lo mismo con valores distintos. | Mismo universo, distinta cifra, sin explicación. |
| `ZERO` | Métrica medida con valor real 0. | Solo cuando la fuente respondió 0 explícitamente. |

## Contrato de métricas

| Métrica | Fuente real | Definición | Ventana | Unidad | Estado actual | Nota |
| --- | --- | --- | --- | --- | --- | --- |
| `FACEBOOK_VIEWS` | Facebook / distribución | Vistas o interacciones atribuidas a publicaciones de Facebook | periodo real | vistas | `NOT_VERIFIED` local, posible `USER_EVIDENCE` | El número 23,952 solo puede usarse bajo esta etiqueta. |
| `GA4_ACTIVE_USERS_30D` | Google Analytics 4 | Usuarios activos acumulados en 30 días | 30 días | usuarios | `USER_EVIDENCE` 6.8k | No es `vistas` ni `page_views`. |
| `GA4_ACTIVE_USERS_7D` | Google Analytics 4 | Usuarios activos acumulados en 7 días | 7 días | usuarios | `USER_EVIDENCE` 4.3k | No es `vistas`. |
| `GA4_ACTIVE_USERS_1D` | Google Analytics 4 | Usuarios activos del último día | 1 día | usuarios | `USER_EVIDENCE` 678 | No es `vistas`. |
| `GA4_PAGE_VIEWS` | Google Analytics 4 | Vistas de página por sesión | según rango | vistas | `ACCESS_BLOCKED` | NIOS collector no puede conectar. |
| `GA4_SESSIONS` | Google Analytics 4 | Sesiones iniciadas | según rango | sesiones | `ACCESS_BLOCKED` | NIOS collector no puede conectar. |
| `GSC_CLICKS` | Google Search Console | Clicks en resultados de búsqueda | periodo GSC | clics | `ACCESS_BLOCKED` | Valores 1,050 son `NOT_VERIFIED` a través de NIOS. |
| `GSC_IMPRESSIONS` | Google Search Console | Impresiones en resultados de búsqueda | periodo GSC | impresiones | `ACCESS_BLOCKED` | Valores 55,700 son `NOT_VERIFIED` a través de NIOS. |
| `GSC_CTR` | Google Search Console | CTR = clicks / impressions | periodo GSC | % | `ACCESS_BLOCKED` | No se puede calcular sin GSC. |
| `GSC_POSITION` | Google Search Console | Posición promedio en SERP | periodo GSC | posición | `ACCESS_BLOCKED` | No se puede calcular sin GSC. |
| `ARTICLE_VIEWS` | Firestore `vistas` campo | Contador acumulado de vistas por artículo | histórico | vistas | `VERIFIED` parcial | Disponible en `FORENSIC_281_AUDIT.json` y Firestore real. |
| `TRAFFIC_LOG_EVENTS` | Firestore `traffic_log` | Eventos de vista con `source` y `timestamp` | rolling 24h | eventos | `VERIFIED` | 922 eventos en CEO_AUDIT. |
| `TRAFFIC_DAILY_VIEWS` | Firestore `traffic_daily` | Vistas agregadas por día calendario | día UTC | vistas | `VERIFIED` parcial | 26 artículos / 695 vistas en CEO_AUDIT. |
| `ARTICLE_UNIVERSE_281` | Firestore snapshot `FORENSIC_281_AUDIT.json` | Conjunto de 281 artículos auditados | 2026-08-11 | artículos | `VERIFIED_SNAPSHOT` | No es el universo total actual. |
| `ARTICLE_UNIVERSE_286` | `FORENSIC_CURRENT_INVENTORY.json` | Conjunto de 286 artículos | posterior | artículos | `VERIFIED_SNAPSHOT` | 248 publicados, 38 archivados. |
| `ARTICLE_UNIVERSE_307` | Referencia usuario | Número mencionado | desconocido | artículos | `NOT_VERIFIED` | No se encontró archivo ni consulta con 307 IDs. |
| `THIN_CONTENT_NIOS` | `lib/nios/intelligence/google-trust.ts` | Artículos con flags de thin (threshold 400 palabras) | snapshot | artículos | `DATA_CONFLICT` | 109 según NIOS, 0 según auditoría maestra. |

## Reglas de uso

1. **Prohibido** llamar `FACEBOOK_VIEWS` como `SITE_VIEWS` o `TOTAL_VIEWS`.
2. **Prohibido** llamar `GA4_ACTIVE_USERS_*` como `views`, `vistas` o `page_views`.
3. **Prohibido** reportar `GSC_IMPRESSIONS = 0` cuando el estado es `ACCESS_BLOCKED`.
4. **Prohibido** convertir `NO_DATA` o `ACCESS_BLOCKED` en `0` sin documentar el estado.
5. Todo score (`Health`, `Trust`, `Google Readiness`) debe incluir: score, componentes, evidencia, umbral, diagnóstico y acción.

## Consecuencias de incumplimiento

- Decisiones de `CEO Daily Brief` basadas en `0 impresiones` GSC quedan invalidadas.
- `TOP20/BOTTOM20` del sitio completo con `23,952` como base quedan invalidados.
- `Health Score 78/100` requiere auditoría de significado antes de usarse como alerta.
- `Google Trust 29/100` con 270 artículos de riesgo alto requiere revisión; no es evidencia de Google cuando GSC está bloqueado.
