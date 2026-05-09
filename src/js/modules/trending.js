/**
 * Motor de Trending - Algoritmo ponderado inteligente
 */

const TrendingEngine = {
    config: {
        weights: {
            vistas: 3,
            recency: 2,
            engagement: 1.5,
            shares: 2
        },
        maxItems: 5,
        timeDecay: 24 * 60 * 60 * 1000, // 24 horas
        updateInterval: 5 * 60 * 1000 // 5 minutos
    },

    cache: {
        data: null,
        timestamp: 0
    },

    // Calcular score de trending
    calculateScore: (noticia) => {
        const now = Date.now();
        const age = now - new Date(noticia.fecha).getTime();
        const recencyScore = Math.max(0, 1 - (age / TrendingEngine.config.timeDecay));
        
        const w = TrendingEngine.config.weights;
        
        return (
            (noticia.vistas || 0) * w.vistas +
            recencyScore * 100 * w.recency +
            (noticia.comentarios || 0) * w.engagement +
            (noticia.shares || 0) * w.shares
        );
    },

    // Obtener trending (con cache)
    getTrending: (noticias, forceRefresh = false) => {
        const now = Date.now();
        
        // Usar cache si es válido
        if (!forceRefresh && 
            TrendingEngine.cache.data && 
            (now - TrendingEngine.cache.timestamp) < TrendingEngine.config.updateInterval) {
            return TrendingEngine.cache.data;
        }

        const trending = noticias
            .filter(n => new Date(n.fecha) > new Date(now - 7 * 24 * 60 * 60 * 1000)) // Última semana
            .map(n => ({
                ...n,
                score: TrendingEngine.calculateScore(n),
                tiempoLectura: Math.ceil((n.contenido?.length || 0) / 1000)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, TrendingEngine.config.maxItems);

        // Actualizar cache
        TrendingEngine.cache = {
            data: trending,
            timestamp: now
        };

        return trending;
    },

    // Renderizar en el DOM
    render: (containerId, noticias, options = {}) => {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Trending: Contenedor #${containerId} no encontrado`);
            return;
        }

        const trending = TrendingEngine.getTrending(noticias, options.forceRefresh);
        
        if (trending.length === 0) {
            container.innerHTML = '<p class="trending-empty">No hay noticias trending</p>';
            return;
        }

        const html = trending.map((n, index) => {
            const rank = index + 1;
            const fireEmoji = rank <= 3 ? '🔥' : '📈';
            const rankClass = rank <= 3 ? 'top-3' : '';
            
            return `
                <article class="trending-item ${rankClass}" data-id="${Security.sanitizeAttr(n.id)}">
                    <span class="trending-rank">${rank}</span>
                    <span class="trending-icon">${fireEmoji}</span>
                    <div class="trending-content">
                        <h4 class="trending-title">${Security.sanitizeHTML(n.titulo)}</h4>
                        <div class="trending-meta">
                            <span>${n.vistas || 0} lecturas</span>
                            <span>•</span>
                            <span>${ContentProcessor.timeAgo(n.fecha)}</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        container.innerHTML = html;

        // Event delegation
        container.addEventListener('click', (e) => {
            const item = e.target.closest('.trending-item');
            if (item) {
                const id = item.dataset.id;
                const noticia = noticias.find(n => n.id === id);
                if (noticia && typeof abrirNoticia === 'function') {
                    abrirNoticia(noticia);
                }
            }
        });
    },

    // Auto-actualización
    startAutoUpdate: (containerId, noticiasFn, interval = null) => {
        const ms = interval || TrendingEngine.config.updateInterval;
        setInterval(() => {
            const noticias = noticiasFn();
            TrendingEngine.render(containerId, noticias, { forceRefresh: true });
        }, ms);
    }
};
