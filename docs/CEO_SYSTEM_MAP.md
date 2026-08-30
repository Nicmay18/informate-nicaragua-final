# CEO SYSTEM MAP

## 1. Flujo del lector

```
USER
↓
HOME
↓
CATEGORY
↓
ARTICLE
↓
RELATED CONTENT
↓
NEXT ARTICLE
↓
NEWSLETTER / SOCIAL / RADIO / UTILITY
↓
RETURN VISIT
↓
LOYAL USER
↓
REVENUE
```

## 2. Flujo de contenido e inteligencia

```
CONTENT (Firestore noticias + guías)
↓
MENI (lib/editorial/core, lib/editor-jefe-v4)
↓
EDITORIAL (admin/editor, admin/portada)
↓
SEO / schemas / sitemap
↓
PUBLICATION (app/noticias, app/guia)
↓
GOOGLE (GSC, GA4, News, Discover)
↓
SOCIAL (Facebook, Telegram)
↓
TRAFFIC (lib/analytics/traffic-reader)
↓
NIOS (lib/nios/intelligence/orchestrator)
↓
CEO (lib/nios/ceo-loop)
↓
DECISION (lib/nios/ceo-action-registry)
↓
ACTION (auto / human / blocked)
↓
VERIFY (nios_memory, reparaciones)
↓
LEARN (lib/nios/ceo-learning)
↓
MEMORY (lib/nios/ceo-memory)
```

## 3. Capas principales

| Capa | Directorio | Estado |
|------|------------|--------|
| UI / Pages | `app/`, `components/` | ACTIVE |
| Editorial | `lib/editorial/core/`, `lib/editor-jefe-v4/` | ESTABLE |
| Negocio | `lib/nios/business/` | ACTIVE |
| CEO | `lib/nios/ceo-*` | OPERATIONAL |
| Comando | `lib/nios/command-center/` | ACTIVE |
| Datos | `lib/data.ts`, `lib/firebase-admin.ts` | ACTIVE |
| SEO | `lib/seo/`, `app/sitemap.ts`, `app/robots.ts` | ACTIVE |
| Analytics | `lib/analytics/` | ACTIVE |
| Auth / Security | `lib/auth.ts`, `middleware.ts` | SECURITY_SENSITIVE |

## 4. Integraciones externas

| Fuente | Estado | Evidencia |
|--------|--------|-----------|
| Firestore | REAL | 320 noticias leídas |
| GSC | BLOCKED | `ACCESS_BLOCKED` |
| GA4 | NOT_CONFIGURED | `NO_DATA` |
| AdSense | NOT_CONFIGURED | `GOOGLE_ADSENSE_CLIENT_ID` no definido |
| Cron 24/7 | REAL | `vercel.json` con 2 schedules |

## 5. Cadenas activas

- NIOS Pipeline → CEO Loop → Memory ✅
- Noticias → SEO → Google News (parcial, sin GSC) ⚠️
- Admin → Portada → Firestore ✅
- Social → Web (falta tracking real) ⚠️

## 6. Cadenas rotas

- GSC ↔ CEO (permisos)
- GA4 ↔ NIOS (property ID)
- AdSense ↔ Revenue (client ID)
