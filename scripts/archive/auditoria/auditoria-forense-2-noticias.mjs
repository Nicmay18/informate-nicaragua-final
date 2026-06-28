function validar8Criterios(n) {
  const texto = n.contenido || '';
  const palabras = texto.trim().split(/\s+/).filter(w => w.length > 0).length;
  const parrafos = texto.split(/\n+/).filter(p => p.trim().length > 20);
  const lead = parrafos[0] || '';
  const palabrasLead = lead.trim().split(/\s+/).filter(w => w.length > 0).length;
  const tieneH2 = /<h2[^>]*>/i.test(texto);
  const tieneStrong = /<strong>/i.test(texto) || /<b>/i.test(texto);
  const tieneDatos = /\d/.test(texto);
  const citas = (texto.match(/["\u201c][^"\u201d]{8,}["\u201d]/g) || []).length;
  const atribuciones = /dijo|indic[oó]|manifest[oó]|declar[oó]|confirm[oó]|precis[oó]|explic[oó]|señal[oó]/i.test(texto);
  const blockquotes = (texto.match(/<blockquote>/g) || []).length;
  const passCitas = citas >= 1 || atribuciones || blockquotes >= 1;
  const tituloOK = (n.titulo || '').length >= 50 && (n.titulo || '').length <= 70;
  const metaOK = (n.resumen || '').length >= 150 && (n.resumen || '').length <= 170;
  const tieneImagen = n.imagenDestacada && n.imagenDestacada.length > 5;

  const checks = [
    { nombre: 'Contenido ≥500 palabras', ok: palabras >= 500, valor: palabras },
    { nombre: 'Lead ≥35 palabras', ok: palabrasLead >= 35, valor: palabrasLead },
    { nombre: 'H2', ok: tieneH2, valor: tieneH2 ? 'Sí' : 'No' },
    { nombre: 'Strong / datos', ok: tieneStrong || tieneDatos, valor: (tieneStrong ? 'strong ' : '') + (tieneDatos ? 'datos' : '') },
    { nombre: 'Citas / atribución', ok: passCitas, valor: 'citas=' + citas + ' atrib=' + atribuciones + ' bq=' + blockquotes },
    { nombre: 'Título 50-70 chars', ok: tituloOK, valor: (n.titulo || '').length },
    { nombre: 'Meta 150-170 chars', ok: metaOK, valor: (n.resumen || '').length },
    { nombre: 'Imagen destacada', ok: tieneImagen, valor: tieneImagen ? 'Sí' : 'No' },
  ];

  const aprobados = checks.filter(c => c.ok).length;
  const nivel = aprobados >= 7 ? 'ORO' : (aprobados >= 5 ? 'PLATA' : 'BRONCE');
  return { nivel, aprobados, checks };
}

const noticias = [
  {
    id: 'guarda-seguridad',
    titulo: 'Guarda de seguridad fallece en complejo fabril de Managua',
    slug: 'guarda-de-seguridad-fallece-en-complejo-fabril-de-managua',
    contenido: `La Policía Nacional realiza las investigaciones para determinar las causas de un accidente de tránsito en una empresa ubicada en la Carretera Norte que dejó como saldo el fallecimiento de un guarda de seguridad identificado como Carlos Manuel Cruz Cruz.

El hecho ocurrido dentro de las instalaciones de la empresa involucra a Cristian Antonio Álvarez García, conductor de una rastra que, según versiones de familiares, se dirigía hacia Masaya.

Alí Antonio Álvarez, padre del conductor, expresó que el hecho ocurrió a las 6:30 de la mañana y que aún no se explica cómo sucedió esta tragedia, ya que su hijo se encontraba saliendo de las instalaciones de la empresa, donde la velocidad máxima permitida es de 10 kilómetros por hora, según el protocolo interno.

«A mí me llamó mi hijo y me dijo lo que había sucedido. Yo estaba dormido, pero él me dijo que ya venía saliendo. Venía cargado, es un furgón. Él tiene entre tres y cuatro años trabajando en esta empresa. Mi hijo iba saliendo y, según lo que nos dijeron, todavía están las investigaciones. Cuando me llamó, me dijo que no supo cómo ocurrió, que fue hasta que lo contactaron que le informaron sobre el accidente», expresó.

Antonio destacó que su hijo, de 41 años de edad, tiene más de 14 años de experiencia conduciendo vehículos de carga pesada, cuenta con licencia profesional y es la primera vez que se ve involucrado en una tragedia de esta naturaleza.

El hecho, ocurrido en el barrio José Dolores Estrada, Distrito VI de Managua, ha causado consternación entre los trabajadores de la empresa.

Algunos testigos expresaron fuera de cámara que el conductor de la rastra ya había avanzado aproximadamente 300 metros del lugar cuando lo llamaron para pedirle que detuviera su marcha e informarle sobre la tragedia que hoy enluta a una familia capitalina.

El tráfico dentro de las instalaciones está estrictamente regulado. Los conductores deben respetar la velocidad máxima de 10 km/h, utilizar obligatoriamente el cinturón de seguridad y mantener los vehículos en óptimas condiciones.

Para garantizar la seguridad y cumplir con su sistema de gestión, el protocolo exige que todo vehículo se detenga por completo al ingresar por las áreas de seguridad o centros de distribución.

La Policía Nacional continúa las investigaciones, mientras que el cuerpo del fallecido fue trasladado al Instituto de Medicina Legal.`,
    resumen: 'Un guarda de seguridad identificado como Carlos Manuel Cruz Cruz falleció en un accidente laboral dentro de una empresa ubicada en la Carretera Norte de Managua.',
    imagenDestacada: 'https://www.tn8.ni/wp-content/uploads/2026/06/guarda-seguridad-accidente-carretera-norte.jpg'
  },
  {
    id: 'captura-masaya',
    titulo: 'Capturan a tres sospechosos por homicidio de vigilante en Masaya',
    slug: 'capturan-a-tres-sospechosos-por-homicidio-de-vigilante-en-masaya',
    contenido: `En un operativo calificado como exitoso, oficiales de la Policía lograron la captura de cuatro hombres vinculados al homicidio de Rolando Javier Muñoz Vargas, de 49 años, quién se desempeñaba como guarda de seguridad.

El crimen ocurrió la madrugada del pasado 10 de abril. Según el informe oficial, a la 1:51 a.m., cuatro sujetos arribaron a bordo de dos motocicletas a las instalaciones de una empresa que vende pinturas, ubicada en el kilómetro 36.5 de la carretera que conduce de Masaya a Tipitapa, en la comarca Guanacastillo. Los delincuentes, motivados por el robo, interceptaron a Muñoz Vargas y le dispararon a quemarropa en el tórax. Tras herirlo de muerte, los sujetos sustrajeron el arma de reglamento de la víctima y huyeron del lugar con rumbo desconocido.

A las 2:15 a.m., las autoridades fueron alertadas sobre el hallazgo del cuerpo. Peritos del Instituto de Medicina Legal examinaron los restos de Muñoz Vargas y determinaron que la causa directa de su fallecimiento fue un shock hipovolémico, provocado por las heridas de proyectil de arma de fuego.

Tras un rápido proceso de investigación y seguimiento, las fuerzas policiales lograron identificar y capturar a los presuntos responsables: Carlos Alberto Gómez Hernández, de 33 años, Jairo Antonio Cano Matamoros, de 29, Leonardo José Sequeira Rugama, de 27 y a Orlando José Orozco Urbina, de 25.

Durante el arresto, la Policía ocupó un revólver con ocho municiones y las dos motocicletas presuntamente utilizadas para perpetrar el asalto y posterior asesinato. Los detenidos y las pruebas recolectadas serán remitidos a las autoridades competentes para enfrentar cargos por asesinato y robo con intimidación.`,
    resumen: 'La Policía Nacional capturó a cuatro hombres vinculados al homicidio de Rolando Javier Muñoz Vargas, guarda de seguridad asesinado en una empresa de pinturas en Masaya.',
    imagenDestacada: 'https://www.canal10.com.ni/wp-content/uploads/2026/04/captura-homicidio-vigilante-masaya.jpg'
  }
];

console.log('══════════════════════════════════════════════════════════════════');
console.log('  AUDITORÍA FORENSE — 2 NOTICIAS RECONSTRUIDAS');
console.log('══════════════════════════════════════════════════════════════════\n');

for (const n of noticias) {
  const v = validar8Criterios(n);
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ ' + n.titulo.substring(0, 63).padEnd(63) + ' │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  console.log('│ Slug: ' + n.slug.substring(0, 55).padEnd(55) + ' │');
  for (const c of v.checks) {
    const icon = c.ok ? '✅' : '❌';
    console.log('│ ' + icon + ' ' + c.nombre.padEnd(28) + ' ' + String(c.valor).padStart(25) + ' │');
  }
  console.log('├─────────────────────────────────────────────────────────────────┤');
  const nivelStr = 'NIVEL: ' + v.nivel + ' (' + v.aprobados + '/8)';
  console.log('│ ' + (v.nivel === 'ORO' ? '🟠 ' : (v.nivel === 'PLATA' ? '⚪ ' : '🟤 ')) + nivelStr.padEnd(61) + '│');
  console.log('└─────────────────────────────────────────────────────────────────┘\n');
}

process.exit(0);
