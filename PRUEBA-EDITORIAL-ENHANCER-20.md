# PRUEBA EDITORIAL ENHANCER — 20 NOTICIAS REALES

## Metodología

1. Se seleccionaron 20 noticias reales de Firebase: 5 de MENI alto, 10 de MENI medio y 5 de MENI bajo.
2. Se ejecutó `runMeniAsync` para obtener el diagnóstico técnico.
3. Se aplicó `editorialEnhancerAction` para generar un asistente editorial práctico.
4. Se clasificó cada noticia según si mejora solo con estructura o requiere investigación periodística.
5. No se inventaron datos. No se evaluó por cantidad de palabras.

## Distribución de la muestra

- Total: 19
- Alto: 5 | Medio: 10 | Bajo: 4
- Categorías: Deportes, Sucesos, Espectáculos, Tecnología, Nacionales, Internacionales

## Pregunta 1 — ¿Qué porcentaje mejora solo con estructura?

- 0.0% mejora solo con estructura (0 de 19).
- 0.0% necesita estructura e investigación (0 de 19).
- 36.8% está lista sin cirugía (7 de 19).

## Pregunta 2 — ¿Qué porcentaje requiere investigación real?

- 78.9% requiere investigación periodística adicional (15 de 19).
- 78.9% requiere solo investigación, sin estructura suficiente (15 de 19).

## Pregunta 3 — ¿Qué faltantes aparecen más?

- Falta investigar: Explicar: Qué ocurrió en el exterior; Contexto internacional necesario: 7 noticias
- Cifra verificable: 4 noticias
- Dato histórico del evento: 3 noticias
- Norma aplicable: 2 noticias
- Efecto práctico para el lector: 2 noticias

## Pregunta 4 — ¿Qué categorías tienen más oportunidad?

| Categoría | Noticias | Oportunidades de estructura |
| ---- | ---- | ---- |
| Internacionales | 5 | 3 |
| Deportes | 5 | 2 |
| Sucesos | 4 | 2 |
| Espectáculos | 1 | 2 |
| Nacionales | 3 | 2 |
| Tecnología | 1 | 0 |

## Pregunta 5 — ¿Cuáles tienen potencial para Google?

Criterio: score MENI >= 80 y pocas secciones pendientes (<= 4).

- **noruega-vuelve-a-octavos-del-mundial-tras-28-anos-de** — score 100, categoría Deportes, prioridad Baja.
- **investigan-ataque-en-el-riguero-que-hirio-a-nino-de-10-ano** — score 100, categoría Sucesos, prioridad Baja.
- **agenda-cultural-eventos-en-managua-del-20-al-30-de-junio** — score 100, categoría Espectáculos, prioridad Alta.
- **tecnologia-global-ia-agentica-lidera-cambios-en-2026** — score 98, categoría Tecnología, prioridad Baja.
- **parque-de-la-familia-en-esteli-reabre-tras-millonaria-inversion** — score 98, categoría Nacionales, prioridad Baja.

## Secciones recomendadas más frecuentes

- Datos comparativos: 4 noticias
- Importancia histórica: 3 noticias
- Marco legal: 2 noticias
- Impacto ciudadano: 2 noticias
- Contexto: 1 noticias

## Ejemplos de asistencia editorial

### Caso 1: noruega-vuelve-a-octavos-del-mundial-tras-28-anos-de

- **Categoría:** Deportes
- **Score MENI:** 100
- **Diagnóstico:** La noticia "Noruega vuelve a octavos del Mundial tras 28 años de ausencia" responde 4 de 4 preguntas clave para la categoría Deportes. Tiene elementos sólidos, pero falta: . Prioridad editorial: Baja.
- **Prioridad:** Baja

**Acciones editoriales:**

**Mejora de lead:**
```text
Lead actual: "La selección de Noruega derrotó 2-1 a Costa de Marfil este martes 30 de junio en los dieciseisavos de final de la Copa Mundial 2026 en el AT&T Stadium de Arlington , Texas, Estados Unidos.".

Mejora posible (usando solo datos confirmados):
"[Qué pasó] en [dónde] el [cuándo]. [Quién] está involucrado. Esto importa porque [por qué importa]."

Rellenar los corchetes con datos verificables de la noticia. No completar si no se conoce el dato.
```

**Mejora de estructura:**
```html
<h2>Qué ocurrió</h2>
<p>[resumen del hecho con datos confirmados]</p>
```

### Caso 2: investigan-ataque-en-el-riguero-que-hirio-a-nino-de-10-ano

- **Categoría:** Sucesos
- **Score MENI:** 100
- **Diagnóstico:** La noticia "Investigan ataque en El Riguero que hirió a niño de 10 año." responde 4 de 5 preguntas clave para la categoría Sucesos. Tiene elementos sólidos, pero falta: ¿Qué ley o normativa aplica?. Prioridad editorial: Baja.
- **Prioridad:** Baja

**Acciones editoriales:**
- Verificar: Falta investigar: ¿Qué ley o normativa aplica?
- Conseguir: Falta conseguir: Norma aplicable
- Cuidado: Si se agrega esta sección, evitar: No interpretar la ley sin asesoría ni fuente

**Mejora de lead:**
```text
Lead actual: "La herida de un niño de 10 años convirtió un enfrentamiento ocurrido ayer en el barrio El Riguero , en Managua, en un caso que ahora busca explicar algo más que el momento del disparo: cómo una situación entre adultos terminó afectando a una persona que no formaba parte del conflicto.".

Mejora posible (usando solo datos confirmados):
"[Qué pasó] en [dónde] el [cuándo]. [Quién] está involucrado. Esto importa porque [por qué importa]."

Rellenar los corchetes con datos verificables de la noticia. No completar si no se conoce el dato.
```

**Mejora de estructura:**
```html
<h2>Qué ocurrió</h2>
<p>[resumen del hecho con datos confirmados]</p>
<h2>Marco legal</h2>
<p>Requiere investigación periodística sobre: [dato faltante].</p>
```

### Caso 3: agenda-cultural-eventos-en-managua-del-20-al-30-de-junio

- **Categoría:** Espectáculos
- **Score MENI:** 100
- **Diagnóstico:** La noticia "Agenda cultural: Eventos en Managua del 20 al 30 de junio" responde 2 de 4 preguntas clave para la categoría Espectáculos. Carece de contexto esencial; falta: ¿A quién afecta esta decisión y cómo?; ¿Hay cifras o comparaciones que permitan dimensionar el tema?. Prioridad editorial: Alta.
- **Prioridad:** Alta

**Acciones editoriales:**
- Verificar: Falta investigar: ¿Por qué importa esta noticia?
- Verificar: Falta investigar: ¿Qué consecuencias tiene?
- Conseguir: Falta conseguir: Contexto general
- Conseguir: Falta conseguir: Consecuencia verificable
- Cuidado: Si se agrega esta sección, evitar: No inventar importancia
- Cuidado: Si se agrega esta sección, evitar: No extrapolar sin evidencia

**Mejora de lead:**
```text
Lead actual: "La última semana de junio concentra una programaciónera artística diversa en la capital, con el Teatro Nacional Rubén Darío como eje principal de las presentaciones.".

Mejora posible (usando solo datos confirmados):
"[Qué pasó] en [dónde] el [cuándo]. [Quién] está involucrado. Esto importa porque [por qué importa]."

Rellenar los corchetes con datos verificables de la noticia. No completar si no se conoce el dato.
```

**Mejora de estructura:**
```html
<h2>Qué ocurrió</h2>
<p>[resumen del hecho con datos confirmados]</p>
<h2>Contexto</h2>
<p>Requiere investigación periodística sobre: [dato faltante].</p>
<h2>Consecuencias</h2>
<p>Requiere investigación periodística sobre: [dato faltante].</p>
```


## Conclusión

`editorialEnhancerAction` no escribe noticias largas. Detecta qué preguntas no responde el texto y propone una estructura para que el periodista complete con información verificable. La mejora real depende de investigación, no de palabras vacías.
