# Plan de Recuperación SEO — Nicaragua Informate
## Noticias bloqueadas con noindex del 12 junio al 30 junio 2026

---

## DIAGNÓSTICO (ejecutado 30 jun 2026 22:05)

| Métrica | Valor |
|---|---|
| Total noticias en Firestore | 163 |
| Con noindex=TRUE ahora | **0** ✅ |
| Publicadas 12 jun - hoy (candidatas) | **95** |
| Antes del 12 jun (presumiblemente indexadas) | 68 |
| Prioridad ALTA (top 20) | 20 |
| Prioridad MEDIA (21-50) | 30 |
| Prioridad BAJA (51-95) | 45 |

**Top 5 a re-indexar:**
1. `camioneta-impacta-dos-motos-en-managua-y-deja-tres-lesionados` | 1,065 vistas | 28 jun
2. `identifican-a-lesionados-en-choque-frente-al-hospital-del-nino` | 600 vistas | 30 jun
3. `trabajador-de-pali-fallece-tras-ataque-en-nueva-guinea` | 87 vistas | 30 jun
4. `bus-accidentado-en-boaco-deja-42-lesionados-bajo-atencion-medica` | 86 vistas | 30 jun
5. `jefe-de-transito-fallece-tras-chocar-contra-un-poste` | 124 vistas | 29 jun

---

## FASE 2: VERIFICACIÓN INMEDIATA (Hoy 30 jun — 10 minutos)

- [ ] Abrir `https://nicaraguainformate.com/noticias/camioneta-impacta-dos-motos-en-managua-y-deja-tres-lesionados`
- [ ] Verificar en DevTools → Elements que `<meta name="robots" content="index, follow">` está presente
- [ ] Verificar que NO existe `<meta name="robots" content="noindex">`
- [ ] Verificar canonical: `<link rel="canonical" href="https://nicaraguainformate.com/noticias/...">`
- [ ] Verificar fecha: `<time datetime="2026-06-28...">` está presente
- [ ] Repetir con 2 URLs más al azar de la lista

**Si alguna tiene noindex:**
1. Ir al panel de admin → "Limpiar Noindex"
2. Ejecutar limpieza masiva
3. Hacer deploy inmediato

---

## FASE 3: SOLICITUD DE INDEXACIÓN MANUAL (GSC)

### DÍA 1 — Martes 1 julio 2026 (100 URLs)

Archivo: `scripts/recuperacion-dia1-urls.txt` (95 URLs, todas caben en un día)

**Procedimiento:**
1. Ir a [Google Search Console](https://search.google.com/search-console)
2. Propiedad: `nicaraguainformate.com`
3. Menú izquierdo → "Inspeccionar URL"
4. Pegar URL → Enter
5. Esperar resultado → Click "Solicitar indexación"
6. **Esperar 15-20 segundos entre cada URL** (evitar rate limit)
7. Registrar en spreadsheet (ver template abajo)

**URLs prioritarias (primeras 20):**
```
https://nicaraguainformate.com/noticias/camioneta-impacta-dos-motos-en-managua-y-deja-tres-lesionados
https://nicaraguainformate.com/noticias/identifican-a-lesionados-en-choque-frente-al-hospital-del-nino
https://nicaraguainformate.com/noticias/trabajador-de-pali-fallece-tras-ataque-en-nueva-guinea
https://nicaraguainformate.com/noticias/bus-accidentado-en-boaco-deja-42-lesionados-bajo-atencion-medica
https://nicaraguainformate.com/noticias/jefe-de-transito-fallece-tras-chocar-contra-un-poste
https://nicaraguainformate.com/noticias/bebe-sufre-quemaduras-con-agua-caliente-en-diria
https://nicaraguainformate.com/noticias/8-motociclistas-fallecen-en-accidentes-este-fin-de-semana
https://nicaraguainformate.com/noticias/costanera-agiliza-transporte-y-abre-playas-antes-aisladas
https://nicaraguainformate.com/noticias/dos-hombres-pierden-la-vida-en-incidentes-nocturnos-en-el-norte
https://nicaraguainformate.com/noticias/incendio-destruye-vivienda-en-monsenor-lezcano-y-deja-un-herido
https://nicaraguainformate.com/noticias/cuatro-victimas-deja-accidentalidad-vial-entre-sabado-y-domingo
https://nicaraguainformate.com/noticias/parque-de-la-familia-en-esteli-reabre-tras-millonaria-inversion
https://nicaraguainformate.com/noticias/robo-de-caja-fuerte-con-14-000-en-quilali-termina-con-un-detenido
https://nicaraguainformate.com/noticias/minero-de-21-anos-fallece-por-gases-toxicos-en-mina-del-caribe-sur
https://nicaraguainformate.com/noticias/localizan-sin-vida-a-hombre-desaparecido-en-pantasma-jinotega
https://nicaraguainformate.com/noticias/rosita-nicaragua-lagunas-turismo-cultura
https://nicaraguainformate.com/noticias/tres-fallecidos-en-hechos-viales-este-viernes-en-managua-y-granada
https://nicaraguainformate.com/noticias/asaltan-a-tiros-a-cambista-en-frontera-penas-blancas-rivas
https://nicaraguainformate.com/noticias/incendio-en-rosita-cobra-vida-de-un-nino-de-6-anos
```

---

## FASE 4: SITEMAP + PINGS (Hoy 30 jun / Mañana 1 jul)

### Comando curl para ping a Google
```bash
curl "https://www.google.com/ping?sitemap=https://nicaraguainformate.com/sitemap.xml"
```

### Comando curl para ping a Bing
```bash
curl "https://www.bing.com/ping?sitemap=https://nicaraguainformate.com/sitemap.xml"
```

### Ping a IndexNow (ya automatizado en distribución)
```bash
# Esto se hace automáticamente al publicar, pero para recuperación manual:
curl -X POST https://www.bing.com/indexnow \
  -H "Content-Type: application/json" \
  -d '{"host":"nicaraguainformate.com","key":"ni-indexnow-key-2026-x7k9m3p2q8r5t1u4","urlList":["https://nicaraguainformate.com/noticias/camioneta-impacta-dos-motos-en-managua-y-deja-tres-lesionados"]}'
```

---

## FASE 5: SEÑALES EXTERNAS (1-3 julio)

### Telegram (5 noticias prioritarias)
Enviar manualmente o vía panel de admin → Distribuir:
1. camioneta-impacta-dos-motos...
2. identifican-a-lesionados...
3. bus-accidentado-en-boaco...
4. jefe-de-transito-fallece...
5. 8-motociclistas-fallecen...

### Twitter/X (5 noticias)
Si no hay API configurada, compartir manualmente desde cuenta personal con hashtags #Nicaragua #Noticias

### Links externos legítimos
- Compartir en grupos de Facebook de Nicaragua (comentario con link, no spam)
- Reddit r/Nicaragua (si existe)
- Foros locales de noticias

---

## FASE 6: MONITOREO (cada 48 horas)

### Métricas a trackear

| Fecha | Indexed | Discovered | Not Indexed | Notas |
|---|---|---|---|---|
| 30 jun (baseline) | ? | ? | ? | Capturar de GSC antes de empezar |
| 2 jul | ? | ? | ? | 48h después de solicitudes |
| 4 jul | ? | ? | ? | 96h |
| 7 jul | ? | ? | ? | 1 semana |
| 14 jul | ? | ? | ? | 2 semanas (meta: +30 noticias indexadas) |

### Verificación en GSC
1. Search Console → Cobertura → "Indexadas"
2. Comparar número vs. baseline
3. Si no sube en 7 días: revisar canonical, hreflang, robots.txt

---

## TEMPLATE SPREADSHEET

Crear Google Sheets o Excel con estas columnas:

```
| slug | titulo | categoria | fecha_pub | vistas | url | prioridad | fecha_solicitud_gsc | estado_gsc | fecha_indexacion | notas |
```

** Estados GSC:**
- `solicitado` — Click en "Solicitar indexación"
- `procesando` — GSC dice "Procesando solicitud"
- `indexada` — Aparece como "URL está en Google"
- `no_indexada` — Algún error bloquea

---

## CHECKLIST DÍA POR DÍA

### Hoy (Lunes 30 jun) — 30 minutos
- [x] Fase 1: Identificar 95 noticias candidatas
- [x] Confirmar noindex=0 en todas
- [ ] Fase 2: Verificar 3 URLs en vivo tienen `index, follow`
- [ ] Ping Google + Bing sitemap
- [ ] Deploy del sitio con revalidate=3600 y meta fixes

### Mañana (Martes 1 jul) — 45 minutos
- [ ] Fase 3: Solicitar indexación de 95 URLs en GSC (100 límite, caben todas)
- [ ] Registrar en spreadsheet
- [ ] Fase 5: Enviar 5 noticias prioritarias por Telegram

### Miércoles 2 jul — 10 minutos
- [ ] Verificar en GSC Coverage: ¿subió "Indexadas"?
- [ ] Si no subió: verificar que no haya errores de rastreo

### Viernes 4 jul — 15 minutos
- [ ] Segunda revisión GSC Coverage
- [ ] Revisar URL Inspection de 5 URLs al azar para ver estado

### Lunes 7 jul — 15 minutos
- [ ] Revisión semanal: comparar baseline vs. actual
- [ ] Si Indexed subió < 10: investigar canonical/robots.txt
- [ ] Si Indexed subió > 20: continuar monitoreo cada 48h

### Lunes 14 jul — 15 minutos
- [ ] Revisión final de 2 semanas
- [ ] Meta: 50+ noticias indexadas de las 95
- [ ] Si no se alcanza: escalar a revisión técnica profunda

---

## NOTAS IMPORTANTES

1. **Límite GSC:** Máximo 100 solicitudes de indexación por día. Las 95 candidatas caben en un solo día.

2. **Tiempo de Google:** Puede tomar 24-72 horas en indexar después de la solicitud. No significa que falló si no aparece inmediatamente.

3. **No repetir solicitudes:** Una URL solicitada no se debe volver a solicitar en 14 días. El spreadsheet evita duplicados.

4. **Sitemap es la clave:** Las solicitudes manuales aceleran, pero el sitemap correcto + noindex limpio es lo que realmente recupera el indexado a largo plazo.

5. **Si una URL dice "Descubierta, actualmente sin indexar":** Esto es normal las primeras 48h. Esperar. Si persiste > 1 semana, revisar contenido duplicado o canonical incorrecto.

---

## ARCHIVOS GENERADOS

- `scripts/recuperacion-seo-batch.csv` — Spreadsheet completo con 95 URLs
- `scripts/recuperacion-dia1-urls.txt` — Lista simple de URLs para copiar/pegar
- `docs/plan-recuperacion-seo.md` — Este documento
