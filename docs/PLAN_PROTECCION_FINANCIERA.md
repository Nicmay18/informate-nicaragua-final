# Plan de Protección Financiera — Nicaragua Informate

## 1. Lo que se implementó en código (real, desplegado)

### Cost Guard — `lib/cost-guard.ts` + `config/cost_guard` (Firestore)

Control operativo **sin redespliegue**: el propietario puede poner el sitio en "modo economía" editando UN documento en Firestore Console.

```jsonc
// config/cost_guard
{
  "mode": "economy",                      // 'normal' (default) | 'economy'
  "disabledStages": ["ceo"],              // etapas NIOS a omitir (skipped honesto)
  "disabledCrons": ["/api/cron/meni-learning-cycle", "/api/cron/supervisor-watch"],
  "note": "activado por costo el 2026-11-XX",
  "updatedBy": "propietario"
}
```

- **Fail-open**: si Firestore no responde, todo sigue en modo normal — el sitio nunca se apaga por el guard.
- Las etapas omitidas quedan registradas como `skipped` en `nios_runs/{fecha}` — auditable.
- Cableado en: `nios-collect` (4 etapas), `nios-ceo-loop`, `meni-learning-cycle`, `departamento-central`, `departamento-daily`, `distribuciones-retry`, `supervisor-watch`.
- Las etapas esenciales (`collect`, `analyze`) y el sitio público **nunca** se desactivan por este mecanismo.
- Caché de 5 min por instancia → 1 lectura de doc por 5 min como máximo.

### Snapshot diario de métricas — `cost_daily/{YYYY-MM-DD}`

`traffic-cleanup` (cron diario 03:00 UTC) escribe un doc con `count()` (barato):
`noticias`, `traffic_log`, `depto_jobs` abiertos, `nios_actions` pendientes + **deltas vs. ayer**. Permite ver la tendencia real sin acceso a billing.

## 2. Lo que SOLO puede hacer el propietario (consola)

### Presupuestos y alertas GCP — pasos exactos

1. https://console.cloud.google.com/billing → seleccionar cuenta de facturación.
2. **Budgets & alerts → Create budget**:
   - Scope: proyecto Firebase.
   - Amount: **US$10/mes** (cubre el objetivo US$5 de Firestore + margen).
   - Thresholds: **50%, 75%, 90%, 100%** + "forecasted spend exceeds budget".
   - Email alerts: verificar que el correo del propietario esté como **Billing Account Administrator** (causa probable de no recibir avisos: los budgets solo notifican a usuarios con rol de billing, no a todos los editores del proyecto).
3. **Verificar contactos**: IAM → check que el email del propietario tenga rol "Billing Account Administrator" o "Billing Account User" en la *cuenta de facturación* (distinto del proyecto).
4. **Alertas de anomalías**: Cloud Billing → Anomalies (detección automática de spikes, gratis).
5. **Presupuesto Vercel**: Vercel Dashboard → Settings → Billing → Spending limits / budget alerts (si el plan lo permite).

### IMPORTANTE — los budgets NO cortan el gasto

Google Cloud budget alerts **solo notifican**. Controles que SÍ interrumpen consumo:

| Control | Capacidad real | Estado |
|---|---|---|
| `config/cost_guard` modo economy | Omite crons/etapas NIOS pesadas sin deploy | ✅ Implementado |
| TTL en `traffic_log` | Borra docs viejos automáticamente | ✅ Ya activo |
| Límites en queries | Tope de docs por consulta | ✅ Ya activo |
| Cache TTLs ISR | Reduce regeneraciones | ✅ Ya activo |
| Apagar crons en `vercel.json` + redeploy | Detiene procesos | Manual, último recurso |
| Quota/billing export → Cloud Function que deshabilite crons | Automático real | ❌ Requiere función + permisos — evaluar si el costo lo justifica |

## 3. Backups — 43.99 GiB-month (US$1.32)

**No explicado por el corpus** (~8 MB). Acciones del propietario:

1. Firebase Console → Firestore → **Backups**: listar schedules y snapshots, tamaño y retención.
2. Verificar si hay **PITR habilitado** (0.92 GiB-mo facturado → probablemente sí, retención 7 días por defecto).
3. Los sospechosos de tamaño: `nios_runs/*/articles` (subcolecciones con ~500 artículos fusionados × ~100 KB por día) y `nios_daily_snapshots.articlesFused` — backups de Firestore incluyen subcolecciones.
4. **No borrar nada sin inventario**: exportar lista de backups primero. Si hay snapshots manuales antiguos de pruebas, esos son candidatos seguros a revisar (con confirmación).

## 4. Los US$15 no identificados

Candidatos a verificar en el estado de cuenta:
- **Vercel**: plan Pro (US$20/mes) o uso overage (Function invocations, Fast Data Transfer, ISR). Ver Usage tab.
- **Cloud Logging**: si hay exportación o retention larga.
- **Firebase Storage / Cloud Storage**: si se usa para imágenes.
- **Otro proyecto GCP** en la misma cuenta de facturación.
- **Impuesto/cargo bancario** internacional.

## 5. Presupuesto operativo objetivo

| Concepto | Meta | Mínimo justificado |
|---|---|---|
| Firestore | US$5/mes | ~US$20–25/mes con arquitectura actual (ver `PROYECCION_COSTOS_GOOGLE_CLOUD.md`) |
| Vercel | US$0 (Hobby) | Depends on plan — verificar |
| Backups Firestore | <US$1/mes | Revisar política tras inventario |

El objetivo US$5/mes **no es alcanzable** con 730+ artículos indexados y crawlers activos — el piso lo ponen las lecturas de detalle por pageview y las regeneraciones ISR. El ahorro realista es ~65–70% del gasto Firestore.
