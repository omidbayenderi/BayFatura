# Functions Dependency Hardening — BayFatura

> Last checked: 25 May 2026 with `npm audit --prefix functions --json`.

## Current Audit Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 7 |
| Moderate | 17 |
| Total | 24 |

## Interpretation

The current report is not a launch blocker by itself because:

- There are no critical advisories.
- Most findings are transitive dependencies under Genkit, Firebase Admin, Google Cloud, OpenTelemetry, and `uuid`.
- `npm audit` suggests a major downgrade for `firebase-functions` in one path, which is not acceptable for the current Node.js 22 / Functions v2 architecture.
- Several findings report `fixAvailable: false`, meaning they must be resolved upstream or by coordinated package upgrades.

Do not run `npm audit fix --force` blindly.

## Main Risk Clusters

### 1. Genkit / OpenTelemetry

Affected chain:

- `genkit`
- `@genkit-ai/*`
- `@opentelemetry/sdk-node`
- `@opentelemetry/auto-instrumentations-node`

Notable advisory:

- Prometheus exporter process crash via malformed HTTP request
- `GHSA-q7rr-3cgh-j5r3`

Current mitigation:

- BayFatura functions do not intentionally expose a Prometheus exporter endpoint.
- Keep Genkit packages pinned together and upgrade as a group only after build and AI function smoke tests pass.

### 2. Firebase Admin / Google Cloud SDKs

Affected chain:

- `firebase-admin`
- `@google-cloud/firestore`
- `@google-cloud/storage`
- `google-gax`
- `retry-request`
- `teeny-request`

Current mitigation:

- These packages are upstream-managed Firebase/Google Cloud dependencies.
- Avoid forced downgrades because they can break Cloud Functions runtime compatibility.

### 3. `uuid` Transitive Findings

Affected through multiple Google/Genkit packages.

Current mitigation:

- No direct BayFatura code path passes attacker-controlled buffers to `uuid`.
- Resolution depends mostly on upstream package releases.

## Safe Hardening Plan

1. Keep current deploy gate:
   - `npm ci`
   - `npm run lint`
   - `npm test`
   - `npm run build`
   - `npm ci --prefix functions`
   - `node --check functions/index.js`

2. Add periodic audit review:
   - Run `npm audit --prefix functions --json` before production release candidates.
   - Record summary in this document if severity changes.

3. Upgrade strategy:
   - Upgrade `genkit` and `@genkit-ai/google-genai` together.
   - Upgrade `firebase-admin` and `firebase-functions` only after checking Firebase Functions Node.js 22 compatibility.
   - Run emulator/syntax checks after every dependency change.

4. Smoke test after dependency upgrades:
   - `sendInvitationEmail`
   - `sendInvoiceEmail`
   - `scanReceipt`
   - `analyzeFinancials`
   - `analyzeBankStatement`
   - `syncUserPlan`

5. Production rule:
   - No dependency hardening change should ship directly to production.
   - Always validate on staging first.

## Commands

```bash
npm audit --prefix functions --json
npm outdated --prefix functions
npm ci --prefix functions
node --check functions/index.js
```

## Open Items

- [ ] Re-run audit after the next Genkit release.
- [ ] Re-run audit after the next Firebase Admin / Functions minor release.
- [ ] Add function-level smoke tests or emulator callable checks for email and AI flows.
- [ ] Decide whether Cloud Logging alerts are enough or Sentry server-side function reporting is needed.
