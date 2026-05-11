# GitHub Staging Secrets Checklist — BayFatura

> Exact list of secrets to add in GitHub for staging preview deployments.

## Where to Add

GitHub → Your repo → Settings → Secrets and variables → Actions → New repository secret

## The 7 Secrets

| # | Secret Name | Value Source | Required? |
|---|-------------|-------------|-----------|
| 1 | `STAGING_VITE_FIREBASE_API_KEY` | Firebase Console → Web app config → `apiKey` | ✅ Yes |
| 2 | `STAGING_VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Web app config → `authDomain` | ✅ Yes |
| 3 | `STAGING_VITE_FIREBASE_PROJECT_ID` | Firebase Console → Web app config → `projectId` | ✅ Yes |
| 4 | `STAGING_VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Web app config → `storageBucket` | ✅ Yes |
| 5 | `STAGING_VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Web app config → `messagingSenderId` | ✅ Yes |
| 6 | `STAGING_VITE_FIREBASE_APP_ID` | Firebase Console → Web app config → `appId` | ✅ Yes |
| 7 | `STAGING_VITE_FIREBASE_MEASUREMENT_ID` | Firebase Console → Web app config → `measurementId` | No (optional) |

## Existing Secrets (Already Present)

These are already in your GitHub secrets (used by deploy-production.yml and preview-deploy.yml):

| Secret Name | Purpose |
|-------------|---------|
| `FIREBASE_SERVICE_ACCOUNT` | Deploy auth for Firebase Hosting |
| `VITE_FIREBASE_PROJECT_ID` | Production project ID (used by preview workflow as fallback) |
| `VITE_SUCCESS_URL` | Stripe success URL (from production) |
| `VITE_CANCEL_URL` | Stripe cancel URL (from production) |
| `VITE_FROM_EMAIL` | Resend sender email (from production) |

These existing secrets are **NOT staging secrets**. They're used as fallbacks when staging secrets aren't set, or for the production deploy workflow.

## How the Workflow Uses These Secrets

In `preview-deploy.yml`, the Build step passes staging secrets as env vars:

```yaml
- name: Build (staging mode)
  run: npm run build:preview
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.STAGING_VITE_FIREBASE_API_KEY }}
    VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.STAGING_VITE_FIREBASE_AUTH_DOMAIN }}
    VITE_FIREBASE_PROJECT_ID: ${{ secrets.STAGING_VITE_FIREBASE_PROJECT_ID }}
    VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.STAGING_VITE_FIREBASE_STORAGE_BUCKET }}
    VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.STAGING_VITE_FIREBASE_MESSAGING_SENDER_ID }}
    VITE_FIREBASE_APP_ID: ${{ secrets.STAGING_VITE_FIREBASE_APP_ID }}
    VITE_FIREBASE_MEASUREMENT_ID: ${{ secrets.STAGING_VITE_FIREBASE_MEASUREMENT_ID }}
```

These env vars **override** whatever is in `.env.preview` because at build time, GitHub Actions environment variables take precedence over `.env` files.

Wait — actually, I need to verify this. Let me check how Vite resolves env vars.

Vite's env var resolution order (highest priority first):
1. Actual process env vars (including GitHub action env:)
2. `.env.[mode].local` — e.g. `.env.preview.local`
3. `.env.[mode]` — e.g. `.env.preview`
4. `.env.local`
5. `.env`

So yes, the workflow env vars (which set `VITE_FIREBASE_API_KEY` etc. as actual process env vars) will override whatever is in `.env.preview`.

## Exact Procedure

1. Open Firebase Console → Select YOUR STAGING PROJECT (not bayfatura-b283c)
2. Go to Project Settings → General → Your apps → Web app
3. You'll see a config object like:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "bayfatura-staging.firebaseapp.com",
     projectId: "bayfatura-staging",
     storageBucket: "bayfatura-staging.firebasestorage.app",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef...",
     measurementId: "G-XXXXXXXXXX"
   };
   ```
4. For each key, create a GitHub secret:
   - Secret name: `STAGING_VITE_FIREBASE_API_KEY`
   - Secret value: the `apiKey` value (e.g. `AIzaSy...`)
5. Repeat for all 7 values

## What If I Skip Adding These Secrets?

If you don't add the staging secrets, the preview workflow's build step will receive **empty strings** for all `STAGING_VITE_FIREBASE_*` values. This means:

- `isFirebaseConfigured()` returns `false` (because `apiKey` is empty)
- The app loads in **demo mode** with fake data
- No Firebase connection is attempted
- The preview URL is still created and accessible
- You can test UI, navigation, responsive layout, etc.
- You CANNOT test Firebase-dependent features (auth, Firestore, storage)

**This is the safe fallback.** If the staging secrets aren't configured, the preview still works — just with demo data instead of real data.
