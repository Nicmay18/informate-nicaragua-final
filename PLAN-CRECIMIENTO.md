# PLAN DE CRECIMIENTO — nicaraguainformate.com
## Fecha: 2026-06-15 | Score Técnico: 97% (LISTO)

---

## PARTE 1: GOOGLE ADSENSE (Ingresos)

### Estado: ✅ LISTO PARA APLICAR
- Thin content: NO
- Clickbait: NO
- Valor original: SÍ
- Revisión editorial: SÍ
- E-E-A-T completo: SÍ

### Datos que necesitás
| Campo | Valor |
|-------|-------|
| URL del sitio | `https://nicaraguainformate.com` |
| Correo de contacto | (usá tu Gmail principal) |
| Idioma del contenido | Español |
| País | Nicaragua |
| Categoría | Noticias / Medios de comunicación |
| Código postal | (tu código postal de Managua o donde vivas) |
| Teléfono | (tu número real) |

### Pasos a seguir
1. Andá a https://www.google.com/adsense/start
2. Hacé clic en "Empezar"
3. Iniciá sesión con tu cuenta de Google
4. En "Tu sitio web", pegá: `https://nicaraguainformate.com`
5. Seleccioná idioma: **Español**
6. Marcá que aceptás los términos
7. Google te dará un código de verificación (un `<meta>` tag)
8. Copiá ese meta tag y decímelo para que lo agregue al sitio
9. Esperá la revisión de Google (entre 1 día y 2 semanas)

---

## PARTE 2: GOOGLE NEWS PUBLISHER CENTER

### Estado: ✅ DISPONIBLE PARA NICARAGUA
Google News sí funciona con país `gl=NI`. No hay edición local propia, pero tu contenido aparece en la edición global en español.

### Datos que necesitás
| Campo | Valor |
|-------|-------|
| Nombre de la publicación | Nicaragua Informate |
| URL principal | `https://nicaraguainformate.com` |
| País / región | Nicaragua |
| Idioma principal | Español |
| Zona horaria | América/Managua (CST, UTC-6) |
| Feed RSS | `https://nicaraguainformate.com/feed.xml` |
| Sitemap noticias | `https://nicaraguainformate.com/news-sitemap.xml` |
| Logo (recomendado) | `https://nicaraguainformate.com/logo.webp` (512x512) |
| Contacto editorial | (tu correo real) |

### Pasos a seguir
1. Andá a https://publishercenter.google.com
2. Hacé clic en "Agregar publicación"
3. Completá los datos de arriba
4. Agregá las secciones:
   - Sucesos → `https://nicaraguainformate.com/categoria/sucesos`
   - Nacionales → `https://nicaraguainformate.com/categoria/nacionales`
   - Deportes → `https://nicaraguainformate.com/categoria/deportes`
   - Espectáculos → `https://nicaraguainformate.com/categoria/espectaculos`
   - Tecnología → `https://nicaraguainformate.com/categoria/tecnologia`
   - Internacionales → `https://nicaraguainformate.com/categoria/internacionales`
5. Verificá la propiedad del dominio (con DNS TXT o HTML tag)
6. Esperá aprobación (entre 1 y 7 días)

---

## PARTE 3: VERIFICACIÓN DE SEARCH CONSOLE

### Estado: ✅ NECESARIO
Antes de AdSense y Publisher Center, Google necesita verificar que sos dueño del dominio.

### Método recomendado: Meta tag HTML
1. Andá a https://search.google.com/search-console
2. Agregá propiedad tipo "Prefijo de URL": `https://nicaraguainformate.com/`
3. Elegí método "Etiqueta HTML"
4. Google te dará algo como:
   ```html
   <meta name="google-site-verification" content="ABC123..." />
   ```
5. Pasame ese código y lo agrego al `<head>` del sitio
6. Hacé clic en "Verificar" en Search Console

---

## PARTE 4: LO QUE YA ESTÁ HECHO (No tocar)

- [x] Schema NewsArticle en cada noticia
- [x] Schema BreadcrumbList
- [x] Schema Organization
- [x] Sitemap general (`/sitemap.xml`)
- [x] News sitemap (`/news-sitemap.xml`) con 16 noticias
- [x] `robots.txt` apuntando a ambos sitemaps
- [x] Páginas legales: Términos, Privacidad, Cookies, Correcciones, Editorial
- [x] Página Nosotros y Contacto
- [x] H1 presentes en todas las páginas
- [x] HTTPS + HSTS + CSP + headers de seguridad
- [x] Meta descriptions 150-170 chars
- [x] Títulos SEO 50-70 chars
- [x] Autores con nombres reales en cada noticia
- [x] Fechas de publicación y modificación visibles
- [x] Imágenes destacadas en cada noticia
- [x] 212 noticias en Firestore, todas con slug válido
- [x] Sin slugs duplicados

---

## PARTE 5: ACCIONES QUE VOS TENÉS QUE HACER

Orden recomendado:

1. **HOY**: Verificar dominio en Search Console (pasame el meta tag)
2. **MAÑANA**: Aplicar a AdSense (https://www.google.com/adsense/start)
3. **DESPUÉS**: Registrar en Publisher Center (https://publishercenter.google.com)
4. **SEMANAL**: Publicar mínimo 3 noticias nuevas (Google premia frescura)
5. **MENSUAL**: Revisar Search Console → Rendimiento → Consultas para ajustar títulos

---

## PARTE 6: RECURSOS ÚTILES

- Search Console: https://search.google.com/search-console
- AdSense: https://www.google.com/adsense/start
- Publisher Center: https://publishercenter.google.com
- Analytics: https://analytics.google.com (si no tenés, creala con la misma cuenta Google)

---

*Documento generado automáticamente. El sitio está técnicamente listo para monetización.*
