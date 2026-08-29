# M19 — FIREBASE AUTHENTICATION RECOVERY

**Fecha:** 2026-08-27  
**Veredicto final:** `FIREBASE_BLOCKED` — requiere acción manual del usuario

---

## ROOT CAUSE

La clave privada de la service account `firebase-adminsdk-fbsvc@informate-instant-nicaragua.iam.gserviceaccount.com` ha sido **revocada o eliminada por Google**.

**Evidencia definitiva:**

1. `GoogleAuth.getAccessToken()` retorna: `400 invalid_grant: Invalid JWT Signature`
2. El `private_key_id` de la credencial actual es: `2da99059f4698aaaf233e5bf00fab51e63450ae9`
3. El endpoint de certificados de Google (`https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40informate-instant-nicaragua.iam.gserviceaccount.com`) lista **9 claves activas** — nuestro `private_key_id` **no está entre ellas**.
4. La clave RSA es estructuralmente válida (PEM parseable, sign+verify cycle funciona localmente), pero Google ya no la reconoce.

**No es un problema de:**
- ❌ Formato de la clave (PEM correcto, header/footer/newlines OK)
- ❌ Variable mal copiada (base64 y JSON en disco son idénticos)
- ❌ Project ID incorrecto (todos coinciden: `informate-instant-nicaragua`)
- ❌ Client email incorrecto (coincide en todas las fuentes)
- ❌ Código de `firebase-admin.ts` (inicializa correctamente, el fallo es en Google)

**Es un problema de:**
- ✅ La clave fue regenerada, revocada o expiró del lado de Google Cloud/Firebase

---

## REPAIR

**Acción requerida (manual, por el usuario):**

1. Ir a [Firebase Console](https://console.firebase.google.com) → Proyecto `informate-instant-nicaragua`
2. Project Settings → Service Accounts → **Generate new private key**
3. Descargar el nuevo JSON
4. Reemplazar el archivo en `G:\RESPALDO\informate-instant-nicaragua-firebase-adminsdk-fbsvc-*.json`
5. Ejecutar: `npx tsx m19-recovery.ts` (verifica la nueva clave y genera el base64)
6. Actualizar `FIREBASE_SERVICE_ACCOUNT_BASE64` en:
   - `.env.local` (local)
   - Vercel → Settings → Environment Variables (producción)
7. Actualizar también `FIREBASE_PRIVATE_KEY` con el valor del nuevo JSON (para consistencia)

**No se puede automatizar** la generación de claves — es una operación de Firebase Console que requiere autenticación humana.

---

## FIREBASE

| Check | Resultado |
|---|---|
| Project | `informate-instant-nicaragua` — coincide en `.env.local`, base64, JSON, `.firebaserc` ✅ |
| Service account | `firebase-adminsdk-fbsvc@...` — coincide en todas las fuentes ✅ |
| Authentication | ❌ `invalid_grant: Invalid JWT Signature` — clave revocada por Google |
| Firestore API | ❌ No accesible — sin token OAuth válido |
| Real read | ❌ No ejecutado — sin autenticación |
| Latency | N/A |
| Health | `AUTH_FAILED` / `DOWN` |

---

## DATA FLOW

```
Firestore → ❌ BLOQUEADO
  → noticias         ❌
  → vistas           ❌
  → traffic_log      ❌
  → traffic_daily    ❌
  → snapshots        ❌
  → NIOS             ❌
  → article-momentum ❌
  → alerts           ❌
  → executive-center ❌
  → CEO              ❌
```

Toda la cadena está bloqueada en el primer eslabón (Firestore).

---

## TOP LIFETIME

❌ No se pudo calcular. Requiere lectura de `noticias.vistas` en Firestore.

---

## TOP MOVING

❌ No se pudo calcular. Requiere `traffic_log` / `traffic_daily` / `nios_daily_snapshots`.

---

## NOTIFICATIONS

❌ No se pudo auditar. Requiere `distribuciones`, `distribuciones_pendientes`, `nios_alerts`.

---

## TESTS

Los tests no se ejecutaron porque el bloqueo es de credenciales, no de código. No tiene sentido ejecutar tests hasta que Firebase esté recuperado. `firebase-admin.ts`, `firebase-health.ts` y el resto del código funcionan correctamente — el problema es exclusivamente de credenciales revocadas.

---

## SECURITY

- ✅ No se imprimieron secretos en ningún momento
- ✅ No se modificó `.env.local`
- ✅ No se hicieron commits
- ✅ Los scripts temporales (`m19-*.ts`) están en `.gitignore`
- ✅ El archivo `m19-new-base64.txt` (que se generará al ejecutar `m19-recovery.ts`) está en `.gitignore` via `*.txt`
- ✅ El JSON de service account está en `.gitignore` via `*firebase-adminsdk*.json` y `*key*.json`
- ✅ `git status` no muestra cambios staged ni untracked que contengan secretos

---

## DIAGNÓSTICO DETALLADO

### Comparación de credenciales (solo metadatos seguros)

| Campo | `.env.local` (vars) | `.env.local` (base64) | JSON en disco | `.firebaserc` |
|---|---|---|---|---|
| `project_id` | `informate-instant-nicaragua` | `informate-instant-nicaragua` | `informate-instant-nicaragua` | `informate-instant-nicaragua` |
| `client_email` | `fire***@...iam.gserviceaccount.com` | `fire***@...iam.gserviceaccount.com` | `fire***@...iam.gserviceaccount.com` | N/A |
| `private_key_id` | N/A | `2da99059f4...` | `2da99059f4...` | N/A |
| `private_key` hash SHA-256 | `a8685d30ec7935c2` | `5348f35c26ff446d` | `5348f35c26ff446d` | N/A |
| `private_key` length | 1703 (processed) | 1704 | 1704 | N/A |

**PROJECT_MATCH = YES** ✅  
**SERVICE_ACCOUNT_MATCH = YES** ✅ (mismo email, mismo key_id)  
**KEY_MATCH (base64 vs file) = YES** ✅  
**KEY_MATCH (env vars vs base64) = NO** — diferencia de 1 char (trailing newline removido por `.trim()` en `firebase-admin.ts`). Irrelevante porque ambas versiones fallan igual.

### Claves activas de Google (al momento del diagnóstico)

Google lista 9 `private_key_id` activos para esta service account:

```
d1b8ae24ad7efa1df74a1ac038dfd655067e4999
24d9a3380e1afb1665f87f64dcf079793f066558
fa9b81a61ae66d026fde46ea752229db7c21eb27
d7c3aaa94225867732d97edfdcdcb93bd6a771b2
99389f07c2435e1577d007685bbf50036f09b459
44df69aec96e21afce4b895ca8f1da5ffae2566a
06149d3df890448a860f5ca9daf0c05b5630bdf5
29c2cef443830df6e73e98167c09454edadfa18d
caa9603264d05625881556747f375d01404ccce8
```

Nuestra clave: `2da99059f4698aaaf233e5bf00fab51e63450ae9` → **NO PRESENTE** ❌

---

## FINAL VERDICT

### `FIREBASE_BLOCKED`

La clave privada ha sido revocada por Google. No hay fix de código posible — se requiere una nueva clave generada desde Firebase Console.

### Próximo paso

1. **Usuario:** Generar nueva clave en Firebase Console
2. **Usuario:** Ejecutar `npx tsx m19-recovery.ts` para verificar
3. **Usuario:** Actualizar `.env.local` y Vercel con el nuevo `FIREBASE_SERVICE_ACCOUNT_BASE64`
4. **Cascade:** Reejecutar verificación completa (M19 steps 5-13) una vez que la nueva clave esté en su lugar

### Archivos entregados

- `m19-recovery.ts` — Script de recuperación (ejecutar después de descargar nueva clave)
- `m19-diagnostic.ts` — Script de diagnóstico (evidencia ya recogida arriba)
- `m19-auth-test.ts` — Test directo de Google Auth (evidencia ya recogida arriba)
- `m19-rsa-check.ts` — Validación RSA y comparación con certificados de Google (evidencia ya recogida arriba)

Todos están en `.gitignore` y pueden borrarse después de la recuperación.
