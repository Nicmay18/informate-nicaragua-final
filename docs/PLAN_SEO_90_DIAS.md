# Plan SEO de Crecimiento — 90 Días

**Línea base (7 días, datos reales NIOS/GSC):** 16,868 imp · 345 clics · CTR 2.05% · pos 7.3 · 220 usuarios GA4 · 436 pageviews.

**Tesis del plan:** no construir páginas nuevas primero. Primero recuperar clics de las 3 guías que ya dominan (9,260 imp/semana entre ellas) y de las ~10 noticias con 100+ impresiones y 0 clics. Después expandir el clúster de trámites/diáspora que ya demostró demanda.

---

## FASE 1 — Semanas 1-2: Quick wins de CTR (impacto inmediato)

| Acción | URL/mecanismo | Impacto esperado |
|---|---|---|
| ✅ Hecho: FAQ MINREX + description con `citas.cancilleria.gob.ni` | `/guia/apostillar...` | Captura ~315 imp/sem de queries "minrex" con CTR 0.4% → objetivo 1.5%+ |
| ✅ Hecho: seoTitle "cuánto es" + description con rango C$ | `/guia/salario-minimo...` | CTR 1.18% → objetivo 2%+ sobre 1,019 imp/sem |
| Reescribir título+meta de 8 noticias con 0 clics (requiere autorización — datos Firestore) | ver tabla en OPTIMIZACION | ~1,500 imp/sem actualmente sin clics |
| Verificar indexación real de las 14 guías en GSC | GSC → Indexación | Detectar exclusiones silenciosas |

## FASE 2 — Semanas 3-6: Páginas pilar nuevas (demanda probada)

Publicar en este orden (cada una con brief completo en `BRIEFS_10_CONTENIDOS.md`):

1. **Dólar a córdoba con datos vivos** — convertir thin content en utilidad real (integración BCN o fecha de consulta visible).
2. **Aguinaldo 2026** — pico estacional nov-dic, demanda laboral segura.
3. **Pasaporte nicaragüense** — trámite consular #1 de la diáspora.
4. **Enviar dinero a Nicaragua** — página pilar comercial (maior potencial RPM).
5. **TPS nicaragüenses** — audiencia EE.UU., intención alta.

Cada guía nueva: 1,200-2,500 palabras útiles (no relleno), FAQ real, JSON-LD completo (ya automático en `/guia/[slug]`), enlaces internos bidireccionales con el clúster, fuente oficial fechada.

## FASE 3 — Semanas 7-10: Profundizar clústeres y enlaces internos

- Actualización mayor de `/guia/tramites-migratorios-...` (rewrite con datos 2026 por país: CR, EE.UU., España).
- Sección "salario mínimo por hora" dentro de la guía existente (no página nueva).
- Enlaces internos noticia→guía: regla editorial para que artículos de trámites enlacen a la guía del tema.
- Cluster laboral: aguinaldo + salario + costo de vida + INSS inter-enlazados.

## FASE 4 — Semanas 11-13: Medición y ajuste

- Comparar snapshot GSC semanal vs línea base.
- Decidir por guía nueva: si <50 imp/mes a los 30 días, mejorar o consolidar.
- Revisar qué queries nuevas aparecen (la API NIOS ya las guarda en `gsc.queries`).

---

## Objetivos medibles (proyección, no promesa)

| Métrica | Línea base (7d) | Objetivo día 30 | Objetivo día 90 |
|---|---|---|---|
| Impresiones/semana | 16,868 | ~20,000 | ~28,000 |
| Clics/semana | 345 | ~500 | ~800 |
| CTR | 2.05% | 2.5% | 3.0% |
| Páginas con >100 imp y >1% CTR | ~15 | ~25 | ~40 |
| Guías activas con tráfico | 3 | 6 | 10 |
| Usuarios orgánicos GA4/semana | 92 | ~130 | ~200 |

Estos objetivos asumen: CTR fixes funcionando (+15-25% clics en páginas existentes), 4-5 guías nuevas indexadas, y demanda estable del cluster trámites. **Son proyecciones basadas en la línea base, no garantías.**

## Qué NO hacer (anti-patrones)

- ❌ Crear páginas doorway o contenido masivo sin demanda.
- ❌ Publicar "salario mínimo" o "dólar a córdoba" sin datos fechados (thin content penaliza).
- ❌ Canibalizar: una consulta = una URL (ver reglas en KEYWORDS_OPORTUNIDADES_50.md).
- ❌ Cambiar URLs de guías indexadas (perderían su posición actual).
- ❌ Sacrificar velocidad/LCP por más anuncios — el 82% del tráfico es móvil.

## Dependencias del propietario

- Autorización para reescribir `titulo`/`metaDescription` de noticias en Firestore (datos, no código).
- Verificar en GSC que el sitemap esté enviado y la propiedad verificada.
- Vincular GA4 ↔ AdSense para métricas de ingreso por página.
- Confirmar que NIOS-GSC sigue recolectando (los snapshots diarios ya lo hacen automáticamente).
