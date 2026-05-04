/**
 * Procesamiento de contenido - Resúmenes, keywords, fechas
 */

const ContentProcessor = {
    // Generar resumen inteligente
    generarResumen: (texto, maxLength = 180) => {
        if (!texto) return '';
        
        // Limpiar HTML y normalizar espacios
        let limpio = texto
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (limpio.length <= maxLength) return limpio;

        // Buscar corte inteligente
        const corte = limpio.substring(0, maxLength);
        const finOracion = corte.lastIndexOf('.');
        const finPalabra = corte.lastIndexOf(' ');
        
        // Preferir fin de oración si está después del 70%
        const puntoCorte = finOracion > maxLength * 0.7 
            ? finOracion + 1 
            : finPalabra;

        return limpio.substring(0, puntoCorte).trim() + '...';
    },

    // Extraer keywords para SEO
    extractKeywords: (texto, cantidad = 5) => {
        const palabrasIgnoradas = new Set([
            'para', 'por', 'con', 'que', 'los', 'las', 'del', 'una',
            'este', 'esta', 'como', 'más', 'sus', 'pero', 'son',
            'sobre', 'entre', 'cuando', 'todos', 'todo', 'nicaragua'
        ]);

        const palabras = texto.toLowerCase()
            .replace(/[^\w\sáéíóúñ]/g, '')
            .split(/\s+/)
            .filter(p => p.length > 4 && !palabrasIgnoradas.has(p));

        const frecuencias = {};
        palabras.forEach(p => {
            frecuencias[p] = (frecuencias[p] || 0) + 1;
        });

        return Object.entries(frecuencias)
            .sort((a, b) => b[1] - a[1])
            .slice(0, cantidad)
            .map(([palabra]) => palabra);
    },

    // Formatear fecha relativa
    timeAgo: (fecha) => {
        const date = new Date(fecha);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        const intervals = {
            año: 31536000,
            mes: 2592000,
            semana: 604800,
            día: 86400,
            hora: 3600,
            minuto: 60
        };

        for (const [unidad, segundos] of Object.entries(intervals)) {
            const intervalo = Math.floor(seconds / segundos);
            if (intervalo >= 1) {
                return `hace ${intervalo} ${unidad}${intervalo > 1 ? (unidad === 'mes' ? 'es' : 's') : ''}`;
            }
        }
        return 'hace un momento';
    },

    // Slug para URLs amigables
    createSlug: (texto) => {
        return texto.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remover tildes
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 60)
            .replace(/-+$/, '');
    }
};