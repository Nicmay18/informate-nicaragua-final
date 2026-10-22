# AUDITORIA_ADSENSE.md — requisitos oficiales, hallazgos verificados y preparación

Fecha: 22-oct-2026 · Método: sondas HTTP a producción + inspección de código y corpus.
Fecha objetivo informada de nueva revisión: 29-oct-2026.

## 1. Verificado en producción (estado: VERIFICADO)

| Requisito | Estado | Evidencia |
|---|---|---|
| ads.txt publicado | VERIFICADO | `/ads.txt` 200 `text/plain`: `google.com, pub-4115203339551838, DIRECT, f08c47fec0942fa` |
| Client-ID AdSense en HTML entregado | VERIFICADO | `data-ad-client="ca-pub-4115203339551838"` ×3 en HTML de artículo; `pagead2.googlesyndication.com` en payload |
| CSP permite dominios de Google Ads | VERIFICADO | script-src/frame-src/connect-src incluyen googlesyndication, doubleclick, adtrafficquality, fundingchoices |
| Sitio rastreable | VERIFICADO | 784 URLs sondadas, 0 errores; robots.txt + 2 sitemaps activos |
| Páginas institucionales | VERIFICADO | /nosotros, /contacto, /publicidad, /politica-editorial, /aviso-legal, /privacidad, /mapa-del-sitio → 200 |
| Estructura de equipo real | VERIFICADO | JSON-LD Organization con 3 Person: Keyling Rivera (Dir. Editorial), Maycol Rivas (Dir. Técnico), José Luis López (Dir. Operaciones) — coincide con la estructura declarada |
| Etiqueta script adsbygoogle.js | PARCIAL | pub-id presente; el tag `<script src=…adsbygoogle.js?client=…>` no se confirmó textualmente en el HTML (probable carga client-side) |

## 2. Defectos que debilitan una evaluación (observados, no hipótesis)

1. **Contenido corrupto aún servido por caché** — Firestore está reparado (23+22 docs, verificado por lectura directa) pero producción sirve HTML cacheado con el eufemismo ("resulta afectado" en H1 de Diriomo, observado 22-oct). Requiere purga de caché Cloudflare o esperar TTL. **BLOQUEADO POR AUTORIZACIÓN.**
2. **Cifras sin evidencia en /publicidad** — "4.3 millones", "17,000 usuarios activos", "4,700 usuarios 7 días" publicados sin respaldo verificable. Corrección preparada en PR #10 (sin mergear). **PENDIENTE DE REVISIÓN.**
3. **Residuo de eufemismo** — ~50–60 ocurrencias en ~14 docs fuera del lote autorizado (`INCIDENTES_FACTUALES.md` §3). Aunque menor que el original, sigue siendo contenido factualmente corrupto publicado.
4. **3 artículos E** (párrafo repetido ×42) siguen publicados — decisión del propietario pendiente.
5. **Resumen truncado** de `tres-fallecidos` y garbles residuales ("el persona gravemente afectada") en docs fuera del lote.

## 3. Lo que ya está corregido y probado

- 29 artículos del eufemismo fase-1 + 2 rectificaciones + 22 artículos fase-2 (56 reemplazos, post-verificados por re-lectura) — en DB.
- Causa raíz eliminada: `panel.html` sin anti-palabras-sensibles ni fabricación (en rama, pendiente de deploy).
- MENI expuesto como medidor de formato, no de hechos.

## 4. Afirmaciones NO verificables / falsas comunes descartadas

- No existe "mínimo de palabras universal" de AdSense.
- La coincidencia autor/cuenta AdSense no es requisito oficial.
- No hay ventana de 48–72 h que determine aprobación.
- El estado real de la cuenta AdSense no es verificable sin acceso autorizado: **NO VERIFICADO**.

## 5. Evaluación de preparación

**INCONCLUSO, con tendencia favorable.** Sobre la base verificable:

- Cumplidos: ads.txt, pub-id en HTML, institucionales, equipo real, rastreabilidad, políticas publicadas.
- Bloqueantes pendientes: purga de caché para que las reparaciones sean visibles; residuo de eufemismo (lote 3); 3 artículos E; cifras sin evidencia en /publicidad (PR #10).
- La decisión de reenviar la solicitud es humana y debe esperar a que los bloqueantes se cierren con evidencia de producción.
