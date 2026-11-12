# OPERACIÓN SIN DEVIN — Manual de operación

Nicaragua Informate · Next.js 15 + Firebase + Vercel · Repo: `Nicmay18/informate-nicaragua-final`

## 1. Requisitos de entorno

- **Node 22.x** (obligatorio — `engines` en package.json). Windows: instalar desde nodejs.org o `nvm-windows`.
- `npm ci` para instalar (nunca `npm install` a secas — el lockfile es la fuente de verdad).
- No requiere Docker ni servicios locales: Firestore es remoto.

## 2. Variables de entorno (solo nombres — nunca copiar valores a docs/commits)

| Variable | Uso | Dónde se configura |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` o `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` | Admin SDK (todo el backend) | `.env.local` + Vercel env |
| `NEXT_PUBLIC_FIREBASE_*` (API_KEY, APP_ID, AUTH_DOMAIN, MESSAGING_SENDER_ID, PROJECT_ID, STORAGE_BUCKET) | Firebase client | `.env.local` + Vercel env |
| `ADMIN_API_KEY` | Sesión admin (validación + firma dedup) | Vercel env |
| `ADMIN_SESSION_SECRET` | Firma HMAC de sesión opaca (tras PR #13) | Vercel env |
| `CRON_SECRET_TOKEN` (y legado `CRON_SECRET`) | Auth de rutas `/api/cron/*` | Vercel env |
| `CLEANUP_TOKEN` | Rutas de limpieza | Vercel env |
| `TG_TOKEN`, `TG_CHAT_ID`, `TG_CHAT` | Alertas Telegram NIOS | Vercel env |
| `NIOS_SITE_URL`, `NIOS_GSC_SITE_URL`, `NIOS_GA4_PROPERTY_ID` | Integraciones Search Console / GA4 | Vercel env |
| `GOOGLE_ADSENSE_CLIENT_ID` | AdSense | Vercel env |
| `GITHUB_TOKEN` | Scripts de auditoría GitHub | `.env.local` local |

Regla: **ningún valor real va al repo ni a la documentación**. `.env.local` está en `.gitignore`.

## 3. Comandos diarios

```bash
npm ci                          # instalar (después de cada pull)
npm run type-check              # tsc --noEmit
npm run lint                    # eslint, 0 warnings exigidos
npx vitest run                  # suite completa (~120 archivos)
npx vitest run tests/negocios.test.ts tests/negocios-rutas.test.ts   # solo Negocios
npm run build                   # build de producción local
npm run dev                     # desarrollo local
```

E2E del directorio comercial (con Firestore falso en memoria, sin tocar producción):

```bash
# Git Bash
NEGOCIOS_TEST_FIXTURE=1 NODE_OPTIONS="--require ./tests/fixtures/negocios-server.cjs" npx next build
npx playwright test -c playwright.negocios.config.ts
```

## 4. Estado del sitio y despliegues

- Producción: https://nicaraguainformate.com — despliega lo que entra a `master` vía merge de PR aprobado.
- Vercel dashboard → proyecto `informate-nicaragua-nextjs` → pestaña Deployments: cada PR genera un *preview* automático; producción solo cambia con merge a master.
- Comprobar el SHA desplegado: el commit de producción coincide con el último merge a `master`. Verificar que el deploy más reciente de Vercel tenga `meta.githubCommitSha` = HEAD de master.
- Logs: Vercel → Deployments → Functions / Runtime Logs. Errores de rutas API aparecen ahí.

## 5. Autenticación: cómo identificar fallos

- Login admin: `/login` → Firebase Auth → cookie `admin_session` (HttpOnly, Secure, SameSite=Strict, Max-Age 24h tras PR #13).
- Síntoma "me expulsa": cookie expirada o secreto cambiado → volver a entrar por `/login`.
- API admin sin sesión debe responder `401`. Si responde 200 sin sesión → **incidente de seguridad** (revisar `middleware.ts` y `lib/auth.ts` de inmediato).
- Rutas cron (`/api/cron/*`) solo aceptan `x-cron-secret`. Enviarla a otra ruta no debe dar acceso (tras #13 está restringida a 5 rutas admin específicas).
- Emails admin válidos: allowlist en `lib/admin-auth.ts` (`ADMIN_EMAILS`/config equivalente).

## 6. NIOS: comprobar crons y la cola

```bash
# Estado de la cola (read-only, con service account local)
node .audit/nios-cola-real.cjs   # genera .audit/nios-cola-real.json
```

- Heartbeats: colección `depto_heartbeat` — cada doc tiene `component`, `lastRunAt`, `nextExpectedAt`, `status`. Si `lastRunAt` es viejo → ese cron no corre.
- Cola: colección `depto_jobs` — campos `status`, `scheduledFor` (string ISO), `type`, `attempts`, `dedupKey`.
- Cronograma real (vercel.json): departamento-central 00:00, watchdog 01:00, nios-ceo-loop 02:00, traffic-cleanup 03:00, supervisor-watch 04:00, departamento-daily 06:00, nios-collect 08:00, resumen-diario 12:00 (UTC).
- **No tocar el estado de trabajos manualmente** ni lanzar pendientes en bloque: `article-pipeline` puede publicar, `operational-repair` puede reescribir datos.
- Cola recuperada ≠ PR mergeado: tras el deploy, `completed` debe crecer y `pending` bajar en mediciones separadas por ≥24h.
- **Ritmo esperado (verificado 29-oct):** ~25 jobs/día (scheduler 15 + watchdog 10). `pending` bajó 315→292 en el primer ciclo. Backlog ~300 → drena solo en ~12 días; no acelerar manualmente.
- **retry y dead-letter (diagnosticados 29-oct, `.audit/retry-deadletter.cjs`):**
  - `retry` article-pipeline: fallos permanentes de escritura (`undefined` en `result`, corregido en PR #21) o noticia inexistente → acabarán en `dead-letter` o `skipped`; no reejecutar a mano.
  - `dead-letter` operational-repair: "Transición inválida RESOLVED→RUNNING" — incidentes ya resueltos; estado terminal correcto, se quedan ahí.
- Si `pending` **sube** durante 3+ días o `retry`/`dead-letter` crecen, revisar `depto_heartbeat` y `lastError` antes de tocar nada.

## 7. SEO: verificación manual

```bash
curl -s https://nicaraguainformate.com/sitemap.xml | head
curl -s https://nicaraguainformate.com/robots.txt
curl -s https://nicaraguainformate.com/ | grep -o 'google-adsense-account[^>]*'
curl -s https://nicaraguainformate.com/ads.txt
```

- Search Console (manual, sin API): https://search.google.com/search-console → propiedad `sc-domain:nicaraguainformate.com` → Rendimiento (impresiones/clics/CTR/posición) y Cobertura (errores de indexación, sitemaps procesados).
- Al mergear #15: comprobar que `/sitemap.xml` solo incluye perfiles `aprobado` y vigentes — un perfil `pendiente` nunca debe aparecer.

## 8. Negocios y campañas (tras merge de #15)

- Panel: `/admin/negocios` (requiere sesión admin).
- Flujo: solicitud pública `/negocios/alta` → panel → Solicitudes → "Preparar perfil" → Guardar → "Aprobar y publicar".
- Campaña `pagado`: exige `pagoConfirmado` + `referenciaPago` + importe>0. **Solo marcar pagado cuando el dinero esté confirmado**.
- Piloto gratuito: `estadoPago=piloto`, importe 0, máx 3 activos, ≤45 días, nunca cuenta como ingreso.
- Reporte: panel → Campañas → "Reporte CSV" o `GET /api/admin/negocios-reporte?negocioId=X&dias=30`.
- Un clic en WhatsApp es un **clic**, no una venta ni una conversación — el CSV lo aclara.
- Auspiciadores (tras merge de #10): `/panel` sección comercial + `firestore.rules` requiere deploy autorizado.

## 9. Recuperación segura del servicio

1. Sitio caído (5xx general): Vercel → último deployment → **Redeploy/Rollback** al deployment anterior estable. No tocar código primero.
2. Error solo en una ruta: Vercel → Functions → logs de esa ruta → correlacionar con último merge.
3. Base de datos ilegible: revisar `firestore.rules` vigentes en Firebase Console y `lib/firebase-admin.ts` (credenciales).
4. Cola NIOS rota: sección 6 — mirar `depto_heartbeat` y `depto_jobs`, no reiniciar nada sin identificar la causa.
5. Volver a master estable: `git revert <merge-commit>` en rama nueva → PR → merge. Nunca force-push a master.

## 10. Acciones que NO se hacen sin autorización expresa

- `firebase deploy --only firestore:rules` (cambia permisos de datos en producción).
- `npm audit fix --force` (rompe compatibilidad con majors).
- Editar/eliminar documentos de Firestore en masa.
- Cambiar valores en Vercel Environment Variables.
- Enviar mensajes a prospectos o anunciantes.
- Desactivar o modificar branch protection.

## 11. Estructura del repo (dónde está qué)

```
app/            rutas Next.js (públicas, admin, api, cron)
components/     UI (admin/ para el panel)
lib/            lógica server (auth, firebase-admin, negocios/, ads/, nios/, departamento-central/)
lib/negocios/   módulo comercial (PR #15)
tests/          vitest + tests/e2e playwright
docs/           documentación operativa y auditorías
docs/comercial/ kit de venta y verificación Negocios
.audit/         scripts de medición read-only (no producción)
middleware.ts   matriz de autorización de rutas
vercel.json     crons + headers de caché
firestore.rules reglas (default-deny; #10 propone cambios)
```

## 12. Cloudflare (capa real frente a Vercel) — verificado 28-oct-2026

El dominio pasa por Cloudflare antes de Vercel. Las cabeceras del origen **no**
deciden solas lo que el visitante recibe: existe una regla de caché amplia que
guarda HTML, JSON de APIs y errores 404 (`cf-cache-status: HIT`).

**Comprobación rápida (hacerla tras cada deploy o si algo "no se ve"):**
```bash
curl -si https://nicaraguainformate.com/api/admin/negocios | grep -i 'HTTP/\|cf-cache-status\|age'
# Correcto: 401 Unauthorized.
# Si dice 200 con cf-cache-status: HIT → la caché está sirviendo datos admin a cualquiera. URGENTE.
curl -si https://nicaraguainformate.com/negocios | grep -i 'HTTP/\|age'
# Si una página nueva da 404 con age alto → caché congelada → purgar.
```

**Acciones (panel Cloudflare, sin código):**
1. Login https://dash.cloudflare.com → `nicaraguainformate.com`.
2. **Caching → Cache Rules**: crear regla *Bypass cache* ANTES de cualquier regla
   amplia, para: `URI Path empieza con /api/` O `/admin/` O `Cookie contiene admin_session`.
3. **Caching → Purge Cache → Purge Everything**: tras un deploy que cambia
   contenido (o si una URL canónica muestra contenido viejo/404 falso).
4. **Caching → Configuration**: Browser Cache TTL recomendado ≤30 min o
   "Respect existing headers" — un valor de 4h retrasa correcciones del sitio.
5. Regla mental: una URL con `?cualquier=parametro` no es la canónica — el
   cache es por URL completa. "Me funciona con ?v=2 pero no sin" = caché vieja.

## 13. Alertas y monitoreo

**Ya instalado (PR #21):** el workflow `.github/workflows/salud-produccion.yml`
corre estas sondas cada 6 h y falla → GitHub envía correo a quien tenga
"Watch → All Activity" en el repo. Sin costo ni servicios externos. Para
recibirlo: repo → Watch → Custom → marcar "Actions".

Recomendado además: un monitor de uptime externo (UptimeRobot/BetterStack —
plan gratuito) por si GitHub Actions está caído, con estas sondas:

| URL | Criterio de alarma | Significado |
|---|---|---|
| `https://nicaraguainformate.com/` | != 200 | sitio caído |
| `https://nicaraguainformate.com/news-sitemap.xml` | != 200 | **outage de datos** (la ruta devuelve 503 intencionalmente cuando falla Firestore) |
| `https://nicaraguainformate.com/sitemap.xml` | != 200 o sin `<url>` | sitemap roto → riesgo SEO |
| `https://nicaraguainformate.com/api/admin/negocios` | == 200 | fuga por caché CF (debe ser 401 siempre) |
| `https://nicaraguainformate.com/api/telemetry/negocios` | 5xx | telemetría caída |

Además: Vercel → proyecto → Notifications activa alertas de deploy fallido al
correo; Sentry ya captura `logger.error` en producción.

## 14. Checklist para persona no técnica

**Diario (3 min):**
- [ ] Abrir `nicaraguainformate.com` — ¿carga la portada con noticias de hoy?
- [ ] Abrir una noticia — ¿título, fecha, imagen y texto completos?
- [ ] Si algo viejo: anotar la URL y aplicar §12.3 (purge) o avisar.

**Semanal (10 min):**
- [ ] `/news-sitemap.xml` devuelve XML (si da error → la alerta debería haber sonado).
- [ ] Login en `/login` funciona y el panel abre.
- [ ] Search Console → Cobertura: sin errores nuevos; sitemaps "Correcto".
- [ ] Revisar la cola NIOS (`node .audit/nios-cola-real.cjs` si hay acceso):
      `pending` debe bajar semana a semana; si sube siempre, avisar.

**No tocar nunca (§10 ampliado):** reglas de Cloudflare sin saber qué hacen,
colecciones de Firestore, variables de Vercel, crons de `vercel.json`,
`middleware.ts`, y cualquier deploy manual de reglas de seguridad.
