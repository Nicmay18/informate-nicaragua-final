/**
 * MENI Editorial Contract v1.1
 * ============================
 * Única fuente de verdad para reglas editoriales.
 *
 * Todo MENI (prompt, matrices, quality gate, scoring, editor jefe)
 * debe consumir este archivo.
 */

export type EditorialNivel = 'PUBLICAR' | 'PUBLICAR CON CAMBIOS' | 'NO PUBLICAR';

export interface IntencionEditorial {
  /** Concepto que debe quedar cubierto en el texto. */
  concepto: string;
  /** Sinónimos o frases equivalentes que satisfacen esa intención. */
  sinonimos: string[];
}

export interface CategoriaContract {
  categoria: string;
  descripcion: string;
  /** Preguntas obligatorias que la nota debe responder. */
  obligatorio: string[];
  /** Elementos que el sistema no debe exigir. */
  noExigir: string[];
  /** Definición del "servicio" para esta categoría. */
  servicioDefinicion: string;
  /** Intenciones del eje Contexto. */
  contexto: IntencionEditorial[];
  /** Intenciones del eje Explicación. */
  explicacion: IntencionEditorial[];
  /** Intenciones del eje Servicio. */
  servicio: IntencionEditorial[];
  /** Cinco preguntas del Editor Jefe. */
  preguntasEditorJefe: string[];
  /** Certificaciones técnicas que Forense otorga, no bloquea. */
  certificacionesForense: string[];
}

export interface EditorialContract {
  version: string;
  niveles: EditorialNivel[];
  reglasGlobales: {
    /** Forense certifica; Editor Jefe decide. */
    forenseEsDecisionEditorial: boolean;
    certificacionesForense: string[];
    /** Medir originalidad por valor agregado, no por porcentaje de texto distinto. */
    medirOriginalidadPor: 'valor_agregado' | 'porcentaje';
    indicadoresValorAgregado: string[];
    decisionFinal: 'editor_jefe';
    /** Escala editorial simplificada. */
    umbralPublicar: number;
    umbralPublicarConCambios: number;
  };
  categorias: Record<string, CategoriaContract>;
}

function sinTildes(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizarCategoria(raw: string): string {
  return sinTildes((raw || 'General').toLowerCase())
    .replace(/[^a-z0-9]/g, '');
}

const PREGUNTAS_EDITOR_JEFE: string[] = [
  '1. ¿Por qué vale la pena publicar esta nota?',
  '2. ¿Qué aprenderá el lector?',
  '3. ¿Qué aporta Nicaragua Informate que otros medios probablemente no expliquen?',
  '4. ¿Qué falta mejorar?',
  '5. ¿La publicarías?',
];

const CERTIFICACIONES_FORENSE: string[] = [
  'SEO',
  'EEAT',
  'Google Discover',
  'AdSense',
  'Legal',
];

const INDICADORES_VALOR_AGREGADO: string[] = [
    'Agrega antecedentes o contexto inédito',
    'Incluye datos adicionales verificables',
    'Explica el impacto local o para Nicaragua',
    'Aporta voz, testigos o fuentes reales',
    'Reorganiza la información con ángulo propio',
    'Conecta el hecho con consecuencias prácticas',
];

// ─────────────────────────────────────────────────────────────
// Contratos por categoría
// ─────────────────────────────────────────────────────────────

const SUCESOS: CategoriaContract = {
  categoria: 'Sucesos',
  descripcion: 'Hechos policiales, accidentes, violencia y emergencias.',
  obligatorio: [
    '¿Qué ocurrió?',
    '¿Dónde ocurrió?',
    '¿Quiénes estuvieron involucrados?',
    '¿Cuál es el estado de las víctimas?',
    '¿Qué investigan las autoridades?',
    '¿Qué sigue en el proceso?',
  ],
  noExigir: [
    'Teléfonos de emergencia genéricos',
    'Denuncia específica del lector',
    'Recomendaciones de seguridad vacías',
    'Nombres de detenidos cuando no existen',
    'Datos de capturas cuando no hay',
    'Análisis de presupuesto personal',
    'Dónde denunciar cuando no aplica',
    'Antecedentes históricos forzados',
    'Explicaciones causales o psicológicas artificiales',
    'Contexto lejano no verificable',
  ],
  servicioDefinicion:
    'En Sucesos, "servicio" es: qué ocurrió, dónde, quiénes estuvieron involucrados, estado de las víctimas, qué investigan las autoridades y qué sigue en el proceso. No exigir teléfonos, antecedentes históricos ni análisis artificiales.',
  contexto: [
    { concepto: 'Qué ocurrió', sinonimos: ['qué ocurrió', 'cómo ocurrió', 'los hechos', 'el incidente', 'el accidente', 'el caso', 'la situación', 'el hecho ocurrió', 'qué pasó', 'se produjo', 'sucedió', 'sucedido', 'evento', 'ocurrieron', 'se registró', 'se reportó'] },
    { concepto: 'Dónde', sinonimos: ['en', 'lugar', 'municipio', 'barrio', 'km', 'kilometro', 'carretera', 'avenida', 'calle', 'sector', 'reparto', 'comunidad', 'departamento', 'sabana grande', 'rubenia', 'winston', 'distrito', 'zona', 'punto', 'tramo', 'intersección'] },
    { concepto: 'Cuándo', sinonimos: ['este', 'ayer', 'la noche', 'la madrugada', 'la tarde', 'la mañana', 'el día', 'la semana', 'hora', 'minutos', 'horas', 'fecha', 'fin de semana', 'sábado', 'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes'] },
    { concepto: 'Quiénes', sinonimos: ['víctima', 'víctimas', 'afectado', 'afectados', 'motociclista', 'conductor', 'testigo', 'ocupante', 'fallecido', 'lesionado', 'identificado', 'fue encontrado sin vida', 'encontrado sin vida', 'sin vida', 'sin signos vitales', 'quien falleció', 'involucrados', 'implicados', 'persona', 'personas', 'individuo', 'hombre', 'mujer', 'joven', 'adulto', 'peatón', 'ciclista', 'pasajero', 'conducía', 'se desplazaba', 'viajaba'] },
    { concepto: 'Estado de las víctimas', sinonimos: ['estado de las víctimas', 'estado de los afectados', 'herido', 'heridos', 'fallecido', 'fallecidos', 'lesionado', 'lesionados', 'sin signos vitales', 'encontrado sin vida', 'trasladado', 'hospital', 'recibió atención', 'gravedad', 'estable', 'en observación', 'atendido', 'recuperándose', 'estado de salud', 'lesiones', 'traumatismo'] },
    { concepto: 'Autoridades', sinonimos: ['policía', 'transito', 'tránsito', 'medicina legal', 'cruz blanca', 'bomberos', 'socorrista', 'investiga', 'diligencia', 'levantamiento', 'fiscalía', 'autoridades', 'agentes', 'agentes de tránsito', 'rescatistas', 'paramédicos', 'Policía Nacional', 'regulación vial'] },
    { concepto: 'Qué investigan', sinonimos: ['qué investigan', 'investigan', 'indagan', 'determinan', 'establecen', 'versión preliminar', 'según las autoridades', 'diligencias', 'peritaje', 'no existe causa oficial', 'aún no se sabe', 'todavía no', 'falta por conocer', 'se desconoce'] },
    { concepto: 'Qué sigue', sinonimos: ['qué sigue', 'qué pasará', 'próximos pasos', 'continuará la investigación', 'seguirá la investigación', 'futuras diligencias', 'sigue en desarrollo', 'sigue en curso', 'continúa la investigación', 'estado del caso', 'causa bajo investigación', 'continúan las investigaciones'] },
  ],
  explicacion: [
    { concepto: 'Causas probables', sinonimos: ['exceso de velocidad', 'perdió el control', 'colisión', 'impacto', 'involucrado', 'estrelló', 'volcó', 'presuntamente', 'versión preliminar', 'testigos señalaron', 'según testigos', 'desapareció', 'fue encontrado', 'según información preliminar', 'de acuerdo con las investigaciones', 'agentes de tránsito', 'realizó un giro indebido', 'maniobra', 'no respetó', 'falla mecánica', 'condiciones del camino', 'estado de la vía'] },
    { concepto: 'Consecuencias', sinonimos: ['falleció', 'fallecido', 'lesionado', 'trasladado', 'hospital', 'murió', 'falleció en el lugar', 'recibió atención', 'gravedad', 'encontrado sin vida', 'sin vida', 'herido', 'heridos', 'atendido', 'recuperándose', 'estado de salud', 'lesiones', 'traumatismo'] },
    { concepto: 'Proceso', sinonimos: ['investigación', 'investiga', 'determinar', 'responsabilidad', 'resolución administrativa', 'informe técnico', 'diligencias', 'establecer', 'hay una carta', 'no existe causa oficial', 'aún no se sabe', 'todavía no', 'falta por conocer', 'se desconoce', 'no hay detenidos', 'sin detenidos', 'no existen responsables', 'responsabilidades correspondientes', 'determinar las responsabilidades'] },
    { concepto: 'Estado del caso', sinonimos: ['estado del caso', 'investigación abierta', 'continúan las diligencias', 'continúa la investigación', 'no hay personas detenidas', 'causa bajo investigación', 'sigue en desarrollo', 'sigue en curso', 'próximos pasos', 'qué sigue', 'continúan las investigaciones'] },
  ],
  servicio: [
    { concepto: 'Qué ocurrió', sinonimos: ['qué ocurrió', 'qué pasó', 'cómo ocurrió', 'los hechos', 'el incidente', 'el accidente', 'la situación', 'se produjo', 'sucedió'] },
    { concepto: 'Dónde ocurrió', sinonimos: ['lugar', 'municipio', 'barrio', 'carretera', 'avenida', 'calle', 'sector', 'comunidad', 'departamento', 'km', 'kilometro'] },
    { concepto: 'Quiénes estuvieron involucrados', sinonimos: ['víctima', 'víctimas', 'afectado', 'afectados', 'conductor', 'motociclista', 'ocupante', 'testigo', 'implicados', 'involucrados'] },
    { concepto: 'Estado de las víctimas', sinonimos: ['estado de las víctimas', 'herido', 'heridos', 'fallecido', 'fallecidos', 'lesionado', 'lesionados', 'sin signos vitales', 'encontrado sin vida', 'trasladado', 'hospital', 'gravedad', 'estable'] },
    { concepto: 'Qué investigan', sinonimos: ['qué investigan', 'indagan', 'determinan', 'diligencias', 'peritaje', 'versión preliminar', 'fiscalía', 'autoridades', 'aún no se sabe', 'falta por conocer'] },
    { concepto: 'Qué sigue en la investigación', sinonimos: ['qué sigue', 'qué pasará', 'próximos pasos', 'continuará la investigación', 'seguirá la investigación', 'futuras diligencias', 'sigue en desarrollo', 'sigue en curso', 'continúan las investigaciones', 'continúa las investigaciones'] },
    { concepto: 'Qué harán las autoridades', sinonimos: ['qué hará la policía', 'qué harán las autoridades', 'continuará', 'realizará', 'investigará', 'determinará', 'se encargará', 'autoridades continuarán', 'Policía Nacional continúa', 'determinar las responsabilidades correspondientes'] },
    { concepto: 'Qué falta conocer', sinonimos: ['qué falta conocer', 'aún no se sabe', 'se desconoce', 'no se ha determinado', 'por determinar', 'resta establecer', 'falta por conocer'] },
    { concepto: 'Cómo continúa el proceso', sinonimos: ['cómo continúa el proceso', 'proceso continúa', 'sigue el proceso', 'seguirá el proceso', 'continuará el proceso', 'sigue la investigación'] },
    { concepto: 'Qué peritajes faltan', sinonimos: ['peritaje', 'peritajes', 'dictamen', 'examen médico legal', 'autopsia', 'valoración', 'médico legal', 'toxicológico', 'dictamen forense', 'determinar la causa'] },
    { concepto: 'Estado del caso', sinonimos: ['estado del caso', 'investigación abierta', 'continúan las diligencias', 'continúa la investigación', 'no hay personas detenidas', 'causa bajo investigación'] },
    { concepto: 'Llamado a la prudencia', sinonimos: ['prudencia', 'precaución', 'conducir con prudencia', 'extremar precauciones', 'cuidado al volante', 'conducir con cuidado', 'recomendación', 'llamado', 'exhorta', 'insta', 'conductor debe', 'responsabilidad vial'] },
  ],
  preguntasEditorJefe: PREGUNTAS_EDITOR_JEFE,
  certificacionesForense: CERTIFICACIONES_FORENSE,
};

const NACIONALES: CategoriaContract = {
  categoria: 'Nacionales',
  descripcion: 'Política, gobierno, infraestructura y decisiones nacionales.',
  obligatorio: [
    '¿Qué cambia?',
    '¿A quién beneficia o afecta?',
    '¿Qué institución interviene?',
    '¿Qué significa para Nicaragua?',
    '¿Qué sigue ahora?',
  ],
  noExigir: [
    'Opinión personal del editor',
    'Análisis económico profundo si no aplica',
    'Teléfonos',
  ],
  servicioDefinicion:
    'En Nacionales, "servicio" es: qué cambia para el ciudadano, qué sigue, a quién afecta, cómo acceder, cuándo entra en vigor.',
  contexto: [
    { concepto: 'Qué se decidió', sinonimos: ['anunció', 'aprobó', 'informó', 'informó que', 'presentó', 'lanzó', 'decidió', 'qué cambia', 'nueva medida', 'resolución'] },
    { concepto: 'Quién interviene', sinonimos: ['gobierno', 'institución', 'ministerio', 'alcaldía', 'asamblea', 'despacho', 'autoridad', 'entidad'] },
    { concepto: 'Cuándo', sinonimos: ['a partir de', 'entrada en vigencia', 'desde', 'hasta', 'plazo', 'este', 'próximo'] },
  ],
  explicacion: [
    { concepto: 'A quién afecta', sinonimos: ['a quien beneficia', 'a quien afecta', 'impacto', 'población', 'ciudadano', 'familia', 'sectores', 'trabajadores', 'empresas'] },
    { concepto: 'Qué significa', sinonimos: ['qué significa', 'qué implica', 'qué representa', 'consecuencia', 'efecto', 'resultado', 'para nicaragua'] },
    { concepto: 'Cómo funciona', sinonimos: ['cómo funciona', 'cómo se aplica', 'cómo acceder', 'requisito', 'procedimiento', 'paso', 'trámite'] },
  ],
  servicio: [
    { concepto: 'Qué sigue', sinonimos: ['qué sigue', 'próximo paso', 'a partir de ahora', 'entra en vigencia', 'cuándo', 'plazo', 'cronograma'] },
    { concepto: 'Cómo acceder', sinonimos: ['cómo acceder', 'dónde informarse', 'requisito', 'documento', 'trámite', 'solicitar', 'acceder'] },
  ],
  preguntasEditorJefe: PREGUNTAS_EDITOR_JEFE,
  certificacionesForense: CERTIFICACIONES_FORENSE,
};

const INTERNACIONALES: CategoriaContract = {
  categoria: 'Internacionales',
  descripcion: 'Noticias del exterior relevantes para Nicaragua.',
  obligatorio: [
    '¿Por qué importa en Nicaragua?',
    '¿Cómo repercute?',
    '¿Cuál es el contexto?',
    '¿Qué antecedentes existen?',
    '¿Por qué esta noticia merece publicarse aquí?',
  ],
  noExigir: [
    'Acción concreta del lector',
    'Teléfonos',
    'Denuncia',
  ],
  servicioDefinicion:
    'En Internacionales, "servicio" es: por qué importa en Nicaragua, cómo repercute, qué antecedentes hay, qué seguir.',
  contexto: [
    { concepto: 'Hecho exterior', sinonimos: ['ocurrió en', 'en estados unidos', 'en europa', 'en asia', 'en latinoamérica', 'país', 'gobierno de', 'anunció', 'aprobó'] },
    { concepto: 'Relevancia para Nicaragua', sinonimos: ['para nicaragua', 'en nicaragua', 'repercute', 'impacto local', 'relación con', 'vínculo con', 'conexión con'] },
  ],
  explicacion: [
    { concepto: 'Por qué importa', sinonimos: ['por qué importa', 'por qué interesa', 'qué implica', 'qué significa', 'consecuencia', 'efecto'] },
    { concepto: 'Antecedentes', sinonimos: ['antecedente', 'contexto', 'ya había', 'previamente', 'históricamente', 'no es la primera'] },
    { concepto: 'Cómo repercute', sinonimos: ['repercute en', 'afecta a', 'impacta', 'podría influir', 'podría afectar', 'consecuencia para'] },
  ],
  servicio: [
    { concepto: 'Qué seguir', sinonimos: ['qué seguir', 'a seguir', 'próximos pasos', 'qué viene', 'se espera', 'resolución'] },
    { concepto: 'Consecuencia práctica', sinonimos: ['impacto', 'cómo afecta', 'para el lector', 'para nicaragua', 'qué cambia'] },
  ],
  preguntasEditorJefe: PREGUNTAS_EDITOR_JEFE,
  certificacionesForense: CERTIFICACIONES_FORENSE,
};

const DEPORTES_COLECTIVOS: CategoriaContract = {
  categoria: 'Deportes',
  descripcion: 'Deportes de equipo y competencias colectivas.',
  obligatorio: [
    '¿Cuál fue el resultado?',
    '¿Quiénes jugaron?',
    '¿Dónde y cuándo?',
    '¿Qué significa este resultado?',
    '¿Cómo queda la tabla?',
    '¿Cuál es el próximo partido?',
    '¿Hubo figuras destacadas?',
  ],
  noExigir: [
    'Alineación completa de cada equipo',
    'Estadísticas detalladas no disponibles',
    'Biografía de jugadores',
  ],
  servicioDefinicion:
    'En Deportes colectivos, "servicio" es: tabla, próximo rival, dónde ver, horario, próximo partido.',
  contexto: [
    { concepto: 'Resultado', sinonimos: ['ganó', 'perdió', 'empató', 'marcador', 'goles', 'anotaciones', 'puntos', 'sets', 'innings', 'triunfo', 'derrota'] },
    { concepto: 'Equipos', sinonimos: ['equipo', 'club', 'selección', 'vs', 'contra', 'frente a', 'jugaron', 'rival'] },
    { concepto: 'Dónde y cuándo', sinonimos: ['estadio', 'cancha', 'pista', 'gimnasio', 'torneo', 'campeonato', 'jornada', 'fecha', 'hora'] },
  ],
  explicacion: [
    { concepto: 'Qué significa', sinonimos: ['qué significa', 'qué implica', 'como queda', 'posición', 'clasificación', 'acercó', 'alejó', 'definió', 'aseguró'] },
    { concepto: 'Figuras destacadas', sinonimos: ['figura', 'destacado', 'goleador', 'anotó', 'marcó', 'asistencia', 'portería', 'defensa'] },
    { concepto: 'Cómo fue', sinonimos: ['partido', 'encuentro', 'comenzó', 'primera mitad', 'segunda mitad', 'sobre la hora', 'penalti', 'remontada', 'ventaja'] },
  ],
  servicio: [
    { concepto: 'Tabla', sinonimos: ['tabla', 'clasificación', 'posición', 'puntos', 'diferencia de goles'] },
    { concepto: 'Próximo partido', sinonimos: ['próximo', 'siguiente', 'rival', 'enfrentará', 'visita', 'local', 'jornada'] },
    { concepto: 'Dónde ver', sinonimos: ['dónde ver', 'transmisión', 'horario', 'canal', 'televisión', 'radio', 'hora'] },
  ],
  preguntasEditorJefe: PREGUNTAS_EDITOR_JEFE,
  certificacionesForense: CERTIFICACIONES_FORENSE,
};

const DEPORTES_INDIVIDUALES: CategoriaContract = {
  categoria: 'DeportesIndividuales',
  descripcion: 'Deportes individuales: boxeo, atletismo, natación, artes marciales, etc.',
  obligatorio: [
    '¿Quién es el atleta?',
    '¿Cuál es su nacionalidad u origen?',
    '¿Qué edad tiene?',
    '¿En qué disciplina compite?',
    '¿En qué torneo o campeonato participó?',
    '¿Qué resultado obtuvo?',
    '¿Qué categoría o modalidad compite?',
    '¿Cuál es su próximo evento o desafío?',
    '¿Dónde y cuándo será el próximo reto?',
    '¿Cuál es su trayectoria deportiva?',
  ],
  noExigir: [
    'Alineaciones',
    'Tabla de posiciones',
    'Próximo partido de equipo',
    'Marcador colectivo',
  ],
  servicioDefinicion:
    'En Deportes Individuales, "servicio" es: próximo evento, sede/fecha, datos útiles para seguidores y trayectoria del atleta.',
  contexto: [
    { concepto: 'Nombre del atleta', sinonimos: ['atleta', 'boxeador', 'nadador', 'ciclista', 'gimnasta', 'judoka', 'karateca', 'luchador', 'deportista'] },
    { concepto: 'Nacionalidad u origen', sinonimos: ['nacionalidad', 'origen', 'procedente', 'nacido en', 'país', 'nicaragua', 'nicaragüense'] },
    { concepto: 'Edad', sinonimos: ['años', 'edad', 'cumpleaños', 'joven', 'de edad'] },
    { concepto: 'Disciplina', sinonimos: ['disciplina', 'boxeo', 'atletismo', 'natación', 'ciclismo', 'sanda', 'wushu', 'lucha', 'mma', 'gimnasia', 'judo', 'karate'] },
    { concepto: 'Torneo o campeonato', sinonimos: ['torneo', 'campeonato', 'competencia', 'open', 'juegos', 'mundial', 'continental', 'pelea', 'combate'] },
    { concepto: 'Trayectoria', sinonimos: ['trayectoria', 'carrera', 'historia deportiva', 'antecedente', 'camino', 'debut'] },
  ],
  explicacion: [
    { concepto: 'Quién es', sinonimos: ['quién es el atleta', 'perfil del atleta', 'debut', 'trayectoria', 'se caracteriza'] },
    { concepto: 'Qué ganó', sinonimos: ['qué ganó', 'título', 'medalla', 'campeonato', 'logro', 'conquista', 'resultado obtenido', 'venció', 'derrotó'] },
    { concepto: 'Cómo consiguió', sinonimos: ['cómo consiguió', 'cómo logró', 'cómo venció', 'superó', 'derrotó', 'técnica', 'estrategia', 'por decisión'] },
    { concepto: 'Qué viene', sinonimos: ['qué viene', 'qué sigue', 'próximo evento', 'próximo desafío', 'próximo reto', 'defenderá', 'buscará'] },
  ],
  servicio: [
    { concepto: 'Próximo evento', sinonimos: ['próximo evento', 'próxima competencia', 'próximo desafío', 'próximo reto', 'fecha', 'hora', 'lugar'] },
    { concepto: 'Datos útiles', sinonimos: ['dónde ver', 'transmisión', 'horario', 'entrada', 'boletos', 'sede'] },
    { concepto: 'Trayectoria', sinonimos: ['trayectoria', 'carrera', 'contexto deportivo', 'historia del atleta'] },
  ],
  preguntasEditorJefe: PREGUNTAS_EDITOR_JEFE,
  certificacionesForense: CERTIFICACIONES_FORENSE,
};

const TECNOLOGIA: CategoriaContract = {
  categoria: 'Tecnología',
  descripcion: 'Tecnología, gadgets, IA, ciberseguridad, internet.',
  obligatorio: [
    '¿Qué es y qué hace?',
    '¿Cómo funciona?',
    '¿Quién puede usarlo?',
    '¿Qué cambia?',
    '¿Vale la pena?',
  ],
  noExigir: [
    'Precio específico si no está disponible',
    'Disponibilidad en Nicaragua si no aplica',
    'Opinión personal',
  ],
  servicioDefinicion:
    'En Tecnología, "servicio" es: para qué sirve, cómo funciona, qué cambia, quién puede usarlo, ventajas.',
  contexto: [
    { concepto: 'Qué es', sinonimos: ['qué es', 'qué hace', 'se trata de', 'herramienta', 'plataforma', 'aplicación', 'app', 'dispositivo', 'nueva función', 'nueva versión'] },
    { concepto: 'Quién lo lanzó', sinonimos: ['lanzó', 'desarrolló', 'presentó', 'empresa', 'marca', 'compañía', 'google', 'meta', 'openai', 'microsoft'] },
  ],
  explicacion: [
    { concepto: 'Cómo funciona', sinonimos: ['cómo funciona', 'cómo se usa', 'cómo opera', 'permite', 'permite', 'funciona'] },
    { concepto: 'Para qué sirve', sinonimos: ['para qué sirve', 'sirve para', 'permite', 'ayuda a', 'facilita', 'beneficio', 'ventaja'] },
    { concepto: 'Qué cambia', sinonimos: ['qué cambia', 'qué implica', 'qué representa', 'novedad', 'diferencia con', 'mejora', 'riesgo'] },
  ],
  servicio: [
    { concepto: 'Para qué sirve', sinonimos: ['para qué sirve', 'quién puede usarlo', 'cómo acceder', 'disponible', 'compatibilidad', 'requisito'] },
    { concepto: 'Cómo funciona', sinonimos: ['cómo funciona', 'cómo se usa', 'ejemplo', 'paso a paso', 'tutorial'] },
    { concepto: 'Qué cambia', sinonimos: ['qué cambia', 'qué representa', 'impacto', 'ventaja', 'desventaja'] },
  ],
  preguntasEditorJefe: PREGUNTAS_EDITOR_JEFE,
  certificacionesForense: CERTIFICACIONES_FORENSE,
};

const ESPECTACULOS: CategoriaContract = {
  categoria: 'Espectáculos',
  descripcion: 'Conciertos, cine, teatro, eventos culturales y festivales.',
  obligatorio: [
    '¿Vale la pena asistir?',
    '¿Qué encontrará el visitante?',
    '¿Dónde?',
    '¿Cuándo?',
    '¿Cuánto cuesta?',
    '¿Quién puede ir?',
    '¿Qué hace diferente este evento?',
  ],
  noExigir: [
    'Biografía completa de artistas',
    'Crítica de contenido',
  ],
  servicioDefinicion:
    'En Espectáculos, "servicio" es: lugar, fecha, precio, horarios, entradas, acceso.',
  contexto: [
    { concepto: 'Qué es el evento', sinonimos: ['evento', 'concierto', 'festival', 'obra', 'película', 'estreno', 'presentación', 'gira', 'show'] },
    { concepto: 'Quiénes participan', sinonimos: ['artista', 'banda', 'grupo', 'actor', 'director', 'organiza', 'productor'] },
  ],
  explicacion: [
    { concepto: 'Qué encontrará', sinonimos: ['qué encontrará', 'qué incluye', 'cartel', 'programa', 'actividades', 'propuesta', 'qué ofrece'] },
    { concepto: 'Por qué es diferente', sinonimos: ['diferente', 'especial', 'único', 'primera vez', 'en nicaragua', 'regresa'] },
  ],
  servicio: [
    { concepto: 'Lugar', sinonimos: ['lugar', 'dónde', 'sede', 'teatro', 'sala', 'estadio', 'parque', 'recinto'] },
    { concepto: 'Fecha y hora', sinonimos: ['cuándo', 'fecha', 'hora', 'día', 'inicio', 'hora de inicio'] },
    { concepto: 'Precio y entradas', sinonimos: ['precio', 'entrada', 'boletos', 'costo', 'cuesta', 'cómo comprar', 'taquilla', 'online'] },
  ],
  preguntasEditorJefe: PREGUNTAS_EDITOR_JEFE,
  certificacionesForense: CERTIFICACIONES_FORENSE,
};

const ECONOMIA: CategoriaContract = {
  categoria: 'Economía',
  descripcion: 'Economía, precios, impuestos, mercado y política fiscal.',
  obligatorio: [
    '¿Qué cambia?',
    '¿Cómo afecta?',
    '¿Quién paga o se beneficia?',
    '¿Cuándo entra en vigencia?',
    '¿Qué significa para Nicaragua?',
  ],
  noExigir: [
    'Teléfonos',
    'Denuncia',
  ],
  servicioDefinicion:
    'En Economía, "servicio" es: cómo afecta, quién paga, cuándo entra en vigencia, a quién afecta.',
  contexto: [
    { concepto: 'Qué cambia', sinonimos: ['qué cambia', 'anunció', 'aprobó', 'nueva medida', 'subida', 'bajada', 'precio', 'impuesto', 'tarifa', 'salario'] },
    { concepto: 'Institución', sinonimos: ['banco central', 'ministerio de hacienda', 'hacienda', 'banco', 'gobierno', 'asamblea'] },
  ],
  explicacion: [
    { concepto: 'Cómo afecta', sinonimos: ['cómo afecta', 'impacto', 'para el bolsillo', 'para las familias', 'para empresas', 'para el consumidor'] },
    { concepto: 'Quién paga', sinonimos: ['quién paga', 'quién se beneficia', 'afecta a', 'exento', 'beneficiario', 'contribuyente'] },
    { concepto: 'Cuándo entra en vigencia', sinonimos: ['entra en vigencia', 'a partir de', 'desde', 'próximo', 'plazo', 'cuándo'] },
  ],
  servicio: [
    { concepto: 'Cómo afecta', sinonimos: ['cómo afecta', 'a quién afecta', 'impacto', 'ejemplo', 'cálculo', 'cuánto pagará'] },
    { concepto: 'Cuándo y cómo', sinonimos: ['cuándo entra en vigencia', 'cómo se aplica', 'qué hacer', 'trámite', 'requisito'] },
  ],
  preguntasEditorJefe: PREGUNTAS_EDITOR_JEFE,
  certificacionesForense: CERTIFICACIONES_FORENSE,
};

const POLITICA: CategoriaContract = {
  categoria: 'Política',
  descripcion: 'Política partidaria, elecciones, poderes del Estado y debate público.',
  obligatorio: [
    '¿Qué decidió o declaró?',
    '¿Quiénes intervienen?',
    '¿Por qué importa?',
    '¿A quién beneficia o perjudica?',
    '¿Qué sigue?',
  ],
  noExigir: [
    'Teléfonos',
    'Denuncia',
    'Opinión personal',
  ],
  servicioDefinicion:
    'En Política, "servicio" es: qué sigue, impacto, a quién afecta, dónde informarse.',
  contexto: [
    { concepto: 'Qué se decidió', sinonimos: ['decidió', 'declaró', 'anunció', 'aprobó', 'presentó', 'proyecto', 'ley', 'resolución'] },
    { concepto: 'Quiénes intervienen', sinonimos: ['gobierno', 'oposición', 'partido', 'bancada', 'asamblea', 'diputado', 'ministro', 'presidente'] },
  ],
  explicacion: [
    { concepto: 'Por qué importa', sinonimos: ['por qué importa', 'qué implica', 'qué significa', 'consecuencia', 'impacto'] },
    { concepto: 'A quién afecta', sinonimos: ['a quien beneficia', 'a quien perjudica', 'a quien afecta', 'sectores', 'población', 'ciudadano'] },
  ],
  servicio: [
    { concepto: 'Qué sigue', sinonimos: ['qué sigue', 'próximo paso', 'se espera', 'plazo', 'votación', 'entrada en vigencia'] },
    { concepto: 'Impacto', sinonimos: ['impacto', 'cómo afecta', 'qué cambia', 'a quién'] },
  ],
  preguntasEditorJefe: PREGUNTAS_EDITOR_JEFE,
  certificacionesForense: CERTIFICACIONES_FORENSE,
};

const SALUD: CategoriaContract = {
  categoria: 'Salud',
  descripcion: 'Salud pública, enfermedades, campañas y servicios médicos.',
  obligatorio: [
    '¿Qué es la alerta o medida?',
    '¿Quién la emite o aplica?',
    '¿A quién aplica?',
    '¿Qué debe hacer el lector?',
    '¿Qué sigue?',
  ],
  noExigir: [
    'Opinión personal',
  ],
  servicioDefinicion:
    'En Salud, "servicio" es: qué hacer, dónde acudir, precauciones, vacunas, a quién aplica.',
  contexto: [
    { concepto: 'Qué es', sinonimos: ['alerta', 'campaña', 'vacunación', 'enfermedad', 'virus', 'brote', 'medida', 'protocolo'] },
    { concepto: 'Quién emite', sinonimos: ['minsa', 'ministerio de salud', 'autoridad sanitaria', 'hospital', 'centro de salud'] },
  ],
  explicacion: [
    { concepto: 'A quién aplica', sinonimos: ['a quien aplica', 'población', 'grupo de riesgo', 'edad', 'comunidad', 'departamento'] },
    { concepto: 'Qué debe hacer', sinonimos: ['qué debe hacer', 'qué hacer', 'precaución', 'evitar', 'recomendación', 'protegerse'] },
  ],
  servicio: [
    { concepto: 'Qué hacer', sinonimos: ['qué hacer', 'dónde acudir', 'centro de salud', 'vacunarse', 'precaución', 'síntoma', 'atención médica'] },
    { concepto: 'A quién aplica', sinonimos: ['a quien aplica', 'quién debe', 'población', 'grupo', 'riesgo', 'edad'] },
  ],
  preguntasEditorJefe: PREGUNTAS_EDITOR_JEFE,
  certificacionesForense: CERTIFICACIONES_FORENSE,
};

const EDUCACION: CategoriaContract = {
  categoria: 'Educación',
  descripcion: 'Educación, escuelas, universidades, reformas y exámenes.',
  obligatorio: [
    '¿Qué cambia?',
    '¿A quién aplica?',
    '¿Cuándo entra en vigencia?',
    '¿Qué debe hacer estudiantes o docentes?',
    '¿Qué sigue?',
  ],
  noExigir: [
    'Teléfonos',
    'Opinión personal',
  ],
  servicioDefinicion:
    'En Educación, "servicio" es: qué debe hacer, dónde informarse, fechas, requisitos, a quién aplica.',
  contexto: [
    { concepto: 'Qué cambia', sinonimos: ['qué cambia', 'nueva medida', 'reforma', 'currículo', 'programa', 'beca', 'becas', 'examen', 'matrícula'] },
    { concepto: 'Institución', sinonimos: ['mined', 'universidad', 'colegio', 'instituto', 'escuela', 'gobierno', 'asamblea'] },
  ],
  explicacion: [
    { concepto: 'A quién aplica', sinonimos: ['a quien aplica', 'estudiantes', 'docentes', 'colegios', 'universidades', 'nivel', 'grado'] },
    { concepto: 'Qué debe hacer', sinonimos: ['qué debe hacer', 'qué hacer', 'requisito', 'inscripción', 'matrícula', 'documento', 'plazo'] },
  ],
  servicio: [
    { concepto: 'Qué hacer', sinonimos: ['qué hacer', 'cómo inscribirse', 'requisito', 'documento', 'plazo', 'dónde informarse'] },
    { concepto: 'Fechas', sinonimos: ['cuándo', 'fecha', 'inicio de clases', 'plazo', 'entrega', 'matrícula'] },
  ],
  preguntasEditorJefe: PREGUNTAS_EDITOR_JEFE,
  certificacionesForense: CERTIFICACIONES_FORENSE,
};

const CULTURA: CategoriaContract = {
  categoria: 'Cultura',
  descripcion: 'Tradiciones, patrimonio, artes, literatura y expresiones culturales.',
  obligatorio: [
    '¿Qué es?',
    '¿Por qué importa?',
    '¿Quiénes participan?',
    '¿Qué contexto tiene?',
    '¿Qué aporta Nicaragua?',
  ],
  noExigir: [
    'Teléfonos',
  ],
  servicioDefinicion:
    'En Cultura, "servicio" es: dónde, cuándo, cómo participar o asistir, contexto e importancia.',
  contexto: [
    { concepto: 'Qué es', sinonimos: ['qué es', 'tradicione', 'patrimonio', 'obra', 'expresión', 'celebración', 'festividad', 'manifestación'] },
    { concepto: 'Quiénes', sinonimos: ['comunidad', 'grupo', 'artista', 'escritor', 'músico', 'colectivo', 'familia'] },
  ],
  explicacion: [
    { concepto: 'Por qué importa', sinonimos: ['por qué importa', 'qué representa', 'significado', 'valor', 'identidad', 'memoria'] },
    { concepto: 'Contexto', sinonimos: ['contexto', 'historia', 'origen', 'antecedente', 'evolución', 'trayectoria'] },
  ],
  servicio: [
    { concepto: 'Cómo participar', sinonimos: ['dónde', 'cuándo', 'cómo asistir', 'cómo participar', 'acceso', 'entrada'] },
    { concepto: 'Importancia', sinonimos: ['importancia', 'qué representa', 'valor', 'patrimonio'] },
  ],
  preguntasEditorJefe: PREGUNTAS_EDITOR_JEFE,
  certificacionesForense: CERTIFICACIONES_FORENSE,
};

const GENERAL: CategoriaContract = {
  categoria: 'General',
  descripcion: 'Perfil editorial por defecto.',
  obligatorio: [
    '¿Qué ocurrió?',
    '¿Qué explicación aporta?',
    '¿Qué servicio tiene para el lector?',
    '¿Qué aporta Nicaragua Informate?',
  ],
  noExigir: [],
  servicioDefinicion:
    'En General, "servicio" es: qué debe saber el lector y qué puede hacer con la información.',
  contexto: [
    { concepto: 'Qué ocurrió', sinonimos: ['qué ocurrió', 'qué pasó', 'qué se sabe', 'el hecho', 'el evento'] },
    { concepto: 'Quiénes', sinonimos: ['quiénes', 'quién', 'personas', 'involucrados', 'protagonistas'] },
    { concepto: 'Dónde y cuándo', sinonimos: ['dónde', 'cuándo', 'lugar', 'fecha', 'hora'] },
  ],
  explicacion: [
    { concepto: 'Por qué', sinonimos: ['por qué', 'cómo', 'causa', 'razón', 'motivo'] },
    { concepto: 'Consecuencias', sinonimos: ['consecuencia', 'impacto', 'qué implica', 'qué cambia'] },
  ],
  servicio: [
    { concepto: 'Qué hacer', sinonimos: ['qué hacer', 'cómo', 'dónde', 'próximo paso', 'seguir'] },
    { concepto: 'Contexto', sinonimos: ['contexto', 'antecedente', 'historia'] },
  ],
  preguntasEditorJefe: PREGUNTAS_EDITOR_JEFE,
  certificacionesForense: CERTIFICACIONES_FORENSE,
};

export const CONTRATO_GLOBAL: EditorialContract = {
  version: '1.1.0',
  niveles: ['PUBLICAR', 'PUBLICAR CON CAMBIOS', 'NO PUBLICAR'],
  reglasGlobales: {
    forenseEsDecisionEditorial: false,
    certificacionesForense: CERTIFICACIONES_FORENSE,
    medirOriginalidadPor: 'valor_agregado',
    indicadoresValorAgregado: INDICADORES_VALOR_AGREGADO,
    decisionFinal: 'editor_jefe',
    umbralPublicar: 90,
    umbralPublicarConCambios: 85,
  },
  categorias: {
    general: GENERAL,
    sucesos: SUCESOS,
    nacionales: NACIONALES,
    internacionales: INTERNACIONALES,
    deportes: DEPORTES_COLECTIVOS,
    deportesindividuales: DEPORTES_INDIVIDUALES,
    tecnologia: TECNOLOGIA,
    espectaculos: ESPECTACULOS,
    economia: ECONOMIA,
    politica: POLITICA,
    salud: SALUD,
    educacion: EDUCACION,
    cultura: CULTURA,
  },
};

export function getContratoEditorial(categoria: string | undefined): CategoriaContract {
  if (!categoria) return CONTRATO_GLOBAL.categorias.general;
  const key = normalizarCategoria(categoria);
  return CONTRATO_GLOBAL.categorias[key] || CONTRATO_GLOBAL.categorias.general;
}

export function intencionesToRegexes(intenciones: IntencionEditorial[]): RegExp[] {
  const regexes: RegExp[] = [];
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tolerarAcentos = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/a/g, '[aá]')
      .replace(/e/g, '[eé]')
      .replace(/i/g, '[ií]')
      .replace(/o/g, '[oó]')
      .replace(/u/g, '[uú]')
      .replace(/n/g, '[nñ]');
  for (const intencion of intenciones) {
    for (const sinonimo of intencion.sinonimos) {
      const escapado = escape(sinonimo);
      const pattern = `(?:^|[\\s.,;:!?¿¡()\\-—])${tolerarAcentos(escapado)}(?=$|[\\s.,;:!?¿¡()\\-—])`.replace(/\s+/g, '\\s+');
      regexes.push(new RegExp(pattern, 'i'));
    }
  }
  return regexes;
}

export function intencionesToTerminos(intenciones: IntencionEditorial[]): string[] {
  return intenciones.flatMap((i) => i.sinonimos);
}

export function allTerminos(contrato: CategoriaContract): string[] {
  return [
    ...intencionesToTerminos(contrato.contexto),
    ...intencionesToTerminos(contrato.explicacion),
    ...intencionesToTerminos(contrato.servicio),
  ];
}
