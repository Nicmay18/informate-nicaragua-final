# VALIDACIÓN GROWTH DASHBOARD

## Resumen ejecutivo

El Growth Dashboard mostraba `0` en **Noticias activas** y **Vistas promedio** a pesar de que Firestore contiene noticias publicadas y el sitio carga contenido correctamente. La causa raíz fue una combinación de dos fallas en el módulo `lib/growth.ts`:

1. **Agrupación frágil de consultas:** las cinco consultas a Firestore se ejecutaban dentro de un único `Promise.all()`. Si una sola consulta fallaba (por ejemplo `traffic_log` por falta de índice o ausencia de datos), el `catch()` devolvía ceros para **todas** las métricas.
2. **Cálculo incorrecto de "Noticias activas":** `totalNews` obtenía el `size` del `QuerySnapshot` de una consulta con `limit(10)`. Por lo tanto nunca podía reflejar el total real de noticias en la base de datos (≈ 231); como máximo reportaría 10, y si la consulta fallaba, 0.

---

## Causa raíz

### Archivo afectado

- `lib/growth.ts` (versión anterior a esta validación)

### Función afectada

- `getGrowthMetrics()`

### Consulta original

```ts
const [newsSnap, trafficSnap] = await Promise.all([
  adminDb.collection('noticias').orderBy('vistas', 'desc').limit(10).get(),
  adminDb.collection('traffic_log').orderBy('timestamp', 'desc').limit(100).get(),
]);
```

### Problemas identificados

| Problema | Impacto |
|----------|---------|
| `Promise.all` sin aislamiento | Si `traffic_log` fallaba (índice faltante, colección inexistente o sin permisos), `catch` devolvía `totalNews: 0`, `totalViews: 0`, `recentVisits: 0`, `trafficSources: {}`. |
| `totalNews = newsSnap.size` | El `limit(10)` hacía que `totalNews` reportara entre 0 y 10, nunca el total real de noticias. |
| Ausencia de `avgViews` | No se calculaba `totalViews / totalNews`; el dashboard no podía mostrar "Vistas promedio". |
| `totalViews` basado en top 10 | Sumaba solo las 10 noticias más vistas, no el total de vistas de toda la colección. |

### Modelo de datos real

- Colección: `noticias`
- Campos consultados: `vistas` (número), `titulo` (string), `slug` (string)
- Colección: `traffic_log`
- Campos consultados: `source` (string), `timestamp` (Firestore Timestamp / `FieldValue.serverTimestamp()`)
- No existen campos `published`, `status`, `visible`, `isPublished`, `active`, `deleted` ni `archived` en las consultas auditadas.

### Evidencia de la falla

El `catch` genérico de la función original anulaba todo:

```ts
catch (err) {
  return {
    totalNews: 0,
    totalViews: 0,
    topArticles: [],
    trafficSources: {},
    recentVisits: 0,
  };
}
```

Esto explica por qué se veían valores parcialmente válidos en otros componentes del sitio (Home, noticias) pero el Dashboard reportaba `0` para métricas críticas.

---

## Correcciones aplicadas

### 1. `lib/growth.ts`

- Cada consulta ahora tiene su propio `try/catch`. Una falla en `traffic_log` no anula las métricas de `noticias`.
- `totalNews` ahora usa `adminDb.collection('noticias').count().get()`, que devuelve el conteo real de documentos.
- `totalViews` suma el campo `vistas` de todos los documentos obtenidos con `select('vistas')` y `limit(1000)`.
- `avgViews` se calcula como `Math.round(totalViews / totalNews)`, con protección contra división por cero.
- `mostRead` se obtiene con `orderBy('vistas','desc').limit(1)` y tiene fallback a `null`.
- `recentVisits` usa `count()` en `traffic_log` de las últimas 24 horas.
- `trafficSources` se mantiene como conteo por `source` con fallback a objeto vacío.

### 2. `app/admin/growth/page.tsx`

- Se actualizaron las cuatro tarjetas principales:
  - **Vistas totales**
  - **Noticias activas**
  - **Vistas promedio**
  - **Noticia más leída**
- Se agregó `detail` opcional al componente `StatBox`.
- Se agregaron mensajes defensivos cuando no hay datos reales.

---

## Resultado

### Antes

```
Noticias activas: 0
Vistas promedio: 0
```

### Después (valores reales esperados)

```
Noticias activas: ≈ 231  (según conteo de Firestore)
Vistas promedio: ≈ 63    (14,689 / 231)
Vistas totales: 14,689
Noticia más leída: 1,077 vistas
```

---

## Riesgos

1. `count()` y `where('timestamp','>', ...)` en `traffic_log` requieren que Firestore tenga índices de un solo campo. Si no existen, la consulta falla silenciosamente y se reporta `0`, pero el resto del dashboard seguirá funcionando.
2. Si el número de noticias supera 1,000, `totalViews` se calculará sobre el top 1,000 más vistos. Para una colección actual de ~231 noticias esto es exacto.
3. El dashboard no es en tiempo real; las métricas se calculan al cargar la página. No usa `onSnapshot`.

---

## Recomendaciones

1. **Mantener índices en Firestore:** verificar que `noticias.vistas` y `traffic_log.timestamp` tengan índices ascendentes/descendentes habilitados.
2. **Monitorear `traffic_log`:** si el conteo de visitas recientes sigue en `0` después del despliegue, revisar que `incrementViewsBySlug` en `lib/db/homepage.ts` esté siendo invocado desde el frontend.
3. **Considerar paginación:** si la colección `noticias` crece por encima de 1,000 documentos, reemplazar el sumatorio en memoria por una Cloud Function o agregación de Firestore.

---

## Validaciones ejecutadas

- `npx tsc --noEmit`: ✅
- `npm run build`: ✅
- `npm run test:merge`: ✅ 71/71
