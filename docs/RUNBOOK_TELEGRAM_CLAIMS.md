# Runbook — Claims de Telegram en `distribuciones_envios`

Contexto: la colección `distribuciones_envios` guarda un claim por
`telegram_{slug}` que decide qué proceso puede enviar una nota a Telegram.
Estados: `sending` → `sent` | `failed` | `unknown`.

## Estado actual (inventario 2026-11-17)

- **227 claims, todos en `sending`** — heredados del bug de `settleClaim`
  (escritura con `undefined` rechazada por Firestore → ningún claim se
  cerraba). Export completo: `.audit/telegram-claims-export.json`
  (regenerar con `node .audit/export-claims.cjs`).

## Qué pasa con ellos (sin intervención)

- **No se reenvían automáticamente.** Al primer contacto con su slug,
  `claimSend` los convierte a `unknown` dentro de la transacción y bloquea
  el envío. El cron `distribuciones-retry` nunca recupera `unknown`.
- Las notas son de octubre 2026; lo normal es que nunca vuelvan a
  distribuirse → los claims quedarán como `sending`/`unknown` inertes.

## Procedimiento de resolución (por slug, con trazabilidad)

1. **Verificar en el canal de Telegram** si el mensaje de esa nota existe
   (buscar por título; el caption incluye el enlace a la nota).
2. Resolver con credencial **ADMIN_API_KEY** (el secreto de cron NO sirve):

   ```
   POST /api/telegram
   x-admin-token: <ADMIN_API_KEY>
   { "resolve": { "slug": "<slug>", "action": "sent", "messageId": <id>, "note": "verificado en canal <fecha>" } }
   ```

   - `action: "sent"` → cierra el claim como enviado (incluye `messageId`
     si se conoce en Telegram).
   - `action: "retry"` → lo pasa a `failed`; recién ahí un reintento
     explícito (botón "Distribuir" del panel o `forceRetry`) puede enviar.
   - Solo son resolubles: `unknown`, `failed`, y `sending` con más de
     10 minutos (huérfano). Un `sending` fresco responde `claim_in_flight`.

3. Registrar la decisión en el `note` del resolve — queda en
   `resolutionNote`/`resolvedBy`/`resolvedAt` del claim.

## Lo que NO se hace

- No borrar claims ni docs de `distribuciones` (son evidencia forense).
- No reenviar históricas en lote.
- No usar `CRON_SECRET` para resolver (devuelve 403).

## Prevención de nuevos casos

- `settleClaim` sanea `undefined` antes de escribir (corregido).
- Timeout/red = `unknown`, nunca reintento ciego.
- Slug normalizado (trim+lowercase) en claim, resolve y retry cron.
