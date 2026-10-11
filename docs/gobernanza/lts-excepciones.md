# Excepciones al congelamiento Editor IA V4.1 LTS

El motor `editor-jefe-v4` está congelado (README § LTS). Toda modificación del
motor requiere una **excepción LTS** documentada. La regla de oro existente:

> Solo se modifica cuando un mismo patrón aparece en **al menos 10 artículos
> reales** y existe evidencia de que la corrección mejora el sistema sin
> perjudicar otras categorías.

## Qué es una excepción válida

| Tipo | Definición | Evidencia mínima | Aprobación |
|---|---|---|---|
| **Corrección crítica** | Defecto demostrable del código (doble conteo, regla que no se aplica como está escrita, bug). Sin evidencia de 10 casos requerida — la corrección se justifica por corrección del código, no por cambio de criterio. | Reproducción + causa raíz + test que falla antes | Editor Jefe humano |
| **Cambio operativo** | Infra/deploy/config que no toca reglas editoriales. | Diff + validación de build/tests | Admin técnico |
| **Mejora funcional LTS** | Cambiar umbrales, pesos, perfiles, prompts o reglas del motor. | **≥10 artículos reales** con el mismo patrón + auditoría documentada + golden set antes/después | Editor Jefe humano + owner |

La regla de 10 casos **no es autorización automática**: es la condición mínima
para proponer la excepción; la aprobación sigue siendo humana.

## Plantilla de excepción

```markdown
## Excepción LTS — <título>
- Tipo: [corrección crítica | cambio operativo | mejora funcional]
- Fecha / Autor / PR:
- Causa raíz (evidencia reproducible, no output de MENI):
- Patrón observado (≥10 artículos reales, si aplica): lista de slugs/IDs
- Alcance: archivos/módulos afectados
- Reglas intactas: qué se garantiza que NO cambia
- Tests: antes/después + golden set afectado
- Riesgos y plan de reversión:
- Aprobado por / fecha:
```

## Checklist por cambio al motor

- [ ] ¿El cambio es del motor (`lib/meni`, `lib/editorial`, `lib/supervisor`)?
      → si no, no requiere excepción LTS.
- [ ] ¿Se puede demostrar el defecto sin depender de lo que MENI dice de sí
      mismo?
- [ ] ¿Existe test que falla con el código actual y pasa con el fix?
- [ ] ¿El golden set mantiene aprobados→PUBLICAR e incompletos→rechazados?
- [ ] ¿La auditoría de 100 noticias se re-ejecutó y los resultados se adjuntan?
- [ ] ¿El cambio está documentado en CHANGELOG + excepción registrada?

## Registro

Cada excepción aprobada se anexa en `CHANGELOG.md` bajo la release
correspondiente y en este directorio como
`lts-excepciones/YYYY-MM-DD-<slug>.md`.
