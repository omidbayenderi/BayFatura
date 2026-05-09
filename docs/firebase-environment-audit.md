# Firebase Environment Audit — BayFatura

> Audit date: 2026-05-07
> Goal: Determine whether preview and production currently share the same Firebase backend.

## Current State: Single Firebase Project

**There is only ONE Firebase project:** `bayfatura-b283c`

Both the production live site AND preview deployments use the same Firebase backend. Here is the full chain:

### 1. Firebase Config Initialization

**File:** `src/lib/firebase.js`

```js
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
```

All values come from `import.meta.env.VITE_*` environment variables — these are baked into the JavaScript bundle at **build time**.

### 2. Environment Variable Source

| Build Type | Env File | VITE_APP_ENV | Firebase Project |
|------------|----------|--------------|------------------|
| `npm run dev` (local) | `.env` | `production` | `bayfatura-b283c` |
| `npm run build` (default) | `.env` | `production` | `bayfatura-b283c` |
| CI (`ci.yml`) | GitHub Secrets | `${{ secrets.VITE_APP_ENV }}` | `bayfatura-b283c` |
| Preview Deploy | GitHub Secrets | `preview` | `bayfatura-b283c` |
| Production Deploy | GitHub Secrets | `production` | `bayfatura-b283c` |

**All builds use the same `secrets.VITE_FIREBASE_*` values**, which point to `bayfatura-b283c`.

### 3. Firebase Hosting Deployment

| Channel | Project | Config |
|---------|---------|--------|
| `live` (production) | `bayfatura-b283c` | SPA rewrite, `firebase.json` |
| Preview channels (`pr-*`) | `bayfatura-b283c` | Same hosting config, different URL |

The hosting deployment goes to the same Firebase project for both live and preview. Only the channel differs.

### 4. What This Means

| Aspect | Production | Preview (current) |
|--------|-----------|-------------------|
| Hosting URL | `bayfatura.com` | `bayfatura-b283c--pr-*.web.app` |
| Firestore data | Production data | **Same production data** |
| Auth users | Production users | **Same auth database** |
| Storage files | Production files | **Same storage bucket** |
| Cloud Functions | Production functions | **No separate functions** |
| Feature flags Firestore doc | `app_config/feature_flags` | **Same document** |

### 5. Identified Risks

| Risk | Severity | Detail |
|------|----------|--------|
| Preview writes to production Firestore | **HIGH** | Creating test data in preview pollutes production DB |
| Preview reads production auth | **MEDIUM** | Same login, but could accidentally affect user state |
| Feature flags shared between environments | **HIGH** | Enabling a flag for testing in preview affects production if the Firestore doc is the same |
| Cloud Functions shared | **MEDIUM** | Functions deploy to production only; preview doesn't deploy functions |
| Storage files shared | **LOW** | Same bucket, but file access is auth-gated |

### 6. Conclusion

**Preview and production share the same Firebase backend.** The only separation is the hosting URL (preview channel vs live channel). Any test data created in preview goes directly to the production Firestore database.

**A separate staging Firebase project is needed for safe testing.**
