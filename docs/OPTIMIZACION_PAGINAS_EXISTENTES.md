# Optimización de Páginas Existentes — Acciones Ejecutadas y Pendientes

**Principio aplicado:** mejorar primero las URLs que ya tienen impresiones. Es más barato subir la posición 8→5 de una página con 1,000 impresiones que posicionar una página nueva desde cero.

---

## EJECUTADO en este commit (`lib/evergreen.ts`)

### 1. `/guia/apostillar-documentos-nicaragua-2026` — la página que sostiene el sitio

**Datos:** 7,484 imp/semana (44% del total), 198 clics, CTR 2.65%, pos 7.6.

**Cambios:**
- `seoTitle`: `Cómo apostillar documentos en Nicaragua: citas 2026` → `Cómo apostillar documentos en Nicaragua: guía de citas 2026` (más descriptivo para SERP).
- `description`: ahora incluye el dato que el usuario busca — `citas.cancilleria.gob.ni` literal, espera real de 2-4 meses, tabla de costos. Antes era genérica ("requisitos, pasos, costos, tiempos y dónde...").
- **Nuevo párrafo** aclarando que `citas MINREX` = `citas Cancillería` = mismo portal `citas.cancilleria.gob.ni`. Justificación: ~315 impresiones/semana en variantes "minrex" con CTR 0.4% — la página no decía explícitamente que respondía esa búsqueda.
- **2 FAQs nuevas:** "¿La cita de MINREX es la misma que la de la Cancillería?" y "¿Dónde saco la cita para apostillar documentos?" — ambas responden consultas con 100-227 impresiones semanales.
- `updatedDate` → 2026-11-17 (cambio de contenido real, no cosmético).

### 2. `/guia/salario-minimo-nicaragua-2026`

**Datos:** 1,019 imp/semana, solo 12 clics, **CTR 1.18%** (mitad del promedio del sitio), pos 7.5. La consulta madre "salario minimo nicaragua 2026" tiene 169 imp con CTR ~1.2% — el snippet no convence.

**Cambios:**
- `seoTitle`: `...tabla por sector` → `...cuánto es por sector` — responde la pregunta directa de la consulta.
- `description`: ahora incluye el rango real verificado **C$6,188–C$13,848** (de la tabla oficial ya en la página) + vigencia mar 2026–feb 2027. Antes era lista de sectores sin cifras.
- `updatedDate` → 2026-11-17.

### 3. `/guia/anular-recurso-policial-nicaragua-2026` — sin cambios necesarios

**Datos:** 757 imp, 23 clics, **CTR 3.04%** (el mejor de las guías), pos 5.0. Ya optimizada. Solo monitorear: la query "certificado de conducta precio" podría beneficiarse de mencionar C$80 en la description — evaluar en siguiente ciclo si el CTR baja.

---

## PENDIENTE — requiere decisión del propietario (datos en Firestore, no en código)

Las noticias con impresiones y 0 clics son documentos en Firestore (`noticias`), no archivos del repo. Cambiar sus `titulo`/`metaDescription` es **modificar datos de producción** → requiere autorización. Lista priorizada:

| URL | Imp | Clics | Pos | Problema probable del titular |
|---|---|---|---|---|
| `/noticias/el-indio-viejo-historia-del-plato-tipico-de` | 219 | 0 | 5.7 | Titular tipo ensayo, no noticia — no dice qué pasó |
| `/noticias/don-omar-el-rey-del-regueton-confirma-concierto-en-managua` | 206 | 0 | 7.2 | Pos 7 con 0 clics = snippet poco atractivo (concierto ya pasó?) |
| `/noticias/yoltamal-el-tamal-de-maiz-tierno-que-identifica-a-nicaragua` | 182 | 0 | 7.0 | Mismo patrón: contenido cultural sin gancho de actualidad |
| `/noticias/inss-que-familiares-tienen-cobertura-por-fallecimiento` | 354 | 1 | 6.0 | CTR 0.28% — título no responde "cuánto/cómo cobrar" |
| `/noticias/cosa-de-horno-...` | 179 | 1 | 4.2 | Pos 4.2 con CTR 0.56% — Google muestra sitelinks/otros resultados arriba |
| `/noticias/setec-abre-prematricula-universitaria-2027` | 108 | 0 | 9.1 | Pos 9 — mejorar posición, no solo título |
| `/noticias/kfc-nicaragua-2026-apertura-en-managua-menu` | 147 | 0 | 4.3 | Pos 4.3, 0 clics — competimos con KFC oficial; titular debe diferenciarse |
| `/noticias/maltrato-animal-en-nicaragua-que-dice-la-ley` | 81 | 0 | 6.2 | Título largo; acortar + beneficio claro |

**Acción propuesta (con autorización):** reescribir `titulo` + `metaDescription` de estas 8 noticias en Firestore vía un script auditado, sin tocar `slug` ni `contenido`. Cada cambio queda en `mutationLog` por `applyTechnicalMutation`.

---

## Páginas con 0 clics a evaluar (posicionan pero no atraen)

| URL | Imp | Pos | Diagnóstico |
|---|---|---|---|
| `/guia/costo-de-vida-nicaragua-2026` | 62 | 5.5 | Posición excelente, 0 clics → el título "Costo de vida en Nicaragua 2026: presupuesto mensual..." es largo y no promete cifra. Propuesta: incluir "cuánto cuesta vivir" + rango en description. |
| `/guia/beisbol-nicaragua-2026...` | 60 | 6.5 | Deporteevergreen sin actualidad — considerar si justifica mantenimiento. |
| `/guia/gastronomia-nicaragua...` | 64 | 12.9 | Pos 12.9 = página 2, casi invisible. Necesita enlaces internos desde noticias de comida/turismo. |
| `/guia/dolar-a-cordoba...` | 11 | 6.2 | Pos 6 pero 11 imp = Google no la muestra para "dolar a cordoba hoy" (la intent es datos en vivo). Sin datos vivos, no posicionará. Ver Brief #9. |
| `/util` | 2 | 20 | Prácticamente fuera del índice. Evaluar: ¿tiene valor único? Si no, consolidar contenido en `/guia` o `/nosotros`. |

---

## Enlaces internos — estado actual

- Las guías ya tienen "Guías relacionadas" automáticas (misma categoría primero) y breadcrumb JSON-LD.
- **Brecha:** las noticias populares (apostillar-record-policial con 696 imp) no enlazan sistemáticamente a la guía `/guia/apostillar-documentos` — son el puente natural noticia→evergreen. Propuesta: en el artículo, cuando el contenido mencione "apostilla/cancillería", inyectar enlace a la guía (regla editorial, no automática masiva).
- `/guia` (índice) tiene solo 2 imp en GSC — casi nadie llega por la página índice; el tráfico entra directo a cada guía. Considerar enlazar `/guia` desde el footer/home para reforzar crawl.

## Canonical, robots, sitemap — verificado previamente

- Sitemap.xml, news-sitemap.xml, robots.txt: 200 OK en producción.
- Canonical correcto en artículos y guías (verificado en Ciclo 3).
- JSON-LD: Article + FAQPage + BreadcrumbList en guías; NewsArticle + Breadcrumb + Organization + WebSite en noticias.
