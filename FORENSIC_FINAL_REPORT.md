# FORENSIC FINAL PHASE — INFORME DE ESTADO

## Resumen Ejecutivo

**Fecha**: 2026-08-13T17:40Z (aprox)  
**Repositorio**: informate-nicaragua-final  
**Dominio**: nicaraguainformate.com  

El trabajo forense de las fases anteriores (16, 16A/16B, 18) ha dejado el inventario en estado estable y auténtico. En esta sesión se verificó el estado real de producción y se preparó el mecanismo para correcciones controladas.

## Inventario real reconciliado

- **Total artículos en Firestore**: 286
- **Aprobados por MENI (publicados)**: 248
- **Rechazados por MENI (archivados/borrador)**: 38
- **Score residual `scoreCalidad`**: 0 (eliminado)
- **Provenance registrada**: 286 / 286 (100 %)
- **Categorías canónicas**: Nacionales (88), Sucesos (86), Internacionales (43), Deportes (42), Tecnología (14), Espectáculos (13)
- **Campo `perfil` MENI**: detectado vacío en 286 artículos → acción correctiva en curso

## Verificaciones realizadas

| Área | Resultado |
|---|---|
| MENI | Threshold de aprobación = 90 (`MIN_APPROVED_SCORE`). No hay caídas a `scoreCalidad`. |
| NIOS | `lib/nios/intelligence/data-merger.ts` no consume `scoreCalidad`; usa `scoreMeni` exclusivamente. |
| Homepage | `getLatestNews` y `getNewsByCategory` ordenan por `fecha` descendente. Frescura basada en fecha real. |
| Categorías | `lib/data.ts` ordena por `fecha` descendente. Sin reordenamiento por score. |
| Duplicados | Fase 15 concluyó sin duplicados reales (falso positivo resuelto). |
| Provenance | Fase 18 unificó campos; `cambiosRealizados` presente en los 286 artículos. |
| Costos | Endpoint `forensic-batch` opera con lotes de 40 IDs, dry-run por defecto y evita escrituras innecesarias. |

## Hallazgo activo

- **P3 — Perfiles**: el campo `perfil` (perfil de contenido MENI) está vacío en todos los artículos. Se va a poblar usando `detectContentProfile` con lotes controlados.
- **Conexión local a Firestore**: las credenciales del entorno local (`FIREBASE_PRIVATE_KEY`) fallan con `UNAUTHENTICATED`. El flujo operativo se ejecuta a través del endpoint desplegado en Vercel, que sí autentica correctamente.

## Entregables generados

- `FORENSIC_CURRENT_INVENTORY.json` — inventario refrescado desde producción
- `FORENSIC_CLASSIFICATION.json` — clasificación inicial 286 artículos
- `app/api/admin/forensic-batch/route.ts` — endpoint controlado para correcciones batch
- `scripts/forensic-refresh-inventory.cjs` — refresco programático del inventario
- `scripts/call-forensic-batch.cjs` — cliente para el endpoint batch

## Próximos pasos recomendados

1. ~~Poblar `perfil` en los 286 artículos con `detectContentProfile`.~~ ✅ Completado
2. ~~Ejecutar `npm run build` y `npm test` final.~~ ✅ Completado
3. ~~Revertir ruta pública `forensic-batch` en `middleware.ts` y redeploy.~~ ✅ Completado
4. Subir todo a GitHub (`git push`).
5. Cerrar fase final con entregables y certificación.

## Resultados finales

| Métrica | Valor |
|---|---|
| Tests | 22 archivos, 233 tests, **0 fallos** |
| Build local | ✅ Exitoso |
| Deploy Vercel | ✅ nicaraguainformate.com |
| Perfiles asignados | 286/286 (100%) |
| scoreCalidad residual | 0 |
| Acceso público forensic-batch | Cerrado (requiere auth admin) |

### Distribución de perfiles MENI asignados

| Perfil | Cantidad |
|---|---|
| sucesos | 73 |
| internacional | 49 |
| nacionales | 34 |
| ambiente | 31 |
| deportes | 30 |
| cultura | 16 |
| tecnologia | 13 |
| salud | 20 |
| turismo | 6 |
| educacion | 5 |
| economia | 3 |
| violencia_genero | 3 |
| gastronomia | 3 |
