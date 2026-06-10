import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const GEMINI_KEY = 'AIzaSyC7uL9x2kQ8rTm3vN5w7pKs1jH4zG8';

async function expandWithGemini(titulo: string, contenidoCorto: string): Promise<string> {
  const prompt = `Eres redactor de "Nicaragua Infórmate". Expande esta noticia a 500 palabras con estilo Reuters/AP.

REGLAS ESTRICTAS:
- NO uses: además, sin embargo, no obstante, para finalizar, finalmente, por otro lado, es importante destacar, cabe señalar, en conclusión, por lo tanto, de igual manera, en este sentido, en tanto que, por ende, consecuentemente
- NO uses palabras emocionales: tragedia, trágico, lamentablemente, tristemente, desgraciadamente, consternación, conmoción, profundo dolor
- Incluye CITAS TEXTUALES con comillas y nombre de personas ficticias pero realistas nicaragüenses
- Incluye datos concretos: edades, horas, lugares reales de Nicaragua (Managua, León, Granada, Masaya, Chinandega, etc.)
- Usa verbos de fuente: indicó, manifestó, precisó, confirmó, reportó, señaló
- Divide en secciones con <h2> descriptivos
- Estilo directo, objetivo, periodístico

TÍTULO: ${titulo}
CONTENIDO CORTO: ${contenidoCorto}

Genera solo el HTML del cuerpo de la noticia. NO incluyas el título. Usa <p> para párrafos y <h2> para subtítulos.`;

  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
    })
  });

  if (!resp.ok) throw new Error(`Gemini error: ${resp.status}`);
  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Clean markdown code blocks
  return text.replace(/```html/g, '').replace(/```/g, '').trim();
}

export async function POST() {
  try {
    // Test Gemini first
    const testResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Hola' }] }] })
    });
    if (!testResp.ok) {
      const testErr = await testResp.text();
      return NextResponse.json({ error: `Gemini API key inválida o falló: ${testResp.status} - ${testErr}` }, { status: 500 });
    }

    const db = getAdminDb();
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();
    
    const emptyArticles = snap.docs
      .map(d => ({ id: d.id, data: d.data() as any }))
      .filter(d => !d.data.contenido || d.data.contenido.length < 500);

    if (emptyArticles.length === 0) {
      return NextResponse.json({ message: 'No quedan noticias vacías', restored: 0 });
    }

    // Process max 5 per request to avoid timeout
    const batch = emptyArticles.slice(0, 5);
    const results: { id: string; titulo: string; status: string; error?: string }[] = [];

    for (const article of batch) {
      try {
        const titulo = article.data.titulo || '';
        const contenidoCorto = article.data.contenido || article.data.resumen || '';
        
        console.log(`[AutoRestore] Processing: ${article.id} - ${titulo} - content length: ${(contenidoCorto || '').length}`);
        
        const expanded = await expandWithGemini(titulo, contenidoCorto);
        
        console.log(`[AutoRestore] Generated ${expanded.length} chars for ${article.id}`);
        
        await db.doc(`noticias/${article.id}`).update({
          contenido: expanded,
          restauradoEn: new Date().toISOString(),
        });

        results.push({ id: article.id, titulo, status: 'restored' });
      } catch (err: any) {
        console.error(`[AutoRestore] Error for ${article.id}:`, err.message);
        results.push({ id: article.id, titulo: article.data.titulo, status: 'error', error: err.message });
      }
    }

    return NextResponse.json({ 
      restored: results.filter(r => r.status === 'restored').length,
      totalRemaining: emptyArticles.length,
      processed: results,
      debug: emptyArticles.map(a => ({ id: a.id, titulo: a.data.titulo, contentLen: (a.data.contenido || '').length }))
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
