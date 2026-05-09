/**
 * Módulo de seguridad - Sanitización y validación
 */

const Security = {
    // Sanitizar HTML para prevenir XSS
    sanitizeHTML: (str) => {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // Sanitizar atributos
    sanitizeAttr: (str) => {
        return str.replace(/["&'<>]/g, (match) => ({
            '"': '&quot;',
            '&': '&amp;',
            "'": '&#39;',
            '<': '&lt;',
            '>': '&gt;'
        })[match]);
    },

    // Validar URLs
    isValidURL: (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    // Escapar regex
    escapeRegExp: (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    // Generar ID único seguro
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Rate limiting simple
    createRateLimiter: (maxRequests = 10, windowMs = 60000) => {
        const requests = [];
        
        return () => {
            const now = Date.now();
            // Limpiar requests antiguos
            while (requests.length > 0 && requests[0] < now - windowMs) {
                requests.shift();
            }
            
            if (requests.length >= maxRequests) {
                return false; // Límite alcanzado
            }
            
            requests.push(now);
            return true;
        };
    }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Security;
}