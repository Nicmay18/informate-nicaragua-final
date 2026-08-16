# NICARAGUA INFÓRMATE — SISTEMA OPERATIVO EMPRESARIAL (NIOS v2)
## Manual de Operación, Inteligencia y Gobierno Digital

> **Versión:** 2.0.0 (Enterprise Architecture)  
> **Fecha:** Agosto 2026  
> **Autoridad:** Dirección General & Oficina de Arquitectura  
> **Misión:** Calidad Editorial + Audiencia + Recurrencia + Google + Recirculación + Monetización + Confianza + Identidad Propia.

---

## 1. DECLARACIÓN DE PRINCIPIOS Y MANDATO EJECUTIVO

1. **Cero Datos Falsos o Estimados:** Todo número presentado al CEO proviene de APIs reales (Google Search Console, Google Analytics 4 Data API v1beta, Firestore). Si no hay datos, el estado explícito es `UNKNOWN` o `CONNECTED_NO_DATA` con valor `null`, **nunca** un cero simulado.
2. **Prohibición Total de Semáforos Ciegos:** Se erradicaron las etiquetas arbitrarias de color (Rojo / Amarillo / Verde). Toda decisión editorial y analítica se expresa mediante la cuádrupla de negocio:
   `[ Observación | Evidencia | Diagnóstico | Acción Concreta ]`
3. **Erradicación del Falso "Thin Content":** Un artículo conciso de 350 palabras con fuentes oficiales y datos de utilidad pública es catalogado como `SHORT_USEFUL` o `EDITORIALLY_COMPLETE`. Queda prohibida la inyección automatizada de texto de relleno o palabras clave artificiales.
4. **Aislamiento Estricto de Autoridad:**
   - **MENI / Supervisor Gate:** Autoridad única sobre la redacción, veracidad y publicación del contenido. NIOS no modifica noticias automáticamente.
   - **SITE (Next.js 15):** Autoridad sobre la velocidad de entrega, accesibilidad, Core Web Vitals y experiencia del lector nicaragüense.
   - **NIOS v2 (Business & Intel OS):** Autoridad sobre la observación del negocio, ciclo de vida del catálogo, detección de oportunidades de crecimiento y preparación de monetización.

---

## 2. ARQUITECTURA DE TRES SISTEMAS COORDINADOS

```
                    ┌─────────────────────────────────────────┐
                    │      NICARAGUA INFORMATE PLATFORM       │
                    └─────────────────────────────────────────┘
                                         │
     ┌───────────────────────────────────┼───────────────────────────────────┐
     ▼                                   ▼                                   ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│       SISTEMA 1       │   │       SISTEMA 2       │   │       SISTEMA 3       │
│         MENI          │   │         SITE          │   │         NIOS          │
│  (Editorial Engine)   │   │  (Reader Experience)  │   │ (Business & Intel OS) │
└───────────────────────┘   └───────────────────────┘   └───────────────────────┘
  • Redacción & Estilo        • Next.js 15 App Router     • Ingesta GSC / GA4 / Logs
  • Calidad Periodística      • Web Vitals / Performance  • Observación de Sesión
  • Canonicidad & DNA         • SEO On-Page & Schema      • Growth & LifeCycle Engine
  • Supervisor Gate           • Distribución Omnicanal    • Money Engine & AdSense
  • Publicación Invariante    • Experiencia Lectores      • CEO Daily & Weekly Brief
```

---

## 3. DATA CONTRACTS Y ESTADOS DE CONEXIÓN

Todos los colectores implementan la máquina de estados canónica (`lib/contracts/index.ts`):

| Estado | Significado Técnico | Acción del Sistema |
|---|---|---|
| `CONNECTED_WITH_DATA` | API conectada y devolviendo registros reales | Procesar métricas e insights. |
| `CONNECTED_NO_DATA` | Credenciales válidas; el sitio aún no registra volumen en la ventana | Informar honestamente "Sin datos recientes". |
| `NOT_CONFIGURED` | Variables de entorno faltantes | Advertir en el Daily Brief sin romper el runtime. |
| `ACCESS_DENIED` | Error de permisos (403) en Service Account | Alertar al equipo técnico para ajuste de IAM. |
| `API_ERROR` | Caída de red o falla upstream de Google | Registrar en auditoría y reintentar con backoff. |

### Colectores Oficiales (`lib/nios/collectors/`):
- `gsc.ts`: Google Search Console (impresiones, clics, CTR medio, posición media, páginas y consultas).
- `ga4.ts`: Google Analytics 4 (usuarios activos, sesiones, engagement duration, vistas de pantalla).
- `internal.ts`: Ingesta interna agregada con política de TTL estricto a 30 días para proteger los costos de base de datos.

---

## 4. CICLO DE VIDA DEL CONTENIDO (CONTENT LIFECYCLE TRACKER)

Ubicación: `lib/nios/lifecycle/tracker.ts`

El sistema evalúa cada artículo a través de su maduración temporal:
1. `CREATED`: Guardado en borrador o revisión.
2. `PUBLISHED`: Publicado en portada tras superar el Supervisor Gate.
3. `OBSERVED` (0-24h): Monitoreo de tracción inicial y primeras lecturas.
4. `LEARNING` (1-7 días): Indexación en Google y captación de búsquedas directas.
5. `GROWING` (7-30 días): Crecimiento sostenido con impresiones en Search Console (>50).
6. `STABLE`: Rendimiento consolidado de fondo.
7. `UPDATE_REQUIRED`: Detección de nuevos hechos o desactualización factual.
8. `ARCHIVE_CANDIDATE`: Artículo antiguo (>60 días) sin tráfico ni búsquedas que requiere revisión de archivo.

### Clasificación de Sustancia Editorial:
- **`EDITORIALLY_COMPLETE`**: Artículo con extensión sólida (>450 palabras), fuentes y estructura.
- **`SHORT_USEFUL`**: Nota ágil (250-450 palabras) con datos clave y fuentes transparentes.
- **`THIN_CANDIDATE`**: Nota breve (<250 palabras) en observación.
- **`THIN_CONFIRMED`**: Texto muy breve (<150 palabras) sin fuentes ni estructura que requiere enriquecimiento o descarte.

---

## 5. MOTOR DE CRECIMIENTO Y RECIRCULACIÓN (GROWTH ENGINE)

Ubicación: `lib/nios/growth/opportunities.ts`

Detecta oportunidades de negocio directas:
1. **Search CTR Optimization:** Artículos en el Top 10 de Google con alto volumen de impresiones (>150) pero CTR bajo (<2%). Acción: Ajustar título a una promesa más clara y descriptiva.
2. **Strike-Zone Queries:** Consultas de usuarios en posiciones 6 a 15 de Google con más de 100 impresiones. Acción: Añadir una sección H2 específica respondiendo la consulta exacta.
3. **Recirculation Enrichment:** Artículos con más de 60 segundos de lectura promedio pero sin enlaces internos. Acción: Insertar 2 enlaces cruzados a notas afines para retener la sesión del lector.

---

## 6. SOSTENIBILIDAD Y AUDITORÍA DE POLÍTICAS DE ADSENSE

Ubicación: `lib/nios/revenue/adsense.ts` y `lib/nios/revenue/sustainability.ts`

### Criterios de Calidad para Monetización Ética:
- **0 Generación Artificial:** No se permite IA para crear texto de relleno. Todo contenido debe tener valor informativo real.
- **Transparencia E-E-A-T:** Firma de autor y atribución explícita de fuentes oficiales o testimoniales.
- **Proporción Publicitaria Balanceada:** Anuncios integrados sin alterar la legibilidad ni provocar clics accidentales (CLS < 0.1).
- **Apoyo Comunitario:** Módulo ético para lectores recurrentes ("Apoya el periodismo de Nicaragua Infórmate").

---

## 7. INTELIGENCIA EJECUTIVA PARA EL CEO

### 7.1 CEO Morning Brief ("Buenos Días, Nicaragua Infórmate")
Generado diariamente con las **3 prioridades críticas del día**:
- **Pulso de Audiencia:** Usuarios activos y tiempo medio de sesión.
- **Pulso de Búsqueda:** Impresiones, clics y consultas destacadas en Google.
- **Pulso Editorial:** Artículos en observación y notas que requieren actualización.
- **Pulso de Monetización:** Porcentaje del catálogo listo para AdSense.

### 7.2 Weekly Strategic Report
Retrospectiva semanal estructurada que responde:
1. **¿Qué creció esta semana?** (con métricas exactas).
2. **¿Qué cayó esta semana?**
3. **¿Por qué?** (análisis de causa raíz basado en señales de búsqueda y retención).
4. **¿Cuáles son las 3 decisiones estratégicas para la próxima semana?**

---

## 8. PROTOCOLOS DE VERIFICACIÓN Y QUALITY GATE

Antes de cualquier despliegue o fusión a `master`:
1. `npm run type-check` (`tsc --noEmit`) → 0 errores de tipo.
2. `npx vitest run` → 100% de suites pasando (data contracts, supervisor, observability, journey tracking, nios core, revenue, executive).
3. Verificación de secretos: Cero credenciales privadas commiteadas.
4. Integridad de contratos: No usar tipos `any` en capas críticas de datos.
