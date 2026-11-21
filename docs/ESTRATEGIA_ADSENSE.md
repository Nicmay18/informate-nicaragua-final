# Estrategia AdSense — Auditoría y Experimentos

**Estado verificado en producción (Ciclo 3/6 previos):**
- `ads.txt` con `pub-4115203339551838` → 200 OK.
- Loader de AdSense post-load, Consent Mode v2, exclusión de contenido sensible, rutas públicas en allowlist.
- 3 slots manuales + Auto Ads en artículos; 1 unidad en guías (`slot 4492386174`, format auto).
- Site Approve: AdSense ya aprobado y generando primeros ingresos (confirmado por el propietario).

**Lo que NO se pudo verificar sin acceso a la cuenta:**
- Ingresos reales, RPM, impresiones publicitarias por página.
- Qué formatos de Auto Ads están activos (anchor, vignette, multiplex) — se configuran en la consola de AdSense, no en el código.
- Si GA4 está vinculado a AdSense (reporte de ingresos por página).

---

## Diagnóstico: dónde está el dinero hoy

Con los datos de tráfico reales:

| Superficie | Impresiones Google/sem | Pageviews GA4/sem | Potencial RPM |
|---|---|---|---|
| `/guia/apostillar...` | 7,484 | ~parte de 178 PV google | **MUY ALTO** — audiencia de trámites, alta intención, usuarios de CR/ES/USA con RPM de diáspora |
| `/guia/salario-minimo...` | 1,019 | bajo | Alto — queries laborales |
| `/guia/anular-recurso...` | 757 | bajo | Alto — trámites policiales |
| Noticias de sucesos/nacionales | ~9,000 combinado | ~260 PV | Medio — audiencia local, RPM Nicaragua más bajo |
| Resto de guías | ~250 | mínimo | Sin monetizar aún |

**Conclusión estratégica:** el RPM más alto del sitio probablemente viene de la **diáspora** (Costa Rica, España, EE.UU. — 27% de impresiones, mejor CTR). Los anuncios que ven esos usuarios pagan más que los de tráfico 100% local. Por eso las guías de trámites son el activo publicitario principal, no las noticias.

## Auditoría de implementación (código, verificado)

| Elemento | Estado | Evidencia |
|---|---|---|
| Script AdSense global | ✅ Una sola carga, post-load | `layout.tsx` + loader diferido |
| ads.txt | ✅ `pub-4115203339551838` | 200 OK en producción |
| Consent Mode v2 | ✅ Banner + consent | Integrado con GA4 |
| Duplicación de script | ✅ No hay | Un solo loader |
| Exclusión contenido sensible | ✅ Rutas bloqueadas | `adsense-safety` tests |
| Anuncios en guías | ✅ 1 unidad auto al final | `/guia/[slug]` |
| CLS por anuncios | ⚠️ Revisar | Unidades `format="auto"` pueden reservar espacio variable |
| Ingreso por página | ❌ Sin datos | Requiere vinculación GA4↔AdSense |

## Experimentos propuestos (controlados, con medición)

### Experimento 1 — Densidad en guías (semana 1-2)
- **Hipótesis:** las guías tienen solo 1 unidad AdSense. Añadir una segunda unidad `in-article` a mitad del contenido puede subir ingresos sin dañar UX (son páginas largas de utilidad).
- **Método:** activar en 2 guías (apostillar + salario-minimo), mantener el resto como control. Medir RPM y engagement 14 días.
- **Riesgo:** CLS si la unidad no reserva espacio. Mitigación: `minHeight` + `format="auto"` responsive.
- **No hacer:** más de 2 unidades por guía, ni interstitials/vignettes en páginas de trámites (experiencia de usuario + políticas).

### Experimento 2 — Anchor ads en noticias (evaluar, no activar aún)
- **Hipótesis:** el 82% del tráfico es móvil; anchor ads (barra inferior) pueden monetizar mejor en noticias de sucesos.
- **Pero:** ya hay "elementos fijos inferiores" que el propietario identificó — verificar primero si son Auto Ads anchor o componentes propios. Si son anchor de AdSense, midan su RPM antes de tocar.
- **Decisión:** esperar datos de AdSense (impressions por formato) antes de cambiar nada.

### Experimento 3 — Vinculación GA4↔AdSense (acción del propietario)
- **Por qué es crítico:** sin esto no sabemos qué páginas ganan. La guía apostillar probablemente genera la mayoría del ingreso pero no podemos probarlo.
- **Acción:** en AdSense → Herramientas → Vinculación de productos → vincular con la propiedad GA4 `525672447`. 5 minutos, habilita el reporte "Ingresos por página".

## Lo que NO hacer

- ❌ Activar Anchor/Vignette/Multiplex masivamente "para ver si sube" — puede dañar Core Web Vitals (el 82% es móvil) y la experiencia.
- ❌ Poner más de ~3 unidades por página de artículo.
- ❌ Anuncios en `/login`, `/panel`, `/admin` (ya excluidos).
- ❌ Header bidding / Ezoic — requiere tráfico y compatibilidad que no están verificados; cambiar de ad server ahora es prematuro y arriesgado.
- ❌ Llenar páginas thin de anuncios — las guías con 0 clics no son superficie publicitaria hasta que tengan tráfico.

## Métricas a seguir semanalmente (una vez vinculada la cuenta)

| Métrica | Fuente | Objetivo |
|---|---|---|
| Ingresos estimados/semana | AdSense | Línea base primero, luego +20%/mes |
| RPM por página | AdSense↔GA4 | Identificar top 5 páginas por RPM |
| Impresiones publicitarias/página | AdSense | Correlacionar con pageviews GA4 |
| Viewability | AdSense | >50% es saludable |
| Core Web Vitals con ads | Lighthouse/CrUX | LCP <2.5s, CLS <0.1, INP <200ms |

## Meta US$100/mes — análisis honesto

Con ~1,700 pageviews/semana (436×4 aprox.) y RPM típico de sitio de noticias en Nicaragua (~US$1-3 por 1,000 PV para audiencia local; US$5-15 para diáspora de alto CPM), el ingreso actual probablemente está en el rango de **US$2-15/mes**, no US$100.

Para llegar a US$100/mes se necesita una de estas (o combinación):
- **~20,000-50,000 pageviews/mes** a RPM US$2-5 (crecimiento de tráfico 10-30×), o
- **~5,000-10,000 pageviews/mes** muy concentradas en páginas de diáspora de alto RPM (trámites, TPS, envío de dinero) a RPM US$10-20.

La segunda ruta es más realista para este nicho: los trámites/documentos para nicaragüenses en el extranjero tienen CPM publicitario alto porque los anunciantes (abogados migratorios, remesadoras, servicios consulares, educación) pagan más por esa audiencia. **La estrategia SEO de este plan está deliberadamente orientada a ese clúster.**

No se puede declarar progreso hacia US$100 sin el dashboard real de AdSense — pendiente de vinculación por el propietario.
