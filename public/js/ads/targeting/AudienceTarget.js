/**
 * AudienceTarget - Sistema de targeting por audiencia
 * Segmenta usuarios para mostrar anuncios más relevantes
 */
class AudienceTarget {
  constructor() {
    this.storageKey = 'audience_profile';
    this.profile = this.loadProfile();
    
    // Inicializar tracking
    this.init();
  }

  init() {
    // Actualizar perfil con datos de sesión actual
    this.updateSessionData();
    
    // Guardar perfil periódicamente
    setInterval(() => this.saveProfile(), 30000);
    
    // Guardar antes de cerrar
    window.addEventListener('beforeunload', () => this.saveProfile());
  }

  /**
   * Cargar perfil de usuario desde localStorage
   */
  loadProfile() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('[AudienceTarget] Error cargando perfil:', e);
    }

    // Perfil por defecto
    return {
      userId: this.generateUserId(),
      createdAt: Date.now(),
      sessions: 0,
      pageViews: 0,
      categories: {},
      interests: [],
      behavior: {
        avgSessionDuration: 0,
        avgScrollDepth: 0,
        returningUser: false
      },
      demographics: {
        device: this.getDeviceType(),
        language: navigator.language || 'es'
      }
    };
  }

  /**
   * Actualizar datos de sesión actual
   */
  updateSessionData() {
    this.profile.sessions++;
    this.profile.pageViews++;
    this.profile.lastVisit = Date.now();
    
    // Detectar usuario recurrente
    if (this.profile.sessions > 1) {
      this.profile.behavior.returningUser = true;
    }

    // Actualizar categoría de página actual
    const category = document.body.dataset.category || 'general';
    this.profile.categories[category] = (this.profile.categories[category] || 0) + 1;

    // Actualizar intereses basados en contenido
    this.updateInterests();

    // Tracking de comportamiento
    this.trackBehavior();
  }

  /**
   * Actualizar intereses del usuario
   */
  updateInterests() {
    const contextual = new ContextualTarget();
    const targeting = contextual.analyze();

    // Agregar keywords como intereses
    targeting.keywords.forEach(keyword => {
      if (!this.profile.interests.includes(keyword)) {
        this.profile.interests.push(keyword);
      }
    });

    // Mantener solo los 30 intereses más recientes
    if (this.profile.interests.length > 30) {
      this.profile.interests = this.profile.interests.slice(-30);
    }
  }

  /**
   * Trackear comportamiento del usuario
   */
  trackBehavior() {
    // Duración de sesión
    const sessionStart = sessionStorage.getItem('session_start') || Date.now();
    sessionStorage.setItem('session_start', sessionStart);

    // Scroll depth
    let maxScroll = 0;
    const updateScroll = () => {
      const scrollDepth = this.getScrollDepth();
      if (scrollDepth > maxScroll) {
        maxScroll = scrollDepth;
      }
    };

    window.addEventListener('scroll', updateScroll, { passive: true });

    // Guardar al salir
    window.addEventListener('beforeunload', () => {
      const duration = Date.now() - parseInt(sessionStart);
      this.updateAverages(duration, maxScroll);
    });
  }

  /**
   * Actualizar promedios de comportamiento
   */
  updateAverages(duration, scrollDepth) {
    const sessions = this.profile.sessions;
    
    // Promedio de duración de sesión
    const prevAvgDuration = this.profile.behavior.avgSessionDuration;
    this.profile.behavior.avgSessionDuration = 
      ((prevAvgDuration * (sessions - 1)) + duration) / sessions;

    // Promedio de scroll depth
    const prevAvgScroll = this.profile.behavior.avgScrollDepth;
    this.profile.behavior.avgScrollDepth = 
      ((prevAvgScroll * (sessions - 1)) + scrollDepth) / sessions;
  }

  /**
   * Obtener segmento de audiencia
   */
  getSegment() {
    const segments = [];

    // Segmento por frecuencia
    if (this.profile.sessions === 1) {
      segments.push('new_visitor');
    } else if (this.profile.sessions < 5) {
      segments.push('occasional_visitor');
    } else {
      segments.push('frequent_visitor');
    }

    // Segmento por engagement
    if (this.profile.behavior.avgSessionDuration > 120000) { // 2 minutos
      segments.push('high_engagement');
    } else if (this.profile.behavior.avgSessionDuration > 30000) { // 30 segundos
      segments.push('medium_engagement');
    } else {
      segments.push('low_engagement');
    }

    // Segmento por intereses
    const topCategory = this.getTopCategory();
    if (topCategory) {
      segments.push(`interest_${topCategory}`);
    }

    // Segmento por dispositivo
    segments.push(`device_${this.profile.demographics.device}`);

    return segments;
  }

  /**
   * Obtener categoría más visitada
   */
  getTopCategory() {
    const categories = Object.entries(this.profile.categories);
    if (categories.length === 0) return null;

    return categories.sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Obtener datos de targeting para ads
   */
  getTargetingData() {
    return {
      userId: this.profile.userId,
      segments: this.getSegment(),
      interests: this.profile.interests.slice(-10), // Últimos 10 intereses
      topCategory: this.getTopCategory(),
      returningUser: this.profile.behavior.returningUser,
      engagement: this.getEngagementLevel(),
      device: this.profile.demographics.device,
      language: this.profile.demographics.language
    };
  }

  /**
   * Calcular nivel de engagement
   */
  getEngagementLevel() {
    const avgDuration = this.profile.behavior.avgSessionDuration;
    const avgScroll = this.profile.behavior.avgScrollDepth;
    
    // Score de 0-100
    const durationScore = Math.min(100, (avgDuration / 180000) * 100); // Max 3 min
    const scrollScore = avgScroll;
    
    return Math.round((durationScore + scrollScore) / 2);
  }

  /**
   * Verificar si el usuario es de alto valor
   */
  isHighValueUser() {
    return (
      this.profile.sessions >= 5 &&
      this.profile.behavior.avgSessionDuration > 120000 &&
      this.profile.behavior.avgScrollDepth > 50
    );
  }

  /**
   * Guardar perfil en localStorage
   */
  saveProfile() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
    } catch (e) {
      console.error('[AudienceTarget] Error guardando perfil:', e);
    }
  }

  /**
   * Generar ID único de usuario
   */
  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtener tipo de dispositivo
   */
  getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Obtener scroll depth actual
   */
  getScrollDepth() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.min(100, Math.round((scrollTop / docHeight) * 100));
  }
}

window.AudienceTarget = AudienceTarget;
