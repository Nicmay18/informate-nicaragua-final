/**
 * SCRIPT QUIRÚRGICO FORENSE — Corrección masiva de títulos y slugs
 * 
 * Cómo usar:
 * 1. Abrí el panel admin en el navegador
 * 2. Abrí la consola (F12 → Console)
 * 3. Pegá este script completo y presioná Enter
 * 4. Ejecutá: await corregirTitulosMasivo()
 * 
 * El script revisa todas las noticias, corrige títulos genéricos,
 * limpia slugs con sufijos aleatorios (-mqr51mit) y guarda en Firestore.
 */

const REGLAS_QUIRURGICAS = [
  // ── EUFEMISMOS POLICIALES → DATOS DUROS ──
  [/Autoridades investigan incidente (de tránsito )?en (.+)/gi, 'Incidente grave en $2'],
  [/Policía investiga incidente (de tránsito )?en (.+)/gi, 'Investigan hecho grave en $2'],
  [/Policía investiga hallazgo en (.+)/gi, 'Hallazgo activa investigación en $1'],
  [/Policía atiende incidente (de tránsito )?en (.+)/gi, 'Incidente de tránsito en $2'],
  [/Policía busca a conductor involucrado en incidente en (.+)/gi, 'Buscan a conductor fugado en $1'],
  [/Fiscalía investiga deceso de recluso en (.+)/gi, 'Recluso fallece en $1'],
  [/MINSA reporta incidente médico en (.+)/gi, 'Emergencia médica en $1'],
  [/MINSA reporta tercer caso por picaduras de insectos en (.+)/gi, 'Tercera víctima por picaduras de abejas en $1'],
  [/MINSA evalúa situación de salud en evento en (.+)/gi, 'Emergencia sanitaria en evento en $1'],
  [/Autoridades reportan incidentes viales en (.+)/gi, 'Accidentes viales en $1'],
  [/Autoridades investigan incidente laboral en (.+)/gi, 'Accidente laboral en $1'],
  [/Autoridades investigan incidente acuático en (.+)/gi, 'Incidente acuático en $1'],
  [/Policía investiga incidente vial en (.+)/gi, 'Accidente vial en $1'],
  [/Policía investiga incidente en (.+)/gi, 'Investigan hecho en $1'],
  [/Policía reporta incidentes viales con funcionarios( en servicio)?/gi, 'Policías fallecen en accidentes viales'],
  [/Consulado gestiona caso de connacional( en)? (.+)/gi, 'Nicaragüense asistido por consulado en $2'],
  [/Consulado asiste a (nicaragüense|familia nicaragüense) tras (.+)/gi, 'Consulado asiste a nicaragüense tras $2'],
  [/Consulado entrega cuerpo de nicaragüense fallecido en (.+)/gi, 'Repatrian cuerpo de nicaragüense fallecido en $1'],
  [/Familia nicaragüense gestiona repatriación desde (.+)/gi, 'Familia gestiona repatriación desde $1'],
  [/Familia busca a joven desaparecido en (.+)/gi, 'Joven desaparece en $1'],
  [/Familiares localizan a adulto mayor tras búsqueda en (.+)/gi, 'Adulto mayor localizado en $1'],
  [/Costa Rica investiga muerte de nicaragüense en (.+)/gi, 'Nicaragüense fallece en $1, Costa Rica'],
  [/Policía costarricense investiga caso de violencia/gi, 'Sicarios asesinan a padre e hijo en Puntarenas, Costa Rica'],
  [/Policía guatemalteca reporta detención de nicaragüense/gi, 'Capturan a nicaragüense en Guatemala'],
  [/Policía refuerza seguridad en (.+)/gi, 'Policía refuerza seguridad en $1'],
  [/Juzgado dicta sentencia por accidente en (.+)/gi, 'Juzgado dicta sentencia por accidente en $1'],
  [/Investigan muerte de mujer en bus de la ruta (.+)/gi, 'Mujer fallece en bus de la ruta $1'],
  [/Investigan fallecimiento de hombre en establecimiento de (.+)/gi, 'Hombre fallece en establecimiento de $1'],
  [/Investigan accidentes de moto ocurridos este (.+)/gi, 'Accidentes de moto este $1'],
  [/Investigan muerte de motociclista en (.+)/gi, 'Motociclista fallece en $1'],
  [/Hallazgo en (.+) activa investigación policial/gi, 'Hallazgo policial en $1'],
  [/Hallazgo de cuerpo en (.+) activa investigación fiscal/gi, 'Hallan cuerpo en $1'],
  [/Hallazgo de cuerpo sin vida en (.+)/gi, 'Hallan cuerpo en $1'],
  [/Capturan a señalado por (.+)/gi, 'Capturan a sujeto por $1'],
  [/Detienen a nicaragüenses con droga en aguas de (.+)/gi, 'Nicaragüenses detenidos con droga en $1'],
  [/Dos fallecidos en accidentes ocurridos en (.+)/gi, 'Dos muertos en accidentes en $1'],
  [/Dos fallecidos tras naufragio de panga en (.+)/gi, 'Dos mueren tras naufragio en $1'],
  [/Dos hombres mueren en hechos violentos en (.+)/gi, 'Dos hombres mueren en hechos violentos en $1'],
  [/Dos jóvenes mueren asfixiados en pozo en (.+)/gi, 'Dos jóvenes mueren asfixiados en pozo de $1'],
  [/Dos mueren por presuntos problemas de salud en (.+)/gi, 'Dos mueren por problemas de salud en $1'],
  [/Dos nicaragüenses fallecen en accidentes ocurridos en (.+)/gi, 'Dos nicaragüenses mueren en accidentes en $1'],
  [/Dos nicaragüenses fallecen en el extranjero/gi, 'Dos nicaragüenses fallecen en el extranjero'],
  [/Tres ataques de pitbull en Nicaragua dejan tres lesionados/gi, 'Tres ataques de pitbull dejan lesionados en Nicaragua'],
  [/Tres fallecidos y un lesionado grave en accidentes viales/gi, 'Tres muertos y un herido grave en accidentes viales'],
  [/Tres muertos y un lesionado en accidentes de tránsito/gi, 'Tres muertos y un herido en accidentes de tránsito'],
  [/Un muerto y un herido en accidentes laborales en (.+)/gi, 'Un muerto y un herido en accidente laboral en $1'],
  [/Villa (.+): Reporte técnico de accidente doméstico/gi, 'Accidente doméstico en Villa $1'],
  [/Esparza: Análisis del ataque armado con fusiles de guerra/gi, 'Ataque con fusiles de guerra en Esparza deja heridos'],
  [/Boaco: Informe técnico sobre accidente vial en (.+)/gi, 'Accidente vial en Boaco: $1'],
  [/Matagalpa: Investigan muerte de vigilante en (.+)/gi, 'Vigilante muere en Matagalpa: $1'],
  [/Masaya: Análisis del fatal accidente vial en (.+)/gi, 'Accidente fatal en Masaya: $1'],

  // ── CORRECCIONES ESPECÍFICAS DE TÍTULOS LARGOS ──
  [/Fiscalía pide hasta 25 mil años para líder de MS-13/gi, 'Fiscalía pide cadena perpetua para líder de MS-13'],
  [/Nicaragua se alista para un 2026 con retos en béisbol internacional/gi, 'Béisbol internacional: Nicaragua se alista para retos de 2026'],
  [/Nicaragua: El evento de IA que revolucionará Nicaragua y Hackathon impulsará la innovación/gi, 'Evento de IA y Hackathon buscan revolucionar innovación en Nicaragua'],
  [/Hospital Bertha Calderón ejecuta con éxito una nueva cirugía fetal/gi, 'Hospital Bertha Calderón ejecuta con éxito cirugía fetal en Managua'],
  [/Shakira hace historia con megaconcierto en Copacabana/gi, 'Shakira reúne a dos millones en concierto histórico en Copacabana'],
  [/Sony Music adquiere catálogo de Shakira y Beyoncé por cifra récord/gi, 'Sony Music compra catálogo de Shakira y Beyoncé'],
  [/Academia de Hollywood limita uso de IA en películas para los Óscar/gi, 'Academia regula la IA y reforma reglas para los Óscar'],
  [/Netflix prepara precuela de The Crown sobre el origen de los Windsor/gi, 'Netflix anuncia precuela de The Crown sobre familia real británica'],
  [/Jannik Sinner tras baja de Alcaraz: "El tenis necesita a Carlos"/gi, 'Jannik Sinner tras baja de Alcaraz: el tenis necesita a Carlos'],
  [/Taylor Swift busca registrar su voz como marca ante el auge de la IA/gi, 'Taylor Swift busca registrar su voz como marca ante la IA'],
  [/Toy Story 5 llegará a Nicaragua con Woody y Buzz en la era digital/gi, 'Toy Story 5 llega a Nicaragua con Woody y Buzz en la era digital'],
  [/Windows 11 ahora se instala más rápido tras cambio de Microsoft/gi, 'Windows 11 acelera su instalación en computadoras en Nicaragua'],
  [/Microsoft corrige fallo de seguridad en navegador Edge/gi, 'Microsoft corrige vulnerabilidad en navegador Edge para usuarios en Nicaragua'],
  [/Samsung prepara revolución: Baterías de silicio-carbón para el Galaxy S27/gi, 'Samsung presenta baterías de silicio-carbón para el Galaxy S27'],
  [/Canadá reporta caso de virus por roedores en Columbia Británica/gi, 'Canadá confirma caso de hantavirus ligado a crucero MV Hondius'],
  [/Descubren dinosaurio gigante en Asia: pesaba como nueve elefantes/gi, 'Descubren dinosaurio gigante en Asia: pesaba 9 elefantes'],
  [/Cohete New Glenn de Blue Origin explota en prueba en Cabo Cañaveral/gi, 'Cohete New Glenn de Blue Origin explota en Cabo Cañaveral'],
  [/Temporada de huracanes del Pacífico 2026 inicia con calma aparente/gi, 'Temporada de huracanes del Pacífico 2026 inicia con calma'],
  [/Turismo en Nicaragua crece 11% en primer trimestre de 2026 según INTUR/gi, 'Turismo en Nicaragua crece 11% en primer trimestre de 2026'],
  [/KFC Nicaragua 2026: Apertura en Managua, menú y precios confirmados/gi, 'KFC abre en Managua: menú, precios y horarios confirmados'],
  [/Policía y Ejército incautan 502 kilos de cocaína en Wiwilí/gi, 'Incautan 502 kilos de cocaína en operativo en Wiwilí'],
  [/Operativo contra caponeras deja multas y unidades retenida en Catarina/gi, 'Operativo en Catarina deja multas y caponeras retenidas'],
  [/Nicaragua recibe 278 mil turistas en primer trimestre de 2026; crecimiento del 11%/gi, 'Nicaragua recibe 278 mil turistas y crece 11% en primer trimestre'],
  [/Jerónimo Sobalvarro Toruño, 73 años, muere tras caer con motociclet/gi, 'Jerónimo Sobalvarro muere tras caer de motocicleta en Managua'],
  [/Peatón de 58 años muere atropellado en el kilómetro 52 Carretera Norte/gi, 'Peatón muere atropellado en km 52 Carretera Norte'],
  [/Joven de 24 años muere tras descarga de 13 mil voltios en León/gi, 'Joven muere electrocutado con 13 mil voltios en León'],
  [/Joven de 28 años muere ahogado en playa Matilde, San Juan del Sur/gi, 'Joven muere ahogado en playa Matilde de San Juan del Sur'],
  [/Niño de 15 meses muere ahogado tras caer en cubeta en Mateare/gi, 'Bebé muere ahogado tras caer en cubeta de agua en Mateare'],
  [/Escolta de ULTRAVAL enfrenta juicio por robo de dinero en Managua/gi, 'Escolta de ULTRAVAL enfrenta juicio por robo en Managua'],
  [/Conductor se fuga tras causar muerte de joven en La Ceiba, León/gi, 'Conductor huye tras atropello mortal en La Ceiba, León'],
  [/Cuerpo es hallado tras caer en aguas del Río San Juan/gi, 'Hallan cuerpo en aguas del Río San Juan'],
  [/Hallan cuerpo de mujer desaparecida en carretera León-Chinandega/gi, 'Hallan cuerpo de mujer en carretera León-Chinandega'],
  [/Costa Rica: investigan muerte de nicaragüense y buscan a sus familiare/gi, 'Costa Rica investiga muerte de nicaragüense en Heredia y busca familiares'],
  [/Hallan cuerpo de anciano desaparecido en Las Jagüitas, Managua/gi, 'Hallan cuerpo de anciano desaparecido en Las Jagüitas'],
  [/Capturan a señalado por robo de más de US\$30 mil en Jalapa/gi, 'Capturan a sujeto por robo de US$30 mil en Jalapa'],
  [/Dos nicaragüenses fallecen en accidentes ocurridos en Honduras y Miami/gi, 'Dos nicaragüenses mueren en accidentes en Honduras y Miami'],
  [/Médico y dos personas detenidos por muerte de joven tras cirugía\./gi, 'Médico y dos detenidos por muerte de joven tras cirugía'],
  [/Programa Nuevas Victorias entregará 85 viviendas en Nagarote/gi, '85 viviendas de Nuevas Victorias se entregarán en Nagarote'],
  [/Nicaragüense de 49 años fallece tras accidente vial en North Miami FL/gi, 'Nicaragüense de 49 años muere tras accidente vial en North Miami'],
  [/Béisbol sigue siendo el deporte favorito de los nicaragüenses en 2026/gi, 'Béisbol sigue siendo deporte favorito de nicaragüenses en 2026'],
  [/Aumentan casos de electrocución en accidentes laborales(?!.+Nicaragua)/gi, 'Aumentan casos de electrocución en accidentes laborales en Nicaragua'],
  [/Clima extremo en Nicaragua: Tornado en Somotillo y granizo en Jinotepe/gi, 'Tornado en Somotillo y granizo en Jinotepe: clima extremo'],
  [/Nicaragua suma 165 MW renovables y baterías eléctricas/gi, 'Nicaragua suma 165 MW de energía renovable y baterías eléctricas'],
  [/Costa Rica invita a Nicaragua a toma de posesión de Laura Fernández/gi, 'Costa Rica invita a Nicaragua a toma de posesión presidencial'],
  [/Tecnología global: IA agéntica lidera cambios en 2026/gi, 'IA agéntica lidera cambios tecnológicos globales en 2026'],
  [/Australia: 7 de cada 10 menores burlan prohibición de redes sociales/gi, 'Australia: el 70% de menores evade control en redes sociales'],
  [/Dos personas mueren tras ser alcanzadas por rayos durante tormentas en Granada y Matagalpa/gi, 'Dos mueren tras ser alcanzados por rayos en Granada y Matagalpa'],
  [/Conductor de caponera fallece mientras desayunaba en Managua/gi, 'Conductor de caponera muere mientras desayunaba en Managua'],
  [/Adolescente de 14 años muere al caer de camión en la Panamericana Sur/gi, 'Adolescente muere al caer de camión en carretera Panamericana'],
  [/Policía investiga incidente en Ciudad Sandino/gi, 'Joven de 18 años muere tras trifulca en Ciudad Sandino'],
  [/Policía busca a conductor involucrado en incidente en Rosita/gi, 'Conductor ebrio huye tras matar a pasajero en Rosita'],
  [/Fiscalía investiga deceso de recluso en Matagalpa/gi, 'Femicida de Sébaco muere tras ingerir sustancia tóxica en reclusión'],
  [/Autoridades investigan incidente laboral en pozo de Madriz/gi, 'Obrero muere asfixiado dentro de pozo en Madriz'],
  [/Oklahoma evalúa impacto de fenómenos climáticos recientes/gi, 'Tornados devastadores dejan heridos y daños en Oklahoma'],
  [/Incendio destruye negocio y deja pérdidas por C\$200 mil en Nindirí/gi, 'Incendio destruye negocio con pérdidas de C$200 mil en Nindirí'],
  [/Cómo sacar y apostillar el récord policial de Nicaragua en 2026/gi, 'Cómo tramitar el récord policial en Nicaragua en 2026'],
  [/INETER: pronostican lluvias fuertes y tormentas eléctricas en Nicaragua este sábado/gi, 'INETER pronostica lluvias fuertes y tormentas eléctricas en Nicaragua'],
  [/Abril cierra con 70 fallecidos por accidentes de tránsito en Nicaragua/gi, 'Abril registra 70 muertos por accidentes de tránsito en Nicaragua'],
  [/Abril registra 70 accidentes de tránsito en Nicaragua/gi, 'Abril registra 70 muertos por accidentes de tránsito en Nicaragua'],
  [/MINSA reporta tercer caso por picaduras de insectos en Chontales/gi, 'Tercera víctima por picaduras de abejas en Chontales'],
  [/Tragedia en barrio Cuba: caponero de 70 años fallece en su unidad/gi, 'Conductor de caponera muere mientras desayunaba en Managua'],
  [/Incendio en puesto del Mercado Oriental es controlado por bomberos/gi, 'Incendio destruye puesto de ropa en Mercado Oriental de Managua'],
  [/Microsoft y Meta aceleran despidos masivos para financiar carrera por la IA/gi, 'Microsoft y Meta ajustan sus plantillas para acelerar la IA'],
  [/OpenAI mantiene alianza con Apple para integrar ChatGPT en dispositivos en Nicaragua/gi, 'OpenAI mantiene alianza con Apple para integrar ChatGPT en Nicaragua'],
  [/Neymar Jr\. analiza el panorama competitivo de cara al mundial 2026/gi, 'Neymar Jr. se prepara para el Mundial 2026 tras recuperación'],
  [/Luca Zidane recibe atención médica; evalúan su participación/gi, 'Luca Zidane recibe tratamiento médico; club evalúa recuperación'],
  [/Luka Modrić recibe atención médica; club evalúa recuperación/gi, 'Luka Modrić recibe tratamiento y club evalúa recuperación'],
  [/Shakira lanza "Dai Dai", himno oficial del Mundial 2026/gi, 'Shakira lanza "Dai Dai", himno oficial del Mundial 2026'],
  [/Tres muertos y un lesionado en accidentes de tránsito/gi, 'Tres muertos y un herido en accidentes de tránsito en Nicaragua'],
  [/Cuatro nicaragüenses fallecen en Costa Rica, El Salvador y Estados Unidos en menos de una semana/gi, 'Cuatro nicaragüenses fallecen en Costa Rica, El Salvador y EE.UU.'],
  [/¡Histórico! Sebastián Sawe rompe la barrera de las 2 horas en maratón/gi, '¡Histórico! Sebastián Sawe rompe barrera de 2 horas en maratón'],
  [/Messi iguala récord histórico de 16 goles en Mundiales/gi, 'Messi iguala récord histórico de 16 goles en Mundiales'],
];

function limpiarSlug(slug) {
  if (!slug) return slug;
  // Quitar sufijos aleatorios: -mqr51mit, -mpd03gxt, -mpcy3j8k, etc.
  // Patrón: guion + 8 caracteres alfanuméricos al final
  return slug.replace(/-[a-z0-9]{8}$/i, '');
}

function aplicarReglas(titulo) {
  let resultado = titulo.trim();
  for (const [regex, reemplazo] of REGLAS_QUIRURGICAS) {
    if (regex.test(resultado)) {
      resultado = resultado.replace(regex, reemplazo);
      break; // Aplicar solo la primera regla que coincida
    }
  }
  // Limpiar espacios dobles y puntos finales
  resultado = resultado.replace(/\s+/g, ' ').replace(/\.$/, '').trim();
  return resultado;
}

function contarCaracteres(titulo) {
  return titulo.length;
}

function esTituloGenerico(titulo) {
  const genericos = [
    /Autoridades investigan/i,
    /Policía investiga incidente/i,
    /Policía atiende incidente/i,
    /Policía busca a conductor/i,
    /Consulado gestiona caso/i,
    /MINSA reporta incidente/i,
    /MINSA evalúa situación/i,
    /Autoridades reportan incidentes/i,
    /Fiscalía investiga deceso/i,
    /Policía costarricense investiga/i,
    /Policía guatemalteca reporta/i,
  ];
  return genericos.some(r => r.test(titulo));
}

// ── FUNCIÓN PRINCIPAL ──
// Ejecutar en la consola del navegador con: await corregirTitulosMasivo()
async function corregirTitulosMasivo() {
  console.log('🔬 INICIANDO CORRECCIÓN QUIRÚRGICA FORENSE...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Obtener todas las noticias del cache del panel
  let noticias;
  if (typeof getNoticiasCache === 'function') {
    noticias = await getNoticiasCache();
  } else {
    console.error('❌ No se encontró getNoticiasCache(). ¿Estás en el panel admin?');
    return;
  }

  console.log(`📊 Total de noticias a analizar: ${noticias.length}`);

  let corregidas = 0;
  let slugsLimpiados = 0;
  let yaCorrectas = 0;
  let cambios = [];

  for (const n of noticias) {
    const tituloOrig = n.titulo || '';
    const slugOrig = n.slug || '';
    
    // 1. Corregir título
    const tituloNuevo = aplicarReglas(tituloOrig);
    const tituloCambiado = tituloNuevo !== tituloOrig;
    
    // 2. Limpiar slug
    const slugLimpio = limpiarSlug(slugOrig);
    const slugCambiado = slugLimpio !== slugOrig;
    
    if (!tituloCambiado && !slugCambiado) {
      yaCorrectas++;
      continue;
    }

    cambios.push({
      id: n.id,
      tituloOrig,
      tituloNuevo: tituloCambiado ? tituloNuevo : null,
      charsNuevo: tituloCambiado ? contarCaracteres(tituloNuevo) : null,
      slugOrig,
      slugNuevo: slugCambiado ? slugLimpio : null,
      generico: esTituloGenerico(tituloOrig),
    });
  }

  console.log(`\n📈 RESUMEN PRELIMINAR:`);
  console.log(`  ✅ Ya correctas: ${yaCorrectas}`);
  console.log(`  🔧 Necesitan corrección: ${cambios.length}`);
  console.log(`  📝 Títulos a corregir: ${cambios.filter(c => c.tituloNuevo).length}`);
  console.log(`  🔗 Slugs a limpiar: ${cambios.filter(c => c.slugNuevo).length}`);

  // Mostrar todos los cambios propuestos
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 CAMBIOS PROPUESTOS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  cambios.forEach((c, i) => {
    console.log(`\n[${i + 1}] ID: ${c.id}`);
    if (c.tituloNuevo) {
      console.log(`  TÍTULO ORIGINAL (${c.tituloOrig.length} chars): "${c.tituloOrig}"`);
      console.log(`  TÍTULO NUEVO    (${c.charsNuevo} chars): "${c.tituloNuevo}"`);
      if (c.generico) console.log(`  ⚠️  TÍTULO GENÉRICO DETECTADO`);
    }
    if (c.slugNuevo) {
      console.log(`  SLUG ORIGINAL: ${c.slugOrig}`);
      console.log(`  SLUG LIMPIO:   ${c.slugNuevo}`);
    }
  });

  // Preguntar si aplicar
  const confirmar = confirm(
    `Se encontraron ${cambios.length} noticias que necesitan corrección.\n\n` +
    `Títulos a corregir: ${cambios.filter(c => c.tituloNuevo).length}\n` +
    `Slugs a limpiar: ${cambios.filter(c => c.slugNuevo).length}\n\n` +
    `¿Querés aplicar TODOS los cambios ahora?\n\n` +
    `Revisá la consola (F12) para ver el detalle de cada cambio.`
  );

  if (!confirmar) {
    console.log('❌ Operación cancelada por el usuario.');
    return cambios;
  }

  // Aplicar cambios uno por uno
  console.log('\n🔧 APLICANDO CAMBIOS...');
  for (const c of cambios) {
    const updateData = {};
    if (c.tituloNuevo) updateData.titulo = c.tituloNuevo;
    if (c.slugNuevo) updateData.slug = c.slugNuevo;

    try {
      const resp = await fetch('/api/admin/corregir-titulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: c.id,
          titulo: c.tituloNuevo || undefined,
          slug: c.slugNuevo || undefined,
        }),
      });

      if (resp.ok) {
        corregidas++;
        if (c.tituloNuevo) console.log(`  ✅ [${corregidas}] Título corregido: "${c.tituloNuevo}"`);
        if (c.slugNuevo) {
          slugsLimpiados++;
          console.log(`  🔗 Slug limpiado: ${c.slugNuevo}`);
        }
      } else {
        console.error(`  ❌ Error en ${c.id}:`, await resp.text());
      }
    } catch (err) {
      console.error(`  ❌ Error de red en ${c.id}:`, err);
    }

    // Pequeña pausa para no saturar Firestore
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ CORRECCIÓN COMPLETADA:`);
  console.log(`  📝 Títulos corregidos: ${corregidas}`);
  console.log(`  🔗 Slugs limpiados: ${slugsLimpiados}`);
  console.log(`  ⏭️  Ya correctas: ${yaCorrectas}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 Recargá la página para ver los cambios reflejados.');

  return { corregidas, slugsLimpiados, yaCorrectas, cambios };
}

// Exponer función globalmente
window.corregirTitulosMasivo = corregirTitulosMasivo;
console.log('🔬 Script de corrección quirúrgica cargado.');
console.log('📌 Ejecutá: await corregirTitulosMasivo()');
