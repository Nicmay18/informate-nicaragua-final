import { getAdminDb } from '../lib/firebase-admin';

const TITLES: [string, string][] = [
  ["Policía realiza operativo de control en Peñas Blancas", "Policía decomisa mercadería en operativo de Peñas Blancas"],
  ["Neymar Jr. analiza el panorama competitivo de cara al Mundial 2026", "Neymar Jr. se prepara para el Mundial 2026 tras recuperación"],
  ["Metal Sonic se integrará oficialmente a la película 'Sonic 4'", "Metal Sonic se une al elenco de la película Sonic 4"],
  ["Policía atiende tres incidentes viales en Managua y Matagalpa", "Tres colisiones dejan heridos en Managua y Matagalpa"],
  ["Autoridades investigan accidente de motocicleta en Puente Muco, Boaco", "Accidente de moto en Puente Muco deja investigación abierta"],
  ["Consulado brinda asistencia tras incidente en Cartago", "Consulado asiste a nicaragüense tras accidente en Cartago"],
  ["Fiscal de California investiga a la FIFA por fraude en entradas", "Fiscalía de California investiga fraude de entradas de la FIFA"],
  ["Bomberos atienden emergencia por caída en Estelí", "Bomberos rescatan a trabajador tras caída en Estelí"],
  ["MINSA brinda atención a menores tras incidente doméstico", "MINSA atiende a tres menores tras accidente doméstico en Managua"],
  ["Reportan accidente de tránsito en San Ramón; autoridades en el lugar", "Accidente de tránsito en San Ramón deja dos heridos"],
  ["Familia gestiona trámites consulares en San Francisco", "Familia nicaragüense gestiona repatriación desde San Francisco"],
  ["Policía Nacional investiga incidente en Waslala; refuerzan seguridad", "Policía refuerza seguridad en Waslala tras incidente nocturno"],
  ["Shakira lanza \"Dai Dai\", el himno oficial del Mundial 2026", "Shakira presenta Dai Dai, himno oficial del Mundial 2026"],
  ["Sony Music adquiere catálogo de Shakira y Beyoncé por cifra récord", "Sony Music compra catálogo de Shakira y Beyoncé por millones"],
  ["Fiscalía abre investigación tras hallazgo en Muy Muy", "Hallazgo de cuerpo en Muy Muy activa investigación fiscal"],
  ["Expertos alertan por sequía extrema de 150 millones de hectáreas", "Sequía extrema afecta 150 millones de hectáreas en América Latina"],
  ["Capturan a motociclista que atropelló a menores en Jalapa", "Motociclista que atropelló a dos menores es capturado en Jalapa"],
  ["Instalan modernos semáforos solares en puntos clave de Managua", "Semáforos solares modernos entran en funcionamiento en Managua"],
  ["Consulado activa protocolo de asistencia en Miami", "Consulado asiste a familia nicaragüense tras emergencia en Miami"],
  ["Autoridades reportan tres incidentes acuáticos este fin de semana", "Tres ahogados en ríos de Nicaragua durante fin de semana"],
  ["Policía recibe a menor involucrado en incidente en Villa Libertad", "Menor de edad es retenido tras incidente en Villa Libertad"],
  ["Conductor se fuga tras causar muerte de joven en La Ceiba, León", "Conductor huye tras atropello mortal en La Ceiba, León"],
  ["Policía investiga incidente en kilómetro 52 Carretera Norte", "Hallazgo en Carretera Norte activa investigación policial"],
  ["Empresa eléctrica investiga falla técnica en León-Poneloya", "Apagón afecta a miles en León y Poneloya por falla eléctrica"],
  ["Autoridades investigan incidente vial en Jinotepe, Carazo", "Colisión en Jinotepe deja daños materiales y heridos leves"],
  ["Shakira convoca a dos millones de fans en Brasil", "Shakira reúne a dos millones de fans en concierto de Brasil"],
  ["Familiares intensifican búsqueda en Xiloá, Managua", "Familia busca a joven desaparecido en laguna de Xiloá, Managua"],
  ["Policía de Tránsito investiga incidente en Jinotega", "Accidente de moto en Jinotega deja un herido grave"],
  ["Carlos Vives y Maluma destacan en reciente gala musical", "Carlos Vives y Maluma lideran premiación en gala de música latina"],
  ["Berman Espinoza alcanza récord de 1,450 ponches", "Berman Espinoza rompe récord histórico de 1,450 ponches en Nicaragua"],
  ["Bomberos controlan siniestro en Mercado Oriental", "Incendio en puesto del Mercado Oriental es controlado por bomberos"],
  ["Familia de Río San Juan recibe apoyo consular en EE.UU.", "Consulado entrega cuerpo de nicaragüense fallecido en EE.UU."],
  ["Multitudinaria vigilia con Alex Zurdo y Grupo Barak en Plaza La Fe", "Miles participan en vigilia cristiana con Alex Zurdo en Managua"],
  ["Avanza construcción del Hospital Pediátrico Las Segovias en Estelí", "Hospital pediátrico de Estelí avanza y estará listo en 2026"],
  ["Netflix prepara precuela de The Crown sobre origen Windsor", "Netflix anuncia precuela de The Crown sobre familia real británica"],
  ["Revolución en los Óscar: La Academia blinda el mérito humano frente a la IA", "Academia de Hollywood limita uso de IA en películas para los Óscar"],
  ["Autoridades reportan 70 accidentes de tránsito durante abril", "Abril registra 70 accidentes de tránsito en Nicaragua"],
  ["Frutinovelas: fenómeno viral de IA que genera debate digital", "Fenómeno viral de frutinovelas genera debate sobre IA en redes"],
  ["Tensión en Wall Street: Activistas intentan encadenarse a la Bolsa", "Activistas intentan bloquear Wall Street en protesta climática"],
  ["Autoridades investigan incidente de tránsito en Larreynaga", "Accidente de tránsito en Larreynaga deja heridos y daños"],
];

async function main() {
  const db = getAdminDb();
  let updated = 0;
  let notFound = 0;

  for (const [oldTitle, newTitle] of TITLES) {
    try {
      const snap = await db.collection('noticias').where('titulo', '==', oldTitle).limit(1).get();
      if (snap.empty) {
        console.log(`❌ NOT FOUND: "${oldTitle}"`);
        notFound++;
        continue;
      }
      const doc = snap.docs[0];
      await doc.ref.update({ titulo: newTitle });
      console.log(`✅ UPDATED: "${oldTitle}" → "${newTitle}"`);
      updated++;
    } catch (err) {
      console.error(`❌ ERROR updating "${oldTitle}":`, err);
    }
  }

  console.log(`\n--- RESUMEN ---`);
  console.log(`Actualizados: ${updated}`);
  console.log(`No encontrados: ${notFound}`);
  console.log(`Total: ${TITLES.length}`);
}

main().catch(console.error);
