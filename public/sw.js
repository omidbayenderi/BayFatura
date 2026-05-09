// BayFatura Service Worker v2
// ⚠️ CRITICAL: Development mode detection
// In dev mode, this SW must be a no-op to avoid intercepting Vite HMR requests

const IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Development mode: immediately unregister and do nothing
if (IS_DEV) {
    self.addEventListener('install', () => {
        self.skipWaiting();
    });
    self.addEventListener('activate', () => {
        // Unregister self in dev mode and clear all caches
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
        self.clients.claim();
        self.registration.unregister();
    });
    // No fetch handler in dev mode — let all requests pass through normally
} else {
    // ─── PRODUCTION MODE ONLY ─────────────────────────────────────────────────
    const CACHE_VERSION = 'v2';
    const STATIC_CACHE = `bayfatura-static-${CACHE_VERSION}`;
    const DYNAMIC_CACHE = `bayfatura-dynamic-${CACHE_VERSION}`;

    const STATIC_ASSETS = [
        '/',
        '/index.html',
        '/manifest.json',
        '/logo.svg'
    ];

    // Install: Cache static assets
    self.addEventListener('install', (event) => {
        event.waitUntil(
            caches.open(STATIC_CACHE)
                .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
                .then(() => self.skipWaiting())
        );
    });

    // Activate: Clear old caches
    self.addEventListener('activate', (event) => {
        event.waitUntil(
            caches.keys().then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
                        .map((key) => caches.delete(key))
                )
            ).then(() => self.clients.claim())
        );
    });

    // Fetch: Smart caching strategy
    self.addEventListener('fetch', (event) => {
        const { request } = event;
        const url = new URL(request.url);

        // Skip non-GET requests
        if (request.method !== 'GET') return;

        // Skip Chrome extensions
        if (url.protocol === 'chrome-extension:') return;

        // Skip Firebase/Auth/API requests (must be live)
        if (
            url.hostname.includes('firebaseio.com') ||
            url.hostname.includes('firebaseapp.com') ||
            url.hostname.includes('googleapis.com') ||
            url.hostname.includes('gstatic.com') ||
            url.hostname.includes('firebase.google.com') ||
            url.hostname.includes('identitytoolkit.googleapis.com') ||
            url.hostname.includes('resend.com') ||
            url.hostname.includes('stripe.com') ||
            url.hostname.includes('quickchart.io') ||
            url.hostname.includes('api.qrserver.com')
        ) {
            return;
        }

        // HTML pages: Network first, cache fallback
        if (request.destination === 'document') {
            event.respondWith(
                fetch(request)
                    .then((response) => {
                        const cloned = response.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, cloned));
                        return response;
                    })
                    .catch(() => caches.match(request).then(r => r || caches.match('/')))
            );
            return;
        }

        // CSS/JS/Font: Cache first, network fallback
        if (
            request.destination === 'style' ||
            request.destination === 'script' ||
            request.destination === 'font'
        ) {
            event.respondWith(
                caches.match(request).then((cached) => {
                    if (cached) return cached;
                    return fetch(request).then((response) => {
                        const cloned = response.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, cloned));
                        return response;
                    });
                })
            );
            return;
        }

        // Images: Cache first, network fallback
        if (request.destination === 'image') {
            event.respondWith(
                caches.match(request).then((cached) => {
                    if (cached) return cached;
                    return fetch(request).then((response) => {
                        const cloned = response.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, cloned));
                        return response;
                    }).catch(() => new Response('', { status: 404 }));
                })
            );
            return;
        }

        // Everything else: Network only (don't block if it fails)
        event.respondWith(
            fetch(request).catch(() => new Response('', { status: 503 }))
        );
    });

    // Push notifications
    self.addEventListener('push', (event) => {
        const data = event.data ? event.data.json() : {};
        const options = {
            body: data.body || 'You have a new notification',
            icon: '/logo-192.png',
            badge: '/logo-192.png',
            tag: data.tag || 'default',
            requireInteraction: false
        };
        event.waitUntil(
            self.registration.showNotification(data.title || 'BayFatura', options)
        );
    });

    // Notification click
    self.addEventListener('notificationclick', (event) => {
        event.notification.close();
        if (event.action === 'view') {
            event.waitUntil(clients.openWindow('/notifications'));
        }
    });
}
