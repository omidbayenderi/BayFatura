/**
 * BayFatura — Native Camera API
 * FAZ 2: Capacitor Plugin Entegrasyonu
 *
 * iOS/Android'de native kamera, web'de file input kullanır.
 * Makbuz tarama, logo yükleme ve belge fotoğraflama için.
 */

import { isNativePlatform } from './platform';

let CameraPlugin = null;
let CameraResultType = null;
let CameraSource = null;

/**
 * Capacitor Camera eklentisini lazy-load eder (web build'ini şişirmemek için)
 */
async function loadCamera() {
    if (CameraPlugin) return true;
    try {
        const mod = await import('@capacitor/camera');
        CameraPlugin = mod.Camera;
        CameraResultType = mod.CameraResultType;
        CameraSource = mod.CameraSource;
        return true;
    } catch {
        return false;
    }
}

/**
 * Kullanıcıdan fotoğraf alır.
 * Native: Kamera veya galeri seçeneği sunar.
 * Web: Tarayıcı file input kullanır.
 *
 * @param {Object} options
 * @param {'CAMERA'|'PHOTOS'|'PROMPT'} options.source - Kaynak seçimi
 * @param {number} options.quality - Görüntü kalitesi (0-100)
 * @param {number} options.width - Maksimum genişlik (px)
 * @returns {Promise<{dataUrl: string, mimeType: string}|null>}
 */
export async function takePhoto({
    source = 'PROMPT',
    quality = 85,
    width = 1200,
} = {}) {
    if (isNativePlatform()) {
        const loaded = await loadCamera();
        if (!loaded) {
            console.warn('[NativeCamera] Capacitor Camera plugin yüklenemedi');
            return null;
        }

        const sourceMap = {
            CAMERA: CameraSource.Camera,
            PHOTOS: CameraSource.Photos,
            PROMPT: CameraSource.Prompt,
        };

        try {
            const image = await CameraPlugin.getPhoto({
                quality,
                allowEditing: false,
                resultType: CameraResultType.DataUrl,
                source: sourceMap[source] || CameraSource.Prompt,
                width,
                correctOrientation: true,
                presentationStyle: 'popover',
            });

            return {
                dataUrl: image.dataUrl,
                mimeType: `image/${image.format}`,
                format: image.format,
            };
        } catch (err) {
            if (err?.message?.includes('User cancelled')) return null;
            console.error('[NativeCamera] Fotoğraf alma hatası:', err);
            return null;
        }
    }

    // Web fallback: file input
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = source === 'CAMERA' ? 'environment' : undefined;

        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (!file) { resolve(null); return; }

            const reader = new FileReader();
            reader.onload = (ev) => resolve({
                dataUrl: ev.target.result,
                mimeType: file.type,
                format: file.type.split('/')[1],
                file,
            });
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        };

        input.oncancel = () => resolve(null);
        input.click();
    });
}

/**
 * İzin kontrolü yapar (sadece native)
 * @returns {Promise<boolean>}
 */
export async function checkCameraPermission() {
    if (!isNativePlatform()) return true;
    const loaded = await loadCamera();
    if (!loaded) return false;

    try {
        const perms = await CameraPlugin.checkPermissions();
        if (perms.camera === 'granted' && perms.photos === 'granted') return true;

        const requested = await CameraPlugin.requestPermissions({
            permissions: ['camera', 'photos'],
        });
        return requested.camera === 'granted';
    } catch {
        return false;
    }
}
