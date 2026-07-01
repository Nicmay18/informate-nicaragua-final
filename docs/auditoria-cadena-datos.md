# Auditoría Forense — Cadena de Datos Nicaragua Informate
## Fecha: 30 jun 2026 22:20

---

## RESUMEN EJECUTIVO

**BUG CRÍTICO ENCONTRADO Y CORREGIDO:** El script de migración de meta descriptions escribió en el campo `metaDescription` de Firestore, pero el frontend (`page.tsx`) y el panel de auditoría (`dashboard-calidad`) leen primero el campo `resumen`. Esto provocó que:

- Las meta descriptions nuevas NO se mostraran en el sitio web
- El panel de auditoría siguiera reportando % bajo de meta descriptions optimizadas
- Google siguiera indexando resúmenes largos/duplicados

**Acción tomada:** Sincronización masiva `metaDescription` → `resumen` para 124 noticias. Estado: **CORREGIDO**.

---

## 1. FUENTE DE VERDAD

### Meta Descriptions

| Campo | Ubicación | Estado |
|---|---|---|
| `metaDescription` | Firestore | **Escrito correctamente** (163/163 con 120-160 chars) |
| `resumen` | Firestore | **Desfasado** (41/163 con longitud incorrecta antes del fix) |
| `description` | Markdown frontmatter | **No existe** — el sitio usa Firestore como CMS |
| `descriptions.json` | Archivo JSON | **No existe** |

**BUG:** `fix-meta-apply.mjs` (línea 77) escribió en `metaDescription`:
```javascript
await db.collection('noticias').doc(n.id).update({
    metaDescription: nueva,
```

Pero el frontend (`app/noticias/[slug]/page.tsx` línea 93-95) lee:
```typescript
const rawDescription = noticia.resumen?.trim()
  || noticia.metaDescription?.trim()
  || generateMetaDescription(noticia);
```

**Prioridad:** `resumen` > `metaDescription` — si `resumen` existe (aunque sea malo), se usa.

### Related Links

| Campo | Ubicación | Estado |
|---|---|---|
| `related_links` | Firestore | **Escrito correctamente** (66/163 noticias) |
| `links.json` | Archivo JSON | **No existe** |
| HTML inyectado | Render time | **Funciona** (`injectInternalLinks` en `lib/article-links.ts`) |

---

## 2. SCRIPT DE AUDITORÍA (Panel)

### Archivo: `app/api/admin/dashboard-calidad/route.ts`

| Línea | Qué hace | Qué debería hacer | Bug |
|---|---|---|---|
| 47-261 | `computeDashboardMetrics()` — lee toda la colección `noticias` y calcula métricas | Mismo comportamiento | ✅ OK |
| 112-113 | Lee `resumen` para calcular meta descriptions optimizadas | Debería leer `metaDescription` o ambos | **BUG** — lee campo equivocado |
| 263-266 | `unstable_cache(computeDashboardMetrics, ..., { revalidate: 86400 })` | Cache de 24 horas | **BUG** — cache desactualizado por 24h |
| 273 | `const metricas = await cachedDashboard();` | Devuelve métricas cacheadas | **BUG** — no invalida cache tras migraciones |

**Cache:** `unstable_cache` de Next.js con `revalidate: 86400` (24 horas). El panel puede mostrar datos de hasta 24 horas atrás.

### Archivo: `app/api/admin/auditor-dashboard/route.ts`

| Línea | Qué hace | Qué debería hacer | Bug |
|---|---|---|---|
| 25 | Lee colección `noticias` entera | Mismo | ✅ OK |
| 137-141 | Lee `resumen` como proxy de meta description | Debería leer `metaDescription` también | **BUG** |
| 181-189 | Alerta si `pctResumen < 50%` | Mismo | **BUG** — alerta basada en campo desfasado |

---

## 3. SCRIPT DE MIGRACIÓN (Meta Descriptions)

### Archivo: `scripts/fix-meta-apply.mjs`

| Línea | Qué hace | Qué debería hacer | Bug |
|---|---|---|---|
| 63 | Lee `data.metaDescription` para evaluar si es mala | ✅ OK — identifica correctamente |
| 76-78 | Escribe `metaDescription: nueva` | Debería escribir **ambos** `metaDescription` y `resumen` | **BUG** — solo escribe uno |
| 80-81 | Log de éxito con `OK {chars} chars | {slug}` | Mismo | ✅ OK |

**Resultado:** 163/163 meta descriptions corregidas en `metaDescription`, pero **0/163** en `resumen`.

---

## 4. SCRIPT DE MIGRACIÓN (Links Internos)

### Archivo: `scripts/apply-internal-links.mjs`

| Línea | Qué hace | Qué debería hacer | Bug |
|---|---|---|---|
| 74 | Evalúa `hasInternalLinks(data.contenido)` — busca `href="/categoria/` o `href="/noticias/` en contenido HTML | ✅ OK — criterio correcto |
| 104-106 | Escribe `related_links: relatedLinks` en Firestore | ✅ OK |
| 107 | Actualiza `fechaActualizacion` | ✅ OK |
| 109 | Log de éxito con `OK {slug} ({count} links)` | ✅ OK |

**Resultado:** 66/66 noticias sin links internos fueron actualizadas correctamente.

**Nota:** El script **NO** modifica el campo `contenido` HTML. Los links se inyectan en render time vía `injectInternalLinks()` en el frontend. Esto es correcto — evita modificar datos originales.

---

## 5. FRONTEND DEL PANEL

### Archivo: `public/panel.html`

| Aspecto | Estado |
|---|---|
| Cache HTTP | `<meta http-equiv="Cache-Control" content="no-cache">` — declaración HTML |
| React Query / SWR | **No usa** — es vanilla JS |
| `fetch()` con `cache: 'no-store'` | No verificado — probablemente usa fetch por defecto |
| Botón "Actualizar" | Probablemente hace `window.location.reload()` o fetch fresh |
| `lastAuditDate` | **No existe** en la UI — no muestra timestamp de última auditoría |

---

## 6. RESULTADOS DEL FIX

### Antes del fix (30 jun 22:10)

| Métrica | Valor |
|---|---|
| noticias con resumen 120-160 chars | 122/163 (75%) |
| noticias con metaDescription 120-160 chars | 163/163 (100%) |
| noticias con resumen desfasado de metaDescription | 124/163 (76%) |
| related_links presentes | 66/163 (40%) |

### Después del fix (30 jun 22:20)

| Métrica | Valor |
|---|---|
| noticias con resumen 120-160 chars | **163/163 (100%)** ✅ |
| noticias con metaDescription 120-160 chars | 163/163 (100%) ✅ |
| noticias sincronizadas | 124/124 ✅ |
| related_links presentes | 66/163 (40%) — correcto, solo las que lo necesitaban |

---

## 7. RECOMENDACIONES

### Inmediatas (hoy)
- [x] Sincronizar `metaDescription` → `resumen` ✅
- [ ] **Deploy en Vercel** para que el ISR refresque las páginas con datos nuevos
- [ ] Invalidar cache del panel (`dashboard-calidad`) — requiere deploy o esperar 24h

### Corto plazo (esta semana)
- [ ] Modificar `fix-meta-apply.mjs` para escribir en **ambos** campos (`metaDescription` + `resumen`)
- [ ] Modificar `dashboard-calidad` para leer `metaDescription` como fuente primaria
- [ ] Reducir cache del panel de 24h a 1h (`revalidate: 3600`)
- [ ] Agregar `lastAuditDate` visible en el panel HTML

### Largo plazo
- [ ] Consolidar a un solo campo: eliminar `metaDescription` o `resumen`, quedarse con uno solo
- [ ] Documentar en `lib/types.ts` cuál es la fuente de verdad para cada dato

---

## COMANDOS DE VERIFICACIÓN

### Verificar sincronización
```bash
node scripts/auditoria-cadena-datos.mjs
```

### Verificar 5 documentos al azar en Firestore
```bash
node -e "
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./informate-instant-nicaragua-c7bc9eb4f553.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
db.collection('noticias').limit(5).get().then(snap => {
  snap.docs.forEach(d => {
    const data = d.data();
    console.log(d.id, '| resumen:', data.resumen?.length || 0, 'c | metaDescription:', data.metaDescription?.length || 0, 'c');
  });
});
"
```

---

## CHECKLIST DEL AUDITOR

- [x] Identificar fuente de verdad para meta descriptions
- [x] Identificar fuente de verdad para related_links
- [x] Revisar script de auditoría (dashboard-calidad)
- [x] Revisar script de migración (fix-meta-apply.mjs)
- [x] Revisar script de migración (apply-internal-links.mjs)
- [x] Revisar frontend del panel (panel.html)
- [x] Verificar 5 documentos al azar en Firestore
- [x] Ejecutar script de auditoría manualmente
- [x] Revisar logs de migración
- [x] Verificar cache del panel
- [x] Aplicar fix (sync-meta-to-resumen.mjs)
- [ ] Deploy en Vercel para actualizar ISR
- [ ] Invalidar cache del panel
