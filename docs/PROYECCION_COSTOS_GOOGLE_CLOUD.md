# Proyección de Costos Google Cloud — Nicaragua Informate

Base: facturación real 1–19 nov 2026 (US$40.48) + mediciones del corpus en producción + modelo de consumo por ruta. **Proyecciones, no promesas** — validar contra la factura del próximo ciclo.

## 1. Línea base (19 días → mensualizado)

| Concepto | 19 días | Proyección mensual |
|---|---|---|
| Read Ops | 33,581,497 → ~53M/mes | US$19.58 → **~US$31** |
| Data Transfer Out | 171.37 GiB → ~270 GiB/mes | US$19.36 → **~US$30** |
| Backups + PITR + Storage | ~US$1.55 | ~US$2.5 |
| **Total Firestore** | US$40.48 | **~US$63** |

## 2. Atribución estimada del consumo (ANTES de optimizar)

| Proceso | % reads estimado | % egress estimado | Evidencia |
|---|---|---|---|
| Regeneración de caches públicas (portada 60 s, listas, categorías) | ~75–85% | ~70–80% | `revalidate: 60` + `contenido` en LIST_FIELDS + triple query |
| Páginas de artículo (ISR + server actions por pageview) | ~10–15% | ~10–15% | `getNewsBySlug` doc completo + `getArticleMetricsAction` doc completo |
| NIOS/departamento/admin/crons | ~5–10% | ~5–10% | Cotas diarias verificadas |

*Costos "comprobados": la factura. Atribución por proceso: estimación por modelo de código — no hay desglose por función en el panel de billing; los porcentajes son la mejor aproximación disponible.*

## 3. Proyección DESPUÉS de `audit/costos-firestore`

Supuestos: tráfico de crawlers similar; invalidaciones por publicación (~20–40/día) siguen forzando regeneraciones frescas (correcto y deseado); TTLs solo acotan la deriva entre publicaciones.

| Métrica | Antes/día | Después/día (est.) | Basis |
|---|---|---|---|
| Read Ops | ~1,770,000 | **~350,000–550,000** | Pool único (~500 reads × ~300 regens) + categorías/relacionadas a 900 s + página artículo ~1–2 reads × crawls |
| Transferencia | ~9.0 GiB | **~2.5–3.5 GiB** | −85% bytes en listados; detalle de artículo y feeds sin cambio |
| Writes | <10K | <10K | sin cambio |

| Concepto | Proyección mensual |
|---|---|
| Read Ops ~450K/día ≈ 13.5M/mes | **~US$8** |
| Transferencia ~3 GiB/día ≈ 90 GiB/mes | **~US$10** |
| Backups + PITR + Storage | ~US$2.5 (sin cambios — decisión pendiente) |
| **Total Firestore** | **~US$20–25/mes** |

**Ahorro estimado: ~US$38–44/mes (~65–70%)** vs. la proyección de US$63.97.

## 4. ¿Se puede llegar a US$1–5/mes?

**Honestamente: no con la arquitectura actual.** El piso lo imponen:

- ~730 artículos indexables que Google/bing/crawlers sociales leen y recrawlean a diario — cada render ISR genera lecturas Firestore inevitables mientras el contenido viva en Firestore.
- ~90–150K pageviews/mes estimadas (GSC+GA4) × ~2–4 lecturas de detalle.
- Firestore cobra por documento aún con `select()`.

Escenarios que sí acercarían a US$5–10/mes (decisión de arquitectura, no de optimización):

1. **Migración de `fecha` a Timestamp** (Fase 2, ítem 1): −~60% de lecturas en listados → reads ~150–250K/día.
2. **ISR más agresivo en artículos** (revalidate 3600+ o `dynamicParams` controlado): los crawlers recrawlean pero la página se sirve de caché CDN/edge — las lecturas solo ocurren en regeneración, no por request. Ya está en 300 s; subir a 900–3600 s reduce misses.
3. **Shingles persistidos para duplicados** (Fase 2, ítem 2).
4. **Evaluar Firebase Hosting + CDN para estáticos** ya cubierto por Vercel.

## 5. Proyecciones de monitoreo

| Métrica | Frecuencia | Alerta |
|---|---|---|
| Reads/día (estimado por rutas cacheadas) | semanal | >500K/día sostenido |
| Transferencia/día | semanal | >3.5 GiB/día |
| Regeneraciones ISR/hora por ruta | bajo demanda | pico anómalo |
| `traffic_log` writes/día | semanal | >3× baseline (posible abuso de tracking) |
| Backups storage (consola) | mensual | crecimiento >10%/mes sin explicación |

Implementación sugerida: registrar conteos estimados en `nios_daily_snapshots` (un doc/día, costo despreciable) + presupuesto de billing en consola con alertas 50/90/100%.

## 6. Riesgos residuales

- **`revalidateTag('noticias')` en cada publicación** invalida todo el árbol público — correcto, pero si el volumen de publicaciones creciera mucho (p.ej. >200/día) las regeneraciones escalarían linealmente. Mitigación futura: invalidación granular por categoría/slug.
- **ISR por región**: el Data Cache es global, pero el shell ISR se regenera por PoP — ya mitigado porque los datos vienen del Data Cache.
- **`fecha` tipo mixto**: sigue siendo la causa estructural del triple-read; la migración (Fase 2) es la optimización de mayor impacto pendiente.
