# GSC Access and Semantics Audit

## 1. Estado de acceso

| Aspecto | Estado | Evidencia |
| --- | --- | --- |
| Credenciales GSC | `ACCESS_BLOCKED` | `.env.local` sin `GSC_SITE_URL` / `GSC_PRIVATE_KEY` operativos |
| Collector `lib/nios/intelligence/gsc-collector.ts` | `ACCESS_BLOCKED` | Requiere `FIREBASE_PRIVATE_KEY` y `FIREBASE_CLIENT_EMAIL` |
| API de NIOS | `ACCESS_BLOCKED` | `FORENSIC_CEO_AUDIT.md` confirma sin credenciales |
| Datos 1,050 clics / 55,700 impresiones | `NOT_VERIFIED` (local) | Usuario proporcionó captura; NIOS no puede consultar |

## 2. Regla crítica: `ACCESS_BLOCKED ≠ 0`

Cualquier sistema que reporte `0 impresiones` o `0 clics` mientras GSC está bloqueado está emitiendo una conclusión falsa.

| Sistema | Ubicación del problema | Efecto | Corrección documental |
| --- | --- | --- | --- |
| Google Trust | `lib/nios/intelligence/google-trust.ts` líneas 144, 155, 252, 258 | `gscImpressions === 0` se interpreta como 0 real | Usar `gscStatus === 'REAL'` antes de evaluar |
| Thin content | `lib/nios/intelligence/google-trust.ts` línea 144 | `< 200 palabras + gscImpressions === 0` genera flag | No usar `0` como evidencia de calidad |
| CEO Agent | `lib/ceo-agent.ts` | `vistas` ausente se convierte en `0` | Distinguir `undefined` de `0` |
| NIOS Dashboard | `app/admin/nios` / componentes | Muestra `0 impresiones` en Editorial Strategy | Mostrar `GSC — ACCESS_BLOCKED` |

## 3. Valores que NO pueden usarse

| Valor | Estado | Razón |
| --- | --- | --- |
| `GSC_IMPRESSIONS = 0` | `INVALID` | GSC no consultado |
| `GSC_CLICKS = 0` | `INVALID` | GSC no consultado |
| `GSC_CTR = 0%` | `INVALID` | Sin datos |
| `GSC_POSITION = 0` | `INVALID` | Sin datos |
| `89 artículos con 0 impresiones` | `INVALID` | Conclusión falsa bajo `ACCESS_BLOCKED` |

## 4. Mensajes correctos para el usuario

| Contexto | Antes (inválido) | Después (válido) |
| --- | --- | --- |
| Editorial Strategy | 0 impresiones | `GSC — ACCESS BLOCKED` |
| Google Trust | 270 artículos de riesgo alto | `GSC no disponible. No se puede determinar riesgo orgánico.` |
| CEO Daily | 0 artículos funcionando en Google | `GOOGLE — BLOQUEADO. Configurar GSC.` |
| Alertas | Limitar nueva producción | `No se puede determinar. Configurar GSC y re-ejecutar.` |

## 5. Semántica de métricas GSC

| Métrica | Fuente | Definición | Unidad |
| --- | --- | --- | --- |
| `GSC_CLICKS` | GSC API | Clicks en resultados de búsqueda web | clics |
| `GSC_IMPRESSIONS` | GSC API | Impresiones en resultados de búsqueda web | impresiones |
| `GSC_CTR` | GSC API | `clics / impresiones * 100` | % |
| `GSC_POSITION` | GSC API | Posición promedio ponderada | posición |

## 6. Acciones requeridas

1. Configurar credenciales GSC (`GSC_SITE_URL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`).
2. Modificar `google-trust.ts` para no comparar `gscImpressions === 0` cuando `gscStatus !== 'REAL'`.
3. Reemplazar `0` en dashboards por `ACCESS_BLOCKED`.
4. Auditar `lib/ceo-agent.ts` para que `undefined` y `NO_DATA` no caigan como `0`.
