# Nicaragua Informate

Portal de noticias de Nicaragua. Desplegado en Vercel + Firebase.

## 🚀 Deploy

- Desarrollo: `npm run dev`
- Producción: `npm run build` → `vercel --prod`

## 📋 Variables de Entorno

Copiá `.env.example` a `.env.local` y completá los valores reales.

## 🏗️ Estructura

- `app/` → Rutas de Next.js App Router
- `lib/db/` → Queries a Firestore
- `components/` → Componentes React
- `scripts/` → Utilidades, migraciones, backups, auditorías
- `public/` → Assets estáticos e imágenes

## 🐛 Fixes aplicados (Jun 2026)

Ver `INFORME_FORENSE.md` para detalle completo de la auditoría forense.

Resumen:
- Fix race condition en fetchAllNoticias
- Cooldown de revalidación aumentado (60s → 1h)
- Fallback getRelatedNews usa cache existente
- ISR homepage aumentado (300s → 3600s)
- 50+ console.logs silenciados en producción
- 200+ archivos huérfanos movidos a `scripts/`

## 🧊 Editor IA V4.1 LTS — Motor congelado

El motor `editor-jefe-v4` está marcado como **Long Term Support**: congelado, estable y en mantenimiento solamente.

> **Regla de oro:** No se modifica el motor por una sola noticia que falle. Solo se modifica cuando un mismo patrón aparece en al menos 10 artículos reales y existe evidencia de que la corrección mejora el sistema sin perjudicar otras categorías.

> **Principio LTS:** No romperemos una versión estable para intentar hacerla perfecta.

Antes de declarar **Editor IA V4.1 LTS estable**, ejecutar la auditoría de 100 noticias reales documentada en [`docs/auditoria-100-noticias.md`](docs/auditoria-100-noticias.md).

## 📊 Monitoreo

- Vercel Dashboard: https://vercel.com/dashboard
- Firebase Console: https://console.firebase.google.com
