export const getSocialAuthErrorMessage = (providerLabel, err) => {
    const code = err?.code || '';
    const message = err?.message || '';
    const label = providerLabel || 'Social';

    if (code === 'auth/operation-not-allowed') {
        return `${label} sign-in is not enabled yet. Please use Google or email/password for now.`;
    }

    if (code === 'auth/popup-blocked') {
        return `${label} sign-in popup was blocked. Please allow popups and try again.`;
    }

    if (code === 'auth/popup-closed-by-user') {
        return `${label} sign-in was cancelled.`;
    }

    if (message.includes('redirect_uri_mismatch')) {
        return 'OAuth configuration error. Please contact support.';
    }

    return message || `${label} sign-in failed.`;
};
