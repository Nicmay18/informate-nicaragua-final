# Pendientes del Propietario — Acciones que Solo Tú Puedes Hacer

Todo lo que requiere acceso a cuentas externas, autorización de datos de producción, o decisiones de negocio. Ninguno bloquea el código, pero varios bloquean la medición completa del crecimiento.

---

## 🔴 Crítico para medir el crecimiento

### 1. Vincular GA4 ↔ AdSense (5 minutos)
- **Dónde:** AdSense → Herramientas → Vinculación de productos → Google Analytics → seleccionar propiedad `525672447` (nicaraguainformate.com).
- **Por qué:** sin esto no hay reporte de "Ingresos por página" — no podemos saber si la guía apostillar o las noticias generan el dinero.
- **Después:** verificar que en GA4 → Informes → Monetización → Ingresos aparezcan datos (puede tardar 24-48h).

### 2. Autorizar reescritura de titulares de noticias en Firestore
- **Qué:** ~8 noticias con 100-350 impresiones y 0 clics necesitan `titulo` + `metaDescription` nuevos (lista exacta en `OPTIMIZACION_PAGINAS_EXISTENTES.md`).
- **Cómo:** autorizar un script auditado que use `applyTechnicalMutation` (deja provenance en `mutationLog`) — no edit manual en consola.
- **Por qué es tu decisión:** son datos de producción; yo no los toco sin tu OK explícito.

### 3. Verificar estado de indexación en Search Console
- **Dónde:** GSC → Indexación → Páginas.
- **Qué reportar:** número de "indexadas" vs "excluidas" vs "descubiertas sin indexar" + las razones de exclusión.
- **Por qué:** la API de NIOS trae performance pero no el índice. Si hay exclusiones (noindex accidental, canonical roto, contenido duplicado), hay que corregirlas antes de escalar contenido.

### 4. Confirmar envíos de sitemaps en GSC
- **Dónde:** GSC → Sitemaps.
- **Verificar:** `sitemap.xml` y `news-sitemap.xml` enviados y "Correcto"/"Última lectura" reciente.
- **Nota:** los archivos existen y responden 200 (verificado); falta confirmar que GSC los recibió.

---

## 🟡 Importante para el plan de contenido

### 5. Validar fuentes oficiales antes de publicar guías nuevas
Las guías de trámites/migración tocarán temas sensibles (TPS, DACA, pasaportes). Antes de publicar:
- Confirmar que las fuentes oficiales (USCIS, MINREX, migracion.gob.ni, BCN) son accesibles y los datos citados son actuales.
- Revisar los briefs en `BRIEFS_10_CONTENIDOS.md` — cada uno lista sus fuentes obligatorias.
- Si tienes contactos en esas instituciones o acceso a normativa actualizada, compartirla.

### 6. Decidir si se implementa integración automática del tipo de cambio (dólar-córdoba)
- La guía `/guia/dolar-a-cordoba-nicaragua-hoy-2026` existe pero tiene solo 11 impresiones — sin datos vivos, Google no la muestra para "dolar a cordoba hoy".
- **Opciones:** (a) integrar API pública del BCN vía cron NIOS (recomendado, ~1-2h de desarrollo), (b) actualización manual semanal (más simple, menos fresco), (c) retirar la guía si no habrá mantenimiento.
- **Tu decisión:** cuál prefieres. Sin datos actuales la página es thin content.

### 7. Confirmar si los "elementos fijos inferiores" son anuncios de AdSense
- En la revisión anterior identificaste bloques publicitarios fijos abajo. Necesito saber: ¿son de Auto Ads (anchor/vignette de tu consola de AdSense) o componentes del código del sitio?
- **Cómo verificar:** en AdSense → Configuración de anuncios → ver qué formatos están activos. O dime y lo reviso en el código.
- **Por qué:** si son anchor ads de AdSense, midan su RPM antes de tocar nada; si son componentes propios, evaluamos si mejoran o restan.

---

## 🟢 Operativo / menor prioridad

### 8. Confirmar que NIOS-GSC sigue recolectando
- Los snapshots diarios existen hasta 2026-11-17 — la integración funciona.
- Solo verificar que el cron `nios-collect` siga programado en Vercel (no debería haber cambiado, pero confírmalo en el dashboard de Vercel → Cron Jobs).

### 9. Revisar el runbook de claims de Telegram
- `docs/RUNBOOK_TELEGRAM_CLAIMS.md` tiene el procedimiento para resolver los ~227 claims históricos `sending`/`unknown`.
- No es urgente (no reenvían solos), pero conviene ejecutarlo cuando tengas 30 min: verifica cada slug en el canal de Telegram y resuelve `sent` o `retry`.

### 10. Feedback editorial sobre los briefs
- Los 10 briefs en `BRIEFS_10_CONTENIDOS.md` son propuestas mías basadas en datos. Revísalos — si alguno no aplica a tu línea editorial o conoces un tema con más demanda real, dímelo y reordeno la prioridad.

---

## Lo que NO necesito de ti

- No necesito acceso a mi Firebase (ya lo tengo de solo lectura/escritura controlada).
- No necesito que ejecutes migraciones — el código es backward compatible.
- No necesito que borres nada — los cambios son aditivos.
- No necesito que decidas el merge del PR — eso es al final, cuando tú digas.

## Resumen de bloqueos

| # | Bloqueo | Desbloquea |
|---|---|---|
| 1 | Vincular GA4↔AdSense | Métricas de ingreso por página (FASE monetización) |
| 2 | Autorizar reescritura de titulares | ~1,500 imp/sem sin clics |
| 3 | Reportar estado de indexación GSC | Saber si hay páginas excluidas |
| 4 | Confirmar sitemaps en GSC | Asegurar crawl completo |
| 5 | Validar fuentes oficiales | Publicar guías de trámites/migración |
| 6 | Decidir tipo de cambio | Guía dólar-córdoba útil vs thin |
| 7 | Identificar origen de ads fijos | Estrategia AdSense informada |
