# Nicaragua Informate — Home Editorial Balance Report v2.0

## Problema encontrado

La portada estaba técnicamente operativa, pero la jerarquía visual y el ranking interno favorecían excesivamente a la categoría **Sucesos**.

Esto generaba una percepción dominante de "accidentes y tragedias" en detrimento de la imagen de medio nacional completo, profesional y monetizable.

## Archivos modificados

- `lib/home-ranking.ts` — pesos de ranking y selección de destacado.
- `lib/diversify.ts` — prioridad estratégica para contenido útil/evergreen.
- `lib/home-balance.ts` — nuevo módulo de balance, hero, diversidad y salud del home.
- `components/HomePagePro.tsx` — distribución de secciones y deduplicación.
- `app/page.tsx` — integración del Home Diversity Check.
- `app/home-redesign.css` — eliminación de contenido HTML duplicado en Última hora.

## Lógica aplicada

### Pesos orientativos de categoría

- Nacionales: 40%
- Deportes: 15%
- Internacionales: 15%
- Sucesos: 15%
- Tecnología: 10%
- Espectáculos / Cultura: 5%

### Fórmula de ranking (`lib/home-ranking.ts`)

El score final pondera:

- `actualidad` (20%)
- `interés público` (20%): nacional + lecturas
- `calidad MENI` (25%)
- `categoría estratégica` (20%)
- `potencial SEO` (10%)
- penalización ligera a noticias de luto

### Reglas del home

1. **Hero**: selección estratégica que premia Nacionales/Tecnología/Deportes, penaliza luto y favorece calidad MENI alta.
2. **En portada**: máximo 1 noticia por categoría (4 items).
3. **Última hora**: 5 más recientes, máximo 2 de Sucesos, sin repetir el hero.
4. **Últimas noticias**: 3 items, máximo 1 por categoría (40%).
5. **Contenido útil**: prioridad a Economía, Trámites, Migración, Turismo, Servicios, Costos, Calendarios.
6. **Tope de categoría en ranking**: máximo 4 de 10 noticias (40%) por categoría en el top.
7. **Deduplicación**: control central de IDs usados en `HomePagePro`.
8. **Home Diversity Check**: validación de presencia de categorías y alerta si alguna supera el 70%.

## Comparación antes / después

| Aspecto | Antes | Después |
|--------|-------|---------|
| Peso Sucesos en ranking | Alto por tráfico | Equilibrado al 15% objetivo |
| Hero | Primera noticia por score bruto | Noticia estratégica, evita luto |
| En portada | Hasta 3 por categoría | Máximo 1 por categoría |
| Últimas noticias | Sin tope explícito | Máximo 1 por categoría |
| Última hora | 5 cronológicas sin filtro | 5 cronológicas, máximo 2 Sucesos |
| Contenido útil | Por categoría solamente | Prioridad estratégica |
| HTML duplicado | Última hora renderizada 3 veces | Renderizada una sola vez |

## Riesgos

- **Caída temporal de CTR** si los usuarios esperaban noticias de Sucesos en el hero.
- **Pocos Espectáculos/Cultura** si el volumen de notas es bajo; el fallback mantiene la sección solo cuando hay mínimos.
- **Percepción de menor novedad** si el hero no es el más clickeado; se compensa con una sección "Últimas noticias" visible.

## Recomendaciones futuras

1. Conectar Google Search Console para medir impacto en impresiones por categoría.
2. Medir CTR del hero y las secciones tras 7 días.
3. Ajustar los pesos de categoría con datos reales de tráfico y revenue.
4. Integrar `Competitor Intelligence` de NIOS para comparar cobertura de categorías.
5. Evaluar agregar un bloque editorial "Contenido útil" prominente en la parte superior de la segunda pantalla.
