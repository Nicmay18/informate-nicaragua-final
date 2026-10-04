# DISTRIBUCIÓN FINAL — mapa PUBLICAR → salida por canal

## Cadena real (verificada en código)

```
guardar-directo / publication-pipeline
  └→ distribuir (o automático en guardado si aplica)
      ├─ telegram  → lib/distribution/telegram.ts ::sendTelegramArticle
      ├─ facebook  → lib/distribution/channels.ts ::enviarFacebook
      ├─ indexnow  → ::enviarIndexNow
      ├─ push      → ::enviarPush (OneSignal — skipped sin creds)
      ├─ twitter   → ::enviarTwitter (skipped sin TWITTER_ACCESS_TOKEN)
      └─ whatsapp  → /api/admin/copy-social → generateDistribution().whatsapp (manual)
```

## Texto por canal — estado actual

| Canal | Quién genera el texto | Formato | Estado |
|---|---|---|---|
| Telegram | `buildTelegramCaption` (telegram.ts) | `<b>emoji título</b>` + contexto 180c + link `Leer noticia completa` + `#NicaraguaInformate`, HTML escapado, sendPhoto o sendMessage | ✅ BIEN |
| Facebook | `enviarFacebook` (channels.ts) | `emoji título` + contexto oraciones ≤200c + `👉 url` + `#NicaraguaInformate` | ✅ ACEPTABLE |
| WhatsApp | `generateDistribution().whatsapp` | `emoji *título*` + `_contexto 120c_` + `Leé la nota 👇 url` — copiar/pegar | ✅ MEJORADO (era "👉 url" pelado) |
| Newsletter | `generateDistribution().newsletter` | HTML h2 + p + CTA | ✅ MEJORADO |
| Push | `generateDistribution().push` + OneSignal | emoji + título ≤90c | ✅ MEJORADO |
| Twitter/X | `enviarTwitter` | emoji + título + contexto + url + hashtags | ⚠️ INACTIVO (sin creds, skipped con error claro) |

## Garantías existentes (no tocar)

- **Idempotencia Telegram**: claim atómico `distribuciones_envios/telegram_{slug}` → no duplica ni en retry
- **Dedupe 24h**: `yaDistribuido(db, slug, canal, 24)` en distribuir
- **Escape Telegram**: `escTelegram` solo escapa `& < > "` — el fix de parse_mode está
- **Resumen determinista**: `resolveTelegramSummary` → resumen → metaDescription → 1er párrafo; nunca inventa
- **Retry**: 1 retry en errores retryables, timeout 8s AbortSignal
- **Cron retry**: `distribuciones-retry` (15 5 * * *) reintenta claims `failed`

## Resumen diario 6 a.m.

`/api/cron/resumen-diario` (0 12 UTC = 6:00 Nicaragua):
- top-5 por vistas de últimas 30h → mensaje estilo TN8 → Telegram
- idempotente por `resumenes_diarios/{fecha}` (salvo `?force=1`)
- **Bug real corregido**: `limit(120)` sin orderBy → con 400+ artículos devolvía los más viejos → `skipped` permanente. Ahora `orderBy('fecha','desc')`.

## Pendientes honestos

- WhatsApp/Twitter auto-send: solo copy-paste o skipped — si se quieren automáticos hace falta API de WA Business y credenciales X
- No hay texto distinto Telegram vs Facebook en el sender automático (ambos usan emoji+contexto+link) — aceptable, pero el copy-social ya produce voz distinta por canal
