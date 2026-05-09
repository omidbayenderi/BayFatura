# Web Improvements — BayFatura

> Phase 5 deliverable. Non-breaking improvements behind feature flags.

## 1. Mobile Card Layout

**Flag:** `mobile_card_layout`

### What
Converts table rows to card-style layout on mobile screens (< 768px). Each row becomes a stacked card with label-value pairs.

### How to enable
1. Set `mobile_card_layout: true` in Firestore `app_config/feature_flags`
2. Or set `featureOverrides.mobile_card_layout: true` in `company_config/{tenantId}`

### Usage
```jsx
import { useFeatureFlag } from '../lib/featureFlags/useFeatureFlag';

function InvoiceList({ currentUser }) {
  const { enabled: useCardLayout } = useFeatureFlag('mobile_card_layout', {
    user: currentUser,
    platform: 'web',
  });

  return (
    <div className={useCardLayout ? 'mobile-card-layout' : ''}>
      <table className="modern-table">
        {/* ... */}
      </table>
    </div>
  );
}
```

### Implementation
- CSS class `.mobile-card-layout` added to `index.css`
- Hides table header, displays rows as cards with `data-label` attributes
- All existing table behavior preserved when flag is off

## 2. Touch Optimization

### What
Eliminates 300ms tap delay on mobile browsers by setting `touch-action: manipulation` on `body`.

### Implementation
- Added `touch-action: manipulation` to `body` in `index.css`
- No flag needed — safe for all users, zero risk

### Additional touch targets (future)
For interactive elements, ensure minimum 48x48px tap targets as recommended by WCAG.

## 3. Reusable Formatters

**File:** `src/lib/formatters.js`

### What
Centralizes `Intl.NumberFormat` and `Intl.DateTimeFormat` usage, reducing 17 duplicate instances across the codebase.

### Usage
```js
import { formatCurrency, formatNumber, formatDate } from '../lib/formatters';

// Before (17 places):
new Intl.NumberFormat(appLanguage === 'tr' ? 'tr-TR' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(val)

// After:
formatCurrency(val, appLanguage, 'EUR')
```

### Benefits
- Single locale resolution logic (`tr→tr-TR`, `de→de-DE`, `en→en-US`, etc.)
- Formatter caching for performance
- Easier to polyfill for React Native (swap `Intl` in one place)
- Consistent formatting across the app

### Migration
Formatters are available now but existing `Intl.NumberFormat` calls have NOT been replaced yet. Migration can be done incrementally.

## 4. Virtualization Readiness

**Flag:** `virtualized_customer_list` / `optimized_invoice_list`

### Current State
Large lists (customers, invoices, products) render all items at once. For users with 1000+ items, this causes performance issues.

### Approach
- A virtualized list component can be added behind a flag
- Currently, no virtualization library is installed
- Recommended: `react-window` for simple virtualization

### When to implement
When a user reports performance issues with large lists.
