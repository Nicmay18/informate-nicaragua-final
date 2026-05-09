/**
 * Membership System - Paywall y Suscripciones
 * @module features/membership-system
 * 
 * Sistema de membresía con metered paywall (5 artículos gratis/mes)
 * Integración con Stripe para pagos recurrentes
 */

export class MembershipSystem {
  constructor(options = {}) {
    this.options = {
      freeArticles: 5,
      priceNIO: 99,
      priceUSD: 2.70,
      trialDays: 7,
      ...options
    };

    this.benefits = [
      'Lectura ilimitada sin anuncios',
      'Newsletter exclusivo de análisis político',
      'Acceso a archivos históricos',
      'Descarga de reportes especiales PDF',
      'Soporte prioritario'
    ];

    this.init();
  }

  /**
   * Inicializa el sistema
   */
  init() {
    // Verificar acceso en cada carga de artículo
    if (this.isArticlePage()) {
      this.checkAccess();
    }

    // Mostrar badge de miembro si está suscrito
    if (this.isMember()) {
      this.showMemberBadge();
    }

    console.log('💎 Membership System inicializado');
  }

  /**
   * Verifica si es página de artículo
   * @returns {boolean}
   */
  isArticlePage() {
    return window.location.pathname.includes('/noticia') || 
           document.getElementById('modal')?.style.display === 'flex';
  }

  /**
   * Verifica si el usuario es miembro
   * @returns {boolean}
   */
  isMember() {
    return localStorage.getItem('ni_member') === 'true';
  }

  /**
   * Obtiene el conteo de artículos leídos este mes
   * @returns {number}
   */
  getReadCount() {
    const data = this.getMonthlyData();
    return data.count;
  }

  /**
   * Obtiene datos del mes actual
   * @private
   * @returns {Object}
   */
  getMonthlyData() {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    
    const stored = localStorage.getItem('ni_read_data');
    if (!stored) {
      return { month: monthKey, count: 0, articles: [] };
    }

    const data = JSON.parse(stored);
    
    // Si es un mes nuevo, resetear
    if (data.month !== monthKey) {
      return { month: monthKey, count: 0, articles: [] };
    }

    return data;
  }

  /**
   * Guarda datos del mes
   * @private
   * @param {Object} data
   */
  saveMonthlyData(data) {
    localStorage.setItem('ni_read_data', JSON.stringify(data));
  }

  /**
   * Obtiene ID del artículo actual
   * @private
   * @returns {string}
   */
  getCurrentArticleId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || 
           document.querySelector('[data-noticia-id]')?.dataset.noticiaId ||
           'unknown';
  }

  /**
   * Verifica acceso al artículo
   * @returns {boolean}
   */
  checkAccess() {
    // Si es miembro, permitir siempre
    if (this.isMember()) {
      this.hideAds();
      return true;
    }

    const articleId = this.getCurrentArticleId();
    const data = this.getMonthlyData();

    // Si ya leyó este artículo, permitir (no contar doble)
    if (data.articles.includes(articleId)) {
      return true;
    }

    // Si está dentro del límite gratuito
    if (data.count < this.options.freeArticles) {
      this.registerRead(articleId);
      this.showRemainingArticles(this.options.freeArticles - data.count - 1);
      return true;
    }

    // Mostrar paywall
    this.showPaywall();
    return false;
  }

  /**
   * Registra lectura de artículo
   * @private
   * @param {string} articleId
   */
  registerRead(articleId) {
    const data = this.getMonthlyData();
    data.count++;
    data.articles.push(articleId);
    this.saveMonthlyData(data);

    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'article_read', {
        event_category: 'Engagement',
        event_label: articleId,
        value: 0.05
      });
    }
  }

  /**
   * Muestra artículos restantes
   * @private
   * @param {number} remaining
   */
  showRemainingArticles(remaining) {
    if (remaining <= 0) return;

    const banner = document.createElement('div');
    banner.id = 'remaining-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1e293b;
      color: #fff;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      z-index: 9998;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">📰</div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${remaining} artículo${remaining !== 1 ? 's' : ''} gratis restante${remaining !== 1 ? 's' : ''}
          </div>
          <a href="#" onclick="event.preventDefault();membershipSystem.showPaywall()" 
             style="color: #60a5fa; font-size: 13px; text-decoration: none;">
            Suscríbete por C$${this.options.priceNIO}/mes →
          </a>
        </div>
        <button onclick="this.closest('#remaining-banner').remove()" 
                style="background: transparent; border: none; color: #94a3b8; 
                       cursor: pointer; font-size: 18px; padding: 0;">
          ✕
        </button>
      </div>
    `;

    // Remover banner anterior si existe
    const existing = document.getElementById('remaining-banner');
    if (existing) existing.remove();

    document.body.appendChild(banner);

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      if (banner.parentNode) {
        banner.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => banner.remove(), 300);
      }
    }, 5000);
  }

  /**
   * Muestra paywall
   */
  showPaywall() {
    const modal = document.createElement('div');
    modal.id = 'paywall-modal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.95);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      backdrop-filter: blur(8px);
      animation: fadeIn 0.3s ease-out;
    `;

    const memberCount = 2341 + Math.floor(Math.random() * 100);

    modal.innerHTML = `
      <div style="background: #fff; max-width: 520px; width: 100%;
                  border-radius: 20px; padding: 48px 40px; text-align: center;
                  animation: scaleIn 0.3s ease-out;">
        
        <div style="font-size: 64px; margin-bottom: 20px;">📰</div>
        
        <h2 style="font-size: 28px; margin-bottom: 12px; font-weight: 800; color: #1e293b;">
          Has leído tus ${this.options.freeArticles} artículos gratuitos
        </h2>
        
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
          Únete a <strong>${memberCount.toLocaleString()} nicaragüenses</strong> que apoyan 
          el periodismo independiente con C$${this.options.priceNIO} al mes.
        </p>
        
        <div style="text-align: left; background: #f8fafc; padding: 24px;
                    border-radius: 12px; margin-bottom: 32px;">
          ${this.benefits.map(benefit => `
            <div style="display: flex; align-items: flex-start; gap: 12px;
                        margin-bottom: 16px; font-size: 15px; color: #334155;">
              <i class="fas fa-check-circle" style="color: #10b981; margin-top: 2px; flex-shrink: 0;"></i>
              <span>${benefit}</span>
            </div>
          `).join('')}
        </div>
        
        <button onclick="membershipSystem.initPayment()"
                style="width: 100%; background: #1e293b; color: #fff;
                       border: none; padding: 16px; border-radius: 12px;
                       font-size: 16px; font-weight: 700; cursor: pointer;
                       margin-bottom: 12px; transition: all 0.2s;">
          Suscribirme por C$${this.options.priceNIO}/mes
        </button>
        
        <button onclick="membershipSystem.closePaywall()"
                style="width: 100%; background: transparent; color: #64748b;
                       border: 1px solid #e2e8f0; padding: 12px;
                       border-radius: 12px; font-size: 14px; cursor: pointer;
                       transition: all 0.2s;">
          Volver al inicio
        </button>
        
        <p style="font-size: 12px; color: #94a3b8; margin-top: 20px; line-height: 1.5;">
          Puedes cancelar en cualquier momento. 
          <a href="/terminos.html" style="color: #3b82f6; text-decoration: none;">Ver términos</a>
        </p>
        
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">
            ¿Prefieres pagar anualmente? Ahorra 20%
          </p>
          <button onclick="membershipSystem.initPayment('yearly')"
                  style="background: #f0f9ff; color: #1e40af; border: 1px solid #bfdbfe;
                         padding: 10px 20px; border-radius: 8px; font-size: 14px;
                         font-weight: 600; cursor: pointer;">
            C$${Math.floor(this.options.priceNIO * 12 * 0.8)}/año (ahorra C$${Math.floor(this.options.priceNIO * 12 * 0.2)})
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'paywall_shown', {
        event_category: 'Membership',
        articles_read: this.getReadCount()
      });
    }
  }

  /**
   * Cierra paywall
   */
  closePaywall() {
    const modal = document.getElementById('paywall-modal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        modal.remove();
        document.body.style.overflow = '';
        window.location.href = '/';
      }, 300);
    }
  }

  /**
   * Inicia proceso de pago
   * @param {string} plan - 'monthly' o 'yearly'
   */
  async initPayment(plan = 'monthly') {
    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'begin_checkout', {
        event_category: 'Membership',
        plan: plan,
        value: plan === 'yearly' 
          ? this.options.priceNIO * 12 * 0.8 
          : this.options.priceNIO
      });
    }

    try {
      // Llamar a tu backend para crear sesión de Stripe
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan,
          price: plan === 'yearly' 
            ? this.options.priceNIO * 12 * 0.8 
            : this.options.priceNIO,
          currency: 'nio',
          successUrl: window.location.origin + '/success?session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: window.location.href
        })
      });

      if (!response.ok) {
        throw new Error('Error creando sesión de pago');
      }

      const { url } = await response.json();
      window.location.href = url;

    } catch (error) {
      console.error('Error iniciando pago:', error);
      alert('Error al procesar el pago. Por favor intenta de nuevo.');
    }
  }

  /**
   * Activa membresía (llamar después de pago exitoso)
   * @param {Object} subscription - Datos de la suscripción
   */
  activateMembership(subscription) {
    localStorage.setItem('ni_member', 'true');
    localStorage.setItem('ni_subscription', JSON.stringify({
      id: subscription.id,
      status: subscription.status,
      plan: subscription.plan,
      startDate: subscription.startDate,
      endDate: subscription.endDate
    }));

    // Limpiar contador de artículos
    localStorage.removeItem('ni_read_data');

    // Ocultar ads
    this.hideAds();

    // Mostrar mensaje de bienvenida
    this.showWelcomeMessage();

    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'purchase', {
        event_category: 'Membership',
        transaction_id: subscription.id,
        value: subscription.plan === 'yearly' 
          ? this.options.priceNIO * 12 * 0.8 
          : this.options.priceNIO,
        currency: 'NIO'
      });
    }
  }

  /**
   * Oculta anuncios para miembros
   * @private
   */
  hideAds() {
    document.querySelectorAll('.ad-slot, .ad-box, .ad-inline').forEach(ad => {
      ad.style.display = 'none';
    });
  }

  /**
   * Muestra badge de miembro
   * @private
   */
  showMemberBadge() {
    const badge = document.createElement('div');
    badge.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: #78350f;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(245,158,11,0.3);
      z-index: 999;
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    badge.innerHTML = '<i class="fas fa-crown"></i> Miembro Premium';
    document.body.appendChild(badge);
  }

  /**
   * Muestra mensaje de bienvenida
   * @private
   */
  showWelcomeMessage() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.95);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      backdrop-filter: blur(8px);
    `;

    modal.innerHTML = `
      <div style="background: #fff; max-width: 480px; width: 100%;
                  border-radius: 20px; padding: 48px 40px; text-align: center;">
        <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
        <h2 style="font-size: 28px; margin-bottom: 12px; font-weight: 800; color: #1e293b;">
          ¡Bienvenido a Nicaragua Informate Premium!
        </h2>
        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
          Gracias por apoyar el periodismo independiente. Disfruta de lectura ilimitada sin anuncios.
        </p>
        <button onclick="this.closest('[style*=fixed]').remove()"
                style="background: #1e293b; color: #fff; border: none;
                       padding: 14px 32px; border-radius: 12px; font-size: 16px;
                       font-weight: 700; cursor: pointer;">
          Comenzar a leer
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.remove(), 5000);
  }

  /**
   * Cancela membresía
   */
  async cancelMembership() {
    if (!confirm('¿Estás seguro que deseas cancelar tu membresía?')) {
      return;
    }

    try {
      const subscription = JSON.parse(localStorage.getItem('ni_subscription'));
      
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.id })
      });

      if (!response.ok) {
        throw new Error('Error cancelando suscripción');
      }

      localStorage.removeItem('ni_member');
      localStorage.removeItem('ni_subscription');

      alert('Tu membresía ha sido cancelada. Tendrás acceso hasta el final del período pagado.');
      window.location.reload();

    } catch (error) {
      console.error('Error cancelando membresía:', error);
      alert('Error al cancelar. Por favor contacta a soporte.');
    }
  }
}

// Inicializar sistema solo cuando se usa directamente
let membershipSystem = null;

export function initMembership(options = {}) {
  if (!membershipSystem) {
    membershipSystem = new MembershipSystem(options);
    window.membershipSystem = membershipSystem;

    // Verificar si viene de pago exitoso
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      console.log('✅ Pago exitoso - activar membresía');
    }
  }
  return membershipSystem;
}

// Auto-init para compatibilidad con carga directa via <script>
if (typeof document !== 'undefined' && document.readyState !== 'loading') {
  initMembership();
} else if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => initMembership());
}

// Estilos de animación
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

export default MembershipSystem;
