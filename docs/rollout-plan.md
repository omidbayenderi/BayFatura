# Rollout Plan — BayFatura

> Phase 8 deliverable. Defines rollout stages, promotion criteria, and rollback procedures.

## 1. Feature Rollout Stages

| Stage | Name | Audience | Duration | Gate |
|-------|------|----------|----------|------|
| 0 | **Internal** | Dev team only | 1-2 days | PR merged to `develop` |
| 1 | **Selected Testers** | 5-10 beta users | 3-5 days | Manual QA sign-off |
| 2 | **5% Rollout** | 5% of users/companies | 3-5 days | No critical errors |
| 3 | **25% Rollout** | 25% of users/companies | 5-7 days | No regression in invoicing |
| 4 | **50% Rollout** | 50% of users/companies | 3-5 days | All metrics stable |
| 5 | **100% Rollout** | All users | - | Full release |

## 2. Promotion Checklist

Before promoting a feature from one stage to the next, verify:

### Stage 0 → Stage 1 (Internal → Selected Testers)
- [ ] Feature code reviewed and merged to `develop`
- [ ] CI passed (lint, test, build)
- [ ] Preview deploy successful
- [ ] No console errors in preview
- [ ] Feature flag is disabled by default — only testers with override see it

### Stage 1 → Stage 2 (Selected Testers → 5%)
- [ ] No critical errors reported in Sentry
- [ ] All testers confirm core flow works
- [ ] No regression in invoice creation
- [ ] Performance acceptable (no jank, < 3s load time)
- [ ] Rollout percentage configured in Firestore `app_config/feature_flags`

### Stage 2 → Stage 3 (5% → 25%)
- [ ] Error rate < 0.1% on flagged users
- [ ] No support tickets related to feature
- [ ] Feature flag metrics show expected usage

### Stage 3 → Stage 4 (25% → 50%)
- [ ] All critical paths pass
- [ ] No performance degradation
- [ ] Business metrics positive

### Stage 4 → Stage 5 (50% → 100%)
- [ ] Feature stable for 3+ days at 50%
- [ ] No pending issues
- [ ] Team approves full rollout

## 3. Feature Flag Configuration by Stage

### Stage 0-1: Internal/Testers Only
```json
{
  "mobile_card_layout": {
    "enabled": false,
    "betaTesters": ["tester1@bayfatura.com", "tester2@bayfatura.com"]
  }
}
```

### Stage 2: 5% Rollout
```json
{
  "mobile_card_layout": {
    "enabled": true,
    "rolloutPercentage": 5
  }
}
```

### Stage 3: 25% Rollout
```json
{
  "mobile_card_layout": {
    "enabled": true,
    "rolloutPercentage": 25
  }
}
```

### Stage 4-5: Full Rollout
```json
{
  "mobile_card_layout": {
    "enabled": true
  }
}
```

## 4. Rollback Procedures

### Web Rollback (3 options, fastest first)

**Option A: Kill Switch (seconds)**
```json
// Set this in Firestore app_config/feature_flags:
{
  "beta_invoice_editor": {
    "killSwitch": true
  }
}
```
Effect: Flags with `killSwitch: true` are immediately disabled for all users.

**Option B: Revert & Deploy (minutes)**
```bash
git revert HEAD
git push origin main
# CI auto-deploys
```

**Option C: Firebase Hosting Rollback (minutes)**
```bash
# List versions
firebase hosting:channel:list

# Clone a previous version to live
firebase hosting:clone bayfatura-b283c/<previous-hash> bayfatura-b283c/live
```

### Native Beta Rollback
```bash
# Option 1: Remove tester group in Firebase App Distribution
# Option 2: Revert native-specific feature flags
# Option 3: Submit app update or remove from TestFlight
```

## 5. Beta Web (Preview Channels)

Every PR to `develop` or `main` gets a preview URL:
```
https://bayfatura-b283c--pr-123.hosting.app
```

- Expires after 7 days
- Uses separate Sentry project (or Sentry disabled)
- Feature flags can be overridden per session via URL params

## 6. Native Beta (Firebase App Distribution)

- Android: APK/AAB distributed via Firebase App Distribution
- iOS: TestFlight or Firebase App Distribution
- Invited testers only
- Documented in `native-beta-distribution.md`

## 7. Monitoring During Rollout

| Metric | Tool | Alert Threshold |
|--------|------|----------------|
| Error rate | Sentry | > 0.5% increase |
| Crash-free rate | Sentry | < 99.5% |
| Invoice creation success | Custom logging | < 98% |
| Page load time | Browser DevTools | > 5s |
| API response time | Firebase Console | > 3s |

## 8. Communication Plan

| Stage | Who to Notify | Channel |
|-------|---------------|---------|
| Internal | Dev team | Slack/Teams |
| Selected Testers | Testers via email | Email + in-app notification |
| 5% | No notification | Silent rollout |
| 25% | No notification | Silent rollout |
| 50% | Internal only | Slack |
| 100% | All users | In-app notification + changelog |
