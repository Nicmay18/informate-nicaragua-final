# CEO Agent — Data Validation Final

## Regla de cierre
- No se declara `PRODUCTION_READY`.
- No se hicieron commits ni pushes.
- No se modificó MENI, canonical, taxonomy, publication pipeline, sitemap ni robots.

## Tabla de estados
| Área | Estado | Evidencia |
| --- | --- | --- |
| Universo artículos | INSUFFICIENT_DATA | No se verificó 307. 281, 286 y 287 son snapshots locales; 277 publicados en CEO_AUDIT. Diferencia de 26 no explicable sin fuente de 307. |
| 23,952 vistas | NOT_VERIFIED | No aparece en archivos. CEO_AUDIT: 22,486. FORENSIC_281_AUDIT: 18715. Diferencia 1,466. |
| TOP20/BOTTOM20 | HEURISTIC | Calculado sobre 281 verificables. Válido para ese snapshot. No extensible a 307 sin fuente. |
| CEO Daily | NEEDS_REVISION | Las decisiones 1-5 se basan en 281; son observaciones, no causalidades. Ninguna puede ser VERIFIED hasta resolver universo 307/281. |
| Dashboards | NEEDS_REVISION | Clasificaciones son heurísticas de escaneo de `page.tsx`. Duplicados detectados por nombre; requiere confirmación funcional. |
| Firebase | MISCONFIGURED | FIREBASE_PROJECT_ID=PRESENT; FIREBASE_PRIVATE_KEY=PRESENT (len=1732, validPEM=true). getAdminDb no conecta por clave corta/faltante. |
| GSC | ACCESS_BLOCKED | Sin credenciales operativas en .env.local. FORENSIC_CEO_AUDIT: ACCESS_BLOCKED. |
| GA4 | ACCESS_BLOCKED | Sin credenciales operativas en .env.local. FORENSIC_CEO_AUDIT: ACCESS_BLOCKED. |
| AdSense | ACCESS_BLOCKED | Variables MISSING en .env.local. FORENSIC_CEO_AUDIT: no hay datos. |
| Fuentes tráfico | NO_DATA | FORENSIC_281_AUDIT no tiene fuentes. traffic_log sí tiene (facebook/google/etc.), pero no se desagrega Search/Discover. |

## Recálculo TOP20 / BOTTOM20 (universo 281)
| # | Título | Categoría | Vistas |
| --- | --- | --- | --- |
| 1 | qkurWkzG | Sucesos | 1078 |
| 2 | bNTteIqT | Sucesos | 915 |
| 3 | 7aOBbeID | Sucesos | 723 |
| 4 | 8DPnNJNC | Sucesos | 706 |
| 5 | uPjLwgsg | Sucesos | 557 |
| 6 | CnHlW2Ry | Nacionales | 534 |
| 7 | i9duvDfl | Sucesos | 528 |
| 8 | D310EXZb | Nacionales | 494 |
| 9 | 9gLUPHxK | Nacionales | 475 |
| 10 | 12vpZYJo | Sucesos | 437 |
| 11 | Pf0VvjOf | Sucesos | 436 |
| 12 | slZp2GH5 | Sucesos | 411 |
| 13 | 8rgPZMc8 | Sucesos | 409 |
| 14 | hD0W8Nnv | Sucesos | 403 |
| 15 | NgEysmaq | Sucesos | 349 |
| 16 | gAp6N4fO | Nacionales | 287 |
| 17 | 6MlyKI1p | Sucesos | 284 |
| 18 | rqFwODFr | Sucesos | 284 |
| 19 | i88RK0Ul | Nacionales | 271 |
| 20 | W9E5MwLZ | Sucesos | 205 |

### BOTTOM 20
| # | Título | Categoría | Vistas |
| --- | --- | --- | --- |
| 1 | IFFjvOi1 | Internacionales | 4 |
| 2 | Neue7Ft2 | Nacionales | 4 |
| 3 | pVqVbFDg | Nacionales | 4 |
| 4 | rpCDcQ8K | Internacionales | 4 |
| 5 | zvtl853c | Nacionales | 4 |
| 6 | PaUNyoHJ | Deportes | 5 |
| 7 | VW3uBFbD | Deportes | 5 |
| 8 | ZK1mbMdV | Tecnología | 5 |
| 9 | a43EAAR5 | Nacionales | 5 |
| 10 | yUMAJwJQ | Deportes | 5 |
| 11 | yVuoBkFO | Nacionales | 5 |
| 12 | GDIEammz | Deportes | 6 |
| 13 | Q19zidw5 | Nacionales | 6 |
| 14 | eHwPppvu | Deportes | 6 |
| 15 | lzsto5T2 | Espectáculos | 6 |
| 16 | tnX05ykq | Deportes | 6 |
| 17 | wjXUjGNw | Internacionales | 6 |
| 18 | ku8tzMdL | Nacionales | 7 |
| 19 | ow2keC5R | Internacionales | 7 |
| 20 | HxsDqbeH | Sucesos | 8 |

## Conclusiones demostradas vs no demostradas
- **Demostrado:** el snapshot de 281 artículos existe y es contable; sus vistas suman 18715; Sucesos tiene el mayor volumen en ese snapshot.
- **No demostrado:** que 307 sea el universo correcto; que 23,952 sea el total real; que la categoría Sucesos *cause* más tráfico; que longitud o MENI score predigan vistas.
- **No demostrado:** que los dashboards duplicados sean realmente duplicados funcionales (solo se detectaron por ruta/similitud).

---
*Generado sin inventar datos. Fuentes: archivos locales y `FORENSIC_CEO_AUDIT.md`.*

## Corrección Misión 6 — Universos de tráfico
| Métrica | Valor anterior | Valor corregido | Estado |
| --- | --- | --- | --- |
| 23,952 | total del sitio | `FACEBOOK_VIEWS` | `USER_EVIDENCE` |
| 6.8k | vistas | `GA4_ACTIVE_USERS_30D` | `USER_EVIDENCE` |
| 4.3k | vistas | `GA4_ACTIVE_USERS_7D` | `USER_EVIDENCE` |
| 678 | vistas | `GA4_ACTIVE_USERS_1D` | `USER_EVIDENCE` |
| GSC clics/impresiones | 1,050 / 55,700 | `NOT_VERIFIED` a través de NIOS; `ACCESS_BLOCKED` | `ACCESS_BLOCKED` |
| GSC impresiones = 0 | conclusión falsa | `GSC — ACCESS_BLOCKED` | `INVALID` |
| Conclusiones invalidadas | 23,952 como tráfico total, ranking del sitio con 23,952, % de categorías sobre 23,952, 0 impresiones GSC | Reemplazadas por universos separados | `INVALID` |