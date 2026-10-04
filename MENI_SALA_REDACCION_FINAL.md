# MENI — SALA DE REDACCIÓN DIGITAL

Cómo el sistema existente ejerce cada rol editorial. **Sin sistemas nuevos** — cada rol ya existe en el código.

## El flujo para el periodista

```
Yo escribo la nota → Analizar → MENI muestra veredicto único + hallazgos por severidad
  ├─ 🟢 PUBLICAR / 🟡 PUBLICAR CON CAMBIOS → publica directo
  ├─ 🟠 REVISAR → reviso hallazgos → si está bien, "Confirmar como Editor Jefe"
  └─ 🔴 BLOQUEAR → corrijo el defecto real
```

## Roles editoriales → sistemas existentes

| Rol | Sistema | Dónde |
|---|---|---|
| Mesa de categoría (Sucesos, Nacionales, Deportes, Espectáculos, Internacionales, Tecnología…) | Perfiles MENI + Category Intelligence | lib/meni/editorial-brain/profiles/*, lib/editorial/profiles/* |
| Verificación de fuentes / research | Factuality + Trust | lib/editorial/factuality-signals.ts, lib/editorial/trust.ts |
| Calidad del artículo | Quality Gate + Content Integrity | lib/meni/quality-gate/, lib/editorial/content-integrity |
| SEO / Discover | motores de keywords, entidades, enrich-links | /api/admin/enrich-*, lib/meni/discover |
| Contenido / diferencia | Editorial Brain + Editorial Difference | lib/meni/editorial-brain/* |
| Crecimiento / oportunidades | NIOS | lib/nios/* (143 archivos) |
| Editor social (FB/TG/WA) | Distribución + copy-social | lib/distribution/, /api/admin/copy-social |
| **Editor Jefe** (decisión final) | editorialVerdict + Supervisor + override humano | core.ts, editorial-supervisor, panel.html |

## Qué distingue MENI ahora

- **Veredicto único** mostrado (`EDITOR JEFE — <decisión>`): no 3 opiniones contradictorias
- **Hallazgos por severidad**: BLOQUEANTE / REVISAR / RECOMENDACIÓN / INFO con badge y evidencia + corrección
- **"Ya está presente"**: recomendaciones se filtran si el contenido ya lo cubre (satisfaction/normalization)
- **Métricas correctas**: Originalidad≠Diferencia≠Transcripción (corregido en sesiones previas; lluvias test muestra transc=100)
- **REVISAR ≠ bloqueo**: banner naranja "requiere decisión del Editor Jefe", no rojo de bloqueo
- **El humano decide**: `Confirmar como Editor Jefe` publica con `editorOverride`

## El caso lluvias — comportamiento correcto

Nota de 14 viviendas sin fuente nombrada:
- MENI aprueba (90, PUBLICAR_CON_CAMBIOS)
- Supervisor: `INVESTIGAR_MAS` — NO_ATTRIBUTION es IMPORTANT → REVISAR
- Veredicto: "REVISAR ANTES DE PUBLICAR" — correcto: falta atribuir la cifra ("según SINAPRED", "según el Cuerpo de Bomberos"…)
- El redactor confirma y publica, o agrega la fuente y se auto-aprueba

Eso ES el comportamiento de sala de redacción: la nota es publicable, pero el sistema exige que el Editor Jefe la mire antes porque una cifra sin fuente es un riesgo editorial real — no un falso positivo.

## Regresión permanente

`tests/meni-lluvias-repro.test.ts` — traza toda la cadena. Si en el futuro algo rompe la distinción revisar/bloquear o las métricas, el test lo muestra.
