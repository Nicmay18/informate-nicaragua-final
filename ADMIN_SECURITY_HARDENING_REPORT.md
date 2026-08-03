# ADMIN_SECURITY_HARDENING_REPORT.md

## Resumen

Se implementó una capa de autenticación unificada para todas las rutas `/admin/*` sin modificar lógica editorial, MENI, EOS, NIOS ni componentes internos existentes. La protección se concentra en un único punto: `app/admin/layout.tsx`, reutilizando el sistema de autenticación previo de `ADMIN_API_KEY` y el endpoint de Firebase `/api/admin/session`.

## Cambios implementados

### 1. `app/admin/layout.tsx` — Punto único de protección

- Layout asíncrono del servidor (`async function`).
- Lee la cookie `admin_session` mediante `cookies()` de `next/headers`.
- Valida la cookie contra `ADMIN_API_KEY`.
- Si la sesión no es válida, redirige de forma segura a `/login`.
- Exporta `dynamic = 'force-dynamic'` para evitar renderizado estático.
- Define metadata `robots: { index: false, follow: false }` en todas las rutas `/admin/*`.

### 2. `lib/admin-auth.ts` — Helpers de sesión

- `ADMIN_SESSION_COOKIE = 'admin_session'`.
- `getAdminSessionToken()`: obtiene el token de la cookie.
- `isAuthenticatedAdmin()`: valida que el token coincida con `ADMIN_API_KEY` y que la clave esté configurada.

### 3. `/api/admin/session` — Cookie segura post-login

- Mantiene la verificación de Firebase ID token existente.
- Tras validar, establece una cookie `admin_session` con las siguientes flags:
  - `HttpOnly`
  - `SameSite=Strict`
  - `Path=/`
  - `Max-Age=86400` (24 h)
  - `Secure` en producción
- Continúa devolviendo `token` y `email` para compatibilidad con consumidores existentes.

### 4. `/login` — Página de inicio de sesión

- Client component con manejo de estados: `loading`, `unauthenticated`, `error`.
- Inicializa Firebase client-side con las variables públicas existentes.
- Usa `onAuthStateChanged` para detectar sesión activa.
- Al autenticar, envía `idToken` a `/api/admin/session`; si es exitoso, redirige a `/admin/nios`.
- En caso de error, muestra el mensaje al usuario.
- Metadata `noindex, nofollow`.

## Flujo de autenticación

1. Usuario navega a `/admin/nios`.
2. `app/admin/layout.tsx` (servidor) verifica `admin_session`.
3. Si no existe o no coincide con `ADMIN_API_KEY`, redirige 307 a `/login`.
4. En `/login`, el usuario inicia sesión con Firebase (Google).
5. El cliente envía `idToken` al servidor; el servidor verifica con Firebase Admin y emite la cookie `admin_session`.
6. Navegación subsiguiente a `/admin/*` incluye la cookie y el layout permite el acceso.

## Medidas de seguridad

- **Protección servidor**: la redirección y validación ocurren en el servidor antes de renderizar contenido administrativo.
- **Cookie segura**: `HttpOnly` impide lectura por JavaScript malicioso; `SameSite=Strict` mitiga CSRF; `Secure` en producción.
- **No indexación**: todas las rutas administrativas incluyen `robots: { index: false, follow: false }`.
- **Reutilización**: se usa el endpoint `/api/admin/session` y el secret `ADMIN_API_KEY` existentes; no se añadieron dependencias nuevas.
- **Encapsulación**: la lógica de protección reside en `app/admin/layout.tsx` y no se dispersa en páginas individuales.

## Validación

- `npx tsc --noEmit`: ✅ sin errores.
- `npm run build`: ✅ sin errores.
- `npm run test:merge`: ✅ sin errores.

## Archivos afectados

- `app/admin/layout.tsx` (nuevo)
- `lib/admin-auth.ts` (nuevo)
- `app/login/page.tsx` (nuevo)
- `app/login/layout.tsx` (nuevo)
- `app/api/admin/session/route.ts` (modificado para Set-Cookie)

No se modificó ningún archivo de lógica editorial, MENI, EOS, NIOS, motor de puntuación o componentes internos.
