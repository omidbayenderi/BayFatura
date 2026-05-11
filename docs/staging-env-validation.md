# Staging Environment Validation — BayFatura

> Exact wiring diagram: how staging Firebase config flows from Firebase Console through `.env.preview` and GitHub secrets into the build output.

## Environment Variable Flow

```
Firebase Console (staging project)
        │
        ├───► .env.preview              (local dev: vite --mode preview)
        │         └──► import.meta.env.VITE_FIREBASE_*   ◄── used by src/lib/firebase.js
        │
        └───► GitHub Secrets            (CI: STAGING_VITE_FIREBASE_*)
                  └──► workflow env: override at build time
                            └──► import.meta.env.VITE_FIREBASE_*
                                       ◄── used by src/lib/firebase.js
```

## Required Variables

These **7 variables** are required for staging preview builds. Each comes from Firebase Console → Project Settings → General → Your apps → Web app.

| # | Variable | Where to Find | Required? |
|---|----------|---------------|-----------|
| 1 | `VITE_FIREBASE_API_KEY` | Firebase Console → Web app config → `apiKey` | ✅ Required |
| 2 | `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Web app config → `authDomain` | ✅ Required |
| 3 | `VITE_FIREBASE_PROJECT_ID` | Firebase Console → Web app config → `projectId` | ✅ Required |
| 4 | `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Web app config → `storageBucket` | ✅ Required |
| 5 | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Web app config → `messagingSenderId` | ✅ Required |
| 6 | `VITE_FIREBASE_APP_ID` | Firebase Console → Web app config → `appId` | ✅ Required |
| 7 | `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Console → Web app config → `measurementId` | Optional (used for Analytics) |

**Total: 7 variables.** If any of the first 6 is missing/empty, `isFirebaseConfigured()` returns false and the app runs in demo mode.

## Where Each Variable Is Wired

### In `.env.preview` (local preview builds)

| Variable | Current Value (placeholder) |
|----------|-----------------------------|
| `VITE_FIREBASE_API_KEY` | `AIzaSy_STAGING_API_KEY_HERE` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `bayfatura-staging.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `bayfatura-staging` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `bayfatura-staging.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `000000000000` |
| `VITE_FIREBASE_APP_ID` | `1:000000000000:web:xxxxxxxxxxxxxx` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-XXXXXXXXXX` |

### In GitHub workflow (`preview-deploy.yml`)

| Secret Name | Passed As Env Var |
|-------------|-------------------|
| `secrets.STAGING_VITE_FIREBASE_API_KEY` | `VITE_FIREBASE_API_KEY` |
| `secrets.STAGING_VITE_FIREBASE_AUTH_DOMAIN` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `secrets.STAGING_VITE_FIREBASE_PROJECT_ID` | `VITE_FIREBASE_PROJECT_ID` |
| `secrets.STAGING_VITE_FIREBASE_STORAGE_BUCKET` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `secrets.STAGING_VITE_FIREBASE_MESSAGING_SENDER_ID` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `secrets.STAGING_VITE_FIREBASE_APP_ID` | `VITE_FIREBASE_APP_ID` |
| `secrets.STAGING_VITE_FIREBASE_MEASUREMENT_ID` | `VITE_FIREBASE_MEASUREMENT_ID` |

### In `src/lib/firebase.js`

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

Fires up dynamically. No hardcoded values. No build-time config injection needed beyond env vars.

## Vite Mode Wiring

| Command | Vite Mode | Env Files Loaded | Firebase Project |
|---------|-----------|------------------|------------------|
| `npm run dev` | `development` (default) | `.env` | Production (`bayfatura-b283c`) |
| `npm run build` | `production` (default) | `.env` | Production (`bayfatura-b283c`) |
| `npm run build:preview` | `preview` | `.env` + `.env.preview` | Staging (`bayfatura-staging`) |

**Key detail:** Vite loads `.env` FIRST, then `.env.preview` OVERRIDES for the same keys. So even during staging builds, non-overridden variables (like `VITE_SENTRY_DSN`) still use their `.env` values.

## What Happens If a Variable Is Missing

| Scenario | Result |
|----------|--------|
| All 6 required vars missing/empty | `isFirebaseConfigured()` → `false` → app runs in **demo mode** (no Firebase connection) |
| Only `measurementId` missing | Analytics disabled. Everything else works. |
| Only `apiKey` missing | **Firebase init fails** (runtime error) |
| Wrong `projectId` | Auth/Firestore/Storage calls throw "project not found" errors |

## Safety: Production Config Is Never Modified

- `.env` (production config) is **never read or modified** by the preview build system
- `preview-deploy.yml` sets env vars at the step level, not globally, so production workflows are isolated
- `src/lib/firebase.js` has no hardcoded env — it reads `import.meta.env` at build time
- No runtime switching between staging/production — the choice is baked into the build artifact

There is **no mechanism** by which a preview build could accidentally use or expose production Firebase credentials. The staging build script (`npm run build:preview`) only loads `.env.preview` on top of `.env`, and the CI workflow overrides with staging secrets.
