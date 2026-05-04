/**
 * RefreshController - Control inteligente de refrescos de anuncios
 * Optimiza revenue sin degradar UX
 */
class RefreshController {
  constructor(options = {}) {
    this.options = {
      refreshInterval: options.refreshInterval || 30000, // 30 segundos
      maxRefreshes: options.maxRefreshes || 3, // Máximo 3 refrescos
      minViewableTime: options.minViewableTime || 5000, // 5 segundos visible antes de refrescar
      minCTR: options.minCTR || 0.001, // CTR mínimo para continuar refrescando
      pauseOnInactive: options.pauseOnInactive !== false, // Pausar en tab inactivo
      ...options
    };

    this.slots = new Map(); // slotId -> refreshData
    this.timers = new Map(); // slotId -> timer
    this.isPageActive = true;

    this.init();
  }

  init() {
    // Monitorear visibilidad de página
    if (this.options.pauseOnInactive) {
      document.addEventListener('visibilitychange', () => {
        this.isPageActive = document.visibilityState === 'visible';
        
        if (this.isPageActive) {
          this.resumeAll();
        } else {
          this.pauseAll();
        }
      });
    }

    // Monitorear performance de red
    this.monitorNetworkConditions();
  }

  /**
   * Registrar un slot para refresh
   */
  register(slotId, slot, viewabilityTracker) {
    this.slots.set(slotId, {
      slot,
      viewabilityTracker,
      refreshCount: 0,
      lastRefreshTime: null,
      performance: {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        revenue: 0
      },
      isPaused: false
    });

    console.log(`[RefreshController] Slot ${slotId} registrado`);
  }

  /**
   * Iniciar refresh automático para un slot
   */
  start(slotId) {
    const data = this.slots.get(slotId);
    if (!data || data.isPaused) return;

    // Limpiar timer existente
    this.stop(slotId);

    // Crear nuevo timer
    const timer = setInterval(() => {
      this.attemptRefresh(slotId);
    }, this.options.refreshInterval);

    this.timers.set(slotId, timer);
    console.log(`[RefreshController] Refresh iniciado para ${slotId}`);
  }

  /**
   * Intentar refrescar un slot (con validaciones)
   */
  async attemptRefresh(slotId) {
    const data = this.slots.get(slotId);
    if (!data) return;

    // Validación 1: Verificar límite de refrescos
    if (data.refreshCount >= this.options.maxRefreshes) {
      console.log(`[RefreshController] ${slotId} alcanzó límite de refrescos`);
      this.stop(slotId);
      return;
    }

    // Validación 2: Verificar que la página esté activa
    if (!this.isPageActive) {
      console.log(`[RefreshController] Página inactiva, pausando ${slotId}`);
      return;
    }

    // Validación 3: Verificar viewability
    const metrics = data.viewabilityTracker.getMetrics();
    if (!metrics.isViewable) {
      console.log(`[RefreshController] ${slotId} no es viewable, saltando refresh`);
      return;
    }

    // Validación 4: Verificar tiempo mínimo viewable
    if (metrics.totalViewableTime < this.options.minViewableTime) {
      console.log(`[RefreshController] ${slotId} no ha sido viewable suficiente tiempo`);
      return;
    }

    // Validación 5: Verificar performance (CTR)
    if (data.performance.impressions > 0 && 
        data.performance.ctr < this.options.minCTR) {
      console.log(`[RefreshController] ${slotId} tiene CTR bajo (${data.performance.ctr}), deteniendo refrescos`);
      this.stop(slotId);
      return;
    }

    // Validación 6: Verificar condiciones de red
    if (!this.isNetworkSuitable()) {
      console.log(`[RefreshController] Red no adecuada, saltando refresh`);
      return;
    }

    // Todas las validaciones pasadas - refrescar
    await this.executeRefresh(slotId);
  }

  /**
   * Ejecutar el refresh
   */
  async executeRefresh(slotId) {
    const data = this.slots.get(slotId);
    if (!data) return;

    try {
      console.log(`[RefreshController] Refrescando ${slotId} (${data.refreshCount + 1}/${this.options.maxRefreshes})`);

      // Refrescar el slot
      await data.slot.refresh();

      // Actualizar contadores
      data.refreshCount++;
      data.lastRefreshTime = Date.now();
      data.performance.impressions++;

      // Resetear viewability tracker para nueva impresión
      data.viewabilityTracker.reset();

      // Emitir evento
      this.emit('refresh', {
        slotId,
        refreshCount: data.refreshCount,
        performance: data.performance
      });

      // Si alcanzó el máximo, detener
      if (data.refreshCount >= this.options.maxRefreshes) {
        this.stop(slotId);
      }

    } catch (error) {
      console.error(`[RefreshController] Error refrescando ${slotId}:`, error);
      
      // En caso de error, pausar refrescos de este slot
      this.pause(slotId);
    }
  }

  /**
   * Actualizar performance de un slot
   */
  updatePerformance(slotId, metrics) {
    const data = this.slots.get(slotId);
    if (!data) return;

    data.performance = {
      ...data.performance,
      ...metrics
    };

    // Recalcular CTR
    if (data.performance.impressions > 0) {
      data.performance.ctr = data.performance.clicks / data.performance.impressions;
    }
  }

  /**
   * Pausar refresh de un slot
   */
  pause(slotId) {
    const data = this.slots.get(slotId);
    if (data) {
      data.isPaused = true;
    }
    this.stop(slotId);
  }

  /**
   * Reanudar refresh de un slot
   */
  resume(slotId) {
    const data = this.slots.get(slotId);
    if (data) {
      data.isPaused = false;
      this.start(slotId);
    }
  }

  /**
   * Detener timer de un slot
   */
  stop(slotId) {
    const timer = this.timers.get(slotId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(slotId);
    }
  }

  /**
   * Pausar todos los slots
   */
  pauseAll() {
    this.slots.forEach((data, slotId) => {
      this.stop(slotId);
    });
  }

  /**
   * Reanudar todos los slots
   */
  resumeAll() {
    this.slots.forEach((data, slotId) => {
      if (!data.isPaused && data.refreshCount < this.options.maxRefreshes) {
        this.start(slotId);
      }
    });
  }

  /**
   * Monitorear condiciones de red
   */
  monitorNetworkConditions() {
    // Network Information API (si está disponible)
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      connection.addEventListener('change', () => {
        console.log(`[RefreshController] Red cambió: ${connection.effectiveType}`);
        
        // Si la conexión es lenta, pausar refrescos
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          console.log('[RefreshController] Red lenta detectada, pausando refrescos');
          this.pauseAll();
        } else {
          this.resumeAll();
        }
      });
    }
  }

  /**
   * Verificar si la red es adecuada para refrescar
   */
  isNetworkSuitable() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      // No refrescar en conexiones lentas
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return false;
      }

      // No refrescar si el usuario tiene data saver activado
      if (connection.saveData) {
        return false;
      }
    }

    return true;
  }

  /**
   * Obtener estadísticas de todos los slots
   */
  getStats() {
    const stats = {
      totalSlots: this.slots.size,
      activeRefreshes: this.timers.size,
      totalRefreshes: 0,
      totalImpressions: 0,
      totalClicks: 0,
      averageCTR: 0,
      estimatedRevenue: 0
    };

    this.slots.forEach(data => {
      stats.totalRefreshes += data.refreshCount;
      stats.totalImpressions += data.performance.impressions;
      stats.totalClicks += data.performance.clicks;
      stats.estimatedRevenue += data.performance.revenue || 0;
    });

    if (stats.totalImpressions > 0) {
      stats.averageCTR = stats.totalClicks / stats.totalImpressions;
    }

    return stats;
  }

  /**
   * Emitir evento personalizado
   */
  emit(eventName, data) {
    window.dispatchEvent(new CustomEvent(`refresh-controller:${eventName}`, {
      detail: data
    }));
  }

  /**
   * Destruir controller
   */
  destroy() {
    this.pauseAll();
    this.slots.clear();
    this.timers.clear();
  }
}

window.RefreshController = RefreshController;
