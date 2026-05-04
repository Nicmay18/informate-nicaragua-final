/**
 * Utilidades y helpers reutilizables
 * @module core/utils
 */

import CONFIG from './config.js';

/**
 * Formatea una fecha de Firestore a texto legible
 * @param {Object|Date|string} fecha - Fecha de Firestore
 * @returns {string} Fecha formateada
 */
export function formatearFecha(fecha) {
  if (!fecha) return "Fecha no disponible";
  
  try {
    let d;
    if (fecha.toDate) d = fecha.toDate();
    else if (fecha instanceof Date) d = fecha;
    else if (typeof fecha === 'object' && fecha.seconds) d = new Date(fecha.seconds * 1000);
    else d = new Date(fecha);
    
    const ahora = new Date();
    const diff = Math.floor((ahora - d) / 1000);
    
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    if (diff < 172800) return 'Ayer';
    
    return d.toLocaleDateString('es-NI', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    console.error('Error formateando fecha:', e);
    return "Fecha no disponible";
  }
}

/**
 * Obtiene el color de una categoría
 * @param {string} categoria - Nombre de la categoría
 * @returns {string} Color hexadecimal
 */
export function getColorCategoria(categoria) {
  return CONFIG.categories[categoria]?.color || '#0d47a1';
}

/**
 * Obtiene el icono de una categoría
 * @param {string} categoria - Nombre de la categoría
 * @returns {string} Emoji del icono
 */
export function getIconoCategoria(categoria) {
  return CONFIG.categories[categoria]?.icon || '📰';
}

/**
 * Obtiene imagen fallback para una categoría
 * @param {string} categoria - Nombre de la categoría
 * @returns {string} URL de imagen
 */
export function getFallbackImage(categoria) {
  return CONFIG.fallbackImages[categoria] || CONFIG.fallbackImages['Sucesos'];
}

/**
 * Verifica si una URL es de Facebook CDN
 * @param {string} url - URL a verificar
 * @returns {boolean}
 */
export function esFacebookCDN(url) {
  return /scontent|fbcdn\.net|facebook\.com\/photo|fburl\.com/i.test(url || '');
}

/**
 * Verifica si una URL es base64
 * @param {string} url - URL a verificar
 * @returns {boolean}
 */
export function esBase64(url) {
  return (url || '').startsWith('data:');
}

/**
 * Sanitiza una URL de imagen
 * @param {string} url - URL original
 * @param {string} seed - Seed para fallback
 * @param {string} categoria - Categoría de la noticia
 * @returns {string} URL sanitizada
 */
export function sanitizarImagen(url, seed, categoria) {
  if (!url || esFacebookCDN(url) || esBase64(url)) {
    return getFallbackImage(categoria);
  }
  return url;
}

/**
 * Convierte texto en MAYÚSCULAS a Title Case
 * @param {string} texto - Texto a convertir
 * @returns {string} Texto en Title Case
 */
export function toTitleCase(texto) {
  if (!texto) return '';
  
  // Si está todo en mayúsculas, convertir
  if (texto === texto.toUpperCase()) {
    return texto.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
  
  return texto;
}

/**
 * Trunca un texto a un número máximo de caracteres
 * @param {string} texto - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncarTexto(texto, maxLength) {
  if (!texto || texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength - 3) + '...';
}

/**
 * Calcula el tiempo de lectura estimado
 * @param {string} texto - Texto del artículo
 * @returns {number} Minutos de lectura
 */
export function calcularTiempoLectura(texto) {
  if (!texto) return 1;
  const palabras = texto.split(/\s+/).length;
  return Math.max(1, Math.ceil(palabras / 200));
}

/**
 * Debounce function
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounced
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Límite de tiempo en ms
 * @returns {Function} Función throttled
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') return text ?? '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Genera un ID único
 * @returns {string} ID único
 */
export function generarId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Formatea un número con separadores de miles
 * @param {number} num - Número a formatear
 * @returns {string} Número formateado
 */
export function formatearNumero(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.0', '') + 'M+';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'K+';
  }
  return num.toLocaleString() + '+';
}

/**
 * Copia texto al clipboard
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} True si se copió exitosamente
 */
export async function copiarAlPortapapeles(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Error copiando al portapapeles:', err);
    return false;
  }
}

/**
 * Detecta si es un dispositivo móvil
 * @returns {boolean}
 */
export function esMovil() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detecta si está en modo oscuro
 * @returns {boolean}
 */
export function esModoOscuro() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Scroll suave a un elemento
 * @param {string|HTMLElement} target - Selector o elemento
 * @param {number} offset - Offset en píxeles
 */
export function scrollTo(target, offset = 0) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return;
  
  const y = element.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

/**
 * Observa cambios en el viewport
 * @param {HTMLElement} element - Elemento a observar
 * @param {Function} callback - Callback cuando es visible
 * @param {Object} options - Opciones del IntersectionObserver
 * @returns {IntersectionObserver} Observer
 */
export function observarVisibilidad(element, callback, options = {}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, { rootMargin: '200px', ...options });
  
  observer.observe(element);
  return observer;
}

export default {
  formatearFecha,
  getColorCategoria,
  getIconoCategoria,
  getFallbackImage,
  esFacebookCDN,
  esBase64,
  sanitizarImagen,
  toTitleCase,
  truncarTexto,
  calcularTiempoLectura,
  debounce,
  throttle,
  escapeHtml,
  generarId,
  formatearNumero,
  copiarAlPortapapeles,
  esMovil,
  esModoOscuro,
  scrollTo,
  observarVisibilidad
};
