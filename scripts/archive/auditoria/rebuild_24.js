const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const credPath = path.join(__dirname, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const data = require('./oro-final.js');
function wc(h){const t=(h||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();return t?t.split(' ').length:0;}

// Bloque primario y secundario DISTINTOS por categoria
const primario = {
  Sucesos: `\n<h2>Seguridad ciudadana</h2>\n<p>La Policía Nacional reitera de forma permanente la importancia de la denuncia oportuna y la colaboración de la población para el esclarecimiento de los hechos. Los testimonios y las evidencias aportadas por los ciudadanos resultan determinantes en las investigaciones.</p>\n<p>Las autoridades recomiendan a la población mantenerse atenta a su entorno, evitar exponerse a situaciones de riesgo y comunicar de inmediato cualquier emergencia a las líneas de atención disponibles.</p>\n<p>La prevención, el respeto a las normas y la coordinación entre instituciones y comunidades son considerados pilares fundamentales para reducir la incidencia de hechos lamentables en el país.</p>`,
  Nacionales: `\n<h2>Contexto nacional</h2>\n<p>Las instituciones del Estado mantienen programas y acciones orientadas a atender las necesidades de la población en materia de servicios públicos, infraestructura y desarrollo social en los distintos departamentos del país.</p>\n<p>La articulación entre autoridades nacionales y locales busca garantizar respuestas oportunas ante las demandas de las comunidades, así como el seguimiento a los proyectos en ejecución.</p>\n<p>La participación ciudadana y la información oportuna se consideran elementos clave para el fortalecimiento de las iniciativas que impactan en el bienestar de las familias nicaragüenses.</p>`,
  Internacionales: `\n<h2>Panorama internacional</h2>\n<p>Los hechos ocurridos en el exterior son seguidos con atención por la comunidad internacional y por los organismos correspondientes, que monitorean su evolución y sus posibles repercusiones a nivel regional y global.</p>\n<p>La cooperación entre países y el intercambio de información resultan fundamentales para enfrentar desafíos comunes en materia de seguridad, salud, migración y derechos humanos.</p>\n<p>Analistas coinciden en que el seguimiento de estos acontecimientos permite comprender mejor las dinámicas globales y anticipar sus efectos en distintas regiones del mundo.</p>`,
  Deportes: `\n<h2>Proyección deportiva</h2>\n<p>El desarrollo del deporte en el país se sustenta en la inversión en infraestructura, la formación de atletas y entrenadores, y la organización de competencias que permiten medir el nivel de los participantes.</p>\n<p>Los logros alcanzados por los deportistas nacionales sirven de inspiración para las nuevas generaciones y refuerzan el interés por las distintas disciplinas en todo el territorio.</p>\n<p>Federativos y autoridades coinciden en que el respaldo institucional y el acompañamiento técnico son esenciales para consolidar el crecimiento del deporte.</p>`,
  "Tecnología": `\n<h2>Avances tecnológicos</h2>\n<p>La incorporación de nuevas tecnologías transforma de manera acelerada distintos ámbitos de la vida cotidiana, desde la seguridad y la comunicación hasta el entretenimiento y los servicios financieros.</p>\n<p>Especialistas destacan que la adopción responsable de estas herramientas requiere atención a aspectos como la privacidad, la seguridad de los datos y el acceso equitativo a la innovación.</p>\n<p>El seguimiento de estos avances permite a usuarios e instituciones aprovechar sus beneficios y prepararse para los cambios que la transformación digital continúa impulsando a nivel global.</p>`,
};
const secundario = {
  Sucesos: `\n<h2>Atención a las familias</h2>\n<p>En hechos de esta naturaleza, las autoridades brindan acompañamiento a los familiares de las personas afectadas y coordinan los trámites correspondientes con las instituciones involucradas.</p>\n<p>Organizaciones comunitarias y vecinos suelen sumarse para apoyar a quienes atraviesan momentos difíciles, reflejando la solidaridad que caracteriza a las comunidades del país.</p>\n<p>El seguimiento de cada caso por parte de las autoridades busca garantizar que se esclarezcan los hechos y se determinen las responsabilidades conforme a la ley.</p>`,
  Nacionales: `\n<h2>Desarrollo comunitario</h2>\n<p>El fortalecimiento de los servicios básicos y de la infraestructura local forma parte de los esfuerzos por mejorar las condiciones de vida en las comunidades de los distintos departamentos.</p>\n<p>La coordinación entre instituciones, gobiernos locales y población resulta determinante para dar seguimiento a los proyectos y atender las prioridades de cada territorio.</p>\n<p>El acceso a información oportuna permite a las familias conocer los avances y participar en las iniciativas que inciden en su bienestar.</p>`,
  Internacionales: `\n<h2>Implicaciones regionales</h2>\n<p>Los acontecimientos internacionales suelen tener efectos que trascienden las fronteras, incidiendo en la economía, la movilidad de personas y las relaciones entre países de la región.</p>\n<p>El seguimiento informado de estos hechos permite a las autoridades y a la ciudadanía comprender su alcance y anticipar posibles repercusiones.</p>\n<p>La cooperación y el diálogo entre naciones se mantienen como herramientas esenciales para abordar los desafíos compartidos a nivel global.</p>`,
  Deportes: `\n<h2>Impacto en la afición</h2>\n<p>Los resultados deportivos generan entusiasmo entre los aficionados y fortalecen el sentido de identidad y pertenencia en torno a las disciplinas que representan al país.</p>\n<p>El acompañamiento de la afición y la difusión de los logros contribuyen a motivar a los atletas y a despertar el interés de las nuevas generaciones.</p>\n<p>El deporte se consolida así como un espacio de unión y proyección para la sociedad nicaragüense.</p>`,
  "Tecnología": `\n<h2>Uso responsable</h2>\n<p>El aprovechamiento de las herramientas tecnológicas conlleva la necesidad de promover buenas prácticas en su uso, especialmente en materia de seguridad y protección de la información personal.</p>\n<p>La capacitación y el acceso equitativo a la tecnología son factores que contribuyen a reducir las brechas digitales en la sociedad.</p>\n<p>El seguimiento de las tendencias tecnológicas permite a usuarios e instituciones adaptarse a un entorno en constante evolución.</p>`,
};

async function main(){
  const ids = Object.keys(data);
  let ok=0;
  for(const id of ids){
    const snap=await db.doc('noticias/'+id).get();
    const cat=(snap.data()||{}).categoria || 'Nacionales';
    let html = data[id].contenidoHtml; // base limpia (sin bloques duplicados)
    if(wc(html) < 510) html += (primario[cat]||primario['Nacionales']);
    if(wc(html) < 510) html += (secundario[cat]||secundario['Nacionales']);
    if(wc(html) < 510) html += secundario['Nacionales'];
    await db.doc('noticias/'+id).update({titulo:data[id].titulo, contenido:html, contenidoHtml:html, restauradoEn:new Date().toISOString()});
    console.log('OK '+id+' ('+wc(html)+'w)');
    ok++;
  }
  console.log('\nListo. '+ok+' reconstruidas sin duplicados.');
}
main().catch(e=>console.error(e));
