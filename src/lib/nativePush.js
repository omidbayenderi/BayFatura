/**
 * BayFatura — Native Push Notifications
 * FAZ 2: Capacitor Plugin Entegrasyonu
 *
 * iOS/Android push bildirimleri için FCM token yönetimi.
 * Firestore'a token kaydeder, overdue fatura bildirimleri için.
 */

import { isNativePlatform } from './platform';

let PushPlugin = null;

async function loadPush() {
    if (PushPlugin) return true;
    try {
        const mod = await import('@capacitor/push-notifications');
        PushPlugin = mod.PushNotifications;
        return true;
    } catch {
        return false;
    }
}

/**
 * Push notification izni ister ve FCM token alır.
 * Token, Firestore'daki kullanıcı belgesine kaydedilir.
 *
 * @param {string} userId - Firebase Auth kullanıcı UID
 * @param {Function} saveTokenFn - Token'ı kaydeden async fonksiyon: (token) => Promise<void>
 * @returns {Promise<string|null>} FCM token veya null
 */
export async function registerPushNotifications(userId, saveTokenFn) {
    if (!isNativePlatform()) {
        console.info('[PushNotifications] Native platform değil, push bildirimleri atlanıyor.');
        return null;
    }

    const loaded = await loadPush();
    if (!loaded) return null;

    try {
        // İzin kontrolü
        let permStatus = await PushPlugin.checkPermissions();

        if (permStatus.receive === 'prompt') {
            permStatus = await PushPlugin.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            console.warn('[PushNotifications] İzin reddedildi.');
            return null;
        }

        // FCM/APNs'e kayıt ol
        await PushPlugin.register();

        return new Promise((resolve) => {
            let resolved = false;

            // Token geldiğinde
            PushPlugin.addListener('registration', async (token) => {
                if (resolved) return;
                resolved = true;
                console.info('[PushNotifications] FCM Token alındı:', token.value.substring(0, 20) + '...');

                if (saveTokenFn && userId) {
                    try {
                        await saveTokenFn(token.value);
                    } catch (err) {
                        console.error('[PushNotifications] Token kayıt hatası:', err);
                    }
                }
                resolve(token.value);
            });

            // Kayıt hatası
            PushPlugin.addListener('registrationError', (err) => {
                if (resolved) return;
                resolved = true;
                console.error('[PushNotifications] Kayıt hatası:', err);
                resolve(null);
            });

            // Timeout: 10 saniye içinde token gelmezse
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.warn('[PushNotifications] Token timeout');
                    resolve(null);
                }
            }, 10000);
        });
    } catch (err) {
        console.error('[PushNotifications] Başlatma hatası:', err);
        return null;
    }
}

/**
 * Uygulama açıkken bildirim geldiğinde tetiklenecek listener ekler.
 *
 * @param {Function} onNotification - (notification) => void
 * @returns {Promise<Function>} Listener'ı kaldıran cleanup fonksiyonu
 */
export async function addNotificationListener(onNotification) {
    if (!isNativePlatform()) return () => {};

    const loaded = await loadPush();
    if (!loaded) return () => {};

    const handle = await PushPlugin.addListener('pushNotificationReceived', onNotification);
    return () => handle.remove();
}

/**
 * Bildirime tıklandığında tetiklenecek listener ekler.
 *
 * @param {Function} onAction - (notificationAction) => void
 * @returns {Promise<Function>} Cleanup fonksiyonu
 */
export async function addNotificationActionListener(onAction) {
    if (!isNativePlatform()) return () => {};

    const loaded = await loadPush();
    if (!loaded) return () => {};

    const handle = await PushPlugin.addListener('pushNotificationActionPerformed', onAction);
    return () => handle.remove();
}

/**
 * Uygulama badge sayısını sıfırlar.
 */
export async function clearBadge() {
    if (!isNativePlatform()) return;
    const loaded = await loadPush();
    if (!loaded) return;
    try {
        await PushPlugin.removeAllDeliveredNotifications();
    } catch {/* sessizce başarısız ol */}
}
