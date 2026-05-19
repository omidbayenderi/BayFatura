# CI/CD — BayFatura

> Phase 4 deliverable. GitHub Actions workflows for continuous integration and deployment.

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to `preview-test-staging`, `main`, `develop` | Lint, test, Firestore rules test, build |
| `preview-deploy.yml` | PR to `preview-test-staging`/`main` | Validate app + rules, deploy to staging Firebase preview channel |
| `deploy-staging-rules.yml` | Manual `workflow_dispatch` | Validate and deploy Firestore/Storage rules to staging |
| `deploy-staging-functions.yml` | Manual `workflow_dispatch` | Validate and deploy Cloud Functions to staging |
| `deploy-production.yml` | Manual `workflow_dispatch` | Validate and deploy to production |

## Pipeline Steps

### CI (`ci.yml`)
1. Checkout code
2. Setup Node.js 22 with npm cache
3. Setup Java 21 for Firebase Emulator
4. `npm ci` (clean install)
5. `npm run lint`
6. `npm test`
7. `npm run test:rules`
8. `npm run build` (verifies production build succeeds)

### Preview Deploy (`preview-deploy.yml`)
1. Checkout
2. Setup Node.js + npm ci
3. Run lint, tests, and Firestore rules emulator tests
4. Build with `VITE_APP_ENV=staging`
5. Deploy to the staging Firebase Hosting preview channel (expires in 7 days)
6. Comment PR with preview URL

### Production Deploy (`deploy-production.yml`)
1. CI quality checks (lint, test, Firestore rules test, build)
2. Deploy hosting to Firebase `live` channel
3. Prepare production Firebase service account credentials
4. Optionally deploy Cloud Functions
5. Deploy Firestore & Storage rules

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
| `FIREBASE_SERVICE_ACCOUNT` | Production Firebase deploy service account JSON | Production deploy |
| `STAGING_FIREBASE_SERVICE_ACCOUNT` | Staging Firebase deploy service account JSON | Preview deploy |

## Setting Up Firebase for CI

### 1. Create a Service Account
- Go to: Firebase Console → Project Settings → Service Accounts
- Click "Generate New Private Key"
- Copy the JSON content

### 2. Add Secrets to GitHub
- Go to: GitHub repo → Settings → Secrets and variables → Actions
- Add each secret from the table above

## Environment Variable Strategy

| Environment | `VITE_APP_ENV` | Sentry | Preview URL |
|-------------|----------------|--------|-------------|
| Local dev | `development` | Disabled | `localhost:5173` |
| PR preview | `staging` | Disabled | `staging-project--pr-123.hosting.app` |
| Production | `production` | Active | `bayfatura.com` |

## Local CI Simulation

```bash
# Run the same checks as CI
npm run lint && npm test && npm run build
```

## Rollback via CI

To rollback a production deploy:
1. Revert the merge commit on the release branch
2. Run the manual production deploy workflow after review
3. Verify Firebase Hosting, rules, and functions state

Or use Firebase CLI directly:
```bash
npx -y firebase-tools@latest hosting:clone bayfatura-b283c/<version-hash> bayfatura-b283c/live
```

## Adding a New Workflow

1. Create `.github/workflows/<name>.yml`
2. Reference GitHub secrets with `${{ secrets.SECRET_NAME }}`
3. Test by pushing to a branch and opening a PR
