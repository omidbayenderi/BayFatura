export function registerServiceWorker() {
    // The offline cache caused clients to retain obsolete application bundles
    // and intercepted Firebase traffic during reconnects.  Until a dedicated,
    // tested offline mode exists, remove every legacy worker/cache on load.
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations =>
            Promise.all(registrations.map(registration => registration.unregister()))
        );
    }
    if ('caches' in window) {
        caches.keys().then(keys =>
            Promise.all(keys
                .filter(key => key.startsWith('bayfatura-'))
                .map(key => caches.delete(key)))
        );
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
