# Checklist de producción — Nicaragua Informate

Ejecutar **antes de publicar un deploy** (fase A) y **después de publicar** (fase B).
Marca [ ] pendiente · [x] verificado. No saltarse pasos fallidos: corregir o revertir.

---

## A. Antes de publicar

### Código
- [ ] `npm run type-check` — tsc sin errores
- [ ] `npm run lint` — ESLint con `--max-warnings 0` en verde
- [ ] `npx vitest run` — suite completa verde
- [ ] `npm run build` — build de producción completa (≈102 rutas)
- [ ] CI del PR en verde: Lint & TypeScript, Unit & Integration Tests, Build, E2E, Lighthouse CI, CI Summary

> Si solo fallan `lib/ceo-agent.test.ts`, `tests/mission9-real-sources.test.ts` o
> `tests/nios-operating-mode.test.ts` por timeout: re-ejecutarlos aislados.
> Hacen red real (GSC/GA4/Firestore) y son sensibles a carga, no son regresión.

### Analytics y consentimiento
- [ ] `npx vitest run tests/ga4-single-pageview.test.ts` — un solo `page_view` por navegación
- [ ] Banner de consentimiento visible y funciona (aceptar/rechazar)
- [ ] Consent denied por defecto; tras aceptar, `gcs=G111` en los hits a GA4
- [ ] Ningún segundo loader de GA4 montado en `layout.tsx`

### Variables y servicios
- [ ] Vercel → Environment Variables completas: `FIREBASE_*` o `FIREBASE_SERVICE_ACCOUNT_BASE64`, `ADMIN_API_KEY`, `CRON_SECRET`, `CRON_SECRET_TOKEN`, `TG_TOKEN`, `TG_CHAT_ID`, `GROQ_API_KEY`
- [ ] Sin secretos en el diff del PR (`git diff` / `git status` limpio de `.env*`)

### Firebase / Firestore
- [ ] `firestore.rules` sin escrituras públicas a `views`, `traffic_*`, `ads_daily`, `auspiciadores`
- [ ] Los flujos de escritura pasan por server actions / Admin SDK

### Publicidad
- [ ] `npx vitest run tests/ads-api.test.ts tests/auspiciadores.test.ts`
- [ ] `ads.txt` presente en `/ads.txt`
- [ ] `/publicidad` sin cifras de audiencia que no se puedan verificar en GA4/GSC

### SEO
- [ ] `app/sitemap.ts` y `app/news-sitemap.xml` compilan
- [ ] `robots.txt` permite `/` y bloquea `/admin`, `/api`, `/buscar`
- [ ] Metadata (título, description, canonical, OG) generada en `<head>` — verificar `view-source:` de una categoría y un artículo
- [ ] Lighthouse local (opcional pero recomendado): `npx @lhci/cli@0.14.x autorun` con `next start` en :3000 — sin audits rojos de contraste, target-size, meta-description

---

## B. Después de publicar (5–10 min post-deploy)

### Sitio
- [ ] `https://nicaraguainformate.com/` carga, con noticias reales (no vacía)
- [ ] `/noticias` lista con paginación
- [ ] Una categoría, p. ej. `/categoria/sucesos`, carga con artículos
- [ ] Un artículo cualquiera abre completo (texto, imagen, tiempo, sponsor si hay campaña)
- [ ] Una URL inexistente devuelve 404 con el diseño del sitio
- [ ] Responsive: abrir en móvil — menú inferior usable, sin solapes
- [ ] Consola del navegador sin errores rojos nuevos

### SEO
- [ ] `/sitemap.xml` → 200 y lista URLs recientes
- [ ] `/news-sitemap.xml` → 200
- [ ] `/robots.txt` → 200
- [ ] `view-source:` de una página: `<meta name="description">` dentro de `<head>` (no al final del body), canonical correcto
- [ ] `view-source:` tiene `<link rel="canonical">` sin query params de tracking

### Analytics
- [ ] GA4 Realtime muestra la visita tras aceptar cookies
- [ ] Navegar a otra página: un solo `page_view` por navegación (Network → `collect`, payload `en=page_view`)
- [ ] DevTools → Network: sin `collect` duplicado ni dos requests `gtag/js` distintos

### Publicidad
- [ ] Si hay campaña vigente, el banner de auspiciador aparece; si no hay, no queda hueco
- [ ] Click en banner abre enlace del cliente (`rel="sponsored"`)

### Operación
- [ ] `/panel` carga tras login; sin alertas rojas nuevas
- [ ] Vercel → Logs: sin errores 500 en `/api/*` tras el deploy
- [ ] Crons del día siguientes a su hora prevista sin fallos (Vercel → Cron Jobs)

### Si algo falla
1. Vercel → Deployments → deployment anterior → **Promote to Production** (rollback inmediato).
2. `git revert <commit>` para que el siguiente deploy no reintroduzca el problema.
3. Documentar el incidente con fecha, síntoma y causa.
