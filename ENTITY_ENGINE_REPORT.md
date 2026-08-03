# Entity Engine — Reporte

## Objetivo

Detectar automáticamente entidades dentro de cada noticia publicada para alimentar el Knowledge Graph de Nicaragua Informate.

## Tipos Soportados (22)

| Tipo | Método de detección | Ejemplos |
|------|--------------------|--------------------|
| persona | Patrones de cargo + verbos declarativos | "doctor Néstor Pavón" |
| lugar | Diccionario + patrones (barrio, sector) | "barrio Rubenia" |
| institucion | Diccionario + siglas | Policía Nacional, MINSA |
| empresa | Diccionario | Banpro, Claro, Tigo |
| hospital | Diccionario (14 hospitales) | Hospital Bertha Calderón |
| ciudad / departamento | Diccionario | Managua, León |
| ministerio | Vía diccionario institucional | MINED, MINSA |
| evento / festival | Diccionario (8 festivales) | Festival de Santo Domingo |
| equipo | Diccionario (10 equipos) | Real Estelí, Indios del Bóer |
| ley | Diccionario | Código Penal, Ley Electoral |
| proyecto | Diccionario | Multiestadio Stanley Cayasso |
| infraestructura | Diccionario (10 obras) | Aeropuerto A.C. Sandino |
| universidad | Vía diccionario institucional | UNAN, UNI, UCA |
| volcan | Diccionario (8 volcanes) | Volcán Telica |
| rio | Diccionario (9 ríos) | Río San Juan |
| carretera | Diccionario + patrones | Carretera Norte |
| tema | Keywords por tema (13 temas) | accidentes de tránsito |
| categoria | Categoría del artículo | Sucesos |

## Campos por Entidad

- `nombre` — legible: "Volcán Telica"
- `slug` — URL: "volcantelica"
- `tipo` — uno de los 22 tipos
- `descripción` — automática desde diccionarios
- `primera aparición` / `última aparición` — ISO dates
- `cantidad de noticias` — contador acumulativo
- `categorías relacionadas` — merge automático en cada ingesta
- `palabras clave` — merge automático (máx. 20)
- `imagen` — opcional (campo disponible)

## Precisión

- **Alta precisión**: entidades de diccionario (instituciones, hospitales, volcanes, etc.) — match exacto insensible a mayúsculas.
- **Precisión media**: personas — patrones de cargo/verbo declarativo con filtros de longitud y exclusiones.
- **Cobertura amplia**: lugares — combina diccionario con patrones abiertos (barrio X, carretera Y).

## Límites por Artículo

- Personas: máx. 15
- Lugares: máx. 15
- Instituciones: máx. 15
- Enlaces internos generados: máx. 8

## Integración

El Entity Engine se ejecuta automáticamente en cada publicación vía `ingestArticle()` llamado desde `app/api/admin/guardar-directo/route.ts` (no bloqueante — si falla, la publicación continúa).
