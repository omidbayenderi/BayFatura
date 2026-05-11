# Production Guardrails — BayFatura

> Safety measures to prevent accidental production deployment.

## 1. Production Deploy is Manual-Only

The production workflow (`deploy-production.yml`) has been locked to **`workflow_dispatch` only**:

- No `push` trigger — pushing to `main` does NOT deploy
- No `tags` trigger — creating a `v*` tag does NOT deploy
- Only manual trigger via GitHub Actions UI

**How to manually trigger:**
1. Go to GitHub → Actions → "Deploy Production (Manual Only)"
2. Click "Run workflow"
3. Select the branch
4. Enter a reason (required)
5. Optionally check "Deploy Cloud Functions too"
6. Click "Run workflow"

## 2. GitHub Environment Protection (Recommended)

For additional safety, configure a GitHub **protected environment**:

1. Go to: GitHub repo → Settings → Environments
2. Create environment: `production`
3. Add required reviewers (e.g., at least 1 person)
4. Enable "Wait timer" (e.g., 5 minutes)
5. The production workflow already targets the `production` environment

## 3. npm Script Protection

The `deploy` script has been renamed to `deploy:production`:

```bash
# BEFORE (dangerous):
npm run deploy              # Deploys to live with no warning!

# AFTER (safe):
npm run deploy:production   # Shows warning before deploying
npm run deploy:preview      # Safe preview deploy (no live)
```

Running `npm run deploy:production` shows a clear warning before execution.

## 4. What Commits to Main Actually Do

Pushing to `main` branch triggers **only**:
- ✅ CI workflow (lint, test, build — NO deploy)
- ✅ Alert: No production deployment happens

## 5. Rollback Procedure

If a bad production deploy somehow happens:

```bash
# Option 1: Revert the triggering workflow run
# Option 2: Firebase Hosting rollback
firebase hosting:clone bayfatura-b283c/<previous-hash> bayfatura-b283c/live

# Option 3: Disable feature flags via Firestore
# Set killSwitch: true for any problematic flag
```

## 6. Deployment Authorization Matrix

| Action | Authorized By | Safety Check |
|--------|---------------|--------------|
| Push to `develop` | Any team member | CI must pass |
| Push to `main` | PR review + CI | CI must pass, NO deploy |
| Create PR | Any team member | Preview deploy |
| Run production deploy | Team lead / DevOps | Environment approval |
| Run `deploy:production` locally | Team lead | Explicit warning shown |
| Run `deploy:preview` locally | Any team member | Safe (no live) |

## 7. Verification Checklist (Before Production Deploy)

- [ ] All preview tests pass (see `preview-test-checklist.md`)
- [ ] CI passed on `main`
- [ ] No spike in Sentry errors
- [ ] Feature flags verified (flags for new features are OFF or graduated)
- [ ] Tester feedback collected
- [ ] Reason documented in `workflow_dispatch` input
