# NIOS Business Command Center

**Fase 1 — Capa de dirección ejecutiva sobre los motores existentes**

Ruta: `/admin/nios`

---

## 1. Qué es y qué no es

El Business Command Center es una **capa de lectura y decisión**. Toma las salidas de los motores que ya existen y las traduce en decisiones de negocio.

**No** crea una aplicación nueva. **No** introduce una arquitectura paralela. **No** modifica ningún motor.

### Motores consumidos (solo lectura)

| Motor | Qué aporta al Command Center |
|---|---|
| Home Ranking Engine | El orden real de la portada que audita Home Quality Control |
| SEO efectivo (`lib/seo/effective`) | Estado real de meta/keywords que ve Google |
| Evergreen | Inventario de guías permanentes para Trust y Revenue |
| Datos Firestore (`lib/data`) | Archivo editorial completo |

### Motores intactos

MENI V3.2, EOS Editorial Operating System, NIOS Intelligence System, Daily Editor, Growth Dashboard, Revenue Intelligence y Distribution Intelligence **no fueron tocados**. El panel anterior en `/panel/nios` sigue funcionando sin cambios.

---

## 2. Arquitectura

```
lib/nios/command-center/
├── types.ts                  Contratos de toda la capa
├── constants.ts              Objetivos editoriales y comerciales
├── editorial-balance.ts      (2) Editorial Balance Engine
├── google-trust.ts           (3) Google Trust Score
├── revenue-engine.ts         (4) Revenue Engine
├── war-room.ts               (5) Content War Room
├── home-quality.ts           (6) Home Quality Control
├── distribution-command.ts   (7) Distribution Command
├── opportunity-hunter.ts     (8) Content Opportunity Hunter
├── business-health.ts        (9) Business Health
├── ceo-decisions.ts          (1) CEO Daily Decision
└── index.ts                  Orquestador
```

**Decisión de diseño clave**: `buildCommandCenter(noticias, guides, errors, now)` es una **función pura**. Todo el I/O vive en `getCommandCenter()`. Esto permite testear el 100% de la lógica de negocio de forma determinista, sin Firestore.

### Capa de presentación

```
components/nios/command-center/
├── CommandCenterShell.tsx    Shell con 8 pestañas
├── StrategyPanels.tsx        Mando, Balance, Trust, Revenue
├── OperationsPanels.tsx      War Room, Portada, Distribución, Oportunidades
└── primitives.tsx            Chip, Metric, ScoreRing, Section

app/styles/command-center.css Sistema de diseño oscuro `.ncc-*`
```

---

## 3. Los nueve módulos

### 1. CEO Daily Decision

Máximo **5 decisiones**, una por eje. Si un eje no tiene nada urgente, se omite: el panel nunca rellena con ruido.

| Eje | Origen | Pregunta que responde |
|---|---|---|
| 🔥 Inmediata | Distribution Command | ¿Qué nota muevo ahora mismo? |
| 📈 Crecimiento | Editorial Balance / Trust | ¿Dónde invierto producción? |
| 💰 Negocio | Revenue Engine | ¿Qué puedo vender esta semana? |
| 🔎 Google | Trust Score / Hunter | ¿Qué me está frenando en buscadores? |
| ⚠️ Riesgo | Balance / Home / Business | ¿Qué está erosionando la marca? |

Cada decisión declara **acción**, **justificación** y **motor de origen**. Nada es una caja negra.

### 2. Editorial Balance Engine

Compara la distribución real contra la mezcla objetivo:

| Categoría | Objetivo | Techo |
|---|---|---|
| Nacionales | 30% | — |
| Sucesos | 20% | **20%** |
| Deportes | 20% | — |
| Internacionales | 15% | — |
| Tecnología | 10% | — |
| Otros | 5% | — |

Produce un **identityScore** (0-100) penalizado por la desviación absoluta total. Cuando Sucesos rebasa su techo, emite literalmente:

> *"Sucesos genera tráfico pero domina demasiado la identidad editorial."*

### 3. Google Trust Score

Siete pilares ponderados:

| Pilar | Peso | Qué mide |
|---|---|---|
| Autoridad editorial | 1.2 | Autor identificado + foto |
| Profundidad | 1.2 | Notas >400 palabras + puntos clave |
| Variedad temática | 1.0 | Categorías activas |
| Guías evergreen | 1.0 | Piezas permanentes con FAQ |
| Actualización | 1.0 | Frescura 7d + refresco 90d |
| Experiencia | 1.0 | Meta sólida + imagen propia |
| Autores | 0.8 | Firmas distintas en circulación |

Cada pilar declara **fortaleza**, **debilidad** y **próxima acción**.

### 4. Revenue Engine

No vende ni fija precios. Detecta dónde el inventario editorial ya construido sostiene una conversación comercial.

Lógica: un patrocinio necesita **inventario estable + una pieza ancla permanente**.

- Sin inventario → `exploratorio`: "publicar 3 notas base primero"
- Con inventario, sin guía → `medio`: "crear la guía ancla"
- Con inventario y guía → `bajo esfuerzo`: **"puede vender patrocinio"**

Verticales cubiertas: Economía, Turismo, Tecnología, Deportes, Educación, Salud, Trámites — cada una con sus anunciantes naturales.

### 5. Content War Room

Plan de producción del día. No dice "publicar noticias": dice qué pieza, de qué tipo y por qué.

```
1 Nacional profunda      (600+ palabras, contexto y consecuencia)
1 Internacional explicada (impacto en Nicaragua)
1 Tecnología útil        (resuelve algo concreto)
1 Deportes               (protagonistas nicaragüenses)
1 Suceso                 CONDICIONAL — solo con interés público real
```

Las prioridades **se recalculan** contra el Balance Engine: una categoría deficitaria sube a crítica; una excedida baja a mínima.

### 6. Home Quality Control

Audita la portada **tal como la produce el Home Ranking Engine**, sin modificarlo.

Reglas:
- Ninguna categoría supera el **30%** de la portada
- Las primeras **6 posiciones** son vitrina de marca: Nacionales, Economía, Ciencia, Tecnología, Deportes, Cultura
- Nunca 2+ Sucesos en el top 3
- Alerta si faltan 4+ categorías de marca

### 7. Distribution Command

Cinco canales, **cinco textos distintos**. Copiar el mismo mensaje es la forma más rápida de que ninguno funcione.

| Canal | Ángulo | Ventana |
|---|---|---|
| Facebook | Conversación, cierra con pregunta | 12:00 y 19:00 |
| Telegram | Alerta seca, dato primero | inmediato |
| WhatsApp | Reenviable, sin hashtags | 07:00 y 18:00 |
| Newsletter | Contexto: por qué importa hoy | 06:30 |
| Google Discover | Titular declarativo, imagen 1200px+ | inmediato |

Cada texto es copiable con un clic.

### 8. Content Opportunity Hunter

Cruza la demanda estructural de búsqueda nicaragüense contra lo que el medio cubre.

Temas rastreados: costo de vida, salario mínimo, combustible, trámites, turismo, educación, tipo de cambio y remesas, migración, salud, energía.

**Criterio estricto**: "cubierto" exige una **pieza permanente**, no una mención suelta.

### 9. Business Health

Una sola pregunta: *¿qué tan empresa editorial es Nicaragua Informate hoy?*

| Pilar | Peso |
|---|---|
| Google | 1.3 |
| Contenido | 1.2 |
| Ingresos potenciales | 1.1 |
| Audiencia | 1.0 |
| Marca | 1.0 |

Etapas: `proyecto` → `medio en crecimiento` → `medio consolidado` → `empresa editorial`

Siempre nombra el **cuello de botella** concreto y el próximo hito.

---

## 4. Verificación

| Check | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ limpio |
| `npm run build` | ✅ `/admin/nios` compila como ruta dinámica |
| `npm run test:merge` | ✅ **113/113** (71 previos + 32 nuevos + 10 de SEO efectivo) |
| ESLint `--max-warnings 0` | ✅ |
| MENI / EOS / Home Ranking | ✅ sin modificaciones |

### Cobertura de los 32 tests nuevos

Invariantes garantizadas:
- El CEO nunca recibe más de 5 decisiones
- No se repite el mismo eje de decisión
- Todos los scores permanecen en 0-100
- El reporte es **determinista**: misma entrada, misma salida
- Un archivo vacío no rompe ningún módulo
- Los 5 canales de distribución generan textos **distintos entre sí**

---

## 5. Nota de seguridad

`/admin/nios` **no tiene autenticación de página**. Sigue el patrón de las demás rutas bajo `/admin/*`, que tampoco la tienen: `middleware.ts` solo protege `/api/admin/*`.

Mitigación aplicada: `robots: { index: false, follow: false }`.

**Recomendación pendiente**: añadir un `app/admin/layout.tsx` con verificación de sesión que cubra todas las rutas administrativas de una vez. Es un cambio transversal a `/admin` y queda fuera del alcance de esta fase.

---

## 6. Estado

Fase 1 completa. Al abrir `/admin/nios`, un administrador entra a un centro de mando que responde qué hacer hoy, dónde está el negocio y qué está frenando a la marca — con trazabilidad hasta el motor que originó cada afirmación.
