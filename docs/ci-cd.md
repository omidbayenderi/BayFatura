# CI/CD — BayFatura

> Phase 4 deliverable. GitHub Actions workflows for continuous integration and deployment.

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push to `main`/`develop`, PR to `main`/`develop` | Lint, test, build |
| `deploy-preview.yml` | PR to `develop`/`main` | Deploy to Firebase preview channel |
| `deploy-production.yml` | Push to `main` (incl. tags `v*`) | Deploy to production |

## Pipeline Steps

### CI (`ci.yml`)
1. Checkout code
2. Setup Node.js 20 with npm cache
3. `npm ci` (clean install)
4. `npm run lint`
5. `npm test`
6. `npm run build` (verifies production build succeeds)

### Preview Deploy (`deploy-preview.yml`)
1. Checkout
2. Setup Node.js + npm ci
3. Build with `VITE_APP_ENV=preview`
4. Deploy to Firebase Hosting preview channel (expires in 7 days)
5. Comment PR with preview URL

### Production Deploy (`deploy-production.yml`)
1. CI quality checks (lint, test, build)
2. Deploy hosting to Firebase `live` channel
3. Deploy Cloud Functions
4. Deploy Firestore & Storage rules
5. Create GitHub Release (if tagged with `v*`)

## Required GitHub Secrets

| Secret | Description | Required For |
|--------|-------------|--------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | All builds |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | All builds |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | All builds |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket | All builds |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | All builds |
| `VITE_FIREBASE_APP_ID` | App ID | All builds |
| `VITE_FIREBASE_MEASUREMENT_ID` | Measurement ID | All builds |
| `VITE_SUCCESS_URL` | Stripe success URL | All builds |
| `VITE_CANCEL_URL` | Stripe cancel URL | All builds |
| `VITE_FROM_EMAIL` | Resend from email | All builds |
| `VITE_SENTRY_DSN` | Sentry DSN | Production only |
| `VITE_APP_ENV` | Environment name | All builds |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase deploy service account JSON | Preview & production deploy |
| `FIREBASE_DEPLOY_TOKEN` | Firebase CI token | Production function/rule deploy |

## Setting Up Firebase for CI

### 1. Generate a Firebase CI Token
```bash
npx firebase login:ci
# Copy the token output
```

### 2. Create a Service Account
- Go to: Firebase Console → Project Settings → Service Accounts
- Click "Generate New Private Key"
- Copy the JSON content

### 3. Add Secrets to GitHub
- Go to: GitHub repo → Settings → Secrets and variables → Actions
- Add each secret from the table above

## Environment Variable Strategy

| Environment | `VITE_APP_ENV` | Sentry | Preview URL |
|-------------|----------------|--------|-------------|
| Local dev | `development` | Disabled | `localhost:5173` |
| PR preview | `preview` | Disabled | `project--pr-123.hosting.app` |
| Production | `production` | Active | `bayfatura.com` |

## Local CI Simulation

```bash
# Run the same checks as CI
npm run lint && npm test && npm run build
```

## Rollback via CI

To rollback a production deploy:
1. Revert the merge commit on `main`
2. Push the revert
3. CI will auto-deploy the reverted version

Or use Firebase CLI directly:
```bash
npx firebase hosting:clone bayfatura-b283c/<version-hash> bayfatura-b283c/live
```

## Adding a New Workflow

1. Create `.github/workflows/<name>.yml`
2. Reference GitHub secrets with `${{ secrets.SECRET_NAME }}`
3. Test by pushing to a branch and opening a PR
