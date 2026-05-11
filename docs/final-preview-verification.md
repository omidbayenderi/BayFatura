# Final Preview Verification — BayFatura

> Step-by-step: from zero to a verified preview with my-account-only feature flags, staging backend, and confirmed production safety.

## Prerequisites Checklist

- [ ] Staging Firebase project created in Firebase Console
- [ ] Firestore database created in staging project
- [ ] Auth providers enabled in staging project (Email/Password, Google, Apple)
- [ ] `app_config/feature_flags` document created in staging Firestore (all flags OFF)
- [ ] Staging GitHub secrets added (see `docs/github-staging-secrets.md`)
- [ ] Real staging values ready to paste into `.env.preview`

---

## Phase 1: Apply Staging Credentials

### Step 1 — Provide me your staging Firebase config values

From Firebase Console → Staging project → Project Settings → Web app, give me:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

I'll update `.env.preview` with the real values (keeping `.env` untouched).

### Step 2 — Add GitHub staging secrets

Go to GitHub → Repo → Settings → Secrets and variables → Actions → Add the 7 secrets listed in `docs/github-staging-secrets.md`.

Named exactly: `STAGING_VITE_FIREBASE_*`

### Step 3 — Optional: Copy `.env.preview` to `.env.preview.local`

```bash
cp .env.preview .env.preview.local
```

Edit `.env.preview.local` with your real staging values. This file is gitignored (via `*.local` pattern). Use this for local testing with `npm run build:preview`.

---

## Phase 2: Deploy & Verify

### Step 4 — Open any PR (or your test PR)

```bash
git checkout -b test/preview-staging
# make a trivial change (e.g. update a comment)
git add -A && git commit -m "test: preview staging verification"
git push -u origin test/preview-staging
```

Create a PR on GitHub from this branch → `develop` or `main`.

### Step 5 — Wait for the preview deploy action

GitHub Actions will run:
1. `npm ci` — install dependencies
2. `npm run lint` — lint check
3. `npm test` — 37 tests
4. `npm run build:preview` — build with staging config
5. `firebase hosting:channel:deploy` — deploy to preview channel

When complete, the action will comment on the PR with the preview URL.

### Step 6 — Verify staging project on preview URL

Open the preview URL in your browser. Run in DevTools Console:

```javascript
// Check which Firebase project is connected
const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
// If the app is already initialized, just get it
const app = firebase.app();  // or window.__FIREBASE_APP__
console.log('🔥 Project:', app.options.projectId);
```

**Expected:** Shows your staging project ID (e.g. `bayfatura-staging`).

### Step 7 — Verify production on production URL

Open your production URL (`bayfatura.com`). Run the same check:

**Expected:** Shows `bayfatura-b283c`.

---

## Phase 3: Feature Flag Verification

### Step 8 — Enable a flag for my account only

In staging Firestore Console → `app_config/feature_flags` → Set:
```json
mobile_card_layout.enabled = true
mobile_card_layout.allowedEmails = ["your@email.com"]
```

All other fields stay default (empty arrays).

### Step 9 — Verify flag ON in preview

1. Open preview URL
2. Login with `your@email.com`
3. `mobile_card_layout` feature should be visible/active
4. Verify the feature matches your expectations

### Step 10 — Verify flag OFF in production

1. Open production URL (`bayfatura.com`)
2. Login with the same email
3. `mobile_card_layout` should NOT be visible/active
4. (If it IS visible, file an emergency issue — means staging/production are sharing the same Firestore)

### Step 11 — Kill switch test (optional)

In staging Firestore, keep `mobile_card_layout.enabled = true` but add:
```json
mobile_card_layout.killSwitch = true
```

**Expected:** Flag is OFF even for your email. The kill switch overrides all targeting.

---

## Phase 4: Acceptance Confirmation

- [ ] Preview URL loads without errors
- [ ] DevTools shows staging Firebase project ID
- [ ] Production URL still shows `bayfatura-b283c` project ID
- [ ] My-account-only feature flag works in preview
- [ ] Same feature flag is OFF in production
- [ ] Creating a user in staging Auth does NOT create them in production
- [ ] `npm run build` (production mode) produces output with `bayfatura-b283c` references
- [ ] `npm run build:preview` produces output with staging project references
- [ ] All 37 tests pass
- [ ] Lint passes with 0 errors, 0 warnings

## If Something Goes Wrong

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| Preview URL loads with demo data | Staging GitHub secrets are empty/missing | Add staging secrets to GitHub |
| Preview shows `projectId: bayfatura-b283c` | Build didn't use staging config | Check workflow env vars, check `npm run build:preview` vs `npm run build` |
| Preview Firebase calls fail with "permission denied" | Firestore rules deny staging project | Update Firestore rules in staging, or use test mode temporarily |
| Production shows staging flags | Production Firestore has the same feature_flags doc | Check `app_config/feature_flags` in production Firestore — delete it if present |

## Final Verification Script

```bash
# Run this locally after any changes:
npm run build          # Production-mode build
npm run build:preview  # Staging-mode build

# Check for correct project references in built output:
echo "=== PRODUCTION BUILD ==="
grep -o 'bayfatura-b283c' dist/assets/*.js | head -1
grep -o 'bayfatura-staging' dist/assets/*.js | head -1

npm run build:preview
echo "=== STAGING BUILD ==="
grep -o 'bayfatura-b283c' dist/assets/*.js | head -1
grep -o 'bayfatura-staging' dist/assets/*.js | head -1
```

**Expected output:**
```
=== PRODUCTION BUILD ===
bayfatura-b283c
grep: (no match for staging in production build)
=== STAGING BUILD ===
grep: (no match for production in staging build)
bayfatura-staging
```
