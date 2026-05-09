/**
 * AdAnalytics - Tracking completo de rendimiento
 */
class AdAnalytics {
  constructor() {
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    // Enviar beacon antes de cerrar página
    window.addEventListener('beforeunload', () => this.sendBeacon());
  }

  track(eventName, data = {}) {
    const event = {
      name: eventName,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href,
      data: {
        ...data,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        scrollDepth: this.getScrollDepth()
      }
    };
    
    this.events.push(event);
    
    // Enviar inmediatamente si es evento importante
    if (['ad_click', 'ad_viewable'].includes(eventName)) {
      this.sendEvent(event);
    }
    
    // Guardar en localStorage para batching
    this.persistEvents();
  }

  getScrollDepth() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.min(100, Math.round((scrollTop / docHeight) * 100));
  }

  async sendEvent(event) {
    // Enviar a tu endpoint de analytics
    try {
      await fetch('/api/analytics/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true
      });
    } catch (e) {
      // Fallback: guardar para retry
      this.queueForRetry(event);
    }
  }

  sendBeacon() {
    if (this.events.length === 0) return;
    
    const payload = {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      events: this.events
    };
    
    navigator.sendBeacon?.('/api/analytics/ads-batch', 
      JSON.stringify(payload));
  }

  persistEvents() {
    // Guardar últimos 100 eventos
    const recent = this.events.slice(-100);
    localStorage.setItem('ad_analytics_queue', JSON.stringify(recent));
  }

  queueForRetry(event) {
    const queue = JSON.parse(localStorage.getItem('ad_retry_queue') || '[]');
    queue.push(event);
    localStorage.setItem('ad_retry_queue', JSON.stringify(queue));
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Métricas calculadas
  getSessionMetrics() {
    const impressions = this.events.filter(e => e.name === 'ad_loaded').length;
    const viewables = this.events.filter(e => e.name === 'ad_viewable').length;
    const clicks = this.events.filter(e => e.name === 'ad_click').length;
    
    return {
      impressions,
      viewables,
      clicks,
      viewabilityRate: impressions > 0 ? (viewables / impressions) : 0,
      ctr: impressions > 0 ? (clicks / impressions) : 0,
      estimatedRevenue: this.estimateRevenue(impressions, viewables, clicks)
    };
  }

  estimateRevenue(impressions, viewables, clicks) {
    // Estimaciones conservadoras para Nicaragua
    const cpm = 1.50; // $1.50 CPM promedio
    const cpc = 0.15; // $0.15 CPC promedio
    
    return (viewables / 1000 * cpm) + (clicks * cpc);
  }
}

window.AdAnalytics = AdAnalytics;
