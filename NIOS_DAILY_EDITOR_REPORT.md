# NIOS_DAILY_EDITOR_REPORT.md

## Propósito

NIOS Daily Editor es la capa operativa diaria del editor. Cada mañana responde: **"¿Qué debe hacer Nicaragua Informate hoy para crecer?"**.

No reemplaza MENI, EOS ni Home Balance. Los consume y convierte en acciones priorizadas.

---

## Arquitectura

```
Firestore
  ├─ noticias  → getNews(500)
  └─ guías     → getAllEvergreen()
         │
         ▼
lib/nios/daily-editor.ts (orquestador)
         │
    ┌────┴────┬──────────┬───────────────┬─────────────┬──────────────────┐
    ▼         ▼          ▼               ▼             ▼                  ▼
category-  opportunity  seo-cleanup    content-mix   business-signals   report
health.ts  -radar.ts     .ts            .ts           .ts
    │         │          │               │             │
    └────┬────┴──────────┴───────┬───────┴───────┬─────┴──────────────────┘
         │                       │
         ▼                       ▼
app/admin/nios/page.tsx   NIOS_DAILY_EDITOR_REPORT.md
(DailyEditorPanel)
```

---

## Archivos creados / modificados

### Nuevos módulos de análisis

| Archivo | Función |
|---|---|
| `lib/nios/category-health.ts` | Salud editorial por categoría (7 y 30 días) |
| `lib/nios/opportunity-radar.ts` | Oportunidades de crecimiento por categoría y noticia |
| `lib/nios/seo-cleanup.ts` | Detección de títulos, metas, autores e imágenes con problemas |
| `lib/nios/content-mix.ts` | Plan semanal de contenido equilibrado |
| `lib/nios/business-signals.ts` | Categorías con potencial comercial sin vender publicidad |
| `lib/nios/daily-editor.ts` | Orquestador que genera el `DailyEditorReport` |

### UI

| Archivo | Función |
|---|---|
| `components/nios/DailyEditorPanel.tsx` | Renderiza el reporte diario con tarjetas |
| `app/admin/nios/page.tsx` | Integra `DailyEditorPanel` en el panel NIOS existente |

### Documentación

- `NIOS_DAILY_EDITOR_REPORT.md`

---

## Ejemplo de salida

### Reporte diario (`getDailyEditorReport`)

```json
{
  "generatedAt": "2026-08-02T14:00:00.000Z",
  "date": "2 de agosto de 2026",
  "status": "ok",
  "publishedCount": 212,
  "dominantCategory": "Sucesos",
  "distribution": {
    "Sucesos": 95,
    "Nacionales": 52,
    "Deportes": 31,
    "Internacionales": 24,
    "Espectáculos": 6,
    "Tecnología": 4
  },
  "categoriesToStrengthen": ["Tecnología", "Espectáculos"],
  "recommendations": [
    "Fortalecer categorías: Tecnología, Espectáculos.",
    "Revisar 22 problemas SEO pendientes.",
    "Aprovechar oportunidad: Guía de Migración."
  ],
  "seo": {
    "total": 22,
    "counts": {
      "titulo_largo": 12,
      "meta_larga": 6,
      "sin_alt": 4
    }
  }
}
```

### Panel `/admin/nios`

- **Recomendación diaria:** tarjeta con las 3-5 acciones principales.
- **Salud editorial por categoría:** indicador alto/medio/bajo con conteo 7d/30d.
- **Categorías a fortalecer:** badges rojos con prioridad.
- **SEO pendiente:** conteo de títulos, metas, autores e imágenes con problema.
- **Oportunidades:** lista con acción sugerida.
- **Señales comerciales:** categorías con potencial sin activar anuncios.
- **Plan semanal:** tabla de categorías por día.

---

## Reglas de calidad seguidas

- **No inventa datos:** si Firestore falla, el reporte retorna vacío con `status: 'partial'`.
- **No usa métricas falsas:** todas las métricas se calculan sobre `Noticia[]` real.
- **No recomienda solo por clics:** prioriza categorías débiles, guías y contenido sostenible.
- **No crea anuncios ni ventas:** `business-signals` solo detecta oportunidades.
- **No modifica MENI/EOS/Home:** los módulos son puros y desacoplados.

---

## Integración

La página `app/admin/nios/page.tsx` ahora ejecuta:

```tsx
const [report, daily] = await Promise.all([getNiosReport(), getDailyEditorReport()]);
```

y renderiza:

```tsx
<DailyEditorPanel daily={daily} />
```

antes del informe clásico de NIOS.

---

## Validación

Comandos ejecutados:

- `npx tsc --noEmit`
- `npm run build`
- `npm run test:merge`

Resultado esperado: todos los gates deben pasar.

---

## Criterio final

Nicaragua Informate ahora cuenta con una herramienta que, cada mañana, puede responder:

> "Estas son las acciones más importantes para hacer crecer el medio hoy."
