# Feature Flags for Preview Testing

> All flags default to OFF. Safe fallback if config fails to load. Live users unaffected.

## Safety Guarantees

| Property | Value | Verified In |
|----------|-------|-------------|
| All flags default to OFF | ✅ Yes | `definitions.js` — all `enabled: false` |
| Unknown flag returns false | ✅ Yes | `evaluate.js` line 12 |
| Config load failure returns false | ✅ Yes | `useFeatureFlag.js` catch → `setEnabled(false)` |
| Firebase not configured returns {} | ✅ Yes | `config.js` line 9 |
| No auto-enable for any user | ✅ Yes | No `enabled: true` in any default |
| Kill switch available | ✅ Yes | `beta_invoice_editor` has `killSwitch: true` |

## How to Test a Flag in Preview

### Option A: Using betaTesters targeting (recommended)

1. Deploy the preview via PR (see `preview-deploy.md`)
2. In Firebase Console → Firestore → `app_config/feature_flags`:
   ```json
   {
     "flags": {
       "mobile_card_layout": {
         "enabled": true,
         "betaTesters": ["your@email.com"]
       }
     }
   }
   ```
3. Open the preview URL and log in with `your@email.com`
4. The flag is ON only for that user — all others get the OFF default

### Option B: Using company override

1. Create a Firestore doc at `company_config/{tenantId}`:
   ```json
   {
     "featureOverrides": {
       "mobile_card_layout": true
     }
   }
   ```
2. Only users in that company see the flag enabled

### Option C: Direct Firestore edit (preview only)

1. In Firebase Console → Firestore → `app_config/feature_flags`
2. Set `mobile_card_layout.enabled: true` globally
3. **WARNING**: This affects ALL users including production if done on the production Firestore instance

## Testing Different Flag Configurations

### Test percentage rollout
```json
{
  "mobile_card_layout": {
    "rolloutPercentage": 50
  }
}
```
Refresh the page multiple times or use different accounts.

### Test kill switch
```json
{
  "beta_invoice_editor": {
    "killSwitch": true
  }
}
```
The flag is forced OFF regardless of other settings.

### Test platform targeting
Native flags (`native_camera_receipts`, `native_push_notifications`) only activate when `platform: 'native'`. In preview (web), they always return false.

## Creating a Test Flag for a New Feature

1. Add to `src/lib/featureFlags/definitions.js`:
   ```js
   my_new_feature: {
     enabled: false,
     type: 'beta',
     description: 'Description of the feature',
     killSwitch: false,
     platform: ['web'],
   }
   ```
2. Use in component:
   ```jsx
   const { enabled } = useFeatureFlag('my_new_feature', { user: currentUser });
   ```
3. Add to `config/feature-flags-preview-seed.json`
4. All defaults: OFF. Live users: unaffected.

## Verification Checklist for Flag Safety

- [ ] Flag defaults to `enabled: false`
- [ ] If Firestore is unreachable, flag is OFF
- [ ] If flag name is misspelled, flag is OFF
- [ ] If `killSwitch: true` is set, flag is forced OFF
- [ ] No production code path depends on flag being ON
- [ ] Feature works correctly (existing behavior) when flag is OFF
