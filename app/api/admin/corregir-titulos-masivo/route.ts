import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const REGLAS_QUIRURGICAS: [RegExp, string][] = [
  [/\bAutoridades investigan incidente (de tránsito )?en\b/gi, 'Incidente grave'],
  [/\bPolicía investiga incidente (de tránsito )?en\b/gi, 'Investigan hecho grave'],
  [/\bPolicía investiga hallazgo en\b/gi, 'Hallazgo activa investigación'],
  [/\bPolicía atiende incidente (de tránsito )?en\b/gi, 'Incidente de tránsito'],
  [/\bPolicía busca a conductor involucrado en incidente en\b/gi, 'Buscan a conductor fugado'],
  [/\bFiscalía investiga deceso de recluso en\b/gi, 'Recluso fallece'],
  [/\bMINSA reporta incidente médico en\b/gi, 'Emergencia médica'],
  [/\bMINSA reporta tercer caso por picaduras de insectos en\b/gi, 'Tercera víctima por picaduras de abejas'],
  [/\bMINSA evalúa situación de salud en evento en\b/gi, 'Emergencia sanitaria en evento'],
  [/\bAutoridades reportan incidentes viales en\b/gi, 'Accidentes viales'],
  [/\bAutoridades investigan incidente laboral en\b/gi, 'Accidente laboral'],
  [/\bPolicía investiga incidente vial en\b/gi, 'Accidente vial'],
  [/\bPolicía investiga incidente en\b/gi, 'Investigan hecho'],
  [/\bPolicía reporta incidentes viales con funcionarios( en servicio)?\b/gi, 'Policías fallecen en accidentes viales'],
  [/\bConsulado gestiona caso de connacional( en)?\b/gi, 'Nicaragüense asistido por consulado'],
  [/\bConsulado asiste a (nicaragüense|familia nicaragüense) tras\b/gi, 'Consulado asiste a nicaragüense'],
  [/\bConsulado entrega cuerpo de nicaragüense fallecido en\b/gi, 'Repatrian cuerpo de nicaragüense'],
  [/\bFamilia nicaragüense gestiona repatriación desde\b/gi, 'Familia gestiona repatriación'],
  [/\bFamilia busca a joven desaparecido en\b/gi, 'Joven desaparece'],
  [/\bFamiliares localizan a adulto mayor tras búsqueda en\b/gi, 'Adulto mayor localizado'],
  [/\bCosta Rica investiga muerte de nicaragüense en\b/gi, 'Nicaragüense fallece'],
  [/\bPolicía costarricense investiga caso de violencia\b/gi, 'Sicarios asesinan a padre e hijo en Puntarenas, Costa Rica'],
  [/\bPolicía guatemalteca reporta detención de nicaragüense\b/gi, 'Capturan a nicaragüense en Guatemala'],
  [/\bPolicía refuerza seguridad en\b/gi, 'Policía refuerza seguridad'],
  [/\bJuzgado dicta sentencia por accidente en\b/gi, 'Juzgado dicta sentencia'],
  [/\bInvestigan muerte de mujer en bus de la ruta\b/gi, 'Mujer fallece en bus'],
  [/\bInvestigan fallecimiento de hombre en establecimiento de\b/gi, 'Hombre fallece en establecimiento'],
  [/\bInvestigan accidentes de moto ocurridos este\b/gi, 'Accidentes de moto'],
  [/\bInvestigan muerte de motociclista en\b/gi, 'Motociclista fallece'],
  [/\bHallazgo en .+ activa investigación policial\b/gi, 'Hallazgo policial'],
  [/\bHallazgo de cuerpo en .+ activa investigación fiscal\b/gi, 'Hallan cuerpo'],
  [/\bHallazgo de cuerpo sin vida en\b/gi, 'Hallan cuerpo'],
  [/\bCapturan a señalado por\b/gi, 'Capturan a sujeto por'],
  [/\bDetienen a nicaragüenses con droga en aguas de\b/gi, 'Nicaragüenses detenidos con droga'],
  [/\bDos fallecidos en accidentes ocurridos en\b/gi, 'Dos muertos en accidentes'],
  [/\bDos fallecidos tras naufragio de panga en\b/gi, 'Dos mueren tras naufragio'],
  [/\bDos hombres mueren en hechos violentos en\b/gi, 'Dos hombres mueren en hechos violentos'],
  [/\bDos jóvenes mueren asfixiados en pozo en\b/gi, 'Dos jóvenes mueren asfixiados en pozo de'],
  [/\bDos mueren por presuntos problemas de salud en\b/gi, 'Dos mueren por problemas de salud'],
  [/\bDos nicaragüenses fallecen en accidentes ocurridos en\b/gi, 'Dos nicaragüenses mueren en accidentes'],
  [/\bDos nicaragüenses fallecen en el extranjero\b/gi, 'Dos nicaragüenses fallecen en el extranjero'],
  [/\bTres ataques de pitbull en Nicaragua dejan tres lesionados\b/gi, 'Tres ataques de pitbull dejan lesionados en Nicaragua'],
  [/\bTres fallecidos y un lesionado grave en accidentes viales\b/gi, 'Tres muertos y un herido grave en accidentes viales'],
  [/\bTres muertos y un lesionado en accidentes de tránsito\b/gi, 'Tres muertos y un herido en accidentes de tránsito'],
  [/\bUn muerto y un herido en accidentes laborales en\b/gi, 'Un muerto y un herido en accidente laboral'],
  [/\bVilla .+: Reporte técnico de accidente doméstico\b/gi, 'Accidente doméstico'],
  [/\bEsparza: Análisis del ataque armado con fusiles de guerra\b/gi, 'Ataque con fusiles de guerra en Esparza deja heridos'],
  [/\bBoaco: Informe técnico sobre accidente vial en\b/gi, 'Accidente vial en Boaco'],
  [/\bMatagalpa: Investigan muerte de vigilante en\b/gi, 'Vigilante muere en Matagalpa'],
  [/\bMasaya: Análisis del fatal accidente vial en\b/gi, 'Accidente fatal en Masaya'],
  [/\bFiscalía pide hasta 25 mil años para líder de MS-13\b/gi, 'Fiscalía pide cadena perpetua para líder de MS-13'],
  [/\bNicaragua se alista para un 2026 con retos en béisbol internacional\b/gi, 'Béisbol internacional: Nicaragua se alista para retos de 2026'],
  [/\bNicaragua: El evento de IA que revolucionará Nicaragua y Hackathon impulsará la innovación\b/gi, 'Evento de IA y Hackathon buscan revolucionar innovación en Nicaragua'],
  [/\bHospital Bertha Calderón ejecuta con éxito una nueva cirugía fetal\b/gi, 'Hospital Bertha Calderón ejecuta con éxito cirugía fetal en Managua'],
  [/\bShakira hace historia con megaconcierto en Copacabana\b/gi, 'Shakira reúne a dos millones en concierto histórico en Copacabana'],
  [/\bSony Music adquiere catálogo de Shakira y Beyoncé por cifra récord\b/gi, 'Sony Music compra catálogo de Shakira y Beyoncé'],
  [/\bAcademia de Hollywood limita uso de IA en películas para los Óscar\b/gi, 'Academia regula la IA y reforma reglas para los Óscar'],
  [/\bNetflix prepara precuela de The Crown sobre el origen de los Windsor\b/gi, 'Netflix anuncia precuela de The Crown sobre familia real británica'],
  [/\bJannik Sinner tras baja de Alcaraz: "El tenis necesita a Carlos"\b/gi, 'Jannik Sinner tras baja de Alcaraz: el tenis necesita a Carlos'],
  [/\bTaylor Swift busca registrar su voz como marca ante el auge de la IA\b/gi, 'Taylor Swift busca registrar su voz como marca ante la IA'],
  [/\bToy Story 5 llegará a Nicaragua con Woody y Buzz en la era digital\b/gi, 'Toy Story 5 llega a Nicaragua con Woody y Buzz en la era digital'],
  [/\bWindows 11 ahora se instala más rápido tras cambio de Microsoft\b/gi, 'Windows 11 acelera su instalación en computadoras en Nicaragua'],
  [/\bMicrosoft corrige fallo de seguridad en navegador Edge\b/gi, 'Microsoft corrige vulnerabilidad en navegador Edge para usuarios en Nicaragua'],
  [/\bSamsung prepara revolución: Baterías de silicio-carbón para el Galaxy S27\b/gi, 'Samsung presenta baterías de silicio-carbón para el Galaxy S27'],
  [/\bCanadá reporta caso de virus por roedores en Columbia Británica\b/gi, 'Canadá confirma caso de hantavirus ligado a crucero MV Hondius'],
  [/\bDescubren dinosaurio gigante en Asia: pesaba como nueve elefantes\b/gi, 'Descubren dinosaurio gigante en Asia: pesaba 9 elefantes'],
  [/\bCohete New Glenn de Blue Origin explota en prueba en Cabo Cañaveral\b/gi, 'Cohete New Glenn de Blue Origin explota en Cabo Cañaveral'],
  [/\bTemporada de huracanes del Pacífico 2026 inicia con calma aparente\b/gi, 'Temporada de huracanes del Pacífico 2026 inicia con calma'],
  [/\bTurismo en Nicaragua crece 11% en primer trimestre de 2026 según INTUR\b/gi, 'Turismo en Nicaragua crece 11% en primer trimestre de 2026'],
  [/\bKFC Nicaragua 2026: Apertura en Managua, menú y precios confirmados\b/gi, 'KFC abre en Managua: menú, precios y horarios confirmados'],
  [/\bPolicía y Ejército incautan 502 kilos de cocaína en Wiwilí\b/gi, 'Incautan 502 kilos de cocaína en operativo en Wiwilí'],
  [/\bOperativo contra caponeras deja multas y unidades retenida en Catarina\b/gi, 'Operativo en Catarina deja multas y caponeras retenidas'],
  [/\bNicaragua recibe 278 mil turistas en primer trimestre de 2026; crecimiento del 11%\b/gi, 'Nicaragua recibe 278 mil turistas y crece 11% en primer trimestre'],
  [/\bJerónimo Sobalvarro Toruño, 73 años, muere tras caer con motociclet\b/gi, 'Jerónimo Sobalvarro muere tras caer de motocicleta en Managua'],
  [/\bPeatón de 58 años muere atropellado en el kilómetro 52 Carretera Norte\b/gi, 'Peatón muere atropellado en km 52 Carretera Norte'],
  [/\bJoven de 24 años muere tras descarga de 13 mil voltios\b/gi, 'Joven muere electrocutado con 13 mil voltios'],
  [/\bJoven de 28 años muere ahogado en playa Matilde, San Juan del Sur\b/gi, 'Joven muere ahogado en playa Matilde de San Juan del Sur'],
  [/\bNiño de 15 meses muere ahogado\b/gi, 'Bebé muere ahogado'],
  [/\bEscolta de ULTRAVAL enfrenta juicio por robo de dinero\b/gi, 'Escolta de ULTRAVAL enfrenta juicio por robo'],
  [/\bConductor se fuga tras causar muerte\b/gi, 'Conductor huye tras atropello mortal'],
  [/\bCuerpo es hallado\b/gi, 'Hallan cuerpo'],
  [/\bHallan cuerpo de mujer desaparecida\b/gi, 'Hallan cuerpo de mujer'],
  [/\bHallan cuerpo de anciano desaparecido\b/gi, 'Hallan cuerpo de anciano desaparecido'],
  [/\bCapturan a señalado por robo de más de US\$30 mil\b/gi, 'Capturan a sujeto por robo de US$30 mil'],
  [/\bDos nicaragüenses fallecen en accidentes ocurridos en Honduras y Miami\b/gi, 'Dos nicaragüenses mueren en accidentes en Honduras y Miami'],
  [/\bMédico y dos personas detenidos por muerte de joven tras cirugía\./gi, 'Médico y dos detenidos por muerte de joven tras cirugía'],
  [/\bPrograma Nuevas Victorias entregará 85 viviendas\b/gi, '85 viviendas de Nuevas Victorias se entregarán'],
  [/\bNicaragüense de 49 años fallece\b/gi, 'Nicaragüense de 49 años muere'],
  [/\bBéisbol sigue siendo el deporte favorito de los nicaragüenses\b/gi, 'Béisbol sigue siendo deporte favorito de nicaragüenses'],
  [/\bAumentan casos de electrocución en accidentes laborales(?!.+Nicaragua)\b/gi, 'Aumentan casos de electrocución en accidentes laborales en Nicaragua'],
  [/\bClima extremo en Nicaragua: Tornado en Somotillo y granizo en Jinotepe\b/gi, 'Tornado en Somotillo y granizo en Jinotepe: clima extremo'],
  [/\bNicaragua suma 165 MW renovables\b/gi, 'Nicaragua suma 165 MW de energía renovable'],
  [/\bCosta Rica invita a Nicaragua a toma de posesión de Laura Fernández\b/gi, 'Costa Rica invita a Nicaragua a toma de posesión presidencial'],
  [/\bTecnología global: IA agéntica lidera cambios en 2026\b/gi, 'IA agéntica lidera cambios tecnológicos globales en 2026'],
  [/\bAustralia: 7 de cada 10 menores\b/gi, 'Australia: el 70% de menores'],
  [/\bDos personas mueren tras ser alcanzadas por rayos\b/gi, 'Dos mueren tras ser alcanzados por rayos'],
  [/\bConductor de caponera fallece\b/gi, 'Conductor de caponera muere'],
  [/\bAdolescente de 14 años muere al caer de camión en la Panamericana Sur\b/gi, 'Adolescente muere al caer de camión en carretera Panamericana'],
  [/\bPolicía investiga incidente en Ciudad Sandino\b/gi, 'Joven de 18 años muere tras trifulca en Ciudad Sandino'],
  [/\bPolicía busca a conductor involucrado en incidente en Rosita\b/gi, 'Conductor ebrio huye tras matar a pasajero en Rosita'],
  [/\bFiscalía investiga deceso de recluso en Matagalpa\b/gi, 'Femicida de Sébaco muere tras ingerir sustancia tóxica en reclusión'],
  [/\bAutoridades investigan incidente laboral en pozo de Madriz\b/gi, 'Obrero muere asfixiado dentro de pozo en Madriz'],
  [/\bOklahoma evalúa impacto de fenómenos climáticos recientes\b/gi, 'Tornados devastadores dejan heridos y daños en Oklahoma'],
  [/\bIncendio destruye negocio y deja pérdidas por C\$200 mil\b/gi, 'Incendio destruye negocio con pérdidas de C$200 mil'],
  [/\bCómo sacar y apostillar el récord policial\b/gi, 'Cómo tramitar el récord policial'],
  [/\bINETER: pronostican lluvias fuertes\b/gi, 'INETER pronostica lluvias fuertes'],
  [/\bAbril cierra con 70 fallecidos\b/gi, 'Abril registra 70 muertos'],
  [/\bAbril registra 70 accidentes de tránsito\b/gi, 'Abril registra 70 muertos por accidentes de tránsito'],
  [/\bTragedia en barrio Cuba: caponero de 70 años fallece\b/gi, 'Conductor de caponera muere'],
  [/\bIncendio en puesto del Mercado Oriental es controlado por bomberos\b/gi, 'Incendio destruye puesto de ropa en Mercado Oriental de Managua'],
  [/\bMicrosoft y Meta aceleran despidos masivos\b/gi, 'Microsoft y Meta ajustan sus plantillas'],
  [/\bNeymar Jr\. analiza el panorama competitivo\b/gi, 'Neymar Jr. se prepara para el Mundial 2026'],
  [/\bLuca Zidane recibe atención médica\b/gi, 'Luca Zidane recibe tratamiento médico'],
  [/\bLuka Modrić recibe atención médica\b/gi, 'Luka Modrić recibe tratamiento'],
  [/\bCuatro nicaragüenses fallecen en Costa Rica, El Salvador y Estados Unidos\b/gi, 'Cuatro nicaragüenses fallecen en Costa Rica, El Salvador y EE.UU.'],
  [/\b¡Histórico! Sebastián Sawe rompe la barrera de las 2 horas\b/gi, '¡Histórico! Sebastián Sawe rompe barrera de 2 horas'],
  [/\bMessi iguala récord histórico de 16 goles en Mundiales\b/gi, 'Messi iguala récord histórico de 16 goles en Mundiales'],
];

function aplicarReglas(titulo: string): string {
  let resultado = titulo.trim();
  for (const [regex, reemplazo] of REGLAS_QUIRURGICAS) {
    if (regex.test(resultado)) {
      resultado = resultado.replace(regex, reemplazo);
      break;
    }
  }
  return resultado.replace(/\s+/g, ' ').replace(/\.$/, '').trim();
}

function limpiarSlug(slug: string): string {
  if (!slug) return slug;
  return slug.replace(/-[a-z0-9]{6,}$/i, '');
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const previewOnly = body?.preview === true;
    const dryRun = body?.dryRun === true;

    const db = getAdminDb();
    const noticiasSnap = await db.collection('noticias').orderBy('fecha', 'desc').limit(300).get();
    
    const cambios: { id: string; tituloOrig: string; tituloNuevo: string | null; slugOrig: string; slugNuevo: string | null }[] = [];
    
    for (const doc of noticiasSnap.docs) {
      const data = doc.data();
      const tituloOrig = (data.titulo || '') as string;
      const slugOrig = (data.slug || '') as string;
      
      const tituloNuevo = aplicarReglas(tituloOrig);
      const slugNuevo = limpiarSlug(slugOrig);
      
      if (tituloNuevo !== tituloOrig || slugNuevo !== slugOrig) {
        cambios.push({
          id: doc.id,
          tituloOrig,
          tituloNuevo: tituloNuevo !== tituloOrig ? tituloNuevo : null,
          slugOrig,
          slugNuevo: slugNuevo !== slugOrig ? slugNuevo : null,
        });
      }
    }

    if (previewOnly || dryRun) {
      return NextResponse.json({
        preview: true,
        total: noticiasSnap.size,
        porCorregir: cambios.length,
        cambios: cambios.slice(0, 20),
      });
    }

    let aplicados = 0;
    for (const c of cambios) {
      const updateData: Record<string, string> = {};
      if (c.tituloNuevo) updateData.titulo = c.tituloNuevo;
      if (c.slugNuevo) updateData.slug = c.slugNuevo;
      
      try {
        await db.collection('noticias').doc(c.id).update(updateData);
        aplicados++;
      } catch (e) {
        console.error(`Error actualizando ${c.id}:`, e);
      }
    }

    return NextResponse.json({
      ok: true,
      total: noticiasSnap.size,
      porCorregir: cambios.length,
      aplicados,
      cambios: cambios.slice(0, 10),
    });
  } catch (error) {
    console.error('[corregir-titulos-masivo] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
