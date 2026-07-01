# Sistema de Distribución Automática — Nicaragua Informate

## Diagrama de Flujo (onPublish)

```
┌─────────────────────────────────────────────────────────────────┐
│  REDACTOR PUBLICA NOTICIA (Panel Admin / API)                    │
│  Firestore: noticias/{id} → estado: publicado                  │
└────────────────────┬────────────────────────────────────────────┘
                     │ trigger / webhook
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: VALIDAR                                               │
│  • noticia existe y tiene slug, título, resumen                │
│  • no está marcada como ya distribuida                         │
│  • imagen destacada válida (opcional)                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: GENERAR MENSAJES POR CANAL (en paralelo)              │
│                                                                 │
│  IndexNow:   { url, host, key }                                │
│  Telegram:   { caption (HTML), photo?, chat_id }               │
│  Push:       { title (50c), body (90c), url, image }          │
│  Twitter/X:  { text (280c), hashtags }                         │
│  Facebook:   { message, link, image }                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: ENVIAR A 5 CANALES (Promise.allSettled)               │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  IndexNow    │  │  Telegram    │  │  OneSignal   │          │
│  │  Bing+Yandex │  │  sendPhoto   │  │  Push Notif  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │  Twitter/X   │  │  Facebook    │                              │
│  │  API v2      │  │  Graph API   │                              │
│  └──────────────┘  └──────────────┘                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: LOG RESULTADOS EN Firestore                           │
│  distribuciones/{id}:                                            │
│    { slug, titulo, canales[], resultados{}, fecha, retries }   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: FALLBACK (si algún canal falló)                        │
│  • Guardar en cola: distribuciones_pendientes/{slug}           │
│  • Cron cada 5 min: reintentar 1 vez por canal fallido          │
│  • Si sigue fallando → alerta admin + log                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: MARCAR NOTICIA                                        │
│  • noticias/{id}.distribuida = true                            │
│  • noticias/{id}.fechaDistribucion = ISO                       │
└─────────────────────────────────────────────────────────────────┘
```

## Pseudocódigo — Función onPublish(noticia)

```typescript
async function onPublish(noticia: Noticia) {
  // ── 1. VALIDAR ──
  if (!noticia.slug || !noticia.titulo) throw 'Datos incompletos';
  if (noticia.distribuida) return { skipped: true };

  const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;

  // ── 2. GENERAR MENSAJES ──
  const msgs = {
    indexnow: { host: 'nicaraguainformate.com', key: INDEXNOW_KEY, urlList: [url] },
    telegram: buildTelegramMessage(noticia, url),
    push: buildPushMessage(noticia, url),
    twitter: buildTwitterMessage(noticia, url),
    facebook: buildFacebookMessage(noticia, url),
  };

  // ── 3. ENVIAR EN PARALELO (allSettled = nunca bloquea) ──
  const [indexnow, telegram, push, twitter, facebook] = await Promise.allSettled([
    sendIndexNow(msgs.indexnow),
    sendTelegram(msgs.telegram),
    sendPush(msgs.push),
    sendTwitter(msgs.twitter),
    sendFacebook(msgs.facebook),
  ]);

  // ── 4. RESULTADOS ──
  const resultados = {
    indexnow: unwrap(indexnow),
    telegram: unwrap(telegram),
    push: unwrap(push),
    twitter: unwrap(twitter),
    facebook: unwrap(facebook),
  };

  // ── 5. LOG EN FIRESTORE ──
  await db.collection('distribuciones').add({
    slug: noticia.slug,
    titulo: noticia.titulo,
    fecha: new Date().toISOString(),
    resultados,
  });

  // ── 6. COLA DE RETRY ──
  const fallidos = Object.entries(resultados).filter(([, r]) => !r.ok);
  if (fallidos.length > 0) {
    await db.collection('distribuciones_pendientes').doc(noticia.slug).set({
      slug: noticia.slug,
      canalesFallidos: fallidos.map(([k]) => k),
      reintentos: 0,
      proximoIntento: Date.now() + 5 * 60 * 1000, // +5 min
    });
  }

  // ── 7. MARCAR COMO DISTRIBUIDA ──
  await db.doc(`noticias/${noticia.id}`).update({
    distribuida: true,
    fechaDistribucion: new Date().toISOString(),
  });

  return { success: true, resultados };
}
```

## Variables de Entorno Necesarias

```bash
# ── INDEXNOW ──
INDEXNOW_KEY=ni-indexnow-key-2026-x7k9m3p2q8r5t1u4

# ── TELEGRAM ──
TG_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz
TG_CHAT_ID=-1001234567890          # Canal/grupo ID (con -100 si es canal)

# ── ONESIGNAL PUSH ──
ONESIGNAL_APP_ID=608354d3-fd2a-4c97-b055-5c14b57bbe9b
ONESIGNAL_REST_API_KEY=osr_xxxxx   # REST API Key (NO App Key)

# ── TWITTER/X ──
# Twitter API v2 requiere OAuth 2.0 User Context (no solo Bearer)
# Opción A: OAuth 2.0 (para tweets desde cuenta personal)
TWITTER_CLIENT_ID=xxxxx
TWITTER_CLIENT_SECRET=xxxxx
TWITTER_ACCESS_TOKEN=xxxxx
TWITTER_REFRESH_TOKEN=xxxxx
# Opción B: Bearer (solo lectura, NO permite postear)
TWITTER_BEARER_TOKEN=xxxxx       # Insuficiente para publicar

# ── FACEBOOK ──
FB_PAGE_TOKEN=EAAGxxxxx           # Token de página (no de usuario)
FB_PAGE_ID=1234567890              # ID numérico de la página
```

## Plan de Fallback por Canal

| Canal | Razón común de fallo | Fallback |
|---|---|---|
| **IndexNow** | Key inválida, Bing rate limit | Reintentar en 5 min. Si sigue fallando, el sitemap.xml ya cubre indexación pasiva. |
| **Telegram** | Token expirado, bot no admin, chat_id cambiado | Fallback a sendMessage sin foto si sendPhoto falla. Reintentar 1 vez. |
| **Push** | OneSignal key inválida, sin suscriptores | Skip silencioso. Los suscriptores recibirán la noticia vía newsletter diaria. |
| **Twitter/X** | OAuth token expirado, rate limit, cuenta suspendida | Skip. Facebook/Telegram ya cubren alcance social. |
| **Facebook** | Token de página expirado, permisos insuficientes | Reintentar 1 vez. Si falla, loggear para renovar token. |

## Estado Actual de los Canales

| Canal | Estado | Acción Requerida |
|---|---|---|
| IndexNow | ✅ Funciona | Mantener |
| Telegram | ⚠️ Token/Chat ID desconocidos | Verificar TG_TOKEN y TG_CHAT_ID en .env.local |
| Push | ⚠️ ONESIGNAL_REST_KEY falta | Configurar en OneSignal dashboard → Keys & IDs |
| Twitter/X | ❌ Bearer token insuficiente | Migrar a OAuth 2.0 User Context o usar x.com share manual |
| Facebook | ⚠️ Token de página desconocido | Generar en Meta for Developers → Token de página permanente |

## Cómo obtener cada credencial

### Telegram
1. Habla con [@BotFather](https://t.me/BotFather) → `/newbot` → copia token
2. Crea canal `@NicaraguaInformateBot` o usa grupo existente
3. Agrega el bot como administrador del canal
4. Envía un mensaje en el canal, luego visita:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Busca `"chat":{"id":-100...` → ese es el `TG_CHAT_ID`

### OneSignal
1. [OneSignal Dashboard](https://dashboard.onesignal.com) → Login
2. App → Settings → Keys & IDs
3. Copiar `REST API Key` (no confundir con App ID)
4. Asegurar que haya suscriptores: Safari Web Push requiere certificado Apple

### Twitter/X API v2
**Problema:** Bearer token solo permite lectura. Para postear se necesita OAuth 2.0.

**Opción rápida (recomendada):** No automatizar Twitter. En su lugar, usar el componente ShareBar en el artículo para que los usuarios compartan manualmente.

**Opción completa:**
1. [Twitter Developer Portal](https://developer.twitter.com) → Projects & Apps
2. App → User authentication settings → OAuth 2.0
3. Generar Access Token + Refresh Token
4. Usar `twitter-api-v2` npm package con refresh automático

### Facebook
1. [Meta for Developers](https://developers.facebook.com/tools/explorer)
2. Seleccionar App → Get Token → Get Page Access Token
3. Elegir la página de Nicaragua Informate
4. Generar token de larga duración (60 días, renovable)
5. `FB_PAGE_TOKEN` = token copiado
6. `FB_PAGE_ID` = ID numérico de la página (en About)

## Próximos Pasos Inmediatos

1. **Hoy:** Verificar TG_TOKEN y TG_CHAT_ID en el panel de admin
2. **Mañana en la oficina:** Configurar ONESIGNAL_REST_API_KEY y probar push
3. **Esta semana:** Decidir si vale la pena automatizar Twitter (costo API vs alcance)
4. **Opcional:** Configurar Facebook si hay página activa
