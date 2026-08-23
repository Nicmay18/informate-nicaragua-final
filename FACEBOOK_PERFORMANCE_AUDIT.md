# Facebook Performance Audit

## 1. Atribución correcta

| Dato | Valor | Clasificación |
| --- | --- | --- |
| `23,952` | FACEBOOK_VIEWS | `USER_EVIDENCE` |

**Regla:** El valor `23,952` solo puede usarse dentro del universo `Facebook Performance`. No es tráfico total del sitio.

## 2. Búsqueda de referencias

Se ejecutó `rg "23952|23\.952|23,952" .` en el repositorio local. Resultado:

| Archivo | Aparece como | Clasificación | Acción |
| --- | --- | --- | --- |
| `TRAFFIC_23952_FORENSIC.md` | 23,952 como tráfico del sitio a verificar | `INCORRECT` | Corregir en Misión 6; ahora `FACEBOOK_VIEWS` |
| `ARTICLE_UNIVERSE_FORENSIC.md` | 23,952 como tráfico del sitio a verificar | `INCORRECT` | Corregir; ahora `FACEBOOK_VIEWS` |
| `CEO_AGENT_DATA_VALIDATION_FINAL.md` | 23,952 como tráfico a verificar | `INCORRECT` | Corregir; ahora `FACEBOOK_VIEWS` |
| `CEO_EDITORIAL_AUTOPSY_307.md` | 18,567 (total local) | `CORRECT` para el snapshot | No se referenciaba 23,952 como base en el texto final |
| `FORENSIC_CEO_AUDIT.md` | 23,952 mencionado como reportado por usuario, pero no verificado | `AMBIGUOUS` | Corregir a `FACEBOOK_VIEWS` |

## 3. Datos disponibles

No se encontró un archivo o colección local que desagregue `23,952` por artículo, publicación, hora o categoría. Solo existe el agregado.

| Atributo | Disponible | Evidencia |
| --- | --- | --- |
| Total Facebook views | Sí (agregado 23,952) | Usuario |
| Facebook views por artículo | NO | `NO_DATA` |
| Facebook clicks | NO | `NO_DATA` |
| Facebook reach | NO | `NO_DATA` |
| Facebook engagement | NO | `NO_DATA` |
| Publicaciones vinculadas | NO | `NO_DATA` |
| Fecha / hora del periodo | NO | `NO_DATA` |

## 4. Conclusión

- `23,952` queda aislado como `FACEBOOK_VIEWS`.
- No se puede hacer `TOP 20 Facebook` sin datos por publicación.
- No se puede comparar Facebook con Google/GA4/GSC porque son universos distintos.
- Se requiere una colección o exportación de Facebook para desagregar.
