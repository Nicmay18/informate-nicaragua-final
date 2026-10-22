# AUDITORIA_SEO_TECNICO.md — problemas y pruebas

Método: sonda de 784 URLs en producción (`.audit/reports/forensic-production.json`), inspección de `app/sitemap.ts`, `news-sitemap`, `robots`, páginas de categoría/tema/entidad/artículo, JSON-LD y canonicals.

## Verificado correcto en producción

- robots.txt + `sitemap.xml` + `news-sitemap.xml` vivos.
- Canonicals consistentes en artículos (muestra 784 URLs, 0 inconsistencias).
- JSON-LD Organization/NewsArticle/breadcrumb presentes y coherentes con el contenido visible en la muestra.
- Paginación interna indexable en /categoria, /tema, /entidad con parámetros ?page.
- CSP/meta de verificación de buscadores presentes (meta AdSense en PR #13).

## Defectos demostrados y su estado

| Defecto | Evidencia | Estado |
|---|---|---|
| Canonical de `/categoria?page=N` apuntaba a página 1 (diluye paginación) | sonda producción | CORREGIDO, PENDIENTE DE DESPLIEGUE (`fix/estabilizacion-forense`) |
| `/tema`, `/entidad` fuera de rango devolvían 200 con contenido (soft-404) | sonda `?page=9999` | CORREGIDO, PENDIENTE DE DESPLIEGUE (misma rama) |
| `news-sitemap` filtros vs `getSitemapNews` | diff de rama | verificado: los filtros ya se aplican internamente — sin cambio adicional requerido |
| Resumen truncado indexable en `tres-fallecidos` | HTML + DB | PENDIENTE DE REVISIÓN (contenido, no plantilla) |
| Contradicción titular/JSON-LD del eufemismo ("afectado" vs "murió") | producción previa a reparación | CORREGIDO en DB — visible al limpiar caché |
| Títulos corruptos incrustados en bloques "Te puede interesar" | corpus | PENDIENTE (lote 3 / reparación por doc) |
| Slug `seis` vs contenido 4+1 en `accidentes-viales` | documento | BLOQUEADO POR EVIDENCIA EXTERNA |

## No verificado

- Search Console (cobertura real, errores de índice) — sin acceso.
- Core Web Vitals reales — sin datos CrUX/RUM; medición local no representativa.
