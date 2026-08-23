# CEO Dashboard Forensic Audit

## Resumen
- Total de dashboards auditados: 21
- Con datos reales: 12
- Bloqueados / sin datos: 4
- Duplicados detectados: 0

## Criterios
- `KEEP`: datos reales + acción concreta.
- `SIMPLIFY`: datos reales pero sin acción clara, o duplicado.
- `REMOVE`: datos simulados, duplicado redundante o inútil.
- `BLOCKED`: depende de datos externos no disponibles.

## Tabla de auditoría
| Ruta | Componente | Fuente | Datos reales | Estatus | Accionable | Útil | Duplicado | Recomendación | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /admin\ads\page.tsx | Unknown | NO_SOURCE_DETECTED | NO | NO_DATA | PARTIAL | NO | NO | BLOCKED | Dashboard funcional |
| /admin\ceo-agent\page.tsx | Unknown | NO_SOURCE_DETECTED | MIXED | MOCK | YES | NO | NO | REMOVE | contiene datos simulados |
| /admin\correcciones\page.tsx | Unknown | NO_SOURCE_DETECTED | MIXED | MOCK | YES | NO | NO | REMOVE | contiene datos simulados |
| /admin\crecimiento\page.tsx | Unknown | NO_SOURCE_DETECTED | YES | REAL | YES | YES | NO | KEEP | Dashboard funcional |
| /admin\distribute\page.tsx | Unknown | NO_SOURCE_DETECTED | YES | REAL | NO | PARTIAL | NO | SIMPLIFY | no genera acción concreta |
| /admin\editor\page.tsx | Unknown | NO_SOURCE_DETECTED | MIXED | MOCK | YES | NO | NO | REMOVE | contiene datos simulados |
| /admin\entities\page.tsx | Unknown | NO_SOURCE_DETECTED | NO | NO_DATA | NO | NO | NO | REMOVE | no genera acción concreta |
| /admin\google-news\page.tsx | Unknown | NO_SOURCE_DETECTED | NO | NO_DATA | NO | NO | NO | REMOVE | no genera acción concreta |
| /admin\growth\page.tsx | Unknown | NO_SOURCE_DETECTED | YES | REAL | NO | PARTIAL | NO | SIMPLIFY | no genera acción concreta |
| /admin\knowledge-center\page.tsx | Unknown | NO_SOURCE_DETECTED | YES | REAL | NO | PARTIAL | NO | SIMPLIFY | no genera acción concreta |
| /admin\meni-dashboard\page.tsx | Unknown | NO_SOURCE_DETECTED | YES | REAL | YES | YES | NO | KEEP | Dashboard funcional |
| /admin\meni\arquitectura\page.tsx | Unknown | NO_SOURCE_DETECTED | MIXED | MOCK | YES | NO | NO | REMOVE | contiene datos simulados |
| /admin\meni\page.tsx | Unknown | NO_SOURCE_DETECTED | MIXED | MOCK | YES | NO | NO | REMOVE | contiene datos simulados |
| /admin\nios\adsense-recovery\page.tsx | Unknown | NO_SOURCE_DETECTED | YES | REAL | NO | PARTIAL | NO | SIMPLIFY | no genera acción concreta |
| /admin\nios\adsense-report\page.tsx | Unknown | NO_SOURCE_DETECTED | YES | REAL | NO | PARTIAL | NO | SIMPLIFY | no genera acción concreta |
| /admin\nios\google-intelligence\page.tsx | Unknown | NO_SOURCE_DETECTED | YES | REAL | NO | PARTIAL | NO | SIMPLIFY | no genera acción concreta |
| /admin\nios\page.tsx | Unknown | NO_SOURCE_DETECTED | YES | REAL | NO | PARTIAL | NO | SIMPLIFY | no genera acción concreta |
| /admin\nios\recovery\page.tsx | Unknown | NO_SOURCE_DETECTED | YES | REAL | NO | PARTIAL | NO | SIMPLIFY | no genera acción concreta |
| /admin\nios\weekly\page.tsx | Unknown | NO_SOURCE_DETECTED | YES | REAL | NO | PARTIAL | NO | SIMPLIFY | no genera acción concreta |
| /admin\portada\page.tsx | Unknown | NO_SOURCE_DETECTED | NO | NO_DATA | NO | NO | NO | REMOVE | no genera acción concreta |
| /admin\trafico\page.tsx | Unknown | NO_SOURCE_DETECTED | YES | REAL | NO | PARTIAL | NO | SIMPLIFY | no genera acción concreta |

## Hallazgos

### Datos bloqueados o ausentes
- `/admin\ads\page.tsx`: Dashboard funcional
- `/admin\entities\page.tsx`: no genera acción concreta
- `/admin\google-news\page.tsx`: no genera acción concreta
- `/admin\portada\page.tsx`: no genera acción concreta

### Duplicados

### Recomendaciones prioritarias
1. Consolidar `growth` y `crecimiento` en una sola ruta.
2. Unificar `meni`, `meni/arquitectura` y `meni-dashboard` o eliminar `arquitectura`.
3. No invertir en `nios/google-intelligence` ni `nios/recovery` hasta desbloquear GSC/GA4/AdSense.
4. Revisar dashboards `SIMPLIFY` para convertir métricas en acciones concretas.

*Auditoría generada a partir del análisis de `app/admin/**/page.tsx`. No se construyeron nuevos dashboards.*

## Validación Misión 5
- Las recomendaciones sobre duplicados (`growth`/`crecimiento`, `meni`/`meni-dashboard`, `adsense-report`/`adsense-recovery`) son **HEURISTIC** basadas en nombres de ruta y componente; requieren validación funcional antes de eliminar.
- `nios/google-intelligence` y `nios/recovery` quedan como **BLOCKED** por `ACCESS_BLOCKED` de GSC/GA4/AdSense.
- No se eliminó ningún dashboard; solo se documentó.

## Corrección Misión 6 — Dashboards y semántica
- `nios/google-intelligence`, `nios/adsense-report`, `nios/adsense-recovery` y `nios/recovery` no pueden mostrar `0 impresiones` ni `0 clics` mientras GSC/GA4/AdSense estén `ACCESS_BLOCKED`.
- `Health Score` 78/100 requiere auditoría: proviene de `lib/nios/intelligence/health-score.ts` (pipeline), no de calidad editorial; debe incluir diagnóstico + acción.
- `Google Trust` 29/100 con 270 artículos de riesgo alto es `INVALID` bajo `ACCESS_BLOCKED`; no es evidencia de Google.