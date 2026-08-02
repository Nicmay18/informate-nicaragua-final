# NIOS Automation — Reporte Técnico

## 1. Objetivo

Automatizar el ciclo diario de operaciones editoriales sin reemplazar el criterio humano: generar briefings, misiones, colas de distribución y recomendaciones de reciclaje.

## 2. Automatizaciones implementadas

### 2.1. Morning Report

Generado cada vez que se carga `/admin/nios`:
- Título: "BUENOS DÍAS NICARAGUA INFORMATE".
- Score editorial del día.
- Noticias publicadas ayer y vistas totales.
- Mejor categoría y problema más crítico.
- Lista de acciones recomendadas.

### 2.2. Daily Briefing

- ¿Qué pasó ayer? Resumen de noticias y top noticias.
- ¿Qué noticias crecieron? Picos de tráfico reciente.
- ¿Qué publicar hoy? Temas comerciales, recurrentes y entidades activas.
- ¿Qué actualizar? Noticias maduras con tráfico.
- ¿Qué distribuir? Top noticias del día.
- ¿Qué oportunidad existe? Guía canónica o categoría débil.

### 2.3. Mission Engine

Misión diaria con tareas como:
- Publicar 1 Nacional.
- Publicar 1 Tecnología.
- Fortalecer categoría débil.
- Corregir meta descriptions.
- Crear guía evergreen.
- Distribuir 5 artículos.
- Actualizar 2 noticias.

Cada tarea tiene:
- `impact` esperado.
- `difficulty` (fácil, media, difícil).
- `priority` (critical, high, medium).
- `done` (estado calculado).

### 2.4. Distribution Agent

- Genera textos listos para 6 canales: Facebook, Telegram, WhatsApp, Newsletter, Push, X.
- Cada texto ajustado al formato del canal.
- Guarda `pending`/`sent`, fecha y slug.
- No publica automáticamente; es cola para aprobación del editor.

### 2.5. Content Recycler

Detecta:
- Noticias con alto tráfico y potencial de guía.
- Entidades con cobertura suficiente para cronología.
- Noticias antiguas para actualizar.
- Entidades sin guía que merecen especial.

## 3. Integración

- `buildV4Report` en `lib/nios/v4-report.ts` ejecuta todas las automatizaciones.
- `DailyEditorReport` incluye `v4: NiosV4Report`.
- `app/admin/nios/page.tsx` muestra el dashboard del agente.

## 4. Rendimiento

- Todo se calcula en el request diario.
- No se agregan cron jobs nuevos.
- Futura mejora: cachear `v4` con ISR de 1 hora.

## 5. Validaciones

| Comando | Resultado |
|---------|-----------|
| `npx tsc --noEmit` | ✅ Aprobado |
| `npm run build` | ✅ Aprobado |
| `npm run test:merge` | ✅ Aprobado |

## 6. Próximos pasos

- Programar generación del morning report por correo/canal interno.
- Persistir estado de misiones en Firestore.
- Agregar endpoint para marcar tarea como hecha.
