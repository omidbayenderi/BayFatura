# Branch Strategy

## Active Branches

`preview-test-staging` is the active application branch while the staging preview pipeline is being stabilized.

`main` is not currently treated as the release source of truth because it does not contain the full active application structure. Do not open feature or preview pull requests against `main` until it has been intentionally reconciled.

## Daily Workflow

1. Create feature and stabilization branches from `preview-test-staging`.
2. Open pull requests back into `preview-test-staging`.
3. Let the preview workflow deploy to the staging Firebase project.
4. Merge only after CI and preview validation pass.

## Production Workflow

Production deploys stay manual-only. Before promoting work toward production, reconcile `main` deliberately and run the release checklist in `docs/release-hygiene.md`.

## Safety Rules

- Never commit Firebase service account JSON files.
- Keep staging secrets under `STAGING_*` GitHub Actions secret names.
- Keep production Firebase credentials out of preview workflows.
- Use small, reviewable pull requests for infrastructure changes.
