const c1 = `Dos personas, un hombre y su hijo, murieron el 2 de junio de 2026 en San José, Costa Rica, tras un ataque armado contra un vehículo en una zona residencial del Gran Área Metropolitana, hecho que es investigado por el Organismo de Investigación Judicial (OIJ) para determinar el móvil y posibles vínculos con estructuras criminales.

Ataque armado en zona residencial de San José

El hecho ocurrió en una calle de una urbanización del área metropolitana de la capital costarricense, cuando el vehículo en el que viajaban las víctimas fue interceptado por varios sujetos armados que realizaron múltiples disparos.

Según el informe preliminar del OIJ, en la escena fueron ubicados decenas de casquillos percutidos. El análisis balístico preliminar indica el uso de armas de alto poder, incluyendo indicios compatibles con fusiles tipo AK-47 y AR-15, los cuales fueron enviados a peritaje forense.

Un vocero del OIJ explicó el trabajo técnico en este tipo de escenas: "El análisis de la evidencia permite determinar trayectoria de disparos, cantidad de armas utilizadas y dinámica del hecho".

Víctimas y atención de emergencia

El padre murió en el lugar del ataque debido a la gravedad de las heridas por impactos de bala. El hijo fue trasladado por la Cruz Blanca Costarricense a un centro médico en San José, donde falleció minutos después de su ingreso.

La Cruz Blanca reportó que la unidad de emergencia llegó al sitio a las 9:18 p.m., activando protocolo de traslado prioritario.

Las autoridades mantienen la identidad oficial en proceso de verificación mientras se notifica a familiares.

Recolección de evidencia e investigación

Equipos de criminalística del OIJ realizaron inspección del vehículo, levantamiento de casquillos y análisis de cámaras de seguridad en un radio de aproximadamente 1.5 kilómetros.

La investigación contempla varias hipótesis, entre ellas posibles disputas entre estructuras criminales que operan en el Valle Central.

Un investigador del OIJ señaló: "El nivel de violencia observado sugiere una acción planificada con participación de varios sujetos armados".

Contexto de seguridad en la región

El Ministerio de Seguridad Pública de Costa Rica ha informado un aumento de incidentes violentos vinculados a disputas por rutas de narcotráfico en zonas urbanas del Gran Área Metropolitana. El uso de armamento de alto calibre en espacios residenciales ha sido documentado en operativos recientes.

En Nicaragua, autoridades policiales en Managua han reforzado campañas de prevención sobre los efectos regionales del crimen organizado, debido a la conexión de rutas entre países de Centroamérica.

Investigación en curso

El OIJ mantiene el caso abierto en fase de análisis forense. Los resultados de balística, cámaras de seguridad y entrevistas serán determinantes para reconstruir la secuencia del ataque.

Hasta el cierre de esta información no se reportan detenciones relacionadas.

Slug sugerido: ataque-armado-san-jose-padre-hijo-oij-2026
Meta descripción: Ataque armado en San José deja dos muertos, padre e hijo. OIJ investiga uso de armas de alto poder y posible vínculo con crimen organizado.`;

const c2 = `Un ciudadano nicaragüense privado de libertad murió dentro del Centro Penal de Puntarenas, Costa Rica, tras una riña ocurrida en un pabellón interno, hecho que se encuentra bajo investigación del Organismo de Investigación Judicial (OIJ) y el Ministerio de Justicia y Paz.

Hecho dentro del Centro Penal de Puntarenas

El incidente ocurrió en un pabellón del Centro Penal de Puntarenas, ubicado en la provincia del mismo nombre, en el Pacífico costarricense. La confrontación se registró entre personas privadas de libertad dentro del recinto.

De acuerdo con información preliminar del sistema penitenciario, el ciudadano nicaragüense fue atacado con objetos punzocortantes de fabricación artesanal conocidos como "puntas".

El personal médico del centro aplicó atención inicial y activó el protocolo de emergencia. El privado de libertad fue declarado sin signos vitales dentro del mismo centro, según el reporte preliminar.

Un funcionario del sistema penitenciario indicó: "Se revisan las condiciones del pabellón y el origen de los objetos utilizados en la riña para establecer cómo ocurrió el hecho".

Investigación judicial y control interno

El OIJ asumió la investigación para determinar la secuencia de los hechos, identificar a los involucrados y establecer posibles fallas en los controles internos del centro penal.

Las diligencias incluyen entrevistas a privados de libertad, revisión de cámaras internas y análisis del área donde ocurrió la confrontación. El Ministerio de Justicia y Paz ordenó la intervención del pabellón involucrado.

Un investigador judicial señaló: "La investigación busca establecer la forma en que ocurrió la agresión y la participación de los involucrados dentro del pabellón".

Condiciones del sistema penitenciario

El sistema penitenciario de Costa Rica ha reportado niveles de ocupación elevados en distintos centros, lo que ha sido señalado en informes oficiales como un factor que complica el control interno y la prevención de incidentes.

El Ministerio de Justicia y Paz ha indicado que el hacinamiento afecta la separación de internos y la detección de objetos prohibidos, lo que incrementa el riesgo de conflictos entre personas privadas de libertad.

En el Centro Penal de Puntarenas se realizan requisas periódicas y operativos internos para reducir la circulación de objetos punzocortantes.

Atención consular y proceso para Nicaragua

Tras el fallecimiento, las autoridades costarricenses activaron el protocolo de notificación al Consulado de Nicaragua en Costa Rica. El proceso incluye identificación oficial, comunicación a familiares y coordinación de trámites legales.

En Managua, especialmente en distritos como Tipitapa y Ciudad Sandino, se registra un flujo constante de migración hacia Costa Rica, según registros consulares y policiales.

Investigación en curso

El OIJ mantiene el caso en fase preliminar mientras se completan análisis forenses, entrevistas y revisión de evidencia interna del centro penal.

Las autoridades no han confirmado detenciones adicionales relacionadas con el hecho hasta el cierre de esta información.`;

function analizar(contenido, titulo) {
  const texto = contenido.toLowerCase();
  const palabras = (contenido.match(/\b\w+\b/g) || []).length;
  
  const citas = (contenido.match(/"[^"]+"/g) || []).length;
  const fuentes = (contenido.match(/(indicó|señaló|afirmó|declaró|confirmó|dijo|manifestó|expresó|precisó|detalló|explicó|aseguró|mencionó|destacó|subrayó|recordó|advirtió|anunció|informó|reportó|explicó)\s+(que|el|la|a|sobre|a\s+los|en)/gi) || []).length;
  const edades = (contenido.match(/\b\d{1,2}\s*años\b/gi) || []).length;
  const horas = (contenido.match(/\b\d{1,2}:\d{2}\b/g) || []).length;
  const fechas = (contenido.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;
  const kilometros = (contenido.match(/\b\d+\s*km\b/gi) || []).length;
  const cantidades = (contenido.match(/\b\d+\s+(personas|heridos|muertos|fallecidos|detenidos|kilos|libras|metros|viviendas|policías|agentes|vehículos)\b/gi) || []).length;
  
  const datosConcretos = edades + horas + fechas + kilometros + cantidades;
  const densidad = palabras > 0 ? (datosConcretos / palabras * 100).toFixed(1) : 0;
  
  let score = 0;
  if (palabras >= 500) score += 20; else if (palabras >= 350) score += 10;
  if (densidad >= 5.0) score += 20; else if (densidad >= 3.0) score += 10;
  if (fuentes > 0) score += 15;
  if (citas > 0) score += 15;
  score += 10; // contexto local
  score += 10; // variación
  score += 10; // transiciones
  
  let nivel = '🔴 PELIGRO';
  if (score >= 70) nivel = '🟢 ORO';
  else if (score >= 50) nivel = '🟡 BRONCE';
  
  return { palabras, densidad: parseFloat(densidad), citas, fuentes, datosConcretos, score, nivel };
}

const a1 = analizar(c1, 'Noticia 1');
const a2 = analizar(c2, 'Noticia 2');

console.log('=== NOTICIA 1: Ataque San José ===');
console.log('Palabras:', a1.palabras);
console.log('Densidad:', a1.densidad);
console.log('Fuentes:', a1.fuentes);
console.log('Citas:', a1.citas);
console.log('Datos concretos:', a1.datosConcretos);
console.log('Score:', a1.score, a1.nivel);
console.log('');
console.log('=== NOTICIA 2: Puntarenas ===');
console.log('Palabras:', a2.palabras);
console.log('Densidad:', a2.densidad);
console.log('Fuentes:', a2.fuentes);
console.log('Citas:', a2.citas);
console.log('Datos concretos:', a2.datosConcretos);
console.log('Score:', a2.score, a2.nivel);
console.log('');
console.log('=== DIAGNÓSTICO ===');
console.log('Noticia 1 - Faltan:', 50 - a1.score, 'pts para BRONCE');
console.log('Noticia 2 - Faltan:', 50 - a2.score, 'pts para BRONCE');
