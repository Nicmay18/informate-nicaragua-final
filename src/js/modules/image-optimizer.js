/**
 * Optimizador de Imágenes - Lazy Loading Avanzado
 */

const ImageOptimizer = {
    config: {
        rootMargin: '50px',
        threshold: 0.01,
        placeholderColor: '#f0f0f0'
    },

    observer: null,
    imageCache: new Map(),

    init: () => {
        // Crear Intersection Observer
        ImageOptimizer.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    ImageOptimizer.load(entry.target);
                    ImageOptimizer.observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: ImageOptimizer.config.rootMargin,
            threshold: ImageOptimizer.config.threshold
        });

        // Observar imágenes existentes
        ImageOptimizer.observeAll();
    },

    observeAll: () => {
        document.querySelectorAll('img[data-src]').forEach(img => {
            ImageOptimizer.observer.observe(img);
        });
    },

    load: (img) => {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;
        const sizes = img.dataset.sizes || '100vw';

        if (!src) return;

        // Verificar cache
        if (ImageOptimizer.imageCache.has(src)) {
            ImageOptimizer.applySource(img, src, srcset, sizes);
            return;
        }

        // Crear imagen de precarga
        const preloadImg = new Image();
        
        preloadImg.onload = () => {
            ImageOptimizer.imageCache.set(src, true);
            ImageOptimizer.applySource(img, src, srcset, sizes);
        };

        preloadImg.onerror = () => {
            img.classList.add('image-error');
            img.dispatchEvent(new CustomEvent('imageError', { detail: { src } }));
            
            // Placeholder de error
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EError al cargar%3C/text%3E%3C/svg%3E';
        };

        // Iniciar carga
        if (srcset) preloadImg.srcset = srcset;
        preloadImg.sizes = sizes;
        preloadImg.src = src;
    },

    applySource: (img, src, srcset, sizes) => {
        img.src = src;
        if (srcset) {
            img.srcset = srcset;
            img.sizes = sizes;
        }
        
        img.classList.add('loaded');
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
        img.removeAttribute('data-sizes');
        
        // Evento personalizado
        img.dispatchEvent(new CustomEvent('imageLoaded', { detail: { src } }));
    },

    // Generar HTML de imagen optimizada
    template: (imagen, titulo, options = {}) => {
        const {
            className = '',
            sizes = '100vw',
            alt = titulo,
            width,
            height
        } = options;

        const srcSet = ImageOptimizer.generateSrcSet(imagen);
        const placeholder = ImageOptimizer.generatePlaceholder(width, height);

        const attrs = [
            `data-src="${Security.sanitizeAttr(imagen)}"`,
            srcSet ? `data-srcset="${Security.sanitizeAttr(srcSet)}"` : '',
            `data-sizes="${sizes}"`,
            `src="${placeholder}"`,
            `alt="${Security.sanitizeAttr(alt)}"`,
            'loading="lazy"',
            'decoding="async"',
            className ? `class="lazy-image ${className}"` : 'class="lazy-image"',
            width ? `width="${width}"` : '',
            height ? `height="${height}"` : ''
        ].filter(Boolean).join(' ');

        return `
            <figure class="image-wrapper" style="aspect-ratio: ${width}/${height || width}">
                <img ${attrs}>
                <noscript>
                    <img src="${Security.sanitizeAttr(imagen)}" alt="${Security.sanitizeAttr(alt)}" ${width ? `width="${width}"` : ''} ${height ? `height="${height}"` : ''}>
                </noscript>
            </figure>
        `;
    },

    generateSrcSet: (imagen) => {
        // Generar srcset para responsive images
        const widths = [320, 640, 960, 1280];
        const base = imagen.replace(/(\.[^.]+)$/, '');
        const ext = imagen.match(/(\.[^.]+)$/)[1];
        
        return widths
            .map(w => `${base}-${w}w${ext} ${w}w`)
            .join(', ');
    },

    generatePlaceholder: (width = 400, height = 300) => {
        // SVG placeholder tiny
        return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"%3E%3Crect fill="%23f0f0f0" width="${width}" height="${height}"/%3E%3C/svg%3E`;
    },

    // Precargar imagen crítica
    preload: (src) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    }
};