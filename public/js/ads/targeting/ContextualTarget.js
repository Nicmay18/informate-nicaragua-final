/**
 * ContextualTarget - Sistema de targeting contextual
 * Analiza el contenido de la página para mostrar anuncios relevantes
 */
class ContextualTarget {
  constructor() {
    this.keywords = [];
    this.category = null;
    this.sentiment = 'neutral';
    this.entities = [];
    this.topics = [];
    
    // Diccionario de palabras comunes en español (stop words)
    this.stopWords = [
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
      'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
      'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
      'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin',
      'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo',
      'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
      'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella',
      'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa',
      'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte',
      'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar'
    ];

    // Categorías de contenido sensible (evitar ads)
    this.sensitiveTopics = [
      'muerte', 'asesinato', 'violencia', 'tragedia', 'accidente', 'crimen',
      'suicidio', 'guerra', 'terrorismo', 'desastre', 'pandemia', 'enfermedad'
    ];

    // Categorías de alto valor para advertisers
    this.highValueCategories = {
      'finanzas': ['banco', 'préstamo', 'inversión', 'ahorro', 'tarjeta', 'crédito'],
      'tecnología': ['smartphone', 'computadora', 'software', 'app', 'internet', 'digital'],
      'educación': ['universidad', 'curso', 'estudio', 'carrera', 'maestría', 'capacitación'],
      'salud': ['salud', 'médico', 'hospital', 'tratamiento', 'medicina', 'bienestar'],
      'inmobiliaria': ['casa', 'apartamento', 'propiedad', 'alquiler', 'venta', 'terreno'],
      'automotriz': ['carro', 'auto', 'vehículo', 'moto', 'repuesto', 'mecánico'],
      'turismo': ['viaje', 'hotel', 'turismo', 'vacaciones', 'destino', 'playa'],
      'gastronomía': ['restaurante', 'comida', 'cocina', 'chef', 'menú', 'delivery']
    };
  }

  /**
   * Analizar contenido de la página
   */
  analyze(element = document.body) {
    // Extraer texto del elemento
    const text = this.extractText(element);
    
    // Analizar diferentes aspectos
    this.keywords = this.extractKeywords(text);
    this.category = this.detectCategory(element);
    this.sentiment = this.analyzeSentiment(text);
    this.entities = this.extractEntities(text);
    this.topics = this.detectTopics(text);

    return this.getTargetingData();
  }

  /**
   * Extraer texto limpio del elemento
   */
  extractText(element) {
    // Priorizar título y contenido principal
    const title = element.querySelector('h1, h2')?.textContent || '';
    const content = element.querySelector('.article-content, article, main')?.textContent || '';
    const meta = document.querySelector('meta[name="description"]')?.content || '';

    return `${title} ${title} ${content} ${meta}`.toLowerCase();
  }

  /**
   * Extraer keywords relevantes
   */
  extractKeywords(text, maxKeywords = 15) {
    // Limpiar y tokenizar
    const words = text
      .replace(/[^\w\sáéíóúñü]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !this.stopWords.includes(word) &&
        !this.isNumber(word)
      );

    // Contar frecuencias
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Ordenar por frecuencia y relevancia
    const keywords = Object.entries(frequency)
      .map(([word, count]) => ({
        word,
        count,
        score: this.calculateKeywordScore(word, count, text)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxKeywords)
      .map(item => item.word);

    return keywords;
  }

  /**
   * Calcular score de relevancia de keyword
   */
  calculateKeywordScore(word, frequency, text) {
    let score = frequency;

    // Bonus si aparece en el título
    const title = document.querySelector('h1, h2')?.textContent.toLowerCase() || '';
    if (title.includes(word)) {
      score *= 2;
    }

    // Bonus si es una entidad (palabra capitalizada)
    if (text.includes(word.charAt(0).toUpperCase() + word.slice(1))) {
      score *= 1.5;
    }

    // Bonus si es categoría de alto valor
    Object.values(this.highValueCategories).forEach(keywords => {
      if (keywords.includes(word)) {
        score *= 3;
      }
    });

    return score;
  }

  /**
   * Detectar categoría principal
   */
  detectCategory(element) {
    // Intentar obtener de atributos data
    const dataCategory = element.dataset.category || 
                        document.body.dataset.category ||
                        element.closest('[data-category]')?.dataset.category;

    if (dataCategory) return dataCategory;

    // Detectar por keywords
    for (const [category, keywords] of Object.entries(this.highValueCategories)) {
      const matches = this.keywords.filter(kw => keywords.includes(kw));
      if (matches.length >= 2) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Analizar sentimiento del contenido
   */
  analyzeSentiment(text) {
    // Detectar contenido sensible
    const hasSensitive = this.sensitiveTopics.some(topic => 
      text.includes(topic)
    );

    if (hasSensitive) return 'negative';

    // Palabras positivas
    const positiveWords = [
      'éxito', 'ganador', 'mejor', 'excelente', 'increíble', 'feliz',
      'celebración', 'logro', 'victoria', 'premio', 'beneficio', 'oportunidad'
    ];

    const hasPositive = positiveWords.some(word => text.includes(word));
    if (hasPositive) return 'positive';

    return 'neutral';
  }

  /**
   * Extraer entidades nombradas (simplificado)
   */
  extractEntities(text) {
    const entities = [];

    // Buscar palabras capitalizadas (posibles nombres propios)
    const words = text.split(/\s+/);
    const capitalizedPattern = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/;

    words.forEach(word => {
      if (capitalizedPattern.test(word) && word.length > 3) {
        if (!entities.includes(word.toLowerCase())) {
          entities.push(word.toLowerCase());
        }
      }
    });

    return entities.slice(0, 10);
  }

  /**
   * Detectar topics principales
   */
  detectTopics(text) {
    const topics = [];

    // Detectar por categorías de alto valor
    for (const [topic, keywords] of Object.entries(this.highValueCategories)) {
      const matches = keywords.filter(kw => text.includes(kw));
      if (matches.length > 0) {
        topics.push({
          topic,
          relevance: matches.length / keywords.length,
          keywords: matches
        });
      }
    }

    return topics.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Verificar si es contenido brand-safe
   */
  isBrandSafe() {
    // No es brand-safe si tiene sentimiento negativo
    if (this.sentiment === 'negative') return false;

    // No es brand-safe si tiene topics sensibles
    const hasSensitive = this.keywords.some(kw => 
      this.sensitiveTopics.includes(kw)
    );

    return !hasSensitive;
  }

  /**
   * Obtener datos de targeting formateados
   */
  getTargetingData() {
    return {
      keywords: this.keywords,
      category: this.category,
      sentiment: this.sentiment,
      entities: this.entities,
      topics: this.topics.map(t => t.topic),
      isBrandSafe: this.isBrandSafe(),
      pageUrl: window.location.href,
      pageTitle: document.title,
      device: this.getDeviceType(),
      language: document.documentElement.lang || 'es'
    };
  }

  /**
   * Detectar tipo de dispositivo
   */
  getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Verificar si es número
   */
  isNumber(str) {
    return /^\d+$/.test(str);
  }

  /**
   * Generar hints para AdSense
   */
  generateAdSenseHints() {
    // Combinar keywords más relevantes
    const hints = [
      ...this.keywords.slice(0, 5),
      this.category,
      ...this.topics.slice(0, 3).map(t => t.topic)
    ].filter(Boolean);

    return hints.join(',');
  }
}

window.ContextualTarget = ContextualTarget;
