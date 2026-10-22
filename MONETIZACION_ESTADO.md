# Monetización — Estado verificado (octubre 2026)

Documento de cierre. Solo contiene información contrastada con documentación oficial
de cada plataforma o con el código del repositorio. Donde no existe fuente oficial
suficiente se marca `NO VERIFICADO`. No contiene estimaciones de RPM, CPM ni ingresos.

Tráfico de referencia (GA4 propiedad 525672447, consulta real del 16-oct-2026,
últimos 30 días, usuarios con consentimiento): **6,942 usuarios / 8,017 sesiones**.
Por el modo opt-in del consentimiento, el tráfico real es mayor que lo que mide GA4.
GSC 7 días: 18,995 impresiones / 260 clics.

---

## 1. Google AdSense — única vía automática viable

| Aspecto | Estado | Fuente |
|---|---|---|
| Acepta publishers de Nicaragua | **Sí** — Nicaragua figura en la lista oficial de países admitidos | support.google.com/adsense (lista de países) |
| Contenido noticioso en español | Admitido (sujeto a políticas de contenido y a "contenido de valor") | Políticas del programa AdSense |
| Métodos de pago para Nicaragua | Transferencia bancaria (wire) | support.google.com/adsense → formas de pago por país |
| Umbral de pago | USD 100 | Oficial |
| Tráfico mínimo | No hay mínimo publicado; la revisión es por calidad/políticas | Oficial |
| Costo / contrato | Gratuito, sin contrato comercial; términos online | Oficial |
| Riesgo de políticas | Medio: titulares engañosos, contenido copiado, tráfico artificial o clics incentivados causan limitación o cierre | Políticas del programa |

### Integración técnica en el repo (verificada)

- `public/ads.txt`: `google.com, pub-4115203339551838, DIRECT, f08c47fec0942fa` — sirve 200 en producción.
- `components/AdsenseUnit.tsx`: unidad con carga lazy (IntersectionObserver), cliente `ca-pub-4115203339551838`, montada en `components/ArticlePage.tsx`.
- Consent Mode: `ad_storage` sigue el banner; sin consentimiento se sirven anuncios no personalizados (compatible con AdSense).
- Variable `GOOGLE_ADSENSE_CLIENT_ID` solo alimenta el diagnóstico NIOS; no afecta a servir anuncios.

### Aprobación de la cuenta: `NO VERIFICADO` desde el código

El repositorio no puede saber si la cuenta `pub-4115203339551838` está aprobada,
en revisión o limitada. **Único lugar donde comprobarlo:** adsense.google.com → Sitios.
El diagnóstico NIOS la reporta como `DISABLED_BY_SCOPE` (no hay collector de AdSense).

**Acción para el propietario:** entrar a AdSense y leer el estado del sitio
`nicaraguainformate.com`. Si está "Preparándose"/"Necesita atención", los motivos
habituales son contenido insuficiente de valor propio o navegación/políticas; el sitio
ya cumple con política de privacidad, consentimiento, `ads.txt` y páginas legales.

### Estado de la solicitud (registrado por el propietario, 22-oct-2026)

- Sexto rechazo consecutivo por **"Contenido de poco valor"**.
- Google no permite otra revisión antes del **29 de octubre de 2026**.
- **Decisión del propietario: canal en pausa.** No se harán más cambios destinados
  a la aprobación de AdSense ni nuevas solicitudes. La prioridad pasa a ser la
  monetización directa (sección 4). La integración técnica existente (ads.txt,
  AdsenseUnit, Consent Mode) se mantiene intacta sin tocarla.

---

## 2. Google Ad Manager — No recomendado actualmente

- Requiere cuenta AdSense válida y está orientado a publishers con venta directa
  significativa y equipos de ad-ops (fuente: admanager.google.com / centro de ayuda).
- Con el tráfico actual no aporta ventaja sobre AdSense + auspiciadores directos; añade
  complejidad operativa (line items, trafficking, reporting).
- **Decisión:** `No recomendado actualmente por escala/tráfico/complejidad.`

---

## 3. Redes alternativas evaluadas (documentación oficial)

| Plataforma | Nicaragua | Requisitos publicados | Pago | Viabilidad actual | Acción |
|---|---|---|---|---|---|
| **Google AdSense** | Sí (lista oficial) | Sin mínimo de tráfico; políticas de contenido | Wire; umbral USD 100 | **Viable** — ya integrado; falta confirmar aprobación de cuenta | Verificar estado en consola AdSense |
| Google Ad Manager | Sí (vía AdSense) | Cuenta AdSense + volumen para venta directa | Vía AdSense | No aporta a esta escala | No implementar |
| Ezoic | `NO VERIFICADO` por país | 250,000+ usuarios activos mensuales para sitios nuevos (programa estándar); "Incubator" para menores | `NO VERIFICADO` para Nicaragua | No cumple el umbral estándar (6.9k usuarios) | Descartado |
| Raptive | `NO VERIFICADO` | ≥25,000 páginas vistas/mes + requisitos geográficos/contenido | — | No cumple | Descartado |
| Mediavine / Journey | `NO VERIFICADO` | Mediavine: ≥USD 5,000/año de ingresos previos; Journey: desde 1,000 sesiones | — | Journey técnicamente posible; país y pago `NO VERIFICADO` | No contratar; revisar solo si AdSense se descarta |
| Monumetric | `NO VERIFICADO` | Contenido en inglés; 10,000 pv/mes; ≥50% tráfico de países específicos | — | Incompatible (contenido en español, audiencia nicaragüense) | Descartado |
| Media.net | `NO VERIFICADO` | Preferencia explícita por tráfico US/UK/CA y contenido en inglés | Umbral USD 100 | Demanda irrelevante para audiencia local | Descartado |
| PropellerAds / Monetag | Afirma aceptar publishers de casi todos los países; Nicaragua no aparece en lista de exclusión publicada (`NO VERIFICADO` explícito) | Sin mínimo de tráfico; prohíbe tráfico artificial | PayPal/Skrill USD 5; Payoneer USD 20-30; wire USD 500 | Técnicamente accesible, pero sus formatos (push, popunder, interstitial) **son incompatibles con un medio periodístico serio** y con la política de experiencia de AdSense/Google (Better Ads Standards). Hay un componente `PropellerAds.tsx` en el repo, **no montado** | No usar |
| Taboola | No publica umbrales de entrada para publishers pequeños; proceso comercial | `NO VERIFICADO` | Requiere acuerdo comercial | Hay `TaboolaAds.tsx` en el repo, **no montado** | No contratar |

**Conclusión:** no existe actualmente una red automática alternativa suficientemente
viable para Nicaragua Informate. La única vía automática real es **AdSense**. Se
termina la búsqueda.

---

## 4. Auspiciadores directos — canal comercial propio (código listo, pendiente de deploy)

- Panel `/panel.html` → pestaña **Publicidad**: alta, edición, activar/desactivar, fechas, posición, logo, enlace.
- **Estado de despliegue (verificado 22-oct-2026):** el módulo completo vive en
  `feat/auspiciadores-directos` (PR #10, abierto, head `dbefa4d1`). **No está en
  `master` ni en producción**: `/api/telemetry/ads` responde 404 en el sitio en
  vivo y el panel publicado no tiene el formulario. Requisito para vender:
  mergear PR #10 a `master` y desplegar.
- **Limitación conocida:** la posición `portada`/`ambos` existe en el modelo y
  en el formulario, pero ningún código renderiza banner en la portada — hoy solo
  se puede entregar la posición `articulo`.
- Render `components/SponsorBanner.tsx`: rotación por día entre campañas vigentes,
  `rel="sponsored noopener"`, altura reservada (sin CLS), no renderiza nada sin campaña.
- Telemetría `/api/telemetry/ads` → `auspiciadores.{impresiones,clics}` + `ads_daily`
  (dedupe por sesión; sin PII). CTR en panel. Reglas Firestore: deny-by-default; solo Admin SDK.
- Página `/publicidad`: copy cualitativo, sin cifras no verificables.
- Tests: `tests/ads-api.test.ts`, `tests/auspiciadores.test.ts` (verdes).

Este canal **no es un ingreso garantizado**: depende de vender campañas. No existen
clientes ni campañas registradas que se puedan citar como ingreso.

---

## 5. Lo que está prohibido para no perder la cuenta

Auto-refresh de anuncios, tráfico comprado, bots, clics incentivados, scripts para
generar impresiones, titulares engañosos para inflar páginas vistas, anuncios
disfrazados de noticias. Cualquiera de estos pone en riesgo AdSense y la credibilidad.
