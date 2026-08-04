# 04 — SECURITY AUDIT (CISO)

**Auditor:** CISO + Security Engineer
**Fecha:** 2026-08-03

---

## 1. CABECERAS DE SEGURIDAD

### Implementadas en `middleware.ts` y `next.config.ts`:

| Cabecera | Valor | Estado |
|---|---|---|
| Content-Security-Policy | Completa con nonce | ✅ |
| X-Frame-Options | SAMEORIGIN | ✅ |
| X-Content-Type-Options | nosniff | ✅ |
| Referrer-Policy | strict-origin-when-cross-origin | ✅ |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | ✅ |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), interest-cohort=() | ✅ |
| Cross-Origin-Opener-Policy | same-origin | ✅ |
| X-DNS-Prefetch-Control | on | ✅ |
| X-Powered-By | Eliminado | ✅ |

**Evaluación:** Cabeceras excelentes. CSP con nonce dinámico previene XSS.

## 2. HALLAZGOS DE SEGURIDAD

### H-SEC-01: API Routes públicas sin auth exponen datos de Firestore
- **Evidencia:** `/api/list-all`, `/api/list-empty`, `/api/check-content`, `/api/auditor`, `/api/auditor-wordcount`, `/api/top-noticias`, `/api/listar-categoria` — todas GET públicas
- **Archivo:** `app/api/list-all/route.ts:4`, `app/api/auditor/route.ts:55`, etc.
- **Impacto:** Information disclosure — cualquiera puede ver todos los artículos, metadatos, scores editoriales
- **Riesgo:** ALTO
- **Prioridad:** P1
- **Solución:** Mover a `/api/admin/` o agregar `isAdminRequest`

### H-SEC-02: `firestore.rules` permite create/update/delete a cualquier usuario autenticado
- **Evidencia:** `firestore.rules:12` — `allow create: if request.auth != null`
- **Impacto:** Cualquier usuario con Firebase Auth (no solo admins) puede crear/editar/eliminar noticias
- **Riesgo:** CRÍTICO
- **Prioridad:** P0
- **Solución:** Verificar email del admin: `allow create: if request.auth != null && request.auth.token.email in ['admin@nicaraguainformate.com']`

### H-SEC-03: `config` y `configuracion` permiten write a cualquier auth
- **Evidencia:** `firestore.rules:78-79` — `allow write: if request.auth != null`
- **Riesgo:** ALTO
- **Prioridad:** P1
- **Solución:** Restringir a admin emails

### H-SEC-04: `isAdminRequest` compara token con string plano
- **Evidencia:** `lib/auth.ts:13` — `token === ADMIN_API_KEY`
- **Impacto:** Vulnerable a timing attacks
- **Riesgo:** BAJO (mitigado por Vercel TLS)
- **Prioridad:** P3
- **Solución:** Usar `crypto.timingSafeEqual()`

### H-SEC-05: Token admin pasado via query param
- **Evidencia:** `lib/auth.ts:11` — `url.searchParams.get('token')`
- **Impacto:** Token aparece en logs de servidor, referers, browser history
- **Riesgo:** MEDIO
- **Prioridad:** P2
- **Solución:** Eliminar soporte de query param, solo aceptar headers

### H-SEC-06: `panel.html` sirve HTML estático con lógica admin client-side
- **Evidencia:** `app/api/panel/route.ts:9` — lee `public/panel.html` y lo sirve
- **Impacto:** Toda la lógica del panel está en el cliente, incluyendo llamadas API con token
- **Riesgo:** MEDIO — el token se pasa via header desde el cliente
- **Prioridad:** P2

### H-SEC-07: `api/transform` permite SSRF via parámetro URL
- **Evidencia:** `app/api/transform/route.ts:23` — `fetch(imageUrl, { redirect: 'follow' })` sin validación de host
- **Impacto:** Attacker puede usar el endpoint para fetch URLs internas (SSRF)
- **Riesgo:** ALTO
- **Prioridad:** P1
- **Solución:** Validar que la URL sea de los `remotePatterns` permitidos en `next.config.ts`

### H-SEC-08: `api/radio-proxy` podría ser vector de SSRF
- **Evidencia:** `app/api/radio-proxy/route.ts` — proxy de radio
- **Riesgo:** MEDIO
- **Prioridad:** P2

### H-SEC-09: DOMPurify configurado correctamente para sanitización HTML
- **Evidencia:** `lib/sanitize.ts:4-17` — lista blanca de tags, atributos, forbid `style`
- **Evidencia:** `lib/sanitize.ts:46-56` — hook para bloquear `javascript:`, `data:`, `vbscript:` en href/src
- **Evidencia:** `lib/sanitize.ts:58-67` — hook para agregar `rel="noopener noreferrer nofollow"` a enlaces externos
- **Impacto:** Positivo — previene XSS en contenido de artículos
- **Riesgo:** N/A

### H-SEC-10: `escapeJsonLd` previene inyección en JSON-LD
- **Evidencia:** `lib/jsonld.ts` importado en `app/layout.tsx:17` y usado en líneas 171-172
- **Impacto:** Positivo
- **Riesgo:** N/A

### H-SEC-11: Bot blocking en middleware
- **Evidencia:** `middleware.ts:16-21` — bloquea GPTBot, ChatGPT-User, ClaudeBot, AhrefsBot, SemrushBot, etc.
- **Impacto:** Positivo — protege contenido de scrapers de IA y SEO competitors
- **Riesgo:** N/A

### H-SEC-12: `wp-admin`, `xmlrpc.php`, `admin.php` bloqueados
- **Evidencia:** `next.config.ts:285-298` — redirects a `/` para paths de WordPress legacy
- **Impacto:** Positivo — evita ataques a vectores de WordPress
- **Riesgo:** N/A

### H-SEC-13: `isToxicSlug` para contenido removido
- **Evidencia:** `middleware.ts:110-115` — retorna 410 Gone para slugs tóxicos
- **Impacto:** Positivo — manejo legal de contenido retirado
- **Riesgo:** N/A

### H-SEC-14: Rate limiter implementado pero limitado
- **Evidencia:** `lib/rate-limit.ts` — Map-based, cleanup cada 100 requests
- **Impacto:** Solo usado en `/api/pulir` (`route.ts:6`). No en otras APIs
- **Riesgo:** MEDIO — APIs sin rate limiting
- **Prioridad:** P2
- **Solución:** Aplicar rate limiter a todas las APIs públicas

### H-SEC-15: `crypto.getRandomValues` para nonce
- **Evidencia:** `middleware.ts:6-9` — 16 bytes random
- **Impacto:** Positivo — nonce criptográficamente seguro
- **Riesgo:** N/A

### H-SEC-16: Vulnerabilidades de dependencias (npm audit)
- **Evidencia:** `npm audit` reporta 21 vulnerabilidades (10 moderate, 9 high, 2 critical)
- **Críticas:** `websocket-driver` (resource limit bypass, message corruption)
- **Altas:** `next` (múltiples CVEs de SSRF, XSS, cache poisoning, DoS), `sharp` (libvips CVEs), `postcss` (XSS, path traversal), `form-data` (CRLF injection), `js-yaml` (DoS), `protobufjs` (DoS)
- **Riesgo:** ALTO
- **Prioridad:** P1
- **Solución:** `npm audit fix` para no-breaking, evaluar `npm audit fix --force` para next@15.5.22

### H-SEC-17: `FIREBASE_SERVICE_ACCOUNT_BASE64` en env
- **Evidencia:** `lib/firebase-admin.ts:17` — lee `FIREBASE_SERVICE_ACCOUNT_BASE64` de environment
- **Impacto:** Correcto para Vercel, pero la key tiene acceso total a Firestore
- **Riesgo:** BAJO (si Vercel env vars están protegidas)
- **Prioridad:** P3

### H-SEC-18: `links_cortos` colección no está en `firestore.rules`
- **Evidencia:** `app/api/l/[id]/route.ts:60` — `db.collection('links_cortos').doc(id).get()`
- **Impacto:** Sin reglas explícitas, Firestore niega por defecto. Pero Admin SDK bypassa rules
- **Riesgo:** BAJO — Admin SDK bypassa rules
- **Prioridad:** P3

## 3. MATRIZ DE RIESGO

| Hallazgo | Riesgo | Prioridad | Estado |
|---|---|---|---|
| H-SEC-02: Firestore rules abiertas | CRÍTICO | P0 | ❌ No resuelto |
| H-SEC-01: APIs públicas sin auth | ALTO | P1 | ❌ |
| H-SEC-07: SSRF en /api/transform | ALTO | P1 | ❌ |
| H-SEC-16: Dependencias vulnerables | ALTO | P1 | ❌ |
| H-SEC-03: Config write abierto | ALTO | P1 | ❌ |
| H-SEC-05: Token en query param | MEDIO | P2 | ❌ |
| H-SEC-06: Panel client-side | MEDIO | P2 | ❌ |
| H-SEC-14: Rate limiting limitado | MEDIO | P2 | ❌ |

## 4. SCORE

| Dimensión | Score |
|---|---|
| Cabeceras HTTP | 9/10 |
| CSP | 9/10 |
| Sanitización HTML | 9/10 |
| Firestore rules | 3/10 |
| API auth | 4/10 |
| Dependencias | 4/10 |
| Rate limiting | 3/10 |
| **Total** | **5.9/10** |
