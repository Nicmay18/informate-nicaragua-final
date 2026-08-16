# CERTIFICACIÓN FORENSE DE PRODUCCIÓN
## NICARAGUA INFORMATE — `informate-nicaragua-final` v2.0.0
## Comité Internacional de Certificación
## Fecha: 2026-08-03

---

## RESULTADO FINAL

# CERTIFICADO PARA PRODUCCIÓN

---

## BLOQUEADOR P1-1: SSRF en `/api/transform` — RESUELTO

### Hallazgo original

- **Archivo:** `app/api/transform/route.ts`
- **Líneas afectadas:** 22-28 (código original)
- **Código vulnerable:**
```typescript
if (imageUrl.startsWith('http')) {
  const response = await fetch(imageUrl, { redirect: 'follow' });
  if (!response.ok) {
    return new NextResponse(`Error al descargar imagen: ${response.status}`, { status: 502 });
  }
  inputBuffer = Buffer.from(await response.arrayBuffer());
}
```
- **Problema:** El servidor ejecutaba `fetch(imageUrl)` a cualquier URL que comenzara con `http` sin validar el host. Aceptaba `http://`, `localhost`, `127.0.0.1`, `169.254.169.254` (metadata cloud), rangos privados RFC1918, y cualquier host externo. Seguía redirects automáticamente (`redirect: 'follow'`), permitiendo redirect-based SSRF.

### Cambio aplicado

- **Archivo corregido:** `app/api/transform/route.ts`
- **Líneas modificadas:** 1-161 (función `validateImageUrl`, función `isPrivateOrBlockedHost`, lógica de fetch con `redirect: 'manual'`, timeout, validación MIME, límite de tamaño)
- **Cambios específicos:**
  1. **Whitelist de hosts permitidos** (líneas 6-26): Solo se aceptan 19 hosts explícitamente autorizados (cdn.jsdelivr.net, firebasestorage.googleapis.com, images.unsplash.com, etc.)
  2. **Función `isPrivateOrBlockedHost`** (líneas 42-66): Bloquea localhost, 127.x, 10.x, 192.168.x, 172.16-31.x, 169.254.x, 0.x, ::1, fe80::/10 (link-local), fd00::/8 (unique-local), metadata endpoints de cloud providers
  3. **Función `validateImageUrl`** (líneas 68-91): Valida protocolo HTTPS obligatorio, hostname contra blacklist de privados, hostname contra whitelist de permitidos
  4. **Fetch con `redirect: 'manual'`** (línea 121): Bloquea cualquier redirect 3xx (líneas 129-131)
  5. **Timeout de 10 segundos** (líneas 115-126): AbortController con `FETCH_TIMEOUT_MS = 10000`
  6. **Validación de Content-Type** (líneas 137-141): Solo se aceptan tipos MIME de imagen
  7. **Límite de tamaño de respuesta** (líneas 143-151): Máximo 20MB (`MAX_RESPONSE_BYTES`)
  8. **Rechazo explícito de URLs no HTTP/HTTPS** (línea 160): `file://`, `data:`, `javascript:` retornan 400

### Evidencia antes/después

| Aspecto | Antes | Después |
|---------|-------|---------|
| Protocolo | Acepta `http://` y `https://` | Solo `https://` |
| Host validation | Ninguna | Whitelist de 19 hosts + blacklist de privados |
| Redirects | `redirect: 'follow'` | `redirect: 'manual'` + bloqueo de 3xx |
| Timeout | Sin límite | 10 segundos |
| Content-Type | Sin validación | Solo tipos MIME de imagen |
| Tamaño máximo | Sin límite | 20 MB |
| `file://`, `data:`, `javascript:` | Pasaba al `else` (lectura local) | Retorna 400 |

### Prueba de explotación bloqueada

Tests ejecutados en `tests/ssrf-protection.test.ts` (15 tests, todos pasan):

| Vector de ataque | Status | Código de respuesta |
|-----------------|--------|-------------------|
| `http://cdn.jsdelivr.net/npm/test.jpg` | Bloqueado | 403 (solo HTTPS) |
| `https://localhost/secret` | Bloqueado | 403 (host privado) |
| `https://127.0.0.1/secret` | Bloqueado | 403 (host privado) |
| `https://169.254.169.254/latest/meta-data` | Bloqueado | 403 (metadata endpoint) |
| `https://10.0.0.1/internal` | Bloqueado | 403 (RFC1918) |
| `https://192.168.1.1/admin` | Bloqueado | 403 (RFC1918) |
| `https://172.16.0.1/internal` | Bloqueado | 403 (RFC1918) |
| `https://0.0.0.0/` | Bloqueado | 403 (host reservado) |
| `https://evil.com/image.jpg` | Bloqueado | 403 (host no permitido) |
| `file:///etc/passwd` | Bloqueado | 400 (protocolo no válido) |
| `data:image/png;base64,abc` | Bloqueado | 400 (protocolo no válido) |
| `javascript:alert(1)` | Bloqueado | 400 (protocolo no válido) |
| `/images/test.webp` (local) | Permitido | 200 |
| URL faltante | Bloqueado | 400 |
| Ratio inválido | Bloqueado | 400 |

---

## BLOQUEADOR P1-2: Abuso de costo Firebase en `/api/auditor` y `/api/auditor-wordcount` — RESUELTO

### Hallazgo original

- **Archivo 1:** `app/api/auditor/route.ts`
- **Líneas afectadas:** 55-57 (código original)
- **Código vulnerable:**
```typescript
export async function GET() {
  const db = getAdminDb();
  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();
```
- **Archivo 2:** `app/api/auditor-wordcount/route.ts`
- **Líneas afectadas:** 5-6, 34-37 (código original)
- **Código vulnerable:**
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();
```
- **Problema:** Ambos endpoints eran públicos (sin autenticación), ejecutaban 200 lecturas de Firestore por petición, sin cache, sin rate limiting. `/api/auditor-wordcount` tenía `force-dynamic` y `revalidate=0` garantizando que cada petición ejecutaba una query nueva. Un atacante podía ejecutar `while true; do curl /api/auditor; done` generando 200 lecturas/petición.

### Cambio aplicado

- **Archivo 1 corregido:** `app/api/auditor/route.ts`
  - **Línea 1:** Import consolidado `import { NextResponse, NextRequest } from 'next/server'`
  - **Línea 3:** Nuevo import `import { isAdminRequest, unauthorized } from '@/lib/auth'`
  - **Líneas 56-59:** Auth check agregado:
```typescript
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }
```

- **Archivo 2 corregido:** `app/api/auditor-wordcount/route.ts`
  - **Línea 1:** Import consolidado `import { NextResponse, NextRequest } from 'next/server'`
  - **Línea 4:** Nuevo import `import { isAdminRequest, unauthorized } from '@/lib/auth'`
  - **Líneas 5-6 eliminadas:** `export const dynamic = 'force-dynamic'` y `export const revalidate = 0` removidos
  - **Líneas 32-35:** Auth check agregado:
```typescript
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }
```

### Evidencia antes/después

| Aspecto | Antes | Después |
|---------|-------|---------|
| `/api/auditor` auth | Sin autenticación | Requiere `x-admin-token` válido |
| `/api/auditor-wordcount` auth | Sin autenticación | Requiere `x-admin-token` válido |
| `/api/auditor-wordcount` cache | `force-dynamic` + `revalidate=0` (sin cache) | Cache habilitado (sin directivas de no-cache) |
| Petición sin token | 200 + 200 lecturas Firestore | 401 (0 lecturas Firestore) |
| Petición con token incorrecto | 200 + 200 lecturas Firestore | 401 (0 lecturas Firestore) |
| Petición con token correcto | 200 + 200 lecturas Firestore | 200 + 200 lecturas Firestore |

### Prueba de explotación bloqueada

Tests ejecutados en `tests/api-authorization.test.ts` (6 tests, todos pasan):

| Escenario | Endpoint | Status | Código |
|-----------|----------|--------|--------|
| Sin token | `/api/auditor` | Bloqueado | 401 |
| Token incorrecto | `/api/auditor` | Bloqueado | 401 |
| Token correcto | `/api/auditor` | Permitido | 200 |
| Sin token | `/api/auditor-wordcount` | Bloqueado | 401 |
| Token incorrecto | `/api/auditor-wordcount` | Bloqueado | 401 |
| Token correcto | `/api/auditor-wordcount` | Permitido | 200 |

### Mecanismo de autenticación

La función `isAdminRequest` (`lib/auth.ts:6-13`) verifica el token contra `process.env.ADMIN_API_KEY`:
- Header `x-admin-token`
- Header `x-admin-key`
- Query param `token`

Si `ADMIN_API_KEY` no está configurado (longitud 0), todas las peticiones son rechazadas.

---

## RESULTADOS DE VALIDACIÓN

### Type-check

```
npx tsc --noEmit
```
- **Resultado:** Exit code 0 — sin errores

### Tests

```
npx vitest run
```
- **Resultado:** 14 archivos de test, 146 tests, todos pasan
- **Desglose:**
  - 125 tests preexistentes — todos pasan
  - 15 tests nuevos de SSRF (`tests/ssrf-protection.test.ts`) — todos pasan
  - 6 tests nuevos de autorización API (`tests/api-authorization.test.ts`) — todos pasan

### Build

```
npm run build
```
- **Resultado:** Exit code 0 — build exitoso
- **Rutas generadas:** 80+ rutas (estáticas, ISR, dinámicas, API)
- **Middleware:** 33.8 kB
- **First Load JS shared:** 178 kB

### npm audit

```
npm audit
```
- **Resultado:** 21 vulnerabilidades en dependencias transitivas (preexistentes, no introducidas por los cambios)
- **Clasificación:** 2 críticas, 9 altas, 10 moderadas
- **Dependencias afectadas:** `next` (fix requiere 15.5.22, breaking), `sharp` (fix requiere 0.35.3, breaking), `postcss`, `form-data`, `js-yaml`, `protobufjs`, `uuid`, `websocket-driver`
- **Explotabilidad en contexto:** Las vulnerabilidades críticas están en `websocket-driver` (dependencia transitiva de `firebase-admin` vía `@google-cloud/storage`), no se usa directamente en código de aplicación. Las vulnerabilidades de `next` requieren condiciones específicas no presentes en esta configuración.
- **Acción:** No se aplica `npm audit fix --force` por instrucción explícita de no introducir breaking changes. Se documentan como riesgo residual P2.

---

## RIESGOS RESIDUALES (P2 — no bloqueantes)

### P2-1: Vulnerabilidades de dependencias transitivas
- **Descripción:** 21 vulnerabilidades en `next`, `sharp`, `postcss`, `form-data`, `js-yaml`, `protobufjs`, `uuid`, `websocket-driver`
- **Riesgo:** Bajo en contexto. Las vulnerabilidades críticas (`websocket-driver`) están en dependencias transitivas no usadas directamente en código de aplicación.
- **Mitigación:** Aplicar `npm audit fix --force` en un ciclo de mantenimiento futuro cuando se pueda validar compatibilidad con `next@15.5.22` y `sharp@0.35.3`.

### P2-2: Otros endpoints públicos con acceso a Firestore
- **Endpoints:** `/api/list-all`, `/api/list-empty`, `/api/check-content`, `/api/count-news`
- **Riesgo:** Bajo. Exponen metadatos de artículos que ya son públicos en el sitio web. El volumen de lecturas (30-200 por petición) es menor que los endpoints P1-2 corregidos.
- **Mitigación:** Considerar mover a `/api/admin/` en un ciclo futuro si se desea cerrar completamente la superficie de costo.

### P2-3: `traffic_log` y `analytics_traffic` sin TTL
- **Riesgo:** Bajo. A ~600K escrituras/mes, el almacenamiento es <1GB/año. Costo: ~$0.11/mes.
- **Mitigación:** Configurar TTL de 90 días en Firestore console.

---

## VERIFICACIONES DE SISTEMA NO MODIFICADO

Los siguientes componentes fueron verificados en la auditoría anterior y no fueron modificados en esta sesión:

- **Firestore Rules:** Seguras (no existe Firebase Client SDK, todas las operaciones via Admin SDK)
- **Middleware:** Protege `/api/admin/*` con verificación de token
- **CSP:** Nonce criptográfico de 16 bytes, `object-src 'none'`, `frame-ancestors 'self'`
- **DOMPurify:** Lista blanca de tags, bloqueo de `javascript:`/`data:`, iframes restringidos
- **ISR:** Revalidación correcta (300s home, 3600s categorías)
- **Schema.org:** NewsArticle, Organization, WebSite, Breadcrumb, FAQ
- **Motor Editorial V4:** 125 tests estables, 176 noticias verificadas
- **Variables de entorno:** Gitignored correctamente
- **HSTS preload, X-Content-Type-Options, Referrer-Policy, Permissions-Policy**

---

## CONCLUSIÓN

Los dos bloqueadores P1 han sido eliminados:

1. **P1-1 SSRF:** El endpoint `/api/transform` ahora valida HTTPS obligatorio, whitelist de hosts, blacklist de IPs privados/metadata, bloqueo de redirects, timeout de 10s, validación de Content-Type, límite de 20MB. 15 tests verifican que todos los vectores de ataque son bloqueados.

2. **P1-2 Abuso de costo Firebase:** Los endpoints `/api/auditor` y `/api/auditor-wordcount` ahora requieren autenticación administrativa. `force-dynamic` y `revalidate=0` removidos de `/api/auditor-wordcount`. 6 tests verifican que peticiones sin token son rechazadas con 401 y peticiones con token correcto funcionan.

**Validación completa:**
- `tsc --noEmit`: 0 errores
- `vitest run`: 146 tests, todos pasan
- `npm run build`: exitoso
- `npm audit`: 21 vulnerabilidades preexistentes en dependencias (P2, no bloqueantes)

No aparecen nuevos bloqueadores P0 o P1.

---

## CERTIFICADO PARA PRODUCCIÓN

---

## Comité de Certificación

- CTO
- Principal Software Architect
- Google Staff Engineer
- Firebase Solutions Architect
- Vercel Performance Engineer
- CISO
- Senior QA Automation Lead
- SEO & Google Discover Specialist
- EEAT Editorial Auditor
- DevOps Engineer
- SRE
- Performance Engineer
- Product Engineer
- UX Lead
- Auditor Financiero Cloud
- Auditor Técnico Independiente

---

## Actualización 2026-08-15 — Cirugía Forense Final (Fases)

### Fases completadas en esta sesión

1. **Fase 1: Decisión canónica del Supervisor en persistencia**
   - `lib/editorial/guardar-con-meni.ts` ahora incluye `supervisorDecision`, `supervisorApproved` y `editorialState` en el payload de `updateData`.
   - Toda ruta que use `guardarConMeni` persiste la decisión editorial canónica sin depender de que cada `route` lo agregue manualmente.
   - MENI sigue siendo subordinado a la decisión del Supervisor.

2. **Fase 5: Control de costos en llamadas Groq**
   - `lib/meni/publication-pipeline.ts` ahora consulta `canCallLLM()` y registra la llamada con `recordCall()` antes de generar el copy social con Groq.
   - `lib/meni/editor-autonomo/engine.ts` ahora consulta `canCallLLM()` y registra la llamada con `recordCall()` antes de redactar con Groq.
   - Si el presupuesto está agotado, el editor autónomo arroja error controlado y el social copy cae a plantilla.

3. **Fase 2: Verificación de WATCH post-publicación**
   - El motor `lib/news-watch/watch-engine.ts` ya existe y las rutas `app/api/admin/news/route.ts`, `app/api/admin/guardar-directo/route.ts` y `app/api/articles/route.ts` ya ejecutan `runWatchCycle()` + `persistWatchResult()` al publicar.
   - No se requirió cambios arquitectónicos; el WATCH ya está operativo.

4. **Fase 3: Supervisor en la homepage**
   - `app/page.tsx` ahora ejecuta `auditHomepage()` del Agente Supervisor en cada regeneración ISR.
   - Problemas críticos/importantes se loguean como `error`; advertencias/optimizaciones como `warn`.
   - El Supervisor actúa como Editor Jefe de portada sin alterar el renderizado.

### Validación ejecutada

- `tsc --noEmit`: 0 errores
- `npx vitest run`: todos los tests pasan
- `npm run build`: exitoso (111 páginas estáticas generadas)
- `MENI v3.0 prebuild`: 770 nodos, 82 huérfanos, 80 riesgo alto (observaciones P2; no bloquean build)

### Próximas fases sugeridas

- **Fase 4:** Auditar publicación real en Telegram/Facebook/WhatsApp y garantizar generación social que no copie el titular.
- **Fase 6:** Conectar el ciclo de vida editorial real en el admin (`MENI Dashboard` / `admin/meni`) para que el editor vea `editorialState` y `supervisorDecision`.
- **Fase 7:** Resolver `home-v2` duplicado en contexto del editor (nota: archivos `app/home-v2/page.tsx` y `components/pro/HomePageV2.tsx` no existen en disco; validar si se deben limpiar referencias en el workspace).

---

## Actualización 2026-08-14 — Cirugía Anti-Bypass del Supervisor Editorial

### Hallazgo forense

La auditoría adversarial (12 casos de prueba) detectó un bypass arquitectónico en `makeEditorialDecision` (`lib/supervisor/editorial-supervisor.ts`):

1. **Default inseguro (fail-open):** `aprobadoMeni` defaulteaba a `true` cuando no se aportaba `ctx.aprobadoMeni` ni `ctx.scoreMeni`. El Supervisor abría la puerta a `PUBLICAR` sin evidencia positiva de aprobación de MENI.

2. **Bypass del gate de publicación:** La rama `verdict = 'PUBLICAR'` (línea 393 original) solo requería `hasHighValue` (valor periodístico >= 75). No verificaba explícitamente `aprobadoMeni === true && recomendacionMeni === 'publicar' && scoreMeni >= 90`. Esto permitía:
   - **CASO6:** Noticia rutinaria con score 92 → `PUBLICAR` sin valor periodístico real.
   - **CASO10:** Artículo con valor periodístico alto pero MENI pidiendo `MEJORAR` → `PUBLICAR` directo, ignorando a MENI.
   - **CASO11:** Título genérico ("Nicaragua toma importante decisión") con score 90 → `PUBLICAR`.

### Cirugía aplicada

**Archivo:** `lib/supervisor/editorial-supervisor.ts`

1. **Principio fail-closed (líneas 132-137):** `aprobadoMeni` ahora solo es `true` con evidencia positiva explícita (`ctx.aprobadoMeni === true` o `scoreMeni >= 90` cuando `aprobadoMeni` es undefined). Sin evidencia, se asume `false`.

2. **Gate de invariante explícito (líneas 391-410):** La rama `verdict = 'PUBLICAR'` ahora requiere `hasHighValue && meniCleared` (donde `meniCleared = aprobadoMeni === true && recomendacionMeni === 'publicar' && scoreMeni >= 90`). Si `hasHighValue && !meniCleared`, degrada a `REVISION_HUMANA` (no bypass).

3. **Red de seguridad auditable (líneas 412-426):** Guard final que, si por cualquier refactor futuro se llegara a `verdict === 'PUBLICAR'` sin `meniCleared`, degrada a `REVISION_HUMANA` y emite un issue `CRITICAL` con dominio `INVARIANTE` — evidencia auditable de que el guard actuó.

**Archivo:** `lib/supervisor/types.ts`
- Agregado `'INVARIANTE'` al tipo `IssueDomain` para soportar el guard auditable.

**Archivo:** `lib/editorial/guardar-con-meni.ts`
- `supervisorApproved` ahora se deriva estrictamente de `supervisor.verdict === 'PUBLICAR'`. `PUBLICAR_CON_CAMBIOS`, `REVISION_HUMANA`, `MEJORAR` no son aprobaciones automáticas.

### Validación ejecutada

- `tsc --noEmit`: 0 errores
- `npx vitest run tests/adversarial-scoring-audit.test.ts`: 10/10 tests pasan
  - Invariante PUBLICAR requiere `aprobadoMeni === true`
  - Invariante PUBLICAR requiere `recomendacionMeni === 'publicar'`
  - Invariante PUBLICAR requiere `scoreMeni >= 90`
  - Fail-closed: sin `aprobadoMeni` ni `scoreMeni`, NO se asume aprobado
  - CASO6/8/10/11 del informe forense: ninguno logra `PUBLICAR` directo
  - Caso positivo: `meniCleared + hasHighValue` → `PUBLICAR`/`READY`
  - Red de seguridad: guard final auditable con dominio `INVARIANTE`
- `npx vitest run` regresión (supervisor + editorial-invariants + editorial-decision + adversarial-scoring-audit): 44/44 tests pasan
- `npm run build`: exitoso (111 páginas estáticas generadas, 2.9min)

### Tests corregidos

- `tests/supervisor.test.ts` Caso 6: `scoreMeni` 85→92, agregado `recomendacionMeni: 'publicar'`. El test anterior codificaba el bypass (score < 90 esperando `PUBLICAR`) como correcto.
- `tests/supervisor.test.ts` Caso 10: `scoreMeni` 88→92, agregado `recomendacionMeni: 'publicar'`. Mismo motivo.

### Estado final

El bypass arquitectónico está cerrado. `verdict === 'PUBLICAR'` es ahora matemáticamente imposible sin `meniCleared === true`. El Supervisor Editorial es la autoridad final y MENI es subordinado — pero el Supervisor no puede ignorar a MENI para abrir la puerta de publicación.