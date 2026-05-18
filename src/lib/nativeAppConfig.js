import { Capacitor } from '@capacitor/core';

const PLUGIN_NAME = 'AppConfig';

/**
 * Native AppConfig plugin'e erişim.
 * Sadece native platformda (iOS/Android) çalışır.
 * Web'de graceful fallback yapar.
 */
function getPlugin() {
    if (!Capacitor.isNativePlatform()) return null;
    try {
        const plugin = Capacitor.Plugins[PLUGIN_NAME];
        if (!plugin || typeof plugin.getAppInfo !== 'function') return null;
        return plugin;
    } catch {
        return null;
    }
}

/**
 * Uygulama versiyon bilgilerini döndürür.
 * @returns {Promise<{appVersion: string, buildNumber: string, bundleId: string, appName: string}>}
 */
export async function getAppInfo() {
    const plugin = getPlugin();
    if (!plugin) {
        return {
            appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
            buildNumber: '1',
            bundleId: 'com.bayfatura.app',
            appName: 'BayFatura',
        };
    }
    try {
        return await plugin.getAppInfo();
    } catch {
        return { appVersion: '1.0.0', buildNumber: '1', bundleId: '', appName: 'BayFatura' };
    }
}

/**
 * Cihaz bilgilerini döndürür.
 * @returns {Promise<{systemVersion: string, systemName: string, deviceModel: string, isTablet: boolean}>}
 */
export async function getDeviceInfo() {
    const plugin = getPlugin();
    if (!plugin) {
        return {
            systemVersion: 'unknown',
            systemName: 'web',
            deviceModel: 'web',
            isTablet: false,
        };
    }
    try {
        return await plugin.getDeviceInfo();
    } catch {
        return { systemVersion: '', systemName: '', deviceModel: '', isTablet: false };
    }
}

/**
 * Native yetenekleri sorgular.
 * @returns {Promise<{supportsFaceID: boolean, supportsTouchID: boolean, biometryType: string, isNative: boolean}>}
 */
export async function getNativeCapabilities() {
    const plugin = getPlugin();
    if (!plugin) {
        return { supportsFaceID: false, supportsTouchID: false, biometryType: 'none', isNative: false };
    }
    try {
        return await plugin.getNativeCapabilities();
    } catch {
        return { supportsFaceID: false, supportsTouchID: false, biometryType: 'none', isNative: false };
    }
}

/**
 * Cihazın native iOS/Android olup olmadığını döndürür.
 * @returns {boolean}
 */
export function isNativePlatform() {
    return Capacitor.isNativePlatform();
}

export default { getAppInfo, getDeviceInfo, getNativeCapabilities, isNativePlatform };
