/**
 * HeaderAdSlot - Anuncio de header (leaderboard)
 */
class HeaderAdSlot extends BaseAdSlot {
  constructor(element, config) {
    super(element, config);
    this.type = 'header';
    this.sizes = [[728, 90], [970, 90], [970, 250], [320, 100], [320, 50]];
  }

  setupAdAttributes() {
    // Solo mostrar en desktop/tablet
    if (window.innerWidth < 728) {
      this.element.style.display = 'none';
      throw new Error('Header ad disabled on mobile');
    }
    
    this.insElement.style.minHeight = '90px';
  }

  getAdFormat() {
    return 'horizontal';
  }

  isResponsive() {
    return false; // Tamaños fijos para mejor CPM
  }
}

window.HeaderAdSlot = HeaderAdSlot;
