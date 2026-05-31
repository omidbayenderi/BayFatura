export const shouldUseRedirectForWebAuth = (userAgent = '') => {
    const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    const isSafari = /Safari/i.test(ua)
        && !/Chrome|CriOS|Chromium|Edg|OPR|Firefox|FxiOS/i.test(ua);
    const isIOSWebKit = /iPhone|iPad|iPod/i.test(ua);
    return isSafari || isIOSWebKit;
};
