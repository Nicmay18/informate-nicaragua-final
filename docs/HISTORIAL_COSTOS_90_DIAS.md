# Historial de Costos — 90 días

## Limitación honesta

No tengo acceso a la consola de Google Cloud Billing ni a Vercel Billing. El único dato de facturación disponible es el reporte del propietario para **1–19 nov 2026** (US$40.48 Firestore, proyección US$63.97/mes). El historial de 90 días y el desglose por SKU solo puede obtenerlo el propietario desde:

- **GCP Console → Billing → Reports** → filtrar proyecto Firebase, agrupado por SKU y por día.
- **Vercel Dashboard → Usage** → Functions Invocations, Data Transfer, ISR Writes/Reads, Image Optimization, Build Minutes.
- **Vercel → Project → Settings → Billing** para confirmar plan (Hobby vs Pro).

## Datos disponibles

| Período | Fuente | Dato |
|---|---|---|
| 1–19 nov 2026 | Reporte propietario | Firestore: 33,581,497 reads (US$19.58), 171.37 GiB egress (US$19.36), backups 43.99 GiB-mo (US$1.32), PITR 0.92 GiB-mo (US$0.17), storage 0.92 GiB-mo (US$0.06). Total US$40.48 |
| ~19 días | Proyección lineal | ~US$63.97/mes Firestore |
| US$15 adicionales | Reporte propietario | **Sin identificar** — candidatos: Vercel Pro/uso, Cloud Logging, otra factura GCP, o cargo bancario. Requiere que el propietario revise el estado de cuenta. |

## Contexto del consumo en el tiempo

- El patrón de costo (reads + egress dominantes) es **estructural del código**, no un pico: existía desde que las páginas pasaron a ISR con `contenido` en proyecciones.
- `traffic_log` tiene 17,836 docs y crece ~1,000–2,000/día (muestra últimos 2,000: 30% bots) — writes acotados por TTL, no son driver de reads.
- Los 43.99 GiB-month de Zonal Backup **no los explica el corpus** (8 MB × retención no llega ni a 1 GiB). Sospechosos: snapshots programados de Firestore que incluyen subcolecciones grandes (`nios_runs/*/articles`, `nios_daily_snapshots` con `articlesFused` ~500 docs × ~100 KB), o PITR/backup de una base adicional. **Requiere consola del propietario** — ver `PLAN_PROTECCION_FINANCIERA.md` §Backups.

## Línea base para comparación post-deploy

| Métrica | Antes (19 días) | Después (esperado) |
|---|---|---|
| Firestore reads/día | ~1,770,000 | ~350,000–550,000 |
| Firestore egress/día | ~9.0 GiB | ~2.5–3.5 GiB |
| Costo Firestore/mes | ~US$64 | ~US$20–25 |

Validar contra la factura del próximo ciclo (no declarar ahorro real antes).
