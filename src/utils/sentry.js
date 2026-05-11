const SENTRY_CDN_URL = 'https://browser.sentry-cdn.com/8.55.0/bundle.min.js';

let sentryLoaded = false;
let pendingQueue = [];

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] Skipped: no DSN configured');
    }
    return;
  }

  if (typeof window === 'undefined') return;

  if (window.Sentry) {
    initializeSentry(dsn);
    return;
  }

  loadSentryScript(dsn);
}

function loadSentryScript(dsn) {
  const script = document.createElement('script');
  script.src = SENTRY_CDN_URL;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.onload = () => {
    initializeSentry(dsn);
    processPendingQueue();
  };
  script.onerror = () => {
    console.warn('[Sentry] Failed to load CDN script');
  };
  document.head.appendChild(script);
}

function initializeSentry(dsn) {
  if (sentryLoaded) return;
  sentryLoaded = true;

  try {
    window.Sentry.init({
      dsn,
      environment: import.meta.env.VITE_APP_ENV || 'production',
      release: 'bayfatura@' + (import.meta.env.VITE_APP_VERSION || '0.0.0'),
      tracesSampleRate: 0.2,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'NetworkError when attempting to fetch resource',
        'The operation was aborted',
        'Failed to fetch',
        'Cancelled',
      ],
      beforeSend(event) {
        if (import.meta.env.DEV) return null;
        return event;
      },
    });
    console.log('[Sentry] Initialized for', import.meta.env.VITE_APP_ENV || 'production');
  } catch (err) {
    console.warn('[Sentry] Init failed:', err);
  }
}

function processPendingQueue() {
  while (pendingQueue.length > 0) {
    const item = pendingQueue.shift();
    if (item.type === 'exception') {
      captureException(item.error, item.context);
    }
  }
}

export function captureException(error, context) {
  if (window.Sentry?.getCurrentHub) {
    window.Sentry.captureException(error, { extra: context });
    return;
  }

  if (sentryLoaded) {
    pendingQueue.push({ type: 'exception', error, context });
  }

  if (import.meta.env.VITE_ERROR_REPORTING_URL) {
    try {
      fetch(import.meta.env.VITE_ERROR_REPORTING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error?.message || String(error),
          stack: error?.stack,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          ...context,
        }),
      }).catch(() => {});
    } catch (_) {
      // fetch error is intentionally swallowed
    }
  }
}

export function captureMessage(message, level = 'info') {
  if (window.Sentry?.getCurrentHub) {
    window.Sentry.captureMessage(message, level);
  }
}
