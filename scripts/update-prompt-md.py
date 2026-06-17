import re

with open('e:/PROYECTO/informate-nicaragua-final/public/panel.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = 'const prompt = `'
end_marker = '`;'
start = content.find(start_marker) + len(start_marker)
resp_pos = content.find('const resp = await fetch', start)
end = content.rfind(end_marker, start, resp_pos)
prompt_text = content[start:end]

with open('e:/PROYECTO/informate-nicaragua-final/PROMPT-GEMINI.md', 'w', encoding='utf-8') as f:
    f.write('# PROMPT GEMINI - Nicaragua Informate (v3.0)\n\n')
    f.write('Copia y pega esto completo en tu panel de Gemini o en el campo de prompt del panel admin.\n\n')
    f.write('---\n\n')
    f.write('```\n')
    f.write(prompt_text)
    f.write('\n```\n\n')
    f.write('---\n\n')
    f.write('## INSTRUCCIONES DE USO\n\n')
    f.write('1. Copia TODO el texto entre los backticks (desde "Eres el redactor principal..." hasta el ultimo "✓ Incluye...")\n')
    f.write('2. Reemplaza los campos entre corchetes:\n')
    f.write('   - `[TITULO AQUI]` → el titular base que tienes\n')
    f.write('   - `[DEPARTAMENTO AQUI]` → Managua, Masaya, Leon, etc.\n')
    f.write('   - `[CATEGORIA AQUI]` → Sucesos, Nacionales, Deportes, Tecnologia, etc.\n')
    f.write('   - `[PEGA AQUI LA INFORMACION CRUDA]` → nota de prensa, borrador, datos que recibiste\n')
    f.write('3. Pega el prompt completo en Gemini (gemini.google.com) o en tu panel admin\n')
    f.write('4. Gemini generara la noticia con:\n')
    f.write('   - `<titular>` → titulo optimizado\n')
    f.write('   - Cuerpo en HTML con `<h2>`, `<p>`, `<strong>`, `<blockquote>`\n')
    f.write('   - `<slug>` → URL amigable\n')
    f.write('   - `<meta>` → meta descripcion SEO\n')
    f.write('   - `<keywords>` → palabras clave\n\n')
    f.write('## QUE CAMBIA CON ESTE PROMPT (v3.0)\n\n')
    f.write('| Antes (problema) | Ahora (solucion) |\n')
    f.write('|---|---|\n')
    f.write('| Gemini inventaba "Policia Nacional informo" | Protocolo forense: NO inventar fuentes. Usar solo material entregado |\n')
    f.write('| Gemini inventaba nombres de testigos | Control de entidades: NUNCA inventar nombres de victimas o testigos |\n')
    f.write('| 200-300 palabras = thin content | Longitud adaptativa: 250-450 si datos escasos, sin relleno |\n')
    f.write('| Citas inventadas | Control de citas: SI NO HAY CITAS EN EL MATERIAL, NO CREAR CITAS |\n')
    f.write('| "Segun informes preliminares" | Prohibido. Auditoria linea por linea antes de entregar |\n')
    f.write('| Identificacion forzada de victimas | Solo si familiares confirmaron. Si no: "persona de aproximadamente X anos" |\n')
    f.write('| Titulos sin datos | Titular <60 chars con dato concreto obligatorio |\n')
    f.write('| Preguntas FAQ sin respuesta | 2 preguntas que EL PROPIO TEXTO YA RESPONDE |\n')
    f.write('| HTML con bloques Markdown | HTML limpio SIN ```html ni ``` |\n')

print('PROMPT-GEMINI.md actualizado exitosamente')
