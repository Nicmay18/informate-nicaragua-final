# NIOS v2.0 — Manual funcional

## Acceso

El panel NIOS está disponible en `/admin/nios`.

## Secciones del panel

### 1. Informe del CEO

Resume qué ocurrió, qué funcionó, qué no, oportunidades, riesgos y próximas acciones.

### 2. Prioridades, alertas, oportunidades y riesgos

Recomendaciones generadas por cada módulo, ordenadas por impacto (`critical` > `high` > `medium` > `low` > `info`).

Cada recomendación indica:

- **Título**: qué se detectó.
- **Descripción**: por qué importa.
- **Prioridad**: nivel de impacto.
- **Acción**: qué hacer.

### 3. Módulos de inteligencia

Cada módulo muestra:

- Estado (`ok`, `opportunity`, `warning`, `requires_attention`, `not_implemented`).
- Resumen en lenguaje natural.
- Métricas clave.
- Hasta 3 recomendaciones principales.

## Cómo usarlo

1. Revisar **Próximas acciones** cada mañana.
2. Atender primero las **Alertas** y **Prioridades**.
3. Revisar **Oportunidades** para planificar contenido o distribución.
4. Verificar **Módulos** para entender el detalle de cada recomendación.
5. El sistema no publica ni decide automáticamente; las acciones requieren aprobación humana.

## Frecuencia de actualización

El panel se genera en cada carga. Las recomendaciones se recalculan en tiempo real a partir de Firestore.
