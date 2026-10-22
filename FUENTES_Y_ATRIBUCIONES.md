# FUENTES_Y_ATRIBUCIONES.md — defectos de atribución y fuentes verificadas

## 1. Causa raíz de atribuciones vagas — CORREGIDO (rama)

`public/panel.html` contenía mecanismos que generaban/persistían contenido no editorial:
- Inyección de párrafos "Fuentes cercanas al lugar de los hechos confirmaron…" y citas de especialistas inexistentes con `updateDoc` directo (saltaba MENI, Supervisor y contentHash).
- Regla "anti-palabras sensibles" (AdSense): "muere/fallecido/homicidio"→"afectado" — fuente del eufemismo que corrompió ~30+ artículos.
- **Eliminados en `fix/estabilizacion-forense`.** En el corpus quedó el residuo ("autoridades competentes" en 50 docs, párrafos-plantilla en 18+).

## 2. Patrones de atribución en el corpus (matriz por artículo)

- `fuentesIdentificables` por doc: en `AUDITORIA_EDITORIAL_CORPUS.csv` y `FORENSIC_ARTICLE_AUTOPSY.json`.
- Atribuciones institucionales reales (Policía Nacional, Bomberos, INTUR, EFE, AP, USGS, Banco Central, alcaldías, agencias) — uso general correcto.
- Marcadores `contentReference[oaicite]` en 9 docs — **residuo en DB, NO visible** (`cleanArticleBody` los elimina en render; verificado en HTML vivo).

## 3. Fuentes verificadas externamente (muestra)

| Afirmación del medio | Verificación externa | Resultado |
|---|---|---|
| Sismos Venezuela 24-jun-2026 (mag. 7.x, miles de muertos) | AP/BBC | CONFIRMADO |
| iPhone Duo (Apple, 9-sep-2026) | cobertura del evento | CONFIRMADO (único defecto: marcador oaicite) |
| Serie Pomares (cobertura "duplicada") | calendario liga | CONFIRMADO (secuencial legítimo, falso positivo) |
| Accidente-laboral: López Pérez murió en el lugar | doc hermano del mismo medio | CONFIRMADO internamente |
| Cifra 4+1 en accidentes-viales | sin fuente externa accesible | **NO VERIFICADO** |
| "4.3 millones" en /publicidad | sin respaldo publicado | **NO VERIFICADO** |

## 4. Defectos de atribución registrados

- Ninguna noticia inventa citas con nombre+foto de experto (los párrafos fabricados eran genéricos y la vía fue eliminada).
- "Reporte propio" sin evidencia de trabajo original: las guías y notas locales citan fuentes institucionales; el patrón de "periodismo de primera mano" no está documentado como engaño sistemático.
- Enlaces a fuentes: el corpus usa pocos enlaces externos a fuente primaria — mejora recomendada (P2 editorial), no defecto grave.
