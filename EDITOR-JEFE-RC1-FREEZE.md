# Instrucción de Congelamiento — Motor Editorial RC1

**Estado:** Candidate Release 1 (RC1)  
**Fecha:** 2026-07-12  
**Commit:** f293894

## Regla absoluta

El Motor Editorial V2 (`lib/editor-jefe/engine.ts`) queda **congelado**.

Ningún cambio funcional podrá realizarse antes de alcanzar **500 notas reales sin contradicciones** y crear el tag `v1.0-editor-jefe-estable`.

## Qué está congelado

- Lógica de evidencia (`evaluarEvidencia`)
- Clasificación de tipo de nota (`clasificarTipoNotaV2`)
- Reglas de decisión editorial (`decidirEditorialV2`)
- Verificación de consistencia (`verificarConsistencia`)
- Puntuaciones, umbrales y prioridades

## Cuándo sí se permite modificar

1. **Contradicción real detectada en producción** y documentada en `auditoria-contradicciones-v2.log.jsonl`.
2. **Fix de seguridad** que impida la ejecución del motor.
3. **Cambio aprobado mediante RFC** con caso de prueba asociado.

## Proceso RFC obligatorio

Toda modificación requiere un documento `RFC-XXXX.md` con:

1. **Problema** — ¿qué se quiere resolver?
2. **Regla nueva** — texto exacto de la regla.
3. **Qué comportamiento cambia** — decisiones, puntuaciones o salidas afectadas.
4. **Qué comportamiento NO cambia** — garantías de estabilidad.
5. **Casos de prueba** — mínimo A, B y C, con resultado esperado.
6. **Impacto en registro histórico** — ¿afecta evaluaciones previas?

El RFC debe ser revisado antes de tocar `engine.ts`.

## Qué NO está congelado

Módulos que consumen las decisiones del RC1 sin alterarlas:

- `lib/editor-jefe/auditor.ts` (presentación del Modo Auditor)
- `lib/editor-jefe/confianza.ts` (Matriz de Confianza)
- `lib/editor-jefe/deriva.ts` (Detector de Deriva Editorial)
- `registrar-evaluaciones-editorial.ts` (registro y monitoreo)
- Futuro **Motor Editorial V3** (paquete editorial y distribución)

## Meta

- **Objetivo:** 500 notas reales evaluadas sin contradicciones.
- **Contador actual:** 187/500.
- **Siguiente milestone:** tag `v1.0-editor-jefe-estable`.
- **Después del tag:** eliminación del código legacy y inicio del Motor Editorial V3.

## Comando de validación diaria

```bash
npx tsx registrar-evaluaciones-editorial.ts
```

El script es idempotente. Solo procesa notas nuevas y ejecuta el detector de deriva sobre todo el historial.
