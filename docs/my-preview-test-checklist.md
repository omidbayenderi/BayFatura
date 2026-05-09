# My Preview Test Checklist — BayFatura

> Compare production vs preview. Test flags only for your account.

## Setup

- [ ] Open production (bayfatura.com) in Tab A
- [ ] Open preview URL in Tab B
- [ ] Login with YOUR account on both tabs
- [ ] Open a third tab (incognito) with preview URL + another account

## 1. Authentication

| Test | Production | Preview (my account) | Preview (other account) |
|------|-----------|---------------------|------------------------|
| Login page renders | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ |
| Email login works | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ |
| Google login works | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ |
| Dashboard loads after login | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ |
| Logout works | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ |

## 2. Dashboard

- [ ] Dashboard renders same as production (when flags are OFF)
- [ ] Revenue/profit charts display correctly
- [ ] Recent invoices list loads
- [ ] Stat cards show correct values
- [ ] Mobile: responsive layout works (resize to 375px)

## 3. Invoice Creation (Critical Path)

- [ ] "New Invoice" button works
- [ ] All form fields render
- [ ] Customer selection dropdown works
- [ ] Product/item selection works
- [ ] Adding multiple line items works
- [ ] Tax/VAT calculation matches production
- [ ] Total calculation matches production
- [ ] Invoice preview matches production
- [ ] Save draft works
- [ ] Download PDF works

## 4. Invoice List

- [ ] Invoice list renders
- [ ] Same invoices visible as production
- [ ] Status badges (paid, overdue, draft) correct
- [ ] Filter/Search works
- [ ] **If `mobile_card_layout` flag is ON:** cards display on mobile, not scrollable table
- [ ] **If `mobile_card_layout` flag is OFF:** scrollable table on mobile (same as production)

## 5. Customer Management

- [ ] Customer list loads
- [ ] Search/filter works
- [ ] Create new customer works
- [ ] Edit customer works
- [ ] Delete customer shows confirmation

## 6. Feature Flag: `mobile_card_layout`

**My account on preview:**
- [ ] With flag ON: table rows display as cards on mobile (<768px)
- [ ] With flag ON: table displays normally on desktop

**Other account on preview (incognito):**
- [ ] Flag is OFF — scrollable table on mobile
- [ ] No card layout visible

**My account on production:**
- [ ] Flag is OFF (Firestore config doesn't exist there, or flag is not deployed)
- [ ] Normal table behavior

## 7. Feature Flag: `optimized_invoice_list`

- [ ] My account on preview: flag ON → behavior differs (document what you expect)
- [ ] Other account on preview: flag OFF → same as production
- [ ] My account on production: same as production (no flags deployed)

## 8. Mobile Responsiveness

| Viewport | Production | Preview (my account) |
|----------|-----------|---------------------|
| Desktop (1440px) | ✅ / ❌ | ✅ / ❌ |
| Tablet (768px) | ✅ / ❌ | ✅ / ❌ |
| Mobile (375px) | ✅ / ❌ | ✅ / ❌ |
| Bottom nav visible on mobile | ✅ / ❌ | ✅ / ❌ |
| Sidebar collapses on mobile | ✅ / ❌ | ✅ / ❌ |

## 9. Console Errors

- [ ] No errors in production console
- [ ] No NEW errors in preview console compared to production
- [ ] Feature flag logging: `[FeatureFlags] Flag "mobile_card_layout" = true` visible in preview console

## 10. Cross-Account Comparison

| Check | My Account (Preview) | My Account (Production) | Other Account (Preview) |
|-------|---------------------|----------------------|------------------------|
| Same layout? | — | Compare | Compare |
| Same features? | — | Should be identical unless flag is ON | Should match production |
| Flag visible? | ✅ (if enabled) | ❌ (no Firestore config) | ❌ (not in allowed list) |

## What to Document If You Find a Bug

```
PR Number: #
Preview URL: https://bayfatura-b283c--pr-<NUMBER>.web.app
Step to reproduce:
Expected behavior:
Actual behavior:
Console errors (paste):
Flag config used:
```
