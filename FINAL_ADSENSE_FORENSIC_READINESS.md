# FINAL ADSENSE FORENSIC READINESS

> Auditoría forense read-only sobre producción (`nicaraguainformate.com`). Sin cambios de código, commits ni deploys. HEAD auditado: `026bcfb4`.

## 1. Executive Summary

Sitio público operativo, indexable, con contenido real y páginas legales completas. Se identifica **1 bloqueo de seguridad residual** (caché Cloudflare sirviendo páginas administrativas — fix parcial aplicado por el propietario, 3 rutas siguen cacheadas) y **1 riesgo editorial** (títulos con defectos mecánicos publicados, ~16% de la muestra). El contenido público en sí no presenta bloqueo para solicitar AdSense.

## 2. Production Verification

| Ruta | Resultado |
|---|---|
| `/`, `/noticias` | 200, `index,follow`, canonical correcto |
| `/categoria/{sucesos,nacionales,deportes,internacionales,espectaculos,tecnologia}` | 200 ×6 |
| `/robots.txt`, `/sitemap.xml`, `/feed.xml` | 200 |
| `/contacto`, `/nosotros`, `/privacidad`, `/cookies`, `/terminos`, `/politica-editorial` | 200 ×6 — todas existen |
| Ruta inexistente | 404 correcto |
| Artículos (muestra) | 19/19 → 200 |

## 3. Security

- APIs admin fail-closed (`/api/admin/config`, `/api/admin/news` → 401 sin sesión / cookie inválida).
- `/panel/*` en origin → `307 /login` con `no-store` ✓.
- **Sin secretos en HTML público** (no `ADMIN_API_KEY`, `admin_session`, `x-admin-token`, `CRON_SECRET`, `private_key`).
- Campos internos serializados en artículos (`aprobadoMeni`, `vistas`, `noindex`) — exposición menor de metadata editorial, no credenciales. **Observación.**
- **BLOQUEO**: CF caché residual — ver §13.

## 4. Public Content

- Contenido sustantivo: 1051–2451 palabras/artículo en muestra.
- Sin artefactos IA (`:contentReference`, `oaicite`, `cite_turn`, URLs basura) → 0/19.
- Categorías coherentes con el contenido.
- Defectos mecánicos en títulos publicados — ver §12.

## 5. Editorial Integrity

Cadena verificada en código (auditoría previa): Editor → MENI → Supervisor → `canonical.contenido` persistido → publicación. Aprobado = publicado; sin bypass. Gate `findBlockingDefects` rechaza artefactos antes de escribir.

## 6. Navigation

Home → categorías → artículos → páginas legales: todas resuelven. Sin 404 inesperados en la superficie pública revisada.

## 7. SEO Technical

- `robots.txt` presente; artículos con `index, follow` (el `noindex` inicial fue falso positivo — campo de datos serializado, no directiva).
- Canonical self-referential en todos los artículos muestreados.
- JSON-LD (`datePublished` presente), `og:image` presente, meta description ~145–158 chars.
- Sitemap 409 URLs (guías + noticias).

## 8. Search/Indexability

Artículos indexables, canonical correcto, sin noindex accidental, feeds y sitemap íntegros. Los datos GSC (0 impresiones) son dato, no conclusión — el sistema ya lo expresa así.

## 9. Legal/Trust Pages

Existen todas: contacto, nosotros, privacidad, cookies, términos, política editorial — 200 ✓.

## 10. NIOS/AdSense Readiness Assessment

El score NIOS interno no es una decisión de Google — el sistema ya lo comunica honestamente post-fix ("señal interna", "no concluye rechazo oficial"). Etiquetas engañosas corregidas en `1d78bcc6`.

## 11. 20-Article Sample

Muestra del sitemap (19 `/noticias/*` + 1 `/guia/*` — el regex de extracción quedó corto en 19): todas 200, indexables, canonical-self, JSON-LD, og:image, 1000+ palabras, 0 artefactos IA. Fechas coherentes (mayo–sept 2026).

**Defectos de título detectados (3/19 ≈ 16%)**:
- `"Accidentes viales dejan deja afectados en Nicaragua Dos..."` — duplicación + truncamiento
- `"Migración vuelve a en Nicaragua: Migración modificó el..."` — frase rota
- `"Dos accidentes laborales deja afectados en Nicaragua Do..."` — concordancia + truncamiento

Los commits `abd8d888`/`5f071457`/`46c939e2` (otra sesión) agregaron el gate de defectos mecánicos **para nuevas publicaciones** — los defectos visibles son de artículos **ya publicados antes del gate**.

## 12. Findings

| # | Hallazgo | Clasificación |
|---|---|---|
| 1 | CF sirve 3 páginas admin desde caché pública (`/panel/centro-de-comando`, `/panel/nios/reparaciones`, `/panel/nios/google-intelligence` → 200 `cf:HIT`, age ~4260s). Resto ya `BYPASS`. | **BLOQUEO** (operativo/seguridad) |
| 2 | Títulos publicados con defectos mecánicos (~16% muestra). Solo lectura — afecta credibilidad editorial visible para revisores AdSense | **RIESGO** (mitigable; gate ya evita nuevos) |
| 3 | Metadata interna serializada en HTML público (`aprobadoMeni`, `vistas`) | OBSERVACIÓN |
| 4 | Contenido público, legal, SEO técnico, navegación, indexabilidad | SIN PROBLEMA |

## 13. Blocking Issues

**CF cache — completar el fix ya iniciado.** Evidencia: `GET /panel/centro-de-comando` sin cookie → 200 + `cf-cache-status: HIT` + `age: 4260`. El origen responde `307 /login` correctamente (probado con bypass). Queda: purgar esas URLs y confirmar que la regla CF cubre todo `/panel*` + `/admin*`. No es un defecto del código — es configuración de edge del propietario.

## 14. Risks

- Títulos defectuosos ya publicados (contenido histórico — no recomiendo edición masiva por mandato; opcionalmente corregir los 3 detectados manualmente).
- `?secret=` endpoints legacy documentados.
- Campos internos visibles en payload serializado de artículos.

## 15. Observations

- El gate de defectos mecánicos nuevo ya cubre publicaciones futuras — los defectos son históricos.
- Ausencia de impresiones GSC = ausencia de dato, no evidencia de rechazo.

## 16. Final Conclusion

> **EXISTE UN BLOQUEO INTERNO CONCRETO ANTES DE SOLICITAR GOOGLE ADSENSE.**

**Qué**: Cloudflare sirve páginas administrativas autenticadas desde caché pública (3 rutas verificadas con `cf:HIT`).
**Dónde**: `/panel/centro-de-comando`, `/panel/nios/reparaciones`, `/panel/nios/google-intelligence`.
**Evidencia**: `GET` sin sesión → `200` con HTML admin real vs `307 /login` en origin.
**Por qué**: fuga de contenido administrativo — problema de seguridad activo en producción.
**Impacto**: el sitio público no se ve afectado para AdSense, pero no es aceptable operar (ni someter a revisión) un sitio que expone su panel.
**Corrección**: purga CF de `/panel*` + confirmar page-rule bypass. Una vez purgado, el bloqueo desaparece — el sitio público no tiene bloqueo interno propio detectado.

Esto no constituye garantía de aprobación por Google — la decisión final corresponde a Google.
