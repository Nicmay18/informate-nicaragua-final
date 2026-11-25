# Self-Hosting en Windows — Nicaragua Informate ($0)

Stack: **Next.js standalone + Node.js + Cloudflare Tunnel + Firebase + Task Scheduler**.
Todo corre en tu PC 24/7. Costo recurrente: **US$0** (residuales Firebase documentados abajo).

## Orden de ejecución

```powershell
# 0. Prerequisitos (👤 manual, una vez):
#    - Node.js 22 LTS  → https://nodejs.org  (verificar: node --version)
#    - Repo clonado con .env.local completo
#    - Windows sin suspensión (el script lo intenta; si falla, ejecuta como Admin)

# 1. Instalar servidor + vigía + tarea de arranque
.\Install-SelfHost.ps1 -SourceDir "E:\PROYECTO\informate-nicaragua-final"
#    → compila standalone, copia runtime a ~\informate-prod\runtime,
#      registra tarea 'InformateServer' (arranque Windows + auto-restart)

# 2. Probar local
Start-ScheduledTask -TaskName InformateServer
curl http://localhost:3000/api/admin/estado     # 200 = OK
curl http://localhost:3000/                     # portada
curl http://localhost:3000/feed.xml             # RSS

# 3. Túnel Cloudflare (👤 requiere TU login de Cloudflare)
.\Setup-Tunnel.ps1 -TempHostname staging.nicaraguainformate.com -RouteDns
#    → instala cloudflared, login (navegador), crea túnel, servicio Windows,
#      ruta DNS del hostname TEMPORAL. El apex NO se toca.

# 4. Probar por el túnel temporal
curl https://staging.nicaraguainformate.com/api/admin/estado
#    → repetir matriz de pruebas (ver TESTING.md / docs/SELFHOST_RECOVERY.md)

# 5. Crons (solo cuando el servidor lleve estable un tiempo)
.\Install-Crontasks.ps1 -WhatIfOnly      # ver plan
.\Install-Crontasks.ps1                  # registrar (4 activas, 9 pausadas OFF)

# 6. (👤 con tu OK) Cambio DNS productivo → túnel
#    En Cloudflare dashboard o: cloudflared tunnel route dns informate-prod nicaraguainformate.com
#    ⚠️ Solo después de pasar TODAS las pruebas. Ver sección Rollback abajo.
```

## Archivos

| Archivo | Función |
|---|---|
| `Install-SelfHost.ps1` | Instalador principal (Node check, dirs, build, runtime, vigía, powercfg) |
| `Start-Informate.ps1` | Vigía: mantiene `node server.js` vivo + rotación de logs (50MB × 7) |
| `Setup-Tunnel.ps1` | cloudflared + túnel persistente + servicio Windows + DNS temporal |
| `Install-Crontasks.ps1` | Task Scheduler equivalente a los 13 crons de vercel.json |
| `Invoke-Cron.ps1` | Helper que llama un cron con CRON_SECRET en runtime |
| `Update-SelfHost.ps1` | Actualización: git pull → rebuild → rearmar runtime → restart |
| `Uninstall-SelfHost.ps1` | Rollback local: detiene tareas/servidor (NO toca DNS/Firebase) |
| `CRONS.md` | Inventario completo de los 13 crons con estado cost_guard |
| `config/` | Plantillas de configuración |

## Estructura resultante

```
~\informate-prod\
  .env.local            ← secretos (jamás en Git)
  runtime\              ← server.js + .next\ + public\ + node_modules (standalone)
  logs\                 ← watchdog.log, server-*.log, crons.log
```

## Rollback (honesto)

- **Local**: `Uninstall-SelfHost.ps1` — detiene todo, conserva archivos.
- **DNS**: mientras Vercel siga suspendido, apuntar el apex a Vercel **NO restaura servicio** (devuelve el 402). El rollback real es: DNS del apex → registro CNAME al túnel de Cloudflare, o quitar la ruta DNS para que el sitio quede caído como antes. **No hay "volver atrás" que recupere Vercel antes del ~24-dic.**
- **Firebase**: intacto en todo momento; nada de esto toca Firestore/Storage.

## Costos residuales (sin tráfico)

- Firestore storage + backups/PITR (~US$1.80/mes medido) → revisar en Firebase Console (desactivar PITR = decisión tuya, reversible).
- Storage de imágenes (GB-mes) — bajo, pero no cero si hay mucho contenido.
- Cloudflare Tunnel: gratis. Dominio: ya pagado hasta 2027-03-21. Electricidad: la de tu PC.

## ⚠️ Antes de instalar: secretos

Tu `.env.local` local tiene **`CRON_SECRET=""` vacío** (en Vercel vive en
dashboard → Environment Variables). Antes de instalar:

1. Ve a Vercel → Project → Settings → Environment Variables y copia los
   valores reales de `CRON_SECRET`, `ADMIN_API_KEY`, `TG_TOKEN`, Firebase.
2. Pégalos en `.env.local` del repo (o en `~\informate-prod\.env.local`
   después de instalar). `Install-SelfHost.ps1` avisa si alguno está vacío.

## Seguridad

- Secretos solo en `~\informate-prod\.env.local` (fuera del repo, `.gitignore` cubre `.env*`).
- Crons: secreto leído en runtime por `Invoke-Cron.ps1`, nunca en la definición de la tarea ni en logs.
- Túnel: HTTPS automático, origen solo `127.0.0.1:3000` (no expone el puerto directamente).
- Panel admin: protegido por auth de la app; el túnel no añade superficie extra.
