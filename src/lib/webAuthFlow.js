export const shouldUseRedirectForWebAuth = (userAgent = '') => {
    const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    const isIOSWebKit = /iPhone|iPad|iPod/i.test(ua);

    return isIOSWebKit;
};
