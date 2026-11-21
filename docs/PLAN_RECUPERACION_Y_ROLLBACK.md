# Plan de Recuperación y Rollback

## 1. Rollback del código (deploy)

**Mecanismo**: Vercel mantiene historial de deployments. Cada deploy es inmutable.

1. Vercel Dashboard → proyecto `informate-nicaragua-nextjs` → **Deployments**.
2. Localizar el deployment anterior estable (el anterior al merge de `audit/costos-firestore`).
3. **⋯ → Promote to Production** — instantáneo, sin rebuild.
4. Alternativa git: `git revert` del merge commit en master + push (dispara rebuild ~5–10 min).

**Señales para hacer rollback**: errores 5xx en páginas públicas, noticias que no cargan, MENI/NIOS crons fallando, AdSense desaparecido, sitemap/feed roto.

## 2. Rollback de datos (Firestore)

**No se modificaron datos en esta misión** — todos los cambios son de código. Excepción potencial: `config/cost_guard` y `cost_daily/*` son docs NUEVOS (no destructivos; borrarlos no afecta nada).

Si en el futuro se migra `fecha` a Timestamp (ver §4): cada doc migrado conserva `fecha_original` → reversión = restaurar campo + redeploy de código dual.

## 3. Firestore Backups / PITR (recuperación de datos)

- **PITR**: si está habilitado (facturación sugiere que sí, 0.92 GiB-mo), permite restaurar a cualquier punto de los últimos 7 días — consola → Firestore → PITR → Restore.
- **Zonal backups**: restores programados según retención configurada.
- **Antes de cualquier migración de datos**: exportar colección `noticias` (Firestore → Export managed export a Cloud Storage) como respaldo adicional.

## 4. Decisión sobre migración `fecha` → Timestamp (Fase 9)

**Datos verificados en producción** (751 docs):
- `fecha`: 539 Timestamp + 212 String ISO — tipo mixto real.
- `publishedAt`: 497 Timestamp + 254 ausentes.

**Análisis de costo**: Firestore cobra por documento devuelto. Las queries duales (`fecha < boundary` Timestamp, `fecha >= boundary` String) leen cada doc publicado **una sola vez** repartido entre ambas. Migrar los 212 strings a Timestamp NO reduce lecturas (~751 docs se leen igual, solo en una query en vez de dos) — ahorra ~1 query overhead y simplifica código, pero **el ahorro de costo proyectado (60%) era incorrecto**: aplicaba al modelo viejo de triple-scan, no al actual.

**Decisión**: NO ejecutar la migración ahora.
- Riesgo: escritura en 212 docs productivos + coordinación código/datos.
- Beneficio de costo: ~0 (verificado por modelo de facturación).
- Alternativa futura segura: cuando se haga otra migración de datos, migrar en lotes de 50 con `fecha_original` de respaldo y validar con queries duales activas.

## 5. Cost Guard — desactivación de emergencia

Si `config/cost_guard` quedara en `economy` por error:
- Borrar el doc o poner `mode: 'normal'` → todo vuelve en ≤5 min (caché).
- No requiere deploy ni restart.

## 6. Checklist post-deploy (smoke)

- [ ] `/` carga noticias (portada)
- [ ] `/noticias` lista artículos
- [ ] `/noticias/[slug]` muestra artículo completo con contenido
- [ ] `/categoria/[cat]` funciona
- [ ] `/sitemap.xml`, `/news-sitemap.xml`, `/feed.xml`, `/feed.json`, `/rss` responden 200
- [ ] `/guia/apostillar`, `/guia/salario-minimo` cargan (mejoras SEO `49af2a3c`)
- [ ] Panel admin accesible (protegido por auth)
- [ ] Telegram: próxima publicación llega al canal
- [ ] AdSense: script presente, no bloqueado
- [ ] Googlebot: `curl -A Googlebot` recibe 200 en artículos
