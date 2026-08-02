import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';

export interface NiosEntity {
  id: string;
  name: string;
  type: 'persona' | 'institución' | 'hospital' | 'ministerio' | 'ciudad' | 'departamento' | 'municipio' | 'país' | 'equipo' | 'evento' | 'empresa' | 'volcán' | 'universidad' | 'programa' | 'otro';
  count: number;
  firstSeen: string;
  lastSeen: string;
  categories: string[];
  news: string[];
  guides: string[];
  mainAuthor: string;
  totalViews: number;
}

export interface KnowledgeGraph {
  entities: NiosEntity[];
  entityMap: Record<string, NiosEntity>;
}

const TYPE_PATTERNS: Record<NiosEntity['type'], string[]> = {
  persona: ['presidente', 'ministra', 'ministro', 'gobernador', 'alcaldesa', 'alcalde', 'diputado', 'senador', 'embajador', 'canciller', 'jefe', 'director', 'gerente'],
  institución: ['asamblea', 'corte', 'tribunal', 'policía', 'ejército', 'municipio', 'alcaldía', 'ministerio', 'instituto', 'banco', 'cámara', 'colegio'],
  hospital: ['hospital', 'centro de salud', 'clínica', 'siloé', 'bertha calderón', 'vivian pellas'],
  ministerio: ['ministerio de', 'minal', 'mined', 'minsa', 'mific', 'mitrade', 'miseguridad'],
  ciudad: ['managua', 'león', 'granada', 'masaya', 'estelí', 'chinandega', 'matagalpa', 'jinotega', 'rivas', 'boaco', 'juigalpa', 'carazo', 'madriz', 'nueva segovia', 'río san juan'],
  departamento: ['carazo', 'chinandega', 'estelí', 'granada', 'jinotega', 'león', 'madriz', 'managua', 'masaya', 'matagalpa', 'nueva segovia', 'rivas', 'río san juan'],
  municipio: ['municipio de', 'distrito'],
  país: ['nicaragua', 'costa rica', 'honduras', 'el salvador', 'guatemala', 'panamá', 'mexico', 'estados unidos', 'ee.uu.', 'españa', 'colombia', 'venezuela', 'brasil', 'argentina', 'chile', 'cuba', 'russia', 'china', 'ucrania'],
  equipo: ['bóer', 'dantos', 'tigres', 'leones', 'fieras', 'gigantes', 'indios', 'tiburones', 'selección de nicaragua', 'fénix', 'estelí'],
  evento: ['torneo', 'campeonato', 'concurso', 'cumbre', 'feria', 'festival', 'elecciones', 'carnaval'],
  empresa: ['banpro', 'claro', 'tigo', 'cargill', 'nestlé', 'coca-cola', 'cargill', 'alcasa', 'la prensa', 'el nuevo diario'],
  volcán: ['momotombo', 'masaya', 'mombacho', 'telica', 'san cristóbal', 'cerro negro', 'concepción', 'maderas'],
  universidad: ['universidad nacional', 'una', 'universidad católica', 'ucan', 'universidad centroamericana', 'uca', 'universidad tecnológica', 'unitec'],
  programa: ['programa', 'proyecto', 'plan nacional', 'bono', 'subsidio', 'mifamilia', 'usura cero'],
  otro: [],
};

const KNOWN_ENTITIES: Record<string, NiosEntity['type']> = {
  'Hospital Bertha Calderón': 'hospital',
  'MINSA': 'ministerio',
  'INSS': 'institución',
  'INATEC': 'institución',
  'INTUR': 'institución',
  'Banco Central de Nicaragua': 'institución',
  'Asamblea Nacional': 'institución',
  'Corte Suprema de Justicia': 'institución',
  'Policía Nacional': 'institución',
  'Ejército de Nicaragua': 'institución',
  'Nicaragua': 'país',
  'Costa Rica': 'país',
  'Honduras': 'país',
  'El Salvador': 'país',
  'Managua': 'ciudad',
  'León': 'ciudad',
  'Granada': 'ciudad',
  'Masaya': 'ciudad',
  'Estelí': 'ciudad',
  'Chinandega': 'ciudad',
  'Matagalpa': 'ciudad',
  'Rivas': 'ciudad',
  'Indios del Bóer': 'equipo',
  'Dantos de Managua': 'equipo',
  'Tigres de Chinandega': 'equipo',
  'Leones de León': 'equipo',
  'Fieras del San Fernando': 'equipo',
  'Volcán Masaya': 'volcán',
  'Momotombo': 'volcán',
};

function toDate(v: unknown): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(de|del|la|las|los|y|e|en|el)\b/g, ' ')
    .replace(/[^a-záéíóúñ0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function detectType(name: string): NiosEntity['type'] {
  const key = Object.keys(KNOWN_ENTITIES).find((k) => name.toLowerCase().includes(k.toLowerCase()));
  if (key) return KNOWN_ENTITIES[key];
  const lower = name.toLowerCase();
  for (const [type, patterns] of Object.entries(TYPE_PATTERNS)) {
    if (patterns.some((p) => lower.includes(p))) {
      return type as NiosEntity['type'];
    }
  }
  return 'otro';
}

function* extractCandidates(text: string): IterableIterator<string> {
  const properNoun = /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+(?:de|del|la|los|las|y|e)\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*/g;
  for (const match of text.matchAll(properNoun)) {
    const raw = match[0].trim();
    if (raw.length < 4) continue;
    if (raw === raw.toUpperCase() || raw === raw.toLowerCase()) continue;
    yield raw;
  }
}

export function buildKnowledgeGraph(noticias: Noticia[], guides: EvergreenArticle[] = []): KnowledgeGraph {
  const byName: Record<string, NiosEntity> = {};

  function addOrUpdate(news: Noticia, candidate: string) {
    const name = normalizeName(candidate);
    if (name.length < 3) return;
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const d = toDate(news.fecha).toISOString();
    if (!byName[id]) {
      byName[id] = {
        id,
        name,
        type: detectType(name),
        count: 0,
        firstSeen: d,
        lastSeen: d,
        categories: [],
        news: [],
        guides: [],
        mainAuthor: news.autor || 'Desconocido',
        totalViews: 0,
      };
    }
    const e = byName[id];
    e.count++;
    e.totalViews += news.vistas || 0;
    if (d < e.firstSeen) e.firstSeen = d;
    if (d > e.lastSeen) e.lastSeen = d;
    if (!e.categories.includes(news.categoria)) e.categories.push(news.categoria);
    if (!e.news.includes(news.slug)) e.news.push(news.slug);
    if (news.autor) {
      e.mainAuthor = news.autor;
    }
  }

  for (const n of noticias) {
    if (n.estado === 'borrador' || n.estado === 'archivado') continue;
    const text = `${n.titulo} ${n.resumen}`.replace(/[.,;:!?()\[\]{}]/g, ' ');

    // entidades conocidas
    for (const [known, _type] of Object.entries(KNOWN_ENTITIES)) {
      const regex = new RegExp(`\\b${known.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      if (regex.test(text)) addOrUpdate(n, known);
    }

    // nombres propios
    for (const c of extractCandidates(text)) {
      addOrUpdate(n, c);
    }
  }

  // asociar guías por similitud de nombre
  for (const g of guides) {
    for (const e of Object.values(byName)) {
      if (g.title.toLowerCase().includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(g.title.toLowerCase().split(' ')[0])) {
        if (!e.guides.includes(g.slug)) e.guides.push(g.slug);
      }
    }
  }

  const entities = Object.values(byName)
    .filter((e) => e.count >= 2 || e.totalViews >= 30)
    .sort((a, b) => b.count - a.count);

  return { entities, entityMap: byName };
}

export function searchEntities(graph: KnowledgeGraph, query: string): NiosEntity[] {
  const q = query.toLowerCase().trim();
  if (!q) return graph.entities.slice(0, 50);
  return graph.entities
    .filter((e) => e.name.toLowerCase().includes(q) || e.type.includes(q) || e.categories.some((c) => c.toLowerCase().includes(q)))
    .slice(0, 50);
}
