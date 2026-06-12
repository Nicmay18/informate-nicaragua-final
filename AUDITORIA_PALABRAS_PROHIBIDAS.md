# AUDITORÍA FORENSE — PALABRAS PROHIBIDAS (206 NOTICIAS)
**Fecha:** 12 de junio de 2026  
**Scope:** Títulos + metaDescription + lead del contenido  
**Policy:** Google News Quality Rater 2026 + AdSense Compliance

---

## RESUMEN EJECUTIVO

| Métrica | Valor |
|---------|-------|
| Total noticias analizadas | 206 |
| Documentos con hallazgos | 12 |
| Hallazgos totales | 13 |
| 🔴 **CRÍTICO** | 8 |
| 🟠 **ALTO** | 2 |
| 🟡 **MEDIO** | 3 |

**Tasa de cumplimiento:** 94.2% (194/206 limpias)  
**Documentos que requieren acción inmediata:** 12

---

## 🔴 CRÍTICO — SENSACIONALISMO PENALIZABLE (8)

Google News marca directamente como **clickbait** o **thin content**. AdSense puede limitar monetización.

| # | Documento | Campo | Palabra | Contexto | Corrección sugerida |
|---|-----------|-------|---------|----------|---------------------|
| 1 | `CeqPObdh...` — Trabajador fallece electrocutado... | metaDescription | **tragedia** | "Una tragedia laboral ha enlutado..." | "Un incidente laboral con resultado fatal ocurrió en..." |
| 2 | `XMFnv7gC...` — Minsa reporta tercer caso... | metaDescription | **tragedia** | "...tragedia familiar más dolorosa..." | "...situación que afecta a la familia de la víctima..." |
| 3 | `UQfMofCd...` — Policía investiga incidente... | metaDescription | **tragedia** | "...profunda tragedia para dos familias..." | "...hecho que afecta a dos familias nicaragüenses..." |
| 4 | `XKRkS7Qq...` — Policía investiga hallazgo... | metaDescription | **tragedia** | "Una profunda tragedia ha dejado bajo luto..." | "Un hecho violento ha causado conmoción en..." |
| 5 | `XKRkS7Qq...` — Policía investiga hallazgo... | metaDescription | **impactante** | "...tras el impactante hallazgo del cuerpo..." | "...tras el hallazgo del cuerpo sin vida en..." |
| 6 | `4rdCg3m1...` — Managua: Ciudadano hondureño... | metaDescription | **tragedia** | "...nueva tragedia vial a sus estadíst..." | "...nuevo incidente de tránsito en la capital..." |
| 7 | `8ePAwlFz...` — Autoridades investigan incidente... | metaDescription | **tragedia** | "...terminó en tragedia la mañana de este s..." | "...ocurrió en horas de la mañana en..." |
| 8 | `nBDHAoiC...` — Investigan delito grave... | metaDescription | **horror** | "Una mañana de horror vivió la comunidad..." | "La comunidad reaccionó con conmoción tras..." |

---

## 🟠 ALTO — CLICKBAIT / FALSO SENTIDO DE URGENCIA (2)

Google Discover ignora este tipo de framing. Reduce alcance orgánico.

| # | Documento | Campo | Palabra | Contexto | Corrección sugerida |
|---|-----------|-------|---------|----------|---------------------|
| 9 | `1PRR0VQR...` — Tornado deja 10 heridos... | metaDescription | **alerta** | "...situación de máxima alerta tras el paso..." | "...autoridades evalúan daños tras el paso..." |
| 10 | `o0Hd8UJZ...` — Ébola avanza en Congo... | metaDescription | **alerta** | "OMS alerta por expansión del é..." | "OMS advierte sobre expansión del é..." |

---

## 🟡 MEDIO — TÍTULOS TRUNCADOS (3)

Puntos suspensivos en título = contenido incompleto. Google News descarta.

| # | Documento | Campo | Palabra | Título actual | Corrección sugerida |
|---|-----------|-------|---------|---------------|---------------------|
| 11 | `LJTrq7D8...` — Hallan a agricultor... | título | **...** | "Hallan a agricultor persona fallecida a balazos en El Jícaro;..." | "Hallan a agricultor fallecido a balazos en El Jícaro, Nueva Segovia" |
| 12 | `RCjqgw3e...` — Tres personas fallecen... | título | **...** | "Tres personas fallecen en accidentes de motocicleta en Rivas y..." | "Tres personas fallecen en accidentes de motocicleta en Rivas y Managua" |
| 13 | `Bd0FR40B...` — OpenAI mantiene alianza... | título | **...** | "OpenAI mantiene alianza con Apple para integrar ChatGPT en..." | "OpenAI mantiene alianza con Apple para integrar ChatGPT en iOS" |

---

## REGLAS APLICADAS

| Categoría | Regla | Penalización |
|-----------|-------|-------------|
| **tragedia** | Sensacionalismo emocional. Google News lo marca como clickbait. | Deindexación de Discover |
| **horror** | Lenguaje visceral. Violación de AdSense Policy (contenido gráfico). | Limitación de anuncios |
| **impactante** | Clickbait genérico sin valor factual. Core Algorithm lo ignora. | Baja de posición en SERP |
| **alerta** | Falso sentido de peligro. Abusado por spam. | Penalización en Discover |
| **...** | Título truncado. Google News requiere títulos completos. | No indexación en News |

---

## ARCHIVOS GENERADOS

| Archivo | Contenido |
|---------|-----------|
| `auditoria-palabras-prohibidas-v2.json` | JSON completo con todos los hallazgos |
| `AUDITORIA_PALABRAS_PROHIBIDAS.md` | Este reporte ejecutivo |

---

## PRÓXIMO PASO

Ejecutar script de corrección automática para limpiar las 12 noticias afectadas.
