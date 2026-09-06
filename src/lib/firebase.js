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

// Firestore - offline persistence aktif (mobil için kritik)
export const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager()
    })
});

export const storage = getStorage(app);
export const functions = getFunctions(app);

// Analytics - only in production and when measurementId exists
export let analytics = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId && import.meta.env.PROD) {
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
