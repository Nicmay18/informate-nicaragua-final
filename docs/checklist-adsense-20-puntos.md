# Checklist 20 Puntos - Reaplicación a Google AdSense

**Fecha:** 14 de mayo de 2026
**Objetivo:** Aprobar en Google AdSense después de 3 meses de rechazos por "contenido de poco valor"

---

## SECCIÓN 1: CONTENIDO Y CALIDAD (5 puntos)

- [ ] **1. Ejecutar script de limpieza de listas duplicadas**
  ```bash
  node scripts/check-duplicate-bullets.js
  node scripts/clean-duplicate-bullets.js
  ```
  **Verificar:** 0 noticias con duplicación en reporte

- [ ] **2. Ejecutar script de detección de prompt residue**
  ```bash
  node scripts/check-prompt-residue.js
  ```
  **Verificar:** 0 noticias con frases sospechosas en reporte

- [ ] **3. Diversificar contenido según calendario editorial**
  - Sucesos: ≤30% del total
  - Nacionales: ≥25%
  - Deportes: ≥15%
  - Internacionales: ≥10%
  - Espectáculos: ≥5%

- [ ] **4. Revisar últimas 30 noticias manualmente**
  - Sin contenido repetido
  - Sin frases de "cumplimiento de metas AdSense"
  - Sin prompt residue
  - Títulos objetivos sin sensacionalismo

- [ ] **5. Verificar longitud mínima de artículos**
  - Mínimo 300 palabras por noticia
  - Resumen informativo (no solo título repetido)
  - Estructura clara: introducción, desarrollo, conclusión

---

## SECCIÓN 2: PÁGINAS LEGALES Y POLÍTICAS (5 puntos)

- [ ] **6. Verificar robots.txt accesible**
  ```
  https://nicaraguainformate.com/robots.txt
  ```
  **Debe retornar:** HTTP 200 con contenido correcto

- [ ] **7. Verificar sitemap.xml accesible**
  ```
  https://nicaraguainformate.com/sitemap.xml
  ```
  **Debe incluir:** Todas las 102 noticias + páginas estáticas

- [ ] **8. Verificar /nosotros (y redirección /quienes-somos)**
  ```
  https://nicaraguainformate.com/nosotros
  https://nicaraguainformate.com/quienes-somos → 301 a /nosotros
  ```

- [ ] **9. Verificar /privacidad (y redirección /politica-de-privacidad)**
  ```
  https://nicaraguainformate.com/privacidad
  https://nicaraguainformate.com/politica-de-privacidad → 301 a /privacidad
  ```

- [ ] **10. Verificar /terminos-de-uso (y /terminos)**
  ```
  https://nicaraguainformate.com/terminos-de-uso
  https://nicaraguainformate.com/terminos
  ```
  **Ambas deben:** Retornar HTTP 200 con contenido legal

---

## SECCIÓN 3: TÉCNICO Y SEO (5 puntos)

- [ ] **11. Verificar datos estructurados en noticias**
  - Schema.org/NewsArticle presente en HTML
  - Campos: headline, datePublished, author, image, publisher
  - Validar en: https://validator.schema.org/

- [ ] **12. Verificar meta tags en homepage**
  - title: "Nicaragua Informate — Noticias de Nicaragua"
  - description: Presente y ≤155 caracteres
  - robots: "index, follow"
  - canonical: https://nicaraguainformate.com/

- [ ] **13. Verificar rendimiento (Lighthouse)**
  - Performance: ≥70
  - Accessibility: ≥90
  - Best Practices: ≥80
  - SEO: ≥90

- [ ] **14. Verificar mobile-friendliness**
  - Responsive en iPhone SE (375x667)
  - Responsive en iPad (768x1024)
  - Texto legible sin zoom
  - Botones táctiles ≥44x44px

- [ ] **15. Verificar HTTPS y certificado SSL**
  ```
  https://nicaraguainformate.com
  ```
  **Debe:** Certificado válido, sin warnings de navegador

---

## SECCIÓN 4: EXPERIENCIA DE USUARIO (5 puntos)

- [ ] **16. Verificar navegación clara**
  - Menú principal visible en mobile
  - Breadcrumb en noticias: Inicio > Categoría > Artículo
  - Botón "volver" funcional

- [ ] **17. Verificar sin contenido auto-generado evidente**
  - No frases como "Este artículo cumple con..."
  - No "keywords principales:" en texto
  - No "meta description:" en texto
  - No "SEO" mencionado en contenido

- [ ] **18. Verificar sin pop-ups intrusivos**
  - AdSense no bloquea contenido inicial
  - Cookie banner aceptable (no full-screen)
  - Sin interstitials al entrar

- [ ] **19. Verificar contenido único**
  - No copias de otros sitios
  - No spinner text (texto generado por IA sin edición)
  - No artículos duplicados con mismo contenido diferente título

- [ ] **20. Verificar contacto accesible**
  ```
  https://nicaraguainformate.com/contacto
  ```
  **Debe:** Formulario funcional + email legal@nicaraguainformate.com

---

## PASOS PARA REAPLICAR A ADSENSE

### 1. Pre-aplicación (Antes de solicitar)
- Ejecutar scripts de limpieza (puntos 1-2)
- Implementar calendario editorial por 7 días mínimo (punto 3)
- Verificar todas las URLs legales (puntos 6-10)
- Corregir cualquier error encontrado

### 2. Solicitud en AdSense
1. Ir a https://adsense.google.com/
2. Iniciar sesión con cuenta de Google
3. Hacer clic en "Empezar" o "Volver a aplicar"
4. Agregar sitio: `https://nicaraguainformate.com`
5. Seleccionar idioma: Español
6. Confirmar que no estás usando otro programa de anuncios

### 3. Verificación automática (1-3 días)
- Google crawleará el sitio
- Verificará contenido, páginas legales, rendimiento
- Revisará datos estructurados y SEO

### 4. Revisión manual (si es requerida)
- Especialista humano revisará contenido
- Buscará contenido de valor real
- Verificará que no sea contenido "falso" o auto-generado

### 5. Aprobación o rechazo
- Si aprobado: Configurar anuncios
- Si rechazado: Revisar motivo específico y corregir

---

## MOTIVOS COMUNES DE RECHAZO Y SOLUCIONES

| Motivo | Solución |
|--------|----------|
| Contenido de poco valor | Diversificar categorías, reducir sucesos, aumentar longitud de artículos |
| Contenido auto-generado | Editar todo contenido de IA, añadir voz humana, verificar prompt residue |
| Páginas legales faltantes | Crear /nosotros, /privacidad, /terminos-de-uso, /contacto |
| Sitio no accesible | Verificar robots.txt, sitemap.xml, HTTPS |
| Contenido duplicado | Ejecutar script de limpieza, verificar canonical tags |
| Experiencia de usuario pobre | Mejorar mobile, eliminar pop-ups, mejorar navegación |
| Dominio muy nuevo | Esperar 3-6 meses, continuar publicando contenido de calidad |
| Tráfico insuficiente | Promover en redes sociales, SEO, compartir contenido |

---

## CHECKLIST POST-APROBACIÓN

- [ ] Configurar unidades de anuncios
  - Leaderboard (728x90) en header
  - Rectangular (336x280) en contenido
  - Mobile (320x100) en footer móvil
  - Sidebar (300x250) en páginas de noticia

- [ ] Implementar AdSense Auto Ads (opcional)
  - Copiar código en layout.tsx
  - Verificar que no interfiera con rendimiento

- [ ] Verificar cumplimiento de políticas
  - No clics propios
  - No incentivar clics
  - No contenido adulto/violento
  - No derechos de autor infringidos

- [ ] Monitorear rendimiento
  - CPC, CPM, RPM
  - Tasa de clics (CTR)
  - Ingresos por página

---

## CONTACTO DE SOPORTE ADSENSE

Si después de 7 días no hay respuesta:
- Centro de ayuda: https://support.google.com/adsense/
- Foro de comunidad: https://support.google.com/adsense/community
- Twitter: @AdSense

---

## FECHA LÍMITE DE IMPLEMENTACIÓN

**Todos los puntos deben completarse antes del:** 21 de mayo de 2026

**Fecha sugerida de reaplicación:** 22 de mayo de 2026

---

## RESPONSABLES

- **Desarrollador:** Puntos 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
- **Editor:** Puntos 1, 2, 3, 4, 5, 17, 19
- **Diseñador UX:** Puntos 16, 18
- **Gerente de producto:** Supervisión general y coordinación

---

## NOTAS

- Los scripts requieren `firebase-admin-key.json` en el directorio `scripts/`
- El build debe ejecutarse después de cambios técnicos: `npm run build`
- Verificar en Search Console que el sitemap está indexado
- Monitorear Search Console para errores de rastreo
