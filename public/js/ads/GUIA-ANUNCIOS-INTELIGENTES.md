# Guía de Anuncios Inteligentes - Nicaragua Informate

## ⚠️ Reglas de Oro para Anuncios

### 1. NUNCA colocar anuncios sobre:
- ❌ Marca de agua del logo
- ❌ Títulos sobre fotos
- ❌ Carrusel principal
- ❌ Imagen destacada de noticias

### 2. Ubicaciones SEGURAS y Efectivas

#### ✅ En Index (Página Principal):

```html
<!-- DESPUÉS del carrusel (nunca encima) -->
<div class="carousel-section">
  <!-- Carrusel aquí -->
</div>

<!-- ✅ ANUNCIO 1: Banner horizontal después del carrusel -->
<div class="ad-container ad-after-carousel">
  <div id="ad-header" 
       data-ad-slot 
       data-ad-position="header"
       data-ad-slot="TU_AD_SLOT_ID">
  </div>
</div>

<!-- Grid de noticias -->
<div class="main-wrapper">
  <main class="content-main">
    <!-- Primera noticia destacada -->
    <div class="breaking-card">...</div>
    
    <!-- ✅ ANUNCIO 2: Después de la noticia destacada -->
    <div class="ad-container ad-after-featured">
      <div id="ad-after-featured" 
           data-ad-slot 
           data-ad-position="after-featured"
           data-ad-slot="TU_AD_SLOT_ID">
      </div>
    </div>
    
    <!-- Grid de noticias normales -->
    <div class="news-grid">
      <!-- Noticia 1 -->
      <!-- Noticia 2 -->
      <!-- Noticia 3 -->
      
      <!-- ✅ ANUNCIO 3: Entre noticias (cada 4 noticias) -->
      <div class="ad-container ad-in-feed">
        <div id="ad-in-feed-1" 
             data-ad-slot 
             data-ad-position="in-feed"
             data-ad-slot="TU_AD_SLOT_ID">
        </div>
      </div>
      
      <!-- Más noticias... -->
    </div>
  </main>
  
  <!-- ✅ ANUNCIO 4: Sidebar (sticky) -->
  <aside class="sidebar-right">
    <div class="ad-container ad-sidebar">
      <div id="ad-sidebar" 
           data-ad-slot 
           data-ad-position="sidebar"
           data-ad-slot="TU_AD_SLOT_ID">
      </div>
    </div>
    
    <!-- Resto del sidebar -->
  </aside>
</div>
```

#### ✅ En Noticia Individual:

```html
<article class="article-container">
  <!-- Título -->
  <h1>Título de la noticia</h1>
  
  <!-- Meta info -->
  <div class="article-meta">...</div>
  
  <!-- Imagen principal (CON marca de agua) -->
  <img class="hero-image" src="...">
  
  <!-- ✅ ANUNCIO 1: DESPUÉS de la imagen principal -->
  <div class="ad-container ad-after-hero">
    <div id="ad-after-hero" 
         data-ad-slot 
         data-ad-position="after-hero"
         data-ad-slot="TU_AD_SLOT_ID">
    </div>
  </div>
  
  <!-- Contenido del artículo -->
  <div class="article-content">
    <p>Primer párrafo...</p>
    <p>Segundo párrafo...</p>
    <p>Tercer párrafo...</p>
    
    <!-- ✅ ANUNCIO 2: En medio del artículo (después del 3er párrafo) -->
    <div class="ad-container ad-in-article">
      <div id="ad-in-article" 
           data-ad-slot 
           data-ad-position="in-article"
           data-ad-slot="TU_AD_SLOT_ID">
      </div>
    </div>
    
    <p>Cuarto párrafo...</p>
    <!-- Resto del contenido -->
  </div>
  
  <!-- ✅ ANUNCIO 3: Antes de compartir -->
  <div class="ad-container ad-before-share">
    <div id="ad-before-share" 
         data-ad-slot 
         data-ad-position="before-share"
         data-ad-slot="TU_AD_SLOT_ID">
    </div>
  </div>
  
  <!-- Botones de compartir -->
  <div class="share-section">...</div>
  
  <!-- Noticias relacionadas -->
  <div class="related-section">...</div>
</article>
```

### 3. CSS para Contenedores de Anuncios

```css
/* Contenedor de anuncios - Espaciado y centrado */
.ad-container {
  margin: 40px auto;
  padding: 20px 0;
  text-align: center;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* Etiqueta "Publicidad" */
.ad-container::before {
  content: "Publicidad";
  display: block;
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

/* Anuncio después del carrusel */
.ad-after-carousel {
  max-width: 1280px;
  margin: 30px auto;
}

/* Anuncio después de noticia destacada */
.ad-after-featured {
  margin: 30px 0;
}

/* Anuncios en el feed de noticias */
.ad-in-feed {
  grid-column: 1 / -1; /* Ocupa todo el ancho del grid */
  margin: 20px 0;
}

/* Anuncio en sidebar (sticky) */
.ad-sidebar {
  position: sticky;
  top: 80px;
  margin-bottom: 30px;
}

/* Anuncio después de imagen hero */
.ad-after-hero {
  margin: 30px 0;
}

/* Anuncio dentro del artículo */
.ad-in-article {
  margin: 40px 0;
  float: none;
  clear: both;
}

/* Responsive - Ocultar algunos anuncios en móvil */
@media (max-width: 768px) {
  .ad-sidebar {
    display: none; /* No mostrar sidebar ads en móvil */
  }
  
  .ad-in-feed:nth-child(n+2) {
    display: none; /* Solo mostrar 1 anuncio in-feed en móvil */
  }
}

/* NUNCA usar position: absolute o fixed sobre imágenes */
/* NUNCA usar z-index alto que tape marca de agua */
```

### 4. JavaScript para Insertar Anuncios Dinámicamente

```javascript
// Insertar anuncio después de la imagen hero en noticia.html
function insertarAnuncioAfterHero() {
  const heroImage = document.querySelector('.hero-image');
  if (!heroImage) return;
  
  const adContainer = document.createElement('div');
  adContainer.className = 'ad-container ad-after-hero';
  adContainer.innerHTML = `
    <div id="ad-after-hero" 
         data-ad-slot 
         data-ad-position="after-hero"
         data-ad-slot="TU_AD_SLOT_ID">
    </div>
  `;
  
  heroImage.parentNode.insertBefore(adContainer, heroImage.nextSibling);
}

// Insertar anuncios cada 4 noticias en el grid
function insertarAnunciosEnGrid() {
  const newsGrid = document.querySelector('.news-grid');
  if (!newsGrid) return;
  
  const noticias = newsGrid.querySelectorAll('.news-card');
  let adCount = 0;
  
  noticias.forEach((noticia, index) => {
    // Cada 4 noticias, insertar un anuncio
    if ((index + 1) % 4 === 0 && index < noticias.length - 1) {
      adCount++;
      const adContainer = document.createElement('div');
      adContainer.className = 'ad-container ad-in-feed';
      adContainer.innerHTML = `
        <div id="ad-in-feed-${adCount}" 
             data-ad-slot 
             data-ad-position="in-feed"
             data-ad-slot="TU_AD_SLOT_ID">
        </div>
      `;
      
      noticia.parentNode.insertBefore(adContainer, noticia.nextSibling);
    }
  });
}

// Llamar después de cargar las noticias
document.addEventListener('DOMContentLoaded', () => {
  insertarAnuncioAfterHero();
  insertarAnunciosEnGrid();
});
```

### 5. Checklist de Verificación

Antes de publicar anuncios, verifica:

- [ ] ✅ Ningún anuncio tapa la marca de agua
- [ ] ✅ Ningún anuncio tapa títulos sobre fotos
- [ ] ✅ Anuncios están DESPUÉS de imágenes principales
- [ ] ✅ Hay espacio visual entre anuncios y contenido
- [ ] ✅ Etiqueta "Publicidad" visible
- [ ] ✅ Anuncios responsive en móvil
- [ ] ✅ No más de 3 anuncios visibles simultáneamente
- [ ] ✅ Anuncios no afectan velocidad de carga

### 6. Mejores Prácticas

1. **Espaciado**: Mínimo 40px arriba y abajo de cada anuncio
2. **Límite**: Máximo 3 anuncios por página en móvil
3. **Lazy Load**: Cargar anuncios solo cuando sean visibles
4. **Etiquetado**: Siempre marcar como "Publicidad"
5. **No invasivos**: Evitar pop-ups y overlays
6. **Respeto al contenido**: El contenido siempre es primero

### 7. IDs de AdSense Actuales

```
Publisher ID: ca-pub-4115203339551838
```

Reemplaza `TU_AD_SLOT_ID` con tus IDs reales de slots de AdSense.

---

## 🎯 Resumen

**REGLA DE ORO**: Los anuncios SIEMPRE van DESPUÉS del contenido visual principal, NUNCA encima.

- Carrusel → Anuncio
- Imagen destacada → Anuncio  
- Contenido → Anuncio

Esto garantiza:
- ✅ Marca de agua siempre visible
- ✅ Títulos legibles
- ✅ Mejor experiencia de usuario
- ✅ Mayor CTR en anuncios (mejor posicionados)
