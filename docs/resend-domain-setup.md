# Resend Domain Setup — BayFatura

> Team invitations and invoice emails use Resend through Firebase Cloud Functions.

## Current Status

- Resend API integration is active in Cloud Functions.
- `sendInvoiceEmail` and `sendInvitationEmail` use `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
- Resend test mode can send only to the verified account email.
- Sending invitations to arbitrary team members requires a verified sending domain.

## Required Domain Model

Use a domain-based sender, for example:

```text
BayFatura <noreply@bayfatura.com>
```

Recommended aliases:

| Alias | Purpose |
|-------|---------|
| `noreply@bayfatura.com` | Default product emails |
| `team@bayfatura.com` | Team invitations |
| `billing@bayfatura.com` | Invoice/payment emails |

For the current codebase, one `RESEND_FROM_EMAIL` value is enough. If separate sender identities are needed later, split by function-level config instead of exposing sender logic to the frontend.

## Resend Dashboard Steps

1. Go to Resend → Domains.
2. Add `bayfatura.com` or the chosen sending subdomain.
3. Add the DNS records Resend gives you:
   - SPF/TXT
   - DKIM
   - Return-Path / bounce record if provided
   - DMARC is strongly recommended
4. Wait until Resend marks the domain as verified.
5. Set the sender to a verified address, for example `BayFatura <noreply@bayfatura.com>`.

## GitHub Secrets

Staging:

| Secret | Value |
|--------|-------|
| `STAGING_RESEND_API_KEY` | Resend API key for staging |
| `STAGING_RESEND_FROM_EMAIL` | `BayFatura Staging <noreply@bayfatura.com>` or a verified staging sender |

Production:

| Secret | Value |
|--------|-------|
| `RESEND_API_KEY` | Resend API key for production |
| `RESEND_FROM_EMAIL` | `BayFatura <noreply@bayfatura.com>` |

Legacy/frontend build:

| Secret | Value |
|--------|-------|
| `VITE_FROM_EMAIL` | Display/default sender used by frontend fallbacks |

Do not add `RESEND_API_KEY` to any `VITE_*` variable. API keys must stay server-side.

## Post-Verification Smoke Test

1. Deploy staging functions after updating `STAGING_RESEND_FROM_EMAIL`.
2. Invite `omidbayenderi@gmail.com` and one second test address.
3. Confirm both invitation emails arrive.
4. Send a test invoice email from staging.
5. Check Resend logs for accepted/delivered status.
6. Confirm app UI shows a clear error if Resend rejects an email.

## Expected Failure Before Domain Verification

Resend may return:

```text
You can only send testing emails to your own email address...
```

This is not an app bug. It means the account is still in test mode or the sender domain is not verified.
