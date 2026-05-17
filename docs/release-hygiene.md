# Release Hygiene — BayFatura

Use this checklist before opening a production PR or running a manual production deploy.

## 1. Start From a Known Branch

```bash
git status --short --branch
```

Confirm the branch is the intended release branch and that every changed file is expected. Do not mix unrelated feature work, generated build artifacts, and production fixes in one release.

## 2. Separate User Work From Release Work

If the working tree already contains unrelated changes:

- Leave unrelated user changes untouched.
- Review only files involved in the release.
- Commit release fixes separately from documentation, generated assets, and experiments.
- Avoid deploying from a branch with ambiguous deleted/renamed files.

## 3. Run the Release Check

```bash
npm run check:release
```

This runs:

```bash
npm run lint
npm test
npm run build
```

The release should not proceed unless all three pass.

## 4. Confirm Firebase Targeting

Before production deploy:

```bash
npx -y firebase-tools@latest use
```

Production deploys should target the production project intentionally. PR previews should use the staging project through `STAGING_VITE_FIREBASE_PROJECT_ID` and `STAGING_FIREBASE_SERVICE_ACCOUNT`.

## 5. Production Deploy Rules

- Production deploy is manual-only through `.github/workflows/deploy-production.yml`.
- Cloud Functions deploy is optional and should be enabled only when function code or runtime config changed.
- Firestore and Storage rules deploy on production workflow runs.
- PR previews must never use production deploy credentials.

## 6. After Deploy

- Open the deployed URL.
- Smoke test login, dashboard, invoice list, invoice PDF, and public invoice link.
- Check Sentry or browser console for new runtime errors.
- Keep the deployed commit hash and workflow run URL with the release notes.
