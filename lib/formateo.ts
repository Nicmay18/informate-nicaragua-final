/**
 * Formatea texto plano de noticias en HTML estructurado
 * Convierte texto largo en párrafos, títulos y secciones legibles
 */

export function formatearNoticia(texto: string): string {
  if (!texto) return '';
  
  // Si ya tiene HTML, no procesar
  if (texto.includes('<')) return texto;
  
  // Dividir por párrafos naturales (doble salto de línea)
  const parrafos = texto.split(/\n\s*\n/);
  
  const parrafosFormateados = parrafos.map(p => {
    const textoLimpio = p.trim();
    if (!textoLimpio) return '';
    
    // Detectar si es un subtítulo (líneas cortas en mayúsculas)
    if (textoLimpio.length < 80 && textoLimpio === textoLimpio.toUpperCase() && !textoLimpio.includes('.')) {
      return `<h3 style="font-size: 18px; font-weight: 700; color: #111; margin: 24px 0 12px; font-family: Georgia, serif;">${textoLimpio}</h3>`;
    }
    
    // Detectar si es un título de sección
    if (textoLimpio.length < 100 && textoLimpio.endsWith(':') && textoLimpio.split(' ').length < 6) {
      return `<h4 style="font-size: 16px; font-weight: 600; color: #b91c1c; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 0.05em;">${textoLimpio}</h4>`;
    }
    
    // Párrafo normal
    return `<p style="font-size: 16px; line-height: 1.8; color: #333; margin-bottom: 16px; font-family: Georgia, Times New Roman, serif;">${textoLimpio}</p>`;
  });
  
  return parrafosFormateados.join('\n');
}

/**
 * Limpia HTML innecesario y normaliza el contenido
 */
export function limpiarHtml(html: string): string {
  if (!html) return '';
  
  return html
    // Eliminar múltiples saltos de línea
    .replace(/\n{3,}/g, '\n\n')
    // Normalizar espacios
    .replace(/ +/g, ' ')
    // Eliminar etiquetas vacías
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p><br\s*\/?>\s*<\/p>/g, '');
}

/**
 * Extrae el primer párrafo como resumen
 */
export function extraerResumen(texto: string, maxLength: number = 150): string {
  if (!texto) return '';
  
  // Si es HTML, quitar etiquetas y obtener texto plano
  const textoPlano = texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (textoPlano.length <= maxLength) return textoPlano;
  
  // Cortar en el último espacio antes del límite
  const cortado = textoPlano.substring(0, maxLength);
  const ultimoEspacio = cortado.lastIndexOf(' ');
  
  return (ultimoEspacio > 0 ? cortado.substring(0, ultimoEspacio) : cortado) + '...';
}

/**
 * Cuenta palabras del contenido
 */
export function contarPalabras(texto: string): number {
  if (!texto) return 0;
  const textoPlano = texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return textoPlano.split(' ').filter(p => p.length > 0).length;
}

/**
 * Estima tiempo de lectura
 */
export function tiempoLectura(texto: string): number {
  const palabras = contarPalabras(texto);
  const palabrasPorMinuto = 200;
  return Math.max(1, Math.ceil(palabras / palabrasPorMinuto));
}
