/**
 * InArticleAdSlot - Anuncio nativo dentro del flujo de lectura
 */
class InArticleAdSlot extends BaseAdSlot {
  constructor(element, config) {
    super(element, config);
    this.type = 'in-article';
  }

  setupAdAttributes() {
    // Estilo que parece parte del contenido pero es claramente ad
    this.element.style.cssText = `
      margin: 24px 0;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    `;
    
    this.insElement.style.minHeight = '250px';
  }

  getAdFormat() {
    return 'fluid'; // Nativo, se adapta al contenido
  }
}

window.InArticleAdSlot = InArticleAdSlot;
