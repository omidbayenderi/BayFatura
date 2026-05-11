# Feature Flags System — BayFatura

> Phase 2 deliverable. Implemented in `src/lib/featureFlags/`.

## Architecture

```
src/lib/featureFlags/
├── index.js              # Public exports
├── definitions.js         # Flag definitions, defaults, types
├── config.js              # Remote config loader (Firestore-backed)
├── evaluate.js            # Evaluation logic (targeting, rollout, kill switch)
└── useFeatureFlag.js      # React hook for components
```

## Flag Types

| Type | Default State | Purpose |
|------|---------------|---------|
| `beta` | Disabled | New features for beta testing |
| `stable` | Enabled | Features that are fully released but can be killed |
| `native` | Disabled | Capacitor native-only features |
| `internal` | Disabled | Dev tools and internal features |

## Evaluation Order (highest priority first)

1. **Kill switch** — If `killSwitch: true` and the remote override sets `killSwitch: true`, flag is forced OFF
2. **Company override** — If `company_config/{tenantId}/featureOverrides` has a value, that wins
3. **Remote global override** — If `app_config/feature_flags` has an `enabled` value
4. **Percentage rollout** — If `rolloutPercentage` is set, users are hashed and bucketed
5. **Locale/Country targeting** — If the flag targets specific locales or countries
6. **Beta tester list** — If `betaTesters` array includes the user's email
7. **Local default** — Falls back to `FLAG_DEFAULTS`

## Usage in Components

```jsx
import { useFeatureFlag } from '../lib/featureFlags/useFeatureFlag';

function InvoiceList() {
  const { enabled: useCardLayout, loading } = useFeatureFlag('mobile_card_layout', {
    user: currentUser,
    platform: 'web',
    locale: 'de',
  });

  if (loading) return null; // or a placeholder

  return (
    <div className={useCardLayout ? 'card-layout' : 'table-layout'}>
      {/* ... */}
    </div>
  );
}
```

## Remote Configuration (Firestore)

### Global Flags
Document: `app_config/feature_flags`
```json
{
  "flags": {
    "mobile_card_layout": {
      "enabled": true,
      "killSwitch": false,
      "betaTesters": ["tester@bayfatura.com"],
      "rolloutPercentage": 25,
      "locales": ["de", "tr"],
      "countries": ["DE", "TR"]
    }
  }
}
```

### Company-Level Overrides
Document: `company_config/{tenantId}`
```json
{
  "featureOverrides": {
    "mobile_card_layout": true,
    "beta_invoice_editor": true
  }
}
```

## Adding a New Flag

1. Add definition in `src/lib/featureFlags/definitions.js`
2. Add example to `config/feature-flags-seed.json`
3. Use `useFeatureFlag()` in components
4. Document in this file

## Safe Defaults

- If Firestore is unreachable, all flags fall back to `FLAG_DEFAULTS`
- If a flag name is unknown, `evaluate()` returns `false`
- The `useFeatureFlag` hook never throws; errors are caught and logged

## Kill Switch Protocol

For flags with `killSwitch: true`:
1. Set `{ "flagName": { "killSwitch": true } }` in Firestore `app_config/feature_flags`
2. The change takes effect on next flag evaluation (cached up to 5 minutes)
3. For immediate effect, you can also set `clearCache()` is not needed since each eval fetches

## Current Flags

| Flag | Type | Default | Kill Switch | Description |
|------|------|---------|-------------|-------------|
| mobile_card_layout | beta | OFF | No | Card layout for mobile tables |
| optimized_invoice_list | beta | OFF | No | Paginated invoice list |
| virtualized_customer_list | beta | OFF | No | Virtualized customer list |
| new_dashboard_metrics | beta | OFF | No | Enhanced dashboard |
| beta_invoice_editor | beta | OFF | **Yes** | New invoice editor |
| native_camera_receipts | native | OFF | No | Native camera capture |
| native_push_notifications | native | OFF | No | Native push notifications |
