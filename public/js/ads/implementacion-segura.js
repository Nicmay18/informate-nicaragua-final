/**
 * Sistema de Anuncios Inteligentes
 * Garantiza que los anuncios NO tapen marca de agua ni títulos
 */

class AnunciosInteligentes {
  constructor() {
    this.adsenseClient = 'ca-pub-4115203339551838';
    this.adSlots = {
      afterCarousel: '1234567890', // Reemplazar con ID real
      afterFeatured: '0987654321',
      inFeed: '5544332211',
      sidebar: '1122334455',
      afterHero: '9988776655',
      inArticle: '6677889900'
    };
    this.init();
  }

  init() {
    // Esperar a que el contenido esté cargado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.insertarAnuncios());
    } else {
      this.insertarAnuncios();
    }
  }

  insertarAnuncios() {
    const pagina = this.detectarPagina();
    
    if (pagina === 'index') {
      this.anunciosIndex();
    } else if (pagina === 'noticia') {
      this.anunciosNoticia();
    }
  }

  detectarPagina() {
    if (window.location.pathname.includes('noticia.html')) {
      return 'noticia';
    }
    return 'index';
  }

  // ANUNCIOS EN INDEX
  anunciosIndex() {
    // 1. Después del carrusel
    this.insertarDespuesDeCarrusel();
    
    // 2. Después de la noticia destacada
    this.insertarDespuesDeDestacada();
    
    // 3. En el feed cada 4 noticias
    this.insertarEnFeed();
    
    // 4. Sidebar (si existe)
    this.insertarEnSidebar();
  }

  insertarDespuesDeCarrusel() {
    const carrusel = document.querySelector('.carousel-section');
    if (!carrusel) return;

    const adContainer = this.crearContenedor('ad-after-carousel', 'afterCarousel');
    carrusel.parentNode.insertBefore(adContainer, carrusel.nextSibling);
    
    this.cargarAnuncio('ad-after-carousel', 'horizontal');
  }

  insertarDespuesDeDestacada() {
    const destacada = document.querySelector('.breaking-card');
    if (!destacada) return;

    const adContainer = this.crearContenedor('ad-after-featured', 'afterFeatured');
    destacada.parentNode.insertBefore(adContainer, destacada.nextSibling);
    
    this.cargarAnuncio('ad-after-featured', 'horizontal');
  }

  insertarEnFeed() {
    const newsGrid = document.querySelector('.news-grid');
    if (!newsGrid) return;

    const noticias = Array.from(newsGrid.querySelectorAll('.news-card'));
    let adCount = 0;

    noticias.forEach((noticia, index) => {
      // Cada 4 noticias, insertar anuncio
      if ((index + 1) % 4 === 0 && index < noticias.length - 1) {
        adCount++;
        const adId = `ad-in-feed-${adCount}`;
        const adContainer = this.crearContenedor(adId, 'inFeed', 'in-feed');
        
        noticia.parentNode.insertBefore(adContainer, noticia.nextSibling);
        this.cargarAnuncio(adId, 'rectangle');
      }
    });
  }

  insertarEnSidebar() {
    const sidebar = document.querySelector('.sidebar-right');
    if (!sidebar) return;

    const adContainer = this.crearContenedor('ad-sidebar', 'sidebar', 'sidebar');
    sidebar.insertBefore(adContainer, sidebar.firstChild);
    
    this.cargarAnuncio('ad-sidebar', 'vertical');
  }

  // ANUNCIOS EN NOTICIA
  anunciosNoticia() {
    // 1. DESPUÉS de la imagen hero (NUNCA encima)
    this.insertarDespuesDeHero();
    
    // 2. En medio del artículo (después del 3er párrafo)
    this.insertarEnArticulo();
    
    // 3. Antes de compartir
    this.insertarAntesDeCompartir();
  }

  insertarDespuesDeHero() {
    const heroImage = document.querySelector('.hero-image');
    if (!heroImage) return;

    const adContainer = this.crearContenedor('ad-after-hero', 'afterHero', 'after-hero');
    heroImage.parentNode.insertBefore(adContainer, heroImage.nextSibling);
    
    this.cargarAnuncio('ad-after-hero', 'horizontal');
  }

  insertarEnArticulo() {
    const content = document.querySelector('.article-content');
    if (!content) return;

    const parrafos = content.querySelectorAll('p');
    if (parrafos.length < 4) return;

    // Insertar después del 3er párrafo
    const tercerParrafo = parrafos[2];
    const adContainer = this.crearContenedor('ad-in-article', 'inArticle', 'in-article');
    
    tercerParrafo.parentNode.insertBefore(adContainer, tercerParrafo.nextSibling);
    this.cargarAnuncio('ad-in-article', 'rectangle');
  }

  insertarAntesDeCompartir() {
    const shareSection = document.querySelector('.share-section');
    if (!shareSection) return;

    const adContainer = this.crearContenedor('ad-before-share', 'inArticle', 'before-share');
    shareSection.parentNode.insertBefore(adContainer, shareSection);
    
    this.cargarAnuncio('ad-before-share', 'horizontal');
  }

  // UTILIDADES
  crearContenedor(id, slotKey, className = '') {
    const container = document.createElement('div');
    container.className = `ad-container ${className ? 'ad-' + className : ''}`;
    container.innerHTML = `
      <ins class="adsbygoogle"
           id="${id}"
           style="display:block"
           data-ad-client="${this.adsenseClient}"
           data-ad-slot="${this.adSlots[slotKey]}"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    `;
    return container;
  }

  cargarAnuncio(id, formato) {
    // Esperar un momento para que el DOM esté listo
    setTimeout(() => {
      try {
        (adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('Error cargando anuncio:', e);
      }
    }, 100);
  }
}

// Inicializar automáticamente
if (typeof window !== 'undefined') {
  window.anunciosInteligentes = new AnunciosInteligentes();
}
