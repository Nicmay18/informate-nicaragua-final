/**
 * Sistema de Breaking News - Barra de última hora
 */

const BreakingNews = (() => {
    const CONFIG = {
        duracion: 20000, // 20 segundos
        colorUrgente: '#d00000',
        colorImportante: '#ff6b00'
    };

    let timeoutId = null;
    let currentNoticia = null;

    const elements = {
        bar: null,
        title: null
    };

    // Inicializar referencias DOM
    const init = () => {
        elements.bar = document.getElementById('breakingBar');
        elements.title = document.getElementById('breakingTitle');
        
        if (!elements.bar) {
            console.warn('BreakingNews: Elemento #breakingBar no encontrado');
        }
    };

    // Mostrar noticia de última hora
    const show = (noticia, nivel = 'urgente') => {
        if (!elements.bar || !noticia?.titulo) return;

        // Limpiar timeout anterior
        if (timeoutId) clearTimeout(timeoutId);

        currentNoticia = noticia;

        // Sanitizar y mostrar
        const tituloSeguro = Security.sanitizeHTML(noticia.titulo);
        const emoji = nivel === 'urgente' ? '🚨' : '🔴';
        const color = nivel === 'urgente' ? CONFIG.colorUrgente : CONFIG.colorImportante;

        elements.title.innerHTML = `${emoji} ÚLTIMA HORA: ${tituloSeguro}`;
        elements.bar.style.background = color;
        elements.bar.classList.add('active');

        // Auto-cerrar
        timeoutId = setTimeout(() => {
            hide();
        }, CONFIG.duracion);

        // Guardar en localStorage para persistencia
        localStorage.setItem('lastBreaking', JSON.stringify({
            ...noticia,
            shownAt: Date.now()
        }));
    };

    const hide = () => {
        if (elements.bar) {
            elements.bar.classList.remove('active');
        }
        currentNoticia = null;
    };

    // Verificar si hay una noticia breaking reciente al cargar
    const checkPending = () => {
        const last = localStorage.getItem('lastBreaking');
        if (last) {
            const data = JSON.parse(last);
            const age = Date.now() - data.shownAt;
            if (age < CONFIG.duracion) {
                // Aún está vigente, mostrar el tiempo restante
                setTimeout(() => show(data), 100);
            }
        }
    };

    return {
        init,
        show,
        hide,
        checkPending,
        get current() { return currentNoticia; }
    };
})();