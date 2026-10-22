# AUTORIA_Y_TRANSPARENCIA.md — discrepancias y correcciones

Fecha: 22-oct-2026 · Alcance: /nosotros, perfiles, JSON-LD, firmas en corpus.

## Estructura declarada vs observada — VERIFICADO

| Persona | Función declarada | Observado en producción | Estado |
|---|---|---|---|
| Keyling Elieth Rivera Muñoz | Dirección editorial + autoría | JSON-LD Person "Directora Editorial"; bio "Licenciada en Periodismo" | COINCIDE |
| Maycol Josué Nicaragua Rivas | Dirección técnica | JSON-LD Person "Director Técnico" | COINCIDE |
| José Luis López Ramírez | Dirección operaciones + autoría | JSON-LD Person "Director de Operaciones" | COINCIDE |

- No se detectaron funciones inventadas ni personal ficticio en las páginas institucionales.
- /nosotros publica Organization + Person con `url` a perfiles por slug; `employee[]` consistente.

## Firmas en el corpus

- Autoría por artículo registrada en `FORENSIC_ARTICLE_AUTOPSY.json` (campo `autor`).
- No se reasignaron firmas históricas ni se añadió personal para apariencia.

## Pendientes de confirmación (NO VERIFICADO — no declarados falsos)

- Credenciales biográficas de la bio de Keyling ("Licenciada en Periodismo…") — publicadas por el propio medio; verificación externa no realizada. Si hay título/institución/año concretos, conviene documentarlos.
- Fotografías y enlaces profesionales (sameAs) — presentes en JSON-LD; autenticidad de los perfiles enlazados no verificada individualmente.
- Autoría real de cada artículo (firma registrada en DB vs quién la redactó) — no verificable desde el sistema; requiere confirmación editorial.

## Correcciones

- Ninguna aplicada: las páginas institucionales son coherentes entre sí y con la estructura declarada.
- Recomendación P3: que el perfil de cada autor con firma pública enlace sus artículos correctamente (verificación manual del propietario).
