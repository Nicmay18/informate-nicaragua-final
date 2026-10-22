# Nicaragua Informate — Operación y Mantenimiento

**Propósito:** que el sitio pueda operarse, desplegarse y repararse sin depender de ningún agente ni persona concreta.
**Regla principal:** estabilidad > refactorización. Si algo funciona, no se toca.
**Documento índice de políticas y congelamiento:** `OPERACION.md`. Este documento es el manual práctico.

---

## 1. Stack y cuentas

| Pieza | Qué es | Dónde se administra |
|---|---|---|
| Código | Next.js 15.5 (App Router), React 19, TypeScript | GitHub `Nicmay18/informate-nicaragua-final`, rama `master` |
| Hosting + crons | Vercel, proyecto `informate-nicaragua-nextjs` | vercel.com → proyecto → Deployments / Settings / Logs / Cron Jobs |
| Base de datos | Firebase Firestore (Admin SDK en servidor, reglas en `firestore.rules`) | console.firebase.google.com |
| Imágenes | Firebase Storage / Cloudinary (ver `next.config.ts` → `images.remotePatterns`) | Mismas consolas |
| Analytics | GA4 propiedad `525672447`, stream `G-W1B5J61WEP`, Consent Mode opt-in | analytics.google.com |
| Search | Google Search Console `sc-domain:nicaraguainformate.com` | search.google.com/search-console |
| Errores | Sentry (`@sentry/nextjs`) | sentry.io |
| Publicidad | AdSense `ca-pub-4115203339551838` + Auspiciadores directos (propio) | adsense.google.com / `/panel/ads` |
| Distribución | Telegram bot, Facebook Graph (tokens en Vercel) | Vercel → Environment Variables |
| IA editorial (MENI) | Groq API (`GROQ_API_KEY`) y Gemini (`generativelanguage.googleapis.com`) | console.groq.com / ai.google.dev |

---

## 2. Ejecutar localmente

```bash
git clone https://github.com/Nicmay18/informate-nicaragua-final.git
cd informate-nicaragua-final
npm ci
cp .env.example .env.local      # completar valores (ver §4)
npm run dev                     # http://localhost:3000
```

Build de producción local (lo mismo que hace Vercel):

```bash
npm run build                   # ~4-8 min en máquina modesta
npx next start -p 3000
```

> Node 22 (el que usa CI). `npm run build` requiere credenciales Firebase válidas en `.env.local` para prerenderizar home/sitemaps; sin ellas compila pero genera páginas vacías.

---

## 3. Verificación antes de cualquier cambio

```bash
npm run type-check              # tsc --noEmit
npm run lint                    # eslint --max-warnings 0
npx vitest run                  # suite completa (~3 min)
npm run build
```

Tests específicos por área:

| Área | Comando |
|---|---|
| GA4 un solo page_view | `npx vitest run tests/ga4-single-pageview.test.ts` |
| Publicidad / auspiciadores | `npx vitest run tests/ads-api.test.ts tests/auspiciadores.test.ts` |
| Telemetría tráfico | `npx vitest run tests/traffic-daily-writer.test.ts tests/analytics-insights.test.ts` |
| MENI veredicto editorial | `npx vitest run tests/meni-*.test.ts` |
| Lighthouse (mismo gate que CI) | `npx @lhci/cli@0.14.x autorun --config=lighthouserc.js` con el server en :3000 |

Tres tests hacen red real (GSC/GA4/Firestore) y pueden dar timeout bajo carga: `lib/ceo-agent.test.ts`, `tests/mission9-real-sources.test.ts`, `tests/nios-operating-mode.test.ts`. Si fallan solo ellos, re-ejecutarlos aislados; no es regresión de código.

---

## 4. Variables de entorno

Plantilla: `.env.example`. Las mismas claves viven en Vercel → Settings → Environment Variables (Production).

| Variable | Para qué | Si falta |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` (o las 3 `FIREBASE_*`) | Admin SDK: toda lectura/escritura de Firestore en servidor | Sitio sin datos; 500 en rutas dinámicas |
| `ADMIN_API_KEY` | Login del panel y autorización de `/api/admin/*` | Panel inaccesible |
| `CRON_SECRET` / `CRON_SECRET_TOKEN` | Autorizar crons de Vercel | Crons devuelven 401 |
| `NEXT_PUBLIC_GA_ID` | GA4 (fallback hardcodeado `G-W1B5J61WEP`) | Usa fallback |
| `TG_TOKEN`, `TG_CHAT_ID` | Boletín Telegram diario | Cron `resumen-diario` marca `failed` |
| `GROQ_API_KEY` | MENI editor autónomo / pipeline de publicación | Enriquecimiento IA desactivado |
| `NIOS_GA4_PROPERTY_ID`, `NIOS_GSC_SITE_URL` | Recolección NIOS (GA4/GSC) | Paneles NIOS en `CONFIG_REQUIRED` |
| `GOOGLE_ADSENSE_CLIENT_ID` | Diagnóstico NIOS de AdSense (no afecta a servir anuncios) | Solo diagnóstico |

**Nunca** commitear `.env.local`. Rotar una clave = cambiarla en Vercel + redeploy; la sesión admin (`admin_session`, 24 h) caduca y hay que volver a entrar.

---

## 5. Desplegar

1. Trabajar en rama → PR contra `master`. CI (`.github/workflows/ci.yml` + `lighthouse.yml`) debe estar verde: lint, tsc, vitest, build, Playwright e2e, Lighthouse.
2. Merge a `master` → Vercel despliega automáticamente a producción.
3. Verificar tras deploy (ver `PRODUCTION_CHECKLIST.md`).

**Rollback:** Vercel → Deployments → deployment anterior → "Promote to Production". Es inmediato y no toca la base de datos. Después, revertir el commit en Git (`git revert <sha>`) para que el siguiente deploy no reintroduzca el problema.

---

## 6. Firebase / Firestore

- Reglas: `firestore.rules`. Modelo: el navegador **no** escribe nada sensible; todas las escrituras de contadores/telemetría pasan por server actions o `/api/*` con Admin SDK (que ignora reglas). Colecciones de telemetría (`traffic_log`, `traffic_daily`, `views`, `ads_daily`, `auspiciadores`) son admin-only o deny-by-default.
- Desplegar reglas (solo cuando cambien y tras revisión): `firebase deploy --only firestore:rules`.
- Índices: `firestore.indexes.json` → `firebase deploy --only firestore:indexes`. Si una consulta nueva falla con "requires an index", el error trae el enlace para crearlo.
- Retención: `traffic_log` tiene TTL (`expiresAt`, limpieza por cron `traffic-cleanup`). No borrar colecciones a mano.
- Costos: el gasto de Firestore es por lecturas. Las páginas públicas usan caché de Next (`revalidate`/tags); si el consumo sube, revisar primero crons y paneles admin, no el sitio público.

---

## 7. Analytics y consentimiento

- GA4 se carga en `app/layout.tsx` una sola vez. El stream tiene medición mejorada con `pageChangesEnabled`, que ya emite `page_view` en navegación SPA. **No montar `components/Analytics.tsx` ni `DeferredAnalytics.tsx`**: duplica page views (test de regresión: `tests/ga4-single-pageview.test.ts`).
- Consent Mode: default `denied`; `CookieBanner` + `ConsentScript` actualizan a `granted` al aceptar (claves `ni_cookie_consent`, `ni_cookie_preferences`). Mientras la política sea opt-in, GA4 subcuenta usuarios reales — es decisión de privacidad del propietario, no un bug.
- Tráfico server-side real: colección `traffic_log` (fuente primaria del panel), agregado diario en `traffic_daily`.
- No se recoge PII ni IP en `traffic_log` (campos permitidos en `firestore.rules`).

---

## 8. Publicidad

### AdSense
- Integración técnica: `components/AdsenseUnit.tsx` (carga lazy por IntersectionObserver, cliente `ca-pub-4115203339551838`), `public/ads.txt`. Se monta en `components/ArticlePage.tsx`.
- `ad_storage` sigue el consentimiento del banner. Sin consentimiento, AdSense sirve anuncios no personalizados.
- **Estado de la cuenta** (aprobada / en revisión / limitada) solo se ve en adsense.google.com; el código no lo sabe. Ver `MONETIZACION_ESTADO.md`.

### Auspiciadores directos
- Panel: `/panel/ads` (requiere login admin). Alta, edición, activar/desactivar, fechas inicio/vencimiento, posición, logo, enlace.
- Render: `components/SponsorBanner.tsx` — rotación determinista por día entre vigentes, `rel="sponsored noopener"`, espacio reservado (sin CLS), no renderiza nada si no hay campaña vigente.
- Métricas: impresiones/clics por `/api/telemetry/ads` (dedupe por sesión) → `auspiciadores.{impresiones,clics}` y `ads_daily/{sponsorId_fecha}`. CTR en el panel.
- Página comercial: `/publicidad`. Solo texto cualitativo; no publicar cifras que no salgan de GA4/GSC verificables.

---

## 9. Administración editorial

- Login: `/login` → cookie `admin_session` (24 h). Si una acción devuelve "Unauthorized", la sesión caducó: salir y volver a entrar.
- Panel: `/panel` (salud del sitio, rendimiento, tráfico en vivo, oportunidades, alertas, diagnóstico).
- Editor: `/admin/editor`. Publicar/editar una nota revalida su ruta automáticamente; **no** hace falta republicar por una corrección.
- MENI (control editorial): bloquea solo por datos falsos, fuentes inexistentes, contradicciones o problemas legales; lo demás son recomendaciones. Si un bloqueo parece falso positivo, el veredicto indica el texto exacto que lo dispara.
- Crons (`vercel.json`): recolección NIOS 08:00 UTC, boletín Telegram 12:00 UTC, limpieza tráfico 03:00 UTC, etc. Logs en Vercel → Logs filtrando `/api/cron/`.

---

## 10. Mantenimiento básico

| Frecuencia | Tarea |
|---|---|
| Diario | Portada carga; última nota publicada visible; `/panel` sin alertas rojas; boletín Telegram enviado (`resumenes_diarios/{fecha}.status = sent`) |
| Semanal | GSC: cobertura e indexación sin picos de errores; Vercel: sin funciones con error rate alto; Sentry: nuevos issues |
| Mensual | `npm audit --omit=dev` (solo actuar en críticas explotables); revisar costo Vercel/Firebase; revisar vencimientos de auspiciadores |
| Al cambiar claves | Actualizar en Vercel, redeploy, re-login en panel |

### Incidentes frecuentes

| Síntoma | Causa habitual | Acción |
|---|---|---|
| "Unauthorized" en el panel | `admin_session` caducada (24 h) o `ADMIN_API_KEY` rotada | Re-login |
| Home vacía / 500 | Credenciales Firebase inválidas o cuota | Vercel Logs → `firebase-admin`; verificar variables |
| Nota editada no se actualiza | Caché CDN hasta `revalidate` | Esperar 1 min; si persiste, `/api/revalidate` con token admin |
| Telegram no envía | Token inválido / chat cambiado | Revisar `TG_TOKEN`, `TG_CHAT_ID`; cron `distribuciones-retry` reintenta |
| Lighthouse CI rojo | Contraste/target-size/meta en nuevas vistas | `lighthouserc.js` define el gate; no rebajar umbrales, corregir el componente |
| Hydration error #418 | Texto dependiente de `Date.now()` sin `suppressHydrationWarning` | Ver `components/ClientTime.tsx` como patrón |

---

## 11. Qué no hacer

- No montar un segundo loader de GA4 ni cambiar el ID sin causa demostrada.
- No abrir reglas de Firestore "para que funcione": la escritura va por servidor.
- No publicar cifras de audiencia en `/publicidad` sin fuente verificable.
- No usar auto-refresh de anuncios, tráfico comprado ni clics incentivados (viola AdSense y la política editorial).
- No borrar colecciones, dominios ni proyectos. No modificar facturación sin decisión del propietario.
- No hacer `git push --force` a `master` ni tocar la protección de rama.
