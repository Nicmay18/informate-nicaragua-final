# NIOS v2.0 — Arquitectura

## Propósito

El **Nicaragua Informate Operating System (NIOS)** es una capa superior de inteligencia que utiliza los datos ya existentes del medio para generar recomendaciones editoriales, SEO, de distribución y comerciales. No reemplaza MENI V3.2, el flujo de publicación, el Home Ranking Engine ni el SEO validado.

## Ubicación

```
/lib/nios
├── types.ts              # Tipos compartidos
├── utils.ts              # Helpers
├── index.ts              # Orquestador y reporte
├── growth.ts             # Módulo 1
├── seo.ts                # Módulo 2
├── contentLifecycle.ts   # Módulo 3
├── audience.ts           # Módulo 4
├── revenue.ts            # Módulo 5
├── distribution.ts       # Módulo 6
├── competitors.ts        # Módulo 7
├── opportunityHunter.ts  # Módulo 8
└── ceoReport.ts          # Módulo 9
```

## Módulos

1. **Growth Intelligence**: análisis de noticias, vistas, tráfico y fuentes usando `lib/growth`.
2. **SEO Intelligence**: artículos con poco tráfico, meta description débil, keywords vacías, canibalización y evergreen estancado.
3. **Content Lifecycle**: clasificación de noticias en estados y recomendaciones de actualización, ampliación o guía.
4. **Audience Intelligence**: análisis por categorías, profundidad y concentración de audiencia.
5. **Revenue Intelligence**: oportunidades comerciales basadas en tráfico e inventario publicitario.
6. **Distribution Intelligence**: noticias que deben distribuirse en canales sociales y newsletter.
7. **Competitor Intelligence**: módulo reservado para integración futura con fuentes externas.
8. **Opportunity Hunter**: detección de temas con potencial evergreen y categorías sin guía.
9. **CEO Report**: resumen ejecutivo diario unificado.

## Flujo de datos

1. `app/admin/nios/page.tsx` (server) llama `getNiosReport()`.
2. `getNiosReport` ejecuta los 9 módulos en paralelo.
3. Cada módulo lee datos existentes (Firestore, `lib/data`, `lib/evergreen`, `lib/ads/inventory`, `lib/distribution`).
4. `buildCeoReport` genera el informe ejecutivo.
5. El panel renderiza recomendaciones ordenadas por impacto.

## Principios

- No se modifica `lib/editorial/core/`.
- No se duplica lógica; se reutilizan `lib/data`, `lib/growth`, `lib/distribution`, `lib/evergreen`.
- Bajo acoplamiento: cada módulo puede ejecutarse de forma independiente.
- El sistema no toma decisiones automáticas; genera recomendaciones accionables.
