import { initializeApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    OAuthProvider,
    indexedDBLocalPersistence,
} from 'firebase/auth';
import {
    initializeFirestore,
    persistentLocalCache,
    persistentSingleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { logger } from './logger';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

import { Capacitor } from '@capacitor/core';
import {
    initializeAuth,
    browserPopupRedirectResolver
} from 'firebase/auth';

// Initialize Auth platform-specifically to prevent WKWebView ITP sync hangs
export const auth = (() => {
    if (Capacitor.isNativePlatform()) {
        // iOS & Android: iframe-based sync breaks/hangs. Use direct indexedDB initialization.
        // We MUST pass browserPopupRedirectResolver so signInWithRedirect doesn't throw argument-error!
        return initializeAuth(app, {
            persistence: indexedDBLocalPersistence,
            popupRedirectResolver: browserPopupRedirectResolver
        });
    } else {
        // Web: Standard browser flow
        return getAuth(app);
    }
})();

// Firestore - offline persistence aktif (mobil için kritik)
export const db = initializeFirestore(app, {
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

// App Check — güvenlik katmanı (console'da etkinleştirilmeli)
if (import.meta.env.VITE_FIREBASE_APP_CHECK_KEY) {
    import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(import.meta.env.VITE_FIREBASE_APP_CHECK_KEY),
            isTokenAutoRefreshEnabled: true
        });
    }).catch((err) => {
        logger.warn('Firebase', 'App Check yüklenemedi', err);
    });
}

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account',
    // Ensure redirect URI is properly handled
    access_type: 'online'
});
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');
appleProvider.setCustomParameters({
    locale: 'en'
});

export const isFirebaseConfigured = () => {
    return !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY');
};

export default app;
