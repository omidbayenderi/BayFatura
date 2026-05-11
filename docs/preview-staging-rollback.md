# Preview → Staging Rollback — BayFatura

> How to revert preview builds back to production config if staging setup causes problems.

## Rollback Scenarios

| Scenario | Action | What Happens |
|----------|--------|--------------|
| Staging config wrong → preview broken | Fix `.env.preview.local` or GitHub secrets | Re-run preview workflow |
| Staging project deleted → preview broken | Remove staging secrets, rebuild without mode | Falls back to production config |
| Don't want staging at all anymore | Delete staging secrets, remove `.env.preview` | All previews use production config again |
| Production accidentally pointed to staging | Fix `.env` back to production values, rebuild | Production fixed on next deploy |

## Fastest Rollback: Remove Staging Secrets

If preview builds are failing because staging is misconfigured:

### Option A: Remove staging secrets (preview falls back to production config)
```bash
# 1. Delete staging secrets from GitHub (Settings → Secrets → Actions)
#    Remove all STAGING_VITE_FIREBASE_* secrets

# 2. The preview workflow will get empty string for staging secrets
#    The build will use whatever .env.preview has (or fall back to .env)

# OR:

# Remove --mode preview from the workflow
# This makes preview builds use production config (same as production build)
```

### Option B: Temporarily disable the mode flag
Edit `.github/workflows/preview-deploy.yml`:
```yaml
# Change this:
run: npm run build:preview

# To this (temporary):
run: npm run build
```
And replace staging env vars with production ones. This makes preview point to production backend temporarily.

## Full Rollback: Remove All Staging Setup

```bash
# 1. Remove preview env file
rm .env.preview
rm -f .env.preview.local

# 2. Revert preview-deploy.yml to production-only build:
git checkout HEAD -- .github/workflows/preview-deploy.yml

# 3. Remove staging GitHub secrets via GitHub UI

# 4. Verify production is untouched
npm run build
npm test
npm run lint
```

## Verify Production Was Never Modified

```bash
# 1. Check no production deploy happened
git log --oneline --all | head -5

# 2. Check production Firebase project
npx firebase projects:list

# 3. Check hosting channels
npx firebase hosting:channel:list --project bayfatura-b283c

# 4. The live channel should show the last real deploy, not affected by staging work
```

## What Staging Setup Touches

| File | Modified? | Can Revert? |
|------|-----------|-------------|
| `.env` | ❌ Unchanged | N/A |
| `.env.preview` | ✅ New | Delete file |
| `.env.preview.local` | ✅ New (gitignored) | Delete file |
| `package.json` | ✅ Updated (added `build:preview` script) | `git checkout HEAD -- package.json` |
| `.github/workflows/preview-deploy.yml` | ✅ Updated | `git checkout HEAD -- .github/workflows/preview-deploy.yml` |
| `docs/firebase-environment-audit.md` | ✅ New | Delete or keep (read-only) |
| `docs/firebase-environment-plan.md` | ✅ New | Delete or keep |
| `docs/preview-staging-setup.md` | ✅ New | Delete or keep |
| `docs/staging-feature-flags.md` | ✅ New | Delete or keep |
| `config/staging-feature-flags-example.json` | ✅ New | Delete or keep |
| `docs/preview-staging-verification.md` | ✅ New | Delete or keep |
| `docs/preview-staging-rollback.md` | ✅ New | Delete or keep |

**Production files NOT touched:**

```
src/App.jsx, src/main.jsx       — No changes
src/pages/*                     — No changes
src/context/*                   — No changes
src/components/*                — No changes
src/lib/*                       — No changes (firebase.js reads env vars dynamically)
src/utils/*                     — No changes
functions/*                     — No changes
firebase.json, firestore.rules  — No changes
.firebaserc                     — No changes
.env                            — No changes (production config preserved)
```

## Confirm Production Is Intact

After any rollback:

```bash
# 1. Build with production config
npm run build

# 2. Verify no staging references in output
grep -c 'bayfatura-staging' dist/assets/*.js
# Expected: 0 (no staging references in production build)

# 3. Verify production Firebase project referenced
grep -c 'bayfatura-b283c' dist/assets/*.js
# Expected: > 0 (production project referenced)

# 4. Run full test suite
npm test

# 5. Lint
npm run lint
```
