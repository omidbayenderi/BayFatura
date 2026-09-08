import { initializeApp } from 'firebase/app';
import {
    GoogleAuthProvider,
    OAuthProvider,
    indexedDBLocalPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    initializeAuth,
    browserPopupRedirectResolver,
} from 'firebase/auth';
import {
    initializeFirestore,
    getFirestore,
    persistentLocalCache,
    persistentSingleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { logger } from './logger';
import { Capacitor } from '@capacitor/core';

export const resolveFirebaseAuthDomain = ({ authDomain, projectId, appEnv, hostname }) => {
    if (!authDomain || !projectId || appEnv === 'production') {
        return authDomain;
    }

    const currentHost = hostname || (typeof window !== 'undefined' ? window.location.hostname : '');
    const isPreviewOrLocalHost = currentHost === 'localhost'
        || currentHost === '127.0.0.1'
        || currentHost.endsWith('.web.app')
        || currentHost.endsWith('.firebaseapp.com');
    const isCustomAuthDomain = !authDomain.endsWith('.firebaseapp.com')
        && !authDomain.endsWith('.web.app')
        && !authDomain.includes('localhost');

    if (isPreviewOrLocalHost && isCustomAuthDomain) {
        return `${projectId}.firebaseapp.com`;
    }

    return authDomain;
};

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: resolveFirebaseAuthDomain({
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        appEnv: import.meta.env.VITE_APP_ENV,
    }),
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

// App Check must be initialized before Firestore, Storage, or Functions make
// their first request. Production APIs enforce App Check, so loading it later
// can make the initial profile and subscription reads fail with permission-denied.
if (import.meta.env.VITE_FIREBASE_APP_CHECK_KEY) {
    try {
        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(import.meta.env.VITE_FIREBASE_APP_CHECK_KEY),
            isTokenAutoRefreshEnabled: true
        });
    } catch (err) {
        logger.warn('Firebase', 'App Check başlatılamadı', err);
    }
}

// Initialize Auth explicitly so Safari redirect flows have deterministic persistence.
export const auth = (() => {
    const persistence = Capacitor.isNativePlatform()
        ? indexedDBLocalPersistence
        : [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence];

    return initializeAuth(app, {
        persistence,
        popupRedirectResolver: browserPopupRedirectResolver
    });
})();

// ── Multi-region Firestore ────────────────────────────────────────────────────
// EU users (GDPR) → bayfatura-eu DB (eur3 Frankfurt)
// All others       → (default) DB  (nam5 US/global)
//
// The user's DB assignment is determined at registration (users/{uid}._db)
// and never changes. getDb() reads from localStorage for fast access.

export const EU_COUNTRIES = new Set([
    'DE','AT','CH','FR','ES','PT','NL','BE','IT','SE','NO','DK','FI',
    'PL','CZ','SK','HU','RO','BG','HR','SI','EE','LV','LT','LU',
    'IE','GR','CY','MT','IS','LI',
]);

export const DB_REGIONS = {
    global: '(default)',   // nam5 — US / global
    eu:     'bayfatura-eu', // eur3 — Frankfurt
};

export const getDbIdForCountry = (country) =>
    EU_COUNTRIES.has((country || '').toUpperCase())
        ? DB_REGIONS.eu
        : DB_REGIONS.global;

// Default DB (global) — used before user country is known
export const db = initializeFirestore(app, {
    // Some corporate and mobile networks reset Firestore's streaming channel
    // (ERR_QUIC_PROTOCOL_ERROR).  Long polling is slower in ideal conditions,
    // but is materially more reliable for the browser clients we support and
    // avoids repeated reconnect/backoff cycles that made the UI appear frozen.
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager()
    })
});

// EU DB — lazily initialized on first EU user access
let _euDb = null;
export const getEuDb = () => {
    if (!_euDb) {
        _euDb = getFirestore(app, DB_REGIONS.eu);
    }
    return _euDb;
};

/**
 * Returns the correct Firestore instance for a given user.
 * @param {string|null} dbId — value of users/{uid}._db ('bayfatura-eu' or null)
 */
export const getDb = (dbId) =>
    dbId === DB_REGIONS.eu ? getEuDb() : db;

export const storage = getStorage(app);
export const functions = getFunctions(app, 'europe-west3');

const getStoredCookieConsent = () => {
    if (typeof window === 'undefined') return null;
    try {
        return JSON.parse(localStorage.getItem('bayfatura_cookie_consent') || 'null');
    } catch {
        return null;
    }
};

const hasAnalyticsConsent = () => getStoredCookieConsent()?.analytics === true;

// Analytics - only in production, when measurementId exists, and after consent.
export let analytics = null;
export const enableAnalytics = async () => {
    if (analytics || typeof window === 'undefined' || !firebaseConfig.measurementId || !import.meta.env.PROD) {
        return analytics;
    }

    try {
        const { getAnalytics, isSupported } = await import('firebase/analytics');
        if (!(await isSupported())) {
            logger.info('Firebase', 'Analytics desteklenmeyen ortamda atlandı');
            return null;
        }

        analytics = getAnalytics(app);
        return analytics;
    } catch (err) {
        logger.warn('Firebase', 'Analytics yüklenemedi', err);
        return null;
    }
};

if (typeof window !== 'undefined' && hasAnalyticsConsent()) {
    import('firebase/analytics').then(async ({ getAnalytics, isSupported }) => {
        if (!(await isSupported())) {
            logger.info('Firebase', 'Analytics desteklenmeyen ortamda atlandı');
            return;
        }

        analytics = getAnalytics(app);
    }).catch((err) => {
        logger.warn('Firebase', 'Analytics yüklenemedi', err);
    });
}


// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account',
    // Ensure redirect URI is properly handled
    access_type: 'online'
});
export const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.addScope('email');
microsoftProvider.addScope('profile');
microsoftProvider.setCustomParameters({
    prompt: 'select_account'
});

export const isFirebaseConfigured = () => {
    return !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY');
};

export default app;
