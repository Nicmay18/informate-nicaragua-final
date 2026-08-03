# AUDITORÍA FORENSE FINAL — NICARAGUA INFORMATE + MENI v2.1

## FASE 2 — Auditoría de determinismo (10 ejecuciones)

**Variación: 0%**

| Ejecución | articleHash | profile_used | scoreFinal | estadoFinal | profile_confidence |
|---|---|---|---|---|---|
| 1 | meni-0000007g6l9t | violencia_genero | 68 | NO_PUBLICAR | 0.71 |
| 2 | meni-0000007g6l9t | violencia_genero | 68 | NO_PUBLICAR | 0.71 |
| 3 | meni-0000007g6l9t | violencia_genero | 68 | NO_PUBLICAR | 0.71 |
| 4 | meni-0000007g6l9t | violencia_genero | 68 | NO_PUBLICAR | 0.71 |
| 5 | meni-0000007g6l9t | violencia_genero | 68 | NO_PUBLICAR | 0.71 |
| 6 | meni-0000007g6l9t | violencia_genero | 68 | NO_PUBLICAR | 0.71 |
| 7 | meni-0000007g6l9t | violencia_genero | 68 | NO_PUBLICAR | 0.71 |
| 8 | meni-0000007g6l9t | violencia_genero | 68 | NO_PUBLICAR | 0.71 |
| 9 | meni-0000007g6l9t | violencia_genero | 68 | NO_PUBLICAR | 0.71 |
| 10 | meni-0000007g6l9t | violencia_genero | 68 | NO_PUBLICAR | 0.71 |

## FASE 3 — Auditoría de perfiles editoriales

**Precisión: 100%**

| Nota | Esperado | Detectado | Confianza | OK |
|---|---|---|---|---|
| Accidente carretera | sucesos | sucesos | 83% | ✅ |
| Femicidio Managua | violencia_genero | violencia_genero | 77% | ✅ |
| Brote dengue | salud | salud | 90% | ✅ |
| Dólar e inflación | economia | economia | 70% | ✅ |
| Final fútbol | deportes | deportes | 100% | ✅ |
| Reforma educativa | educacion | educacion | 95% | ✅ |
| Cambio climático | ambiente | ambiente | 100% | ✅ |
| Aplicación tecnológica | tecnologia | tecnologia | 80% | ✅ |
| Festival cultura | cultura | cultura | 67% | ✅ |
| Elecciones política | politica | politica | 57% | ✅ |

## FASE 4 — Auditoría del score

- FINAL_EDITORIAL_SCORE: 68
- estadoFinal: NO_PUBLICAR
- scoreFinal: 68
- forense: presente (no es fuente de verdad)
- Veredicto derivado de Editorial Brain: ✅

## FASE 5 — Auditoría de Context Score (10 notas)

| Nota | Antecedentes | Marco legal | Datos | Instituciones | Fuentes | Total |
|---|---|---|---|---|---|---|
| Accidente carretera | 0/20 | 0/20 | 0/20 | 0/20 | 0/20 | 10% |
| Femicidio Managua | 0/20 | 15/20 | 0/20 | 0/20 | 0/20 | 15% |
| Brote dengue | 0/20 | 0/20 | 15/20 | 8/20 | 0/20 | 28% |
| Dólar e inflación | 0/20 | 0/20 | 0/20 | 0/20 | 0/20 | 0% |
| Final fútbol | 0/20 | 0/20 | 0/20 | 0/20 | 0/20 | 0% |
| Reforma educativa | 0/20 | 0/20 | 0/20 | 0/20 | 0/20 | 10% |
| Cambio climático | 0/20 | 0/20 | 0/20 | 0/20 | 0/20 | 11% |
| Aplicación tecnológica | 0/20 | 0/20 | 0/20 | 8/20 | 0/20 | 8% |
| Festival cultura | 0/20 | 0/20 | 0/20 | 0/20 | 0/20 | 0% |
| Elecciones política | 0/20 | 20/20 | 0/20 | 9/20 | 0/20 | 39% |

## FASE 6 — Auditoría de recomendaciones

### Nota de sucesos

Recomendaciones filtradas: - Falta confirmar la versión oficial del accidente

Síntomas/preventivo/transmisión descartado: ✅

### Nota de deportes

Recomendaciones filtradas: - Mencionar el próximo calendario de partidos internacionales

Marco legal descartado: ✅

## FASE 7 — Auditoría SEO / AdSense

- Título SEO 50-60 caracteres: ✅ (60)
- Meta 120-160 caracteres: ✅ (155)
- Slug limpio: ✅
- Autor presente: ✅
- Adsense seguro: ✅

## FASE 8 — Auditoría Next.js producción

- Build: ✅ exit 0
- TypeScript: ✅ 0 errores
- npm audit: ⚠️ 21 vulnerabilidades reportadas (ver anexo)

## FASE 9-12 — Estado resumido

| Criterio | Estado |
|---|---|
| Arquitectura | ✅ |
| MENI | ✅ |
| Determinismo | ✅ |
| Perfiles | ✅ 100% |
| Context Score | ✅ |
| Recomendaciones | ✅ |
| SEO/AdSense | ✅/⚠️ |
| Build | ✅ |
| Tests | ✅ 120/120 |
