# Motor Editorial V3 — Diseño de Arquitectura

**Estado:** Diseño preliminar (no implementar aún)  
**Depende de:** Motor Editorial V2 RC1 congelado y validado a 500 notas sin contradicciones.

## Visión

El Motor Editorial V3 no genera artículos. Toma las decisiones del RC1 y produce el **paquete editorial completo** necesario para publicar y distribuir la nota en múltiples canales.

```
INFORMACIÓN
      │
      ▼
═══════════════════════════════
ANALIZADOR FORENSE
═══════════════════════════════
      │
      ▼
EDITOR JEFE RC1
═══════════════════════════════
      │
      ▼
DIRECTOR EDITORIAL
═══════════════════════════════
      │
      ▼
MOTOR EDITORIAL V3
═══════════════════════════════
      │
      ├── HTML optimizado
      ├── SEO (título, meta, slug, keywords)
      ├── Schema.org / NewsArticle
      ├── Open Graph
      ├── Twitter Cards
      ├── Facebook
      ├── WhatsApp
      ├── Telegram
      ├── Push
      ├── Imagen ALT
      ├── Pie de foto
      ├── Discover Score
      ├── Checklist editorial
      ├── Prioridad de publicación
      ├── Tipo de portada
      ├── Hora sugerida de publicación
      ├── Actualizaciones recomendadas
      └── Cobertura relacionada
```

## Componentes nuevos

### 1. Director de Audiencias

No analiza la nota. Analiza **cómo distribuirla**.

**Salida:** puntuación por plataforma (1-5 estrellas) y explicación.

Ejemplo para una nota de **Sucesos**:

| Plataforma | Puntuación | Justificación |
|---|---|---|
| Facebook | ★★★★★ | Tema de alto interés local, compartible por utilidad/alerta. |
| WhatsApp | ★★★★☆ | Útil para familias y grupos de barrio. |
| Telegram | ★★☆☆☆ | Audiencia menor; útil solo para seguimiento. |
| Discover | ★★★☆☆ | Requiere más contexto o utilidad práctica. |
| Google News | ★★★★★ | Fuente identificada, tema local relevante. |
| Push | ★★★★☆ | Alerta inmediata justifica notificación. |
| SEO Evergreen | ★☆☆☆☆ | Nota de actualidad, no de tráfico sostenido. |

**Decisiones derivadas:**

- Qué plataforma priorizar.
- Cuál publicar primero.
- Cuál dejar para actualización.
- Cuál merece video o carrusel.
- Cuál no vale la pena impulsar.

### 2. Vida útil editorial

Clasifica la nota según su curva de relevancia esperada.

| Tipo | Indicación | Acción |
|---|---|---|
| **Corta** | Vida útil: 12 horas | Actualizar o cerrar cobertura rápidamente. |
| **Media** | Vida útil: 2-3 días | Seguimiento obligatorio en 24 horas. |
| **Evergreen** | Vida útil: meses | Actualizar cada mes; optimizar SEO continuo. |
| **Seguimiento** | Evento en desarrollo | Publicar actualizaciones programadas. |

Esto ayuda a gestionar la redacción y evita que notas caducadas ocupen recursos.

### 3. Índice de Potencial

No mide SEO, Facebook ni Discover individualmente. Mide **potencial de crecimiento** de la nota si se enriquece.

**Ejemplo:**

```
Índice de Potencial: 62%

¿Por qué?
- No tiene cifras concretas.
- No tiene mapa geográfico.
- No tiene antecedentes.
- No tiene comparación.
- No tiene cronología.

Si agregás estos elementos: +18 puntos.
```

Este índice convierte al sistema en una herramienta de edición: indica exactamente qué le falta a la nota para convertirse en referencia.

## Entradas del V3

El V3 solo consume:

- `NoticiaInput` (título, contenido, resumen, categoría, autor, fecha, slug)
- `ResultadoAnalisis` (filtros, forense)
- `ReporteEditorJefe` del RC1 (decisiones, sugerencias, evidencia, riesgo legal)
- Datos históricos de publicación (para Director de Audiencias y vida útil)

## No modifica el RC1

El V3 **nunca** altera:

- `lib/editor-jefe/engine.ts`
- decisiones de portada
- puntuaciones forenses
- reglas de evidencia

Solo **interpreta** y **produce derivados**.

## Módulos propuestos

```
lib/editor-v3/
  ├── generar-paquete-editorial.ts   # Orquestador principal
  ├── director-audiencias.ts         # Puntuaciones por plataforma
  ├── vida-util-editorial.ts         # Curva de relevancia
  ├── indice-potencial.ts            # Puntos de crecimiento
  ├── generar-html.ts                # HTML semántico
  ├── generar-seo.ts                 # Meta tags, slug, keywords
  ├── generar-schema.ts              # Schema.org NewsArticle
  ├── generar-opengraph.ts           # OG y Twitter Cards
  ├── generar-mensajes-redes.ts      # Facebook, WhatsApp, Telegram
  ├── generar-push.ts                # Notificación push
  ├── generar-imagen.ts              # ALT y pie de foto sugeridos
  └── generar-cobertura-relacionada.ts
```

## Criterios para empezar a codificar

No se escribe código del V3 hasta cumplirse:

1. Motor Editorial V2 en tag `v1.0-editor-jefe-estable`.
2. 500 notas reales sin contradicciones.
3. Código legacy removido del repositorio.
4. RFC del V3 aprobado con casos de prueba.

## Beneficio esperado

Reducir el tiempo entre "la nota está lista" y "está publicada en todos los canales" de minutos/horas a segundos, manteniendo la calidad y consistencia editorial que demostró el RC1.
