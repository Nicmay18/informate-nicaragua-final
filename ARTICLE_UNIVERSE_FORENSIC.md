# Article Universe Forensic

## Fuentes auditadas
| Fuente | Total | Publicados | Archivados | Vistas |
| --- | --- | --- | --- | --- |
| FORENSIC_281_AUDIT.json | 281 | 279 | 2 (no publicados) | 18715 |
| FORENSIC_281_FINAL.json | 281 | N/A | N/A | NO_DATA |
| FORENSIC_CURRENT_INVENTORY.json | 286 | 248 | 38 | NO_DATA |
| CLOSURE_SNAPSHOT.json | 287 | 249 | N/A | NO_DATA |
| FORENSIC_ARCHIVE_37.json | 37 | N/A | 37 | NO_DATA |
| FORENSIC_CEO_AUDIT.md | 277 (publicados) | 277 | N/A | 22,486 |
| Referencia usuario | 307 | ? | ? | 23,952 |

## Cruce de IDs
- IDs en 281: 281
- IDs en CURRENT_INVENTORY: 286
- IDs en CLOSURE_SNAPSHOT: 287
- IDs en 281_FINAL: 281
- IDs en 286 que NO están en 281: 5
- IDs en 281 que NO están en 286: 0
- IDs en ARCHIVE_37 que NO están en 281: 0
- IDs de ARCHIVE_37 que SÍ están en CURRENT_INVENTORY: 37
- IDs únicos si unimos 281 + 286 + ARCHIVE_37: 286

## Análisis 307 vs 281
1. **307** no aparece como total en ningún archivo JSON local ni en `FORENSIC_CEO_AUDIT.md`.
2. **281** sí es verificable en `FORENSIC_281_AUDIT.json`, `FORENSIC_281_FINAL.json` y `FORENSIC_281_CERTIFICATION.md`.
3. La cifra **23,952 vistas** tampoco coincide con el total local de `FORENSIC_281_AUDIT.json` (18715) ni con `FORENSIC_CEO_AUDIT.md` (22,486).
4. No es posible identificar los 26 artículos faltantes porque no existe un archivo o consulta con 307 IDs.
5. Los archivos locales reportan universos distintos (281, 286, 287, 277 publicados), lo que indica que los snapshots no están sincronizados.

## Cierre

```text
UNIVERSE_307 = NOT_VERIFIED
UNIVERSE_281 = VERIFIED (snapshot local)
UNIVERSE_286 = VERIFIED (snapshot local, más reciente que 281)
DIFFERENCE = 26
CAUSE = INSUFFICIENT_DATA; 307 no tiene fuente verificable en archivos locales ni en Firestore auditado. La colección real de noticias puede contener borradores, duplicados o artículos fuera de período, pero no se dispone de una lista de 307 IDs para comparar.
```

## Nota Misión 6
- `23,952` no es el total de vistas del sitio; es `FACEBOOK_VIEWS`.
- `6.8k / 4.3k / 678` son `GA4_ACTIVE_USERS_*`, no vistas.
- `1,050 / 55,700` son `GSC_CLICKS` e `GSC_IMPRESSIONS` no verificables por NIOS mientras GSC esté `ACCESS_BLOCKED`.