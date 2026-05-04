/**
 * ArticleMidAdSlot - Anuncio dentro del contenido del artículo
 */
class ArticleMidAdSlot extends BaseAdSlot {
  constructor(element, config) {
    super(element, config);
    this.type = 'article-mid';
  }

  setupAdAttributes() {
    // Estilo que integra bien con contenido
    this.element.style.margin = '32px 0';
    this.element.style.textAlign = 'center';
    this.insElement.style.minHeight = '250px';
  }

  getAdFormat() {
    return 'rectangle'; // Mejor CTR que auto en medio de contenido
  }

  async load() {
    // Insertar label de "Publicidad" sutil
    const label = document.createElement('div');
    label.textContent = 'Publicidad';
    label.style.cssText = `
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      text-align: center;
    `;
    
    this.element.insertBefore(label, this.element.firstChild);
    
    return super.load();
  }
}

window.ArticleMidAdSlot = ArticleMidAdSlot;
