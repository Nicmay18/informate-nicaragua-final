# Análisis de errores MENI V3

Total de errores analizados: 23
- Falsos positivos: 16
- Falsos negativos: 7

### Error 1. Cinco accidentes de tránsito dejan tres fallecido y varios herido

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: score alto pero contenido sin señales sólidas (fuente, sin dato, longitud 5390)
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 2. Capturan en Estelí a nicaragüense requerido por caso en EE. UU.

- **Variable:** EEAT
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: EEAT alto sin fuentes claras o autor genérico
- **Señal sobrevalorada:** Autor genérico asignado como visible
- **Señal que faltó detectar:** Citas estructuradas, fuentes independientes o documentos oficiales
- **Problema:** A) Regla demasiado permisiva

### Error 3. Documentos para tramitar el récord policial en Nicaragua

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: profundidad alta sin contexto o cifras
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 4. Yadel reúne a más de 30 mil personas en Managua

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: score alto pero contenido sin señales sólidas (sin fuente, sin dato, longitud 3434)
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 5. Familia afectada tras volcamiento de camión en Matagalpa

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: profundidad alta sin contexto o cifras
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 6. Luchó diez días por su vida y falleció tras ataque de expareja

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: score alto pero contenido sin señales sólidas (fuente, sin dato, longitud 3081)
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 7. Managua inicia sus fiestas 2026 con programa y asuetos

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: score alto pero contenido sin señales sólidas (sin fuente, dato, longitud 4217)
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 8. Accidente grave en Masaya en Villa Bosco — Nicaragua Informate

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: profundidad alta sin contexto o cifras
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 9. Nicaragua impulsa talento digital, IA y expansión del 5G

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: profundidad alta sin contexto o cifras
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 10. Robo de caja fuerte con $14,000 en Quilalí termina con un…

- **Variable:** profundidad
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: profundidad alta sin contexto o cifras
- **Señal sobrevalorada:** Longitud y nombres propios
- **Señal que faltó detectar:** Contexto histórico, institucional o cifras verificables
- **Problema:** A) Regla demasiado permisiva

### Error 11. Dos hombres resultan afectados por descargas eléctricas en…

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: score alto pero contenido sin señales sólidas (fuente, sin dato, longitud 5182)
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 12. Tres personas resultan afectados en accidentes de motocicleta…

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: score alto pero contenido sin señales sólidas (fuente, sin dato, longitud 5482)
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 13. Joven de Masaya fallece en la Laguna de Apoyo este 20 de julio

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: score alto pero contenido sin señales sólidas (sin fuente, sin dato, longitud 2267)
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 14. Un afectado y un personas afectado en accidente laboral en…

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: score alto pero contenido sin señales sólidas (fuente, sin dato, longitud 2512)
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 15. Cuatro obreros afectados en accidentes laborales en Nicaragua

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: score alto pero contenido sin señales sólidas (fuente, sin dato, longitud 2983)
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 16. Noruega vuelve a octavos del Mundial tras 28 años de ausencia

- **Variable:** EEAT
- **Tipo:** Falso negativo
- **Respuesta original:** No — falso negativo: EEAT bajo con atribuciones presentes
- **Señal sobrevalorada:** Penalización por autor institucional o por falta de cita formal
- **Señal que faltó detectar:** Atribuciones a fuentes nombradas en el texto
- **Problema:** C) Falta una nueva condición

### Error 17. Kimi AI acelera la carrera mundial por la inteligencia artificial

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso negativo
- **Respuesta original:** No — falso negativo: score bajo a pesar de contenido sólido
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 18. Baile de los Chinegros mantiene vivo un ritual de 400 años

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso negativo
- **Respuesta original:** No — falso negativo: score bajo a pesar de contenido sólido
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 19. NASA cuestiona límite de tormentas solares con estudio en Nature

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso negativo
- **Respuesta original:** No — falso negativo: score bajo a pesar de contenido sólido
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 20. Prueba de IA obliga a OpenAI a reforzar su seguridad digital

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso negativo
- **Respuesta original:** No — falso negativo: score bajo a pesar de contenido sólido
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 21. Polémica en el Mundial no frena reconocimiento a Tatiana Guzmán

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso negativo
- **Respuesta original:** No — falso negativo: score bajo a pesar de contenido sólido
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

### Error 22. Campeonato de 1/4 de Milla: Adrenalina y técnica en Managua

- **Variable:** utilidad
- **Tipo:** Falso positivo
- **Respuesta original:** No — falso positivo: utilidad alta pero no detecta dato práctico ni servicio
- **Señal sobrevalorada:** Palabras clave de utilidad sin dato concreto o servicio
- **Señal que faltó detectar:** Información práctica (contactos, fechas, lugares, qué hacer)
- **Problema:** A) Regla demasiado permisiva

### Error 23. Campeonato de 1/4 de Milla: Adrenalina y técnica en Managua

- **Variable:** score final (combinación de variables)
- **Tipo:** Falso negativo
- **Respuesta original:** No — falso negativo: score bajo a pesar de contenido sólido
- **Señal sobrevalorada:** El blend 50/50 base/valor pondera dimensiones saturadas sin compensar sus errores individuales.
- **Señal que faltó detectar:** Coherencia entre las tres dimensiones antes de elevar el score final.
- **Problema:** D) Interacción incorrecta entre variables

## Tabla resumen

| Variable | Problema | Frecuencia | Corrección propuesta |
|---|---|---|---|
| EEAT | A) Regla demasiado permisiva | 1 | Diferenciar atribuciones vagas de citas estructuradas; no puntuar alto EEAT sin fuentes nombradas. |
| EEAT | C) Falta una nueva condición | 1 | Diferenciar atribuciones vagas de citas estructuradas; no puntuar alto EEAT sin fuentes nombradas. |
| profundidad | A) Regla demasiado permisiva | 1 | Exigir contexto histórico/institucional o cifras para puntuar >80; descontar por exceso de nombres sin datos. |
| score final (combinación de variables) | D) Interacción incorrecta entre variables | 19 | Revisar blend para que dimensiones individuales con contradicciones no arrastren el score. |
| utilidad | A) Regla demasiado permisiva | 1 | Exigir datos de servicio o contacto para puntuar >80; reducir peso de la longitud. |
