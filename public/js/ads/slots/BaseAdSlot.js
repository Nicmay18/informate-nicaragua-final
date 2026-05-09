/**
 * BaseAdSlot - Clase abstracta para todos los tipos de anuncios
 */
class BaseAdSlot {
  constructor(element, config) {
    this.element = element;
    this.config = config;
    this.id = element.id;
    this.type = 'base';
    
    this.isLoaded = false;
    this.isViewable = false;
    this.isActiveView = false;
    this.viewabilityTracker = null;
    
    this.performance = {
      impressions: 0,
      clicks: 0,
      ctr: 0,
      viewableTime: 0
    };

    this.insElement = null;
  }

  configure(targeting) {
    this.targeting = targeting;
  }

  async load() {
    // Crear elemento ins de AdSense
    this.insElement = document.createElement('ins');
    this.insElement.className = 'adsbygoogle';
    this.insElement.style.display = 'block';
    
    // Configurar atributos según tipo
    this.setupAdAttributes();
    
    // Limpiar y agregar
    this.element.innerHTML = '';
    this.element.appendChild(this.insElement);
    
    // Push a AdSense
    return new Promise((resolve, reject) => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({
          params: {
            google_ad_client: this.config.adsenseClient,
            google_ad_slot: this.getAdSlot(),
            google_ad_format: this.getAdFormat(),
            google_full_width_responsive: this.isResponsive(),
            google_hints: this.targeting?.keywords?.join(',') || ''
          }
        });
        
        // Resolver después de un tiempo razonable
        setTimeout(resolve, 500);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  setupAdAttributes() {
    // Override en subclases
  }

  getAdSlot() {
    return this.element.dataset.adSlot;
  }

  getAdFormat() {
    return 'auto';
  }

  isResponsive() {
    return true;
  }

  async refresh() {
    if (!this.isLoaded) return;
    
    // Destruir y recrear para refresco limpio
    this.isLoaded = false;
    await this.load();
  }

  updateViewability(ratio) {
    this.isActiveView = ratio >= 0.5;
    
    // Actualizar clase CSS para estilos visuales opcionales
    this.element.classList.toggle('ad-viewable', this.isViewable);
    this.element.classList.toggle('ad-active-view', this.isActiveView);
  }

  getPerformanceMetrics() {
    return { ...this.performance };
  }

  showFallback() {
    // Mostrar contenido alternativo si el ad falla
    this.element.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #64748b;
                   background: #f8fafc; border-radius: 8px;">
        <div style="font-size: 24px; margin-bottom: 8px;">📰</div>
        <p style="font-size: 14px; margin: 0;">Nicaragua Informate</p>
      </div>
    `;
  }

  destroy() {
    if (this.viewabilityTracker) {
      clearInterval(this.viewabilityTracker);
    }
    this.element.innerHTML = '';
  }
}

window.BaseAdSlot = BaseAdSlot;
