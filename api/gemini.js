export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (Buffer.isBuffer(body)) body = body.toString('utf-8');
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  const { titulo, categoria, palabras = 400, notas } = body;
  if (!titulo) return res.status(400).json({ error: 'Falta el titular' });

  const GROQ_KEY = process.env.GROQ_API_KEY;
  
  // Si no hay API key, devolver mensaje instructivo pero no fallar
  if (!GROQ_KEY) {
    return res.status(200).json({ 
      success: true, 
      contenido: `[MODO MANUAL ACTIVADO]\n\nNo hay API key de Groq configurada.\n\nEscribe la noticia manualmente usando el titular: "${titulo}"\n\nCategoría: ${categoria || 'General'}\n\nNotas proporcionadas:\n${notas || 'Ninguna'}`,
      manual: true 
    });
  }

  const prompt = notas
    ? `Eres un redactor de BBC News Mundo. Tienes este titular: "${titulo}" y estas notas/información:

---
${notas}
---

Redacta una noticia profesional en español usando los datos de las notas. Estilo BBC News Mundo:
- Lead impactante con el hecho más importante
- Incluye citas textuales cuando las haya en las notas (entre comillas)
- Contexto histórico o de fondo cuando sea relevante
- Datos precisos: nombres completos, cifras, lugares exactos
- Párrafos cortos y fluidos
- Conectores narrativos naturales
- Máximo ${palabras} palabras
- Devuelve SOLO el contenido, sin título ni subtítulos`
    : `Eres un redactor de BBC News Mundo. Redacta una noticia profesional en español sobre: "${titulo}". Categoría: ${categoria || 'General'}.

- Lead con el hecho más importante
- Contexto y antecedentes relevantes
- Usa solo los datos del titular, sin inventar nombres ni lugares específicos
- Párrafos cortos y fluidos
- Máximo ${palabras} palabras
- Devuelve SOLO el contenido, sin título`;

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || `Groq status ${resp.status}`);

    const texto = data?.choices?.[0]?.message?.content;
    if (!texto) throw new Error('Respuesta vacia de Groq');

    return res.status(200).json({ success: true, contenido: texto.trim() });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
