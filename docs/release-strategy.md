# Release Strategy — BayFatura

> Phase 1 deliverable. Defines branch strategy, release channels, and rollout workflow.

## 1. Branch Strategy

### 1.1 Branches

```
main                          # Production-stable code. Deployed to Firebase Hosting production.
├── develop                   # Integration branch for feature work.
│   ├── feature/phase-2-ff    # Feature flags implementation
│   ├── feature/phase-3-sentry # Sentry activation
│   ├── feature/phase-5-mobile # Mobile improvements
│   └── feature/phase-7-capacitor # Capacitor integration
├── release/stable-web        # Current stable web release (tagged)
└── beta/native               # Capacitor native beta branch
```

### 1.2 Workflow

```
feature/*  →  develop  →  main (via PR, CI must pass)
beta/*     →  separate deploy, never merged to main without approval
```

### 1.3 Protection Rules (to be configured in GitHub)

- `main`: Require PR, require CI passing, require 1 approval, no direct push
- `develop`: Require PR, require CI passing
- Direct pushes only allowed to `feature/*` and `beta/*` branches

## 2. Release Channels

| Channel | Branch | Deploy Target | Audience | Update Frequency |
|---------|--------|---------------|----------|-----------------|
| **stable-web** | `main` | Firebase Hosting (production) | All production users | Weekly or bi-weekly |
| **beta-web** | `develop` | Firebase Hosting preview channel | Internal + selected testers | Per PR / continuous |
| **native-beta** | `beta/native` | Firebase App Distribution | Invited testers only | Per build |

### 2.1 Stable Web (`main`)
- All production users continue here
- Only changes that have passed beta validation are merged
- Feature flags protect risky functionality
- Tagged releases: `v1.0.0`, `v1.1.0`, etc.

### 2.2 Beta Web (`develop`)
- Internal team + opt-in testers
- New features and improvements land here first
- Feature flags allow toggling for specific users/companies
- Deployed to Firebase Hosting preview channel

### 2.3 Native Beta (`beta/native`)
- Capacitor iOS/Android builds
- Distributed via Firebase App Distribution
- Invited testers only
- Separate from web codebase (Capacitor wraps the web app)

## 3. GitHub Flow & PR Process

```
1. Create feature branch from develop:
   git checkout develop
   git checkout -b feature/phase-2-ff

2. Make changes, commit frequently

3. Create PR to develop:
   - CI runs: install → lint → test → build → preview deploy
   - Reviewer approves
   - Merge to develop → auto-deploys to beta preview

4. Release to stable:
   - Create PR from develop to main
   - CI runs full suite
   - Merge to main → auto-deploys to production
   - Tag release: git tag v1.x.x
```

## 4. Environment Strategy

| Environment | Firebase Project | Hosting Channel | Variables |
|-------------|-----------------|-----------------|-----------|
| **local** | bayfatura-b283c | `localhost:5173` | `.env` + `.env.local` |
| **preview** | bayfatura-b283c | Preview channel (PR-based) | GitHub secrets → `.env` |
| **production** | bayfatura-b283c | `live` channel | GitHub secrets → `.env.production` |

All environments use the same Firebase project (`bayfatura-b283c`) but with:
- Different Sentry DSNs (empty for local/preview, real for production)
- Different log levels
- Feature flags toggled appropriately

## 5. Feature Flag Strategy

Flags are used to gate all risky changes. See `docs/feature-flags.md` (Phase 2) for full implementation.

### Flag Categories
- **Stable flags**: On for all by default, can be disabled per-company
- **Beta flags**: Off by default, enabled for beta testers
- **Kill switches**: Emergency disable for any flag

### Flag Examples
```json
{
  "mobile_card_layout": { "enabled": false, "type": "beta" },
  "optimized_invoice_list": { "enabled": false, "type": "beta" },
  "virtualized_customer_list": { "enabled": false, "type": "beta" },
  "new_dashboard_metrics": { "enabled": false, "type": "beta" },
  "beta_invoice_editor": { "enabled": false, "type": "beta", "kill_switch": true },
  "native_camera_receipts": { "enabled": false, "type": "native" },
  "native_push_notifications": { "enabled": false, "type": "native" }
}
```

## 6. Rollout Stages for Feature Promotion

| Stage | Users | Duration | Validation |
|-------|-------|----------|------------|
| **internal** | Dev team only | 1-2 days | Manual QA |
| **selected_testers** | 5-10 beta users | 3-5 days | No critical errors |
| **5_percent** | 5% random companies | 3-5 days | No crash spike |
| **25_percent** | 25% random companies | 5-7 days | No regression in invoice flow |
| **50_percent** | 50% random companies | 3-5 days | All metrics stable |
| **100_percent** | All users | - | Full rollout |

### Promotion Requirements
1. No spike in critical errors (Sentry)
2. No serious regression in invoice creation flow
3. No unacceptable performance degradation
4. Support and tester feedback acceptable

## 7. Rollback Procedures

### 7.1 Web Rollback
```bash
# Option 1: Revert the PR and deploy
git revert <merge-commit-hash>
git push origin main
# CI will auto-deploy to production

# Option 2: Rollback Firebase Hosting
firebase hosting:clone bayfatura-b283c/<previous-version> bayfatura-b283c/live

# Option 3: Disable feature flag (fastest)
# Update Firestore flags config or remote JSON
```

### 7.2 Native Beta Rollback
```bash
# Option 1: Remove tester from Firebase App Distribution
# Option 2: Revert commit and rebuild
# Option 3: Disable the native-specific feature flags
```

## 8. Tagging Convention

```
v<major>.<minor>.<patch>[-<pre-release>]

Examples:
v1.0.0          # First stable release
v1.1.0-beta.1   # Beta pre-release  
v1.1.0          # Second stable release
v1.1.1          # Patch
```

## 9. Commit Message Convention

```
<type>(<scope>): <description>

Types: feat, fix, chore, docs, test, refactor, style, perf
Scopes: ff (feature flags), ci, sentry, mobile, capacitor, web, auth, invoice, etc.

Examples:
feat(ff): add feature flag system with Firebase-backed config
fix(invoice): resolve PDF rendering on Safari mobile
chore(ci): add GitHub Actions workflows
docs: add architecture audit document
test(ff): add unit tests for feature flag evaluation
```

## 10. Current Status

| Item | Status |
|------|--------|
| Branch strategy documented | ✅ Done |
| Release channels defined | ✅ Done |
| Feature flag strategy | Planned (Phase 2) |
| CI/CD workflows | Planned (Phase 4) |
| GitHub branch protection | ⏳ Requires GitHub repo admin |
| Tagging convention | ✅ Defined |
| Rollback procedures | ✅ Defined |
