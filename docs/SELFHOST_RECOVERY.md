# Runbook — Operación a costo US$0 (recuperación Vercel-suspendido)

> Estado: propuesta en rama `proposal/selfhost-standalone`. Nada de esto
> está desplegado. Requiere acciones del propietario marcadas con 👤.

## Contexto

- Vercel pausó el equipo `nicmay18s-projects` por exceder Fast Origin
  Transfer (10,34/10 GB) e ISR Writes (244K/200K). Reactivación estimada
  ~24-dic-2026 según panel (no verificable desde código).
- Dominio `nicaraguainformate.com` válido hasta **2027-03-21** (RDAP).
- DNS sigue en Cloudflare; el 402 `DEPLOYMENT_DISABLED` lo sirve Vercel.

## Por qué self-hosting es la única ruta $0 viable

| Alternativa | Veredicto |
|---|---|
| Esperar a Vercel (~30 días) | $0 pero ~1 mes caído; SEO/AdSense/lectores se degradan; y hay que reducir consumo ANTES o re-suspende |
| Netlify free | 125K invocaciones/mes < las ~225K medidas → no cabe sin recortar antes |
| Cloudflare Pages/OpenNext | `firebase-admin` no corre en Workers → refactor grande, inviable corto plazo |
| Render/Koyeb free | cold starts + límites; backup, no principal |
| **PC/VPS siempre encendido + `node server.js`** | ✅ $0, mismo código, ISR/Firestore-Admin/Telegram intactos |

## Arquitectura objetivo $0

```
Lector/bot → Cloudflare (DNS ya está ahí, proxy naranja)
   → Cloudflare Tunnel (cloudflared, gratis) o DNS directo
   → Node.js `server.js` (standalone) en máquina siempre encendida
   → Firebase Admin SDK → Firestore/Storage (sigue en GCP, ~$0 en idle)
   → Telegram API (gratis)
```

Ventaja extra: Cloudflare Tunnel es **gratuito e ilimitado** y no requiere
abrir puertos del router ni IP fija.

## Pasos de despliegue (ejecuta el propietario 👤)

### Opción A — PC Windows siempre encendida (la más rápida) ✅ IMPLEMENTADA

> **El procedimiento automatizado completo está en `deploy/windows/`**
> (instalador, vigía con auto-restart, túnel Cloudflare, Task Scheduler para
> los 13 crons, actualización y rollback). Resumen abajo; los scripts son la
> fuente de verdad.

1. En la máquina (Windows siempre encendida):
   ```powershell
   cd deploy\windows
   .\Install-SelfHost.ps1 -SourceDir "E:\PROYECTO\informate-nicaragua-final"
   # compila standalone, monta ~\informate-prod\runtime, registra la tarea
   # 'InformateServer' (arranque de Windows + auto-restart + logs rotativos)
   ```
2. Copiar variables de entorno: las mismas de `.env.local`
   (FIREBASE_*, NEXT_PUBLIC_*, TELEGRAM_*, GOOGLE_INDEXING_*, etc.) a
   `.env.local` del servidor — **nunca en Git**.
   ⚠️ `CRON_SECRET` está VACÍO en `.env.local` local: cópialo de Vercel
   → Project Settings → Environment Variables antes de instalar.
3. Probar local: `curl http://localhost:3000/api/admin/estado` → 200.
4. Exponer con Cloudflare Tunnel (gratis):
   ```powershell
   .\Setup-Tunnel.ps1 -TempHostname staging.nicaraguainformate.com -RouteDns
   ```
   Crea túnel persistente + servicio Windows + DNS del hostname TEMPORAL.
   **El apex productivo NO se toca** hasta autorizar el cutover.
5. Crons (cuando el servidor esté estable):
   ```powershell
   .\Install-Crontasks.ps1 -WhatIfOnly   # plan
   .\Install-Crontasks.ps1               # registra 13 tareas
   ```
   4 activas / 9 deshabilitadas por `cost_guard=economy` (ver `deploy/windows/CRONS.md`).

Actualización futura: `.\Update-SelfHost.ps1 -SourceDir <repo>`
Rollback local: `.\Uninstall-SelfHost.ps1`

> El cambio del apex productivo a la ruta del túnel es un paso 👤 separado
> y autorizado (ver `deploy/windows/README.md` sección Rollback).

5. ISR/cachés: funcionan igual (filesystem cache en `.next/cache`).

### Opción B — Oracle Cloud Always Free (más robusto, requiere cuenta 👤)

1. Crear cuenta Oracle Cloud (Always Free: VM ARM 4 OCPU/24GB — gratis
   permanente; el registro puede pedir tarjeta pero no cobra por Always Free).
2. Instalar Node 20+, clonar repo, `npm ci && npm run build`,
   `node .next/standalone/server.js` bajo `systemd`/`pm2`.
3. TLS gratis con Caddy (`caddy nicaraguainformate.com`) o Cloudflare Tunnel.
4. DNS: cambiar apex de Vercel a la IP de la VM (👤 en Cloudflare).

## Costos residuales GCP (con sitio caído o migrado)

- Firestore reads/writes: ~0 mientras no haya tráfico ni crons (los crons
  son Vercel Functions → están pausados). Los datos NO se borran.
- **Sigue facturando**: backups/PITR (~US$1.80/mes medido) + Storage de
  imágenes (GB-mes). Acción gratuita del propietario 👤:
  Firebase Console → Firestore → Backups: **desactivar PITR y backups
  programados** (los datos y la colección quedan intactos; reversible).
- Cuota gratuita diaria de Firestore (50K reads/día) cubre operación
  ligera futura.

## Verificación post-migración

- `curl -I https://nicaraguainformate.com/` → 200 (no 402).
- `/noticias`, artículo, `/feed.xml`, `/sitemap.xml`, `/api/admin/estado`.
- Publicar noticia de prueba → aparece <5min (ISR local revalida igual).
- Telegram: 1 mensaje, sin duplicados.

## Rollback

- Volver DNS del apex a Vercel (`cname.vercel-dns.com` / registros
  anteriores) en Cloudflare — el sitio vuelve al estado actual en minutos.
- `output: 'standalone'` es inerte en Vercel: revertir = quitar 5 líneas.

## Limitaciones honestas

- La PC/opción A depende de que la máquina no se apague; si es el PC de
  trabajo, la disponibilidad será menor que Vercel.
- Sin Vercel no hay CDN edge de Vercel; Cloudflare (proxy naranja) sigue
  absorbiendo estáticos y puede cachear HTML con Cache Rules (gratis).
- ISR Writes ya no aplican (eran límite Vercel); el consumo local no tiene
  techo de factura porque no hay factura.
