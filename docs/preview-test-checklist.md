# Preview Test Checklist — BayFatura

> Use this checklist to manually verify a preview deployment before any production decision.

## How to Get a Preview URL

1. Open a PR against `preview-test-staging`
2. Wait for the "Quality Check + Preview Deploy" workflow to complete (check Actions tab)
3. Find the preview URL in the PR comments
4. Open the URL in your browser

Do not use `main` as the normal preview target until production reconciliation is intentionally completed.

## Critical Path Tests

### 1. Authentication
- [ ] Login page renders correctly
- [ ] Email/password login works
- [ ] Google login popup works in Chrome
- [ ] Google login works or shows a clear Firebase/Auth configuration error in Safari
- [ ] Apple login works or shows a clear provider/capability configuration error
- [ ] Logout works
- [ ] Protected routes redirect to login when not authenticated
- [ ] Public routes (Landing, Terms, Privacy) are accessible without login

### 1.1 Onboarding
- [ ] New user sees the onboarding wizard
- [ ] Company name and language fields work
- [ ] Optional company phone and address fields work when provided
- [ ] Setup completion routes the user to the dashboard
- [ ] Setup completion does not overwrite existing paid/test plan access

### 2. Invoice Creation & PDF
- [ ] Create new invoice page loads
- [ ] All form fields render correctly
- [ ] Customer selection works
- [ ] Product/item selection works
- [ ] Adding multiple line items works
- [ ] Tax/VAT calculation is correct
- [ ] Total calculation is correct
- [ ] Invoice preview is visible
- [ ] Save draft works
- [ ] Create and send works
- [ ] PDF download works in Chrome
- [ ] PDF download works in Safari
- [ ] Public invoice link opens without authentication

### 3. Invoice Listing
- [ ] Invoice list page loads
- [ ] Invoices are displayed correctly
- [ ] Filtering/Search works (if available)
- [ ] Status badges (paid, overdue, draft) are correct
- [ ] Pagination works (if available)

### 4. Customer Management
- [ ] Customer list loads
- [ ] Create new customer works
- [ ] Edit customer works
- [ ] Delete customer shows confirmation
- [ ] Customer search/filter works

### 4.1 Product Management
- [ ] Product list loads
- [ ] Create product works
- [ ] Edit product works
- [ ] Delete product shows confirmation
- [ ] Product can be used in invoice line item

### 5. Team & Email
- [ ] Team page loads for an eligible user
- [ ] Invite form asks for invitee name and email
- [ ] Invite email uses the invitee name in the email body
- [ ] Invite email is delivered when Resend domain/from address is verified
- [ ] Accept invite route opens correctly
- [ ] Existing invitation errors are clear to the user

### 6. Billing & Plans
- [ ] Free plan limitations are visible and enforced
- [ ] Elite Monthly is visible and selectable
- [ ] Elite Yearly is visible and selectable
- [ ] Lifetime plan is not offered as a new purchase
- [ ] Existing lifetime/test entitlements are not broken
- [ ] `omidbayenderi@gmail.com` has expected test/admin access

### 7. AI & Finance
- [ ] Receipt scan opens and handles image upload/camera input
- [ ] Bank matcher accepts a supported file format
- [ ] Forecasting page loads and handles missing data gracefully
- [ ] AI errors return clear user-facing messages

### 8. Feature Flag Fallback
- [ ] All flags default to OFF
- [ ] No console errors related to feature flags
- [ ] App behavior is identical to production when flags are OFF
- [ ] Enabling a flag (via Firestore) changes behavior only for targeted users

### 9. Mobile Responsiveness (Preview only — Browser DevTools)
- [ ] Layout adjusts for mobile viewport (375px width)
- [ ] Mobile bottom navigation is visible and functional
- [ ] Invoice list is scrollable horizontally (desktop) / cards (with flag)
- [ ] Forms are usable on mobile (inputs not zoomed incorrectly)
- [ ] Sidebar collapses correctly on mobile
- [ ] Header/branding shows correctly on mobile

### 10. Error Handling
- [ ] 404 page shows for unknown routes
- [ ] Error boundary catches unexpected errors (test by disabling network)
- [ ] Console has no unhandled errors or warnings

### 11. Performance (Subjective — no tools)
- [ ] Dashboard loads within 3 seconds
- [ ] Invoice list renders without jank
- [ ] Navigation between pages feels responsive

## Native Smoke Matrix

Use this after `npm run build && npx cap sync`.

### Android
- [ ] App opens on real device or emulator
- [ ] Email/password login works
- [ ] Google native login works
- [ ] Camera permission and receipt scan work
- [ ] PDF/download/share flow is usable
- [ ] Push notification permission prompt appears when expected

### iOS
- [ ] App opens on a real iPhone
- [ ] Email/password login works
- [ ] Google native login returns to the app
- [ ] Apple Sign In works after entitlement/provider setup
- [ ] Camera permission and receipt scan work
- [ ] PDF/share flow is usable
- [ ] Push notification permission prompt appears when expected

## Comparing Preview vs Production

| Aspect | How to Compare |
|--------|----------------|
| Visual layout | Open production at bayfatura.com and preview URL side-by-side |
| Feature behavior | Verify the preview is identical when flags are OFF |
| Performance | Use browser Network tab to compare load times |
| Console errors | Open DevTools Console on both — preview should have no new errors |

## Reporting Issues

If you find a bug in preview:
1. Note the PR number and preview URL
2. Capture browser console errors (if any)
3. Describe what you expected vs what happened
4. Note whether the same issue exists in production

## Before Clearing Preview for Merge

- [ ] All critical paths pass
- [ ] No new console errors compared to production
- [ ] Feature flags verified (new features are OFF for production)
- [ ] Mobile responsiveness acceptable
- [ ] No regression in invoice creation flow
