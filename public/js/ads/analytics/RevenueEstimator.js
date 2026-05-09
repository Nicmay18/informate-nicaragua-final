/**
 * RevenueEstimator - Estimación de ingresos por publicidad
 * Calcula revenue esperado basado en métricas reales
 */
class RevenueEstimator {
  constructor(options = {}) {
    // Tasas base para Nicaragua (conservadoras)
    this.rates = {
      cpm: options.cpm || 1.50,        // $1.50 CPM base
      cpc: options.cpc || 0.15,        // $0.15 CPC base
      viewableCPM: options.viewableCPM || 2.00, // $2.00 vCPM
      ...options.rates
    };

    // Multiplicadores por categoría
    this.categoryMultipliers = {
      'finanzas': 2.5,
      'tecnología': 2.0,
      'educación': 1.8,
      'salud': 1.7,
      'inmobiliaria': 1.6,
      'automotriz': 1.5,
      'turismo': 1.4,
      'gastronomía': 1.3,
      'general': 1.0
    };

    // Multiplicadores por dispositivo
    this.deviceMultipliers = {
      'desktop': 1.3,
      'tablet': 1.1,
      'mobile': 1.0
    };

    // Multiplicadores por engagement
    this.engagementMultipliers = {
      'high': 1.5,
      'medium': 1.2,
      'low': 0.8
    };

    this.metrics = {
      totalImpressions: 0,
      viewableImpressions: 0,
      clicks: 0,
      estimatedRevenue: 0,
      bySlot: new Map(),
      byCategory: new Map()
    };
  }

  /**
   * Calcular revenue de una impresión
   */
  calculateImpressionRevenue(data = {}) {
    const {
      isViewable = false,
      category = 'general',
      device = 'mobile',
      engagement = 'medium',
      position = 'standard'
    } = data;

    // Base rate
    let rate = isViewable ? this.rates.viewableCPM : this.rates.cpm;

    // Aplicar multiplicadores
    rate *= this.categoryMultipliers[category] || 1.0;
    rate *= this.deviceMultipliers[device] || 1.0;
    rate *= this.engagementMultipliers[engagement] || 1.0;

    // Bonus por posición premium
    if (position === 'header' || position === 'sticky-footer') {
      rate *= 1.2;
    }

    // Convertir CPM a revenue por impresión
    return rate / 1000;
  }

  /**
   * Calcular revenue de un click
   */
  calculateClickRevenue(data = {}) {
    const {
      category = 'general',
      device = 'mobile',
      engagement = 'medium'
    } = data;

    let rate = this.rates.cpc;

    // Aplicar multiplicadores
    rate *= this.categoryMultipliers[category] || 1.0;
    rate *= this.deviceMultipliers[device] || 1.0;
    rate *= this.engagementMultipliers[engagement] || 1.0;

    return rate;
  }

  /**
   * Registrar impresión y calcular revenue
   */
  trackImpression(slotId, data = {}) {
    this.metrics.totalImpressions++;

    if (data.isViewable) {
      this.metrics.viewableImpressions++;
    }

    // Calcular revenue
    const revenue = this.calculateImpressionRevenue(data);
    this.metrics.estimatedRevenue += revenue;

    // Actualizar métricas por slot
    this.updateSlotMetrics(slotId, { impressions: 1, revenue });

    // Actualizar métricas por categoría
    if (data.category) {
      this.updateCategoryMetrics(data.category, { impressions: 1, revenue });
    }

    return revenue;
  }

  /**
   * Registrar click y calcular revenue
   */
  trackClick(slotId, data = {}) {
    this.metrics.clicks++;

    // Calcular revenue
    const revenue = this.calculateClickRevenue(data);
    this.metrics.estimatedRevenue += revenue;

    // Actualizar métricas por slot
    this.updateSlotMetrics(slotId, { clicks: 1, revenue });

    // Actualizar métricas por categoría
    if (data.category) {
      this.updateCategoryMetrics(data.category, { clicks: 1, revenue });
    }

    return revenue;
  }

  /**
   * Actualizar métricas por slot
   */
  updateSlotMetrics(slotId, delta) {
    const current = this.metrics.bySlot.get(slotId) || {
      impressions: 0,
      clicks: 0,
      revenue: 0
    };

    this.metrics.bySlot.set(slotId, {
      impressions: current.impressions + (delta.impressions || 0),
      clicks: current.clicks + (delta.clicks || 0),
      revenue: current.revenue + (delta.revenue || 0)
    });
  }

  /**
   * Actualizar métricas por categoría
   */
  updateCategoryMetrics(category, delta) {
    const current = this.metrics.byCategory.get(category) || {
      impressions: 0,
      clicks: 0,
      revenue: 0
    };

    this.metrics.byCategory.set(category, {
      impressions: current.impressions + (delta.impressions || 0),
      clicks: current.clicks + (delta.clicks || 0),
      revenue: current.revenue + (delta.revenue || 0)
    });
  }

  /**
   * Obtener métricas globales
   */
  getMetrics() {
    const ctr = this.metrics.totalImpressions > 0
      ? (this.metrics.clicks / this.metrics.totalImpressions) * 100
      : 0;

    const viewabilityRate = this.metrics.totalImpressions > 0
      ? (this.metrics.viewableImpressions / this.metrics.totalImpressions) * 100
      : 0;

    const rpm = this.metrics.viewableImpressions > 0
      ? (this.metrics.estimatedRevenue / this.metrics.viewableImpressions) * 1000
      : 0;

    return {
      totalImpressions: this.metrics.totalImpressions,
      viewableImpressions: this.metrics.viewableImpressions,
      clicks: this.metrics.clicks,
      estimatedRevenue: this.metrics.estimatedRevenue,
      ctr: ctr.toFixed(2),
      viewabilityRate: viewabilityRate.toFixed(1),
      rpm: rpm.toFixed(2)
    };
  }

  /**
   * Obtener métricas por slot
   */
  getSlotMetrics(slotId) {
    const metrics = this.metrics.bySlot.get(slotId);
    if (!metrics) return null;

    const ctr = metrics.impressions > 0
      ? (metrics.clicks / metrics.impressions) * 100
      : 0;

    return {
      ...metrics,
      ctr: ctr.toFixed(2),
      rpm: metrics.impressions > 0
        ? ((metrics.revenue / metrics.impressions) * 1000).toFixed(2)
        : 0
    };
  }

  /**
   * Obtener top slots por revenue
   */
  getTopSlots(limit = 5) {
    return Array.from(this.metrics.bySlot.entries())
      .map(([slotId, metrics]) => ({
        slotId,
        ...metrics,
        ctr: metrics.impressions > 0
          ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2)
          : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /**
   * Obtener métricas por categoría
   */
  getCategoryMetrics() {
    return Array.from(this.metrics.byCategory.entries())
      .map(([category, metrics]) => ({
        category,
        ...metrics,
        ctr: metrics.impressions > 0
          ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2)
          : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Proyectar revenue mensual
   */
  projectMonthlyRevenue(dailyPageViews, adsPerPage = 4) {
    const dailyImpressions = dailyPageViews * adsPerPage;
    const monthlyImpressions = dailyImpressions * 30;

    // Asumir tasas promedio
    const avgViewabilityRate = 0.65; // 65% viewability
    const avgCTR = 0.005; // 0.5% CTR

    const viewableImpressions = monthlyImpressions * avgViewabilityRate;
    const clicks = monthlyImpressions * avgCTR;

    // Calcular revenue
    const impressionRevenue = (viewableImpressions / 1000) * this.rates.viewableCPM;
    const clickRevenue = clicks * this.rates.cpc;

    return {
      monthlyPageViews: dailyPageViews * 30,
      monthlyImpressions,
      viewableImpressions: Math.round(viewableImpressions),
      estimatedClicks: Math.round(clicks),
      estimatedRevenue: impressionRevenue + clickRevenue,
      breakdown: {
        fromImpressions: impressionRevenue,
        fromClicks: clickRevenue
      }
    };
  }

  /**
   * Calcular revenue por 1000 visitas
   */
  calculateRPM(pageViews, adsPerPage = 4) {
    const projection = this.projectMonthlyRevenue(pageViews / 30, adsPerPage);
    return (projection.estimatedRevenue / projection.monthlyPageViews) * 1000;
  }

  /**
   * Resetear métricas
   */
  reset() {
    this.metrics = {
      totalImpressions: 0,
      viewableImpressions: 0,
      clicks: 0,
      estimatedRevenue: 0,
      bySlot: new Map(),
      byCategory: new Map()
    };
  }
}

window.RevenueEstimator = RevenueEstimator;
