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

### Opción A — PC siempre encendida (la más rápida)

1. En la máquina (Windows/Linux/Mac siempre encendida):
   ```bash
   git clone https://github.com/Nicmay18/informate-nicaragua-final.git
   cd informate-nicaragua-final && git checkout <rama aprobada>
   npm ci && npm run build
   ```
2. Copiar variables de entorno: las mismas de `.env.local`
   (FIREBASE_*, NEXT_PUBLIC_*, TELEGRAM_*, GOOGLE_INDEXING_*, etc.) a
   `.env.local` del servidor — **nunca en Git**.
3. Arrancar:
   ```bash
   cd .next/standalone && cp -r ../../public . && cp -r ../../.next/static .next/static
   node server.js   # escucha :3000 por defecto (PORT env para cambiar)
   ```
4. Exponer con Cloudflare Tunnel (gratis):
   ```bash
   cloudflared tunnel login        # 👤 autoriza en dashboard CF
   cloudflared tunnel create informate
   # crear DNS route: cloudflared tunnel route dns informate nicaraguainformate.com
   cloudflared tunnel run informate
   ```
   Esto reemplaza el registro A/CNAME del apex por el túnel —
   👤 lo haces tú en el dashboard de Cloudflare (mi zona DNS no la toco).
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
