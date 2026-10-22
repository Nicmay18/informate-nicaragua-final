# PENDIENTES_HUMANOS.md — decisiones y evidencias que faltan

Actualizado: 22-oct-2026 · Estados: `BLOQUEADO POR AUTORIZACIÓN` / `PENDIENTE DE REVISIÓN` / `NO VERIFICADO`

## Decisiones editoriales

| # | Asunto | Estado | Evidencia | Acción requerida |
|---|---|---|---|---|
| 1 | Lote-3 de eufemismo (~50–60 ocurrencias, 14–15 docs) | BLOQUEADO POR AUTORIZACIÓN | `INCIDENTES_FACTUALES.md` §3 + snapshot residual | Aprobar lote → repito proceso P2: matriz, simulación, diff, apply con backup |
| 2 | Cifra de `accidentes-viales` (4+1 vs 5 vs 6) | NO VERIFICADO | contradicción interna documentada | Verificar con fuente externa; luego decidir titular/slug |
| 3 | 3 artículos E (párrafo ×42) | PENDIENTE DE REVISIÓN | fichas en FORENSIC_ARTICLE_AUTOPSY.md | Decidir: deduplicar párrafo o retirar (procedimiento autorizado) |
| 4 | 67 artículos C (revisión editorial) | PENDIENTE DE REVISIÓN | CSV matriz | Revisión humana por lote; no son retirables por score |
| 5 | Resumen truncado de `tres-fallecidos` | PENDIENTE DE REVISIÓN | "res personas… figura." | Reescritura editorial del resumen |
| 6 | Cifras de audiencia en /publicidad | NO VERIFICADO | publicadas sin respaldo | Confirmar datos reales o aceptar la corrección de PR #10 (quita/marketing honesto) |

## Decisiones técnicas / despliegue

| # | Asunto | Estado | Acción requerida |
|---|---|---|---|
| 7 | Purga de caché Cloudflare | BLOQUEADO POR AUTORIZACIÓN | Las 22+23 reparaciones ya están en DB pero producción sirve HTML viejo. Sin purga, los lectores siguen viendo el eufemismo. Alternativa: esperar TTL (observado ~36min+ o regla CF que fija caché) |
| 8 | Merge PR #10 (auspiciadores) | BLOQUEADO POR AUTORIZACIÓN | Requiere revisión humana; ahora incluye rate-limit en telemetría. Conflictos esperables con master en rutas editadas |
| 9 | Merge PR #15 vs #10 (solapamiento comercial) | PENDIENTE DE REVISIÓN | Dos productos comerciales solapados — elegir antes de mergear |
| 10 | Merge `fix/estabilizacion-forense` (PR por crear) | BLOQUEADO POR AUTORIZACIÓN | Contiene fixes de panel, headers, canonical, 404s + artefactos de auditoría |
| 11 | Merge `fix/ci-e2e-gate` (PR por crear) | BLOQUEADO POR AUTORIZACIÓN | E2E como gate real; mergear cuando se confirme que E2E pasa en CI |
| 12 | Merge `audit/afectado-p2-evidencia` (PR por crear) | BLOQUEADO POR AUTORIZACIÓN | Documentos + scripts de reparación ya aplicados en DB |
| 13 | PR #13 (cookie admin) | PENDIENTE DE REVISIÓN | Sesión opaca + meta AdSense — pendiente de merge |
| 14 | `isPublicArticle` endurecido | BLOQUEADO | Gatearlo hoy escondería ~43% del corpus; requiere backfill de `supervisorApproved`/`contentHash` primero |
| 15 | Estado real cuenta AdSense | NO VERIFICADO | Sin acceso autorizado a la consola |
| 16 | Backfill supervisorApproved/contentHash | BLOQUEADO POR AUTORIZACIÓN | 254/261 docs sin flag — propuesta de migración en PLAN_DE_REPARACION_PRIORIZADO.md |

## Evidencias externas que no se pueden obtener desde aquí

- Fuente primaria de la cifra de fallecidos en `accidentes-viales`.
- Métricas reales de audiencia (GA4/console) para sustentar /publicidad.
- Estado y motivo exacto de rechazos AdSense (solo "contenido de poco valor" reportado por el propietario).
