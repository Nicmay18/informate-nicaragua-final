# Changelog — Nicaragua Informate

Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Cada entrada corresponde a commits verificables en `master`.

## [Unreleased] — rama `fix/lts-governance-analytics-2026-10`

### Corregido
- `@next/bundle-analyzer` alineado a `^15.5.x` (era `^16.3.0`, incompatible con
  Next 15.5.x). Lockfile regenerado.
- GA4 Measurement ID externalizado a `NEXT_PUBLIC_GA_ID` con fallback
  documentado a la propiedad actual; GA no se inicializa si el ID no es
  válido (`G-XXXXXX`).
- CSP: retiradas las directivas `*.onesignal.com` (script/style/connect/
  frame/worker-src) — `OneSignalProvider` no está montado y ningún flujo
  registra el service worker; el SDK cliente nunca carga. El envío
  server-side de pushes no depende de la CSP.

### Documentación
- `docs/auditoria-100-noticias.md` — procedimiento + resultados reales de la
  auditoría exigida por el LTS (la referencia del README estaba rota).
- `docs/gobernanza/branch-protection.md` — configuración de protección de
  `master` para el administrador (API devuelve 401 sin permisos admin).
- `docs/gobernanza/lts-excepciones.md` — política de excepciones LTS,
  plantilla y checklist.
- `docs/testing-baseline.md` — línea base de 26 fallos preexistentes con plan
  de resolución.

## [2.0.0] — estado declarado en package.json

### Corregido (post-2.0.0, verificables en master)
- `fbe92034` fix(meni): notas aprobadas publican con sugerencias;
  restaurado `page_view` en navegación SPA (`<Analytics/>` remontado
  con skip del primer render).
- `f496c81b` chore(P0.8): removidas dependencias DOMPurify sin uso
  (`isomorphic-dompurify`, `@types/dompurify`) — vector del ENOENT SSR.
- `15b82c6e` fix(P0.7): materialización dual-write de `traffic_daily/{date}`.
- `63b1af54` fix(P0.7B): materialización histórica verificada en producción
  (65/65 padres reales) + parser `.env.local` CRLF/dígitos.
- `ef0e3068` fix(P0.6): hydration #418 en fechas relativas.

### Nota de versionado
`2.0.0` en `package.json` es la versión declarada del proyecto; no representa
un tag ni una release de GitHub. No existen tags/releases históricas — el
versionado formal comienza con la primera release etiquetada bajo
`docs/release-template.md`.
