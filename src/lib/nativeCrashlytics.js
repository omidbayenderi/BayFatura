import { isNativePlatform } from './platform';

let Crashlytics = null;

async function getPlugin() {
    if (!Crashlytics) {
        const mod = await import('@capacitor-firebase/crashlytics');
        Crashlytics = mod.Crashlytics;
    }
    return Crashlytics;
}

export function isCrashlyticsAvailable() {
    return isNativePlatform();
}

export async function recordError(error) {
    if (!isNativePlatform()) return;
    try {
        const plugin = await getPlugin();
        await plugin.recordError({ error });
    } catch (e) {
        console.warn('[Crashlytics] recordError failed:', e);
    }
}

export async function logMessage(message) {
    if (!isNativePlatform()) return;
    try {
        const plugin = await getPlugin();
        await plugin.log({ message });
    } catch (e) {
        console.warn('[Crashlytics] logMessage failed:', e);
    }
}

export async function setUserId(userId) {
    if (!isNativePlatform()) return;
    try {
        const plugin = await getPlugin();
        await plugin.setUserId({ userId });
    } catch (e) {
        console.warn('[Crashlytics] setUserId failed:', e);
    }
}

export async function setCustomKey(key, value) {
    if (!isNativePlatform()) return;
    try {
        const plugin = await getPlugin();
        if (typeof value === 'string') {
            await plugin.setString({ key, value });
        } else if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                await plugin.setInt({ key, value });
            } else {
                await plugin.setFloat({ key, value: Math.fround(value) });
            }
        } else if (typeof value === 'boolean') {
            await plugin.setBool({ key, value });
        }
    } catch (e) {
        console.warn('[Crashlytics] setCustomKey failed:', e);
    }
}
