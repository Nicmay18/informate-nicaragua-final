import fs from 'fs/promises';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
if (!GEMINI_API_KEY) {
  console.error('Falta GEMINI_API_KEY en el entorno');
  process.exit(1);
}

const filePath = path.join(process.cwd(), 'lib', 'evergreen.ts');

async function reescribirConGemini(titulo, contenido) {
  const texto = contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2500);
  const prompt = `Sos un redactor experto de guías prácticas para Nicaragua. Reescribí esta guía completa en HTML con la siguiente estructura obligatoria:

REGLAS:
1. Mínimo 600 palabras de contenido útil.
2. Comenzá con un párrafo introductorio de 35-50 palabras.
3. Mínimo 5 subtítulos <h2> descriptivos.
4. Párrafos cortos de 2-3 oraciones.
5. Incluir al menos 1 tabla o lista ordenada de pasos.
6. Incluir una sección "Preguntas frecuentes" con 3 preguntas en <h3>.
7. Incluir al final una sección "Fuentes consultadas" con atribución institucional.
8. Sin opiniones subjetivas, sin emojis en el cuerpo, sin adjetivos emocionales.
9. Estilo periodístico profesional, objetivo y verificable.
10. Devolvé SOLO el HTML interno del cuerpo, sin markdown, sin explicaciones, sin <html> ni <body>.

TÍTULO: ${titulo}
CONTENIDO ACTUAL: ${texto}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.replace(/```html|```/g, '').trim();
}

function extractGuides(source) {
  const guides = [];
  const regex = /\{\s*slug:\s*['"]([^'"]+)['"],\s*title:\s*['"]([^'"]+)['"],\s*description:\s*['"]([^'"]+)['"],\s*category:\s*['"]([^'"]+)['"],\s*author:\s*['"]([^'"]+)['"],\s*authorSlug:\s*['"]([^'"]+)['"],\s*publishedDate:\s*['"]([^'"]+)['"],\s*updatedDate:\s*['"]([^'"]+)['"],\s*content:\s*`([\s\S]*?)`,\s*faqs:\s*(\[[\s\S]*?\]),/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    guides.push({
      slug: match[1],
      title: match[2],
      description: match[3],
      category: match[4],
      author: match[5],
      authorSlug: match[6],
      publishedDate: match[7],
      updatedDate: match[8],
      content: match[9],
      faqs: match[10],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return guides;
}

async function main() {
  const source = await fs.readFile(filePath, 'utf-8');
  const guides = extractGuides(source);
  console.log(`Encontradas ${guides.length} guías`);

  let newSource = source;
  let offset = 0;

  for (const g of guides) {
    try {
      console.log(`Reescribiendo: ${g.slug}`);
      const nuevo = await reescribirConGemini(g.title, g.content);
      const escaped = nuevo.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      const replacement = `{\n      slug: '${g.slug}',\n      title: '${g.title}',\n      description: '${g.description}',\n      category: '${g.category}',\n      author: '${g.author}',\n      authorSlug: '${g.authorSlug}',\n      publishedDate: '${g.publishedDate}',\n      updatedDate: '${new Date().toISOString().split('T')[0]}',\n      content: \`${escaped}\`,\n      faqs: ${g.faqs},`;

      newSource = newSource.slice(0, g.start + offset) + replacement + newSource.slice(g.end + offset);
      offset += replacement.length - (g.end - g.start);
    } catch (err) {
      console.error(`Error en ${g.slug}:`, err.message);
    }
  }

  await fs.writeFile(filePath, newSource, 'utf-8');
  console.log('Archivo actualizado.');
}

main().catch(console.error);
