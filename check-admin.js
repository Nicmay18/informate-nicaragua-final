const fs = require('fs');
const html = fs.readFileSync('public/admin/index.html', 'utf8');

// Extraer script module
const match = html.match(/<script[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/);
if (!match) {
  console.log('No se encontró script module');
  process.exit(1);
}

const code = match[1];
try {
  new Function(code);
  console.log('Sintaxis JS OK');
} catch (e) {
  console.error('ERROR JS:', e.message);
  const lines = code.split('\n');
  const lineMatch = e.message.match(/line (\d+)/);
  if (lineMatch) {
    const ln = parseInt(lineMatch[1]);
    console.error('Linea ' + ln + ':', lines[ln - 1]?.substring(0, 100));
  }
}
