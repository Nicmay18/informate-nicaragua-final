# Auditoría de la fórmula final MENI V3

## 1. Fórmula exacta

La fórmula final se encuentra en `lib/meni/editorial-brain/index.ts` dentro de `calcularScoreEjecutivoV2()`:

```
valorEditorial =
  (utilidad   * w.utilidad    +
   profundidad * w.profundidad +
   originalidad * w.originalidad +
   eeat       * w.eeat        +
   aportePropio * w.aportePropio +
   adnNI      * w.adnNI) / totalDim

scoreFinal = round(base * blend.base + valorEditorial * blend.valor)
```

Pesos (`lib/meni/scoring.ts`):

| Dimensión | Peso |
|---|---|
| utilidad | 0.10 |
| profundidad | 0.20 |
| originalidad | 0.20 |
| eeat | 0.20 |
| aportePropio | 0.05 |
| adnNI | 0.25 |
| **Suma** | **1.00** |

Blend:

| Componente | Peso |
|---|---|
| base (V1) | 0.50 |
| valorEditorial | 0.50 |

`base` proviene de `calcularScoreEjecutivo()`, que empieza en 100 y resta los puntos perdidos por reglas estructurales/éticas. `bloquear` limita el score a 74 si hay problemas graves.

## 2. Pruebas controladas

Supuestos fijos para aislar el efecto de `utilidad`, `profundidad` y `EEAT`:

- `base = 100` (sin penalizaciones V1)
- `originalidad = 100`
- `aportePropio = 100`
- `adnNI = 100`
- `bloquear = false`

| Caso | Utilidad | Profundidad | EEAT | valorEditorial | scoreFinal |
|---|---|---|---|---|---|
| A | 100 | 50 | 50 | 80 | 90 |
| B | 50 | 100 | 50 | 85 | 93 |
| C | 50 | 50 | 100 | 85 | 93 |
| D | 100 | 100 | 100 | 100 | 100 |
| E | 50 | 50 | 50 | 75 | 88 |

### Cálculo paso a paso (Caso A)

```
valorEditorial =
  (100*0.10 + 50*0.20 + 50*0.20 + 100*0.20 + 100*0.05 + 100*0.25) / 1.00
                = 10 + 10 + 10 + 20 + 5 + 25 = 80

scoreFinal = round(100*0.50 + 80*0.50) = round(90) = 90
```

## 3. Sensibilidad del score ante cada variable

Impacto de subir una variable de 50 a 100 manteniendo las otras dos en 50 y el resto en 100:

| Variable | Δ puntos en la variable | Δ valorEditorial | Δ scoreFinal |
|---|---|---|---|
| utilidad | +50 | +5 (0.10 * 50) | +2.5 ≈ **+2** |
| profundidad | +50 | +10 (0.20 * 50) | +5.0 ≈ **+5** |
| EEAT | +50 | +10 (0.20 * 50) | +5.0 ≈ **+5** |

La sensibilidad relativa es:

- `profundidad` y `EEAT`: 1 unidad de cambio produce 0.10 puntos de `scoreFinal` (tras el blend).
- `utilidad`: 1 unidad de cambio produce 0.05 puntos de `scoreFinal`.

## 4. Mayor influencia

Con el blend actual, la variable con mayor peso directo es `adnNI` (0.25), seguida de `profundidad`, `originalidad` y `EEAT` (0.20 cada una), y finalmente `utilidad` (0.10).

Si solo se compara `utilidad`, `profundidad` y `EEAT` en las pruebas controladas:

- **Profundidad y EEAT tienen el doble de influencia que utilidad.**
- Caso B y Caso C alcanzan 93, mientras Caso A solo llega a 90.
- Caso D (todas 100) es el único que llega a 100.

## 5. Efecto de arrastre

El arrastre se manifiesta en dos niveles:

### 5.1. Arrastre de `base` (V1)

Con `base = 100`, el score final nunca puede bajar de 50 aunque `valorEditorial` sea 0. En Caso E (`valorEditorial = 75`), el score es 88, lo que significa que una dimensión con score 50 pierde solo 12 puntos con respecto al máximo, no 50.

| base | valorEditorial (Caso E) | scoreFinal |
|---|---|---|
| 100 | 75 | 88 |
| 80 | 75 | 78 |
| 60 | 75 | 68 |
| 50 | 75 | 63 |

Cuanto más alto es `base`, más arrastra el score hacia arriba y amortigua el impacto de una dimensión débil.

### 5.2. Arrastre entre dimensiones del `valorEditorial`

Cada dimensión se promedia con las demás. Si una dimensión es 0 y el resto 100, el `valorEditorial` sigue siendo alto:

```
utilidad=0, profundidad=100, eeat=100, originalidad=100, aportePropio=100, adnNI=100
valorEditorial = (0 + 20 + 20 + 20 + 5 + 25) = 90
scoreFinal = 95
```

Una `utilidad` de 0 reduce el score en solo 5 puntos. Lo mismo ocurre con `EEAT` o `profundidad` por separado. Esto genera **falsos positivos**: una noticia con una dimensión deficiente puede seguir marcando 95.

## 6. Propuesta de ajuste conceptual (sin cambiar pesos todavía)

Dado el arrastre observado, se propone evaluar conceptualmente una de estas alternativas antes de tocar los pesos:

### Opción A: Factor de piso por dimensión crítica

Si `utilidad`, `profundidad` o `EEAT` caen por debajo de 60, aplicar un factor multiplicador a `valorEditorial` basado en la dimensión más baja:

```
valorEditorialAjustado = valorEditorial * (min(utilidad, profundidad, eeat) / 100)
```

Esto mantiene los pesos pero evita que una dimensión en 0 quede absorbida por las otras.

### Opción B: Mínimo compuesto

El `scoreFinal` no puede superar el valor de la dimensión más baja multiplicado por un factor (por ejemplo, `scoreFinal ≤ minDim + 20`). De esta forma, una noticia con `profundidad = 40` no podría obtener más de 60-65, independientemente del resto.

### Opción C: Curva no lineal en el blend

Aplicar una curva sigmoide o logarítmica a `valorEditorial` antes del blend, de modo que los cambios en el rango 40-60 tengan más impacto que en el rango 80-100. Esto aumentaría la discriminación sin tocar pesos.

### Recomendación inmediata

La **Opción A** es la más simple de implementar y probar: mantiene intactos `MENI_V2_WEIGHTS`, `MENI_V2_BLEND` y el resto del sistema, pero elimina el arrastre excesivo haciendo que la dimensión más débil limite el `valorEditorial`.

## 7. Conclusión

- La fórmula es lineal y transparente, pero el **blend 50/50 con `base`** y el **promedio ponderado de `valorEditorial`** generan un fuerte efecto de arrastre.
- `profundidad` y `EEAT` tienen el doble de impacto que `utilidad`.
- Una sola dimensión baja no castiga suficientemente el score final.
- La corrección conceptual más directa es introducir un **factor de piso o una regla de mínimo** que evite que el promedio oculte debilidades críticas.
