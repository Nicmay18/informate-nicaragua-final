# Auditoría Editor IA V4.1 LTS — 100 noticias reales

Objetivo: medir al **Editor IA V4.1 LTS** con noticias reales **sin modificar el motor**. Se busca consistencia, no perfección.

## Criterios de evaluación

Para cada noticia, responder **Sí / No / Discutible**.

| Pregunta | Sí | No | Discutible |
|---|---|---|---|
| ¿Clasificó bien la categoría? | | | |
| ¿El tipo de artículo fue correcto? | | | |
| ¿La decisión de portada coincidió con el editor humano? | | | |
| ¿Las razones fueron útiles? | | | |
| ¿Las mejoras sirvieron? | | | |
| ¿Hubo alguna recomendación absurda? | | | |
| ¿El editor terminó publicando? | | | |

## Umbrales para declarar Editor IA V4.1 LTS estable

- **≥ 92 decisiones correctas**: producto serio, congelar motor.
- **5-10 discutibles**: aceptable, documentar y observar.
- **≤ 3 claramente incorrectas**: aceptable si no se repite el mismo patrón.
- **> 10 incorrectas o un patrón repetido ≥ 10 veces**: no declarar estable; investigar antes de tocar el motor.

## Regla de oro

No se modifica el motor por una sola noticia fallida.

> Solo se modifica `lib/editor-jefe-v4/` cuando un mismo patrón aparece en al menos 10 artículos reales y existe evidencia de que la corrección mejora el sistema sin perjudicar otras categorías.

## Plantilla CSV mínima

Usá una hoja de cálculo con estas columnas:

```csv
ID,Noticia,CategoriaCorrecta,TipoCorrecto,PortadaCoincide,RazonesUtiles,MejorasSirven,RecomendacionAbsurda,Publico,Observaciones
1,"Título de ejemplo",Sí,Sí,Sí,Sí,Sí,No,Sí,
```

## Instrucciones

1. Seleccioná 100 noticias reales de distintas categorías y horarios.
2. Corré el análisis en `/admin/correcciones`.
3. Registrá las respuestas en la plantilla.
4. Al final, contá Sí/No/Discutible por pregunta.
5. Solo si un error se repite en ≥ 10 casos, abrí un issue con los IDs y el patrón.
