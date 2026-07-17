/**
 * CategoryDetector V4 — REGLA 6
 * =============================
 * Detecta la categoría del artículo de forma independiente al Editor Jefe.
 * No contiene lógica editorial. Solo clasificación por palabras clave.
 */

import type { NoticiaInput } from '../analizador-noticias';

interface CategoryPattern {
  categoria: string;
  keywords: RegExp;
  peso: number;
}

const PATRONES: CategoryPattern[] = [
  { categoria: 'Sucesos', keywords: /\b(?:accidente|incendio|robo|hurto|detenid[oa]|pandilla|homicidio|asesinato|herid[oa]|fallecid[oa]|ahogad[oa]|atropell[oa]|colisi[oó]n|desbordamient[oa]|incautaci[oó]n|decomis[oa]|fuga|explosi[oó]n|cortocircuito|estaf[ao]|pelea|altercado|allanamiento|secuestro|desaparici[oó]n|hallazgo|cuerpo|v[ií]ctima|damnificad[oa]|evacuad[oa]|rescat[ae]|aluv[ií]on|derrumbe|deslave)\b/i, peso: 3 },
  { categoria: 'Clima', keywords: /\b(?:hurac[aá]n|tormenta|depressi[oó]n\s+tropical|lluvia|sequ[ií]a|inundaci[oó]n|temperatura|calor|fr[ií]o|viento|rafaga|marea|ola\s+de\s+calor|precipitaci[oó]n|INETER|SINAPRED|COMUPRED|clima|tiempo|pron[oó]stico|alerta\s+(?:amarilla|roja|verde)|desbordamiento|r[ií]o|cuenca|volc[aá]n|sismo|terremoto|emisiones?\s+de\s+gas|calidad\s+del\s+aire|reservorio|presa|lago|canicula|temporada\s+(?:de\s+lluvia|de\s+huracanes|seca))\b/i, peso: 3 },
  { categoria: 'Deportes', keywords: /\b(?:partido|gol|campeon|campeonato|selecci[oó]n|liga|torneo|tabla\s+de\s+posiciones|entrenador|jugador|atleta|medalla|r[eé]cord|marcador|empate|victoria|derrota|goleador|penalti|penal|sets?|entradas?|inning|asalto|round|KO|boxeador|ciclista|nadador|surfer|surfista|voleibol|baloncesto|b[eé]isbol|f[uú]tbol|tenis|karate|jud[oa]|pesas|atletismo|olimp[ií]pic[oa]|pre-?mundial|eliminatoria|fichaje|[aá]rbitro|figura|MVP|estad[ií]sticas)\b/i, peso: 3 },
  { categoria: 'Tecnología', keywords: /\b(?:smartphone|laptop|tablet|app|aplicaci[oó]n|software|hardware|chip|procesador|RAM|GB|MB|GHz|pulgadas|AMOLED|5G|fibra\s+[oó]ptica|internet|red\s+social|IA|inteligencia\s+artificial|ciberseguridad|phishing|ransomware|malware|hack|startup|e-?commerce|blockchain|bitcoin|cripto|cloud|AWS|streaming|e-?sports|gaming|realidad\s+virtual|RV|VR|IoT|sensor|panel\s+solar|c[oó]digo\s+QR|CBDC|moneda\s+digital|robot|rob[oó]tica|algoritmo|API|USB|SSD|OLED|c[aá]mara|megap[ií]xeles)\b/i, peso: 3 },
  { categoria: 'Salud', keywords: /\b(?:dengue|malaria|paludismo|zika|chikungunya|covid|vacuna|vacunaci[oó]n|virus|brote|epidemia|pandemia|hospital|MINSa|salud|enfermedad|tratamiento|paciente|m[eé]dico|m[eé]dica|doctor|enfermer[oa]|diagn[oó]stico|s[ií]ntomas|prevenci[oó]n|nutrici[oó]n|diabetes|hipertensi[oó]n|c[aá]ncer|VIH|sida|mortalidad|embarazo|materno|infantil|donaci[oó]n|sangre|trasplante|fumador|tabaco|salud\s+mental|psic[oó]logo|conjuntivitis|diarrea|deshidrataci[oó]n|hidrataci[oó]n)\b/i, peso: 3 },
  { categoria: 'Espectáculos', keywords: /\b(?:concierto|festival|cine|pel[ií]cula|documental|cortometraje|teatro|obra|ballet|danza|m[uú]sica|cantante|grupo|banda|[aá]lbum|artista|pintor|exposici[oó]n|galer[ií]a|museo|carnaval|comparsa|humorista|stand-?up|telenovela|poes[ií]a|poeta|literatura|libro|feria\s+del\s+libro|Grammy|premio|streaming|Spotify|YouTube|disquera|actor|actriz|productor|director)\b/i, peso: 3 },
  { categoria: 'Economía', keywords: /\b(?:econom[ií]a|PIB|crecimiento|inflaci[oó]n|exportaci[oó]n|importaci[oó]n|Banco\s+Central|BCN|d[oó]lar|c[oó]rdoba|inversi[oó]n|finanzas|banco|cr[eé]dito|pr[eé]stamo|tasa\s+de\s+inter[eé]s|bolsa|mercado|comercio|Pyme|PYME|empresa|industrial|agroindustria|caf[eé]|az[uú]car|ganader[ií]a|arroz|frijo?l|l[aá]cteos|turismo|INTUR|hotel|hosteler[ií]a|aduanas|tratado\s+comercial|Mercosur|canasta\s+b[aá]sica)\b/i, peso: 3 },
  { categoria: 'Política', keywords: /\b(?:gobierno|presidente|vicepresidente|ministro|canciller|asamblea\s+nacional|diputad[oa]|congreso|partido\s+pol[ií]tico|elecciones|comicios|campa[nñ]a|votaci[oó]n|CSE|Consejo\s+Supremo\s+Electoral|pol[ií]tica|reforma|decreto|ley|iniciativa|legislativ[oa]|magistrad[oa]|oposici[oó]n|oficialismo|alianza|coalici[oó]n|candidat[oa]|slogan|debate)\b/i, peso: 3 },
  { categoria: 'Internacionales', keywords: /\b(?:ONU|Naciones\s+Unidas|Estados\s+Unidos|EE\.?UU\.?|China|Rusia|Ucrania|Europa|Uni[oó]n\s+Europea|UE|G20|G7|OTAN|FMI|Banco\s+Mundial|OMS|UNESCO|ACNUR|FAO|Par[ií]s|Londres|Tokio|Berl[ií]n|Madrid|Buenos\s+Aires|Brasil|Argentina|M[eé]xico|Costa\s+Rica|Honduras|El\s+Salvador|Guatemala|Panam[aá]|Jap[oó]n|Corea|India|Canad[aá]|frica|Oriente|internacional|mundial|global|cumbre|tratado|diplom[aá]tic[oa]|embajador|sanci[oó]n)\b/i, peso: 2 },
  { categoria: 'Nacionales', keywords: /\b(?:gobierno|ministerio|programa|plan|inauguraci[oó]n|obra|infraestructura|carretera|vivienda|educaci[oó]n|MINED|energ[ií]a|ENATREL|agua\s+potable|ENACAL|reforestaci[oó]n|MARENA|seguridad\s+ciudadana|Polic[ií]a\s+Nacional|producci[oó]n|agropecuario|MAG|cooperaci[oó]n|beca|censo|INEC|nacional|Managua|municipal)\b/i, peso: 1 },
  { categoria: 'Servicio', keywords: /\b(?:servicio|horario|tel[eé]fono|direcci[oó]n|requisitos?|tr[aá]mite|documento|c[oó]mo\s+hacer|gu[ií]a\s+paso\s+a\s+paso|paso\s+a\s+paso|procedimiento|instrucciones?|tips?|consejos?|recomendaciones?|checklist|lista\s+de\s+verificaci[oó]n)\b/i, peso: 3 },
];

export function detectCategory(noticia: NoticiaInput, textoPlano?: string): string {
  const texto = textoPlano || noticia.contenido.replace(/<[^>]*>/g, ' ');
  const textoCompleto = `${noticia.titulo} ${texto} ${noticia.resumen || ''}`;

  // 1. Si la categoría del input ya es válida, usarla como base
  const categoriaInput = noticia.categoria?.trim();

  // 2. Contar matches por categoría
  const scores: Record<string, number> = {};
  for (const patron of PATRONES) {
    const matches = textoCompleto.match(new RegExp(patron.keywords.source, 'gi'));
    const count = matches ? matches.length : 0;
    scores[patron.categoria] = (scores[patron.categoria] || 0) + count * patron.peso;
  }

  // 3. Bonus fuerte si la categoría del input coincide (respeta la categoría declarada)
  if (categoriaInput) {
    const catNormalizada = normalizarCategoria(categoriaInput);
    if (scores[catNormalizada] !== undefined) {
      scores[catNormalizada] += 15;
    } else {
      scores[catNormalizada] = 15;
    }
  }

  // 4. Encontrar la categoría con mayor score
  let mejorCategoria = 'Nacionales';
  let mejorScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > mejorScore) {
      mejorScore = score;
      mejorCategoria = cat;
    }
  }

  // 5. Si no hay matches significativos, usar la categoría del input o Nacionales
  if (mejorScore === 0 && categoriaInput) {
    return normalizarCategoria(categoriaInput);
  }

  return mejorCategoria;
}

function normalizarCategoria(cat: string): string {
  const map: Record<string, string> = {
    'Sucesos': 'Sucesos',
    'Nacionales': 'Nacionales',
    'Nacional': 'Nacionales',
    'Internacionales': 'Internacionales',
    'Internacional': 'Internacionales',
    'Clima': 'Clima',
    'Economia': 'Economía',
    'Economía': 'Economía',
    'Politica': 'Política',
    'Política': 'Política',
    'Tecnologia': 'Tecnología',
    'Tecnología': 'Tecnología',
    'Deportes': 'Deportes',
    'Salud': 'Salud',
    'Servicio': 'Servicio',
    'Espectaculos': 'Espectáculos',
    'Espectáculos': 'Espectáculos',
    'General': 'Nacionales',
    'Cultura': 'Espectáculos',
    'Infraestructura': 'Nacionales',
    'Judicial': 'Sucesos',
  };
  return map[cat] || cat;
}
