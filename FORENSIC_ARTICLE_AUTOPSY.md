# AUTOPSIA FORENSE DEL CORPUS — NICARAGUA INFORMATE
Generado: 2026-10-22T15:29:29.178Z | Método: export Firestore noticias (614 docs) → análisis automático (scripts/forensic-autopsy.mjs + forensic-classify.mjs) + verificación manual por muestreo + verificación web puntual

Corpus: 614 docs | publicados: 597 | despublicados: 2 | archivados: 15

## MATRIZ EJECUTIVA

| Clase | Cantidad |
|---|---|
| 🟢 A — CONSERVAR | 131 |
| 🟡 B — PULIR | 361 |
| 🟠 C — REVISIÓN EDITORIAL | 67 |
| 🔴 D — DEFECTUOSOS | 35 |
| ⚫ E — CANDIDATOS A RETIRAR | 3 |

| Métrica | Valor |
|---|---|
| A_conservar | 131 |
| B_pulir | 361 |
| C_revision | 67 |
| D_defectuosos | 35 |
| E_retirar | 3 |
| sinFuenteF0 | 101 |
| atribucionDudosa | 90 |
| duplicadosExactos | 0 |
| casiDuplicados | 0 |
| mismosEventosRecurrentes | 17 |
| parrafosPlantilla | 23 |
| oaiciteResiduoDB | 9 |
| eufemismoAfectado | 29 |
| duplicacionInternaMasiva | 3 |

## ⚫ E — CANDIDATOS A RETIRAR (lista para aprobación, NO ejecutar)

### investigaciones-por-fallecimiento-en-barrio-old-bank-bluefields
- URL: https://nicaraguainformate.com/noticias/investigaciones-por-fallecimiento-en-barrio-old-bank-bluefields
- Fecha: 2026-06-24 | Categoría: Sucesos | Autor: José Luis López Ramírez | Palabras: 2039
- scoreMeni: 100 (el auditor le dio 100 a un artículo con 42 párrafos repetidos — falso positivo del auditor)
- Evidencia: CUERPO_EUFEMISMO — "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo ; PARRAFO_PLANTILLA — párrafo genérico idéntico inyectado en >=4 artículos (ej. "coordinación entre Policía Nacional, Cruz Roja") ; DUPLICACION_MASIVA_INTERNA — el mismo párrafo se repite 42 veces dentro del artículo (basura estructural de generación) ; ATRIBUCION_VAGA — autoridades competentes ; ORACIONES_REPETIDAS — 63 oraciones duplicadas internas
- Acción propuesta: Candidato a retirar: cuerpo con el mismo párrafo repetido ≥20 veces. Alternativa: deduplicar mecánicamente si los ~12 párrafos únicos forman una nota verificable.
- Confianza: CONFIRMADO (patrón textual verificado)

### tres-ataques-de-pitbull-en-nicaragua-dejan-tres-lesionados
- URL: https://nicaraguainformate.com/noticias/tres-ataques-de-pitbull-en-nicaragua-dejan-tres-lesionados
- Fecha: 2026-06-18 | Categoría: Sucesos | Autor: Keyling Elieth Rivera Muñoz | Palabras: 2313
- scoreMeni: 100 (el auditor le dio 100 a un artículo con 42 párrafos repetidos — falso positivo del auditor)
- Evidencia: PARRAFO_PLANTILLA — párrafo genérico idéntico inyectado en >=4 artículos (ej. "coordinación entre Policía Nacional, Cruz Roja") ; DUPLICACION_MASIVA_INTERNA — el mismo párrafo se repite 42 veces dentro del artículo (basura estructural de generación) ; ATRIBUCION_VAGA — autoridades competentes | según reportes ; ORACIONES_REPETIDAS — 63 oraciones duplicadas internas
- Acción propuesta: Candidato a retirar: cuerpo con el mismo párrafo repetido ≥20 veces. Alternativa: deduplicar mecánicamente si los ~12 párrafos únicos forman una nota verificable.
- Confianza: CONFIRMADO (patrón textual verificado)

### dos-fallecidos-en-accidentes-ocurridos-en-matagalpa-y-wiwili
- URL: https://nicaraguainformate.com/noticias/dos-fallecidos-en-accidentes-ocurridos-en-matagalpa-y-wiwili
- Fecha: 2026-06-22 | Categoría: Sucesos | Autor: Keyling Elieth Rivera Muñoz | Palabras: 2139
- scoreMeni: 100 (el auditor le dio 100 a un artículo con 42 párrafos repetidos — falso positivo del auditor)
- Evidencia: CUERPO_EUFEMISMO — "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo ; PARRAFO_PLANTILLA — párrafo genérico idéntico inyectado en >=4 artículos (ej. "coordinación entre Policía Nacional, Cruz Roja") ; DUPLICACION_MASIVA_INTERNA — el mismo párrafo se repite 42 veces dentro del artículo (basura estructural de generación) ; ATRIBUCION_VAGA — autoridades competentes ; ORACIONES_REPETIDAS — 63 oraciones duplicadas internas
- Acción propuesta: Candidato a retirar: cuerpo con el mismo párrafo repetido ≥20 veces. Alternativa: deduplicar mecánicamente si los ~12 párrafos únicos forman una nota verificable.
- Confianza: CONFIRMADO (patrón textual verificado)

## 🔴 D — CONTENIDO DEFECTUOSO (expedientes)

### accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte
- URL: https://nicaraguainformate.com/noticias/accidentes-viales-dejan-seis-fallecidos-en-managua-y-caribe-norte
- Fecha: 2026-05-25 | Categoría: Sucesos | Autor: Keyling Elieth Rivera Muñoz | Palabras: 439 | scoreMeni: 92 | noindex: false | fuente: F1 (ninguna identificable)
- Título registrado: "Cinco afectados en accidentes viales en Managua y regiones"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- SOLO_ATRIBUCION_VAGA [CONFIRMADO]: sin fuente identificable; frases: Según versiones
- ATRIBUCION_VAGA [CONFIRMADO]: Según versiones
- CITA_SIN_ATRIBUIR [CONFIRMADO]: ej: "Las motos chocaron de frente. Ambos conductores iban sin casco"
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### cuatro-nicaraguenses-mueren-en-el-exterior-en-menos-de-una
- URL: https://nicaraguainformate.com/noticias/cuatro-nicaraguenses-mueren-en-el-exterior-en-menos-de-una
- Fecha: 2026-05-21 | Categoría: Internacionales | Autor: Keyling Elieth Rivera Muñoz | Palabras: 642 | scoreMeni: 94 | noindex: false | fuente: F4 (inta, ops, bid, banco central)
- Título registrado: "Cuatro nicaragüenses resultan afectados en Costa Rica, El…"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- TITULO_CONTRADICE_CUERPO [CONFIRMADO]: título eufemizado contradice el cuerpo (reporta muerte)
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### panama-declara-emergencia-tras-sismo-que-dejo-27-heridos
- URL: https://nicaraguainformate.com/noticias/panama-declara-emergencia-tras-sismo-que-dejo-27-heridos
- Fecha: 2026-10-11 | Categoría: Internacionales | Autor: José Luis López Ramírez | Palabras: 648 | scoreMeni: 90 | noindex: false | fuente: F4 (efe, associated press, inta)
- Título registrado: "Panamá declara emergencia tras sismo que dejó 27 heridos"
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- BAJADA_DUPLICA_ENTRADA [CONFIRMADO]: el primer párrafo repite la bajada/meta description
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### nicaraguense-fallece-en-accidente-laboral-en-wisconsin
- URL: https://nicaraguainformate.com/noticias/nicaraguense-fallece-en-accidente-laboral-en-wisconsin
- Fecha: 2026-06-13 | Categoría: Internacionales | Autor: Keyling Elieth Rivera Muñoz | Palabras: 721 | scoreMeni: 96 | noindex: false | fuente: F3 (bid)
- Título registrado: "Nicaraguense resulta afectado en accidente laboral en Wisconsin"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- TITULO_CONTRADICE_CUERPO [CONFIRMADO]: título eufemizado contradice el cuerpo (reporta muerte)
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### dos-hombres-pierden-la-vida-en-incidentes-nocturnos-en-el-norte
- URL: https://nicaraguainformate.com/noticias/dos-hombres-pierden-la-vida-en-incidentes-nocturnos-en-el-norte
- Fecha: 2026-06-28 | Categoría: Sucesos | Autor: José Luis López Ramírez | Palabras: 507 | scoreMeni: 100 | noindex: false | fuente: F4 (bid, policía nacional)
- Título registrado: "Dos hombres pierden la vida en incidentes nocturnos en el norte"
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- ATRIBUCION_VAGA [CONFIRMADO]: según versiones
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami
- URL: https://nicaraguainformate.com/noticias/dos-nicaraguenses-fallecen-en-accidentes-ocurridos-en-honduras-y-miami
- Fecha: 2026-06-04 | Categoría: Internacionales | Autor: Keyling Elieth Rivera Muñoz | Palabras: 576 | scoreMeni: 92 | noindex: false | fuente: F0 (ninguna identificable)
- Título registrado: "Dos nicaragüenses resultan afectados en accidentes ocurridos en…"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- TITULO_CONTRADICE_CUERPO [CONFIRMADO]: título eufemizado contradice el cuerpo (reporta muerte)
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- NOTICIA_DURA_SIN_FUENTE [CONFIRMADO]: suceso/internacional sensible sin fuente identificable en el texto
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### tres-fallecidos-en-hechos-viales-este-viernes-en-managua-y-granada
- URL: https://nicaraguainformate.com/noticias/tres-fallecidos-en-hechos-viales-este-viernes-en-managua-y-granada
- Fecha: 2026-06-26 | Categoría: Sucesos | Autor: Maycol Josué Nicaragua Rivas | Palabras: 413 | scoreMeni: 90 | noindex: false | fuente: F4 (bid, policía nacional, cruz roja, bomberos unidos, inss)
- Título registrado: "Tres afectados en hechos viales este viernes en Managua y Granada"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- TITULO_CONTRADICE_CUERPO [CONFIRMADO]: título eufemizado contradice el cuerpo (reporta muerte)
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- ATRIBUCION_VAGA [CONFIRMADO]: autoridades competentes
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### kfc-abre-su-tercera-sucursal-en-nicaragua-y-anuncia-otra
- URL: https://nicaraguainformate.com/noticias/kfc-abre-su-tercera-sucursal-en-nicaragua-y-anuncia-otra
- Fecha: 2026-08-22 | Categoría: Nacionales | Autor: José Luis López Ramírez | Palabras: 851 | scoreMeni: 92 | noindex: false | fuente: F0 (ninguna identificable)
- Título registrado: "KFC abre su tercera sucursal en Nicaragua y anuncia otra"
- OAICITE_RESIDUO_DB [CONFIRMADO]: marcador :contentReference[oaicite] persistido en contenido canónico — el render lo elimina (cleanArticleBody, verificado en prod), pero el dato canónico está corrupto
- BAJADA_DUPLICA_ENTRADA [CONFIRMADO]: el primer párrafo repite la bajada/meta description
- SIN_FUENTE_EVERGREEN [CONFIRMADO]: sin fuente identificable (feature/guía/deporte)
- Acción: Reparar: limpiar marcador oaicite del contenido canónico en DB (mecánico, reversible; el render ya lo oculta)

### dos-hombres-mueren-por-descargas-electricas-en-managua
- URL: https://nicaraguainformate.com/noticias/dos-hombres-mueren-por-descargas-electricas-en-managua
- Fecha: 2026-06-02 | Categoría: Sucesos | Autor: José Luis López Ramírez | Palabras: 665 | scoreMeni: 100 | noindex: false | fuente: F4 (policía nacional, cruz roja, bomberos unidos)
- Título registrado: "Dos hombres resultan afectados por descargas eléctricas en…"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- TITULO_CONTRADICE_CUERPO [CONFIRMADO]: título eufemizado contradice el cuerpo (reporta muerte)
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- PARRAFO_PLANTILLA [CONFIRMADO]: párrafo genérico idéntico inyectado en >=4 artículos (ej. "coordinación entre Policía Nacional, Cruz Roja")
- ATRIBUCION_VAGA [CONFIRMADO]: autoridades competentes
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### accidente-laboral-deja-un-fallecido-y-un-lesionado-en-managua-y-estel
- URL: https://nicaraguainformate.com/noticias/accidente-laboral-deja-un-fallecido-y-un-lesionado-en-managua-y-estel
- Fecha: 2026-05-28 | Categoría: Sucesos | Autor: Keyling Elieth Rivera Muñoz | Palabras: 364 | scoreMeni: 94 | noindex: false | fuente: F4 (inta, policía nacional, cruz roja, bomberos unidos)
- Título registrado: "Dos accidentes laborales en Managua y Estelí dejan un fallecido y un lesionado"
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- PARRAFO_PLANTILLA [CONFIRMADO]: párrafo genérico idéntico inyectado en >=4 artículos (ej. "coordinación entre Policía Nacional, Cruz Roja")
- ATRIBUCION_VAGA [CONFIRMADO]: autoridades competentes
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### dos-muertos-y-dos-heridos-en-accidentes-laborales-en-nicaragua
- URL: https://nicaraguainformate.com/noticias/dos-muertos-y-dos-heridos-en-accidentes-laborales-en-nicaragua
- Fecha: 2026-05-30 | Categoría: Sucesos | Autor: Keyling Elieth Rivera Muñoz | Palabras: 447 | scoreMeni: 94 | noindex: false | fuente: F4 (inta, ministerio de trabajo)
- Título registrado: "Cuatro obreros afectados en accidentes laborales en Nicaragua"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- TITULO_CONTRADICE_CUERPO [CONFIRMADO]: título eufemizado contradice el cuerpo (reporta muerte)
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- ATRIBUCION_VAGA [CONFIRMADO]: De acuerdo con reportes
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### mas-de-470-muertos-por-inundaciones-entre-nepal-y-china
- URL: https://nicaraguainformate.com/noticias/mas-de-470-muertos-por-inundaciones-entre-nepal-y-china
- Fecha: 2026-08-28 | Categoría: Internacionales | Autor: Maycol Josué Nicaragua Rivas | Palabras: 648 | scoreMeni: 92 | noindex: false | fuente: F3 (bid)
- Título registrado: "Más de 470 muertos por inundaciones entre Nepal y China"
- OAICITE_RESIDUO_DB [CONFIRMADO]: marcador :contentReference[oaicite] persistido en contenido canónico — el render lo elimina (cleanArticleBody, verificado en prod), pero el dato canónico está corrupto
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- BAJADA_DUPLICA_ENTRADA [CONFIRMADO]: el primer párrafo repite la bajada/meta description
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### nicaraguense-fallece-tras-incidente-armado-en-guanacaste
- URL: https://nicaraguainformate.com/noticias/nicaraguense-fallece-tras-incidente-armado-en-guanacaste
- Fecha: 2026-06-21 | Categoría: Internacionales | Autor: Maycol Josué Nicaragua Rivas | Palabras: 486 | scoreMeni: 90 | noindex: false | fuente: F4 (ops, bid, fiscalía)
- Título registrado: "Nicaragüense resulta afectado tras incidente armado en Guanacaste"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- TITULO_CONTRADICE_CUERPO [CONFIRMADO]: título eufemizado contradice el cuerpo (reporta muerte)
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### comerciante-fallece-tras-altercado-en-terminal-de-rosita
- URL: https://nicaraguainformate.com/noticias/comerciante-fallece-tras-altercado-en-terminal-de-rosita
- Fecha: 2026-06-13 | Categoría: Sucesos | Autor: Keyling Elieth Rivera Muñoz | Palabras: 831 | scoreMeni: 100 | noindex: false | fuente: F4 (bid, policía nacional, cruz roja, bomberos unidos)
- Título registrado: "Comerciante resulta afectado tras altercado en terminal de Rosita"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- PARRAFO_PLANTILLA [CONFIRMADO]: párrafo genérico idéntico inyectado en >=4 artículos (ej. "coordinación entre Policía Nacional, Cruz Roja")
- ATRIBUCION_VAGA [CONFIRMADO]: autoridades competentes
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### costa-rica-tiembla-otra-vez-ya-suman-80-replicas-en-coronado
- URL: https://nicaraguainformate.com/noticias/costa-rica-tiembla-otra-vez-ya-suman-80-replicas-en-coronado
- Fecha: 2026-08-24 | Categoría: Internacionales | Autor: Keyling Elieth Rivera Muñoz | Palabras: 1088 | scoreMeni: 96 | noindex: false | fuente: F4 (bid, inta)
- Título registrado: "Costa Rica tiembla otra vez: ya suman 80 réplicas en Coronado"
- OAICITE_RESIDUO_DB [CONFIRMADO]: marcador :contentReference[oaicite] persistido en contenido canónico — el render lo elimina (cleanArticleBody, verificado en prod), pero el dato canónico está corrupto
- BAJADA_DUPLICA_ENTRADA [CONFIRMADO]: el primer párrafo repite la bajada/meta description
- Acción: Reparar: limpiar marcador oaicite del contenido canónico en DB (mecánico, reversible; el render ya lo oculta)

### fin-de-semana-deja-ocho-fallecidos-en-accidentes-viales
- URL: https://nicaraguainformate.com/noticias/fin-de-semana-deja-ocho-fallecidos-en-accidentes-viales
- Fecha: 2026-06-08 | Categoría: Sucesos | Autor: José Luis López Ramírez | Palabras: 736 | scoreMeni: 100 | noindex: false | fuente: F4 (bid, policía nacional, cruz roja, bomberos unidos)
- Título registrado: "Fin de semana deja ocho afectados en accidentes viales"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- TITULO_CONTRADICE_CUERPO [CONFIRMADO]: título eufemizado contradice el cuerpo (reporta muerte)
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- PARRAFO_PLANTILLA [CONFIRMADO]: párrafo genérico idéntico inyectado en >=4 artículos (ej. "coordinación entre Policía Nacional, Cruz Roja")
- ATRIBUCION_VAGA_MULTIPLE [CONFIRMADO]: 3 frases: autoridades competentes | según reportes | según reportes
- ORACIONES_REPETIDAS [CONFIRMADO]: 2 oraciones duplicadas internas
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### tres-motociclistas-mueren-en-accidentes-de-transito-en-nicaragua
- URL: https://nicaraguainformate.com/noticias/tres-motociclistas-mueren-en-accidentes-de-transito-en-nicaragua
- Fecha: 2026-05-31 | Categoría: Sucesos | Autor: Maycol Josué Nicaragua Rivas | Palabras: 795 | scoreMeni: 100 | noindex: false | fuente: F4 (inea, policía nacional, cruz roja, bomberos unidos)
- Título registrado: "Tres personas resultan afectados en accidentes de motocicleta…"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- PARRAFO_PLANTILLA [CONFIRMADO]: párrafo genérico idéntico inyectado en >=4 artículos (ej. "coordinación entre Policía Nacional, Cruz Roja")
- PARRAFO_DUPLICADO_INTERNO [CONFIRMADO]: 2 párrafos duplicados dentro del artículo
- ATRIBUCION_VAGA [CONFIRMADO]: autoridades competentes
- ORACIONES_REPETIDAS [CONFIRMADO]: 5 oraciones duplicadas internas
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### andrea-trana-gana-tres-oros-para-nicaragua-en-codicader
- URL: https://nicaraguainformate.com/noticias/andrea-trana-gana-tres-oros-para-nicaragua-en-codicader
- Fecha: 2026-09-06 | Categoría: Deportes | Autor: José Luis López Ramírez | Palabras: 766 | scoreMeni: 90 | noindex: false | fuente: F0 (ninguna identificable)
- Título registrado: "Andrea Traña gana tres oros para Nicaragua en CODICADER"
- OAICITE_RESIDUO_DB [CONFIRMADO]: marcador :contentReference[oaicite] persistido en contenido canónico — el render lo elimina (cleanArticleBody, verificado en prod), pero el dato canónico está corrupto
- SIN_FUENTE_EVERGREEN [CONFIRMADO]: sin fuente identificable (feature/guía/deporte)
- Acción: Reparar: limpiar marcador oaicite del contenido canónico en DB (mecánico, reversible; el render ya lo oculta)

### venezuela-164-fallecidos-y-30-mil-desaparecidos-tras-sismos
- URL: https://nicaraguainformate.com/noticias/venezuela-164-fallecidos-y-30-mil-desaparecidos-tras-sismos
- Fecha: 2026-06-25 | Categoría: Internacionales | Autor: José Luis López Ramírez | Palabras: 446 | scoreMeni: 91 | noindex: true | fuente: F4 (onu, bid)
- Título registrado: "Venezuela: 164 afectados y 30 mil desaparecidos tras sismos"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- TEXTO_INCOHERENTE [CONFIRMADO]: doble "afectados" en la misma cifra (ej. "164 afectados y 971 afectados")
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### nicaragua-vence-2-1-a-dominicana-en-debut-de-pequenas-ligas
- URL: https://nicaraguainformate.com/noticias/nicaragua-vence-2-1-a-dominicana-en-debut-de-pequenas-ligas
- Fecha: 2026-08-19 | Categoría: Deportes | Autor: José Luis López Ramírez | Palabras: 429 | scoreMeni: 98 | noindex: false | fuente: F0 (ninguna identificable)
- Título registrado: "Nicaragua vence 2-1 a Dominicana en debut de Pequeñas Ligas"
- OAICITE_RESIDUO_DB [CONFIRMADO]: marcador :contentReference[oaicite] persistido en contenido canónico — el render lo elimina (cleanArticleBody, verificado en prod), pero el dato canónico está corrupto
- BAJADA_DUPLICA_ENTRADA [CONFIRMADO]: el primer párrafo repite la bajada/meta description
- SIN_FUENTE_EVERGREEN [CONFIRMADO]: sin fuente identificable (feature/guía/deporte)
- Acción: Reparar: limpiar marcador oaicite del contenido canónico en DB (mecánico, reversible; el render ya lo oculta)

### naufragio-en-caribe-norte-deja-mujer-muerta-y-dos-ninos-desaparecidos
- URL: https://nicaraguainformate.com/noticias/naufragio-en-caribe-norte-deja-mujer-muerta-y-dos-ninos-desaparecidos
- Fecha: 2026-05-29 | Categoría: Sucesos | Autor: Keyling Elieth Rivera Muñoz | Palabras: 718 | scoreMeni: 100 | noindex: false | fuente: F4 (ejército de nicaragua, inta, bid, policía nacional, cruz roja, bomberos unidos)
- Título registrado: "Dos afectados tras naufragio de panga en Krukira"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- PARRAFO_PLANTILLA [CONFIRMADO]: párrafo genérico idéntico inyectado en >=4 artículos (ej. "coordinación entre Policía Nacional, Cruz Roja")
- ATRIBUCION_VAGA [CONFIRMADO]: autoridades competentes
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### apple-presenta-el-iphone-duo-su-primer-modelo-plegable
- URL: https://nicaraguainformate.com/noticias/apple-presenta-el-iphone-duo-su-primer-modelo-plegable
- Fecha: 2026-09-10 | Categoría: Tecnología | Autor: José Luis López Ramírez | Palabras: 806 | scoreMeni: 95 | noindex: false | fuente: F0 (ninguna identificable)
- Título registrado: "Apple presenta el iPhone Duo, su primer modelo plegable"
- OAICITE_RESIDUO_DB [CONFIRMADO]: marcador :contentReference[oaicite] persistido en contenido canónico — el render lo elimina (cleanArticleBody, verificado en prod), pero el dato canónico está corrupto
- BAJADA_DUPLICA_ENTRADA [CONFIRMADO]: el primer párrafo repite la bajada/meta description
- SIN_FUENTE_EVERGREEN [CONFIRMADO]: sin fuente identificable (feature/guía/deporte)
- Acción: Reparar: limpiar marcador oaicite del contenido canónico en DB (mecánico, reversible; el render ya lo oculta)

### doctora-nicaraguense-muere-en-ataque-armado-en-poptun-peten
- URL: https://nicaraguainformate.com/noticias/doctora-nicaraguense-muere-en-ataque-armado-en-poptun-peten
- Fecha: 2026-06-17 | Categoría: Internacionales | Autor: José Luis López Ramírez | Palabras: 776 | scoreMeni: 94 | noindex: false | fuente: F4 (bid, inta)
- Título registrado: "Doctora nicaragüense resulta afectado en ataque armado en…"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- TITULO_CONTRADICE_CUERPO [CONFIRMADO]: título eufemizado contradice el cuerpo (reporta muerte)
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### dos-fallecidos-en-accidentes-de-motocicleta-en-nicaragua
- URL: https://nicaraguainformate.com/noticias/dos-fallecidos-en-accidentes-de-motocicleta-en-nicaragua
- Fecha: 2026-06-13 | Categoría: Sucesos | Autor: Keyling Elieth Rivera Muñoz | Palabras: 877 | scoreMeni: 100 | noindex: false | fuente: F4 (policía nacional, cruz roja, bomberos unidos)
- Título registrado: "Dos afectados en accidentes de motocicleta en Nicaragua"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- PARRAFO_PLANTILLA [CONFIRMADO]: párrafo genérico idéntico inyectado en >=4 artículos (ej. "coordinación entre Policía Nacional, Cruz Roja")
- ATRIBUCION_VAGA [CONFIRMADO]: autoridades competentes
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### lluvias-vientos-y-rayos-dejan-danos-y-dos-fallecidos
- URL: https://nicaraguainformate.com/noticias/lluvias-vientos-y-rayos-dejan-danos-y-dos-fallecidos
- Fecha: 2026-06-20 | Categoría: Sucesos | Autor: Keyling Elieth Rivera Muñoz | Palabras: 410 | scoreMeni: 94 | noindex: false | fuente: F4 (inta, bid, ineter, ministerio de trabajo)
- Título registrado: "Dos trabajadores fallecen tras descargas eléctricas en Nicaragua"
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- ATRIBUCION_VAGA [CONFIRMADO]: De acuerdo con reportes
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### estudiante-de-13-anos-muere-tras-golpe-en-escuela-de-diriomo
- URL: https://nicaraguainformate.com/noticias/estudiante-de-13-anos-muere-tras-golpe-en-escuela-de-diriomo
- Fecha: 2026-06-17 | Categoría: Sucesos | Autor: Keyling Elieth Rivera Muñoz | Palabras: 754 | scoreMeni: 94 | noindex: false | fuente: F4 (fiscalía, ops, ministerio de educación, policía nacional, cruz roja, bomberos unidos)
- Título registrado: "Estudiante de 13 años resulta afectado tras golpe en escuela de…"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- TITULO_CONTRADICE_CUERPO [CONFIRMADO]: título eufemizado contradice el cuerpo (reporta muerte)
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- PARRAFO_PLANTILLA [CONFIRMADO]: párrafo genérico idéntico inyectado en >=4 artículos (ej. "coordinación entre Policía Nacional, Cruz Roja")
- PARRAFO_DUPLICADO_INTERNO [CONFIRMADO]: 2 párrafos duplicados dentro del artículo
- ATRIBUCION_VAGA_MULTIPLE [CONFIRMADO]: 3 frases: autoridades competentes | versiones extraoficiales | Según versiones
- ORACIONES_REPETIDAS [CONFIRMADO]: 3 oraciones duplicadas internas
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### nicaraguense-muere-en-ataque-en-canovanas-puerto-rico
- URL: https://nicaraguainformate.com/noticias/nicaraguense-muere-en-ataque-en-canovanas-puerto-rico
- Fecha: 2026-06-22 | Categoría: Internacionales | Autor: Keyling Elieth Rivera Muñoz | Palabras: 470 | scoreMeni: 90 | noindex: true | fuente: F0 (ninguna identificable)
- Título registrado: "Nicaragüense resulta afectado en ataque en Canóvanas, Puerto Rico"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- TITULO_CONTRADICE_CUERPO [CONFIRMADO]: título eufemizado contradice el cuerpo (reporta muerte)
- NOTICIA_DURA_SIN_FUENTE [CONFIRMADO]: suceso/internacional sensible sin fuente identificable en el texto
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### nicaraguense-jose-salgado-muere-en-asalto-en-austin
- URL: https://nicaraguainformate.com/noticias/nicaraguense-jose-salgado-muere-en-asalto-en-austin
- Fecha: 2026-06-18 | Categoría: Internacionales | Autor: Keyling Elieth Rivera Muñoz | Palabras: 323 | scoreMeni: 92 | noindex: true | fuente: F0 (ninguna identificable)
- Título registrado: "Nicaragüense José Salgado resulta afectado en asalto en Austin"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- BAJADA_DUPLICA_ENTRADA [CONFIRMADO]: el primer párrafo repite la bajada/meta description
- SIN_FUENTE_EVERGREEN [CONFIRMADO]: sin fuente identificable (feature/guía/deporte)
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### nicaraguenses-mueren-en-hechos-violentos-registrados-en-costa-rica
- URL: https://nicaraguainformate.com/noticias/nicaraguenses-mueren-en-hechos-violentos-registrados-en-costa-rica
- Fecha: 2026-05-23 | Categoría: Internacionales | Autor: Keyling Elieth Rivera Muñoz | Palabras: 632 | scoreMeni: 90 | noindex: false | fuente: F2 (bid)
- Título registrado: "Nicaragüenses resultan afectados en hechos graves registrados…"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- TITULO_CONTRADICE_CUERPO [CONFIRMADO]: título eufemizado contradice el cuerpo (reporta muerte)
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- ATRIBUCION_VAGA_MULTIPLE [CONFIRMADO]: 3 frases: De acuerdo con reportes | informaron las autoridades | Según versiones
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### sismos-en-venezuela-cifra-de-fallecidos-sube-a-589
- URL: https://nicaraguainformate.com/noticias/sismos-en-venezuela-cifra-de-fallecidos-sube-a-589
- Fecha: 2026-06-26 | Categoría: Internacionales | Autor: Keyling Elieth Rivera Muñoz | Palabras: 368 | scoreMeni: 96 | noindex: false | fuente: F4 (ministerio de salud, inta)
- Título registrado: "Sismos en Venezuela: cifra de afectados sube a 589"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### seis-estudiantes-destacan-en-el-certamen-nacional-de-matematicas
- URL: https://nicaraguainformate.com/noticias/seis-estudiantes-destacan-en-el-certamen-nacional-de-matematicas
- Fecha: 2026-08-27 | Categoría: Nacionales | Autor: José Luis López Ramírez | Palabras: 1336 | scoreMeni: 94 | noindex: false | fuente: F4 (ministerio de educación, mined, bid)
- Título registrado: "Seis estudiantes destacan en el certamen nacional de matemáticas"
- OAICITE_RESIDUO_DB [CONFIRMADO]: marcador :contentReference[oaicite] persistido en contenido canónico — el render lo elimina (cleanArticleBody, verificado en prod), pero el dato canónico está corrupto
- Acción: Reparar: limpiar marcador oaicite del contenido canónico en DB (mecánico, reversible; el render ya lo oculta)

### fin-de-semana-deja-muertos-y-heridos-en-varios-accidentes-viales
- URL: https://nicaraguainformate.com/noticias/fin-de-semana-deja-muertos-y-heridos-en-varios-accidentes-viales
- Fecha: 2026-08-17 | Categoría: Sucesos | Autor: Keyling Elieth Rivera Muñoz | Palabras: 1088 | scoreMeni: 100 | noindex: false | fuente: F4 (bid, policía nacional)
- Título registrado: "Fin de semana deja muertos y heridos en varios accidentes viales"
- OAICITE_RESIDUO_DB [CONFIRMADO]: marcador :contentReference[oaicite] persistido en contenido canónico — el render lo elimina (cleanArticleBody, verificado en prod), pero el dato canónico está corrupto
- BAJADA_DUPLICA_ENTRADA [CONFIRMADO]: el primer párrafo repite la bajada/meta description
- Acción: Reparar: limpiar marcador oaicite del contenido canónico en DB (mecánico, reversible; el render ya lo oculta)

### tope-de-toros-2026-en-granada-fecha-ruta-y-que-esperar
- URL: https://nicaraguainformate.com/noticias/tope-de-toros-2026-en-granada-fecha-ruta-y-que-esperar
- Fecha: 2026-08-05 | Categoría: Nacionales | Autor: José Luis López Ramírez | Palabras: 864 | scoreMeni: 100 | noindex: false | fuente: F3 (bid)
- Título registrado: "Tope de Toros 2026 en Granada: fecha, ruta y qué esperar"
- OAICITE_RESIDUO_DB [CONFIRMADO]: marcador :contentReference[oaicite] persistido en contenido canónico — el render lo elimina (cleanArticleBody, verificado en prod), pero el dato canónico está corrupto
- BAJADA_DUPLICA_ENTRADA [CONFIRMADO]: el primer párrafo repite la bajada/meta description
- Acción: Reparar: limpiar marcador oaicite del contenido canónico en DB (mecánico, reversible; el render ya lo oculta)

### esteliana-fallece-ahogada-en-playa-de-san-sebastian-espana
- URL: https://nicaraguainformate.com/noticias/esteliana-fallece-ahogada-en-playa-de-san-sebastian-espana
- Fecha: 2026-06-25 | Categoría: Internacionales | Autor: José Luis López Ramírez | Palabras: 476 | scoreMeni: 98 | noindex: false | fuente: F3 (ops)
- Título registrado: "Esteliana resulta afectada en playa de San Sebastián,…"
- TITULO_EUFEMISMO [CONFIRMADO]: título dice "afectado" pero slug/cuerpo reportan muerte — titular factualmente falso
- TITULO_CONTRADICE_CUERPO [CONFIRMADO]: título eufemizado contradice el cuerpo (reporta muerte)
- CITA_SIN_ATRIBUIR [CONFIRMADO]: ej: "El departamento de Seguridad del Gobierno Vasco recibió la alerta sobre las 23:05 horas. A"
- BAJADA_DUPLICA_ENTRADA [CONFIRMADO]: el primer párrafo repite la bajada/meta description
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

### mujer-muere-tras-colision-entre-bus-de-la-ruta-165-y-moto
- URL: https://nicaraguainformate.com/noticias/mujer-muere-tras-colision-entre-bus-de-la-ruta-165-y-moto
- Fecha: 2026-08-27 | Categoría: Sucesos | Autor: Keyling Elieth Rivera Muñoz | Palabras: 445 | scoreMeni: 100 | noindex: false | fuente: F3 (policía nacional)
- Título registrado: "Mujer muere tras colisión entre bus de la Ruta 165 y moto"
- CUERPO_EUFEMISMO [CONFIRMADO]: "resultó afectado" sustituyó vocabulario de muerte/lesión en el cuerpo
- BAJADA_DUPLICA_ENTRADA [CONFIRMADO]: el primer párrafo repite la bajada/meta description
- Acción: Reparar: revertir eufemismo "afectado" al término real (muerte/lesión) verificando el hecho; si no se puede verificar, retirar

## 🟠 C — REVISIÓN EDITORIAL (lista)

- carreteras-del-pais-dejan-un-fin-de-semana-con-varios-accidentes | Sucesos | CITA_SIN_ATRIBUIR
- muere-piero-autor-de-mi-viejo-a-los-81-anos | Espectáculos | CITA_SIN_ATRIBUIR
- capturan-en-esteli-a-nicaraguense-requerido-por-caso-en-ee-uu | Sucesos | ATRIBUCION_VAGA_MULTIPLE
- adolescente-muere-atropellado-por-taxi-frente-a-cotran-norte | Sucesos | NOTICIA_DURA_SIN_FUENTE
- prueba-de-ia-obliga-a-openai-a-reforzar-su-seguridad-digital | Tecnología | SOLO_ATRIBUCION_VAGA, ATRIBUCION_VAGA
- al-menos-32-personas-han-muerto-electrocutadas-en-2026 | Sucesos | NOTICIA_DURA_SIN_FUENTE, BAJADA_DUPLICA_ENTRADA
- granada-una-ciudad-colonial-que-invita-a-descubrir-nicaragua | Nacionales | CITA_SIN_ATRIBUIR, SIN_FUENTE_EVERGREEN
- nicaraguense-muere-en-costa-rica-tras-choque-y-fuga-vial | Internacionales | NOTICIA_DURA_SIN_FUENTE, BAJADA_DUPLICA_ENTRADA
- dos-hermanos-nicaraguenses-mueren-en-tragedia-laboral-en-ee-uu | Internacionales | NOTICIA_DURA_SIN_FUENTE, BAJADA_DUPLICA_ENTRADA
- accidente-con-rastra-deja-una-joven-fallecida-en-managua | Sucesos | ATRIBUCION_VAGA, CITA_SIN_ATRIBUIR
- joven-de-masaya-fallece-en-la-laguna-de-apoyo-este-20-de-julio | Sucesos | SOLO_ATRIBUCION_VAGA, ATRIBUCION_VAGA, CIERRE_GENERICO
- kfc-nicaragua-2026-apertura-en-managua-menu | Nacionales | PARRAFO_PLANTILLA, ATRIBUCION_VAGA
- alexa-salio-de-tipitapa-por-oportunidades-y-murio-en-espana | Internacionales | NOTICIA_DURA_SIN_FUENTE
- se-apago-en-panama-la-voz-de-david-mercado-orgullo-de-masaya | Espectáculos | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA
- nicaragua-festival-ia-y-hackathon-impulsan-la-innovacion | Tecnología | CITA_SIN_ATRIBUIR, SIN_FUENTE_EVERGREEN
- dueno-de-semovientes-paga-c-769-mil-por-muerte-en-jalapa | Sucesos | NOTICIA_DURA_SIN_FUENTE, BAJADA_DUPLICA_ENTRADA
- dolly-parton-muere-a-los-80-anos-y-deja-un-legado-mundial | Espectáculos | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA
- muere-pedro-dixon-la-pajarita-chinandegana-a-los-28-anos | Espectáculos | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA
- adios-a-la-voz-mexicana-detras-de-toy-story-y-harry-potter | Espectáculos | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA
- masaya-analisis-del-fatal-accidente-vial-en-villa-bosco | Sucesos | PARRAFO_PLANTILLA, ATRIBUCION_VAGA_MULTIPLE
- siete-nicaraguenses-fallecen-en-el-extranjero-en-julio-2026 | Internacionales | SOLO_ATRIBUCION_VAGA, ATRIBUCION_VAGA
- familia-de-joven-somotena-busca-repatriar-su-cuerpo | Internacionales | NOTICIA_DURA_SIN_FUENTE
- muere-trabajador-tras-ataque-de-un-perro-en-managua | Sucesos | SOLO_ATRIBUCION_VAGA, ATRIBUCION_VAGA
- agenda-cultural-eventos-en-managua-del-20-al-30-de-junio | Espectáculos | CITA_SIN_ATRIBUIR, RELLENO_MENOR, SIN_FUENTE_EVERGREEN
- ataque-armado-en-costa-rica-deja-sin-vida-a-migrante-rivense | Internacionales | SOLO_ATRIBUCION_VAGA, ATRIBUCION_VAGA
- colapsa-vivienda-ancestral-en-monimbo-masaya-familia-de-7-ilesa | Sucesos | PARRAFO_PLANTILLA, ATRIBUCION_VAGA, BAJADA_DUPLICA_ENTRADA
- tres-personas-mueren-en-accidentes-de-transito-en-boaco-y-managua | Sucesos | NOTICIA_DURA_SIN_FUENTE
- familia-lesionada-tras-volcamiento-de-camion-en-matagalpa | Sucesos | PARRAFO_PLANTILLA, PARRAFO_DUPLICADO_INTERNO, ATRIBUCION_VAGA, ORACIONES_REPETIDAS
- bacteria-come-carne-deja-12-muertos-en-florida-y-luisiana | Internacionales | CITA_SIN_ATRIBUIR
- agosto-comienza-con-tres-accidentes-y-4-fallecidos | Sucesos | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA
- toys-r-us-incluye-a-nicaragua-en-su-plan-de-60-tiendas | Nacionales | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA, SIN_FUENTE_EVERGREEN
- nicaraguense-enfrenta-cargo-por-muerte-de-su-prima-en-texas | Internacionales | NOTICIA_DURA_SIN_FUENTE
- managua-se-llena-de-orgullo-en-el-tercer-desfile-patrio | Nacionales | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA, SIN_FUENTE_EVERGREEN
- panama-retorna-a-24-nicaraguenses-8-fueron-expulsados | Internacionales | SOLO_ATRIBUCION_VAGA, ATRIBUCION_VAGA
- condenan-a-25-anos-al-asesino-de-la-reina-menguena-en-chontales | Sucesos | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA
- se-acaba-el-cruce-de-la-muerte-instalan-semaforos | Nacionales | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA, RELLENO_MENOR
- capturan-a-senalado-por-robo-de-mas-de-us-30-mil-en-jalapa | Sucesos | PARRAFO_PLANTILLA, PARRAFO_DUPLICADO_INTERNO, ATRIBUCION_VAGA, BAJADA_DUPLICA_ENTRADA, ORACIONES_REPETIDAS
- bus-de-jalapa-colisiona-con-cisterna-en-tipitapa | Sucesos | PARRAFO_PLANTILLA, ATRIBUCION_VAGA, ORACIONES_REPETIDAS
- madre-recibe-cuerpo-de-nicaraguense-asesinado-en-costa-rica | Sucesos | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA
- varios-lesionados-durante-el-tope-de-toros-en | Nacionales | SOLO_ATRIBUCION_VAGA, ATRIBUCION_VAGA
- terremotos-en-venezuela-cifra-de-fallecidos-sube-a-2-954 | Internacionales | CITA_SIN_ATRIBUIR
- joven-nicaraguense-muere-en-espana-y-familia-gestiona-repatriacion | Internacionales | NOTICIA_DURA_SIN_FUENTE, CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA
- yoltamal-el-tamal-de-maiz-tierno-que-identifica-a-nicaragua | Nacionales | CITA_SIN_ATRIBUIR, SIN_FUENTE_EVERGREEN
- ice-detiene-a-dos-nicaraguenses-en-operativos-en-ee-uu | Internacionales | SOLO_ATRIBUCION_VAGA, ATRIBUCION_VAGA, CIERRE_GENERICO
- muere-prichard-colon-boxeador-que-enfrento-anos-de-secuelas | Deportes | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA
- venden-chocolates-para-alimentar-a-perros-y-gatos-abandonados | Nacionales | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA, SIN_FUENTE_EVERGREEN
- volcan-de-fuego-evacuaciones-y-alerta-roja-en-guatemala | Internacionales | SOLO_ATRIBUCION_VAGA, ATRIBUCION_VAGA, CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA
- disminucion-de-lluvias-afecta-cultivos-y-reservas-de-agua-en-nicaragua | Nacionales | PARRAFO_PLANTILLA, CIERRE_GENERICO
- muere-harold-gutierrez-voz-historica-y-fundador-de-macolla | Espectáculos | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA
- dos-perdidas-reabren-llamado-a-cuidar-la-salud-emocional | Sucesos | NOTICIA_DURA_SIN_FUENTE
- madrugada-termina-en-tragedia-para-motociclista-en-la-paz-centro | Sucesos | NOTICIA_DURA_SIN_FUENTE, BAJADA_DUPLICA_ENTRADA
- tiktok-bajo-la-lupa-por-efectos-en-jovenes-nicaraguenses | Nacionales | PARRAFO_PLANTILLA, ATRIBUCION_VAGA, CIERRE_GENERICO
- beisbol-sigue-siendo-el-deporte-favorito-de-los-nicaraguenses-en-2026 | Deportes | ATRIBUCION_VAGA_MULTIPLE, CITA_SIN_ATRIBUIR
- muere-felix-guadamuz-una-de-las-primeras-voces-dj-de-nicaragua | Espectáculos | CITA_SIN_ATRIBUIR
- morgan-s-rock-recibe-una-michelin-key-en-nicaragua | Nacionales | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA, SIN_FUENTE_EVERGREEN
- kfc-busca-a-50-fans-para-inaugurar-su-primer-local-en-nicaragua | Nacionales | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA, SIN_FUENTE_EVERGREEN
- condenan-a-prision-perpetua-a-femicida-de-maria-celeste-en-masaya | Sucesos | NOTICIA_DURA_SIN_FUENTE
- kfc-apuesta-por-carretera-a-masaya-para-expandirse-en-nicaragua | Nacionales | PARRAFO_PLANTILLA, SOLO_ATRIBUCION_VAGA, ATRIBUCION_VAGA, CITA_SIN_ATRIBUIR
- nicaragua-reduce-mortalidad-materna-e-infantil-en-2025 | Nacionales | ATRIBUCION_VAGA, CITA_SIN_ATRIBUIR
- nina-de-2-anos-muere-tras-caer-a-un-pozo-en-posoltega | Sucesos | NOTICIA_DURA_SIN_FUENTE, BAJADA_DUPLICA_ENTRADA
- juzgado-de-masaya-dicta-prision-preventiva-por-caso-penal | Sucesos | PARRAFO_PLANTILLA, ATRIBUCION_VAGA
- acusan-por-homicidio-imprudente-a-conductor-en-managua | Sucesos | NOTICIA_DURA_SIN_FUENTE, BAJADA_DUPLICA_ENTRADA
- hombre-muere-a-machetazos-durante-presunto-robo-en-siuna | Sucesos | NOTICIA_DURA_SIN_FUENTE, BAJADA_DUPLICA_ENTRADA
- inauguraran-hospital-pediatrico-las-segovias-en-esteli-este-18-de-mayo | Nacionales | PARRAFO_PLANTILLA, SOLO_ATRIBUCION_VAGA, ATRIBUCION_VAGA
- familia-busca-repatriar-a-nicaragua-a-jessica-asesinada-en-miami | Internacionales | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA
- ambulancia-minsa-arrastrada-por-rio-en-ayapal-jinotega | Sucesos | PARRAFO_PLANTILLA, PARRAFO_DUPLICADO_INTERNO, ATRIBUCION_VAGA, ORACIONES_REPETIDAS
- intur-presenta-estrategia-para-impulsar-turismo-en-diciembre-2026 | Nacionales | CITA_SIN_ATRIBUIR, BAJADA_DUPLICA_ENTRADA, SIN_FUENTE_EVERGREEN

## 🟡 B — PULIR (lista resumida por patrón)

- BAJADA_DUPLICA_ENTRADA: 317 artículos
- SIN_FUENTE_EVERGREEN: 58 artículos
- ATRIBUCION_VAGA: 49 artículos
- RELLENO_MENOR: 11 artículos
- CIERRE_GENERICO: 11 artículos
- ORACIONES_REPETIDAS: 9 artículos
- TITULO_CLICKBAIT: 1 artículos
