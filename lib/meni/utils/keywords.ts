import { slugify } from './helpers';

const STOPWORDS = new Set([
  'el','la','los','las','de','del','a','en','y','o','que','con','por','un','una','unos','unas','al','se','su','sus','para','es','son','fue','fueron','ha','han','este','esta','estos','estas','pero','como','lo','le','les','me','te','nos','lo','como','más','ya','hasta','desde','sin','sobre','entre','durante','ante','trás','según','cabe','bajo','contra','mediante','hacia','excepto','salvo','hasta','','nicaragua','informate','noticia','noticias','pais','país','mundo','año','años','mes','día','dia','hoy','ayer','mañana','segun','según','tambien','también','ademas','además','pues','si','no','ni','mas','sino','aunque','cuando','mientras','porque','pues','asi','así','tan','tanto','muy','poco','mucho','bastante','demasiado','cada','todo','todos','todas','nada','alguien','nadie','otro','otra','otros','otras','mismo','misma','mismos','mismas','cual','cuales','quien','quienes','cuyo','cuya','cuyos','cuyas','cual','cuando','donde','como','por','para','pues','aun','donde'
]);

export function extractKeywords(texto: string, max = 12): string[] {
  const clean = (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-záéíóúñ0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = clean.split(/\s+/);
  const counts = new Map<string, number>();
  for (const w of words) {
    if (w.length < 4 || STOPWORDS.has(w) || /^\d+$/.test(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }

  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([w]) => w)
    .slice(0, max);

  return sorted;
}

export function generateSlug(titulo: string): string {
  return slugify(titulo);
}
