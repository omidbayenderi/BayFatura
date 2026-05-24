import { Capacitor } from '@capacitor/core';
import { isNativePlatform } from './platform';

let FirebaseAuthentication;
const shouldLogNativeAuthDebug = import.meta.env.DEV || import.meta.env.VITE_DEBUG_NATIVE_AUTH === 'true';

function debugNativeAuth(...args) {
    if (shouldLogNativeAuthDebug) {
        console.log(...args);
    }
}

async function getPlugin() {
    if (!FirebaseAuthentication) {
        try {
            debugNativeAuth('[NativeAuth] isNativePlatform:', isNativePlatform());
            debugNativeAuth('[NativeAuth] Capacitor platform:', Capacitor.getPlatform());
            debugNativeAuth('[NativeAuth] isPluginAvailable:', Capacitor.isPluginAvailable('FirebaseAuthentication'));
            const mod = await import('@capacitor-firebase/authentication');
            FirebaseAuthentication = mod.FirebaseAuthentication;
            debugNativeAuth('[NativeAuth] Plugin loaded, type:', typeof FirebaseAuthentication);
            debugNativeAuth('[NativeAuth] Plugin keys:', Object.keys(FirebaseAuthentication).join(', '));
            if (FirebaseAuthentication && typeof FirebaseAuthentication.signInWithGoogle === 'function') {
                debugNativeAuth('[NativeAuth] signInWithGoogle IS a function');
            } else {
                debugNativeAuth('[NativeAuth] signInWithGoogle is NOT a function, type:', typeof FirebaseAuthentication?.signInWithGoogle);
            }
        } catch (err) {
            console.error('[NativeAuth] Plugin load error:', err);
            throw err;
        }
    }
    return FirebaseAuthentication;
}

export function isNativeAuthAvailable() {
    return isNativePlatform();
}

export const NativeAuthError = {
    UNIMPLEMENTED: 'UNIMPLEMENTED',
    PROVIDER_NOT_ENABLED: 'PROVIDER_NOT_ENABLED',
    USER_CANCELLED: 'USER_CANCELLED',
    CONFIG_ERROR: 'CONFIG_ERROR',
    UNKNOWN: 'UNKNOWN',
};

function categorizeError(err) {
    if (!err) return { type: NativeAuthError.UNKNOWN, message: 'Unknown error' };

    const msg = (err.message || '').toLowerCase();
    const code = (err.code || '').toUpperCase();

    if (code === 'UNIMPLEMENTED' || msg.includes('unimplemented')) {
        return { type: NativeAuthError.UNIMPLEMENTED, message: 'Native plugin not available on this platform.' };
    }
    if (msg.includes('not enabled') || msg.includes('provider not enabled')) {
        return { type: NativeAuthError.PROVIDER_NOT_ENABLED, message: err.message };
    }
    if (msg.includes('cancel') || msg.includes('user cancelled') || code === 'CANCELED') {
        return { type: NativeAuthError.USER_CANCELLED, message: 'Sign in was cancelled.' };
    }
    if (msg.includes('configuration') || msg.includes('invalid') || msg.includes('missing')) {
        return { type: NativeAuthError.CONFIG_ERROR, message: err.message };
    }
    return { type: NativeAuthError.UNKNOWN, message: err.message || 'Unknown native auth error' };
}

export async function nativeSignInWithGoogle() {
    const plugin = await getPlugin();
    try {
        const result = await plugin.signInWithGoogle();
        return result;
    } catch (err) {
        const categorized = categorizeError(err);
        console.error(`[NativeAuth] Google sign-in failed:`, { type: categorized.type, message: categorized.message, original: err });
        throw categorized;
    }
}

export async function nativeSignInWithApple() {
    const plugin = await getPlugin();
    try {
        const result = await plugin.signInWithApple();
        return result;
    } catch (err) {
        const categorized = categorizeError(err);
        console.error(`[NativeAuth] Apple sign-in failed:`, { type: categorized.type, message: categorized.message, original: err });
        throw categorized;
    }
}

export async function nativeSignOut() {
    const plugin = await getPlugin();
    try {
        await plugin.signOut();
    } catch (err) {
        console.error(`[NativeAuth] Sign out failed:`, err);
        throw categorizeError(err);
    }
}

export async function getNativeIdToken(forceRefresh = false) {
    const plugin = await getPlugin();
    try {
        const result = await plugin.getIdToken({ forceRefresh });
        return result.token;
    } catch (err) {
        console.error(`[NativeAuth] Get ID token failed:`, err);
        throw categorizeError(err);
    }
}
