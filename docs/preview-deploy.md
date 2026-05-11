# Preview Deploy — BayFatura

> Preview-only CI/CD for safe testing. No production deployment.

## How Preview Deploy Works

Every pull request to `develop` or `main` triggers:

1. **Quality checks**: `npm ci` → `npm run lint` → `npm test` → `npm run build`
2. **Firebase Preview Channel**: Deploys the build to a temporary URL
3. **PR Comment**: Adds a comment with the preview URL

**Preview URL format:**
```
https://bayfatura-b283c--pr-<PR_NUMBER>.web.app
```

**Expires:** 7 days after last update.

## What Preview Deploy Does NOT Do

- Does NOT deploy to `live` channel
- Does NOT deploy Cloud Functions
- Does NOT update Firestore or Storage rules
- Does NOT affect production users
- Does NOT change any Firebase project settings

## Local Preview Deploy

For testing without CI:

```bash
npm run deploy:preview
```

This builds the app and deploys to a Firebase preview channel named `preview` that expires in 7 days. The URL will be shown in the terminal output.

## Feature Flags in Preview

All feature flags default to **OFF** in preview deploys. To test a flag-enabled feature in preview:

1. Go to Firebase Console → Firestore → `app_config/feature_flags`
2. Add/update a flag with `"enabled": true` and optionally `"betaTesters": ["your@email.com"]`
3. The preview URL will reflect the change after page refresh

## Workflow File

**Location:** `.github/workflows/preview-deploy.yml`

```yaml
on:
  pull_request:
    branches: [develop, main]

steps:
  - npm ci
  - npm run lint
  - npm test
  - npm run build
  - FirebaseExtended/action-hosting-deploy@v0  # NO channelId: live
  - Comment PR with preview URL
```

## Environment Variables

Build uses `VITE_APP_ENV=preview` for preview deploys. No production secrets (Sentry DSN, etc.) are needed.

## Required GitHub Secrets

| Secret | Required For |
|--------|--------------|
| `VITE_FIREBASE_API_KEY` | Build |
| `VITE_FIREBASE_AUTH_DOMAIN` | Build |
| `VITE_FIREBASE_PROJECT_ID` | Build + Deploy |
| `VITE_FIREBASE_STORAGE_BUCKET` | Build |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Build |
| `VITE_FIREBASE_APP_ID` | Build |
| `VITE_FIREBASE_MEASUREMENT_ID` | Build |
| `VITE_SUCCESS_URL` | Build |
| `VITE_CANCEL_URL` | Build |
| `VITE_FROM_EMAIL` | Build |
| `GITHUB_TOKEN` | Deploy (automatic) |
| `FIREBASE_SERVICE_ACCOUNT` | Deploy |
