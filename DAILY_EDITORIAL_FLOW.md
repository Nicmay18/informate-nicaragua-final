# DAILY_EDITORIAL_FLOW.md

## Flujo diario de operación editorial

Este documento define el flujo end-to-end de publicación diaria en Nicaragua Informate, integrando MENI, EOS, Home Balance y NIOS.

---

## 1. Recepción del hecho

**Actor:** Redactor / editor de turno

**Entrada:** comunicado, dato de campo, alerta ciudadana, fuente institucional, enlace o tendencia detectada.

**Acciones:**
* Identificar la categoría: `Nacionales`, `Sucesos`, `Internacionales`, `Tecnología`, `Deportes`, `Espectáculos`.
* Crear borrador con título, resumen, autor, imagen y palabras clave.
* Asignar `articleType`: `noticia`, `explicador`, `guia` o `analisis`.

---

## 2. MENI analiza

**Sistema:** Motor Editorial Nicaragua Informate v3.2

**Qué hace:**
* Análisis forense de la información.
* Detección de ángulo diferencial.
* Verificación EEAT.
* Optimización SEO y Google Discover.
* Auditoría AdSense.
* Construcción periodística.
* Evaluación del valor agregado.
* Auditoría final con score 0-100.

**Salida:** `scoreCalidad`, fortalezas, acciones y veredicto (`Publicable`, `Revisión`, `Reescribir`).

**Regla:** si el score es `< 90`, la noticia se mejora o no se publica.

---

## 3. Editor publica

**Actor:** Editor / director de turno

**Condiciones para publicar:**
* MENI score ≥ 90 o con acciones de revisión menores resueltas.
* Autor, imagen, meta descripción, keywords y fecha confirmados.
* `articleType` y `categoria` correctamente asignados.
* Para `explicador`, `guia` o `analisis`, completar `explainer.contexto`, `conceptosClave` y `faq`.

**Acciones:**
* Pasar de `borrador` a `publicado`.
* Verificar que `noindex` sea `false` salvo excepciones.
* Confirmar fecha y hora de publicación.

---

## 4. EOS clasifica

**Sistema:** Editorial Operating System v3.0

**Qué hace:**
* Evalúa Claridad, Contexto, Utilidad y Confianza.
* Asigna ciclo de vida: `nuevo`, `creciendo`, `estable`, `actualizar`, `evergreen`.
* Detecta potencial de conversión a guía o explicador.
* Recomienda canales de distribución: Telegram, WhatsApp, Facebook, Newsletter.
* Emite alertas de calidad de marca si es necesario.

**Salida:** scores, fortalezas, oportunidades y recomendaciones de canales.

---

## 5. Home decide posición

**Sistema:** Home Balance Engine

**Qué hace:**
* Rankea noticias por frescura, calidad MENI, interés y SEO.
* Aplica tope de categoría: máximo 3 noticias (30%) del top 10 por categoría.
* Selecciona hero, portada, última hora, recientes y secciones por categoría.
* Verifica diversidad y alerta si Sucesos domina.

**Salida:** configuración de portada `portada_config` (colección Firestore) o home generada dinámicamente.

---

## 6. NIOS mide resultado

**Sistema:** Nicaragua Informate Operating System / métricas

**Qué mide:**
* Vistas por artículo y por categoría.
* Fuentes de tráfico: directo, Google, Facebook, Telegram, WhatsApp.
* Tiempo de vida del contenido.
* Engagement por canal.
* Retorno de visitantes por categoría.

**Salida:** métricas en `/api/admin/stats`, `/api/admin/traffic` y panel admin.

---

## 7. Sistema recomienda siguiente acción

**Sistema:** Módulos de crecimiento + EOS

**Posibles recomendaciones:**
* **Actualizar:** contenido antiguo con bajo tráfico.
* **Convertir:** noticia con alto tráfico y términos recurrentes a guía o explicador.
* **Redistribuir:** reenviar noticia a otro canal o boletín.
* **Proteger marca:** reducir presencia de Sucesos en home.
* **Aprovechar revenue:** impulsar guía con potencial comercial.
* **Crear seguimiento:** alertar si un tema merece segunda entrega.

**Salida:** sugerencia de próxima acción en panel admin o reporte diario.

---

## Checklist diario del editor

- [ ] Revisar noticias en borrador.
- [ ] Ejecutar MENI en cada noticia.
- [ ] Publicar solo con score ≥ 90.
- [ ] Confirmar metadatos SEO.
- [ ] Verificar alertas de Home Balance y Brand Health.
- [ ] Distribuir en canales según EOS.
- [ ] Revisar métricas NIOS del día anterior.
- [ ] Aplicar recomendaciones de crecimiento.
