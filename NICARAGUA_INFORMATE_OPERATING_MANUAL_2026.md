# Nicaragua Informate v1.1 — Manual de Operación 2026

## Versión

**Nicaragua Informate v1.1 Production Ready**

Fecha de congelamiento: 2 de agosto de 2026

---

## Propósito

Este documento convierte el producto en un sistema operable por una persona. Responde a la pregunta:

> ¿Cómo opera Nicaragua Informate todos los días para crecer?

---

## Flujo diario

```
Inicio del día
│
├─ NIOS Daily Editor analiza estado
│   └─ Salud editorial
│   └─ Oportunidades
│   └─ SEO pendiente
│   └─ Plan semanal
│
├─ Editor revisa recomendaciones en /admin/nios
│
├─ Selección de agenda
│   └─ 1 Suceso (si aplica)
│   └─ 1 Nacional
│   └─ 1 Guía útil o contenido evergreen
│   └─ 1 Tecnología / Deportes / Internacional según radar
│
├─ Redacción
│
├─ MENI valida calidad editorial
│   └─ Puntaje >= 85: Publicable Oro
│   └─ Puntaje 70-84: Revisar
│   └─ Puntaje < 70: No publicar
│
├─ Publicación
│
├─ EOS clasifica contenido
│   └─ Categoría
│   └─ SEO
│   └─ Estructura
│
├─ Home Balance Engine distribuye portada
│
└─ NIOS mide resultados
    └─ Categorías dominantes
    └─ Artículos más leídos
    └─ Recomendación del día siguiente
```

---

## Responsabilidad de cada motor

| Sistema | Función principal | Responsable humano |
|---|---|---|
| MENI v3.2 | Calidad editorial, verificación, E-E-A-T, Adsense-safe | Editor (valida el score) |
| EOS v3.0 | Organización editorial, categorías, SEO, metadata | Sistema + editor de SEO |
| Home Ranking Engine | Portada equilibrada, diversidad, topes por categoría | Automático |
| NIOS v2.0 | Inteligencia de crecimiento, oportunidades, competencia | Director de producto |
| NIOS Daily Editor | Decisiones diarias del editor | Editor jefe |
| Centro Útil | Tráfico permanente, guías, evergreen | Editor de guías |
| Firestore | Fuente única de noticias, métricas y guías | DevOps/Firebase |

---

## Reglas de producción editorial

- **No perseguir solamente clics.**
- **Sucesos atrae usuarios**, pero no debe superar el 30% del top 10 de portada.
- **Nacionales construye marca.** Siempre tener una Nacional visible en la primera pantalla.
- **Guías generan tráfico permanente.** Publicar al menos una guía útil por semana.
- **Tecnología y Deportes generan comunidad.** Mantener presencia constante.
- **Título <= 60 caracteres.**
- **Meta descripción <= 160 caracteres.**
- **Imagen con pie de foto / alt.**
- **Autor siempre identificado.**

---

## Primeras acciones del día (10 minutos)

1. Abrir `/admin/nios`.
2. Leer recomendación diaria.
3. Revisar categorías marcadas como `bajo`.
4. Tomar 1 acción SEO de la lista pendiente.
5. Decidir los 3 temas del día.

---

## Cierre del día (10 minutos)

1. Verificar que el Home Balance Engine no está dominado por Sucesos.
2. Revisar las 5 noticias más leídas.
3. Anotar oportunidades para el día siguiente.
4. Actualizar guía evergreen si hay datos nuevos.

---

## Contactos y canales oficiales

- **Dominio:** nicaraguainformate.com
- **Repositorio:** `Nicmay18/informate-nicaragua-final`
- **Correo editorial:** contacto@nicaraguainformate.com
- **Directoras de contenido:** Yader Montoya Cruz, Keyling Elieth Rivera Muñoz
