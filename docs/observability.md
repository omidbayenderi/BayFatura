# Observability — BayFatura

> Phase 3 deliverable. Error tracking, logging, and monitoring setup.

## 1. Sentry Error Tracking

### 1.1 Setup

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project: **BayFatura** (Platform: JavaScript)
3. Copy the DSN from Sentry → Settings → Client Keys
4. Set the DSN in your `.env` file:

```bash
VITE_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
VITE_APP_ENV=production
```

### 1.2 Architecture

Sentry is loaded dynamically via CDN (`sentry.js`):
- Script is only loaded if `VITE_SENTRY_DSN` is set
- Initialization happens after CDN script loads
- In dev mode (`VITE_APP_ENV=development`), events are discarded
- Source maps are not uploaded currently (can be added in CI)

### 1.3 What's Tracked

| Event Type | Auto | Manual | Notes |
|------------|------|--------|-------|
| Unhandled exceptions | ✅ | — | Caught by global error handler |
| Unhandled promise rejections | ✅ | — | Caught by global handler |
| React errors | ✅ | — | Caught by ErrorBoundary |
| Feature flag evaluations | — | ✅ | Via `logger.flag()` |
| API failures | — | ✅ | Via `captureException()` |

### 1.4 Ignored Errors

The following errors are filtered out by Sentry:
- `ResizeObserver loop limit exceeded` (benign browser warning)
- `NetworkError when attempting to fetch resource` (intermittent)
- `The operation was aborted` (user navigation)
- `Failed to fetch` (network issues)
- `Cancelled` (aborted requests)

## 2. Structured Logging

### 2.1 Logger Utility

Located at `src/utils/logger.js`. Usage:

```js
import { logger } from '../utils/logger';

logger.info('InvoiceContext', 'Invoice created', { invoiceId: '123' });
logger.error('BankMatcher', 'CSV parse failed', { fileName: 'statement.csv' });
logger.flag('mobile_card_layout', user.uid, true, { platform: 'web' });
```

### 2.2 Log Levels

| Level | Production | Development |
|-------|------------|-------------|
| DEBUG | Hidden | Shown |
| INFO | Shown | Shown |
| WARN | Shown | Shown |
| ERROR | Shown | Shown |

### 2.3 Module Naming Convention

Use PascalCase module names:
- `AuthContext`, `InvoiceContext`, `FeatureFlags`
- `BankMatcher`, `InvoiceEditor`, `Dashboard`
- `ServiceWorker`, `Sentry`, `Logger`

## 3. Error Boundaries

### 3.1 Current ErrorBoundary

The existing `ErrorBoundary` at `src/components/ErrorBoundary.jsx` wraps the entire app.

### 3.2 Adding Granular Boundaries

For critical sections, add additional error boundaries:

```jsx
<ErrorBoundary fallback={<InvoiceEditorFallback />}>
  <InvoiceEditor />
</ErrorBoundary>
```

Recommended granular boundaries:
- Invoice editor (critical creation flow)
- Dashboard (main user view)
- Reports (financial data)

## 4. Feature Flag Logging

All feature flag evaluations are logged via `logger.flag()`:
- Flag name, hashed user ID, result
- This helps debug rollout issues
- In production, logs are visible in browser console at INFO level

## 5. Build-Time Environment Validation

The build process checks for required environment variables:

```bash
VITE_FIREBASE_API_KEY      # Required
VITE_FIREBASE_AUTH_DOMAIN  # Required
VITE_FIREBASE_PROJECT_ID   # Required
VITE_SENTRY_DSN            # Optional (Sentry disabled if empty)
```

## 6. Monitoring Checklist

- [ ] Sentry DSN configured in production `.env`
- [ ] Sentry project created with correct platform (JavaScript)
- [ ] Error boundary wrapping critical UI sections
- [ ] Feature flag logging active
- [ ] Console errors reviewed periodically

## 7. Rollback Monitoring

When rolling back a release:
1. Check Sentry for error spike before vs. after
2. Check Firebase Hosting rollback
3. Verify feature flag kill switch worked
4. Confirm no regression in invoice creation flow
