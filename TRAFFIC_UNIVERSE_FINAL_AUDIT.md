# Traffic Universe Final Audit

## Corrección fundamental

- `23,952` es `FACEBOOK_VIEWS`, **no** tráfico total del sitio.
- `6.8k` / `4.3k` / `678` son `GA4_ACTIVE_USERS_*`, **no** vistas.
- `1,050` y `55,700` son `GSC_CLICKS` e `GSC_IMPRESSIONS` respectivamente, pero GSC está `ACCESS_BLOCKED` para NIOS.
- `18,715` es la suma de `vistas` en `FORENSIC_281_AUDIT.json` (artículos individuales).
- `22,486` es el total de `vistas` de 277 artículos publicados en Firestore real (`FORENSIC_CEO_AUDIT.md`).

## Tabla de universo de tráfico

| Métrica | Valor reportado | Estado | Fuente | Uso permitido | Uso prohibido |
| --- | --- | --- | --- | --- | --- |
| `FACEBOOK_VIEWS` | 23,952 | `USER_EVIDENCE` | Usuario | Análisis de Facebook Performance | Tráfico total del sitio, % por categoría, TOP20 sitio |
| `GA4_ACTIVE_USERS_30D` | 6.8k | `USER_EVIDENCE` | Captura GA4 | Métrica de usuarios activos 30 días | Llamarlo `views`, `vistas`, `tráfico` |
| `GA4_ACTIVE_USERS_7D` | 4.3k | `USER_EVIDENCE` | Captura GA4 | Métrica de usuarios activos 7 días | Llamarlo `views` |
| `GA4_ACTIVE_USERS_1D` | 678 | `USER_EVIDENCE` | Captura GA4 | Métrica de usuarios activos 1 día | Llamarlo `views` |
| `GSC_CLICKS` | 1,050 | `NOT_VERIFIED` | Captura GSC (user evidence) | Solo si NIOS logra acceso | Decisiones con `ACCESS_BLOCKED` |
| `GSC_IMPRESSIONS` | 55,700 | `NOT_VERIFIED` | Captura GSC (user evidence) | Solo si NIOS logra acceso | Reportar 0 impresiones sin acceso |
| `ARTICLE_VIEWS_FIRESTORE` | 22,486 | `VERIFIED` (real) | Firestore `noticias` | Total de vistas de artículos publicados | Distribución por fuente |
| `ARTICLE_VIEWS_281` | 18,715 | `VERIFIED` (snapshot) | `FORENSIC_281_AUDIT.json` | Análisis del snapshot 281 | Extrapolar a universo no verificado |

## Conclusiones anteriores invalidadas

1. **Autopsia 307** usó `23,952` como total de vistas del sitio. **INVALIDADO**. El total real verificable es 18,715 (snapshot 281) o 22,486 (Firestore 277).
2. **Distribución por categoría con 23,952** era en realidad una distribución de Facebook, no del sitio. **INVALIDADO** para representar tráfico total.
3. **TOP20/BOTTOM20 del sitio** basado en 23,952 queda **INVALIDADO**; el ranking solo es válido dentro de un universo declarado.
4. **Participación porcentual de categorías sobre 23,952** queda **INVALIDADA**; no es base de tráfico del sitio.

## Conclusiones respaldadas

1. El snapshot `FORENSIC_281_AUDIT.json` tiene 18,715 vistas medidas y es **internamente consistente**.
2. Firestore real reporta 22,486 vistas de 277 artículos publicados (`FORENSIC_CEO_AUDIT.md`).
3. `traffic_log` reporta 922 eventos rolling 24h con fuentes `facebook`, `directo`, `google`, `otro`, `whatsapp`, `telegram` (`FORENSIC_CEO_AUDIT.md`).
4. `traffic_daily` reporta 695 vistas en 26 artículos para el día UTC 2026-08-22.

## Acciones requeridas

1. Renombrar toda referencia de `23,952 vistas` a `23,952 FACEBOOK_VIEWS`.
2. Separar `GA4_*` métricas en vistas, sesiones y usuarios activos.
3. No calcular `GSC` métricas hasta desbloquear la API; usar `ACCESS_BLOCKED` en todos los paneles.
4. Documentar en cada API y UI la métrica exacta que se muestra (ventana, unidad, fuente).
