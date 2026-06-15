import { readFileSync } from 'fs';

// Leer las noticias del JSON que el usuario envio
const raw = readFileSync('./backup-noticias-2026-06-14.json', 'utf8');
const data = JSON.parse(raw);

// Buscar las 2 noticias especificas por slug
const slugs = [
  'guarda-de-seguridad-fallece-en-complejo-fabril-de-managua',
  'capturan-a-tres-sospechosos-por-homicidio-de-vigilante-en-masaya'
];

function validar(n) {
  const texto = n.contenido || '';
  const palabras = texto.trim().split(/\s+/).filter(w => w.length > 0).length;
  const parrafos = texto.split(/\n+/).filter(p => p.trim().length > 20);
  const lead = parrafos[0] || '';
  const palabrasLead = lead.trim().split(/\s+/).filter(w => w.length > 0).length;
  const tieneH2 = /<h2[^>]*>/i.test(texto);
  const tieneStrong = /<strong>/i.test(texto) || /<b>/i.test(texto);
  const tieneDatos = /\d/.test(texto);
  const citas = (texto.match(/["\u201c][^"\u201d]{8,}["\u201d]/g) || []).length;
  const atribuciones = /dijo|indic[oó]|manifest[oó]|declar[oó]|confirm[oó]|precis[oó]|explic[oó]|señal[oó]/i.test(texto);
  const blockquotes = (texto.match(/<blockquote>/g) || []).length;
  const passCitas = citas >= 1 || atribuciones || blockquotes >= 1;
  const tituloOK = (n.titulo || '').length >= 50 && (n.titulo || '').length <= 70;
  const metaOK = (n.resumen || '').length >= 150 && (n.resumen || '').length <= 170;
  const tieneImagen = n.imagenDestacada && n.imagenDestacada.length > 5;
  const aprobados = [
    palabras >= 500, palabrasLead >= 35, tieneH2, tieneStrong || tieneDatos,
    passCitas, tituloOK, metaOK, tieneImagen
  ].filter(Boolean).length;
  const nivel = aprobados >= 7 ? 'ORO' : (aprobados >= 5 ? 'PLATA' : 'BRONCE');
  return { nivel, aprobados, palabras, palabrasLead, tituloLen: (n.titulo||'').length, metaLen: (n.resumen||'').length, tieneImagen, citas, atribuciones };
}

console.log('Auditoria Forense - 2 noticias reconstruidas\n');

for (const slug of slugs) {
  const n = data.find(x => (x.slug || '').includes(slug.substring(0, 20)));
  if (!n) {
    console.log('NO ENCONTRADA: ' + slug.substring(0, 30));
    continue;
  }
  const v = validar(n);
  console.log('Titulo: ' + n.titulo);
  console.log('Slug: ' + n.slug);
  console.log('Palabras: ' + v.palabras + ' | Lead: ' + v.palabrasLead);
  console.log('Titulo chars: ' + v.tituloLen + ' | Meta chars: ' + v.metaLen);
  console.log('Citas: ' + v.citas + ' | Atribuciones: ' + v.atribuciones);
  console.log('Imagen: ' + (v.tieneImagen ? 'SI' : 'NO'));
  console.log('RESULTADO: ' + v.nivel + ' (' + v.aprobados + '/8)\n');
}

process.exit(0);
