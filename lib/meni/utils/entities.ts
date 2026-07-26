export function extractNamedEntities(texto: string) {
  const t = texto || '';
  const nombresPropios = [...t.matchAll(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2}\b/g)]
    .map(m => m[0])
    .filter(s => !/^(El|La|Los|Las|Un|Una|De|Del|En|Y|O|A|Se|Al|Por|Para|Con|Sin|Sobre|Entre|Desde|Hasta|Según|Cabe|Bajo|Tras|Más|Menos|Durante|Mediante|Hacia|Contra|Excepto|Salvo)\b/.test(s))
    .slice(0, 20);

  const instituciones = [...t.matchAll(/\b(?:Gobierno|Ministerio|Asamblea|Corte|Tribunal|Policía|Fuerza|Brigada|Hospital|Universidad|Colegio|Empresa|Banco|Cooperativa|Alcaldía|INSS|Minsa|Mific|Mige|CSE|FISE|Fsln|Unión|Organización|Federación|Asociación|Cámara|Comité|Instituto|Centro)\s+(?:Nacional|Central|Municipal|de\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)?/g)]
    .map(m => m[0])
    .slice(0, 10);

  const lugares = [...t.matchAll(/\b(?:Managua|León|Granada|Masaya|Estelí|Chinandega|Matagalpa|Jinotega|Rivas|Bluefields|Puerto Cabezas|Boaco|Juigalpa|Madriz|Nueva Segovia|Carazo|Río San Juan|Managua|Nicaragua|Centroamérica|Honduras|Costa Rica|El Salvador|Guatemala|Panamá|México|Estados Unidos|Venezuela|Colombia|España)\b/g)]
    .map(m => m[0]);

  const fechas = [...t.matchAll(/\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi)]
    .map(m => m[0]);

  const cifras = [...t.matchAll(/\b(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(?:%|por ciento|millones|mil|docenas|cuadrillones)?\b/gi)]
    .map(m => m[0])
    .slice(0, 20);

  return { nombresPropios, instituciones, lugares, fechas, cifras };
}
