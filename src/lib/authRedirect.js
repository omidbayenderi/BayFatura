export const AUTH_REDIRECT_TARGET_KEY = 'bayfatura.auth.redirectTarget';
export const AUTH_REDIRECT_ERROR_KEY = 'bayfatura.auth.redirectError';

export const normalizeAuthRedirectTarget = (target) => {
    if (typeof target !== 'string' || !target.startsWith('/')) {
        return '/dashboard';
    }

    if (target.startsWith('//')) {
        return '/dashboard';
    }

    return target;
};

export const saveAuthRedirectTarget = (target) => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(AUTH_REDIRECT_TARGET_KEY, normalizeAuthRedirectTarget(target));
};

export const consumeAuthRedirectTarget = (fallback = '/dashboard') => {
    const safeFallback = normalizeAuthRedirectTarget(fallback);
    if (typeof window === 'undefined') return safeFallback;

    const target = window.sessionStorage.getItem(AUTH_REDIRECT_TARGET_KEY);
    window.sessionStorage.removeItem(AUTH_REDIRECT_TARGET_KEY);

    return normalizeAuthRedirectTarget(target || safeFallback);
};

export const saveAuthRedirectError = (error) => {
    if (typeof window === 'undefined') return;

    const message = error?.message || error?.code || 'Social sign-in failed. Please try again.';
    window.sessionStorage.setItem(AUTH_REDIRECT_ERROR_KEY, message);
};

export const consumeAuthRedirectError = () => {
    if (typeof window === 'undefined') return '';

    const message = window.sessionStorage.getItem(AUTH_REDIRECT_ERROR_KEY) || '';
    window.sessionStorage.removeItem(AUTH_REDIRECT_ERROR_KEY);
    return message;
};
