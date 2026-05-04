/**
 * Nicaragua Informate - Archivo Principal
 * Inicialización y coordinación de módulos
 */

const App = {
    config: {
        firebase: null, // Se carga desde ENV
        updateInterval: 60000 // 1 minuto
    },

    state: {
        noticias: [],
        categoriaActiva: 'todas',
        lastUpdate: 0
    },

    // Inicialización
    init: async () => {
        console.log('🚀 Iniciando Nicaragua Informate...');

        // 1. Cargar configuración de entorno
        App.loadEnv();

        // 2. Inicializar módulos de UI
        BreakingNews.init();
        ImageOptimizer.init();
        AdManager.init();

        // 3. Inicializar notificaciones
        const notifEnabled = await NotificationManager.init();
        if (notifEnabled) {
            console.log('✅ Notificaciones activadas');
        }

        // 4. Verificar breaking news pendientes
        BreakingNews.checkPending();

        // 5. Configurar eventos
        App.setupEvents();

        // 6. Cargar datos iniciales
        await App.loadNoticias();

        // 7. Iniciar auto-actualización
        App.startAutoUpdate();

        console.log('✅ App lista');
    },

    loadEnv: () => {
        // En producción, esto vendría de variables de entorno
        window.ENV = {
            FIREBASE_API_KEY: localStorage.getItem('FB_KEY'),
            ADSENSE_CLIENT_ID: 'ca-pub-4115203339551838',
            // ... otras configs
        };
    },

    setupEvents: () => {
        // Infinite scroll
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(App.handleScroll, 100);
        });

        // Online/Offline
        window.addEventListener('online', () => {
            App.showToast('Conexión restaurada', 'success');
            App.loadNoticias();
        });
        
        window.addEventListener('offline', () => {
            App.showToast('Modo offline - Mostrando contenido cacheado', 'warning');
        });

        // Visibility change (ahorro de batería)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                App.checkUpdates();
            }
        });
    },

    loadNoticias: async () => {
        try {
            // Simulación - Reemplazar con tu Firebase
            const mockData = [
                {
                    id: '1',
                    titulo: 'Noticia de prueba',
                    contenido: 'Contenido de la noticia...',
                    fecha: new Date().toISOString(),
                    vistas: 150,
                    breaking: true,
                    imagen: 'https://via.placeholder.com/800x600'
                }
            ];

            App.state.noticias = mockData;
            App.renderNoticias();
            
            // Verificar si hay breaking news
            const breaking = mockData.find(n => n.breaking);
            if (breaking) {
                BreakingNews.show(breaking);
            }

        } catch (error) {
            console.error('Error cargando noticias:', error);
            App.showToast('Error al cargar noticias', 'error');
        }
    },

    renderNoticias: () => {
        const container = document.getElementById('newsContainer');
        if (!container) return;

        const noticias = App.state.categoriaActiva === 'todas' 
            ? App.state.noticias 
            : App.state.noticias.filter(n => n.categoria === App.state.categoriaActiva);

        let html = '';
        
        noticias.forEach((noticia, index) => {
            // Insertar anuncio cada N noticias
            html += AdManager.insertInline(index);

            html += `
                <article class="news-card" data-id="${noticia.id}">
                    ${ImageOptimizer.template(noticia.imagen, noticia.titulo, {
                        width: 800,
                        height: 600,
                        className: 'news-image'
                    })}
                    <div class="news-content">
                        <span class="news-category">${noticia.categoria || 'General'}</span>
                        <h2 class="news-title">${Security.sanitizeHTML(noticia.titulo)}</h2>
                        <p class="news-excerpt">${ContentProcessor.generarResumen(noticia.contenido)}</p>
                        <div class="news-meta">
                            <time>${ContentProcessor.timeAgo(noticia.fecha)}</time>
                            <span>${noticia.vistas} lecturas</span>
                        </div>
                    </div>
                </article>
            `;
        });

        container.innerHTML = html;

        // Observar nuevas imágenes
        ImageOptimizer.observeAll();

        // Cargar anuncios diferidos
        setTimeout(() => AdManager.loadLazy(), 100);
    },

    handleScroll: () => {
        const scrollBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000;
        
        if (scrollBottom && !App.state.loading) {
            App.loadMore();
        }
    },

    loadMore: async () => {
        App.state.loading = true;
        // Implementar paginación
        App.state.loading = false;
    },

    startAutoUpdate: () => {
        setInterval(() => {
            App.checkUpdates();
        }, App.config.updateInterval);
    },

    checkUpdates: async () => {
        // Verificar nuevas noticias desde Firebase
        // Si hay nuevas, mostrar notificación y actualizar UI
    },

    showToast: (message, type = 'info') => {
        // Implementar sistema de toasts
        console.log(`[${type}] ${message}`);
    }
};

// Iniciar cuando DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}