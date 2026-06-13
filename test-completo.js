const texto = `<p>Cinco personas fallecieron entre la noche del domingo 6 y la madrugada del lunes 7 de abril de 2025 en accidentes de tránsito ocurridos en Managua, Madriz, Chontales y la Costa Caribe Norte, según reportes oficiales de la Policía Nacional.</p>

<h2>Accidentes reportados este 7 de abril en Nicaragua</h2>
<p>Según la Policía Nacional, los accidentes ocurrieron en distintos puntos de la red vial nacional y dejaron cinco víctimas mortales en menos de 24 horas.</p>
<p>De acuerdo con reportes oficiales, cuatro de los fallecidos se movilizaban en motocicleta como conductores o pasajeros, mientras una de las víctimas murió tras ser atropellada por un vehículo.</p>
<p>Las autoridades mantienen abiertas las investigaciones para determinar las circunstancias de cada accidente de tránsito y establecer posibles responsabilidades.</p>

<h2>Atropello deja un fallecido en Palacagüina</h2>
<p>El caso más reciente ocurrió a las 03:30 horas del lunes 7 de abril en el kilómetro 190 de la carretera Panamericana, en la comunidad Ducualí, municipio de Palacagüina, departamento de Madriz.</p>
<p>Según la Policía Nacional, la víctima era un agricultor de 34 años que regresaba a pie desde Condega, Estelí, cuando fue impactado presuntamente por un vehículo.</p>
<p>El informe policial indica que el conductor involucrado abandonó el lugar después del accidente.</p>
<p>Las autoridades informaron que se realizan diligencias de investigación y entrevistas para identificar al responsable del hecho ocurrido en esta carretera del norte del país.</p>

<h2>Motociclista fallece en Villa El Carmen</h2>
<p>Otro accidente mortal se registró a las 17:30 horas del domingo 6 de abril en el kilómetro 27 de la carretera vieja a León, en la entrada a la comarca Monte Fresco, municipio de Villa El Carmen, Managua.</p>
<p>La víctima fue identificada como Yorlan Francisco Sáenz Rivera, de 27 años.</p>
<p>De acuerdo con el reporte de la Policía de Tránsito, el conductor de la motocicleta realizó una maniobra de adelantamiento e invadió el carril contrario, impactando contra otra motocicleta que circulaba en sentido opuesto.</p>
<p>Según las autoridades, los ocupantes del segundo vehículo resultaron lesionados y fueron trasladados al Hospital Alemán Nicaragüense para recibir atención médica.</p>
<p>La investigación continúa para determinar todos los factores relacionados con este accidente de tránsito.</p>

<h2>Dos hombres fallecen en accidente de motocicleta en El Ayote</h2>
<p>En Chontales, dos personas murieron la noche del domingo 6 de abril en un accidente registrado en la localidad de El Ayote.</p>
<p>Las víctimas fueron identificadas como Juan Antonio Morales Rocha, de 34 años, y Fernando Amador Marín, de 41 años.</p>
<p>Según información recopilada por las autoridades, ambos viajaban en motocicleta cuando perdieron el control del vehículo y se estrellaron contra un cerco.</p>
<p>El reporte policial señala que las lesiones sufridas durante el impacto provocaron la muerte de ambos ocupantes.</p>
<p>La Policía Nacional indicó que continúa recopilando información para establecer las causas de este siniestro vial.</p>

<h2>Adolescente fallece en la Costa Caribe Norte</h2>
<p>La quinta víctima fue José Leopoldo Martínez Castell, de 17 años, quien falleció en un accidente de tránsito ocurrido en la Costa Caribe Norte.</p>
<p>Según el reporte oficial de la Policía Nacional, el adolescente viajaba como pasajero en una motocicleta cuando el conductor perdió el control del vehículo en una curva.</p>
<p>Ambos ocupantes cayeron a un costado de la carretera. Martínez Castell falleció debido a las lesiones sufridas durante el accidente.</p>
<p>Las autoridades informaron que el conductor resultó lesionado y fue trasladado a un centro asistencial para recibir atención médica.</p>
<p>La investigación busca determinar si factores relacionados con la vía o las condiciones de circulación influyeron en el hecho.</p>

<h2>Policía mantiene investigaciones abiertas</h2>
<p>La Dirección de Seguridad de Tránsito Nacional mantiene abiertas las investigaciones relacionadas con los accidentes registrados en Managua, Madriz, Chontales y la Costa Caribe Norte.</p>
<p>Según datos oficiales divulgados por la institución, los informes preliminares permiten establecer las circunstancias iniciales de cada caso, aunque las pesquisas continúan.</p>
<p>Las autoridades reiteraron el llamado a conductores, pasajeros y usuarios de motocicleta a respetar las normas de tránsito, utilizar medidas de seguridad vial y mantener la precaución en carretera.</p>

<h2>Fuente oficial de la información</h2>
<p>La información contenida en esta nota fue elaborada con base en reportes oficiales de la Dirección de Seguridad de Tránsito Nacional divulgados por la Policía Nacional el 7 de abril de 2025.</p>
<p>Según la institución, los datos corresponden a hechos ocurridos en Managua, Madriz, Chontales y la Costa Caribe Norte durante las últimas 24 horas.</p>
<p>Fuente documental: Reportes oficiales de la Dirección de Seguridad de Tránsito Nacional divulgados por la Policía Nacional el 7 de abril de 2025.</p>`;

const textoPlano = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const palabras = textoPlano.split(' ').filter(p => p.length > 0);
const palabraCount = palabras.length;

const primerParrafo = texto.match(/<p>(.*?)<\/p>/)?.[1] || '';
const leadPalabras = primerParrafo.replace(/<[^>]*>/g, '').split(' ').filter(p => p.length > 0).length;

const h2s = (texto.match(/<h2>/gi) || []).length;
const strongs = (texto.match(/<strong>/gi) || []).length;
const blockquotes = (texto.match(/<blockquote>/g) || []).length;

const ADJ = ['tragico','terrible','impactante','conmociono','devastador','horrible','alarmante','desgarrador','lamentable','dramatico','critico','escalofriante','espeluznante','increible','inimaginable','indignante','escandaloso','vergonzoso','aterrador','mortifero','sangriento','brutal','salvaje','violento','agresivo','tragedia','fatal','horror','impactante','desgarrador'];
const lower = textoPlano.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const adjEncontrados = ADJ.filter(adj => lower.includes(adj));

const TRANS = ['en conclusion','es importante destacar','vale la pena mencionar','no hay que olvidar','en el contexto de','desde esta perspectiva','en ultima instancia','a fin de cuentas','en el marco de','resulta fundamental','resulta evidente','no cabe duda','es indiscutible','resulta innegable','en resumen','en definitiva','para concluir','como se menciono anteriormente','es relevante senalar','no se puede ignorar','es crucial','es vital','a su vez'];
const transEncontradas = TRANS.filter(t => lower.includes(t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));

// Regex actual del validador
const tieneFuentesOld = /informo|confirmo|declaro|preciso|senalo|indico|dijo|explico|manifesto/.test(lower);
// Regex mejorado
const tieneFuentesNew = /informo|confirmo|declaro|preciso|senalo|indico|dijo|explico|manifesto|reporte|segun|de acuerdo con|segun datos|fuente/.test(lower);

console.log('=== ANALISIS NOTICIA COMPLETA ===');
console.log('Palabras totales:', palabraCount);
console.log('Lead palabras:', leadPalabras);
console.log('h2:', h2s);
console.log('strong:', strongs);
console.log('blockquote:', blockquotes);
console.log('Adjetivos emocionales:', adjEncontrados.length);
console.log('Transiciones IA:', transEncontradas.length);
console.log('Fuentes (regex actual):', tieneFuentesOld);
console.log('Fuentes (regex mejorado):', tieneFuentesNew);

let checks = 0;
let pass = 0;
let warn = 0;
let fail = 0;

function add(estado) { checks++; if(estado==='PASS')pass++; else if(estado==='WARN')warn++; else fail++; return estado; }

console.log('');
console.log(add(palabraCount >= 500 ? 'PASS' : palabraCount >= 350 ? 'WARN' : 'FAIL'), '- Extension:', palabraCount, 'palabras');
console.log(add(leadPalabras >= 35 && leadPalabras <= 50 ? 'PASS' : leadPalabras >= 25 ? 'WARN' : 'FAIL'), '- Lead:', leadPalabras, 'palabras');
console.log(add(adjEncontrados.length <= 2 ? 'PASS' : 'WARN'), '- Relleno emocional:', adjEncontrados.length);
console.log(add(transEncontradas.length <= 2 ? 'PASS' : 'WARN'), '- Transiciones IA:', transEncontradas.length);
console.log(add(tieneFuentesNew && blockquotes >= 1 ? 'PASS' : tieneFuentesNew ? 'WARN' : 'FAIL'), '- Fuentes:', blockquotes, 'blockquotes (con regex mejorado)');
console.log(add(h2s >= 3 ? 'PASS' : h2s >= 1 ? 'WARN' : 'FAIL'), '- h2:', h2s);
console.log(add(strongs >= 1 ? 'PASS' : 'WARN'), '- strong:', strongs);

const puntuacion = pass / checks * 100;
console.log('');
console.log('Puntuacion ORO:', Math.round(puntuacion) + '%');
console.log('FAILs:', fail);
console.log('ORO Aprobado:', puntuacion >= 70 && fail === 0 ? 'SI ✅' : 'NO ❌');
