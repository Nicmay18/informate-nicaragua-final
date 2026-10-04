# ARQUITECTURA FINAL — Nicaragua Informate

## Vista del sistema

```
ESCRIBIR (panel.html)
  → POST /api/admin/analizar        (MENI evalúa: score, DNA, QG, Supervisor, Editor Jefe)
  → POST /api/admin/guardar-directo (publica si aprobado; REVISAR+editorOverride → publica)
      │
      ├─ Firestore: noticias/{id}          (artículo + scoreMeni + estado)
      ├─ Distribución automática:
      │    telegram  → lib/distribution/telegram.ts (sender endurecido, claim atómico)
      │    facebook  → lib/distribution/channels.ts enviarFacebook
      │    whatsapp  → copy-social (texto generado, pegado manual)
      │    push      → OneSignal (si credenciales)
      │    indexnow  → Bing/Yandex ping
      └─ /api/revalidate                   (limpieza de caché ISR)

CRONS (vercel.json, 10)
  0 8 *   nios-collect          → colector NIOS → Firestore
  0 12 *  resumen-diario        → top-5 noticias 30h → Telegram (resumenes_diarios/{fecha})
  0 0 *   departamento-central  → ciclo orquestador
  0 6 *   departamento-daily    → tareas diarias
  0 1 *   departamento-watchdog → watchdog
  0 2 *   nios-ceo-loop         → loop CEO/intelligence
  0 4 *   supervisor-watch      → vigilancia
  0 3 *   traffic-cleanup       → limpieza analítica
  15 5 *  distribuciones-retry  → reintenta envíos fallidos (claim 'failed')
  0 6 * * 0  meni-learning-cycle (domingos)

PUBLICACIÓN WEB
  /              → Home (componentes/pro + HomePagePro)
  /noticias/[slug] → ArticlePage + ads + JSON-LD
  /categoria/[slug], /entidad/[slug], /tema, /guia, /autor, /buscar
  /api/rss, /api/feed-xml → feeds
  sitemap.ts, robots → SEO
```

## Pipeline editorial (una sola cadena)

```
NoticiaInput
  → runMeni (lib/meni/core.ts)
       ├─ editorial-brain (diferencia, valor noticioso, explicación)
       ├─ editorial-dna  (7 dimensiones + transcripción)
       ├─ quality-gate   (originalidad real vs fuente, integridad)
       ├─ diagnostics    (issues con severidad + evidencia + howToFix)
       ├─ editorialVerdict unificado (PUBLICAR/PUBLICAR_CON_CAMBIOS/REVISAR/BLOQUEAR)
       └─ Supervisor (lib/supervisor/editorial-supervisor) → veredicto final
  → guardarConMeni / guardar-directo (compuerta: meniOk + supervisorApproved + override)
```

## Autoridad de decisión

1. MENI evalúa (nunca es autoridad final visible)
2. Supervisor decide veredicto (INVESTIGAR_MAS/APROBAR/etc.)
3. `editorialVerdict` consolida → decisión única mostrada
4. Si REVISAR → el Editor Jefe humano confirma (editorOverride)
5. Si BLOQUEAR → nunca publica

## Datos (Firestore)

- `noticias` — artículos (estado, scoreMeni, fecha, vistas)
- `distribuciones` — log de envíos por canal
- `distribuciones_envios` — claims atómicos {telegram_<slug>} anti-duplicados
- `resumenes_diarios` — idempotencia resumen por día
- `config/admin` — tokens Telegram (con fallback env)
- colecciones NIOS (nios_*, growth, traffic…)

## Lo que NO existe como sistema paralelo

- No hay segundo "brain": editorial-brain + supervisor + editorialVerdict son la cadena única
- No hay segundo sender de Telegram: lib/distribution/telegram.ts es el único
- NIOS es un sistema auxiliar de inteligencia/analytics, no compite con MENI
