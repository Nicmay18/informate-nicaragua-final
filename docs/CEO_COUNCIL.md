# CEO Council — NIOS CEO v2

Consejo ejecutivo multi-perspectiva que audita y decide sobre el sistema Nicaragua Informate Operating System (NIOS).

## Roles y responsabilidades

| Rol | Perspectiva | Responsabilidad principal |
|-----|-------------|---------------------------|
| CEO | Negocio global | Crecimiento, rentabilidad, sostenibilidad, marca. |
| CTO | Tecnología | Calidad del código, dependencias, deuda técnica, build/verificación. |
| Editor Jefe | Editorial | Calidad, precisión, sesgo, legado, ciclos de vida del contenido. |
| SEO Director | Búsqueda orgánica | Indexación, metadatos, esquemas, canónicos, palabras clave. |
| Audience Director | Audiencia | Retención, engagement, recirculación, experiencia del lector. |
| Growth Director | Crecimiento | Tráfico, canales, redes, newsletters, conversiones. |
| UX Director | Experiencia | Jerarquía visual, accesibilidad, mobile-first, interacción. |
| Revenue Director | Ingresos | AdSense, publicidad directa, donaciones, sponsors. |
| Data Director | Datos | Integridad de datos, modelos de tráfico, validación, GSC/GA4. |
| Security Director | Seguridad | Tokens, secretos, autenticación, autorización, logging. |
| Architecture Director | Arquitectura | Acoplamiento, orfanatos, escalabilidad, límites de servicio. |

## Voto de esta sesión

- **CTO**: El build pasa pero 658 archivos necesitan reparación y 537 están muertos. Prioridad: estabilizar dependencias de alto acoplamiento (`lib/logger.ts`, `lib/types.ts`, `lib/firebase-admin.ts`).
- **Audience/Growth**: El bloque "También te puede interesar" ya tiene clases semánticas y jerarquía visual. Falta validar en producción el impacto de CTR.
- **Data**: Se implementó `validateTrafficReader` con 3 corridas para detectar `TRAFFIC_DATA_UNTRUSTED`.
- **Security**: El cron sigue aceptando `?token=` en query string por compatibilidad Vercel. Se requiere aprobación humana para eliminar fallback query-string.
- **Editor Jefe**: El motor editorial `lib/editorial/core/` está bajo prohibición de tocar salvo pruebas fallidas.
- **Revenue**: No se implementó aún el motor de revenue; requiere integración AdSense real.
- **SEO**: No se hizo auditoría GSC/News/Discover; depende de credenciales.

## Reglas de decisión

1. P0 = afecta ingresos, seguridad, disponibilidad, o UX crítica en producción.
2. P1 = mejora medible pero no crítica; puede esperar 24-72 h.
3. P2 = deuda técnica, documentación, optimización.
4. Ningún cambio destructivo sin `HUMAN_APPROVAL`.

