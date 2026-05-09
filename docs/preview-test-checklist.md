# Preview Test Checklist — BayFatura

> Use this checklist to manually verify a preview deployment before any production decision.

## How to Get a Preview URL

1. Open a PR against `develop` or `main`
2. Wait for the "Preview Deploy" workflow to complete (check Actions tab)
3. Find the preview URL in the PR comments
4. Open the URL in your browser

## Critical Path Tests

### 1. Authentication
- [ ] Login page renders correctly
- [ ] Email/password login works
- [ ] Google login popup works (if configured for preview)
- [ ] Apple login popup works (if configured for preview)
- [ ] Logout works
- [ ] Protected routes redirect to login when not authenticated
- [ ] Public routes (Landing, Terms, Privacy) are accessible without login

### 2. Invoice Creation
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

### 5. Feature Flag Fallback
- [ ] All flags default to OFF
- [ ] No console errors related to feature flags
- [ ] App behavior is identical to production when flags are OFF
- [ ] Enabling a flag (via Firestore) changes behavior only for targeted users

### 6. Mobile Responsiveness (Preview only — Browser DevTools)
- [ ] Layout adjusts for mobile viewport (375px width)
- [ ] Mobile bottom navigation is visible and functional
- [ ] Invoice list is scrollable horizontally (desktop) / cards (with flag)
- [ ] Forms are usable on mobile (inputs not zoomed incorrectly)
- [ ] Sidebar collapses correctly on mobile
- [ ] Header/branding shows correctly on mobile

### 7. Error Handling
- [ ] 404 page shows for unknown routes
- [ ] Error boundary catches unexpected errors (test by disabling network)
- [ ] Console has no unhandled errors or warnings

### 8. Performance (Subjective — no tools)
- [ ] Dashboard loads within 3 seconds
- [ ] Invoice list renders without jank
- [ ] Navigation between pages feels responsive

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
