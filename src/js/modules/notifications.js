/**
 * Sistema de Notificaciones Push Avanzado
 */

const NotificationManager = {
    config: {
        icon: '/assets/logo.png',
        badge: '/assets/logo.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        maxRetries: 3
    },

    state: {
        permission: 'default',
        swRegistration: null,
        retryCount: 0
    },

    // Inicializar
    init: async () => {
        if (!('Notification' in window)) {
            console.log('Notificaciones no soportadas');
            return false;
        }

        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker no soportado');
            return false;
        }

        // Registrar Service Worker
        try {
            NotificationManager.state.swRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('SW registrado:', NotificationManager.state.swRegistration.scope);
        } catch (err) {
            console.error('Error registrando SW:', err);
        }

        // Verificar permiso actual
        NotificationManager.state.permission = Notification.permission;
        
        if (Notification.permission === 'granted') {
            return true;
        }

        return false;
    },

    // Solicitar permiso
    requestPermission: async () => {
        if (Notification.permission === 'denied') {
            console.warn('Permiso de notificaciones denegado previamente');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            NotificationManager.state.permission = permission;
            return permission === 'granted';
        } catch (err) {
            console.error('Error solicitando permiso:', err);
            return false;
        }
    },

    // Enviar notificación
    send: async (noticia, options = {}) => {
        if (Notification.permission !== 'granted') {
            console.warn('No hay permiso para notificaciones');
            return false;
        }

        const config = {
            body: noticia.titulo?.substring(0, 100) || 'Nueva noticia',
            icon: options.icon || NotificationManager.config.icon,
            badge: options.badge || NotificationManager.config.badge,
            image: noticia.imagen,
            vibrate: options.vibrate || NotificationManager.config.vibrate,
            requireInteraction: options.requireInteraction ?? NotificationManager.config.requireInteraction,
            data: {
                url: `/noticia/${noticia.id}`,
                noticiaId: noticia.id,
                timestamp: Date.now(),
                ...options.data
            },
            actions: [
                { action: 'open', title: 'Leer ahora' },
                { action: 'close', title: 'Cerrar' }
            ],
            tag: `noticia-${noticia.id}`, // Evitar duplicados
            renotify: true
        };

        try {
            if (NotificationManager.state.swRegistration) {
                // Usar Service Worker para notificaciones persistentes
                await NotificationManager.state.swRegistration.showNotification(
                    '📰 Nicaragua Informate', 
                    config
                );
            } else {
                // Fallback a notificación básica
                new Notification('📰 Nicaragua Informate', config);
            }

            // Track analytics
            NotificationManager.track('sent', noticia.id);
            return true;

        } catch (error) {
            console.error('Error enviando notificación:', error);
            
            if (NotificationManager.state.retryCount < NotificationManager.config.maxRetries) {
                NotificationManager.state.retryCount++;
                setTimeout(() => NotificationManager.send(noticia, options), 1000);
            }
            
            return false;
        }
    },

    // Enviar a todos los suscriptores (simulado)
    broadcast: async (noticias) => {
        // En producción, esto iría a tu backend
        console.log('Broadcasting a suscriptores:', noticias.length);
    },

    // Tracking
    track: (event, noticiaId) => {
        if (typeof gtag !== 'undefined') {
            gtag('event', `notification_${event}`, {
                event_category: 'engagement',
                event_label: noticiaId
            });
        }
    },

    // Programar notificación
    schedule: (noticia, delayMs) => {
        setTimeout(() => {
            NotificationManager.send(noticia);
        }, delayMs);
    }
};