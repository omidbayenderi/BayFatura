export function registerServiceWorker() {
    // ⚠️ CRITICAL: Never register SW in development mode.
    // It intercepts Vite's HMR (hot module replacement) websocket and
    // module requests (src/main.jsx?t=...), causing a blank white screen.
    if (import.meta.env.DEV) {
        // In dev: unregister any previously installed SW to clear bad state
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(reg => {
                    reg.unregister();
                    console.log('[SW] Unregistered dev SW:', reg.scope);
                });
            });
            // Clear all caches that might be serving stale content
            if ('caches' in window) {
                caches.keys().then(keys => {
                    keys.forEach(key => {
                        caches.delete(key);
                        console.log('[SW] Cleared cache:', key);
                    });
                });
            }
        }
        return;
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then((registration) => {
                    console.log('SW registered:', registration.scope);

                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('New content available, refresh to update.');
                                if (window.onSWUpdate) {
                                    window.onSWUpdate();
                                }
                            }
                        });
                    });
                })
                .catch((error) => {
                    console.error('SW registration failed:', error);
                });
        });
    }
}

export function unregisterServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.unregister();
        });
    }
}

export function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        return Notification.requestPermission();
    }
    return Promise.resolve(Notification.permission);
}
