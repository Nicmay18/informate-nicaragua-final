/**
 * ContentProtection - Sistema modular de protección de contenido
 * @version 1.0.0
 * @author Nicaragua Informate
 */

class ContentProtection {
  constructor(options = {}) {
    this.config = {
      enabled: options.enabled ?? true,
      allowTextSelection: options.allowTextSelection ?? false,
      message: options.message ?? 'El contenido de Nicaragua Informate es resultado de mucho esfuerzo. Te invitamos a compartirlo usando los botones de redes sociales.',
      title: options.title ?? 'Contenido Protegido',
      shareUrl: options.shareUrl ?? window.location.href,
      siteName: options.siteName ?? 'Nicaragua Informate',
      autoCloseDelay: options.autoCloseDelay ?? 5000,
      preventContextMenu: options.preventContextMenu ?? true,
      preventCopy: options.preventCopy ?? true,
      preventKeyboardShortcuts: options.preventKeyboardShortcuts ?? true,
      preventDrag: options.preventDrag ?? true,
      showShareButtons: options.showShareButtons ?? true
    };

    if (this.config.enabled) {
      this.init();
    }
  }

  init() {
    this.addStyles();
    
    if (this.config.preventContextMenu) {
      this.preventContextMenu();
    }
    
    if (this.config.preventCopy) {
      this.preventCopy();
    }
    
    if (this.config.preventKeyboardShortcuts) {
      this.preventKeyboardShortcuts();
    }
    
    if (this.config.preventDrag) {
      this.preventDrag();
    }
    
    if (!this.config.allowTextSelection) {
      this.preventTextSelection();
    }

    console.log('🔒 Protección de contenido activada');
  }

  preventContextMenu() {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showModal();
      return false;
    }, { passive: false });
  }

  preventCopy() {
    document.addEventListener('copy', (e) => {
      e.preventDefault();
      
      // Mensaje personalizado en el clipboard
      const clipboardText = `${this.config.message}\n\nFuente: ${this.config.shareUrl}`;
      
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', clipboardText);
      }
      
      this.showModal();
      return false;
    }, { passive: false });
  }

  preventKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+C, Ctrl+X, Ctrl+U, Ctrl+S
      const isCopyPaste = e.ctrlKey && ['c', 'x', 'u', 's'].includes(e.key.toLowerCase());
      
      // F12, Ctrl+Shift+I (DevTools)
      const isDevTools = e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I');
      
      if (isCopyPaste || isDevTools) {
        e.preventDefault();
        this.showModal();
        return false;
      }
    }, { passive: false });
  }

  preventDrag() {
    document.addEventListener('dragstart', (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
        e.preventDefault();
        return false;
      }
    }, { passive: false });
  }

  preventTextSelection() {
    const style = document.createElement('style');
    style.id = 'content-protection-styles';
    style.textContent = `
      body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);
  }

  addStyles() {
    const style = document.createElement('style');
    style.id = 'content-protection-base-styles';
    style.textContent = `
      img, video, canvas {
        pointer-events: auto;
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      
      .protection-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.92);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        animation: fadeIn 0.3s ease-out;
      }
      
      .protection-modal {
        background: white;
        padding: 36px;
        border-radius: 16px;
        max-width: 480px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        animation: fadeIn 0.3s ease-out 0.1s both;
      }
      
      .protection-icon {
        font-size: 52px;
        margin-bottom: 20px;
      }
      
      .protection-title {
        color: #1e293b;
        font-size: 22px;
        margin-bottom: 14px;
        font-weight: 700;
      }
      
      .protection-message {
        color: #64748b;
        font-size: 15px;
        line-height: 1.6;
        margin-bottom: 24px;
      }
      
      .protection-buttons {
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .protection-btn {
        background: #3B82F6;
        color: white;
        border: none;
        padding: 11px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      
      .protection-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }
      
      .protection-btn-facebook {
        background: #1877f2;
      }
      
      .protection-btn-facebook:hover {
        box-shadow: 0 4px 12px rgba(24, 119, 242, 0.4);
      }
      
      .protection-btn-whatsapp {
        background: #10B981;
      }
      
      .protection-btn-whatsapp:hover {
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      }
    `;
    document.head.appendChild(style);
  }

  showModal() {
    // Evitar múltiples modales
    if (document.getElementById('protection-overlay')) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'protection-overlay';
    overlay.className = 'protection-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'protection-modal';
    
    let buttonsHTML = `
      <button class="protection-btn" onclick="document.getElementById('protection-overlay').remove()">
        Entendido
      </button>
    `;
    
    if (this.config.showShareButtons) {
      buttonsHTML += `
        <button class="protection-btn protection-btn-facebook" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent('${this.config.shareUrl}'), '_blank', 'width=600,height=400')">
          <i class="fab fa-facebook-f"></i> Compartir
        </button>
        <button class="protection-btn protection-btn-whatsapp" onclick="window.open('https://wa.me/?text=' + encodeURIComponent('📰 ${this.config.siteName}\\n\\n${this.config.shareUrl}'), '_blank')">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </button>
      `;
    }
    
    modal.innerHTML = `
      <div class="protection-icon">🔒</div>
      <h3 class="protection-title">${this.config.title}</h3>
      <p class="protection-message">${this.config.message}</p>
      <div class="protection-buttons">
        ${buttonsHTML}
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Auto-cerrar
    if (this.config.autoCloseDelay > 0) {
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.remove();
        }
      }, this.config.autoCloseDelay);
    }
    
    // Cerrar al hacer clic fuera del modal
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  destroy() {
    // Remover estilos
    const styles = document.getElementById('content-protection-styles');
    if (styles) styles.remove();
    
    const baseStyles = document.getElementById('content-protection-base-styles');
    if (baseStyles) baseStyles.remove();
    
    // Remover modal si existe
    const overlay = document.getElementById('protection-overlay');
    if (overlay) overlay.remove();
    
    console.log('🔓 Protección de contenido desactivada');
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ContentProtection = ContentProtection;
}
