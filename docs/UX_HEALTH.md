# UX HEALTH — NIOS CEO v1

| Campo | Valor |
|-------|-------|
| Estado | OPERATIVO (P0) |
| Última revisión | 2026-08-30 |

## Módulos

1. `app/page.tsx` — home con grid de noticias + sidebar.
2. `components/home/`, `components/article/` — tarjetas, header, footer, radio bar.
3. `lib/nios/home-quality/` — evaluación de calidad del home.
4. `app/noticias/[slug]/` — página de artículo.

## Criterios mobile-first

- Grid 2 columnas en desktop, 1 en mobile.
- Tarjetas con imagen, título, resumen.
- Header, footer, radio bar responsivos.
- Imágenes convertidas a WebP y servidas locales.

## Hallazgos

- Portada visual desacoplada del motor editorial: `app/admin/portada`, `lib/portada/`.
- Imágenes subidas por admin vía GitHub API a `public/images/`.
- `_fixImg` mapea URLs de Firebase Storage a ruta local.

## Pendientes vigilados

- Verificar 2 columnas en home tras cambios de portada.
- Confirmar radio bar activa y URL de streaming vigente.
- Auditar lazy loading de imágenes.

## Verificación

- `npm run build` OK.
- Tests de UI: manual en `/`, `/noticias/[slug]`.
