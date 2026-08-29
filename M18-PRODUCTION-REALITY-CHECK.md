# M18 — NIOS Production Reality Check

**Fecha de ejecución:** 2026-08-27T20:02:34Z — 2026-08-27T20:02:37Z  
**Entorno de prueba:** local (`g:\RESPALDO\informate-nicaragua-final`) con `npx tsx m18-probe.ts`  
**Repositorio:** `informate-nicaragua-final`  
**Veredicto final:** `PRODUCTION_BLOCKED`

---

## 1. CEO Verdict

- **Estado:** `PRODUCTION_BLOCKED`
- **Ícono:** 🔴
- **Razón:** `Firebase Admin SDK` no puede autenticarse con producción. Sin Firestore, NIOS no puede leer artículos, tráfico, snapshots, alertas ni distribuciones. GSC, GA4 y Meta tampoco están configurados.
- **Confianza del veredicto:** 100 % en el fallo de autenticación; 0 % en cualquier métrica de tráfico o momentum.
- **Resultado esperado si se repara:** Restaurar la cuenta de servicio de Firebase, volver a ejecutar el probe y obtener `FirebaseHealth.status === 'CONNECTED'`. Solo entonces los demás módulos pueden medirse con datos reales.

---

## 2. Tabla de Salud por Sistema

| Sistema | Estado | Último intento | Última conexión exitosa | Último dato | Edad | Latencia | Error real | Confianza | Acción concreta |
|---|---|---|---|---|---|---|---|---|---|
| **Firebase / Firestore** | `AUTH_FAILED` / `DOWN` | 2026-08-27T20:02:37.371Z | Nunca | Ninguno | n/a | n/a | `16 UNAUTHENTICATED: Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential.` | 0 % | Regenerar la cuenta de servicio en Firebase Console, descargar un nuevo JSON y actualizar `FIREBASE_SERVICE_ACCOUNT_BASE64` (Vercel + `.env.local`). Luego reejecutar este probe. |
| **Google Search Console (GSC)** | `CONFIG_REQUIRED` | 2026-08-27T20:02:37.373Z | Nunca | Ninguno | n/a | n/a | `NIOS_GSC_SITE_URL / NIOS_SITE_URL no está configurada.` | 0 % | Añadir `NIOS_GSC_SITE_URL` a `.env.local`/Vercel. |
| **Google Analytics 4 (GA4)** | `CONFIG_REQUIRED` | 2026-08-27T20:02:37.374Z | Nunca | Ninguno | n/a | n/a | `NIOS_GA4_PROPERTY_ID no está configurada.` | 0 % | Añadir `NIOS_GA4_PROPERTY_ID` a `.env.local`/Vercel. |
| **Meta / Facebook** | `NOT_CONFIGURED` | 2026-08-27T20:02:37.374Z | Nunca | Ninguno | n/a | n/a | `FB_PAGE_ACCESS_TOKEN / FB_PAGE_ID no configurados.` | 0 % | Añadir `FB_PAGE_ACCESS_TOKEN` y `FB_PAGE_ID` válidos de la página. |
| **Artículos: Top Lifetime** | `BLOCKED` | 2026-08-27T20:02:37.371Z | Nunca | Ninguno | n/a | n/a | Depende de Firestore (`noticias`) que retorna `UNAUTHENTICATED`. | 0 % | Desbloquear Firebase primero. |
| **Artículos: Top Moving** | `BLOCKED` | 2026-08-27T20:02:37.371Z | Nunca | Ninguno | n/a | n/a | Depende de `traffic_log` / `traffic_daily` / snapshots. | 0 % | Desbloquear Firebase y regenerar `nios_daily_snapshots`. |
| **Notificaciones (Forensics)** | `BLOCKED` | 2026-08-27T20:02:37.371Z | Nunca | Ninguno | n/a | n/a | No se pueden leer `distribuciones`, `distribuciones_pendientes`, `nios_alerts`. | 0 % | Desbloquear Firebase primero. |
| **CEO Verdict** | `EVIDENCIA_INSUFICIENTE` | 2026-08-27T20:02:37.371Z | Nunca | Ninguno | n/a | n/a | `getNiosExecutiveData()` no pudo materializarse porque falla Firestore. | 0 % | Desbloquear Firebase, luego ejecutar `buildCeoVerdict()` con datos reales. |

---

## 3. Evidencia Real Recolectada

### 3.1 Variables de entorno presentes (sin mostrar valores)

| Variable | Estado en `.env.local` |
|---|---|
| `FIREBASE_PROJECT_ID` | ✅ presente |
| `FIREBASE_CLIENT_EMAIL` | ✅ presente |
| `FIREBASE_PRIVATE_KEY` | ✅ presente (1704 caracteres) |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | ✅ presente (3228 caracteres) |
| `NIOS_GSC_SITE_URL` | ❌ ausente |
| `NIOS_GA4_PROPERTY_ID` | ❌ ausente |
| `FB_PAGE_ACCESS_TOKEN` | ❌ ausente |
| `FB_PAGE_ID` | ❌ ausente |

### 3.2 Firebase: el fallo raíz

El script `m18-probe.ts` ejecutó:

1. `dotenv.config({ path: '.env.local' })` — `.env.local` no fue modificado.
2. `checkFirebaseHealth()` desde `lib/nios/intelligence/firebase-health.ts`.
3. Lecturas directas a `noticias`, `traffic_log`, `traffic_daily`, `nios_alerts`, `distribuciones`, `distribuciones_pendientes`.
4. Segunda ejecución con el archivo JSON de servicio en disco (`G:\RESPALDO\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json`) codificado en base64.

Resultado en ambos casos:

```
[firebase-health] Read failed: 16 UNAUTHENTICATED: Request had invalid authentication credentials.
Expected OAuth 2 access token, login cookie or other valid authentication credential.
```

- El `clientEmail` detectado termina en `firebase-adminsdk-fbsvc@informate-instant-nicaragua.iam.gserviceaccount.com`.
- `projectId` = `informate-instant-nicaragua` (27 caracteres).
- `privateKeyLength` = 1704.
- `lib/firebase-admin.ts` pudo inicializar la aplicación (`initialized with base64 credentials` / `with environment credentials`), pero la primera operación real (`db.collection(...).get()`) falló.

### 3.3 GSC

`collectGSC('', 28)` retornó:

```json
{
  "status": "CONFIG_REQUIRED",
  "errorMessage": "NIOS_GSC_SITE_URL / NIOS_SITE_URL no está configurada.",
  "totalClicks": 0,
  "totalImpressions": 0
}
```

No hubo llamada a la API de Google. No se puede juzgar si las credenciales de Google están correctas porque falta el site URL.

### 3.4 GA4

`collectGA4('', 28)` retornó:

```json
{
  "status": "CONFIG_REQUIRED",
  "errorMessage": "NIOS_GA4_PROPERTY_ID no está configurada.",
  "totalUsers": 0,
  "totalSessions": 0,
  "totalPageviews": 0
}
```

No hubo llamada a la API de Google Analytics Data. Sin `NIOS_GA4_PROPERTY_ID` no es posible medir sesiones, usuarios ni pageviews.

### 3.5 Meta / Facebook

`fetchFacebookSnapshot()` retornó:

```json
{
  "source": "Meta",
  "status": "NOT_CONFIGURED",
  "errorMessage": "FB_PAGE_ACCESS_TOKEN / FB_PAGE_ID no configurados."
}
```

No hubo llamada a `graph.facebook.com`. Alcance, clics, sesiones Facebook y atribución social permanecen sin medir.

### 3.6 Colecciones clave

Todas las lecturas directas a Firestore fallaron con el mismo error `UNAUTHENTICATED`. Por tanto no se pudieron verificar:

- `noticias` — conteo real, top lifetime.
- `traffic_log` — eventos de visita recientes.
- `traffic_daily` — agregados diarios.
- `nios_daily_snapshots` — snapshot histórico del pipeline.
- `nios_alerts` — alertas activas.
- `distribuciones` y `distribuciones_pendientes` — auditoría de notificaciones.

El `getNiosExecutiveData()` retornó todas sus propiedades como `null`/`undefined` porque requiere Firestore.

---

## 4. Hechos vs Hipótesis

### Hechos

1. `lib/firebase-admin.ts` puede inicializar una app Admin con las credenciales de `.env.local`.
2. La primera operación real de Firestore (`get()`, `get()`, etc.) devuelve `UNAUTHENTICATED`.
3. El error se repite con:
   - `FIREBASE_SERVICE_ACCOUNT_BASE64` de `.env.local`.
   - `FIREBASE_PRIVATE_KEY` de `.env.local` (forzando base64 vacío).
   - El archivo de servicio `G:\RESPALDO\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json`.
4. GSC, GA4 y Meta no están configurados en `.env.local`.
5. Ningún dato de artículo, tráfico, alerta o notificación pudo leerse.

### Hipótesis

1. La cuenta de servicio `firebase-adminsdk-fbsvc@informate-instant-nicaragua.iam.gserviceaccount.com` fue deshabilitada, borrada o su clave fue revocada después del chequeo de mayo 2026.
2. El proyecto Firebase `informate-instant-nicaragua` pudo ser movido, eliminado o dejar de aceptar la clave.
3. GSC/GA4/Meta probablemente también fallarán hasta que se configuren, pero eso no se puede confirmar mientras Firestore esté bloqueado.

---

## 5. Bloqueadores Reales

1. **P0 — Firebase Admin UNAUTHENTICATED.** Impide que cualquier módulo NIOS acceda a datos.
2. **P1 — GSC sin `NIOS_GSC_SITE_URL`.**
3. **P1 — GA4 sin `NIOS_GA4_PROPERTY_ID`.**
4. **P1 — Meta sin `FB_PAGE_ACCESS_TOKEN` / `FB_PAGE_ID`.**

No se encontraron otros errores de lógica en el código. `lib/nios/executive-center.ts`, `lib/nios/intelligence/firebase-health.ts`, `gsc-collector.ts`, `ga4-collector.ts` y `social-conversion.ts` responden correctamente con los estados de error. El problema es credencial/configuración, no código.

---

## 6. Qué NO se pudo evaluar por culpa del bloqueo

- Top Lifetime articles (`vistas` reales por slug).
- Top Moving articles (`traffic_log` → `nios_daily_snapshots` → `article-momentum.ts`).
- Atribución de tráfico (`traffic-reconciler.ts` con `gsc` / `ga4` / `traffic_daily`).
- Forensics de notificaciones (`distribuciones`, `distribuciones_pendientes`).
- CEO Verdict (`buildCeoVerdict()`).
- Alert engine (`nios_alerts`, deduplicación, cooldown).

---

## 7. Plan de Reparación

1. **Firebase (hoy):**
   - Ir a Firebase Console → Configuración del proyecto → Cuentas de servicio.
   - Verificar que el proyecto `informate-instant-nicaragua` exista y la cuenta `firebase-adminsdk-fbsvc@...` esté activa.
   - Generar una nueva clave privada, descargar el JSON.
   - Actualizar `FIREBASE_SERVICE_ACCOUNT_BASE64` en Vercel (entorno de producción) y en `.env.local` local.
   - Puede dejarse `FIREBASE_PRIVATE_KEY` vacío si se usa base64, o viceversa, pero no usar la clave anterior.

2. **Re-ejecutar M18 (mañana):**
   - Volver a correr `m18-probe.ts` y confirmar:
     - `firebaseHealth.status === 'CONNECTED'`
     - `firebaseHealth.readCount > 0`
     - `dataAgeHours !== null`
   - Solo entonces pasar a GSC/GA4/Meta.

3. **GSC/GA4 (después de Firebase):**
   - `NIOS_GSC_SITE_URL`: `sc-domain:nicaraguainformate.com` o `https://nicaraguainformate.com/`
   - `NIOS_GA4_PROPERTY_ID`: ID numérico de la propiedad GA4.

4. **Meta (después de Firebase):**
   - `FB_PAGE_ID` y `FB_PAGE_ACCESS_TOKEN` con permisos `pages_read_engagement` y `read_insights`.

5. **Regenerar snapshots y CEO Verdict (último):**
   - Forzar una nueva ejecución del pipeline NIOS para llenar `nios_daily_snapshots`.
   - Verificar `getNiosExecutiveData()` y `buildCeoVerdict()` con datos reales.

---

## 8. Notas de Seguridad y Metodología

- `.env.local` no fue modificado.
- No se imprimió ningún secreto en el reporte ni en `m18-probe-output.json`.
- El probe `m18-probe.ts` es un archivo temporal para Misión 18 y no forma parte de la arquitectura.
- Ninguna acción generó commits automáticos.

---

## 9. Criterio de Cierre

M18 se cierra cuando **todos** los puntos de la Sección 7 den verde y el `CEO Verdict` final tenga `status !== 'EVIDENCIA_INSUFICIENTE'`. Hoy, **ninguno** de los sistemas de datos aportó evidencia real, por lo que el estado oficial es `PRODUCTION_BLOCKED`.
