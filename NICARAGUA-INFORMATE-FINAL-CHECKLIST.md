# Nicaragua Informate — Checklist Final de Entrega

Criterio: marcar `[x]` solo lo verificado con evidencia. No marcar por expectativa.

## Build y calidad de código

- [x] `npm run type-check` pasa sin errores
- [x] `npm run lint` pasa sin advertencias
- [x] `npm run test:merge` pasa (622/622 tests, 61/61 archivos + lint) — última corrida final
- [x] `npm run build` pasa (producción, 101 páginas estáticas) — última corrida final

## Arquitectura

- [x] Inventario real del repositorio ejecutado
- [x] Escaneo de `TODO/FIXME/hardcode/console.log/Google penaliza` completado
- [ ] Mapa de dependencias actualizado

## Frontend

- [ ] Revisión mobile-first página por página
- [ ] Touch targets >= 44px
- [ ] Sin overflow horizontal
- [ ] Contraste y tipografía verificados
- [ ] Skip-to-content funcional
- [ ] Imágenes con `alt` y loader optimizado
- [ ] Ads no destruyen experiencia móvil

## SEO

- [x] `sitemap.xml` presente
- [x] `news-sitemap.xml` presente
- [x] `robots.ts` presente
- [x] `rss.xml` / `feed.json` presentes
- [x] Schema `NewsArticle`, `Organization`, `BreadcrumbList`, `WebSite` presentes
- [x] Canonical y Open Graph implementados
- [ ] Validación real con Google Rich Results (requiere deploy)

## Backend y Firebase

- [x] `traffic_log` escribe `expiresAt`
- [x] Reglas `firestore.rules` coinciden con el código
- [x] Índices `firestore.indexes.json` incluyen `traffic_log`
- [ ] TTL de `traffic_log` activado en Firebase Console (manual)
- [ ] Credenciales de Firebase configuradas en Vercel

## NIOS

- [x] GSC/GA4 retornan `CONFIG_REQUIRED` cuando faltan credenciales
- [x] Article momentum clasifica `SILENT / INFORMATIONAL / ACTIONABLE`
- [x] Alert engine: deduplicación, cooldown, fingerprint
- [x] `ceo-verdict` no afirma penalizaciones de Google
- [ ] Pipeline ejecutado con datos reales (requiere credenciales)

## Cron y notificaciones

- [x] Cron jobs registrados en `vercel.json`
- [x] `resumen-diario` con idempotencia por fecha
- [x] `traffic-cleanup` sin condición de carrera
- [ ] Revisión de distribución duplicada (requiere tokens reales)

## Seguridad

- [x] No secrets hardcodeados en el diff
- [ ] `.env.local` no trackeado
- [x] `newsletter_subscribers` no permite modificar a cualquier usuario
- [x] Headers de seguridad en `next.config.ts`
- [ ] CSP sin `'unsafe-inline'` (ver evaluación real con Next 15)

## Performance

- [x] `data-merger` optimizado con `select()`
- [x] `removeConsole` activo en producción
- [ ] LCP, INP, CLS, TTFB medidos con tráfico real

## Lenguaje y semántica

- [x] Textos `Google penaliza` / `AdSense rechazó` convertidos a "riesgo interno"
- [x] `PROMPT-TITULOS-RESUMEN.md` sin afirmaciones no verificadas
- [x] `public/panel.html` sin afirmaciones no verificadas
- [x] `app/api/admin/limpiar-noindex` no garantiza indexación de Google

## Documentación

- [x] `FINAL-NICARAGUA-INFORMATE-HANDOVER.md` creado
- [x] `FINAL-NICARAGUA-INFORMATE-CHECKLIST.md` creado
- [x] `NICARAGUA-INFORMATE-FINAL-HANDOVER.md` creado
- [x] `NICARAGUA-INFORMATE-FINAL-CHECKLIST.md` creado

## Git

- [ ] `git status` limpio de secrets y artefactos
- [ ] `git diff` revisado
- [ ] Sin commits/pushes sin autorización

## Última validación

- Fecha: 2026-08-29
- `type-check`: PASS
- `lint`: PASS
- `test:merge`: ver `NICARAGUA-INFORMATE-FINAL-HANDOVER.md`
- `build`: ver `NICARAGUA-INFORMATE-FINAL-HANDOVER.md`
