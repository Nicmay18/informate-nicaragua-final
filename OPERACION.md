# Nicaragua Informate — OPERACIÓN EMPRESARIAL

**Estado:** PRODUCTION / OPERATIONS MODE
**Fecha de transición:** 19 de septiembre de 2026
**Regla principal:** ESTABILIDAD > REFACTORIZACIÓN. No cambiar lo que funciona.

Este es el punto de entrada único para operar la empresa. Los manuales detallados ya existen; este documento los indexa y define las reglas permanentes.

---

## 1. Documentación operativa (mapa)

| Necesito… | Documento |
|---|---|
| Rutina diaria/semanal, qué revisar, indicadores de salud | `NICARAGUA-INFORMATE-FINAL-OPERATIONS.md` |
| Flujo editorial del día, responsabilidad de cada motor | `NICARAGUA_INFORMATE_OPERATING_MANUAL_2026.md` |
| Estándar de calidad de una noticia | `GUIA-EDITORIAL-NICARAGUA-INFORMATE.md` |
| Checklist diario del editor | `EDITOR_DAILY_CHECKLIST.md` |
| Qué hacer si falla Firebase / GSC / GA4 / OneSignal / Telegram / X / crons | `NICARAGUA-INFORMATE-FINAL-OPERATIONS.md` §3–§11 |
| Lista completa de credenciales requeridas | `NICARAGUA-INFORMATE-FINAL-OPERATIONS.md` §12 |
| NIOS: guía de uso | `NIOS_USER_GUIDE.md` |
| Deploy y estructura del repo | `README.md` |

---

## 2. Congelamiento de arquitectura

### CONGELADO — no tocar salvo incidente P0

- Stack: Next.js 15 (App Router) + Firestore + Vercel + Cloudflare.
- `app/sitemap.ts`, `app/news-sitemap.xml/route.ts`, feeds, robots.
- Pipeline de publicación y revalidación (`lib/meni/publication-pipeline.ts`, tags de caché).
- Autenticación admin (`middleware.ts` + `lib/auth.ts`), crons con `verifyAdminOrCronToken`.
- Reglas de Firestore (`firestore.rules`) e índices (`firestore.indexes.json`).
- Motor MENI (Editor IA V4.1 LTS) — regla LTS: solo se modifica cuando un mismo patrón falla en ≥10 artículos reales con evidencia.
- Home Ranking / Home Balance Engine.
- Estructura de datos de noticias en Firestore.

### MANTENIMIENTO — se toca solo para corregir

- Bugs de publicación, edición, revalidación o visualización.
- Contenido existente clasificado PULIR / ACTUALIZAR / RECUPERAR / ARCHIVAR / DESPUBLICAR (nunca borrado masivo ni automático).
- Dependencias con vulnerabilidad crítica explotable (ver §7).
- Índices Firestore si una consulta nueva lo requiere.

### BACKLOG FUTURO — no es trabajo inmediato

Ver §8.

---

## 3. MENI — Jefe Editor de Redacción

MENI no es un score: es el jefe editor. En código emite `recomendacionEditorial` con tres valores (`lib/meni/editorial-brain/types.ts`):

| Valor real | Significado operativo |
|---|---|
| `publicar` | PUBLICAR — cumple valor, contexto, claridad y utilidad |
| `mejorar` | MEJORAR — publicable solo tras corregir lo indicado |
| `revisar` | NO PUBLICAR hasta revisión humana |

Cada decisión viene acompañada de: `mensajeEditor` (por qué), `razonamiento` (puntos a favor/contra), `correccionesSugeridas` (qué debe arreglar el redactor), `valeLaPenaPublicar`, riesgo editorial (`VERDE/AMARILLO/ROJO`) y evaluación de si merece portada.

**Reglas permanentes de MENI:**

- Nunca inventa nombres, edades, fechas, cifras, lugares, causas, declaraciones, fuentes ni conclusiones. Si falta información → `FALTA INFORMACIÓN`; si requiere confirmación → `VERIFICAR`.
- Pregunta central: *¿el lector de Nicaragua Informate necesita o quiere leer esto?*
- No publica por cuota ni por categoría. El flujo correcto es: oportunidad de cobertura → historia real → verificación → MENI evalúa → redacción decide.

---

## 4. NIOS — Sistema Operativo

NIOS observa, detecta, analiza, alerta, coordina, ejecuta tareas técnicas permitidas, verifica, registra y reporta.

**NIOS NO es editor autónomo.** No puede inventar noticias, modificar hechos/cifras/nombres/fuentes, publicar contenido sensible por su cuenta ni borrar noticias por criterio propio.

### AUTO-REPAIR

Solo acciones técnicas, seguras, reversibles y verificables. En código (`lib/nios/repair-engine.ts`) cada acción está clasificada:

- `AUTO_REPAIR` — técnica y reversible (limpiar estados, reparar índices, corregir cachés, reintentos controlados, housekeeping).
- `HUMAN_ACTION` — requiere persona.
- `BLOCKED_EXTERNAL` — depende de tercero, solo se reporta.
- `VERIFY_ONLY` — verificación sin cambios.

Toda acción queda registrada con `status` y `verificationStatus`. Decisiones editoriales irreversibles están fuera de AUTO-REPAIR.

---

## 5. Secretos

**Verificado (repo):** no hay tokens en el árbol de trabajo ni en el historial git. Los archivos de secretos en texto plano fueron eliminados y nunca se commitearon. Las claves viven en Vercel env y en Firestore `config/admin` (fail-closed: si falta la clave, la función devuelve `skipped`/error, nunca un fallback inseguro).

**OWNER ACTION REQUIRED — confirmar rotación en el proveedor:**

- Token de bot de Telegram (BotFather → `/revoke` si el anterior estuvo expuesto).
- GitHub PAT usado por `/api/admin/upload-image` (GitHub → Settings → Developer settings → regenerar y actualizar en `config/admin` o `GITHUB_TOKEN`).

La rotación real ocurre en el proveedor; el repo ya está limpio. Si ya se rotaron, este punto queda cerrado.

**Cómo rotar cualquier secreto:**

1. Generar el nuevo valor en el proveedor (Firebase, BotFather, GitHub, Vercel, etc.).
2. Actualizar en Vercel (`vercel env` o dashboard → Environment Variables) o en Firestore `config/admin` según corresponda.
3. Redeploy.
4. Revocar/invalidar el valor anterior en el proveedor.
5. Nunca escribir el valor en código, docs ni archivos del repo.

---

## 6. Publicar y operar (resumen)

- Panel admin: `/admin` (editor, portada, MENI, NIOS, distribución, tráfico, correcciones).
- Publicar/editar noticias: `/admin/editor`. Portada: `/admin/portada`.
- Evaluación editorial: `/admin/meni`. Centro NIOS: `/admin/nios`.
- Publicación dispara revalidación del artículo, portada y listados; distribución (Telegram/redes) es no bloqueante y devuelve `skipped` si falta credencial.
- Deploy: push a `master` → Vercel despliega. Manual: `npm run build && vercel --prod`.
- Antes de cualquier cambio de código: `npm run test:merge` (type-check + vitest + lint).

---

## 7. Vulnerabilidades npm — estado al 19/09/2026

`npm audit fix` aplicado: **19 → 12**. Corregidos sin breaking changes: `next` 15.5.23 → **15.5.25** (2 CVEs críticos de RCE), `sharp`, `js-yaml`, `browserslist`, `@tiptap/core`, `qs`, `gaxios`, entre otros.

Restantes (todas requieren upgrade **major** — documentadas, no aplicadas):

| Paquete | Sev. | Fix disponible | Por qué no se aplicó |
|---|---|---|---|
| `postcss` 8.4.31 (nested en next) | high | `next@16.x` | Requiere Next 16 (major). El CVE exige CSS con `sourceMappingURL` malicioso procesado en build; no es explotable con CSS propio |
| `firebase-admin` chain (google-gax, gaxios, uuid, teeny-request, retry-request, @google-cloud/*) | moderate | `firebase-admin@14.x` | Major bump del Admin SDK; riesgo de romper integraciones verificadas |
| `vitest` / `@vitest/mocker` | moderate | `vitest@5.x` | Dev-only; no se despliega a producción |

Política: revisar `npm audit` mensualmente; solo actuar ante críticas explotables o cuando un major upgrade haya sido probado en staging.

## 8. Backlog

- **P0** — ninguno abierto.
- **P1** — confirmar rotación de Telegram token y GitHub PAT en el proveedor (§5, OWNER ACTION REQUIRED).
- **P2** — upgrades major programados en ventana de mantenimiento: `next@16`, `firebase-admin@14`, `vitest@5` (resuelve los 12 advisories restantes). Sentry está en versión deprecada pero funcional: evaluar solo si falla.
- **P3** — sitemap: con `MAX_SITEMAP_LIMIT=1000` artículos + ~500 entidades + temas/autores/guías, el tamaño estimado (~300 KB) está muy por debajo del límite de Google (50 MB / 50k URLs). El "problema >2 MB" no se reproduce; si el catálogo supera ~10k URLs en el futuro, migrar a sitemap index.

## 9. Regla para nuevas funciones

Toda función nueva debe responder: qué problema real resuelve, a quién ayuda, impacto, necesidad, y costo en complejidad/rendimiento/dinero/seguridad/mantenimiento. Si no aporta suficiente valor → no se construye.

## 10. Monitoreo (usar lo existente)

- Diario 5 min: `/admin/dashboard-calidad`, `/api/admin/nios-intelligence`, cola de distribución (ver `NICARAGUA-INFORMATE-FINAL-OPERATIONS.md` §1).
- Costos: consolas Firebase/Vercel/Cloudflare — alertar solo ante consumo anormal.
- Analytics: GA4 + GSC vía colectores NIOS (`traffic_daily`, `nios_daily_snapshots`). Si una integración no tiene credenciales → `NO CONFIGURADO`; nunca fabricar datos.
