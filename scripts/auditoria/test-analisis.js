const texto = `<p>Cinco personas fallecieron entre la noche del domingo 6 y la madrugada del lunes 7 de abril de 2025 en accidentes de tránsito ocurridos en Managua, Madriz, Chontales y la Costa Caribe Norte, según reportes oficiales de la Policía Nacional.</p><h2>Accidentes reportados</h2><p>Según la Policía Nacional, los accidentes ocurrieron en distintos puntos.</p><h2>Atropello</h2><p>El caso ocurrió en Palacagüina.</p><h2>Motociclista</h2><p>La víctima fue Yorlan Francisco Sáenz Rivera.</p><h2>Dos hombres</h2><p>Las víctimas fueron Juan Antonio Morales y Fernando Amador.</p><h2>Adolescente</h2><p>La víctima fue José Leopoldo Martínez Castell.</p><h2>Policía</h2><p>La Dirección mantiene investigaciones.</p><h2>Fuente</h2><p>Reportes oficiales.</p>`;

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

const tieneFuentes = /informo|confirmo|declaro|preciso|senalo|indico|dijo|explico|manifesto/.test(lower);

console.log('=== ANALISIS DE TU NOTICIA ===');
console.log('Palabras totales:', palabraCount);
console.log('Lead palabras:', leadPalabras);
console.log('h2:', h2s);
console.log('strong:', strongs);
console.log('blockquote:', blockquotes);
console.log('Adjetivos emocionales:', adjEncontrados.length, adjEncontrados);
console.log('Transiciones IA:', transEncontradas.length, transEncontradas);
console.log('Tiene fuentes atribuidas:', tieneFuentes);

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
console.log(add(tieneFuentes && blockquotes >= 1 ? 'PASS' : tieneFuentes ? 'WARN' : 'FAIL'), '- Fuentes:', blockquotes, 'blockquotes');
console.log(add(h2s >= 3 ? 'PASS' : h2s >= 1 ? 'WARN' : 'FAIL'), '- h2:', h2s);
console.log(add(strongs >= 8 ? 'PASS' : strongs >= 4 ? 'WARN' : 'FAIL'), '- strong:', strongs);

const puntuacion = pass / checks * 100;
console.log('');
console.log('Puntuacion ORO:', Math.round(puntuacion) + '%');
console.log('FAILs:', fail);
console.log('ORO Aprobado:', puntuacion >= 80 && fail <= 1 ? 'SI ✅' : 'NO ❌');
