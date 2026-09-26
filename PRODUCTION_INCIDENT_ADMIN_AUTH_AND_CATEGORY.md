# INCIDENTE DE PRODUCCIÓN — DIAGNÓSTICO DE CAUSA RAÍZ

> Solo diagnóstico. Sin cambios, sin deploys.
> Evidencia verificada contra código real + Firestore real. 2026-09-25.

---

## 1. INCIDENTE ADMIN 401

### Síntoma
Panel admin no carga noticias ni categorías. Consola: `api/admin/news → 401`, `api/admin/config → 401`, `api/admin/centro-de-comando → 401`, `Error cargando noticias: 401` en `getNoticiasCache`/`cargarEstadisticas`.

### Datos reales — las noticias NO desaparecieron
Firestore `noticias`: **493 docs, 460 publicadas** (antes: 476/443 — creció). Categorías pobladas: Nacionales 157, Sucesos 136, Internacionales 64, Deportes 58, Espectáculos 26, Tecnología 19.

**Conclusión: el panel perdió autorización para leerlas; los datos están intactos.**

### Flujo de autenticación real (post-cambios)

```
panel.html: Firebase Auth → POST /api/admin/session {idToken}
  → servidor verifica idToken + ADMIN_EMAILS → Set-Cookie admin_session (HttpOnly, 24h)
  → localStorage.admin_api_key = 'session-cookie' (marcador, NO secreto)
fetch /api/admin/* → x-admin-token: 'session-cookie' + Cookie: admin_session=<key>
  → middleware: header OR cookie (independiente)
  → si cookie válida y header inválido → INYECTA x-admin-token=<cookie> downstream
  → ruta: verifyAdminToken(header inyectado) → OK
```

### Causa raíz (cadena completa de la regresión)

El cambio `990ab5f9` ("ADMIN_API_KEY ya no viaja al JS") introdujo la regresión en tres capas, corregidas en tres commits:

1. **`990ab5f9`**: session dejó de devolver `token` → panel guardó marcador `'session-cookie'` → `x-admin-token` inválido. La cookie se fijaba, pero…
2. **Middleware `||` cortocircuitaba**: `headers.get('x-admin-token') || cookie` → header truthy ganaba, cookie jamás se evaluaba → 401. Corregido en `1ac98d9f` (evaluación independiente).
3. **Rutas re-verifican solo headers**: ~25 rutas con `verifyAdmin*(headers.get('x-admin-token'))` → la cookie no llegaba a la ruta → 401 aun con middleware OK. Corregido en `147be033` (inyección de header desde cookie válida).
4. **Cookie nunca se renovaba**: `panel.html` tenía `if (localStorage.getItem('admin_api_key')) return;` — marcador presente + cookie expirada (24h) → sesión jamás se re-POSTeaba → 401 permanente. Corregido en `30f1b7a3` (siempre renovar).

### GAP RESIDUAL CONFIRMADO (aún roto)

**`/api/admin/config`** está en `PUBLIC_ADMIN_ROUTES` → el middleware lo deja pasar **sin inyección** → la ruta ejecuta `isAdminRequest(request)` que lee **solo headers** → con auth por cookie, siempre 401.

Además: `panel.html` llama a `/api/admin/config` **sin enviar ningún token** (`fetch(..., {method:'POST', body})`, líneas 4758/5868/6112) → incluso antes del cambio de sesión, esta llamada **siempre devolvía 401**. Es un fallo **preexistente**, no una regresión — el panel nunca autenticó esa ruta.

`/api/admin/estado` y `/api/admin/repair-fechas` tienen el mismo patrón (exentas + verificación propia header-only).

### Verificación externa (sin credenciales reales, correcto):
```text
admin/news x-admin-token=session-cookie   → 401 (sin cookie válida)
admin/news Cookie: admin_session=inválida → 401
/noticias                                  → 200
```

### Qué NO está roto
- Las noticias en Firestore (493 docs).
- La cadena header directo: un `x-admin-token` válido sigue funcionando en todas las rutas.
- El middleware con cookie válida + inyección cubre todas las rutas `/api/admin/*` no exentas.
- Sesión válida fuera del panel: sí, `/api/admin/news` funciona con credencial válida.

### Acción inmediata para el usuario
Recargar `panel.html` con Ctrl+F5 → el nuevo código re-POSTea `/api/admin/session` → cookie fresca → los 401 de `news`/`centro-de-comando` desaparecen. El 401 de `config` persistirá (gap residual documentado abajo).

---

## 2. INCIDENTE CATEGORÍA — hotel + MICHELIN Key

### Noticia real
`q2xLcFM9Z9TQMxZvHulF` — "Morgan's Rock recibe una MICHELIN Key en Nicaragua." — `estado: publicado`, fecha `2026-09-25T21:05:56Z`, autor humano (guardar-directo).

### Estado persistido (verificado en Firestore)

```text
categoria:        "Nacionales"      ← la del editor
publicCategory:   "Nacionales"
perfil:           "nacionales"      ← canonical, NO el detectado
profileInternal:  "nacionales"
editorialReason:  "…aprobada como INVESTIGACION (Nacionales)…"
scoreMeni: 90 · aprobadoMeni: true · supervisorApproved: true
```

**El documento persistió Nacionales en todos los campos.** "Deportes" no quedó escrito en ningún campo del doc.

### Prueba reproducible de la divergencia

Ejecuté `detectContentProfile` (el detector real de MENI) sobre el contenido real del artículo:

```text
profile_detected: deportes        ← EL FALSO POSITIVO
confidence:       0.72            (= profile_confidence 0.73 persistido)
matched_keywords: ["seleccion"]   ← UNA sola keyword
scores: deportes 21 | turismo 8 | internacional 4.5 | nacionales 2.5
```

### Punto exacto de divergencia

`lib/meni/profile-detector.ts` — `deportes` incluye `{ keyword: 'selección', weight: 1 }` (pensada para "selección nacional de fútbol"). El texto dice *"permanencia de Morgan's Rock **en la selección** [MICHELIN] por segundo año consecutivo"* → la keyword `seleccion` dispara deportes (además como entity match, lo que explica el score inflado de 21).

### Cadena de autoridad real (código)

`guardar-con-meni.ts:112` → `resolvePublicCategory({categoria: input.categoria, perfil: meni.profile_used, ...})` → `resolveEditorialClassification` (canonical.ts:183-249):

```text
1. categoria explícita del editor  → GANA SIEMPRE (finalCategory: editorCategory)
2. si difiere de la detección MENI → classificationConflict=true (CATEGORY_CONFLICT)
3. sin categoría explícita         → gana la detección
4. sin nada                        → fallback Nacionales
```

**Autoridad real sobre la categoría: el EDITOR HUMANO** (cuando elige una pública). MENI solo sugiere; la contradicción produce una señal (`classificationConflict`), no una sustitución. El Supervisor recibe la categoría canónica ya resuelta — no puede ni necesita corregirla.

### Dónde vio el usuario "Deportes"
El `meni.profile_used='deportes'` interno se muestra en la evaluación MENI del panel (respuesta de `/api/admin/meni/evaluar` o diagnóstico durante la edición) antes de que la resolución canónica fije Nacionales. Es el perfil *detectado* expuesto en UI — no el persistido.

### BUG CONEXO ENCONTRADO (señal que muere)
`updateData` en guardar-con-meni **no persiste** `classificationConflict` ni `classificationStatus`: la señal "editor=Nacionales vs MENI=Deportes" se genera dentro de `resolveEditorialClassification` y se descarta. Además `profile_confidence: 0.73` queda persistido — la confianza de un perfil que NO se usó, sin contexto.

---

## 3. CONTRADICCIONES ENCONTRADAS (solo evidencia comprobada)

| Campo | Valor humano | Valor MENI | Valor persistido | Autoridad real |
|-------|--------------|------------|------------------|----------------|
| categoría | Nacionales | deportes (perfil interno, kw `seleccion`) | Nacionales | Editor (precedencia explícita) |
| conflicto de clasificación | — | `CATEGORY_CONFLICT` generado | **no persistido** | Señal huérfana — nadie la consume |

Escaneo del corpus completo (493 docs): no existen campos `categoriaEditor`/`categoriaMeni`/`categoriaOriginal` — la divergencia no se registra en el doc; solo `categoria` y `publicCategory`. Caso del hotel: divergencia **detectada pero invisible** post-persistencia. No hay evidencia de otros docs con divergencia humana↔MENI porque el sistema no la almacena.

---

## 4. REGRESIÓN

| Candidata | Veredicto | Evidencia |
|-----------|-----------|-----------|
| 401 admin causado por commits editoriales `c0f5fd1b`/`eaefef8b` | **DESCARTADO** | esos commits no tocan auth/middleware/panel; incidente es de auth |
| 401 admin causado por cambios de sesión (`990ab5f9`) | **CONFIRMADO** | cadena reconstruida: token fuera del body → marcador → `||` enmascaraba cookie → rutas header-only → early-return impedía renovación |
| `/api/admin/config` 401 | **PARCIALMENTE PREEXISTENTE** | el panel nunca envía token a esa ruta; la exención del middleware impide la inyección — ahora se vuelve visible porque antes había fallback de clave en localStorage |
| "Deportes" en nota del hotel | **NO ES REGRESIÓN** | falso positivo del detector por keyword `seleccion`; el mecanismo de precedencia funcionó y persistió Nacionales correctamente |

---

## 5. CORRECCIÓN MÍNIMA PROPUESTA (NO implementada)

### Corrección necesaria
- **`/api/admin/config`** (y las demás `PUBLIC_ADMIN_ROUTES` que autentican por su cuenta): hacer que `isAdminRequest` en `lib/auth.ts` también acepte la cookie `admin_session` (misma comparación timing-safe), o sacar `config` de la lista de exentas para que reciba la inyección. Una sola opción, no ambas — preferido: cookie-aware en `isAdminRequest` porque es un punto único.
- **`profile_confidence` persistido**: guardar la confianza del perfil *usado* o etiquetarla como `detected_profile_confidence` + guardar `detectedProfile`/`suggestedCategory`/`classificationConflict` en el doc — hoy la señal de conflicto muere y la confianza registrada miente.

### Mejora opcional
- `profile-detector`: `seleccion` debería exigir contexto deportivo (p.ej. "selección nacional/de fútbol") — keyword desambiguada o peso menor. La confianza 0.72 con una sola keyword ambigua es frágil.
- Superficie UI: cuando `classificationConflict=true`, mostrar "Editor: Nacionales · MENI sugiere Deportes (señal: 'selección')" en vez de solo el perfil detectado.

### Trabajo futuro
- Persistir `classificationStatus`/`classificationConflict` en `noticias` para poder auditar divergencias reales (hoy imposible reconstruirlas).

---

## 6. PRUEBAS NECESARIAS (regresión)

### Admin
1. Sesión con cookie válida + header `'session-cookie'` → `GET /api/admin/news` → 200.
2. Sesión con cookie válida + SIN header → `GET /api/admin/news`, `GET /api/admin/centro-de-comando` → 200 (inyección).
3. `POST /api/admin/config {action:'read'}` con solo cookie → 200 (hoy: 401 — gap).
4. Cookie `admin_session` inválida + sin header → 401 en todas.
5. Cookie expirada/ausente + marcador en localStorage → panel debe re-POSTear session (ya cubierto por `30f1b7a3`).

### Categoría
1. Editor envía `categoria: 'Nacionales'` + contenido con keyword ambigua (`selección`) → persistir Nacionales + `classificationConflict` registrado.
2. Editor no envía categoría + detector dice deportes por keyword ambigua → señal `CATEGORY_AMBIGUOUS`/revisión, no sustitución silenciosa.
3. `detectContentProfile` sobre el texto real de Morgan's Rock → NO debe devolver `deportes` a partir de una única keyword ambigua sin contexto deportivo.

---

## Terminación

1. **Por qué 401**: regresión del cambio de sesión por cookie (cadena de 3 capas ya corregida) + gap residual en rutas exentas del middleware.
2. **Noticias intactas**: 493 docs verificados.
3. **Relación con cambios recientes**: sí — `990ab5f9` y la cadena de correcciones; commits editoriales descartados.
4. **Por qué MENI dijo Deportes**: keyword `seleccion` ("selección MICHELIN") → perfil interno `deportes`, score 21.
5. **Autoridad real de categoría**: el **editor humano** (`resolveEditorialClassification` da precedencia explícita; MENI solo sugiere). Verificado: persistió Nacionales.
6. **Patrón sistémico**: no demostrable en datos (la divergencia no se persiste); el detector es vulnerable a keywords ambiguas — probablemente sistémico pero sin corpus de evidencia.
7. **Corrección mínima**: cookie-aware `isAdminRequest` para rutas exentas + persistir la señal de conflicto + desambiguar `seleccion`.
