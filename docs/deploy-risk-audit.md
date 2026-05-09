# Deploy Risk Audit — BayFatura

> Audit date: 2026-05-07
> Purpose: Identify all paths that could deploy to Firebase live production.

## Audit Findings

### Risk 1: `npm run deploy` script (HIGH)

**File:** `package.json` line 12
```json
"deploy": "npm run build && npx firebase deploy --only hosting,functions,firestore,storage"
```

**Risk:** Running `npm run deploy` (or `npm run deploy`) from any machine with Firebase credentials deploys to the **live channel** of `bayfatura-b283c`. No confirmation prompt, no environment check. Anyone with access to `.env` or Firebase token can accidentally run this.

**Mitigation:** Renamed to `deploy:production` to make the danger explicit.

---

### Risk 2: Production GitHub Action (HIGH)

**File:** `.github/workflows/deploy-production.yml`

**Risk:** This workflow auto-triggers on `push` to `main` branch AND tags `v*`. It uses `channelId: live` to deploy to production Firebase Hosting. It also deploys Cloud Functions and Firestore/Storage rules directly. If anyone pushes to `main`, production is automatically updated with no manual approval.

**Mitigation:** Removed `push` trigger. Changed to `workflow_dispatch` only (manual trigger via GitHub UI). Added environment protection requirement.

---

### Risk 3: CI triggers on push to main (LOW)

**File:** `.github/workflows/ci.yml` line 5
```yaml
push:
    branches: [main, develop]
```

**Risk:** While the CI workflow only lints/tests/builds (no deploy), it runs on every push to `main`. If combined with automatic merge, it could mask deployment issues. Low risk but worth noting.

**Mitigation:** No change needed — the CI workflow does not deploy. It provides valuable pre-merge verification.

---

### Risk 4: Firebase project alias (MEDIUM)

**File:** `.firebaserc`
```json
{ "default": "bayfatura-b283c" }
```

**Risk:** The default Firebase project is the production project. Any `firebase deploy` command without specifying `--project` will deploy to production. There is no separate staging/preview project.

**Mitigation:** Documented. A separate Firebase project for staging is recommended but out of scope for preview-only setup.

---

### Risk 5: No preview channel on main (LOW)

**File:** `.github/workflows/deploy-preview.yml`

**Risk:** The preview workflow only triggers on PR. The CI workflow (on push to main) does not deploy to any preview channel. This is acceptable for preview-only setup since production pushes require manual `workflow_dispatch`.

---

### Risk 6: Firebase Functions auto-deploy (MEDIUM)

**Risk:** Cloud Functions are deployed as part of `firebase deploy --only functions`. If the production workflow is triggered, functions get updated without canary or gradual rollout. Firebase Functions do not have preview channels like Hosting.

**Mitigation:** Production deploy is now manual-only (`workflow_dispatch`).

---

## Risk Summary

| # | Risk | Severity | Status |
|---|------|----------|--------|
| 1 | `npm run deploy` deploys to live | HIGH | Mitigated — renamed to `deploy:production` |
| 2 | Auto-deploy on push to main | HIGH | Mitigated — removed auto-trigger |
| 3 | CI runs on push to main | LOW | Accepted — no deploy in CI |
| 4 | No separate staging project | MEDIUM | Documented — out of scope |
| 5 | No preview on main push | LOW | Accepted — preview is PR-only |
| 6 | Functions have no canary deploy | MEDIUM | Mitigated — manual trigger only |

## Conclusion

After mitigations, **there is no automated path to production deployment**. All production deploys require:
1. Manual `workflow_dispatch` trigger in GitHub Actions
2. GitHub environment approval
3. Explicit `npm run deploy:production` from a developer machine
