# Auditoría Forense de Crecimiento Google — Nicaragua Informate

**Fecha:** 2026-11-17 · **Fuente:** snapshots reales de NIOS en Firestore (`nios_daily_snapshots/2026-11-17`), que consultan las APIs oficiales de Google Search Console y GA4. Export local: `.audit/gsc-2026-11-17.json`.
**Ventana de datos:** 2026-11-10 → 2026-11-17 (7 días). No son datos inventados: son los valores que la integración NIOS recolectó de las APIs de Google.

---

## 1. Search Console — línea base real (7 días)

| Métrica | Valor |
|---|---|
| Impresiones | **16,868** |
| Clics | **345** |
| CTR promedio | **2.05%** |
| Posición media | **7.3** |
| Páginas con impresiones | 411 |
| Consultas distintas | 903 |

### Dispositivo (GSC)

| Dispositivo | Impresiones | Clics | CTR | Posición |
|---|---|---|---|---|
| Móvil | 13,891 (82%) | 280 | 2.02% | 7.1 |
| Desktop | 2,818 (17%) | 64 | 2.27% | 8.5 |
| Tablet | 127 | 1 | 0.79% | 6.7 |

**El sitio es ~82% móvil en búsqueda.** Toda optimización debe priorizar móvil.

### Países (GSC, top 10)

| País | Impresiones | Clics | CTR | Posición |
|---|---|---|---|---|
| Nicaragua (nic) | 12,267 (73%) | 226 | 1.84% | 7.3 |
| Costa Rica (cri) | 1,402 (8%) | 47 | **3.35%** | 7.5 |
| España (esp) | 969 (6%) | 26 | 2.68% | 7.3 |
| EE.UU. (usa) | 755 (4%) | 14 | 1.85% | 7.4 |
| Panamá (pan) | 201 | 5 | 2.49% | 6.8 |
| México (mex) | 186 | 2 | 1.08% | 7.3 |
| Honduras (hnd) | 118 | 8 | **6.78%** | 6.7 |
| Colombia (col) | 102 | 1 | 0.98% | 8.4 |
| Argentina (arg) | 96 | 2 | 2.08% | 7.1 |
| Guatemala (gtm) | 85 | 4 | 4.71% | 7.0 |

**Hallazgo clave:** el 27% de las impresiones viene de fuera de Nicaragua (diáspora + Centroamérica). Costa Rica y España tienen el mejor CTR — es el público de las guías de trámites/apostillas. Este es el nicho de crecimiento: **nicaragüenses en el exterior buscando documentos y trámites**.

## 2. Páginas — concentración extrema

| URL | Impresiones | Clics | CTR | Posición |
|---|---|---|---|---|
| `/guia/apostillar-documentos-nicaragua-2026` | **7,484 (44%)** | **198 (57%)** | 2.65% | 7.6 |
| `/guia/salario-minimo-nicaragua-2026` | 1,019 | 12 | **1.18%** | 7.5 |
| `/guia/anular-recurso-policial-nicaragua-2026` | 757 | 23 | 3.04% | 5.0 |
| `/noticias/como-sacar-y-apostillar-record-policial-de` | 696 | 13 | 1.87% | 6.6 |
| `/guia/costo-de-vida-nicaragua-2026` | 62 | **0** | 0% | 5.5 |
| `/guia/beisbol-nicaragua-2026...` | 60 | **0** | 0% | 6.5 |
| `/guia/gastronomia-nicaragua...` | 64 | **0** | 0% | 12.9 |
| `/guia/tramites-migratorios-...` | 20 | **0** | 0% | 7.1 |
| `/guia/dolar-a-cordoba-nicaragua-hoy-2026` | 11 | **0** | 0% | 6.2 |
| `/util` | 2 | 0 | 0% | 20.0 |

**Diagnóstico:** 3 guías generan ~9,260 de 16,868 impresiones (55%) y 233 de 345 clics (68%). Las demás 11 guías suman ~250 impresiones y **0 clics** — posicionan (pos 5-13) pero nadie hace clic. Eso es un problema de título/snippet, no de indexación.

## 3. Consultas — el nicho real

Las top consultas son abrumadoramente del cluster **citas/cancillería/apostilla**:

| Consulta | Impresiones | Clics | Posición |
|---|---|---|---|
| citas cancilleria nicaragua | 601 | 13 | 7.1 |
| citas.cancilleria.gob.nic | 307 | 14 | 9.1 |
| citas para apostillar en nicaragua | 273 | 6 | 6.6 |
| cancillería de nicaragua citas | 230 | 6 | 7.9 |
| https citas cancillería gob ni nicaragua | 229 | 7 | 8.5 |
| **citas minrex nicaragua** | **227** | **1** | 9.6 |
| cita para apostillar documentos | 185 | 3 | 6.3 |
| salario minimo nicaragua 2026 | 169 | 3 | 8.7 |
| citas cancilleria gob ni | 88 | 1 | 7.6 |
| link para sacar cita para apostillar | 100 | **0** | 8.7 |
| apostillar documentos en nicaragua | 98 | **0** | 8.1 |
| cancilleria de nicaragua cita en linea | 39 | **0** | 4.8 |
| minrex nicaragua citas | 53 | 1 | 10.3 |
| minrex nicaragua apostilla | 35 | 1 | 6.0 |

**Hallazgos:**
1. ~70% de las consultas giran en torno a **citas de la Cancillería/MINREX para apostillar**. La guía apostillar ya captura esto, pero las variantes "citas minrex" (227+53+35 ≈ 315 impresiones) tienen CTR ~0.4% — la página no dice explícitamente que MINREX = Cancillería para este trámite. **Corregido en este commit** (FAQ + párrafo de aclaración).
2. "link para sacar cita para apostillar" (100 imp, 0 clics, pos 8.7): intención de obtener el enlace directo. La guía lo tiene, pero el snippet no lo muestra. Mejora aplicada: description ahora menciona `citas.cancilleria.gob.ni` explícitamente.
3. "apostillar documentos en nicaragua" (98 imp, 0 clics, pos 8.1): consulta genérica muy competitiva; pos 8 con 0 clics indica snippet poco convincente frente a resultados oficiales.
4. "salario minimo nicaragua 2026" (169 imp, CTR ~1.2%, pos 8.7): la guía tiene los datos pero el título no responde "cuánto es". **Corregido**: seoTitle ahora dice "cuánto es por sector" y la description incluye el rango real C$6,188–C$13,848.

## 4. GA4 — tráfico real (7 días)

| Métrica | Valor |
|---|---|
| Usuarios | 220 |
| Sesiones | 286 |
| Pageviews | 436 |
| Engagement medio | 97.9 s |
| Engagement rate | 83.9% |

### Fuentes

| Fuente | Usuarios | Sesiones | Pageviews | Engagement |
|---|---|---|---|---|
| google | 92 | 122 | 178 | 84.4% |
| facebook | 83 | 93 | 107 | 86.0% |
| (direct) | 20 | 40 | 114 | 87.5% |
| bing | 12 | 16 | 18 | 81.3% |
| chatgpt.com | 8 | 9 | 9 | 66.7% |

**Google (32% usuarios) y Facebook (38%) son casi empatados.** El tráfico social ya es casi igual al orgánico en usuarios — pero Google tiene mejor pageviews/sesión en guías. ChatGPT ya envía 8 usuarios/semana (creciente, monitorear).

### Dispositivo GA4

| Dispositivo | Usuarios | Sesiones |
|---|---|---|
| mobile | **190 (86%)** | 226 |
| desktop | 25 | 52 |
| tablet | 5 | 8 |

Consistente con GSC: el sitio es un producto móvil.

## 5. Problemas ordenados por impacto

| # | Problema | Impacto estimado | Estado |
|---|---|---|---|
| P1 | 11 de 14 guías con 0 clics pese a pos 5-13 | ~250 imp/semana sin monetizar | En curso (CTR fixes) |
| P2 | Cluster "citas MINREX/cancillería" con CTR 0.4% | ~315 imp/semana, ~1-2 clics recuperables | Corregido en `lib/evergreen.ts` |
| P3 | Guías evergreen nuevas sin demanda demostrada (playas, béisbol, gastronomía) | Dividen autoridad, 0 clics | Priorizar solo con demanda |
| P4 | `/util` pos 20, 2 imp | Desindexación práctica | Evaluar consolidar o mejorar |
| P5 | Noticias con 150-220 imp y 0 clics (titulares débiles) | ~600 imp/semana | En `OPTIMIZACION_PAGINAS_EXISTENTES.md` |
| P6 | No hay página dedicada a "costo de vida" con demanda (solo 62 imp) | Potencial evergreen alto | Brief en `BRIEFS_10_CONTENIDOS.md` |
| P7 | AdSense: ingreso por página no segmentado | No se puede optimizar sin datos | Requiere vinculación GA4↔AdSense (propietario) |

## 6. Lo que NO se pudo verificar (acceso requerido)

- **Search Console → Indexación:** cuántas páginas indexadas/excluidas/pendientes. La API de NIOS solo trae performance, no el índice. → Propietario debe exportar de GSC → Indexación → Páginas.
- **AdSense:** ingresos, RPM, impresiones publicitarias por página. → Requiere vincular GA4↔AdSense y dar acceso a la propiedad `pub-4115203339551838`.
- **Core Web Vitals de usuarios reales (CrUX):** no hay campo en el snapshot. Lighthouse CI mide laboratorio (~90-95), no campo.
- **Vinculación GSC↔GA4:** verificar en ambas consolas que la propiedad `sc-domain:nicaraguainformate.com` esté asociada a la propiedad GA4 `525672447`.

## 7. Conclusión

El sitio **ya gana en Google** — 16.8k impresiones/semana con posición media 7.3 es una base real. El cuello de botella no es indexación ni autoridad inicial: es **CTR** (2.05% vs ~3-4% posible en posición 5-8) y **cobertura de intención** (solo 1 clúster — trámites/citas — funciona). La estrategia es: (a) recuperar clics de las páginas que ya aparecen, (b) construir clústeres nuevos alrededor de la diáspora (trámites, envío de dinero, TPS, dolar-córdoba), (c) medir semanalmente con el snapshot NIOS que ya existe.
