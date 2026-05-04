/**
 * Gestor de Anuncios - Adsense Optimizado
 */

const AdManager = {
    config: {
        frequency: 4, // Cada 4 noticias
        lazyDelay: 2000,
        maxAdsPerPage: 6,
        labels: {
            ad: 'Publicidad',
            sponsored: 'Contenido patrocinado'
        }
    },

    state: {
        inserted: 0,
        loaded: 0,
        isGPTLoaded: false
    },

    // Inicializar
    init: () => {
        // Cargar script de Adsense de forma asíncrona
        if (document.querySelector('script[src*="adsbygoogle"]')) {
            AdManager.state.isGPTLoaded = true;
            return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.crossOrigin = 'anonymous';
        script.dataset.adClient = window.ENV?.ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXX';
        
        script.onerror = () => {
            console.error('Error cargando Adsense');
            AdManager.fallback();
        };

        document.head.appendChild(script);
    },

    // Insertar anuncio inline entre noticias
    insertInline: (index) => {
        if ((index + 1) % AdManager.config.frequency !== 0) return '';
        if (AdManager.state.inserted >= AdManager.config.maxAdsPerPage) return '';

        AdManager.state.inserted++;
        const adId = `ad-inline-${AdManager.state.inserted}`;

        return `
            <aside class="ad-container ad-inline" aria-label="${AdManager.config.labels.ad}">
                <span class="ad-label">${AdManager.config.labels.ad}</span>
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="${window.ENV?.ADSENSE_CLIENT_ID || ''}"
                     data-ad-slot="${window.ENV?.ADSENSE_SLOT_INLINE || ''}"
                     data-ad-format="auto"
                     data-full-width-responsive="true"
                     id="${adId}">
                </ins>
            </aside>
        `;
    },

    // Anuncio en sidebar
    insertSidebar: () => {
        if (AdManager.state.inserted >= AdManager.config.maxAdsPerPage) return '';
        
        AdManager.state.inserted++;
        
        return `
            <aside class="ad-container ad-sidebar" aria-label="${AdManager.config.labels.ad}">
                <span class="ad-label">${AdManager.config.labels.ad}</span>
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="${window.ENV?.ADSENSE_CLIENT_ID || ''}"
                     data-ad-slot="${window.ENV?.ADSENSE_SLOT_SIDEBAR || ''}"
                     data-ad-format="auto"></ins>
            </aside>
        `;
    },

    // Carga diferida de anuncios
    loadLazy: async () => {
        await new Promise(resolve => setTimeout(resolve, AdManager.config.lazyDelay));

        const ads = document.querySelectorAll('.adsbygoogle:not([data-ad-loaded])');
        
        // Cargar secuencialmente para no bloquear
        for (const ad of ads) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                ad.setAttribute('data-ad-loaded', 'true');
                AdManager.state.loaded++;
                
                // Delay entre cargas
                await new Promise(r => setTimeout(r, 500));
            } catch (e) {
                console.error('Error cargando anuncio:', e);
            }
        }

        console.log(`Ads cargados: ${AdManager.state.loaded}`);
    },

    // Refrescar anuncios visibles (para SPAs)
    refreshVisible: () => {
        if (typeof window.adsbygoogle === 'undefined') return;
        
        const visibleAds = document.querySelectorAll('.adsbygoogle[data-ad-loaded]');
        
        visibleAds.forEach(ad => {
            const rect = ad.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible && document.visibilityState === 'visible') {
                // Solo si existe el método refresh
                if (window.adsbygoogle.refresh) {
                    window.adsbygoogle.refresh(ad);
                }
            }
        });
    },

    // Fallback si Adsense falla
    fallback: () => {
        document.querySelectorAll('.ad-container').forEach(container => {
            container.innerHTML = `
                <div class="ad-fallback">
                    <p>Espacio publicitario</p>
                    <small>Contacta con nosotros para anunciarte</small>
                </div>
            `;
        });
    }
};