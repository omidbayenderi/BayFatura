import { initializeApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    OAuthProvider,
    indexedDBLocalPersistence,
    browserLocalPersistence,
    setPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

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

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// iOS WKWebView localStorage güvenilir değil — IndexedDB kullan
// Bu yapılmazsa signInWithRedirect sonrası oturum kaybolur
const isNativePlatform = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform();
if (isNativePlatform) {
    setPersistence(auth, indexedDBLocalPersistence).catch((err) => {
        console.warn('[Firebase] indexedDB persistence fallback:', err);
        setPersistence(auth, browserLocalPersistence).catch(() => {});
    });
}

// Analytics - only in production and when measurementId exists
export let analytics = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId && import.meta.env.PROD) {
    import('firebase/analytics').then(({ getAnalytics }) => {
        analytics = getAnalytics(app);
    }).catch(() => {});
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
