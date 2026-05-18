# Testing Strategy — BayFatura

> Phase 6 deliverable. Defines testing approach, coverage goals, and critical paths.

## 1. Testing Pyramid

```
       /\
      /  \         E2E (Cypress/Playwright) — 1-2 critical flows
     /    \
    /      \       Integration — 5-10 key user journeys
   /        \
  /          \     Unit Tests — Utility functions, feature flags, formatters
 /____________\
```

## 2. Current State

| Layer | Count | Status |
|-------|-------|--------|
| Unit tests | 2 → 40+ | ✅ Phase 6 adds feature flag + formatter tests |
| Integration | 2 suites | ✅ Auth and route guard smoke flows |
| E2E | 0 | ❌ Not yet implemented |
| Firestore rules emulator | 1 suite | ✅ Added for tenant isolation and config access |

## 3. Unit Tests

### Coverage Goals
- Feature flag evaluation: 100% of branches
- Formatters (currency, number, date): 100% of functions
- All utility functions in `src/lib/`

### New Unit Tests (Phase 6)
- `src/__tests__/featureFlags.test.js` — 15 test cases
- `src/__tests__/formatters.test.js` — 8 test cases

### Running
```bash
npm test
```

### Firestore Rules Tests

Run the emulator-backed rules suite:

```bash
npm run test:rules
```

This starts the Firestore emulator, loads `firestore.rules`, and verifies:

- users can access their own business documents only
- super admins can read protected business documents
- `app_config` feature flags are readable but writable only by super admins
- `company_config` can be read by owners and joined team members
- `myTeams` is readable by the user but client writes are denied

## 4. Integration Tests

### Target Flows
1. **Login flow**: Auth page integration (mocked Firebase) — ✅ Added
2. **Route guard**: ProtectedRoute redirect/loading/authenticated states — ✅ Added
3. **Invoice creation**: Form submission → Firestore write
4. **Invoice listing**: Data fetch → rendering

### Implementation Notes
- Use `@testing-library/react` for component rendering
- Use `vi.mock('firebase/...')` to mock Firebase SDK
- Keep tests focused on component behavior, not Firebase internals

## 5. E2E Tests

### Target Flows
1. **Login → Create Invoice → View Invoice → Logout**
2. **Register → Setup Company → Create Customer → Create Invoice**

### Tool Recommendation
- **Cypress** or **Playwright** for E2E
- Can be added in a future phase
- Requires a dedicated Firebase test project

## 6. Critical Paths (Minimum Viable Testing)

| Path | Priority | Test Type | Status |
|------|----------|-----------|--------|
| Feature flag evaluation | Critical | Unit | ✅ Added |
| Currency formatting | Critical | Unit | ✅ Added |
| Login (renders) | High | Integration | ❌ Planned |
| Invoice creation (renders) | High | Integration | ❌ Planned |
| Invoice listing (renders) | High | Integration | ❌ Planned |
| Customer selection | High | Integration | ❌ Planned |
| Subscription/Billing UI | Medium | Integration | ❌ Planned |
| PDF generation | Low | Manual | ❌ Not automated |

## 7. Test Conventions

### File Naming
```
src/__tests__/<module>.test.js
src/__tests__/<Component>.test.jsx
```

### Mocking Strategy
- Firebase: `vi.mock('firebase/app')`, `vi.mock('firebase/firestore')`
- Environment: `import.meta.env.VITE_*` via `vi.stubEnv`
- Feature flags: Test with mock overrides (no Firestore needed)

### Assertion Style
- Use `@testing-library/jest-dom` matchers
- Use descriptive test names in Turkish or English (existing pattern: English)

## 8. CI Integration

Tests run automatically in CI:
- On every PR to `develop` or `main`
- On every push to `main` and `develop`
- Blocking for merge (required status check)

## 9. Adding New Tests

```bash
# Create test file
touch src/__tests__/<module>.test.js

# Write test
npm test              # Run once
npm test -- --watch   # Watch mode for development
```

## 10. Future Test Improvements

- [ ] Add Firebase mocked integration tests for AuthContext
- [ ] Add component rendering tests for critical pages
- [ ] Add accessibility tests with `@testing-library/jest-dom` (toHaveAttribute checks)
- [ ] Add E2E suite with Playwright
- [ ] Add visual regression tests for invoice PDF
