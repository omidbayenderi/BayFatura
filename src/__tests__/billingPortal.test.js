import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('Stripe customer portal guardrails', () => {
  test('creates portal sessions from the authenticated user profile', () => {
    const functionsSource = read('functions/index.js');

    expect(functionsSource).toContain('export const createBillingPortalSession');
    expect(functionsSource).toContain("if (!context.auth) throw new https.HttpsError('unauthenticated'");
    expect(functionsSource).toContain("db.collection('users').doc(userId).get()");
    expect(functionsSource).toContain('customer: userData.stripeCustomerId');
    expect(functionsSource).not.toContain('customer: _data');
  });

  test('does not offer recurring-subscription management to lifetime plans', () => {
    const functionsSource = read('functions/index.js');
    const billingSource = read('src/pages/finance/Billing.jsx');

    expect(functionsSource).toContain("userData.subscriptionType === 'lifetime'");
    expect(billingSource).toContain("currentUser?.subscriptionType !== 'lifetime'");
  });

  test('returns users to the application billing page', () => {
    const functionsSource = read('functions/index.js');

    expect(functionsSource).toContain("new URL('/billing', appUrl).toString()");
    expect(functionsSource).toContain('return_url: returnUrl');
  });
});
