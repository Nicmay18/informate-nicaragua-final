# Calendario editorial — 90 días (borrador de trabajo)

Objetivo: crecer tráfico orgánico de cola larga (hispanos en EE.UU. +
Nicaragua) sin sacrificar calidad. Meta AdSense US$100/mes es **proyección**,
no está cumplida — se mide con el dashboard de AdSense real.

Reglas duras:
- Nada se publica sin fuentes verificables y fecha de actualización real.
- Nada de asesoría legal/financiera sin disclaimer y fuentes oficiales.
- Cada guía: intención de búsqueda clara, keyword de cola larga, H1
  coherente, enlaces internos, imagen con alt, JSON-LD correcto.
- Máx. 3 piezas/día: 1 noticia del día + 1 guía/evergreen + 1 actualización
  de datos (tipo "dólar a córdoba hoy", TPS, clima).

## Inventario real de guías existentes (`lib/evergreen.ts`)

Ya publicadas: apostillar documentos, anular recurso policial, turismo,
béisbol, trámites migratorios CR/EEUU/ES, salario mínimo, costo de vida,
playas, dólar→córdoba hoy, gastronomía, turismo ecológico, economía 2026.

## Páginas pilar prioritarias (colas largas de mayor valor)

| Pilar | Keyword principal | Estado |
|---|---|---|
| Enviar dinero a Nicaragua | "enviar dinero a nicaragua desde estados unidos" | GUÍA NUEVA — comparar servicios (remesas, costos, tiempos). Solo datos verificables con fecha. |
| TPS y situación migratoria | "TPS nicaragua 2026" / "estatus migratorio nicaragüenses" | GUÍA NUEVA — solo fuentes oficiales (USCIS/Department of State), fecha de consulta visible, disclaimer legal. |
| Dólar a córdoba hoy | "dólar a córdoba hoy" | YA EXISTE (`dolar-a-cordoba-nicaragua-hoy-2026`) — mantener actualización diaria desde fuente verificable. |
| DACA e inmigración hispanos | "DACA requisitos 2026" | GUÍA NUEVA — fuentes oficiales, disclaimer. |
| Huracanes y preparación | "temporada huracanes pacífico 2026 nicaragua" | GUÍA NUEVA — SINAPRED/INETER como fuentes. |
| Bancos y servicios financieros | "mejores cuentas para nicaragüenses en eeuu" | GUÍA NUEVA — sin recomendaciones de inversión; comparativa neutral. |
| Cupones/consumidores hispanos | "cupones descuentos hispanos eeuu" | Evaluar demanda real antes de producir. |

## Estructura de las 12 semanas

- **Semanas 1–2**: pilar "Enviar dinero a Nicaragua" (guía madre + 3
  actualizaciones de tasas/comparativa). Internamente enlaza a trámites
  migratorios y economía existentes.
- **Semanas 3–4**: pilar "TPS/migración" + actualización de la guía de
  trámites migratorios existente con datos 2026.
- **Semanas 5–6**: pilar "Clima/huracanes" (estacional — antes de la
  temporada) + dólar→córdoba como pieza diaria de datos.
- **Semanas 7–8**: pilar "DACA/bancos para hispanos" + 2 guías de
  servicios financieros neutras.
- **Semanas 9–10**: refresco de guías evergreen con fecha de
  actualización real + nuevos temas de cola larga según Search Console.
- **Semanas 11–12**: revisión con datos reales de GSC (queries, CTR,
  posiciones) y ajuste del calendario. Sin métricas inventadas.

## Datos que alimentan cada pieza

- Tasa dólar→córdoba: fuente verificable con timestamp visible.
- TPS/DACA/trámites: USCIS, Department of State, consulado — nunca blogs.
- Huracanes: INETER/SINAPRED.
- Remesas: fuentes oficiales de bancos/operadores + fecha de consulta.

## Lo que NO se hace

- No publicar "noticias" inventadas para completar cupo.
- No crear FAQs artificiales ni datos estructurados que no reflejen
  contenido visible.
- No comprar enlaces ni generar directorios/spam.
