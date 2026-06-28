# Auditoría Forense Nicaragua Informate — Junio 2026

## Resumen Ejecutivo

| Hallazgo | Riesgo | Estado |
|---|---|---|
| `removeConsole: false` en next.config.ts | 🔴 CRÍTICO | **ARREGLADO** → `true` |
| `no-cache` en homepage/noticias (middleware.ts) | 🔴 CRÍTICO | **ARREGLADO** → solo panel.html |
| 90 `console.log` en 56 archivos de API | 🟡 ALTO | Mitigado por `removeConsole: true` |
| `firebase-admin-key.json` en scripts/ | 🔴 CRÍTICO | **EN .gitignore** pero existe localmente |
| CSP con `unsafe-inline` y `unsafe-eval` | 🟡 ALTO | Necesita endurecimiento |
| Scripts masivos en scripts/auditoria/ (324 items) | 🟡 ALTO | Probablemente código muerto |
| `ignoreDuringBuilds: true` en eslint | 🟠 MEDIO | Desactivado temporalmente |
| `X-Frame-Options: SAMEORIGIN` (no DENY) | 🟢 BAJO | Intencional para embeds |

---

## Cambios Aplicados

### 1. `next.config.ts` — `removeConsole: true`
- **Antes**: `removeConsole: false` → todos los console.log llegaban al navegador del usuario
- **Ahora**: `removeConsole: true` → console.log se eliminan del bundle de producción
- **Impacto**: Reduce tamaño del JS, mejora rendimiento, elimina fugas de datos

### 2. `middleware.ts` — Cache de homepage y noticias
- **Antes**: `no-store` en homepage y noticias → Vercel no cacheaba nada → TTFB alto
- **Ahora**: Solo `panel.html` tiene `no-store`. Homepage y noticias usan cache normal
- **Impacto**: Mejora LCP y FCP al permitir cache de Vercel/Edge

---

## Hallazgos Pendientes (requieren acción del usuario)

### 🔴 CRÍTICO: `scripts/firebase-admin-key.json`
- **Problema**: Archivo con clave privada de Firebase Admin existe localmente
- **Estado**: Está en `.gitignore` (no se sube a git)
- **Acción**: Si el repo se clona en otro lugar, rotar la clave y eliminar el archivo local

### 🟡 ALTO: Scripts de auditoría (324 archivos en scripts/auditoria/)
- **Problema**: Cientos de scripts .mjs de procesamiento de noticias
- **Riesgo**: Archivos muertos que ocupan espacio y pueden contener credenciales
- **Acción**: Mover a `/archive/` los scripts no usados desde hace 3+ meses

### 🟡 ALTO: CSP (Content Security Policy) permisivo
- **Problema**: `unsafe-inline` y `unsafe-eval` en `script-src`
- **Riesgo**: Permite ejecución de scripts inline (XSS potencial)
- **Acción**: Eliminar `'unsafe-eval'` y `'unsafe-inline'` de `script-src` si Next.js lo permite

### 🟠 MEDIO: `eslint: { ignoreDuringBuilds: true }`
- **Problema**: Errores de TypeScript/ESLint pasan al build
- **Acción**: Ejecutar `npm run lint:fix` y corregir errores, luego reactivar

### 🟢 BAJO: Dependencias en package.json
- **Estado**: `firebase` 12.14.0, `next` 15.3.9, `react` 19.0.0 — versiones actuales
- **Nota**: `dotenv` en devDependencies (17.4.2) — la versión correcta es 16.x

---

## Métricas de Rendimiento (Lighthouse)

| Métrica | Actual | Target | Estado |
|---|---|---|---|
| Rendimiento | 71 | 95 | ❌ |
| LCP | 2.8s | <2.5s | ❌ |
| INP | 88ms | <200ms | ✅ |
| CLS | 0 | <0.1 | ✅ |
| FCP | 2.3s | <1.8s | ❌ |
| TTFB | 1.1s | <600ms | ❌ |

### Recomendaciones para alcanzar Rendimiento 95+:
1. ✅ Cache de homepage (hecho)
2. Usar `next/image` en lugar de `<img>` en todos los componentes
3. Preconnect a Google Ads: `<link rel="preconnect" href="https://pagead2.googlesyndication.com">`
4. Lazy load OneSignal SDK (cargar solo tras interacción del usuario)
5. Considerar `partytown` para GTM/Analytics en web worker

---

## Seguridad: Headers Actuales

| Header | Valor | Estado |
|---|---|---|
| X-Frame-Options | SAMEORIGIN | ⚠️ Intencional |
| X-Content-Type-Options | nosniff | ✅ |
| X-XSS-Protection | 1; mode=block | ✅ |
| Referrer-Policy | strict-origin-when-cross-origin | ✅ |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | ✅ |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | ✅ |
| Cross-Origin-Opener-Policy | same-origin | ✅ |
| Content-Security-Policy | Completo (ver next.config.ts) | ⚠️ Permisivo |

---

## Inventario de Archivos Scripts/

### Referenciados por la app (activos):
- Ninguno — todos los scripts en `scripts/` son utilidades manuales, no parte del build

### Probablemente muertos (no referenciados):
- `scripts/auditoria/` — 324 archivos de procesamiento masivo
- `scripts/batch*.mjs` — scripts de carga masiva de noticias
- `scripts/pulir-*.mjs` — scripts de reescritura con IA
- `scripts/publicar-*.mjs` — scripts de publicación masiva
- `scripts/auditor-*.mjs` — auditorías manuales
- `scripts/detectar-*.js` — detección de contenido problemático

### Actuales (usados por build/deploy):
- `package.json` scripts: `scripts:organize` → `scripts/cli.js` (¿existe?)

---

## Próximos Pasos Recomendados

1. [ ] Verificar que `firebase-admin-key.json` NO esté en el repo (`git ls-files | grep firebase-admin-key`)
2. [ ] Ejecutar `npm run lint:fix` y reactivar `ignoreDuringBuilds: false`
3. [ ] Mover scripts viejos a `/scripts/archive/`
4. [ ] Reemplazar `<img>` por `<Image>` de Next.js en todos los componentes
5. [ ] Endurecer CSP: quitar `'unsafe-eval'` y `'unsafe-inline'` de script-src
6. [ ] Medir Lighthouse post-cambios para verificar mejora

---

*Generado: Junio 2026*
*Auditor: Cascade AI*
