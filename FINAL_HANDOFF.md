# FINAL_HANDOFF — Nicaragua Informate 4.0

Documento de transferencia para quien administra el sitio **sin programador dedicado**.
Última actualización: cierre de ciclo NI 4.0.

---

## 1. QUÉ ES ESTO

Medio digital de noticias de Nicaragua sobre **Next.js (App Router) + Firebase/Firestore + Vercel**.

- Frontend público: portada, artículos, categorías — generado por Next.js con revalidación (~60s en portada).
- Backend editorial: Firestore (`noticias`, `traffic_log`, `traffic_daily`, `meni_*`, `nios_*`).
- Panel de administración: `public/panel.html` (estático, funciona con la API admin).
- Pipeline editorial IA: **MENI** (evaluación editorial), **NIOS** (operación/crecimiento), Forense, Supervisor, Trust, Factuality, Learning.

Dominio: `https://nicaraguainformate.com`

---

## 2. MAPA DE ARQUITECTURA

### Frontend público (no tocar sin razón)

| Ruta | Archivo | Qué hace |
|------|---------|----------|
| `/` | `app/page.tsx` + `components/HomePagePro.tsx` | Portada: hero + secciones |
| `/noticias/[slug]` | `app/noticias/[slug]/page.tsx` + `components/ArticlePage.tsx` | Artículo completo |
| `/categoria/[slug]` | `app/categoria/[slug]/page.tsx` + `CategoryPagePro.tsx` | Índice por categoría |
| `/autor/[slug]` | `app/autor/` | Perfil de autor (E-E-A-T) |
| `/nosotros`, `/contacto`, `/privacidad`, `/terminos`, `/politica-editorial`, `/cookies`, `/correcciones`, `/metodologia-editorial` | `app/<ruta>/page.tsx` | Transparencia y legal |
| `/sitemap.xml` | `app/sitemap.ts` | Sitemap general (filtra noindex/tóxicos) |
| `/news-sitemap.xml` | `app/news-sitemap.xml/route.ts` | Sitemap Google News (solo <48h) |
| `/rss.xml`, `/feed.xml`, `/feed.json` | `app/rss*/route.ts` | Feeds |
| `/robots.txt` | `app/robots.ts` | Permite AdsBot, bloquea `/api/`, `/admin/` |

### Panel y APIs

- `public/panel.html` — panel estático (se autentica con Firebase Auth + `admin_session`).
- `app/admin/**` — sub-páginas admin del App Router (MENI, NIOS, analytics, etc.).
- `app/api/admin/**` — APIs protegidas por middleware (cookie `admin_session` o header `x-admin-token`).
- `app/api/cron/**` — jobs programados de Vercel (ver §5).

### Lógica editorial (lib/)

| Módulo | Función |
|--------|---------|
| `lib/meni/` | Pipeline de evaluación editorial (veredicto: PUBLICAR / PUBLICAR_CON_CAMBIOS / REVISAR / BLOQUEAR) |
| `lib/nios/` | Orquestador operativo (crons de recolección, reportes, watchdogs) |
| `lib/analytics/` | Agregación de tráfico + insights + acciones sugeridas |
| `lib/home-ranking.ts` | Ranking de portada (recencia + actividad del día) |
| `lib/db/homepage.ts` | Datos de portada (hero, últimas, más leídas, por categoría) |
| `lib/data.ts` | Acceso a noticias en Firestore |
| `lib/editorial/canonical.ts` | `shouldIndexArticle` — decide qué se indexa |
| `lib/seo-toxic.ts` | Slugs retirados → HTTP 410 |
| `lib/sanitize*.ts` | Sanitización de HTML de artículos |

---

## 3. VARIABLES DE ENTORNO CRÍTICAS

Si falta alguna, esa pieza se apaga. Configurar en Vercel → Settings → Environment Variables.

| Variable | Uso | Si falta |
|----------|-----|----------|
| `FIREBASE_*` (credenciales admin) | Todo el acceso a Firestore server-side | El sitio no carga noticias |
| `NEXT_PUBLIC_FIREBASE_*` | Auth del panel en el navegador | Login del panel falla |
| `ADMIN_API_KEY` | Auth de `/api/admin/*` | Panel no puede operar |
| `CRON_SECRET_TOKEN` / `CRON_SECRET` | Auth de `/api/cron/*` | Crons devuelven 401 |
| `NEXT_PUBLIC_SITE_URL` | Canonicals/OG | Metadatos incorrectos |

Verificación rápida: `GET /api/admin/estado` (pública) reporta el estado de servicios.

---

## 4. MENI — DOCTRINA OPERATIVA

Flujo: **Editor → MENI → Forense → Trust → Factuality → Supervisor → Editor Jefe → Publicación**.

Reglas permanentes:

1. **Recomendación ≠ bloqueo.** Una sugerencia de título u optimización nunca bloquea sola.
2. **REVISAR ≠ bloqueo.** El Editor Jefe humano puede confirmar y publicar.
3. **BLOQUEAR** solo cuando hay defecto real (bloqueantes > 0 o fallo de seguridad).
4. Aceptar una recomendación (p.ej. título sugerido) **re-evalúa la cadena completa**, nunca la salta.
5. `EDITORIAL_DNA_TRANSCRIPCION` está ACTIVO — no desactivar.
6. No bajar umbrales para que pasen más notas.

Si MENI marca algo extraño: leer el hallazgo (`field` + evidencia), no el score. El score es orientativo.

---

## 5. CRONS (vercel.json)

| Cron | Hora UTC | Qué hace | Si falla |
|------|----------|----------|----------|
| `nios-collect` | 08:00 | Recolección de datos NIOS | Reportes del día faltan |
| `resumen-diario` | 12:00 | Resumen diario al propietario | No llega el resumen |
| `departamento-central` | 00:00 | Ciclo central del departamento | Operación diaria incompleta |
| `departamento-daily` | 06:00 | Tareas diarias del departamento | Igual |
| `departamento-watchdog` | 01:00 | Vigila que el ciclo corrió | Sin alerta si algo falla |
| `nios-ceo-loop` | 02:00 | Loop estratégico NIOS | Análisis estratégico falta |
| `supervisor-watch` | 04:00 | Supervisión editorial | Revisiones no se ejecutan |
| `traffic-cleanup` | 03:00 | Limpia `traffic_log` viejo | La colección crece sin límite |
| `distribuciones-retry` | 05:15 | Reintenta distribución fallida | Publicaciones a redes quedan pendientes |
| `meni-learning-cycle` | Dom 06:00 | Aprendizaje semanal MENI | MENI no incorpora feedback |

Todos requieren `x-cron-secret` — Vercel lo inyecta. Si un cron devuelve 401: el secreto no coincide.

---

## 6. ANALYTICS — CÓMO LEERLO

- `traffic_log` = eventos crudos (ventana de análisis ~5,000 últimos).
- `traffic_daily/{YYYY-MM-DD}` = agregado por día (fuente para "actividad de hoy").
- `noticias.vistas` = **acumulado histórico** — NO es actividad reciente. No usarlo para "qué está caliente".
- El panel → Analytics muestra: AHORA MISMO (últimos 15 min), tendencias deterministas y **ACCIONES SUGERIDAS** con evidencia.
- Sesiones: solo si los eventos traen `sessionId`; si no, se muestra "sin datos" (honesto, no cero falso).
- **No hay APIs sociales** — la "dependencia de redes" se mide solo con referrers reales. Si una fuente ≥60% del tráfico, el panel lo alerta.

## 7. QUÉ VERIFICAR PERIÓDICAMENTE

1. `https://nicaraguainformate.com/` — ¿carga portada con noticia de hoy?
2. `.../sitemap.xml` — ¿lista artículos recientes?
3. `.../news-sitemap.xml` — ¿solo noticias <48h?
4. `.../panel.html` — ¿login + Analytics sin errores?
5. Google Search Console — semanal: impresiones, errores de cobertura.

## 8. SI ALGO FALLA

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Portada vacía | Firestore caído o credenciales | Revisar `FIREBASE_*` en Vercel, logs de función |
| Panel pide login y rebota | `ADMIN_API_KEY` / Firebase Auth | Verificar env vars, cookie `admin_session` |
| Analytics muestra "sin datos" | `traffic_log` vacío o API caída | Es estado honesto, no bug — verificar que /api/track reciba eventos |
| News sitemap vacío | Sin noticias <48h o error de caché | Publicar contenido; si persiste, logs de la ruta |
| Cron no corre | Secreto o timeout | Vercel → Cron Jobs → ver último run |
| Artículo viejo arriba | Solo si tiene tráfico hoy — es la regla | Verificar `traffic_daily` del día |

## 9. QUÉ NO TOCAR

- `lib/meni/` umbrales y `EDITORIAL_DNA_TRANSCRIPCION`.
- `lib/seo-toxic.ts` — lista de URLs retiradas (410 legal).
- `middleware.ts` — protege APIs admin, bloquea bots, CSP. Un cambio mal hecho abre el panel.
- `firestore.rules` — escrituras públicas limitadas.
- No crear `if (slug === "...")` — los fixes son sistémicos, nunca por artículo.
- No instalar otra plataforma ni duplicar motores.

## 10. COMANDOS

```bash
npm run dev      # desarrollo local
npm run build    # build de producción
npm run lint     # eslint --max-warnings 0
npx tsc --noEmit # tipos (usar NODE_OPTIONS=--max-old-space-size=8192 si falla por memoria)
npx vitest run   # suite completa (1291 tests al cierre)
```

---

*Este documento asume el estado del código al cierre del ciclo NI 4.0. Si el código cambia, este archivo debe actualizarse en el mismo commit.*
