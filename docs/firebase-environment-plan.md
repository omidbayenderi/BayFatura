# Firebase Environment Separation Plan — BayFatura

> Design for separating preview/staging from production Firebase backends.

## Architecture Decision

**Approach: Same Firebase Hosting project, separate Firebase backend project for preview.**

```
Production Build:
  .env (PROD Firebase config)
    → Vite build (mode: production)
    → Firebase Hosting live channel
    → Connects to: PRODUCTION Firebase (bayfatura-b283c)

Preview Build:
  .env (PROD) + .env.preview (STAGING overrides)
    → Vite build (mode: preview)
    → Firebase Hosting preview channel on production project
    → Connects to: STAGING Firebase (bayfatura-staging)
```

## Why This Approach

| Option | Pros | Cons | Chosen? |
|--------|------|------|---------|
| Separate Firebase project for staging | Full data isolation, real testing | Requires creating new project, setting up Firestore/Auth/Storage | ✅ Yes |
| Same project, separate Firestore DB | Less setup | Complex, still shares Auth/Storage | ❌ No |
| Same project, rely only on feature flags | No infra work | Preview still writes to production data | ❌ No |

## What Staging Needs

For safe preview testing, the staging Firebase project (`bayfatura-staging`) needs:

| Service | Required? | Setup |
|---------|-----------|-------|
| Firestore | ✅ Yes | Create database, copy security rules |
| Authentication | ✅ Yes | Enable Email/Password + Google + Apple providers |
| Storage | ✅ Yes | Copy security rules |
| Feature Flags doc | ✅ Yes | Create `app_config/feature_flags` with `enabled: false` defaults |
| Cloud Functions | ⏳ Optional | Not needed for frontend testing; Stripe/AI features won't work in preview |
| Hosting | ❌ No | Preview channels on production project handle this |

## Vite Environment Mode Strategy

Vite supports mode-specific `.env` files:

```
.env                    # Loaded in all modes (production values — keep as-is)
.env.preview            # Loaded when --mode preview is passed (staging overrides)
```

Loading order (later overrides earlier):
```
.env → .env.preview
```

This means:
- `.env` keeps production values (API key, project ID, etc.)
- `.env.preview` ONLY overrides Firebase-related values with staging credentials
- Non-Firebase values (Stripe URLs, email from) stay on production defaults

## Build Commands

| Command | Mode | Env Files Used | Firebase Backend |
|---------|------|----------------|------------------|
| `npm run build` | production (default) | `.env` | Production |
| `npm run build:preview` | preview | `.env` + `.env.preview` | Staging |
| `npm run dev` | development | `.env` + `.env.development` | Production (current) |

## GitHub Actions Changes

### Preview Workflow
- Uses `--mode preview` for Vite build
- Reads staging Firebase secrets (`secrets.STAGING_VITE_FIREBASE_*`) instead of production secrets
- Hosting deploy stays on production project (preview channels)

### Production Workflow
- No changes — still uses production secrets
- Still deploys to `live` channel

## Required Staging Firebase Project

User must create: **`bayfatura-staging`** (or any name)

Required config values (get from Firebase Console → Project Settings → Web App):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```
