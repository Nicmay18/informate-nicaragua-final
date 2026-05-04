/**
 * NewsletterWidget - Widget de suscripción al newsletter
 * Integrado con Firestore y analytics
 */
class NewsletterWidget {
  constructor(options = {}) {
    this.containerId = options.containerId || 'newsletter-widget';
    this.position = options.position || 'inline';
    this.theme = options.theme || 'dark';
    
    this.db = options.db;
    this.analytics = options.analytics;
    
    this.render();
  }
  
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    
    // Verificar si ya está suscrito
    if (localStorage.getItem('ni_newsletter_subscribed')) {
      this.renderSubscribedState(container);
      return;
    }
    
    const themes = {
      dark: this.getDarkTheme(),
      light: this.getLightTheme(),
      minimal: this.getMinimalTheme()
    };
    
    container.innerHTML = themes[this.theme];
    this.attachEvents(container);
    this.animateCounter();
  }
  
  getDarkTheme() {
    return `
      <div class="nl-widget nl-dark">
        <div class="nl-content">
          <div class="nl-icon">📧</div>
          <h3 class="nl-title">Resumen de Nicaragua</h3>
          <p class="nl-desc">Las noticias más importantes cada mañana. 5 minutos de lectura.</p>
          
          <form class="nl-form" id="nlForm">
            <div class="nl-input-group">
              <input type="email" 
                     id="nlEmail" 
                     placeholder="tu@email.com" 
                     required 
                     class="nl-input">
              <button type="submit" class="nl-btn">
                <span class="nl-btn-text">Suscribirme</span>
                <span class="nl-btn-loading" style="display:none;">...</span>
              </button>
            </div>
            
            <div class="nl-preferences" id="nlPreferences" style="display:none;">
              <p class="nl-pref-title">¿Qué te interesa?</p>
              <div class="nl-chips">
                ${['Sucesos', 'Nacionales', 'Deportes', 'Economía'].map(cat => `
                  <label class="nl-chip">
                    <input type="checkbox" value="${cat}" checked>
                    <span>${cat}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </form>
          
          <div class="nl-social-proof">
            <span class="nl-counter" id="nlCounter">2,847</span> nicaragüenses reciben el resumen
          </div>
        </div>
        
        <div class="nl-decoration"></div>
      </div>
      
      <style>
        .nl-widget { position: relative; border-radius: 16px; overflow: hidden; padding: 32px; }
        .nl-dark { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; }
        .nl-content { position: relative; z-index: 1; }
        .nl-icon { font-size: 48px; margin-bottom: 16px; }
        .nl-title { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
        .nl-desc { color: #94a3b8; font-size: 15px; margin-bottom: 24px; line-height: 1.5; }
        .nl-form { margin-bottom: 20px; }
        .nl-input-group { display: flex; gap: 12px; flex-wrap: wrap; }
        .nl-input { flex: 1; min-width: 200px; padding: 12px 16px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: #fff; font-size: 15px; }
        .nl-btn { padding: 12px 24px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .nl-btn:hover { background: #2563eb; transform: translateY(-1px); }
        .nl-preferences { margin-top: 16px; padding-top: 16px; border-top: 1px solid #334155; }
        .nl-pref-title { font-size: 13px; color: #94a3b8; margin-bottom: 12px; }
        .nl-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .nl-chip { cursor: pointer; }
        .nl-chip input { display: none; }
        .nl-chip span { display: block; padding: 6px 14px; background: #334155; border-radius: 20px; font-size: 13px; transition: all 0.2s; }
        .nl-chip input:checked + span { background: #3b82f6; }
        .nl-social-proof { font-size: 13px; color: #64748b; }
        .nl-counter { color: #3b82f6; font-weight: 700; }
        .nl-decoration { position: absolute; right: -50px; top: -50px; width: 200px; height: 200px; background: #3b82f6; opacity: 0.1; border-radius: 50%; }
      </style>
    `;
  }
  
  getLightTheme() {
    return this.getDarkTheme().replace('nl-dark', 'nl-light');
  }
  
  getMinimalTheme() {
    return `
      <div class="nl-widget nl-minimal">
        <form class="nl-form-minimal" id="nlForm">
          <input type="email" id="nlEmail" placeholder="Tu email" required>
          <button type="submit">Suscribirme</button>
        </form>
        <p class="nl-privacy">Únete a <span id="nlCounter">2,847</span> suscriptores</p>
      </div>
      <style>
        .nl-minimal { padding: 20px; background: #f8fafc; border-radius: 8px; }
        .nl-form-minimal { display: flex; gap: 8px; margin-bottom: 8px; }
        .nl-form-minimal input { flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; }
        .nl-form-minimal button { padding: 10px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .nl-privacy { font-size: 12px; color: #64748b; text-align: center; margin: 0; }
      </style>
    `;
  }
  
  attachEvents(container) {
    const form = container.querySelector('#nlForm');
    const emailInput = container.querySelector('#nlEmail');
    
    emailInput?.addEventListener('focus', () => {
      const prefs = container.querySelector('#nlPreferences');
      if (prefs) prefs.style.display = 'block';
    });
    
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit(container);
    });
  }
  
  async handleSubmit(container) {
    const email = container.querySelector('#nlEmail').value;
    const btn = container.querySelector('.nl-btn') || container.querySelector('button');
    const btnText = container.querySelector('.nl-btn-text');
    const btnLoading = container.querySelector('.nl-btn-loading');
    
    if (!this.isValidEmail(email)) {
      alert('Por favor ingresa un email válido');
      return;
    }
    
    btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline';
    
    const categories = Array.from(container.querySelectorAll('.nl-chip input:checked') || [])
      .map(cb => cb.value);
    
    try {
      const { doc, setDoc, Timestamp } = await import(
        'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
      );

      const docRef = doc(this.db, 'newsletter_subscribers', email);
      await setDoc(docRef, {
        email,
        subscribedAt: Timestamp.now(),
        preferences: {
          frequency: 'daily',
          categories: categories.length > 0 ? categories : ['Todas'],
          format: 'html'
        },
        engagement: {
          emailsSent: 0,
          emailsOpened: 0,
          linksClicked: 0,
          score: 0
        },
        status: 'active',
        metadata: {
          source: window.location.href,
          utmCampaign: this.getUtmParams(),
          device: this.getDeviceType()
        }
      });
      
      localStorage.setItem('ni_newsletter_subscribed', 'true');
      localStorage.setItem('ni_newsletter_email', email);
      
      this.analytics?.track('newsletter_subscribe', {
        email,
        categories,
        source: window.location.pathname
      });
      
      this.renderSuccess(container, email);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al suscribir. Intenta de nuevo.');
      btn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnLoading) btnLoading.style.display = 'none';
    }
  }
  
  renderSuccess(container, email) {
    container.innerHTML = `
      <div class="nl-success" style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; color: #fff;">
        <div style="font-size: 64px; margin-bottom: 16px;">🎉</div>
        <h3 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">¡Bienvenido al resumen!</h3>
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
          Revisa tu email (<strong>${email}</strong>) para confirmar tu suscripción.
        </p>
      </div>
    `;
  }
  
  renderSubscribedState(container) {
    const email = localStorage.getItem('ni_newsletter_email');
    container.innerHTML = `
      <div class="nl-subscribed" style="padding: 20px; background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 8px;">✓</div>
        <p style="margin: 0; color: #065f46; font-weight: 600;">Ya estás suscrito</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #047857;">${email}</p>
      </div>
    `;
  }
  
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  animateCounter() {
    const el = document.getElementById('nlCounter');
    if (!el) return;
    
    const target = 2847 + Math.floor(Math.random() * 50);
    let current = target - 100;
    
    const interval = setInterval(() => {
      current += Math.ceil((target - current) / 10);
      el.textContent = current.toLocaleString();
      if (current >= target) clearInterval(interval);
    }, 50);
  }
  
  getUtmParams() {
    const url = new URL(window.location.href);
    return url.searchParams.get('utm_campaign') || 'organic';
  }
  
  getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
}

window.NewsletterWidget = NewsletterWidget;
