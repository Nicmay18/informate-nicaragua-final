# Dashboard Editorial Inteligente V1

**Proyecto:** Nicaragua Informate  
**Estado:** Backlog  
**Versión objetivo:** Post Editor IA V4.1 LTS

## Objetivo

Crear un Dashboard Editorial que ayude al Director Editorial a tomar decisiones basadas en datos reales.

- No evalúa artículos.
- No reemplaza al Editor IA.
- No analiza contenido.

Su única función es responder:

> **¿Qué está funcionando en la redacción?**

## Principios

El dashboard nunca calculará información. Solo visualizará datos existentes provenientes de:

- Editor IA
- Observatorio Editorial
- Google Analytics
- Search Console
- Google News
- Discover
- Facebook Insights
- AdSense
- Base de datos del CMS

No duplicará lógica del motor.

## Arquitectura

```
CMS
  ↓
Editor IA
  ↓
Observatorio
  ↓
Analytics
  ↓
Dashboard Editorial
```

## Menú

- Dashboard
- Noticias
- Editor IA
- Observatorio
- Analytics
- Dashboard Editorial

## Sección 1 — Estado de la Redacción

Mostrar:

- Noticias publicadas hoy
- Noticias esta semana
- Noticias este mes
- Noticias pendientes
- Tiempo promedio hasta publicación
- Promedio de palabras
- Noticias actualizadas
- Noticias archivadas

## Sección 2 — Calidad Editorial

- Distribución por veredicto
  - ★★★★★
  - ★★★★☆
  - ★★★☆☆
  - Breve
  - Descartadas
- Promedio de score editorial
- Promedio por categoría

## Sección 3 — Rendimiento por categoría

Tabla:

| Categoría | Noticias | Vistas | CTR | Tiempo lectura | Discover | RPM |
|-----------|----------|--------|-----|----------------|----------|-----|
| Sucesos   |          |        |     |                |          |     |
| Deportes  |          |        |     |                |          |     |
| Economía  |          |        |     |                |          |     |
| Tecnología|          |        |     |                |          |     |

## Sección 4 — Observatorio Editorial

Mostrar:

- **Coincidencia Editor IA vs Editor**
  - Coincidencias: 94%
  - Discrepancias: 6%
- **Top motivos**
  - Falta contexto
  - Sin seguimiento
  - Fuente débil
  - Poca utilidad
  - Categoría incorrecta

## Sección 5 — Top Noticias

Ranking automático:

- Más vistas
- Más tiempo leído
- Más compartidas
- Más comentadas
- Más tráfico Discover
- Más tráfico Google
- Más tráfico Facebook

## Sección 6 — Google Discover

Mostrar:

- Noticias enviadas
- Noticias indexadas
- CTR
- Impresiones
- Clicks
- Tiempo promedio

## Sección 7 — Google News

Mostrar:

- Noticias indexadas
- Clicks
- CTR
- Consultas
- Posición media

## Sección 8 — Facebook

Mostrar:

- Alcance
- Interacciones
- CTR
- Compartidos
- Comentarios
- Reacciones

## Sección 9 — AdSense

Mostrar:

- RPM
- Ingresos diarios
- Ingresos semanales
- Ingresos mensuales
- Páginas monetizadas
- CTR anuncios

## Sección 10 — Productividad

- Tiempo promedio para escribir
- Tiempo promedio para revisar
- Tiempo promedio para publicar
- Notas por editor
- Notas por categoría

## Sección 11 — Tendencias

Gráficos:

- Noticias publicadas — Últimos 30 días
- CTR — Últimos 30 días
- RPM — Últimos 30 días
- Discover — Últimos 30 días

## Sección 12 — Alertas

Mostrar automáticamente:

- Categorías abandonadas
- Noticias sin actualizar
- Caída de tráfico
- Caída de CTR
- Aumento de discrepancias
- Descenso de RPM

## Sección 13 — Inteligencia Editorial

Responder automáticamente:

- ¿Qué categoría creció esta semana?
- ¿Qué categoría cayó?
- ¿Qué tipo de nota genera más tiempo de lectura?
- ¿Qué tipo de nota produce más Discover?
- ¿Qué longitud funciona mejor?
- ¿Qué horario obtiene mejores resultados?
- ¿Qué editor tiene mejor rendimiento?
- ¿Qué sugerencias del Editor IA realmente mejoran el tráfico?

## Sección 14 — Objetivos

Configurables:

- 500 noticias
- 1000 noticias
- CTR 6%
- RPM $2
- Tiempo lectura 3 minutos
- Discover 25%
- Coincidencia Editor IA 95%

Mostrar progreso.

## Tecnologías

### Frontend

- React
- Next.js
- Tailwind
- Recharts

### Backend

- Firestore
- Google Analytics 4
- Search Console API
- AdSense API
- Facebook Graph API

## Reglas

El Dashboard Editorial:

- ❌ No analiza artículos.
- ❌ No modifica el Editor IA.
- ❌ No ejecuta reglas editoriales.
- ❌ No recalcula puntuaciones.
- ✅ Solo consume métricas ya existentes.
- ✅ Solo presenta información.
- ✅ Ayuda a tomar decisiones editoriales.

## Criterios para iniciar el desarrollo

No comenzar este proyecto hasta cumplir todos estos requisitos:

- ✅ Editor IA V4.1 LTS estable.
- ✅ Más de 500 noticias publicadas.
- ✅ Al menos 90 días de datos en Google Analytics y Search Console.
- ✅ Observatorio Editorial con suficientes decisiones registradas para detectar patrones.
- ✅ Integraciones disponibles con Analytics, Search Console, AdSense y Facebook.

## Nota

Este documento tiene una ventaja importante: no depende del Editor IA. Aunque en el futuro cambies de V4.1 LTS a V5 o V6, el Dashboard Editorial seguirá siendo válido porque consume métricas del ecosistema, no la lógica interna del motor. Eso lo convierte en un proyecto independiente y sostenible a largo plazo.
