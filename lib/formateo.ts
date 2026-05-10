/**
 * Formatea texto plano de noticias en HTML estructurado
 * Convierte texto largo en párrafos profesionales legibles
 */

export function formatearNoticia(texto: string): string {
  if (!texto) return '';
  
  // Si ya tiene HTML, no procesar
  if (texto.includes('<')) return texto;
  
  // Limpiar el texto primero
  let textoLimpio = texto
    // Eliminar dashes多余的
    .replace(/—+/g, '')
    .replace(/–+/g, '')
    .replace(/ - /g, '. ')
    // Eliminar múltiples espacios
    .replace(/  +/g, ' ')
    // Normalizar saltos de línea
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  
  // Dividir en oraciones y reconstruir
  const oraciones = textoLimpio.split(/(?<=[.!?])\s+/);
  
  const parrafos: string[] = [];
  let parrafoActual = '';
  
  for (const oracion of oraciones) {
    const trimmed = oracion.trim();
    if (!trimmed) continue;
    
    // Primera letra mayúscula
    let corregida = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    
    // Corregir errores comunes de puntuación
    corregida = corregida
      .replace(/\s+,/g, ',')
      .replace(/,\s*$/g, '.')
      .replace(/\.{2,}/g, '.');
    
    parrafoActual += (parrafoActual ? ' ' : '') + corregida;
    
    // Nuevo párrafo cada 3-4 oraciones o si hay cambio de tema
    if (parrafoActual.length > 300 || trimmed.endsWith(':')) {
      if (parrafoActual) {
        parrafos.push(parrafoActual);
        parrafoActual = '';
      }
    }
  }
  
  // Agregar último párrafo
  if (parrafoActual) {
    parrafos.push(parrafoActual);
  }
  
  // Convertir a HTML
  const html = parrafos.map((p, i) => {
    // Detectar si es un subtítulo
    if (p.length < 80 && p === p.toUpperCase() && !p.includes('.')) {
      return `<h3 style="font-size: 18px; font-weight: 700; color: #111; margin: 24px 0 12px; font-family: Georgia, serif;">${p}</h3>`;
    }
    
    // Párrafo normal
    return `<p style="font-size: 16px; line-height: 1.8; color: #333; margin-bottom: 16px; font-family: Georgia, Times New Roman, serif;">${p}</p>`;
  }).join('\n');
  
  return html;
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
