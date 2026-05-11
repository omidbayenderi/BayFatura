/**
 * BayFatura — Native Share API
 * FAZ 2: Capacitor Plugin Entegrasyonu
 *
 * iOS/Android'de native paylaşım menüsünü açar.
 * PDF fatura paylaşımı, link paylaşımı için.
 */

import { isNativePlatform } from './platform';

let SharePlugin = null;
let FilesystemPlugin = null;
let DirectoryEnum = null;

async function loadShare() {
    if (SharePlugin) return true;
    try {
        const shareMod = await import('@capacitor/share');
        SharePlugin = shareMod.Share;
        return true;
    } catch {
        return false;
    }
}

async function loadFilesystem() {
    if (FilesystemPlugin) return true;
    try {
        const fsMod = await import('@capacitor/filesystem');
        FilesystemPlugin = fsMod.Filesystem;
        DirectoryEnum = fsMod.Directory;
        return true;
    } catch {
        return false;
    }
}

/**
 * Bir URL veya metin paylaşır (native share sheet).
 *
 * @param {Object} options
 * @param {string} options.title   - Paylaşım başlığı
 * @param {string} options.text    - Paylaşılacak metin
 * @param {string} [options.url]   - Paylaşılacak URL
 * @param {string} [options.dialogTitle] - Android share dialog başlığı
 */
export async function shareUrl({ title, text, url, dialogTitle }) {
    const loaded = await loadShare();

    if (isNativePlatform() && loaded) {
        try {
            await SharePlugin.share({ title, text, url, dialogTitle });
            return true;
        } catch (err) {
            if (err?.message?.includes('Share canceled')) return false;
            console.error('[NativeShare] URL paylaşım hatası:', err);
            return false;
        }
    }

    // Web fallback: Web Share API veya clipboard
    if (navigator.share) {
        try {
            await navigator.share({ title, text, url });
            return true;
        } catch { /* kullanıcı iptal etti */ }
    }

    if (url && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        return 'clipboard';
    }

    return false;
}

/**
 * Base64 PDF'i native cihaza kaydeder ve paylaşır.
 *
 * @param {string} base64Data  - Base64 PDF verisi (data:application/pdf;base64,... olmadan)
 * @param {string} filename    - Dosya adı (örn: "Rechnung-2024-001.pdf")
 * @param {string} title       - Paylaşım başlığı
 */
export async function sharePdf(base64Data, filename, title = 'Fatura') {
    if (!isNativePlatform()) {
        // Web: blob URL ile indirme
        const clean = base64Data.replace(/^data:application\/pdf;base64,/, '');
        const binary = atob(clean);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return true;
    }

    const [fsLoaded, shareLoaded] = await Promise.all([loadFilesystem(), loadShare()]);
    if (!fsLoaded || !shareLoaded) return false;

    try {
        // Önce cihazın Cache dizinine kaydet
        const clean = base64Data.replace(/^data:application\/pdf;base64,/, '');
        const result = await FilesystemPlugin.writeFile({
            path: filename,
            data: clean,
            directory: DirectoryEnum.Cache,
        });

        // Sonra native share sheet'i aç
        await SharePlugin.share({
            title,
            url: result.uri,
            dialogTitle: title,
        });
        return true;
    } catch (err) {
        console.error('[NativeShare] PDF paylaşım hatası:', err);
        return false;
    }
}

/**
 * Paylaşım özelliğinin kullanılabilir olup olmadığını kontrol eder.
 * @returns {Promise<boolean>}
 */
export async function canShare() {
    if (isNativePlatform()) {
        const loaded = await loadShare();
        if (!loaded) return false;
        try {
            const { value } = await SharePlugin.canShare();
            return value;
        } catch { return false; }
    }
    return !!(navigator.share || navigator.clipboard);
}
