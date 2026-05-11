# Preview → Staging Setup — BayFatura

> How preview deployments use a separate staging Firebase backend while production stays on production Firebase.

## Architecture

```
Preview URL (bayfatura-b283c--pr-*.web.app)
    ↓ serves build created with --mode preview
    ↓ connects to STAGING Firebase (bayfatura-staging)
    ↓ separate Firestore, Auth, Storage

Production URL (bayfatura.com)
    ↓ serves build created with default mode
    ↓ connects to PRODUCTION Firebase (bayfatura-b283c)
    ↓ production Firestore, Auth, Storage
```

## Prerequisites: Create a Staging Firebase Project

You need a **second Firebase project** for staging. The existing project `bayfatura-b283c` stays as production.

### Step 1: Create the Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name: `bayfatura-staging` (or any name)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Register a Web App
1. In the staging project, go to Project Settings → General → Your apps
2. Click "Add app" → Web
3. App nickname: `bayfatura-staging-web`
4. Copy the Firebase config values

### Step 3: Set Up Services
| Service | Action |
|---------|--------|
| **Firestore** | Create database (choose a region). Copy rules from `firestore.rules` or use test mode temporarily |
| **Authentication** | Enable Email/Password, Google, Apple providers (same as production) |
| **Storage** | Set up storage. Copy rules from `storage.rules` or use test mode temporarily |
| **Feature Flags** | Create document `app_config/feature_flags` with all flags OFF |

### Step 4: Configure Local Environment
```bash
# Copy the preview env template
cp .env.preview .env.preview.local

# Edit .env.preview.local with your staging Firebase values:
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_AUTH_DOMAIN=...
# VITE_FIREBASE_PROJECT_ID=bayfatura-staging
# etc.
```

### Step 5: Configure GitHub Secrets
Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret | Value |
|--------|-------|
| `STAGING_VITE_FIREBASE_API_KEY` | Staging API key |
| `STAGING_VITE_FIREBASE_AUTH_DOMAIN` | Staging auth domain |
| `STAGING_VITE_FIREBASE_PROJECT_ID` | `bayfatura-staging` |
| `STAGING_VITE_FIREBASE_STORAGE_BUCKET` | Staging storage bucket |
| `STAGING_VITE_FIREBASE_MESSAGING_SENDER_ID` | Staging sender ID |
| `STAGING_VITE_FIREBASE_APP_ID` | Staging app ID |
| `STAGING_VITE_FIREBASE_MEASUREMENT_ID` | Staging measurement ID |

## How It Works

### Build Time
```
npm run build:preview
    → Vite mode: preview
    → Loads: .env (production defaults) + .env.preview (staging overrides)
    → All VITE_FIREBASE_* values are replaced with staging credentials
    → Build output: dist/ (connects to staging Firebase)
```

```
npm run build (or npm run build:production)
    → Vite mode: production (default)
    → Loads: .env only
    → VITE_FIREBASE_* values are production credentials
    → Build output: dist/ (connects to production Firebase)
```

### Deploy Time
```
Preview workflow:
    → Builds with staging Firebase config
    → Deploys to Firebase Hosting preview channel on production project
    → Preview URL serves staging-connected code

Production workflow:
    → Builds with production Firebase config
    → Deploys to Firebase Hosting live channel
    → bayfatura.com serves production-connected code
```

## What's Separated

| Resource | Production | Preview/Staging |
|----------|-----------|-----------------|
| Firebase project | `bayfatura-b283c` | `bayfatura-staging` |
| Firestore database | Production data | Empty (staging data stays here) |
| Auth users | Real users | Test users only |
| Storage | Production files | Test files only |
| Feature flags | Can be configured separately | Safe to experiment |
| Hosting URL | `bayfatura.com` | `bayfatura-b283c--pr-*.web.app` |

## What's Still Shared

| Resource | Why |
|----------|-----|
| Firebase Hosting project | Preview channels must be on a Firebase project with Hosting enabled. We use the production project for hosting only. The JavaScript code connects to staging Firebase. |
| Cloud Functions | Not deployed to staging. If preview tries to call `proxyImage` etc., it will hit the production Functions. This is acceptable for testing. |

## Files

| File | Purpose | Committed? |
|------|---------|------------|
| `.env` | Production Firebase config (real secrets) | ❌ (gitignored) |
| `.env.preview` | Staging Firebase config template (placeholders) | ✅ Yes |
| `.env.preview.local` | Staging Firebase config (real staging secrets) | ❌ (gitignored via `*.local`) |
| `.env.example` | Documentation template | ✅ Yes |

## Commands

```bash
# Production build (connects to PRODUCTION Firebase)
npm run build

# Preview build (connects to STAGING Firebase)
npm run build:preview

# Local dev (connects to PRODUCTION Firebase — as configured in .env)
npm run dev

# Local dev with staging (if you want)
VITE_APP_ENV=staging npm run dev -- --mode preview
```
