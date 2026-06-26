# AUDITORIA FORENSE - NicaraguaInformate.com
## Fecha: 26 de junio 2026
## Estado actual del sitio post-incidente

---

## 1. COMMITS RECIENTES (ultimos 20)

```
a3b624d fix-utf8-panel                                    (arreglo de encoding UTF-8)
a043800 restore-panel-original                           (revert a e7faa93)
93719d5 fix-utf8-panel                                   (intento anterior de fix)
0a65b88 Revert "Eliminar codigo muerto..."               (mi revert del commit de eliminacion)
a750765 test                                             (mis cambios de analytics/firebase)
e7faa93 Eliminar codigo muerto agente crecimiento +...   (commit que elimino funciones)
a11781b emergency-fix: detener sangrado ISR             (ISR 1h -> 24h)
29b5e00 emergency-fix: detener sangrado de recursos     (optimizaciones AdSense/guías)
```

## 2. FUNCIONES DE VERCEL - ESTADO

### API Routes existentes (functions):
- `app/api/admin/agente-crecimiento/route.ts`         - EXISTE (restaurado por revert)
- `app/api/admin/distribuir/route.ts`                 - EXISTE (Telegram + otros)
- `app/api/admin/guardar-directo/route.ts`            - EXISTE
- `app/api/admin/news/route.ts`                       - EXISTE
- `app/api/admin/news/[id]/route.ts`                  - EXISTE
- `app/api/admin/dashboard-calidad/route.ts`          - EXISTE
- `app/api/admin/traffic/route.ts`                    - EXISTE
- `app/api/admin/config/route.ts`                     - EXISTE
- `app/api/admin/copy-social/route.ts`                - EXISTE
- `app/api/admin/metricas/route.ts`                   - EXISTE (restaurado)
- `app/api/admin/push-notificar/route.ts`             - EXISTE (restaurado)
- `app/api/admin/twitter/route.ts`                    - EXISTE (restaurado)
- `app/api/admin/whatsapp/route.ts`                   - EXISTE (restaurado)
- `app/api/admin/medium/route.ts`                     - EXISTE (restaurado)
- `app/api/cron/distribuir-pendientes/route.ts`       - EXISTE (restaurado)
- `app/api/revalidate/route.ts`                       - EXISTE
- `app/api/views/[slug]/route.ts`                     - EXISTE pero DESHABILITADA
- `app/api/view/route.ts`                             - EXISTE pero DESHABILITADA

### Funciones deshabilitadas (para ahorrar recursos):
- `/api/views/[slug]` - Devuelve `{vistas: 0, disabled: true}` (NO toca Firestore)
- `/api/view` - Similar, deshabilitado

## 3. ISR (Incremental Static Regeneration)

### Cambios realizados:
- `app/page.tsx`: `revalidate = 86400` (24h) + `dynamic = 'force-static'`
- `app/noticias/page.tsx`: `revalidate = 86400`
- `app/noticias/[slug]/page.tsx`: `revalidate = 86400`
- `app/categoria/[slug]/page.tsx`: `revalidate = 86400`
- Otras páginas similares

### Impacto:
- Reduccion de lecturas Firestore ~99% vs force-dynamic
- Las noticias nuevas aparecen en cache max 24h (antes 1h)

## 4. TRACKING DE VISTAS

### Opcion A: API de servidor (DESHABILITADA)
- `app/api/views/[slug]/route.ts` - PAUSADA para ahorrar invocaciones Vercel
- Consumia 1 function invocation por vista
- Con 3000 vistas/dia = 3000 invocaciones = podria exceder limite gratis

### Opcion B: Firebase client-side (ACTIVA)
- `components/ArticlePage.tsx` - Tiene tracking con `getClientDb()`
- Escribe a Firestore `views/{slug}` directo desde navegador
- CERO invocaciones Vercel (todo en cliente/Firebase)
- Agregado en commit a750765

### Opcion C: Google Analytics 4 (ACTIVA)
- `components/Analytics.tsx` - ID `G-W1B5J61WEP`
- En `app/layout.tsx` dentro de `<Suspense>`
- Tracking externo, no consume Vercel

## 5. AGENTE DE CRECIMIENTO

### Estado: RESTAURADO (por revert de e7faa93)
- `app/api/admin/agente-crecimiento/route.ts` - EXISTE
- `scripts/crecimiento-diario.mjs` - EXISTE
- Panel HTML tiene tab "Agente IA" (aunque fue ocultado en un momento)

### Consumo:
- Usa Firebase Admin SDK (Firestore reads/writes)
- Usa Vercel Functions (API routes)
- Recomendacion: NO activar en produccion hasta tener trafico estable

## 6. DISTRIBUCION AUTOMATICA

### Estado: RESTAURADA
- `app/api/admin/distribuir/route.ts` - EXISTE con Telegram
- `app/api/cron/distribuir-pendientes/route.ts` - EXISTE
- Envia a Telegram usando TG_TOKEN y TG_CHAT_ID

## 7. PANEL HTML (public/panel.html)

### Estado: REPARADO (encoding UTF-8)
- Commit a3b624d arreglo las tildes corruptas
- Todas las tabs presentes: Dashboard, Nueva, Noticias, Categorias, Analytics, Config

## 8. BUILD STATUS

```
Next.js 15.3.9
Compilacion: OK (con warnings menores)
Tipos: OK
Generacion estatica: OK (89 paginas)
Errores: Ninguno fatal
```

Warning: Error de auth Firebase durante build local (normal - no hay credenciales locales)

## 9. FIREBASE/FIRESTORE

### Colecciones existentes (segun codigo):
- `noticias` - 284+ documentos
- `views` - Tracking de vistas (client-side)
- `distribuciones` - Registro de envios a redes
- `metricas` - Metricas del sitio

### Configuracion:
- Proyecto: `informate-instant-nicaragua`
- Admin SDK: `firebase-adminsdk-fbsvc@...`
- Client SDK: Configurado en `lib/firebase-client.ts`

## 10. VARIABLES DE ENTORNO VERCEL (configuradas)

Segun memoria anterior:
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
- FIREBASE_SERVICE_ACCOUNT_BASE64
- TG_TOKEN, TG_CHAT_ID (Telegram)
- CRON_SECRET
- NEXT_PUBLIC_GA_ID = G-W1B5J61WEP

---

## RESUMEN EJECUTIVO

| Funcionalidad | Estado | Consume Vercel |
|--------------|--------|----------------|
| GA4 Analytics | ACTIVO | NO |
| Tracking Firebase client-side | ACTIVO | NO |
| Tracking API servidor | DESHABILITADO | N/A (ahorra) |
| Agente crecimiento | RESTAURADO | SI (API + Firestore) |
| Distribucion Telegram | RESTAURADA | SI (API) |
| ISR | 24h | MINIMO |
| Build | OK | N/A |
| Panel HTML | REPARADO | N/A (static) |

## RECOMENDACIONES

1. **Tracking**: Usar Firebase client-side (ya activo) + GA4. NO reactivar API servidor.
2. **Agente**: Mantener deshabilitado en produccion hasta trafico estable.
3. **Distribucion**: Telegram OK, monitorizar invocaciones.
4. **ISR**: 24h esta bien para ahorrar recursos. Evaluar 6h-12h si se necesita frescura.
5. **Panel**: Verificar que Firebase client-side escribe correctamente a Firestore.

---
