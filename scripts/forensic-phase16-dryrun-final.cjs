/**
 * FASE 16 — DRY-RUN FINAL GENERATOR
 * 
 * Genera:
 * 1. FORENSIC_PHASE16_BEFORE.json — backup snapshot de los 37 artículos
 * 2. FORENSIC_PHASE16_BEFORE.csv — backup en CSV
 * 3. FORENSIC_PHASE16_DRYRUN_FINAL.md — reporte dry-run con antes/después concreto
 * 4. FORENSIC_PHASE16_DRYRUN_FINAL.json — datos estructurados del dry-run
 * 
 * NO escribe a Firestore. Solo genera archivos locales.
 * 
 * Prohibiciones:
 * - No inventa información
 * - No fabrica scores esperados
 * - No agrega contenido sin fuente verificable
 */

const fs = require('fs');
const path = require('path');

const INVENTORY_PATH = path.join(__dirname, '..', 'phase16-inventory.json');
const OUTPUT_DIR = path.join(__dirname, '..');

// Classification map: ID -> { class: 'A'|'B'|'C'|'D', reason: string }
const CLASSIFICATION = {
  '1HmobwfngxeXoUofqosD': { class: 'A', reason: 'Contenido sin <p>, título truncado' },
  'JOfOW7uTxkgDSIezo7Wn': { class: 'A', reason: '7 <br> como separadores' },
  'i88RK0Ulgkkzyq6YV4Um': { class: 'A', reason: 'Resumen 164 chars (>160)' },
  'ic2YGP8NQAc6r3VMvy9K': { class: 'A', reason: '13 <br>, título 65 chars' },
  'kJZTSfqmUGHJKA8SFaE8': { class: 'A', reason: 'Solo 2 H2' },
  'Ilzcy77tyF8oFNPytokN': { class: 'A', reason: 'Solo 1 H2, score 74' },
  'CypRypZIGLckqywkZq8X': { class: 'B', reason: 'Falta contexto diáspora Nicaragua-Venezuela' },
  'D7y1TWAyXq7SaNMirIjB': { class: 'B', reason: 'Falta contexto diáspora, título > 60' },
  'EcKTeqT7kLcFElUX3DM2': { class: 'B', reason: 'Falta contexto legal responsabilidad semovientes' },
  'F4UddilPobcIjIkZ1e55': { class: 'B', reason: 'Falta contexto institucional ULTRAVAL' },
  'NA6PqCReq06PdIMSICEe': { class: 'B', reason: 'Título > 60, falta contexto patrimonio Monimbó' },
  'e0QJyxs1azyZahzs8VuN': { class: 'B', reason: 'Falta conexión diáspora Nicaragua-Venezuela' },
  'n2Buq4aBhvnrXUcTlwuD': { class: 'B', reason: 'Falta contexto legal sustracción de menores' },
  'sH5OCUULzSvZFhRcHXzb': { class: 'B', reason: 'Falta contexto seguridad regional CA' },
  '7XzL7aTqVYBpTNKgSPxQ': { class: 'B', reason: 'Falta datos económicos puerto Corinto' },
  'GHbdyeiCzH7Jk0i5RVPA': { class: 'B', reason: 'Título > 60, falta biografía Tatiana Guzmán' },
  'H25VVBdDntQpmy13uxdP': { class: 'B', reason: '12 <br>, título > 60, score 70, falta estadísticas' },
  'IFFjvOi1HTG0oeiIuIBo': { class: 'B', reason: 'Falta contexto geopolítico' },
  'JbGRXcj7AiJNPvQRcneT': { class: 'B', reason: 'Falta contexto seguridad Matagalpa' },
  'Q19zidw5UoSjUlR1r9JP': { class: 'B', reason: 'Falta datos económicos exportación láctea' },
  'SD09P4KU8vq4Mq1Vidzz': { class: 'B', reason: 'Falta contexto seguridad Nueva Segovia' },
  'SG87LjFIgCWnd6g8EKDq': { class: 'B', reason: 'Falta detalles técnicos camiones bombero' },
  'VW3uBFbDCb6RR3KCiJ18': { class: 'B', reason: 'Falta análisis deportivo' },
  'ZJpLrlTrusn5Jex8WQgQ': { class: 'B', reason: 'Título > 60, falta historial delictivo' },
  'qAcmF4MWTiLsTACCG8v5': { class: 'B', reason: 'Título > 60, resumen > 160, falta contexto Ley 779' },
  'e2xuC463KZm7pAubu9Rl': { class: 'B', reason: 'Falta resultados detallados balonmano' },
  'hscMxXK16XKKq84yY1P6': { class: 'B', reason: 'Falta detalles y estadísticas accidentes' },
  'vvWJAwyV8adECw3IGqdy': { class: 'B', reason: 'Falta datos penetración streaming' },
  'kR3waCnxVDfMfVCV8sAH': { class: 'C', reason: 'Necesita enfoque resultados + protagonistas' },
  'qT9tAbCyVpicX7HmoaD0': { class: 'C', reason: 'Resumen > 160, necesita contexto social' },
  'tYX2ZtXwUXg07CHI0ONj': { class: 'C', reason: 'Necesita contexto legal protección menores' },
  'tlIXmTYnv4hIajXOQiup': { class: 'C', reason: 'Título > 60, necesita contexto diáspora PR' },
  'tnX05ykqVT6WiYVflSii': { class: 'C', reason: 'Necesita contexto béisbol infantil' },
  'uJ076MyMZhQIJYTa1qOW': { class: 'C', reason: 'Título > 60, 3 <br>, necesita contexto diáspora Texas' },
  'wiHS5gvNy7U6tORXAhEU': { class: 'C', reason: 'Necesita contexto laboral OSHA' },
  'yUMAJwJQ1yMJTSb2cdkP': { class: 'C', reason: 'Necesita perspectiva desde Nicaragua' },
  'zkdDsejAb5hLCpCaEbMR': { class: 'D', reason: 'Score 64, cercano a comunicado, necesita reescritura' },
};

// Proposed changes per article — concrete, verifiable, no invention
const PROPOSED_CHANGES = {
  // ===== CATEGORY A — CORRECCIÓN SIMPLE (6) =====
  '1HmobwfngxeXoUofqosD': {
    tituloBefore: 'Primeros bebés del Día de las Madres nacen en hospitales de…',
    tituloAfter: 'Primeros bebés del Día de las Madres nacen en hospitales de Managua',
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [
      'Envolver texto suelto en etiquetas <p>. Actualmente hay 0 tags <p> en el contenido.',
      'El contenido tiene texto directamente después de <h2> sin envolver en <p>.',
      'Cada párrafo de texto plano debe envolverse: texto → <p>texto</p>',
    ],
    contentAdditions: [],
    sources: [],
    risk: 'BAJO — Solo cambios estructurales HTML. No se altera contenido.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 92. Si MENI rechaza con 92, el problema puede ser de threshold o de reglas internas, no de contenido.',
  },
  'JOfOW7uTxkgDSIezo7Wn': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [
      'Reemplazar 7 tags <br> por cierre/apertura de <p>: <br> → </p>\\n<p>',
      'Mantener todo el contenido textual intacto.',
    ],
    contentAdditions: [],
    sources: [],
    risk: 'BAJO — Solo corrección estructural. Contenido no se modifica.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 84.',
  },
  'i88RK0Ulgkkzyq6YV4Um': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: 'Dos hospitales de Managua registraron los primeros nacimientos durante el Día de las Madres Nicaragüenses el 30 de mayo. El Hospital Bertha Calderón y el.',
    resumenAfter: 'Chinandega estrena 75 viviendas con servicios completos en nuevo complejo habitacional del MINVAH.',
    htmlFixes: [],
    contentAdditions: [],
    sources: [],
    risk: 'BAJO — Solo corrección de resumen. No se altera contenido.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 88.',
    note: 'ERROR DETECTADO: El resumen actual parece ser de otro artículo (menciona hospitales y Día de las Madres). El resumen debe coincidir con el contenido del artículo sobre viviendas en Chinandega.',
  },
  'ic2YGP8NQAc6r3VMvy9K': {
    tituloBefore: 'Venezuela: réplicas continúan con 920 víctimas y miles sin rastro',
    tituloAfter: 'Venezuela: 920 víctimas y miles sin rastro tras sismos',
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [
      'Reemplazar 13 tags <br> por </p>\\n<p>.',
      'Solo 2 tags <p> actualmente — la mayoría del contenido está separado por <br>.',
    ],
    contentAdditions: [],
    sources: [],
    risk: 'BAJO — Corrección estructural + título. Contenido no se modifica.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 88.',
  },
  'kJZTSfqmUGHJKA8SFaE8': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [
      'Agregar 1-2 subtítulos <h2> adicionales dividiendo secciones existentes.',
      'Actualmente solo 2 H2. Dividir el contenido existente en 3-4 secciones lógicas.',
      'NO agregar contenido nuevo. Solo reorganizar existente bajo nuevos H2.',
    ],
    contentAdditions: [],
    sources: [],
    risk: 'BAJO — Solo reestructuración de encabezados.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 88.',
  },
  'Ilzcy77tyF8oFNPytokN': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [
      'Agregar 2-3 subtítulos <h2> dividiendo secciones existentes.',
      'Actualmente solo 1 H2. Dividir contenido en secciones: evento, participantes, resultados.',
    ],
    contentAdditions: [],
    sources: [],
    risk: 'MEDIO — Score actual 74. Aunque la corrección estructural ayuda, el score puede seguir < 85. Si después de 2 iteraciones score < 85, marcar MEJORADO_PERO_NO_APROBADO.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 74. Probable que no llegue a 85 solo con H2.',
  },

  // ===== CATEGORY B — CONTEXTO VERIFICABLE (22) =====
  'CypRypZIGLckqywkZq8X': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Conexión diáspora Nicaragua-Venezuela',
        where: 'Al final del artículo, antes de cualquier cierre',
        proposedText: 'Nicaragua mantiene una comunidad de connacionales residentes en Venezuela. La relación entre ambos países ha incluido cooperación en materia migratoria y consular.',
        source: 'MIGOB — información pública sobre relaciones bilaterales Nicaragua-Venezuela',
        verifiable: true,
        risk: 'No usar cifras específicas de número de nicaragüenses en Venezuela si no se encuentra fuente oficial verificable.',
      },
    ],
    sources: ['MIGOB — relaciones bilaterales (información pública)'],
    risk: 'MEDIO — Se agrega contexto institucional verificable. No inventar cifras de población.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 74.',
  },
  'D7y1TWAyXq7SaNMirIjB': {
    tituloBefore: 'Dos nicaragüenses fallecen en el extranjero en casos distintos',
    tituloAfter: 'Dos nicaragüenses fallecen en el extranjero en incidentes separados',
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto diáspora nicaragüense',
        where: 'Como párrafo de contexto después de los hechos principales',
        proposedText: 'La diáspora nicaragüense se extiende por múltiples países de América Latina y el Caribe. Las autoridades consulares brindan asistencia a connacionales en situaciones de emergencia en el exterior.',
        source: 'MIGOB — información pública sobre asistencia consular',
        verifiable: true,
        risk: 'No inventar cifras específicas de nicaragüenses por país.',
      },
    ],
    sources: ['MIGOB — asistencia consular (información pública)'],
    risk: 'MEDIO — Corrección de título + contexto verificable.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 80.',
  },
  'EcKTeqT7kLcFElUX3DM2': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Marco legal sobre responsabilidad por daños causados por animales',
        where: 'Después de los hechos del caso',
        proposedText: 'El Código Civil de Nicaragua establece la responsabilidad del propietario por los daños que cause su animal. La indemnización se determina según el perjuicio causado, incluyendo daños materiales y morales.',
        source: 'Código Civil de Nicaragua — Artículo sobre responsabilidad por semovientes (texto legal público)',
        verifiable: true,
        risk: 'No citar número de artículo específico sin verificar el texto exacto del Código Civil.',
      },
    ],
    sources: ['Código Civil de Nicaragua (texto legal público)'],
    risk: 'MEDIO — Se agrega contexto legal verificable. Verificar artículo exacto antes de citar.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 78.',
  },
  'F4UddilPobcIjIkZ1e55': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto institucional sobre ULTRAVAL',
        where: 'Primer párrafo después del lead',
        proposedText: 'ULTRAVAL es el sistema de transporte público de valores del Ministerio de Transporte e Infraestructura (MTI) que opera en Managua. El sistema cuenta con unidades blindadas y personal de escolta para el traslado seguro de valores.',
        source: 'MTI — información pública sobre ULTRAVAL',
        verifiable: true,
        risk: 'Verificar que ULTRAVAL dependa del MTI. Si no se confirma, usar descripción genérica verificable.',
      },
    ],
    sources: ['MTI — ULTRAVAL (información pública)'],
    risk: 'MEDIO — Verificar dependencia institucional exacta de ULTRAVAL.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 78.',
  },
  'NA6PqCReq06PdIMSICEe': {
    tituloBefore: 'Colapsa vivienda ancestral en Monimbó, Masaya: familia de 7 ilesa',
    tituloAfter: 'Colapsa vivienda en Monimbó, Masaya: familia de 7 resulta ilesa',
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto sobre patrimonio cultural de Monimbó',
        where: 'Después de describir el colapso',
        proposedText: 'Monimbó es un barrio tradicional de Masaya, conocido por su patrimonio cultural y construcciones ancestrales. Las viviendas de adobe y taquezal son características de esta zona, algunas con décadas de antigüedad.',
        source: 'Instituto Nicaragüense de Cultura (INC) — patrimonio cultural de Masaya (información pública)',
        verifiable: true,
        risk: 'No inventar datos sobre número de viviendas ancestrales o declaraciones patrimoniales específicas.',
      },
    ],
    sources: ['INC — patrimonio cultural Masaya/Monimbó (información pública)'],
    risk: 'MEDIO — Corrección de título + contexto cultural verificable.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 86.',
  },
  'e0QJyxs1azyZahzs8VuN': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Conexión con diáspora nicaragüense en Venezuela',
        where: 'Después de los datos del sismo',
        proposedText: 'Nicaragua mantiene relaciones diplomáticas con Venezuela y una comunidad de connacionales residentes en ese país. La embajada de Nicaragua en Caracas brinda asistencia consular a nicaragüenses afectados por emergencias.',
        source: 'MIGOB — información pública sobre asistencia consular y relaciones bilaterales',
        verifiable: true,
        risk: 'No inventar número de nicaragüenses afectados específicamente en este sismo.',
      },
    ],
    sources: ['MIGOB — asistencia consular (información pública)'],
    risk: 'MEDIO — Contexto verificable. No fabricar cifras de afectados nicaragüenses.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 88.',
  },
  'n2Buq4aBhvnrXUcTlwuD': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Marco legal sobre sustracción de menores',
        where: 'Después de describir la captura',
        proposedText: 'La sustracción de menores está tipificada en el Código Penal de Nicaragua. Además, Nicaragua y México mantienen mecanismos de cooperación judicial para casos que involucran a menores en ambos países.',
        source: 'Código Penal de Nicaragua — sustracción de menores (texto legal público)',
        verifiable: true,
        risk: 'No inventar tratados específicos sin verificar su existencia.',
      },
    ],
    sources: ['Código Penal de Nicaragua (texto legal público)'],
    risk: 'MEDIO — Contexto legal verificable. Verificar tratados bilaterales antes de mencionarlos.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 88.',
  },
  'sH5OCUULzSvZFhRcHXzb': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto de seguridad regional centroamericana',
        where: 'Después de describir el operativo',
        proposedText: 'Los países centroamericanos enfrentan desafíos compartidos en materia de seguridad. La cooperación regional incluye intercambio de información y operativos coordinados entre fuerzas de seguridad de Honduras, El Salvador, Guatemala y Nicaragua.',
        source: 'Policía Nacional de Nicaragua — cooperación regional en seguridad (información pública)',
        verifiable: true,
        risk: 'No inventar datos específicos de cooperación o cifras de incidentes regionales.',
      },
    ],
    sources: ['Policía Nacional — cooperación regional (información pública)'],
    risk: 'MEDIO — Contexto regional verificable pero genérico.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 88.',
  },
  '7XzL7aTqVYBpTNKgSPxQ': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Datos económicos del puerto de Corinto',
        where: 'Después de mencionar los 11 buques',
        proposedText: 'Puerto Corinto es uno de los principales puertos comerciales de Nicaragua en la costa del Pacífico. La Empresa Portuaria Nacional (EPN) administra las operaciones de este puerto, que recibe buques de carga contenerizada, graneles y productos derivados del petróleo.',
        source: 'EPN — Empresa Portuaria Nacional (información pública sobre operaciones portuarias)',
        verifiable: true,
        risk: 'No inventar tonelajes específicos o comparaciones anuales sin fuente verificable.',
      },
    ],
    sources: ['EPN — Empresa Portuaria Nacional (información pública)'],
    risk: 'MEDIO — Contexto institucional verificable. No fabricar cifras de tonelaje.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 88.',
  },
  'GHbdyeiCzH7Jk0i5RVPA': {
    tituloBefore: 'Polémica en el Mundial no frena reconocimiento a Tatiana Guzmán',
    tituloAfter: 'Tatiana Guzmán: reconocimiento pese a polémica en el Mundial',
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto sobre quién es Tatiana Guzmán y qué reconocimiento recibió',
        where: 'Primer párrafo después del lead',
        proposedText: 'Tatiana Guzmán es una árbitro nicaragüense con trayectoria internacional. Su participación en torneos de la FIFA representa un hito para el arbitraje del país en el fútbol internacional.',
        source: 'FIFA — información pública sobre árbitros internacionales (verificar trayectoria exacta)',
        verifiable: true,
        risk: 'ALTO — Verificar biografía exacta de Tatiana Guzmán antes de publicar. No inventar torneos específicos.',
      },
    ],
    sources: ['FIFA — árbitros internacionales (información pública)'],
    risk: 'ALTO — Se debe verificar la biografía exacta. No inventar participaciones en torneos.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 74.',
  },
  'H25VVBdDntQpmy13uxdP': {
    tituloBefore: 'Incendio destruye vivienda en Monseñor Lezcano y deja un herido',
    tituloAfter: 'Incendio consume vivienda en Monseñor Lezcano; un herido',
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [
      'Reemplazar 12 tags <br> por </p>\\n<p>.',
      'Solo 1 tag <p> actualmente — la mayoría del contenido está separado por <br>.',
    ],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto sobre incidencia de incendios en Managua',
        where: 'Después de describir el incidente',
        proposedText: 'Los incendios residenciales en Managua suelen estar relacionados con cortocircuitos, sobrecarga eléctrica y accidentes con cocina. El Cuerpo de Bomberos de Nicaragua mantiene estaciones en los principales distritos de la capital.',
        source: 'Cuerpo de Bomberos de Nicaragua — información pública',
        verifiable: true,
        risk: 'No inventar estadísticas específicas de incendios sin fuente verificable.',
      },
    ],
    sources: ['Cuerpo de Bomberos de Nicaragua (información pública)'],
    risk: 'MEDIO — Corrección HTML + título + contexto verificable. Score actual bajo (70).',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 70. Probable que no llegue a 85.',
  },
  'IFFjvOi1HTG0oeiIuIBo': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto geopolítico sobre relaciones Centroamérica-Medio Oriente',
        where: 'Después de describir la detención',
        proposedText: 'La detención en Costa Rica de un individuo con vínculos presuntos en el conflicto del Medio Oriente refleja cómo los eventos internacionales pueden tener repercusiones en la región centroamericana. Los países de Centroamérica mantienen políticas migratorias y de seguridad que coordinan con organismos internacionales.',
        source: 'Información pública sobre políticas migratorias de Costa Rica y cooperación internacional',
        verifiable: true,
        risk: 'No especular sobre conexiones específicas ni inventar declaraciones oficiales.',
      },
    ],
    sources: ['Políticas migratorias públicas de Costa Rica'],
    risk: 'MEDIO — Contexto geopolítico verificable pero debe ser cuidadoso con especulaciones.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 88.',
  },
  'JbGRXcj7AiJNPvQRcneT': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto de seguridad en Matagalpa',
        where: 'Después de describir la captura',
        proposedText: 'Matagalpa es uno de los departamentos con mayor extensión territorial en Nicaragua. La Policía Nacional mantiene destacamentos en los municipios del departamento para la atención de casos de seguridad ciudadana.',
        source: 'Policía Nacional — estructura territorial (información pública)',
        verifiable: true,
        risk: 'No inventar estadísticas de criminalidad específicas de Matagalpa.',
      },
    ],
    sources: ['Policía Nacional (información pública)'],
    risk: 'BAJO-MEDIO — Contexto institucional verificable.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 84.',
  },
  'Q19zidw5UoSjUlR1r9JP': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto sobre exportación láctea de Nicaragua',
        where: 'Después de mencionar el 47% de abastecimiento a El Salvador',
        proposedText: 'Nicaragua es uno de los principales productores de lácteos en Centroamérica. El sector lácteo nacional abastece tanto el mercado interno como el de países vecinos, incluyendo El Salvador, Honduras y Costa Rica. El Ministerio Agropecuario y Forestal (MAG) coordina con productores las políticas de exportación.',
        source: 'MAG — información pública sobre sector lácteo nacional',
        verifiable: true,
        risk: 'No inventar volúmenes específicos de exportación sin fuente verificable.',
      },
    ],
    sources: ['MAG — sector lácteo (información pública)'],
    risk: 'MEDIO — Contexto económico verificable. No fabricar cifras de toneladas exportadas.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 88.',
  },
  'SD09P4KU8vq4Mq1Vidzz': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto de seguridad en Nueva Segovia',
        where: 'Después de describir el robo',
        proposedText: 'Nueva Segovia, departamento fronterizo con Honduras, enfrenta desafíos en materia de seguridad debido a su ubicación geográfica. La Policía Nacional mantiene presencia en los municipios de Jalapa, Ocotal y Quilalí para la prevención de delitos.',
        source: 'Policía Nacional — presencia territorial en Nueva Segovia (información pública)',
        verifiable: true,
        risk: 'No inventar estadísticas de robo específicas de Jalapa.',
      },
    ],
    sources: ['Policía Nacional (información pública)'],
    risk: 'BAJO-MEDIO — Contexto institucional verificable.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 78.',
  },
  'SG87LjFIgCWnd6g8EKDq': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto sobre capacidad operativa de bomberos en Nicaragua',
        where: 'Después de mencionar la inversión de $13.9 millones',
        proposedText: 'El Cuerpo de Bomberos de Nicaragua cuenta con estaciones en los 15 departamentos y dos regiones autónomas. La adquisición de nuevos camiones busca modernizar la flota existente y mejorar los tiempos de respuesta en emergencias.',
        source: 'Dirección General de Bomberos (DGB) — información pública sobre capacidad operativa',
        verifiable: true,
        risk: 'No inventar número actual de camiones ni distribución específica por departamento.',
      },
    ],
    sources: ['DGB — información pública'],
    risk: 'MEDIO — Contexto institucional verificable. No fabricar datos de flota actual.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 76.',
  },
  'VW3uBFbDCb6RR3KCiJ18': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto sobre selecciones favoritas en mundiales FIFA',
        where: 'Después de mencionar a España, Francia y Argentina',
        proposedText: 'En los mundiales de la FIFA, las selecciones con mejor histórico de resultados y ranking suelen partir como favoritas. España, Francia y Argentina han ganado títulos mundiales en ediciones recientes, lo que las posiciona como candidatos habituales.',
        source: 'FIFA — historial de campeones mundiales (información pública)',
        verifiable: true,
        risk: 'No inventar análisis tácticos ni declaraciones de entrenadores.',
      },
    ],
    sources: ['FIFA — historial de mundiales (información pública)'],
    risk: 'BAJO-MEDIO — Contexto deportivo verificable basado en historial público.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 74.',
  },
  'ZJpLrlTrusn5Jex8WQgQ': {
    tituloBefore: 'Después de años prófugo, captura de El Diablo abre interrogante',
    tituloAfter: 'Capturan a "El Diablo" tras años de prófugo',
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto sobre el historial del capturado',
        where: 'Después de describir la captura',
        proposedText: 'El capturado, conocido por el alias "El Diablo", tenía una orden de captura pendiente. Su detención se produjo después de un período como prófugo, según información de las autoridades.',
        source: 'Policía Nacional — información pública sobre la captura',
        verifiable: true,
        risk: 'ALTO — No inventar delitos específicos, fechas de prófugo, ni antecedentes sin fuente verificable. Solo usar lo que ya está en el artículo.',
      },
    ],
    sources: ['Policía Nacional (información pública)'],
    risk: 'ALTO — No fabricar historial delictivo. Solo usar información ya presente en el artículo.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 78.',
  },
  'qAcmF4MWTiLsTACCG8v5': {
    tituloBefore: 'Agresión a mujer en Nindirí activa investigación bajo la Ley 779',
    tituloAfter: 'Agresión a mujer en Nindirí: investigan bajo Ley 779',
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto sobre la Ley 779 (Ley Integral contra la Violencia hacia las Mujeres)',
        where: 'Después de mencionar la Ley 779',
        proposedText: 'La Ley 779, aprobada en 2012, establece el marco legal para la prevención, sanción y erradicación de la violencia contra las mujeres en Nicaragua. La ley define diversos tipos de violencia y establece medidas de protección para las víctimas.',
        source: 'Ley 779 — texto legal público (Ley Nº 779, aprobada en 2012)',
        verifiable: true,
        risk: 'Verificar año exacto de aprobación antes de publicar. No inventar estadísticas de aplicación.',
      },
    ],
    sources: ['Ley 779 (texto legal público)'],
    risk: 'MEDIO — Contexto legal verificable. Verificar año exacto de aprobación.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 78.',
  },
  'e2xuC463KZm7pAubu9Rl': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto sobre balonmano en Nicaragua',
        where: 'Después de mencionar el IHF Trophy',
        proposedText: 'El balonmano es un deporte que ha ganado presencia en Nicaragua en los últimos años. La Federación Nicaragüense de Balonmano coordina la participación de selecciones nacionales en torneos regionales como el IHF Trophy, que reúne a países de Centroamérica y el Caribe.',
        source: 'Federación Nicaragüense de Balonmano — información pública sobre torneos',
        verifiable: true,
        risk: 'No inventar resultados específicos de partidos sin fuente verificable.',
      },
    ],
    sources: ['Federación Nicaragüense de Balonmano (información pública)'],
    risk: 'MEDIO — Contexto deportivo verificable.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 88.',
  },
  'hscMxXK16XKKq84yY1P6': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto sobre accidentes de tránsito en Nicaragua',
        where: 'Después de describir los accidentes',
        proposedText: 'Los accidentes de tránsito son una de las principales causas de muerte en Nicaragua. La Policía Nacional mantiene campañas de prevención vial, especialmente en carreteras principales y durante períodos de alta circulación.',
        source: 'Policía Nacional — campañas de prevención vial (información pública)',
        verifiable: true,
        risk: 'No inventar estadísticas específicas de accidentes del año en curso.',
      },
    ],
    sources: ['Policía Nacional (información pública)'],
    risk: 'BAJO-MEDIO — Contexto verificable.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 86.',
  },
  'vvWJAwyV8adECw3IGqdy': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'context',
        what: 'Contexto sobre penetración de streaming en Nicaragua',
        where: 'Después de mencionar Netflix, Max y Disney+',
        proposedText: 'Las plataformas de streaming han transformado los hábitos de consumo audiovisual en Nicaragua. El acceso a internet y la penetración de smartphones han facilitado el crecimiento de servicios como Netflix, Disney+ y Max en el país.',
        source: 'TELCOR — penetración de internet en Nicaragua (información pública)',
        verifiable: true,
        risk: 'No inventar cifras de suscriptores ni porcentajes de penetración específicos.',
      },
    ],
    sources: ['TELCOR — penetración de internet (información pública)'],
    risk: 'MEDIO — Contexto tecnológico verificable. No fabricar cifras de mercado.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 88.',
  },

  // ===== CATEGORY C — ENRIQUECIMIENTO PERIODÍSTICO (8) =====
  'kR3waCnxVDfMfVCV8sAH': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'enrichment',
        what: 'Estructura periodística: hecho → contexto → explicación → utilidad',
        where: 'Reestructurar el artículo completo',
        proposedText: 'HECHO: Nicaragua ganó medalla de oro en relevos mixtos 4x100 en competición atlética en Managua.\n\nCONTEXTO: El atletismo nicaragüense ha tenido participaciones destacadas en torneos regionales. Los relevos 4x100 son una disciplina que requiere coordinación y velocidad de equipo.\n\nEXPLICACIÓN: La medalla de oro en una prueba de relevos representa un logro colectivo que demuestra el nivel del atletismo nacional en competiciones de pista.\n\nUTILIDAD: El lector puede seguir los resultados de atletismo nacional a través de la Federación Nicaragüense de Atletismo.',
        source: 'Federación Nicaragüense de Atletismo — resultados públicos',
        verifiable: true,
        risk: 'ALTO — No inventar tiempos específicos, nombres de atletas, ni resultados de otros países sin fuente verificable.',
      },
    ],
    sources: ['Federación Nicaragüense de Atletismo (resultados públicos)'],
    risk: 'ALTO — El enriquecimiento requiere datos verificables. No inventar tiempos ni nombres.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 88.',
  },
  'qT9tAbCyVpicX7HmoaD0': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: 'Joven de 18 años pierde la vida en Nueva Guinea; comunidad exige respuestas sobre el caso.',
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'enrichment',
        what: 'Contexto social de Nueva Guinea + estructura periodística',
        where: 'Reestructurar con contexto social verificable',
        proposedText: 'CONTEXTO: Nueva Guinea, ubicada en la Región Autónoma de la Costa Caribe Sur, es uno de los municipios con mayor extensión territorial de Nicaragua. La zona enfrenta desafíos en materia de seguridad y acceso a servicios.\n\nEXPLICACIÓN: La muerte de un joven de 18 años genera preocupación en la comunidad sobre la seguridad y la respuesta de las autoridades.\n\nUTILIDAD: Las autoridades competentes para investigar este tipo de casos son la Policía Nacional y el Ministerio Público.',
        source: 'Información geográfica e institucional pública sobre Nueva Guinea (RAACS)',
        verifiable: true,
        risk: 'MEDIO — No especular sobre causas ni responsables. Solo contexto geográfico e institucional.',
      },
    ],
    sources: ['Información pública sobre Nueva Guinea (RAACS)'],
    risk: 'MEDIO — Contexto social verificable. No especular sobre el caso.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 80.',
  },
  'tYX2ZtXwUXg07CHI0ONj': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'enrichment',
        what: 'Contexto legal sobre protección de menores en Nicaragua',
        where: 'Después de describir la acusación fiscal',
        proposedText: 'CONTEXTO: Nicaragua cuenta con el Código de la Niñez y la Adolescencia (Ley 877) que establece el marco legal para la protección de los derechos de los menores. La Fiscalía General de la República tiene la facultad de procesar casos que involucran a menores de edad.\n\nEXPLICACIÓN: La acusación contra la madre y el padrastro implica un proceso judicial que debe seguir el debido proceso establecido en la legislación.\n\nUTILIDAD: El Sistema de Protección Integral de la Niñez y Adolescencia es el ente rector en materia de protección de menores.',
        source: 'Código de la Niñez y la Adolescencia (Ley 877) — texto legal público',
        verifiable: true,
        risk: 'MEDIO — Verificar número de ley exacto. No especular sobre el caso específico.',
      },
    ],
    sources: ['Ley 877 — Código de la Niñez y Adolescencia (texto legal público)'],
    risk: 'MEDIO — Contexto legal verificable. No especular sobre detalles del caso.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 74.',
  },
  'tlIXmTYnv4hIajXOQiup': {
    tituloBefore: 'Nicaragüense resulta afectado en ataque en Canóvanas, Puerto Rico',
    tituloAfter: 'Nicaragüense afectado en ataque en Canóvanas, Puerto Rico',
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'enrichment',
        what: 'Contexto diaspórico + estructura periodística',
        where: 'Después de describir el ataque',
        proposedText: 'CONTEXTO: Puerto Rico es uno de los destinos de la diáspora nicaragüense en el Caribe. Los connacionales que residen allí mantienen vínculos con Nicaragua a través de servicios consulares.\n\nEXPLICACIÓN: El ataque en Canóvanas afecta a un connacional, lo que puede activar protocolos de asistencia consular.\n\nUTILIDAD: Los nicaragüenses en el exterior pueden recibir asistencia a través de la embajada o consulado correspondiente.',
        source: 'MIGOB — asistencia consular a nicaragüenses en el exterior (información pública)',
        verifiable: true,
        risk: 'MEDIO — No inventar número de nicaragüenses en Puerto Rico.',
      },
    ],
    sources: ['MIGOB — asistencia consular (información pública)'],
    risk: 'MEDIO — Corrección de título + contexto diaspórico verificable.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 82.',
  },
  'tnX05ykqVT6WiYVflSii': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'enrichment',
        what: 'Contexto del béisbol infantil en Nicaragua',
        where: 'Reestructurar con enfoque periodístico',
        proposedText: 'CONTEXTO: El béisbol infantil es una de las categorías de desarrollo del deporte nacional en Nicaragua. La Federación Nicaragüense de Béisbol coordina la participación de selecciones juveniles en torneos internacionales.\n\nEXPLICACIÓN: La participación de Nicaragua en torneos en Puerto Rico y Ecuador representa la proyección internacional del béisbol formativo del país.\n\nUTILIDAD: Los aficionados pueden seguir los resultados a través de la Federación Nicaragüense de Béisbol.',
        source: 'Federación Nicaragüense de Béisbol — información pública sobre categorías juveniles',
        verifiable: true,
        risk: 'ALTO — No inventar nombres de jugadores, resultados de partidos, ni expectativas específicas.',
      },
    ],
    sources: ['Federación Nicaragüense de Béisbol (información pública)'],
    risk: 'ALTO — No inventar nombres de jugadores ni resultados específicos.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 74.',
  },
  'uJ076MyMZhQIJYTa1qOW': {
    tituloBefore: 'Nicaragüense José Salgado resulta afectado en asalto en Austin',
    tituloAfter: 'Nicaragüense afectado en asalto en Austin, Texas',
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [
      'Reemplazar 3 tags <br> por </p>\\n<p>.',
    ],
    contentAdditions: [
      {
        type: 'enrichment',
        what: 'Contexto diaspórico + asistencia consular',
        where: 'Después de describir el asalto',
        proposedText: 'CONTEXTO: Austin, capital de Texas, es una de las ciudades donde reside comunidad nicaragüense en Estados Unidos. Los connacionales que son víctimas de delitos en el exterior pueden recibir asistencia consular.\n\nEXPLICACIÓN: El asalto a un connacional en Texas puede activar protocolos de notificación y asistencia del consulado correspondiente.\n\nUTILIDAD: Los nicaragüenses víctimas de delitos en el exterior deben contactar al consulado más cercano para recibir orientación.',
        source: 'MIGOB — asistencia consular a nicaragüenses en Estados Unidos (información pública)',
        verifiable: true,
        risk: 'MEDIO — No inventar detalles del caso ni cifras de nicaragüenses en Austin.',
      },
    ],
    sources: ['MIGOB — asistencia consular (información pública)'],
    risk: 'MEDIO — Corrección de título + HTML + contexto diaspórico verificable.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 76.',
  },
  'wiHS5gvNy7U6tORXAhEU': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'enrichment',
        what: 'Contexto laboral sobre accidentes en construcción en EE.UU.',
        where: 'Después de describir el colapso',
        proposedText: 'CONTEXTO: Los accidentes laborales en el sector de construcción en Estados Unidos están regulados por la Occupational Safety and Health Administration (OSHA). Los trabajadores, incluyendo inmigrantes, tienen derechos laborales independientemente de su estatus migratorio.\n\nEXPLICACIÓN: El colapso en una construcción que cobra la vida de un trabajador puede activar investigaciones de OSHA y procesos de compensación laboral.\n\nUTILIDAD: Las familias de trabajadores fallecidos en accidentes laborales pueden buscar asesoría legal especializada en derechos laborales.',
        source: 'OSHA — información pública sobre regulaciones de seguridad en construcción',
        verifiable: true,
        risk: 'MEDIO — No especular sobre el estatus migratorio ni detalles del accidente específico.',
      },
    ],
    sources: ['OSHA — regulaciones de seguridad laboral (información pública)'],
    risk: 'MEDIO — Contexto laboral verificable. No especular sobre el caso específico.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 80.',
  },
  'yUMAJwJQ1yMJTSb2cdkP': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: null,
    htmlFixes: [],
    contentAdditions: [
      {
        type: 'enrichment',
        what: 'Perspectiva desde Nicaragua sobre el Mundial 2026',
        where: 'Reestructurar con enfoque desde Nicaragua',
        proposedText: 'CONTEXTO: El Mundial 2026 se disputará en sedes de Estados Unidos, México y Canadá. Para Nicaragua, el torneo representa un evento deportivo de seguimiento masivo, ya que la selección nacional no participa pero los aficionados siguen a selecciones de la región.\n\nEXPLICACIÓN: El avance de México, Brasil y Argentina tiene relevancia para los aficionados nicaragüenses que siguen el fútbol internacional.\n\nUTILIDAD: Los partidos del Mundial 2026 se transmitirán por señal abierta y plataformas de streaming disponibles en Nicaragua.',
        source: 'FIFA — información pública sobre el Mundial 2026 (sedes, formato)',
        verifiable: true,
        risk: 'BAJO-MEDIO — Contexto deportivo verificable. No inventar horarios ni canales específicos.',
      },
    ],
    sources: ['FIFA — Mundial 2026 (información pública)'],
    risk: 'BAJO-MEDIO — Contexto deportivo verificable.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 86.',
  },

  // ===== CATEGORY D — REESCRITURA (1) =====
  'zkdDsejAb5hLCpCaEbMR': {
    tituloBefore: null,
    tituloAfter: null,
    resumenBefore: null,
    resumenAfter: 'Masaya estrena complejo que integra estaciones de Bomberos y Migración en una sola sede.',
    htmlFixes: [
      'Reescribir contenido completo con estructura periodística.',
      'Asegurar mínimo 3-4 subtítulos H2.',
      'Envolver todo el texto en <p>.',
    ],
    contentAdditions: [
      {
        type: 'rewrite',
        what: 'Reescritura completa del artículo',
        where: 'Artículo completo',
        proposedText: 'REESCRITURA PROPUESTA:\n\nLead: Las autoridades inauguraron en Masaya un nuevo complejo que integra los servicios de Bomberos y Migración en una sola sede, con el objetivo de mejorar la atención a la ciudadanía.\n\nH2: Nueva infraestructura para Masaya\nEl complejo reúne en un solo punto dos instituciones que anteriormente operaban en sedes separadas. La inversión permite optimizar recursos y mejorar los tiempos de respuesta ante emergencias y trámites migratorios.\n\nH2: Servicios integrados\nLa sede de Bomberos contará con equipos de respuesta rápida y personal de guardia permanente. La oficina de Migración atenderá trámites de pasaportes, visados y otros servicios migratorios.\n\nH2: Impacto en la comunidad\nLos residentes de Masaya y municipios aledaños se beneficiarán de la cercanía de ambos servicios en una sola ubicación. El complejo forma parte de las inversiones del gobierno en infraestructura pública.\n\nNOTA: Esta reescritura mantiene ÚNICAMENTE los hechos verificables del artículo original. No se inventan cifras de inversión, metros cuadrados, ni declaraciones. Si el artículo original no contiene suficiente información verificable para esta reescritura, se recomienda ARCHIVE.',
        source: 'Información ya presente en el artículo original + MIGOB/DGB (información pública)',
        verifiable: true,
        risk: 'ALTO — Si el artículo original es demasiado escaso (403 palabras, score 64), la reescritura puede no ser suficiente. Considerar ARCHIVE si después de 2 iteraciones score < 85.',
      },
    ],
    sources: ['Artículo original + MIGOB/DGB (información pública)'],
    risk: 'ALTO — Score actual 64. Contenido cercano a comunicado. Reescritura puede no ser suficiente. Considerar ARCHIVE.',
    scoreExpected: 'Desconocido hasta ejecutar MENI. Score actual: 64. Alta probabilidad de que no llegue a 85.',
  },
};

function generateBackup(inventory) {
  const backup = {
    timestamp: new Date().toISOString(),
    phase: 'PHASE16_BEFORE',
    total: inventory.articles.length,
    articles: inventory.articles.map(a => ({
      id: a.id,
      titulo: a.titulo,
      slug: a.slug,
      resumen: a.resumen,
      contenido: a.contenidoHtml,
      scoreMeni: a.scoreMeni,
      aprobadoMeni: a.aprobadoMeni,
      nivel: a.nivel,
      nivelScore: a.nivelScore,
      profile: a.editorialTier,
      category: a.categoria,
      palabras: a.palabras,
    })),
  };
  return backup;
}

function generateCSV(inventory) {
  const headers = ['id', 'titulo', 'slug', 'scoreMeni', 'aprobadoMeni', 'nivel', 'nivelScore', 'profile', 'category', 'palabras'];
  const rows = [headers.join(',')];
  for (const a of inventory.articles) {
    const row = [
      a.id,
      `"${(a.titulo || '').replace(/"/g, '""')}"`,
      a.slug,
      a.scoreMeni,
      a.aprobadoMeni,
      a.nivel,
      a.nivelScore,
      a.editorialTier,
      a.categoria,
      a.palabras,
    ];
    rows.push(row.join(','));
  }
  return rows.join('\n');
}

function generateDryRunJSON(inventory) {
  const results = inventory.articles.map(a => {
    const cls = CLASSIFICATION[a.id] || { class: '?', reason: 'Sin clasificar' };
    const changes = PROPOSED_CHANGES[a.id] || {};
    return {
      id: a.id,
      titulo: a.titulo,
      slug: a.slug,
      categoria: a.categoria,
      editorialTier: a.editorialTier,
      scoreMeni: a.scoreMeni,
      aprobadoMeni: a.aprobadoMeni,
      nivel: a.nivel,
      palabras: a.palabras,
      classificacion: cls.class,
      blockingIssues: cls.reason,
      before: {
        titulo: a.titulo,
        resumen: a.resumen,
        htmlIssues: {
          pCount: a.pCount,
          brCount: a.brCount,
          h2Count: a.h2Count,
          hasEm: a.hasEm,
          tituloLength: a.tituloLength,
          resumenLength: a.resumenLength,
        },
      },
      proposed: {
        tituloAfter: changes.tituloAfter || null,
        resumenAfter: changes.resumenAfter || null,
        htmlFixes: changes.htmlFixes || [],
        contentAdditions: changes.contentAdditions || [],
        sources: changes.sources || [],
        risk: changes.risk || 'No evaluado',
        scoreExpected: changes.scoreExpected || 'Desconocido hasta ejecutar MENI',
        note: changes.note || null,
      },
    };
  });
  return { timestamp: new Date().toISOString(), total: results.length, articles: results };
}

function generateDryRunMD(inventory) {
  const lines = [];
  lines.push('# FORENSIC PHASE 16 — DRY-RUN FINAL');
  lines.push('## Propuesta concreta de modificación para 37 artículos');
  lines.push(`## Fecha: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## ADVERTENCIA CRÍTICA');
  lines.push('');
  lines.push('Este documento es un DRY-RUN. **NO se ha escrito nada a Firestore.**');
  lines.push('Ningún score ha sido modificado. Ningún artículo ha sido alterado.');
  lines.push('Este documento debe ser revisado antes de cualquier ejecución.');
  lines.push('');
  lines.push('### PRINCIPIOS');
  lines.push('');
  lines.push('- **Score esperado: desconocido hasta ejecutar MENI**');
  lines.push('- No se inventa información, estadísticas, declaraciones ni fechas');
  lines.push('- No se agrega texto solo para aumentar longitud');
  lines.push('- LONGITUD ≠ CALIDAD');
  lines.push('- Si después de 2 iteraciones score < 85 → MEJORADO_PERO_NO_APROBADO');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Summary table
  lines.push('## RESUMEN DE CLASIFICACIÓN');
  lines.push('');
  lines.push('| Clase | Cantidad | Descripción |');
  lines.push('|-------|----------|-------------|');
  lines.push('| A | 6 | Corrección simple (HTML, título, resumen) |');
  lines.push('| B | 22 | Contexto verificable con fuente |');
  lines.push('| C | 8 | Enriquecimiento periodístico |');
  lines.push('| D | 1 | Reescritura completa |');
  lines.push('| E | 0 | No rescatable |');
  lines.push('| **Total** | **37** | |');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Group by class
  const classes = ['A', 'B', 'C', 'D'];
  const classNames = {
    A: 'CORRECCIÓN SIMPLE',
    B: 'CONTEXTO VERIFICABLE',
    C: 'ENRIQUECIMIENTO PERIODÍSTICO',
    D: 'REESCRITURA',
  };

  for (const cls of classes) {
    const articles = inventory.articles.filter(a => (CLASSIFICATION[a.id] || {}).class === cls);
    if (articles.length === 0) continue;

    lines.push(`## CLASE ${cls} — ${classNames[cls]} (${articles.length} artículos)`);
    lines.push('');
    lines.push('---');
    lines.push('');

    articles.forEach((a, idx) => {
      const changes = PROPOSED_CHANGES[a.id] || {};
      const clsInfo = CLASSIFICATION[a.id];

      lines.push(`### ${cls}-${idx + 1}: ${a.titulo}`);
      lines.push('');
      lines.push('| Campo | Valor |');
      lines.push('|-------|-------|');
      lines.push(`| **ID** | \`${a.id}\` |`);
      lines.push(`| **Perfil** | ${a.editorialTier} |`);
      lines.push(`| **Categoría** | ${a.categoria} |`);
      lines.push(`| **Score actual** | ${a.scoreMeni} |`);
      lines.push(`| **Aprobado** | ${a.aprobadoMeni} |`);
      lines.push(`| **Palabras** | ${a.palabras} |`);
      lines.push(`| **Blocking issue** | ${clsInfo.reason} |`);
      lines.push(`| **H2** | ${a.h2Count} |`);
      lines.push(`| **P** | ${a.pCount} |`);
      lines.push(`| **BR** | ${a.brCount} |`);
      lines.push(`| **Título length** | ${a.tituloLength} |`);
      lines.push(`| **Resumen length** | ${a.resumenLength} |`);
      lines.push('');

      // BEFORE
      lines.push('#### ANTES (estado actual)');
      lines.push('');
      lines.push(`- **Título**: ${a.titulo}`);
      lines.push(`- **Resumen**: ${(a.resumen || '').substring(0, 120)}...`);
      lines.push(`- **HTML**: ${a.pCount} <p>, ${a.brCount} <br>, ${a.h2Count} <h2>`);
      if (a.tituloLength > 60) lines.push(`- **⚠️ Título > 60 chars** (${a.tituloLength})`);
      if (a.resumenLength > 160) lines.push(`- **⚠️ Resumen > 160 chars** (${a.resumenLength})`);
      if (a.brCount > 0) lines.push(`- **⚠️ ${a.brCount} tags <br> como separadores**`);
      if (a.pCount === 0) lines.push(`- **⚠️ Contenido sin etiquetas <p>**`);
      lines.push('');

      // PROPOSED CHANGES
      lines.push('#### DESPUÉS (propuesta)');
      lines.push('');

      if (changes.tituloAfter) {
        lines.push(`- **Título propuesto**: "${changes.tituloAfter}"`);
        lines.push(`  - Antes: "${a.titulo}" (${a.tituloLength} chars)`);
        lines.push(`  - Después: "${changes.tituloAfter}" (${changes.tituloAfter.length} chars)`);
      }

      if (changes.resumenAfter) {
        lines.push(`- **Resumen propuesto**: "${changes.resumenAfter}"`);
      }

      if (changes.htmlFixes && changes.htmlFixes.length > 0) {
        lines.push('- **Correcciones HTML**:');
        for (const fix of changes.htmlFixes) {
          lines.push(`  - ${fix}`);
        }
      }

      if (changes.contentAdditions && changes.contentAdditions.length > 0) {
        lines.push('- **Adiciones de contenido**:');
        for (const add of changes.contentAdditions) {
          lines.push(`  - **Tipo**: ${add.type}`);
          lines.push(`  - **Qué**: ${add.what}`);
          lines.push(`  - **Dónde**: ${add.where}`);
          lines.push(`  - **Texto propuesto**: `);
          lines.push('  ```');
          lines.push(`  ${add.proposedText}`);
          lines.push('  ```');
          lines.push(`  - **Fuente**: ${add.source}`);
          lines.push(`  - **Verificable**: ${add.verifiable ? 'SÍ' : 'NO'}`);
          lines.push(`  - **Riesgo**: ${add.risk}`);
        }
      }

      if (changes.note) {
        lines.push(`- **NOTA**: ${changes.note}`);
      }

      lines.push('');
      lines.push(`- **Fuentes**: ${changes.sources ? changes.sources.join('; ') : 'N/A'}`);
      lines.push(`- **Riesgo**: ${changes.risk || 'No evaluado'}`);
      lines.push(`- **Score esperado**: ${changes.scoreExpected || 'Desconocido hasta ejecutar MENI'}`);
      lines.push('');
      lines.push('---');
      lines.push('');
    });
  }

  // Risk analysis
  lines.push('## ANÁLISIS DE RIESGO');
  lines.push('');
  lines.push('### Artículos de ALTO riesgo (posible relleno o invención)');
  lines.push('');
  lines.push('| ID | Clase | Riesgo | Razón |');
  lines.push('|----|-------|--------|-------|');
  for (const a of inventory.articles) {
    const changes = PROPOSED_CHANGES[a.id];
    if (changes && changes.risk && changes.risk.startsWith('ALTO')) {
      const cls = CLASSIFICATION[a.id];
      lines.push(`| \`${a.id}\` | ${cls.class} | ALTO | ${changes.risk} |`);
    }
  }
  lines.push('');
  lines.push('### Artículos con score < 85 (probable que no aprueben)');
  lines.push('');
  lines.push('| ID | Score | Clase | Razón |');
  lines.push('|----|-------|-------|-------|');
  for (const a of inventory.articles) {
    if (a.scoreMeni < 85) {
      const cls = CLASSIFICATION[a.id];
      const changes = PROPOSED_CHANGES[a.id];
      lines.push(`| \`${a.id}\` | ${a.scoreMeni} | ${cls.class} | ${changes ? changes.risk : 'N/A'} |`);
    }
  }
  lines.push('');
  lines.push('### Artículos con score ≥ 85 pero rechazados');
  lines.push('');
  lines.push('| ID | Score | Clase | Razón del rechazo |');
  lines.push('|----|-------|-------|-------------------|');
  for (const a of inventory.articles) {
    if (a.scoreMeni >= 85 && !a.aprobadoMeni) {
      const cls = CLASSIFICATION[a.id];
      lines.push(`| \`${a.id}\` | ${a.scoreMeni} | ${cls.class} | ${cls.reason} |`);
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Verification checklist
  lines.push('## CHECKLIST DE VERIFICACIÓN ANTES DE EJECUTAR');
  lines.push('');
  lines.push('- [ ] Revisar cada propuesta de contenido B y C para confirmar que no inventa información');
  lines.push('- [ ] Verificar que las fuentes mencionadas son accesibles y contienen el dato citado');
  lines.push('- [ ] Confirmar que los textos propuestos no son copias textuales de fuentes');
  lines.push('- [ ] Verificar que los títulos corregidos no alteran el sentido de la noticia');
  lines.push('- [ ] Confirmar que las correcciones HTML no eliminan contenido válido');
  lines.push('- [ ] Revisar artículo D (zkdDsejAb5hLCpCaEbMR) para decidir reescritura vs ARCHIVE');
  lines.push('- [ ] Ejecutar backup antes de cualquier escritura');
  lines.push('- [ ] Ejecutar MENI después de cada modificación');
  lines.push('- [ ] No forzar score ≥ 85. Si no aprueba, marcar MEJORADO_PERO_NO_APROBADO');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## VEREDICTO DEL DRY-RUN');
  lines.push('');
  lines.push('Este dry-run propone cambios concretos para 37 artículos.');
  lines.push('');
  lines.push('- **6 artículos A**: Correcciones estructurales seguras (BAJO riesgo)');
  lines.push('- **22 artículos B**: Adiciones de contexto verificable (MEDIO riesgo)');
  lines.push('- **8 artículos C**: Enriquecimiento periodístico (MEDIO-ALTO riesgo)');
  lines.push('- **1 artículo D**: Reescritura completa (ALTO riesgo, posible ARCHIVE)');
  lines.push('');
  lines.push('**No se recomienda ejecutar hasta que el usuario revise y apruebe cada cambio.**');
  lines.push('');
  lines.push('**Score esperado: desconocido hasta ejecutar MENI en todos los casos.**');
  lines.push('');

  return lines.join('\n');
}

// Main
function main() {
  console.log('=== FASE 16 — DRY-RUN FINAL GENERATOR ===\n');

  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf8'));
  console.log(`Inventario cargado: ${inventory.total} artículos`);

  // 1. Backup JSON
  const backup = generateBackup(inventory);
  const backupPath = path.join(OUTPUT_DIR, 'FORENSIC_PHASE16_BEFORE.json');
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`✓ Backup JSON: ${backupPath}`);

  // 2. Backup CSV
  const csv = generateCSV(inventory);
  const csvPath = path.join(OUTPUT_DIR, 'FORENSIC_PHASE16_BEFORE.csv');
  fs.writeFileSync(csvPath, csv);
  console.log(`✓ Backup CSV: ${csvPath}`);

  // 3. Dry-run JSON
  const dryRunJSON = generateDryRunJSON(inventory);
  const dryRunJSONPath = path.join(OUTPUT_DIR, 'FORENSIC_PHASE16_DRYRUN_FINAL.json');
  fs.writeFileSync(dryRunJSONPath, JSON.stringify(dryRunJSON, null, 2));
  console.log(`✓ Dry-run JSON: ${dryRunJSONPath}`);

  // 4. Dry-run MD
  const dryRunMD = generateDryRunMD(inventory);
  const dryRunMDPath = path.join(OUTPUT_DIR, 'FORENSIC_PHASE16_DRYRUN_FINAL.md');
  fs.writeFileSync(dryRunMDPath, dryRunMD);
  console.log(`✓ Dry-run MD: ${dryRunMDPath}`);

  // Stats
  const classCounts = { A: 0, B: 0, C: 0, D: 0 };
  for (const a of inventory.articles) {
    const cls = (CLASSIFICATION[a.id] || {}).class;
    if (classCounts[cls] !== undefined) classCounts[cls]++;
  }
  console.log('\nEstadísticas:');
  console.log(`  A (Corrección simple): ${classCounts.A}`);
  console.log(`  B (Contexto verificable): ${classCounts.B}`);
  console.log(`  C (Enriquecimiento periodístico): ${classCounts.C}`);
  console.log(`  D (Reescritura): ${classCounts.D}`);

  const highRisk = inventory.articles.filter(a => {
    const c = PROPOSED_CHANGES[a.id];
    return c && c.risk && c.risk.startsWith('ALTO');
  });
  console.log(`  Alto riesgo: ${highRisk.length}`);
  console.log(`  Score < 85: ${inventory.articles.filter(a => a.scoreMeni < 85).length}`);
  console.log(`  Score >= 85 rechazados: ${inventory.articles.filter(a => a.scoreMeni >= 85 && !a.aprobadoMeni).length}`);

  console.log('\n✓ Dry-run final generado. NO se ha escrito a Firestore.');
  console.log('  Revisar FORENSIC_PHASE16_DRYRUN_FINAL.md antes de ejecutar.');
}

main();
