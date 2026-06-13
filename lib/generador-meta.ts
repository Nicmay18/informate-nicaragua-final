/**
 * Extrae el lead (primer parrafo significativo) del HTML
 */
function extraerLead(html: string): string {
  const parrafos = html.match(/<p>(.*?)<\/p>/g) || [];

  for (const p of parrafos) {
    const texto = p.replace(/<[^>]*>/g, '').trim();
    if (texto.length > 50) return texto;
  }

  return html.replace(/<[^>]*>/g, '').trim().slice(0, 300);
}

/**
 * Trunca texto a longitud exacta sin cortar palabras
 */
function truncarInteligente(texto: string, maxChars: number): string {
  if (texto.length <= maxChars) return texto;

  const truncado = texto.slice(0, maxChars);
  const ultimoEspacio = truncado.lastIndexOf(' ');

  if (ultimoEspacio > maxChars * 0.8) {
    return truncado.slice(0, ultimoEspacio) + '...';
  }

  return truncado + '...';
}

/**
 * Genera meta description optimizada
 */
export function generarMetaDescription(
  _titulo: string,
  contenido: string,
  categoria: string,
  palabrasClave?: string[]
): string {
  const lead = extraerLead(contenido);

  let candidato = lead;

  if (candidato.length < 120) {
    const keywords = palabrasClave?.length
      ? palabrasClave.join(', ')
      : categoria;
    candidato += ` Informacion sobre ${keywords} en Nicaragua.`;
  }

  let resultado = truncarInteligente(candidato, 157);

  if (resultado.length < 150) {
    resultado += ` Noticias de ${categoria} Nicaragua.`;
    resultado = truncarInteligente(resultado, 157);
  }

  return resultado;
}

/**
 * Genera titulo SEO optimizado (55-60 chars)
 */
export function generarTituloSEO(
  tituloOriginal: string,
  _categoria: string,
  ubicacion?: string
): string {
  let optimizado = tituloOriginal;

  if (optimizado.length > 60) {
    optimizado = truncarInteligente(optimizado, 57);
  }

  if (optimizado.length < 45 && ubicacion) {
    optimizado += ` en ${ubicacion}`;
  }

  optimizado = optimizado.replace(/\.\.\.$/, '');

  return optimizado;
}

/**
 * Extrae keywords LSI del contenido para enriquecer SEO
 */
export function extraerKeywordsContextuales(
  contenido: string,
  categoria: string
): string[] {
  const texto = contenido.toLowerCase().replace(/<[^>]*>/g, ' ');
  const keywords: string[] = [];

  const diccionario: Record<string, string[]> = {
    Sucesos: ['accidente', 'policia nacional', 'heridos', 'fallecido', 'investigacion', 'managua', 'carretera'],
    Politica: ['gobierno', 'asamblea nacional', 'ley', 'ministerio', 'presidente', 'nicaragua'],
    Economia: ['precios', 'mercado', 'exportaciones', 'cordoba', 'inflacion', 'produccion'],
    Salud: ['minsa', 'hospital', 'vacuna', 'salud', 'enfermedad', 'epidemia', 'prevencion'],
    Deportes: ['seleccion', 'futbol', 'liga', 'atleta', 'competencia', 'medalla'],
    Cultura: ['tradicion', 'festividad', 'patrimonio', 'arte', 'musica', 'danza'],
    Tecnologia: ['internet', 'digital', 'telecomunicaciones', 'redes', 'tecnologia'],
  };

  const candidatas = diccionario[categoria] || ['nicaragua', 'noticias', 'informacion'];

  for (const kw of candidatas) {
    if (texto.includes(kw)) keywords.push(kw);
  }

  const palabras = texto.split(/\s+/).filter((p) => p.length > 3);
  const bigramas: Record<string, number> = {};

  for (let i = 0; i < palabras.length - 1; i++) {
    const bigrama = `${palabras[i]} ${palabras[i + 1]}`;
    bigramas[bigrama] = (bigramas[bigrama] || 0) + 1;
  }

  const topBigramas = Object.entries(bigramas)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([bg]) => bg);

  return [...new Set([...keywords, ...topBigramas])].slice(0, 8);
}

/**
 * Genera H2 sugeridos basados en contenido real
 */
export function sugerirH2DesdeContenido(contenido: string): string[] {
  const texto = contenido.replace(/<[^>]*>/g, ' ');
  const h2s: string[] = [];

  const instituciones = texto.match(/(?:Policia Nacional|MINSA|INSS|INETER|Asamblea Nacional|Ministerio de [^,.]+)/g) || [];
  const lugares = texto.match(/(?:Managua|Leon|Granada|Masaya|Esteli|Chinandega|Matagalpa|Jinotega|Rivas|Carazo|Madriz|Nueva Segovia|Boaco|Rio San Juan|RAAN|RAAS)/g) || [];

  if (instituciones.length > 0) {
    h2s.push(`Posicion de ${instituciones[0]}`);
  }
  if (lugares.length > 0) {
    h2s.push(`Situacion en ${lugares[0]}`);
  }

  h2s.push('Hechos principales', 'Declaraciones oficiales', 'Desarrollo', 'Contexto');

  return [...new Set(h2s)].slice(0, 5);
}
