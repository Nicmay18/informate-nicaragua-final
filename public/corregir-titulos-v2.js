/**
 * SCRIPT QUIRÚRGICO FORENSE v2 — Corrección masiva de títulos y slugs
 * Usa Firebase directamente (no depende de getNoticiasCache)
 * 
 * Cómo usar:
 * 1. Estar en el panel admin (panel.html)
 * 2. F12 → Console
 * 3. Pegar todo este script
 * 4. Ejecutar: await corregirTitulosMasivo()
 */

const REGLAS_QUIRURGICAS = [
  [/\bAutoridades investigan incidente (de tránsito )?en\b/gi, ''],
  [/\bPolicía investiga incidente (de tránsito )?en\b/gi, ''],
  [/\bPolicía investiga hallazgo en\b/gi, ''],
  [/\bPolicía atiende incidente (de tránsito )?en\b/gi, ''],
  [/\bPolicía busca a conductor involucrado en incidente en\b/gi, ''],
  [/\bFiscalía investiga deceso de recluso en\b/gi, ''],
  [/\bMINSA reporta incidente médico en\b/gi, ''],
  [/\bMINSA reporta tercer caso por picaduras de insectos en\b/gi, 'Tercera víctima por picaduras de abejas en'],
  [/\bMINSA evalúa situación de salud en evento en\b/gi, ''],
  [/\bAutoridades reportan incidentes viales en\b/gi, ''],
  [/\bAutoridades investigan incidente laboral en\b/gi, ''],
  [/\bPolicía investiga incidente vial en\b/gi, ''],
  [/\bPolicía investiga incidente en\b/gi, ''],
  [/\bPolicía reporta incidentes viales con funcionarios( en servicio)?/gi, ''],
  [/\bConsulado gestiona caso de connacional( en)?/gi, ''],
  [/\bConsulado asiste a (nicaragüense|familia nicaragüense) tras/gi, ''],
  [/\bConsulado entrega cuerpo de nicaragüense fallecido en/gi, ''],
  [/\bFamilia nicaragüense gestiona repatriación desde/gi, ''],
  [/\bFamilia busca a joven desaparecido en/gi, ''],
  [/\bCosta Rica investiga muerte de nicaragüense en/gi, ''],
  [/\bPolicía costarricense investiga caso de violencia/gi, 'Sicarios asesinan a padre e hijo en Puntarenas, Costa Rica'],
  [/\bPolicía guatemalteca reporta detención de nicaragüense/gi, ''],
  [/\bJuzgado dicta sentencia por accidente en/gi, ''],
  [/\bInvestigan muerte de mujer en bus de la ruta/gi, ''],
  [/\bInvestigan fallecimiento de hombre en establecimiento de/gi, ''],
  [/\bInvestigan accidentes de moto ocurridos este/gi, ''],
  [/\bInvestigan muerte de motociclista en/gi, ''],
  [/\bHallazgo en .+ activa investigación policial/gi, ''],
  [/\bHallazgo de cuerpo en .+ activa investigación fiscal/gi, ''],
  [/\bHallazgo de cuerpo sin vida en/gi, 'Hallan cuerpo en'],
  [/\bCapturan a señalado por/gi, 'Capturan a sujeto por'],
  [/\bDetienen a nicaragüenses con droga en aguas de/gi, ''],
  [/\bDos fallecidos en accidentes ocurridos en/gi, ''],
  [/\bDos fallecidos tras naufragio de panga en/gi, 'Dos mueren tras naufragio de panga en'],
  [/\bDos hombres mueren en hechos violentos en/gi, ''],
  [/\bDos jóvenes mueren asfixiados en pozo en/gi, 'Dos jóvenes mueren asfixiados en pozo de'],
  [/\bDos mueren por presuntos problemas de salud en/gi, 'Dos mueren por problemas de salud en'],
  [/\bDos nicaragüenses fallecen en accidentes ocurridos en/gi, 'Dos nicaragüenses mueren en accidentes en'],
  [/\bTres ataques de pitbull en Nicaragua dejan tres lesionados/gi, 'Tres ataques de pitbull dejan lesionados en Nicaragua'],
  [/\bTres fallecidos y un lesionado grave en accidentes viales/gi, ''],
  [/\bTres muertos y un lesionado en accidentes de tránsito/gi, 'Tres muertos y un herido en accidentes de tránsito en Nicaragua'],
  [/\bUn muerto y un herido en accidentes laborales en/gi, ''],
  [/\bVilla .+: Reporte técnico de accidente doméstico/gi, ''],
  [/\bEsparza: Análisis del ataque armado con fusiles de guerra/gi, 'Ataque con fusiles de guerra en Esparza deja múltiples heridos'],
  [/\bBoaco: Informe técnico sobre accidente vial en/gi, ''],
  [/\bMatagalpa: Investigan muerte de vigilante en/gi, ''],
  [/\bMasaya: Análisis del fatal accidente vial en/gi, ''],
  [/\bFiscalía pide hasta 25 mil años para líder de MS-13/gi, 'Fiscalía pide cadena perpetua para líder de MS-13'],
  [/\bNicaragua se alista para un 2026 con retos en béisbol internacional/gi, 'Béisbol internacional: Nicaragua se alista para retos de 2026'],
  [/\bNicaragua: El evento de IA que revolucionará Nicaragua y Hackathon impulsará la innovación/gi, 'Evento de IA y Hackathon buscan revolucionar innovación en Nicaragua'],
  [/\bHospital Bertha Calderón ejecuta con éxito una nueva cirugía fetal/gi, 'Hospital Bertha Calderón ejecuta con éxito cirugía fetal en Managua'],
  [/\bShakira hace historia con megaconcierto en Copacabana/gi, 'Shakira reúne a dos millones en concierto histórico en Copacabana'],
  [/\bSony Music adquiere catálogo de Shakira y Beyoncé por cifra récord/gi, 'Sony Music compra catálogo de Shakira y Beyoncé'],
  [/\bAcademia de Hollywood limita uso de IA en películas para los Óscar/gi, 'Academia regula la IA y reforma reglas para los Óscar'],
  [/\bNetflix prepara precuela de The Crown sobre el origen de los Windsor/gi, 'Netflix anuncia precuela de The Crown sobre familia real británica'],
  [/\bJannik Sinner tras baja de Alcaraz: "El tenis necesita a Carlos"/gi, 'Jannik Sinner tras baja de Alcaraz: el tenis necesita a Carlos'],
  [/\bTaylor Swift busca registrar su voz como marca ante el auge de la IA/gi, 'Taylor Swift busca registrar su voz como marca ante la IA'],
  [/\bToy Story 5 llegará a Nicaragua con Woody y Buzz en la era digital/gi, 'Toy Story 5 llega a Nicaragua con Woody y Buzz en la era digital'],
  [/\bWindows 11 ahora se instala más rápido tras cambio de Microsoft/gi, 'Windows 11 acelera su instalación en computadoras en Nicaragua'],
  [/\bMicrosoft corrige fallo de seguridad en navegador Edge/gi, 'Microsoft corrige vulnerabilidad en navegador Edge para usuarios en Nicaragua'],
  [/\bSamsung prepara revolución: Baterías de silicio-carbón para el Galaxy S27/gi, 'Samsung presenta baterías de silicio-carbón para el Galaxy S27'],
  [/\bCanadá reporta caso de virus por roedores en Columbia Británica/gi, 'Canadá confirma caso de hantavirus ligado a crucero MV Hondius'],
  [/\bDescubren dinosaurio gigante en Asia: pesaba como nueve elefantes/gi, 'Descubren dinosaurio gigante en Asia: pesaba 9 elefantes'],
  [/\bCohete New Glenn de Blue Origin explota en prueba en Cabo Cañaveral/gi, 'Cohete New Glenn de Blue Origin explota en Cabo Cañaveral'],
  [/\bTemporada de huracanes del Pacífico 2026 inicia con calma aparente/gi, 'Temporada de huracanes del Pacífico 2026 inicia con calma'],
  [/\bTurismo en Nicaragua crece 11% en primer trimestre de 2026 según INTUR/gi, 'Turismo en Nicaragua crece 11% en primer trimestre de 2026'],
  [/\bKFC Nicaragua 2026: Apertura en Managua, menú y precios confirmados/gi, 'KFC abre en Managua: menú, precios y horarios confirmados'],
  [/\bPolicía y Ejército incautan 502 kilos de cocaína en Wiwilí/gi, 'Incautan 502 kilos de cocaína en operativo en Wiwilí'],
  [/\bOperativo contra caponeras deja multas y unidades retenida en Catarina/gi, 'Operativo en Catarina deja multas y caponeras retenidas'],
  [/\bNicaragua recibe 278 mil turistas en primer trimestre de 2026; crecimiento del 11%/gi, 'Nicaragua recibe 278 mil turistas y crece 11% en primer trimestre'],
  [/\bJerónimo Sobalvarro Toruño, 73 años, muere tras caer con motociclet/gi, 'Jerónimo Sobalvarro muere tras caer de motocicleta en Managua'],
  [/\bPeatón de 58 años muere atropellado en el kilómetro 52 Carretera Norte/gi, 'Peatón muere atropellado en km 52 Carretera Norte'],
  [/\bJoven de 24 años muere tras descarga de 13 mil voltios en León/gi, 'Joven muere electrocutado con 13 mil voltios en León'],
  [/\bJoven de 28 años muere ahogado en playa Matilde, San Juan del Sur/gi, 'Joven muere ahogado en playa Matilde de San Juan del Sur'],
  [/\bNiño de 15 meses muere ahogado tras caer en cubeta en Mateare/gi, 'Bebé muere ahogado tras caer en cubeta de agua en Mateare'],
  [/\bEscolta de ULTRAVAL enfrenta juicio por robo de dinero en Managua/gi, 'Escolta de ULTRAVAL enfrenta juicio por robo en Managua'],
  [/\bConductor se fuga tras causar muerte de joven en La Ceiba, León/gi, 'Conductor huye tras atropello mortal en La Ceiba, León'],
  [/\bCuerpo es hallado tras caer en aguas del Río San Juan/gi, 'Hallan cuerpo en aguas del Río San Juan'],
  [/\bHallan cuerpo de mujer desaparecida en carretera León-Chinandega/gi, 'Hallan cuerpo de mujer en carretera León-Chinandega'],
  [/\bCosta Rica: investigan muerte de nicaragüense y buscan a sus familiare/gi, 'Costa Rica investiga muerte de nicaragüense en Heredia y busca familiares'],
  [/\bHallan cuerpo de anciano desaparecido en Las Jagüitas, Managua/gi, 'Hallan cuerpo de anciano desaparecido en Las Jagüitas'],
  [/\bCapturan a señalado por robo de más de US\$30 mil en Jalapa/gi, 'Capturan a sujeto por robo de US$30 mil en Jalapa'],
  [/\bDos nicaragüenses fallecen en accidentes ocurridos en Honduras y Miami/gi, 'Dos nicaragüenses mueren en accidentes en Honduras y Miami'],
  [/\bMédico y dos personas detenidos por muerte de joven tras cirugía\./gi, 'Médico y dos detenidos por muerte de joven tras cirugía'],
  [/\bPrograma Nuevas Victorias entregará 85 viviendas en Nagarote/gi, '85 viviendas de Nuevas Victorias se entregarán en Nagarote'],
  [/\bNicaragüense de 49 años fallece tras accidente vial en North Miami FL/gi, 'Nicaragüense de 49 años muere tras accidente vial en North Miami'],
  [/\bBéisbol sigue siendo el deporte favorito de los nicaragüenses en 2026/gi, 'Béisbol sigue siendo deporte favorito de nicaragüenses en 2026'],
  [/\bAumentan casos de electrocución en accidentes laborales(?!.+Nicaragua)/gi, 'Aumentan casos de electrocución en accidentes laborales en Nicaragua'],
  [/\bClima extremo en Nicaragua: Tornado en Somotillo y granizo en Jinotepe/gi, 'Tornado en Somotillo y granizo en Jinotepe: clima extremo'],
  [/\bNicaragua suma 165 MW renovables y baterías eléctricas/gi, 'Nicaragua suma 165 MW de energía renovable y baterías eléctricas'],
  [/\bCosta Rica invita a Nicaragua a toma de posesión de Laura Fernández/gi, 'Costa Rica invita a Nicaragua a toma de posesión presidencial'],
  [/\bTecnología global: IA agéntica lidera cambios en 2026/gi, 'IA agéntica lidera cambios tecnológicos globales en 2026'],
  [/\bAustralia: 7 de cada 10 menores burlan prohibición de redes sociales/gi, 'Australia: el 70% de menores evade control en redes sociales'],
  [/\bDos personas mueren tras ser alcanzadas por rayos durante tormentas en Granada y Matagalpa/gi, 'Dos mueren tras ser alcanzados por rayos en Granada y Matagalpa'],
  [/\bConductor de caponera fallece mientras desayunaba en Managua/gi, 'Conductor de caponera muere mientras desayunaba en Managua'],
  [/\bAdolescente de 14 años muere al caer de camión en la Panamericana Sur/gi, 'Adolescente muere al caer de camión en carretera Panamericana'],
  [/\bPolicía investiga incidente en Ciudad Sandino/gi, 'Joven de 18 años muere tras trifulca en Ciudad Sandino'],
  [/\bPolicía busca a conductor involucrado en incidente en Rosita/gi, 'Conductor ebrio huye tras matar a pasajero en Rosita'],
  [/\bFiscalía investiga deceso de recluso en Matagalpa/gi, 'Femicida de Sébaco muere tras ingerir sustancia tóxica en reclusión'],
  [/\bAutoridades investigan incidente laboral en pozo de Madriz/gi, 'Obrero muere asfixiado dentro de pozo en Madriz'],
  [/\bOklahoma evalúa impacto de fenómenos climáticos recientes/gi, 'Tornados devastadores dejan heridos y daños en Oklahoma'],
  [/\bIncendio destruye negocio y deja pérdidas por C\$200 mil en Nindirí/gi, 'Incendio destruye negocio con pérdidas de C$200 mil en Nindirí'],
  [/\bCómo sacar y apostillar el récord policial de Nicaragua en 2026/gi, 'Cómo tramitar el récord policial en Nicaragua en 2026'],
  [/\bINETER: pronostican lluvias fuertes y tormentas eléctricas en Nicaragua este sábado/gi, 'INETER pronostica lluvias fuertes y tormentas eléctricas en Nicaragua'],
  [/\bAbril cierra con 70 fallecidos por accidentes de tránsito en Nicaragua/gi, 'Abril registra 70 muertos por accidentes de tránsito en Nicaragua'],
  [/\bAbril registra 70 accidentes de tránsito en Nicaragua/gi, 'Abril registra 70 muertos por accidentes de tránsito en Nicaragua'],
  [/\bMINSA reporta tercer caso por picaduras de insectos en Chontales/gi, 'Tercera víctima por picaduras de abejas en Chontales'],
  [/\bTragedia en barrio Cuba: caponero de 70 años fallece en su unidad/gi, 'Conductor de caponera muere mientras desayunaba en Managua'],
  [/\bIncendio en puesto del Mercado Oriental es controlado por bomberos/gi, 'Incendio destruye puesto de ropa en Mercado Oriental de Managua'],
  [/\bMicrosoft y Meta aceleran despidos masivos para financiar carrera por la IA/gi, 'Microsoft y Meta ajustan sus plantillas para acelerar la IA'],
  [/\bOpenAI mantiene alianza con Apple para integrar ChatGPT en dispositivos en Nicaragua/gi, 'OpenAI mantiene alianza con Apple para integrar ChatGPT en Nicaragua'],
  [/\bNeymar Jr\. analiza el panorama competitivo de cara al mundial 2026/gi, 'Neymar Jr. se prepara para el Mundial 2026 tras recuperación'],
  [/\bLuca Zidane recibe atención médica; evalúan su participación/gi, 'Luca Zidane recibe tratamiento médico; club evalúa recuperación'],
  [/\bLuka Modrić recibe atención médica; club evalúa recuperación/gi, 'Luka Modrić recibe tratamiento y club evalúa recuperación'],
  [/\bShakira lanza "Dai Dai", himno oficial del Mundial 2026/gi, 'Shakira lanza "Dai Dai", himno oficial del Mundial 2026'],
  [/\bTres muertos y un lesionado en accidentes de tránsito/gi, 'Tres muertos y un herido en accidentes de tránsito en Nicaragua'],
  [/\bCuatro nicaragüenses fallecen en Costa Rica, El Salvador y Estados Unidos en menos de una semana/gi, 'Cuatro nicaragüenses fallecen en Costa Rica, El Salvador y EE.UU.'],
  [/\b¡Histórico! Sebastián Sawe rompe la barrera de las 2 horas en maratón/gi, '¡Histórico! Sebastián Sawe rompe barrera de 2 horas en maratón'],
  [/\bMessi iguala récord histórico de 16 goles en Mundiales/gi, 'Messi iguala récord histórico de 16 goles en Mundiales'],
  [/\bMessi establece récord de 18 goles en Copas del Mundo/gi, 'Messi establece récord de 18 goles en Copas del Mundo'],
  [/\bTwo people die after being struck by lightning during storms in Granada and Matagalpa/gi, 'Two die after being struck by lightning in Granada and Matagalpa'],
  [/\bThree attacks by pitbull in Nicaragua leave three injured/gi, 'Three pitbull attacks leave injured in Nicaragua'],
];

function limpiarSlug(slug) {
  if (!slug) return slug;
  return slug.replace(/-[a-z0-9]{6,}$/i, '');
}

function aplicarReglas(titulo) {
  let resultado = titulo.trim();
  for (const [regex, reemplazo] of REGLAS_QUIRURGICAS) {
    if (regex.test(resultado)) {
      resultado = resultado.replace(regex, reemplazo);
      break;
    }
  }
  resultado = resultado.replace(/\s+/g, ' ').replace(/\.$/, '').trim();
  return resultado;
}

function esTituloGenerico(titulo) {
  const genericos = [
    /Autoridades investigan/i, /Policía investiga incidente/i,
    /Policía atiende incidente/i, /Policía busca a conductor/i,
    /Consulado gestiona caso/i, /MINSA reporta incidente/i,
    /MINSA evalúa situación/i, /Autoridades reportan incidentes/i,
    /Fiscalía investiga deceso/i, /Policía costarricense investiga/i,
    /Policía guatemalteca reporta/i,
  ];
  return genericos.some(r => r.test(titulo));
}

// ── OBTENER NOTICIAS CON FIREBASE DIRECTAMENTE ──
async function obtenerNoticiasFirebase() {
  // Usar las variables de Firebase del panel si están disponibles
  const { db, collection, query, orderBy, limit, getDocs } = window;
  if (!db) {
    throw new Error('Firebase no está inicializado. Asegurate de estar en panel.html');
  }
  const q = query(collection(db, 'noticias'), orderBy('fecha', 'desc'), limit(300));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => { arr.push({ id: d.id, ...d.data() }); });
  return arr;
}

// ── FUNCIÓN PRINCIPAL ──
async function corregirTitulosMasivo() {
  console.log('🔬 INICIANDO CORRECCIÓN QUIRÚRGICA FORENSE v2...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let noticias;
  try {
    noticias = await obtenerNoticiasFirebase();
  } catch (e) {
    console.error('❌ Error obteniendo noticias:', e.message);
    return;
  }

  console.log(`📊 Total de noticias a analizar: ${noticias.length}`);

  let corregidas = 0, slugsLimpiados = 0, yaCorrectas = 0;
  let cambios = [];

  for (const n of noticias) {
    const tituloOrig = n.titulo || '';
    const slugOrig = n.slug || '';
    
    const tituloNuevo = aplicarReglas(tituloOrig);
    const slugLimpio = limpiarSlug(slugOrig);
    
    const tituloCambiado = tituloNuevo !== tituloOrig;
    const slugCambiado = slugLimpio !== slugOrig;
    
    if (!tituloCambiado && !slugCambiado) {
      yaCorrectas++;
      continue;
    }

    cambios.push({
      id: n.id,
      tituloOrig, tituloNuevo: tituloCambiado ? tituloNuevo : null,
      charsNuevo: tituloCambiado ? tituloNuevo.length : null,
      slugOrig, slugNuevo: slugCambiado ? slugLimpio : null,
      generico: esTituloGenerico(tituloOrig),
    });
  }

  console.log(`\n📈 RESUMEN PRELIMINAR:`);
  console.log(`  ✅ Ya correctas: ${yaCorrectas}`);
  console.log(`  🔧 Necesitan corrección: ${cambios.length}`);
  console.log(`  📝 Títulos a corregir: ${cambios.filter(c => c.tituloNuevo).length}`);
  console.log(`  🔗 Slugs a limpiar: ${cambios.filter(c => c.slugNuevo).length}`);

  console.log('\n📋 CAMBIOS PROPUESTOS:');
  cambios.forEach((c, i) => {
    console.log(`\n[${i + 1}] ID: ${c.id}`);
    if (c.tituloNuevo) {
      console.log(`  ORIGINAL (${c.tituloOrig.length} chars): "${c.tituloOrig}"`);
      console.log(`  NUEVO    (${c.charsNuevo} chars): "${c.tituloNuevo}"`);
      if (c.generico) console.log(`  ⚠️  GENÉRICO DETECTADO`);
    }
    if (c.slugNuevo) {
      console.log(`  SLUG: ${c.slugOrig} → ${c.slugNuevo}`);
    }
  });

  const confirmar = confirm(
    `Se encontraron ${cambios.length} noticias que necesitan corrección.\n\n` +
    `Títulos: ${cambios.filter(c => c.tituloNuevo).length}\n` +
    `Slugs: ${cambios.filter(c => c.slugNuevo).length}\n\n` +
    `¿Aplicar TODOS los cambios ahora?`
  );

  if (!confirmar) {
    console.log('❌ Cancelado.');
    return cambios;
  }

  console.log('\n🔧 APLICANDO...');
  for (const c of cambios) {
    const body = { id: c.id };
    if (c.tituloNuevo) body.titulo = c.tituloNuevo;
    if (c.slugNuevo) body.slug = c.slugNuevo;

    try {
      const resp = await fetch('/api/admin/corregir-titulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (resp.ok) {
        corregidas++;
        console.log(`  ✅ ${c.id} actualizado`);
      } else {
        console.error(`  ❌ ${c.id}:`, await resp.text());
      }
    } catch (err) {
      console.error(`  ❌ ${c.id}:`, err);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n✅ LISTO: ${corregidas} corregidas, ${slugsLimpiados} slugs, ${yaCorrectas} ya ok.`);
  return { corregidas, slugsLimpiados, yaCorrectas, cambios };
}

window.corregirTitulosMasivo = corregirTitulosMasivo;
console.log('🔬 Script v2 cargado. Ejecutá: await corregirTitulosMasivo()');
