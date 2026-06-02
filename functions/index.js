/**
 * BayFatura — Firebase Cloud Functions
 * Stripe Webhook, Genkit AI, Email Automation & Notifications
 */

import { https, region } from 'firebase-functions/v1';
import admin from 'firebase-admin';
import Stripe from 'stripe';
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { Resend } from 'resend';

admin.initializeApp();
const db = admin.firestore();
const FUNCTION_REGION = 'europe-west3';
const euFunctions = region(FUNCTION_REGION);
const euCallable = () => euFunctions.runWith({ enforceAppCheck: true }).https;

// --- Services Initialization ---
const getStripeSecret = () => process.env.STRIPE_SECRET_KEY || '';
const getStripeWebhookSecret = () => process.env.STRIPE_WEBHOOK_SECRET || '';
const getResendKey = () => process.env.RESEND_API_KEY || '';
const getResendFromEmail = () => process.env.RESEND_FROM_EMAIL || 'BayFatura <onboarding@resend.dev>';
const getStripe = () => new Stripe(getStripeSecret());
const getResend = () => new Resend(getResendKey());
const redactEmail = (email = '') => {
    const value = String(email);
    const [name, domain] = value.split('@');
    if (!domain) return value ? '[redacted]' : '';
    return `${name.slice(0, 2)}***@${domain}`;
};
const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();
const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

const logFunctionError = (scope, error, meta = {}) => {
    console.error(`[${scope}]`, {
        message: error?.message || String(error),
        code: error?.code,
        name: error?.name,
        ...meta,
    });
};
const classifyResendError = (error) => {
    const message = error?.message || 'Email provider rejected the request.';
    const lower = message.toLowerCase();

    if (lower.includes('verify a domain') || lower.includes('testing emails')) {
        return new https.HttpsError(
            'failed-precondition',
            'Email sending is still in test mode. Please verify a Resend domain and use a sender address from that domain.',
            { provider: 'resend', reason: 'domain_not_verified' },
        );
    }

    if (lower.includes('api key') || lower.includes('unauthorized') || lower.includes('forbidden')) {
        return new https.HttpsError(
            'failed-precondition',
            'Email provider credentials are not configured correctly.',
            { provider: 'resend', reason: 'credentials' },
        );
    }

    return new https.HttpsError(
        'internal',
        'Email could not be sent right now. Please try again later.',
        { provider: 'resend', reason: 'provider_error' },
    );
};
const toCallableError = (scope, error, fallbackMessage = 'The operation could not be completed. Please try again later.', meta = {}) => {
    if (error instanceof https.HttpsError) return error;
    logFunctionError(scope, error, meta);
    return new https.HttpsError('internal', fallbackMessage);
};

// ─── Plan Definitions ─────────────────────────────────────────────────────────
const PLANS = {
    standard: {
        invoicesPerMonth: 5,
        aiCallsPerDay: 0,
    },
    elite: {
        invoicesPerMonth: Infinity,
        aiCallsPerDay: 50,
    },
    premium: {
        invoicesPerMonth: Infinity,
        aiCallsPerDay: 50,
    },
};

const isElitePlan = (plan) => ['elite', 'premium'].includes(plan);

// ─── Rate Limiter (Firestore-backed) ──────────────────────────────────────────
const checkRateLimit = async (uid, scope, maxCalls, windowMs) => {
    const key = `rate_limits/${uid}_${scope}`;
    const ref = db.doc(key);
    const snap = await ref.get();
    const now = Date.now();

    if (snap.exists) {
        const data = snap.data();
        const windowStart = data.windowStart || 0;
        const count = data.count || 0;

        if (now - windowStart < windowMs) {
            if (count >= maxCalls) {
                throw new https.HttpsError(
                    'resource-exhausted',
                    'Too many requests. Please wait a moment and try again.',
                );
            }
            await ref.update({ count: admin.firestore.FieldValue.increment(1) });
        } else {
            await ref.set({ windowStart: now, count: 1 });
        }
    } else {
        await ref.set({ windowStart: now, count: 1 });
    }
};

const requireElitePlan = async (uid) => {
    const userDoc = await db.collection('users').doc(uid).get();
    const plan = userDoc.exists ? userDoc.data()?.plan : 'standard';
    if (!isElitePlan(plan)) {
        throw new https.HttpsError(
            'permission-denied',
            'This feature requires an Elite plan. Please upgrade to access AI tools.',
        );
    }
    // Elite AI daily limit: 50 calls/day to protect against abuse
    await checkRateLimit(uid, 'ai_daily', PLANS.elite.aiCallsPerDay, 24 * 60 * 60_000);
};

// ─── Free Plan Invoice Limit ───────────────────────────────────────────────────
const checkFreeInvoiceLimit = async (uid) => {
    const userDoc = await db.collection('users').doc(uid).get();
    const plan = userDoc.exists ? userDoc.data()?.plan : 'standard';
    if (isElitePlan(plan)) return;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const [invoicesSnap, quotesSnap] = await Promise.all([
        db.collection('invoices')
            .where('userId', '==', uid)
            .where('isDeleted', '!=', true)
            .where('createdAt', '>=', monthStart)
            .where('createdAt', '<', monthEnd)
            .get(),
        db.collection('quotes')
            .where('userId', '==', uid)
            .where('isDeleted', '!=', true)
            .where('createdAt', '>=', monthStart)
            .where('createdAt', '<', monthEnd)
            .get(),
    ]);

    const totalThisMonth = invoicesSnap.size + quotesSnap.size;
    if (totalThisMonth >= PLANS.standard.invoicesPerMonth) {
        throw new https.HttpsError(
            'resource-exhausted',
            `Free plan limit reached: ${PLANS.standard.invoicesPerMonth} invoices/quotes per month. Please upgrade to Elite.`,
        );
    }
};
const MAX_PROXY_IMAGE_BYTES = 5 * 1024 * 1024;
const DEFAULT_PROXY_IMAGE_ALLOWED_HOSTS = new Set([
    'firebasestorage.googleapis.com',
    'storage.googleapis.com',
    'lh3.googleusercontent.com',
    'www.paypalobjects.com',
    'paypalobjects.com',
    'quickchart.io',
    'api.qrserver.com',
]);

const getProxyImageAllowedHosts = () => {
    const configuredHostList = process.env.PROXY_IMAGE_ALLOWED_HOSTS || '';
    const configuredHosts = configuredHostList
        .split(',')
        .map(host => host.trim().toLowerCase())
        .filter(Boolean);

    return new Set([...DEFAULT_PROXY_IMAGE_ALLOWED_HOSTS, ...configuredHosts]);
};

const isBlockedProxyHost = (hostname) => {
    const host = hostname.toLowerCase();
    return host === 'localhost' ||
        host === '0.0.0.0' ||
        host === '127.0.0.1' ||
        host === '::1' ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
};

const ai = genkit({
    plugins: [googleAI()],
});

// ─── 1. Stripe Webhook Handler ────────────────────────────────────────────────────
export const stripeWebhook = euFunctions.https.onRequest(async (req, res) => {
    if (!getStripeSecret()) {
        console.error('Stripe secret key is missing from environment');
        return res.status(500).send('Stripe secret key not configured');
    }

    const stripeInstance = getStripe();
    const webhookSecret = getStripeWebhookSecret();
    if (!webhookSecret) {
        console.error('Stripe webhook secret is missing from environment');
        return res.status(500).send('Stripe webhook secret not configured');
    }

    let event;
    try {
        const sig = req.headers['stripe-signature'];
        event = stripeInstance.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const getPlanFromSession = () => {
        return { plan: 'elite', subscriptionType: 'subscription' };
    };

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId || session.client_reference_id;

                if (!userId) {
                    console.warn('No userId in session metadata');
                    break;
                }

                const planData = getPlanFromSession();
                await db.collection('users').doc(userId).update({
                    ...planData,
                    stripeCustomerId: session.customer,
                    subscriptionId: session.subscription || null,
                    planActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    planExpiresAt: null,
                });
                console.log(`✅ Plan upgraded to ${planData.plan} for user ${userId}`);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                const customerId = invoice.customer;

                if (invoice.billing_reason === 'subscription_create') break;

                const usersSnap = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
                if (!usersSnap.empty) {
                    await usersSnap.docs[0].ref.update({
                        plan: 'elite',
                        lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    console.log(`🔄 Subscription renewed for customer ${customerId}`);
                }
                break;
            }

            case 'customer.subscription.deleted':
            case 'invoice.payment_failed': {
                const obj = event.data.object;
                const customerId = obj.customer;

                const usersSnap = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
                if (!usersSnap.empty) {
                    await usersSnap.docs[0].ref.update({
                        plan: 'standard',
                        subscriptionType: null,
                        planDowngradedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    console.log(`⬇️ Plan downgraded for customer ${customerId}`);
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook handler error:', err);
        res.status(500).send('Internal error');
    }
});

export const syncUserPlan = euCallable().onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    if (!getStripeSecret()) throw new https.HttpsError('failed-precondition', 'Stripe secret key not configured');
    
    const { sessionId } = data;
    if (!sessionId) throw new https.HttpsError('invalid-argument', 'sessionId required');

    const stripeInstance = getStripe();

    try {
        const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid') {
            const userId = context.auth.uid;
            const planData = { plan: 'elite', subscriptionType: 'subscription' };

            await db.collection('users').doc(userId).update({
                ...planData,
                stripeCustomerId: session.customer,
                planActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return { success: true, plan: planData.plan };
        }
        return { success: false, reason: 'payment_not_completed' };
    } catch (err) {
        throw toCallableError('syncUserPlan', err, 'Subscription status could not be synced. Please try again later.', {
            userId: context.auth.uid,
            sessionId,
        });
    }
});

export const checkInvoiceLimit = euCallable().onCall(async (_data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    await checkFreeInvoiceLimit(context.auth.uid);
    return { allowed: true };
});

export const syncAllAuthUsers = euCallable().onCall(async (_data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    const adminEmail = context.auth.token.email;
    if (!['support@bayfatura.com', 'omidbayenderi@gmail.com'].includes(adminEmail)) {
        throw new https.HttpsError('permission-denied', 'Only Super Admins can invoke this function');
    }

    try {
        let count = 0;
        let created = 0;
        
        const listUsersResult = await admin.auth().listUsers(1000);
        const batch = db.batch();
        
        for (const userRecord of listUsersResult.users) {
            count++;
            const userRef = db.collection('users').doc(userRecord.uid);
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) {
                batch.set(userRef, {
                    name: userRecord.displayName || userRecord.email?.split('@')[0] || 'User',
                    email: userRecord.email || 'guest@bayfatura.com',
                    plan: 'standard',
                    role: 'admin',
                    tenantId: userRecord.uid,
                    createdAt: new Date(userRecord.metadata.creationTime).toISOString()
                });
                created++;
            }
        }
        
        if (created > 0) {
            await batch.commit();
        }
        
        return { success: true, totalAuthUsers: count, createdMissingProfiles: created };
    } catch (error) {
        console.error('Error syncing auth users:', error);
        throw new https.HttpsError('internal', error.message);
    }
});

// ─── 2. AI: Bank Statement Matcher (Genkit) ───────────────────────────────────────
export const analyzeBankStatement = euCallable().onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    await requireElitePlan(context.auth.uid);
    const { csvData, existingInvoices } = data;

    if (!csvData) throw new https.HttpsError('invalid-argument', 'Missing csvData');

    try {
        const prompt = `
            Aşağıda bir banka dökümü (CSV) ve mevcut faturaların listesi (JSON) bulunmaktadır.
            Görevin, banka dökümündeki her bir işlem (satır) için, faturalar listesinden eşleşen bir fatura bulmaktır.
            Eşleşmeleri belirlerken tutar (amount) ve müşteri adı/açıklama (description) gibi benzerlikleri dikkate al.

            Banka Dökümü (CSV):
            ${csvData}

            Mevcut Faturalar (JSON):
            ${JSON.stringify(existingInvoices)}
        `;

        const response = await ai.generate({
            model: googleAI.model('gemini-1.5-flash'),
            prompt: prompt,
            output: {
                format: 'json',
                schema: z.array(z.object({
                    transactionDate: z.string(),
                    transactionAmount: z.number(),
                    transactionDescription: z.string(),
                    matchedInvoiceId: z.string().nullable(),
                    confidenceScore: z.number().describe('0 to 100'),
                    reason: z.string()
                }))
            }
        });

        return { matches: response.output };
    } catch (error) {
        throw toCallableError('analyzeBankStatement', error, 'Bank statement analysis failed. Please try again with a smaller or cleaner file.', {
            userId: context.auth.uid,
            csvLength: String(csvData || '').length,
            invoiceCount: Array.isArray(existingInvoices) ? existingInvoices.length : 0,
        });
    }
});

// ─── 3. AI: Receipt Scanner (Genkit Vision) ───────────────────────────────────────
export const scanReceipt = euCallable().onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    await requireElitePlan(context.auth.uid);
    const { base64Image, mimeType } = data;

    if (!base64Image) throw new https.HttpsError('invalid-argument', 'Missing base64Image');

    try {
        const response = await ai.generate({
            model: googleAI.model('gemini-1.5-flash'),
            messages: [
                {
                    role: 'user',
                    content: [
                        { text: 'Analyze this receipt and extract the requested fields.' },
                        { media: { url: `data:${mimeType};base64,${base64Image}` } }
                    ]
                }
            ],
            output: {
                format: 'json',
                schema: z.object({
                    merchantName: z.string().nullable(),
                    date: z.string().nullable(),
                    totalAmount: z.number().nullable(),
                    taxAmount: z.number().nullable(),
                    taxRate: z.number().nullable(),
                    category: z.string().nullable()
                })
            }
        });

        return { receiptData: response.output };
    } catch (error) {
        throw toCallableError('scanReceipt', error, 'Receipt scan failed. Please try another image or enter the expense manually.', {
            userId: context.auth.uid,
            mimeType,
            imageBytesApprox: Math.round(String(base64Image || '').length * 0.75),
        });
    }
});

// ─── 4. AI: Financial Forecasting (Genkit) ──────────────────────────────────────
export const analyzeFinancials = euCallable().onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    await requireElitePlan(context.auth.uid);
    const { historyData } = data;

    if (!historyData) throw new https.HttpsError('invalid-argument', 'Missing historyData');

    try {
        const prompt = `
            As a financial analyst for a SaaS business, analyze the following financial history (invoices and expenses) and provide a 3-month forecast.
            
            DATA:
            ${JSON.stringify(historyData)}

            Return ONLY a JSON object with this exact structure:
            {
                "summary": "Short 2-sentence summary of current health",
                "forecast": [
                    {"month": "Next Month", "predictedIncome": 1200, "predictedExpense": 800},
                    {"month": "Month 2", "predictedIncome": 1300, "predictedExpense": 850},
                    {"month": "Month 3", "predictedIncome": 1500, "predictedExpense": 900}
                ],
                "insights": [
                    {"type": "info", "text": "Insight 1"},
                    {"type": "warning", "text": "Insight 2"}
                ],
                "taxEstimate": {
                    "amount": 500,
                    "note": "Estimated VAT/Tax based on trends"
                }
            }
        `;

        const response = await ai.generate({
            model: googleAI.model('gemini-1.5-flash'),
            prompt: prompt,
            output: {
                format: 'json',
                schema: z.object({
                    summary: z.string(),
                    forecast: z.array(z.object({
                        month: z.string(),
                        predictedIncome: z.number(),
                        predictedExpense: z.number()
                    })),
                    insights: z.array(z.object({
                        type: z.enum(['info', 'warning', 'success', 'error']),
                        text: z.string()
                    })),
                    taxEstimate: z.object({
                        amount: z.number(),
                        note: z.string()
                    })
                })
            }
        });

        return { analysis: response.output };
    } catch (error) {
        throw toCallableError('analyzeFinancials', error, 'Financial analysis failed. Please try again later.', {
            userId: context.auth.uid,
            historyItems: Array.isArray(historyData) ? historyData.length : undefined,
        });
    }
});

// ─── 5. Cloud Operations: Email Automation (Resend) ───────────────────────────────
const moneySymbol = (currency) => {
    if (currency === 'TRY') return '₺';
    if (currency === 'USD') return '$';
    if (currency === 'GBP') return '£';
    return '€';
};

const formatMoney = (value, currency) => {
    const amount = Number.parseFloat(value || 0);
    return `${moneySymbol(currency)}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

const getEmailLabels = (language = 'de', isQuote = false) => {
    const labels = {
        de: {
            greeting: 'Sehr geehrte/r',
            body: isQuote
                ? 'vielen Dank für Ihre Anfrage. Anbei finden Sie unser Angebot.'
                : 'bitte begleichen Sie die folgende Rechnung bis zum angegebenen Fälligkeitsdatum.',
            viewBtn: isQuote ? 'Angebot online ansehen' : 'Rechnung online ansehen',
            docLabel: isQuote ? 'Angebotsnummer' : 'Rechnungsnummer',
            date: 'Datum',
            total: 'Gesamtbetrag',
            items: 'Positionen',
            quantity: 'Menge',
            price: 'Preis',
            subtotal: 'Zwischensumme',
            tax: 'MwSt.',
        },
        tr: {
            greeting: 'Sayın',
            body: isQuote
                ? 'Talebiniz için teşekkür ederiz. Teklifimizi ekte bulabilirsiniz.'
                : 'Lütfen aşağıdaki faturayı belirtilen son ödeme tarihine kadar ödeyiniz.',
            viewBtn: isQuote ? 'Teklifi Online Gör' : 'Faturayı Online Gör',
            docLabel: isQuote ? 'Teklif No' : 'Fatura No',
            date: 'Tarih',
            total: 'Toplam Tutar',
            items: 'Kalemler',
            quantity: 'Miktar',
            price: 'Birim Fiyat',
            subtotal: 'Ara Toplam',
            tax: 'KDV',
        },
        en: {
            greeting: 'Dear',
            body: isQuote
                ? 'Thank you for your inquiry. Please find our quote attached.'
                : 'Please settle the following invoice by the due date.',
            viewBtn: isQuote ? 'View Quote Online' : 'View Invoice Online',
            docLabel: isQuote ? 'Quote Number' : 'Invoice Number',
            date: 'Date',
            total: 'Total Amount',
            items: 'Line Items',
            quantity: 'Qty',
            price: 'Price',
            subtotal: 'Subtotal',
            tax: 'Tax',
        },
    };

    return labels[language] || labels.de;
};

const buildInvoiceEmailHtml = ({ invoice, senderName, senderEmail, type, language, publicUrl }) => {
    const isQuote = type === 'quote';
    const labels = getEmailLabels(language, isQuote);
    const currency = invoice.currency || 'EUR';
    const itemRows = (Array.isArray(invoice.items) ? invoice.items : []).map(item => {
        const quantity = Number.parseFloat(item.quantity || 1);
        const price = Number.parseFloat(item.price || item.unitPrice || 0);
        return `
        <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155">${escapeHtml(item.description || '')}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;text-align:center">${escapeHtml(quantity)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;text-align:right">${escapeHtml(formatMoney(price * quantity, currency))}</td>
        </tr>`;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="${escapeHtml(language || 'de')}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(labels.docLabel)}: ${escapeHtml(invoice.invoiceNumber || '')}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
      <tr><td style="background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:20px 20px 0 0;padding:36px 40px;text-align:center">
        <h1 style="margin:0;color:white;font-size:26px;font-weight:800;letter-spacing:-0.5px">BayFatura</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">${escapeHtml(senderName)}</p>
      </td></tr>
      <tr><td style="background:white;padding:36px 40px">
        <p style="margin:0 0 20px;font-size:16px;color:#334155;line-height:1.7">${escapeHtml(labels.greeting)} ${escapeHtml(invoice.recipientName || '')},</p>
        <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.7">${escapeHtml(labels.body)}</p>
        <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:28px">
          <p style="margin:0 0 8px;font-size:13px;color:#64748b">${escapeHtml(labels.docLabel)}: <strong style="color:#1e293b">${escapeHtml(invoice.invoiceNumber || '')}</strong></p>
          <p style="margin:0 0 8px;font-size:13px;color:#64748b">${escapeHtml(labels.date)}: <strong style="color:#1e293b">${escapeHtml(invoice.date || '')}</strong></p>
          <p style="margin:0;font-size:16px;color:#3b82f6;font-weight:900">${escapeHtml(labels.total)}: ${escapeHtml(formatMoney(invoice.total, currency))}</p>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">${escapeHtml(labels.items)}</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">${escapeHtml(labels.quantity)}</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">${escapeHtml(labels.price)}</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr style="background:#f8fafc">
              <td colspan="2" style="padding:10px 12px;font-size:13px;color:#64748b;text-align:right">${escapeHtml(labels.subtotal)}:</td>
              <td style="padding:10px 12px;font-size:13px;color:#334155;text-align:right;font-weight:600">${escapeHtml(formatMoney(invoice.subtotal, currency))}</td>
            </tr>
            <tr style="background:#f8fafc">
              <td colspan="2" style="padding:8px 12px;font-size:13px;color:#64748b;text-align:right">${escapeHtml(labels.tax)} (${escapeHtml(invoice.taxRate || 19)}%):</td>
              <td style="padding:8px 12px;font-size:13px;color:#334155;text-align:right;font-weight:600">${escapeHtml(formatMoney(invoice.tax || invoice.taxAmount, currency))}</td>
            </tr>
            <tr style="background:linear-gradient(135deg,#eff6ff,#eef2ff)">
              <td colspan="2" style="padding:14px 12px;font-size:15px;color:#1e293b;text-align:right;font-weight:800">${escapeHtml(labels.total)}:</td>
              <td style="padding:14px 12px;font-size:18px;color:#3b82f6;text-align:right;font-weight:900">${escapeHtml(formatMoney(invoice.total, currency))}</td>
            </tr>
          </tfoot>
        </table>
        <div style="text-align:center;margin:32px 0">
          <a href="${escapeHtml(publicUrl)}" target="_blank" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;text-decoration:none;border-radius:100px;font-size:15px;font-weight:700;letter-spacing:.3px">
            ${escapeHtml(labels.viewBtn)}
          </a>
        </div>
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7">This email was sent via BayFatura. Contact: ${escapeHtml(senderEmail || '')}</p>
      </td></tr>
      <tr><td style="background:#f1f5f9;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center">
        <p style="margin:0;font-size:12px;color:#94a3b8">Powered by <strong>BayFatura</strong> · bayfatura.com</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`.trim();
};

export const sendInvoiceEmail = euCallable().onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    const { toEmail, toName, invoiceId, type = 'invoice', language = 'de' } = data;

    if (!invoiceId || !['invoice', 'quote'].includes(type)) {
        throw new https.HttpsError('invalid-argument', 'Missing or invalid invoiceId/type');
    }

    if (!isValidEmail(toEmail)) {
        throw new https.HttpsError('invalid-argument', 'A valid recipient email is required');
    }

    if (!getResendKey()) {
        console.error('❌ Resend API Key is missing from environment');
        throw new https.HttpsError('failed-precondition', 'Resend API key not configured');
    }

    const resend = getResend();
    const collectionName = type === 'quote' ? 'quotes' : 'invoices';

    try {
        await checkRateLimit(context.auth.uid, 'email_invoice', 20, 60 * 60_000);

        const invoiceRef = db.collection(collectionName).doc(invoiceId);
        const invoiceSnap = await invoiceRef.get();
        if (!invoiceSnap.exists) {
            throw new https.HttpsError('not-found', 'Document not found');
        }

        const invoice = { id: invoiceSnap.id, ...invoiceSnap.data() };
        if (invoice.userId !== context.auth.uid) {
            throw new https.HttpsError('permission-denied', 'You can only send your own documents');
        }

        const userSnap = await db.collection('users').doc(context.auth.uid).get();
        const userData = userSnap.exists ? userSnap.data() : {};
        const senderName = userData.companyName || userData.name || context.auth.token.email || 'BayFatura';
        const senderEmail = userData.email || context.auth.token.email || '';
        const publicBaseUrl = normalizeAppUrl(process.env.APP_URL) || 'https://bayfatura.com';
        const publicUrl = `${publicBaseUrl}/p/${type}/${invoice.id}`;
        const isQuote = type === 'quote';
        const subjectLabels = {
            de: isQuote ? `Angebot ${invoice.invoiceNumber || invoice.id} von ${senderName}` : `Rechnung ${invoice.invoiceNumber || invoice.id} von ${senderName}`,
            tr: isQuote ? `${senderName} - Teklif ${invoice.invoiceNumber || invoice.id}` : `${senderName} - Fatura ${invoice.invoiceNumber || invoice.id}`,
            en: isQuote ? `Quote ${invoice.invoiceNumber || invoice.id} from ${senderName}` : `Invoice ${invoice.invoiceNumber || invoice.id} from ${senderName}`,
        };
        const subject = subjectLabels[language] || subjectLabels.de;
        const html = buildInvoiceEmailHtml({
            invoice: {
                ...invoice,
                recipientEmail: normalizeEmail(toEmail),
                recipientName: toName || invoice.recipientName || '',
            },
            senderName,
            senderEmail,
            type,
            language,
            publicUrl,
        });

        console.log('[sendInvoiceEmail] Sending invoice email', {
            userId: context.auth.uid,
            invoiceId,
            to: redactEmail(toEmail),
        });
        
        const { data: resData, error } = await resend.emails.send({
            from: getResendFromEmail(),
            to: [`${toName || invoice.recipientName || 'Customer'} <${normalizeEmail(toEmail)}>`],
            subject,
            html,
        });

        if (error) {
            logFunctionError('sendInvoiceEmail.resend', error, {
                userId: context.auth.uid,
                invoiceId,
                to: redactEmail(toEmail),
            });
            throw classifyResendError(error);
        }
        
        console.log('[sendInvoiceEmail] Email sent successfully', { messageId: resData.id, invoiceId });

        await db.collection('email_logs').add({
            type,
            invoiceId,
            to: normalizeEmail(toEmail),
            subject,
            userId: context.auth.uid,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            resendId: resData.id
        });

        return { success: true, messageId: resData.id };
    } catch (error) {
        if (error instanceof https.HttpsError) throw error;
        throw toCallableError('sendInvoiceEmail', error, 'Invoice email could not be sent right now. Please try again later.', {
            userId: context.auth.uid,
            invoiceId,
            to: redactEmail(toEmail),
        });
    }
});

// ─── 5b. Team Invitation Email ───────────────────────────────────────────────
const buildInvitationHtml = ({ inviteeName, companyName, senderName, role, acceptLink }) => {
    const roleLabels = {
        admin: 'Admin',
        accountant: 'Accountant',
        member: 'Member',
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>You're invited to ${escapeHtml(companyName)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
      <tr><td style="background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:20px 20px 0 0;padding:36px 40px;text-align:center">
        <h1 style="margin:0;color:white;font-size:26px;font-weight:800;letter-spacing:-0.5px">BayFatura</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">Team Invitation</p>
      </td></tr>
      <tr><td style="background:white;padding:36px 40px">
        <p style="margin:0 0 8px;font-size:16px;color:#334155;line-height:1.7">Hello${inviteeName ? ' ' + escapeHtml(inviteeName) : ''},</p>
        <p style="margin:0 0 20px;font-size:15px;color:#64748b;line-height:1.7">
          <strong>${escapeHtml(senderName)}</strong> has invited you to join the team at <strong>${escapeHtml(companyName)}</strong> as a <strong>${escapeHtml(roleLabels[role] || role)}</strong>.
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="${escapeHtml(acceptLink)}" target="_blank" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;text-decoration:none;border-radius:100px;font-size:15px;font-weight:700;letter-spacing:.3px">
            Accept Invitation →
          </a>
        </div>
        <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.6">
          This invitation will expire in 7 days. If you were not expecting this invitation, you can safely ignore this email.
        </p>
      </td></tr>
      <tr><td style="background:#f1f5f9;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center">
        <p style="margin:0;font-size:12px;color:#94a3b8">Powered by <strong>BayFatura</strong> · bayfatura.com</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
    `.trim();
};

const normalizeAppUrl = (value) => {
    if (!value || typeof value !== 'string') return '';

    try {
        const url = new URL(value);
        const host = url.hostname.toLowerCase();
        const isAllowedHost =
            host === 'bayfatura.com' ||
            host === 'www.bayfatura.com' ||
            host.endsWith('.web.app') ||
            host.endsWith('.firebaseapp.com') ||
            host === 'localhost' ||
            host === '127.0.0.1';

        if (!['https:', 'http:'].includes(url.protocol) || !isAllowedHost) {
            return '';
        }

        return url.origin;
    } catch {
        return '';
    }
};

export const sendInvitationEmail = euCallable().onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    const { inviteeEmail, inviteeName, role, invitedBy, invitationId, companyName, senderName, appUrl } = data;

    if (!inviteeEmail || !invitationId || !invitedBy) {
        throw new https.HttpsError('invalid-argument', 'Missing required fields: inviteeEmail, invitationId, invitedBy');
    }
    if (invitedBy !== context.auth.uid) {
        throw new https.HttpsError('permission-denied', 'You can only send invitations for your own team');
    }
    if (!isValidEmail(inviteeEmail)) {
        throw new https.HttpsError('invalid-argument', 'A valid invitee email is required');
    }
    if (!['admin', 'accountant', 'member'].includes(role)) {
        throw new https.HttpsError('invalid-argument', 'Invalid role');
    }

    if (!getResendKey()) {
        console.error('❌ Resend API Key is missing from environment');
        throw new https.HttpsError('failed-precondition', 'Resend API key not configured');
    }

    const resend = getResend();
    const appBaseUrl = normalizeAppUrl(appUrl) || normalizeAppUrl(process.env.APP_URL) || 'https://bayfatura.com';

    const acceptLink = `${appBaseUrl}/accept-invite?token=${invitationId}&tenant=${invitedBy}&email=${encodeURIComponent(inviteeEmail)}`;

    try {
        await checkRateLimit(context.auth.uid, 'email_invite', 10, 60 * 60_000);

        const memberRef = db.collection('users').doc(context.auth.uid).collection('team').doc(invitationId);
        const memberSnap = await memberRef.get();
        if (!memberSnap.exists) {
            throw new https.HttpsError('not-found', 'Invitation record not found');
        }

        const memberData = memberSnap.data();
        const normalizedInviteeEmail = normalizeEmail(inviteeEmail);
        if (normalizeEmail(memberData.email) !== normalizedInviteeEmail || memberData.role !== role) {
            throw new https.HttpsError('permission-denied', 'Invitation data does not match the stored record');
        }
        if (!['pending', 'email_failed'].includes(memberData.status)) {
            throw new https.HttpsError('failed-precondition', 'This invitation cannot be sent again');
        }

        const inviterSnap = await db.collection('users').doc(context.auth.uid).get();
        const inviterData = inviterSnap.exists ? inviterSnap.data() : {};
        const safeCompanyName = inviterData.companyName || companyName || 'the company';
        const safeSenderName = inviterData.name || senderName || context.auth.token.email || 'Your team member';
        const safeInviteeName = memberData.name || inviteeName || normalizedInviteeEmail.split('@')[0];

        console.log('[sendInvitationEmail] Sending invitation email', {
            userId: context.auth.uid,
            invitationId,
            invitedBy,
            to: redactEmail(normalizedInviteeEmail),
        });

        const { data: resData, error } = await resend.emails.send({
            from: getResendFromEmail(),
            to: [`${safeInviteeName} <${normalizedInviteeEmail}>`],
            subject: `${safeSenderName} invited you to join ${safeCompanyName} on BayFatura`,
            html: buildInvitationHtml({
                inviteeName: safeInviteeName,
                companyName: safeCompanyName,
                senderName: safeSenderName,
                role,
                acceptLink,
            }),
        });

        if (error) {
            logFunctionError('sendInvitationEmail.resend', error, {
                userId: context.auth.uid,
                invitationId,
                invitedBy,
                to: redactEmail(normalizedInviteeEmail),
            });
            throw classifyResendError(error);
        }

        console.log('[sendInvitationEmail] Invitation email sent successfully', { messageId: resData.id, invitationId });

        await db.collection('email_logs').add({
            type: 'invitation',
            invitationId,
            to: normalizedInviteeEmail,
            invitedBy,
            role,
            subject: `${safeSenderName} invited you to join ${safeCompanyName} on BayFatura`,
            userId: context.auth.uid,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            resendId: resData.id
        });

        return { success: true, messageId: resData.id };
    } catch (error) {
        if (error instanceof https.HttpsError) throw error;
        throw toCallableError('sendInvitationEmail', error, 'Invitation email could not be sent right now. Please try again later.', {
            userId: context.auth.uid,
            invitationId,
            invitedBy,
            to: redactEmail(inviteeEmail),
        });
    }
});

// ─── 5c. Accept Team Invitation ──────────────────────────────────────────────
export const acceptTeamInvitation = euCallable().onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    const { token, tenantId } = data;

    if (!token || !tenantId) {
        throw new https.HttpsError('invalid-argument', 'Missing required fields: token, tenantId');
    }

    const uid = context.auth.uid;
    const email = context.auth.token.email;

    try {
        const memberRef = db.collection('users').doc(tenantId).collection('team').doc(token);
        const memberDoc = await memberRef.get();

        if (!memberDoc.exists) {
            throw new https.HttpsError('not-found', 'Invitation not found or has been revoked');
        }

        const memberData = memberDoc.data();

        if (memberData.status !== 'pending') {
            throw new https.HttpsError('failed-precondition', 'This invitation has already been used or revoked');
        }

        if (memberData.email !== email) {
            throw new https.HttpsError('permission-denied', 'This invitation was sent to a different email address');
        }

        await memberRef.update({
            status: 'active',
            userId: uid,
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await db.collection('users').doc(uid).collection('myTeams').doc(tenantId).set({
            tenantId,
            role: memberData.role,
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            invitedBy: memberData.invitedBy,
        });

        console.log(`✅ User ${uid} accepted team invitation for tenant ${tenantId}`);

        return { success: true, teamMemberId: token, tenantId };
    } catch (error) {
        console.error('❌ Accept Invitation Error:', error);
        if (error instanceof https.HttpsError) throw error;
        throw new https.HttpsError('internal', error.message || 'Failed to accept invitation');
    }
});

// ─── 5. Recurring Invoice Automation ──────────────────────────────────────────
// Runs every day at 02:00 AM - generates invoices from due recurring templates
export const processRecurringTemplates = euFunctions.pubsub.schedule('0 2 * * *').timeZone('Europe/Berlin').onRun(async () => {
    const now = new Date();
    let processed = 0;

    try {
        const templatesRef = db.collectionGroup('recurring_templates');
        const snapshot = await templatesRef.where('active', '==', true).get();

        const addInterval = (date, freq) => {
            const d = new Date(date);
            switch (freq) {
                case 'weekly': d.setDate(d.getDate() + 7); break;
                case 'monthly': d.setMonth(d.getMonth() + 1); break;
                case 'quarterly': d.setMonth(d.getMonth() + 3); break;
                case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
            }
            return d.toISOString();
        };

        for (const tpl of snapshot.docs) {
            const data = tpl.data();
            const nextDate = data.nextInvoiceDate || data.createdAt;
            const dueDate = new Date(nextDate);

            if (dueDate <= now && data.userId) {
                const invoiceRef = db.collection('invoices').doc();
                const invoiceNumber = `R-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(processed + 1).padStart(4, '0')}`;

                const baseInvoice = {
                    userId: data.userId,
                    recipientName: data.recipientName || '',
                    amount: data.amount || 0,
                    description: data.description || '',
                    status: 'draft',
                    invoiceNumber,
                    currency: data.currency || 'EUR',
                    items: data.items || [{ description: data.description || 'Recurring', quantity: 1, unitPrice: data.amount || 0, taxRate: 19 }],
                    subtotal: data.amount || 0,
                    taxAmount: (data.amount || 0) * 0.19,
                    total: (data.amount || 0) * 1.19,
                    dueDate: addInterval(now, data.frequency || 'monthly'),
                    isRecurring: true,
                    recurringTemplateId: tpl.id,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };

                await invoiceRef.set(baseInvoice);

                const newNextDate = addInterval(now, data.frequency || 'monthly');
                await tpl.ref.update({
                    lastGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
                    nextInvoiceDate: newNextDate,
                    lastInvoiceId: invoiceRef.id,
                    lastInvoiceNumber: invoiceNumber,
                });

                processed++;
            }
        }

        console.log(`✅ Processed ${processed} recurring templates`);
        return null;
    } catch (error) {
        console.error('Recurring processing failed:', error);
        return null;
    }
});

// ─── 6. Admin: Grant Elite Plan ──────────────────────────────────────────────
export const grantElitePlan = euCallable().onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    const adminEmail = context.auth.token.email;
    if (!['support@bayfatura.com', 'omidbayenderi@gmail.com'].includes(adminEmail)) {
        throw new https.HttpsError('permission-denied', 'Only admins can grant plans');
    }

    const { targetUserId, durationDays, reason } = data;
    if (!targetUserId) throw new https.HttpsError('invalid-argument', 'targetUserId required');
    if (!Number.isInteger(durationDays) || durationDays < 0) throw new https.HttpsError('invalid-argument', 'durationDays must be 0 (unlimited) or a positive integer');

    const userRef = db.collection('users').doc(targetUserId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new https.HttpsError('not-found', 'User not found');

    const expiresAt = durationDays === 0
        ? null  // 0 = süresiz
        : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    await userRef.update({
        plan: 'elite',
        subscriptionType: 'granted',
        planGrantedBy: adminEmail,
        planGrantReason: reason || 'admin_grant',
        planActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
        planExpiresAt: expiresAt,
    });

    await db.collection('audit_logs').add({
        action: 'grant_elite_plan',
        targetUserId,
        targetUserEmail: userSnap.data()?.email || 'unknown',
        adminEmail,
        durationDays: durationDays === 0 ? 'unlimited' : durationDays,
        reason: reason || 'admin_grant',
        planExpiresAt: expiresAt,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Elite granted to ${targetUserId} by ${adminEmail} — expires: ${expiresAt || 'never'}`);
    return { success: true, planExpiresAt: expiresAt };
});

// ─── 6b. Scheduled: Downgrade expired granted plans ──────────────────────────
// Her gün gece yarısı çalışır
export const checkGrantedPlanExpiry = euFunctions.pubsub.schedule('0 0 * * *').timeZone('Europe/Berlin').onRun(async () => {
    const nowIso = new Date().toISOString();
    try {
        const snapshot = await db.collection('users')
            .where('subscriptionType', '==', 'granted')
            .where('planExpiresAt', '<=', nowIso)
            .get();

        if (snapshot.empty) {
            console.log('✅ No expired granted plans found');
            return null;
        }

        const batch = db.batch();
        snapshot.forEach(docSnap => {
            batch.update(docSnap.ref, {
                plan: 'standard',
                subscriptionType: null,
                planDowngradedAt: admin.firestore.FieldValue.serverTimestamp(),
                planExpiresAt: null,
            });

            // Kullanıcıya bildirim gönder
            const notifRef = db.collection('users').doc(docSnap.id).collection('notifications').doc();
            batch.set(notifRef, {
                title: 'Elite Plan Sona Erdi',
                message: 'Ücretsiz Elite kullanım süreniz doldu. Devam etmek için Elite\'e abone olabilirsiniz.',
                type: 'warning',
                read: false,
                link: '/billing',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        await batch.commit();
        console.log(`⬇️ Downgraded ${snapshot.size} expired granted Elite plans`);
        return null;
    } catch (error) {
        console.error('checkGrantedPlanExpiry failed:', error);
        return null;
    }
});

// ─── 7. Cloud Operations: Notifications (Overdue Invoices) ───────────────────────
// Runs every day at 09:00 AM
export const checkOverdueInvoices = euFunctions.pubsub.schedule('0 9 * * *').timeZone('Europe/Berlin').onRun(async () => {
    const nowIso = new Date().toISOString();
    const unpaidStatuses = new Set(['pending', 'sent', 'overdue']);
    try {
        const snapshot = await db.collection('invoices').where('dueDate', '<', nowIso).get();

        const batch = db.batch();
        let notificationCount = 0;

        snapshot.forEach(doc => {
            const invoice = doc.data();
            const status = String(invoice.status || '').toLowerCase();
            if (!unpaidStatuses.has(status)) return;

            const ownerId = invoice.userId || invoice.tenantId;
            if (!ownerId) {
                console.warn(`Skipping overdue invoice ${doc.id}: missing userId/tenantId`);
                return;
            }

            const notificationRef = db.collection('users').doc(ownerId).collection('notifications').doc();
            
            batch.set(notificationRef, {
                title: 'Fatura Vadesi Geçti',
                message: `${invoice.invoiceNumber} numaralı faturanın ödeme süresi doldu.`,
                type: 'warning',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                read: false,
                link: `/invoice/${doc.id}`
            });
            notificationCount++;
        });

        await batch.commit();
        console.log(`✅ Sent ${notificationCount} overdue notifications`);
        return null;
    } catch (error) {
        console.error('Overdue check failed:', error);
        return null;
    }
});
// --- 🛡️ Image Proxy for CORS Bypass ---
const PROXY_ALLOWED_ORIGINS = new Set([
    'https://bayfatura.com',
    'https://www.bayfatura.com',
    'https://bayfatura-b283c.web.app',
    'https://bayfatura-b283c.firebaseapp.com',
    'http://localhost:5173',
    'http://localhost:3000',
]);

const getProxyCorsOrigin = (req) => {
    const origin = req.headers.origin || '';
    if (PROXY_ALLOWED_ORIGINS.has(origin)) return origin;
    if (origin.endsWith('.web.app') || origin.endsWith('.firebaseapp.com')) return origin;
    return '';
};

export const proxyImage = euFunctions.https.onRequest(async (req, res) => {
    const corsOrigin = getProxyCorsOrigin(req);
    if (corsOrigin) {
        res.set('Access-Control-Allow-Origin', corsOrigin);
        res.set('Vary', 'Origin');
    }
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    const imageUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
    if (!imageUrl) {
        res.status(400).send('Missing url parameter');
        return;
    }

    try {
        const parsedUrl = new URL(imageUrl);
        const hostname = parsedUrl.hostname.toLowerCase();
        const allowedHosts = getProxyImageAllowedHosts();

        if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
            res.status(400).send('Unsupported URL protocol');
            return;
        }

        if (isBlockedProxyHost(hostname) || !allowedHosts.has(hostname)) {
            res.status(403).send('Image host is not allowed');
            return;
        }

        const response = await fetch(imageUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || 'image/png';
        if (!contentType.startsWith('image/')) {
            res.status(415).send('Unsupported content type');
            return;
        }

        const contentLength = Number(response.headers.get('content-length') || 0);
        if (contentLength > MAX_PROXY_IMAGE_BYTES) {
            res.status(413).send('Image is too large');
            return;
        }

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > MAX_PROXY_IMAGE_BYTES) {
            res.status(413).send('Image is too large');
            return;
        }

        const buffer = Buffer.from(arrayBuffer);
        
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(buffer);
    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).send('Error proxying image');
    }
});
// --- 🛡️ Auth Sync: Auto-create Firestore data when Auth user is created ---
export const onUserCreated = euFunctions.auth.user().onCreate(async (user) => {
    const uid = user.uid;
    console.log(`👤 User ${uid} created in Auth. Provisioning Firestore document...`);
    
    try {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            const initialData = {
                name: user.displayName || user.email?.split('@')[0] || 'User',
                email: user.email || 'guest@bayfatura.com',
                plan: 'standard',
                role: 'admin',
                tenantId: uid,
                createdAt: new Date().toISOString()
            };
            await userRef.set(initialData);
            console.log(`✅ User ${uid} document successfully provisioned in Firestore.`);
        } else {
            console.log(`ℹ️ User ${uid} document already exists in Firestore.`);
        }
        return null;
    } catch (error) {
        console.error(`❌ Failed to provision data for user ${uid}:`, error);
        return null;
    }
});

// --- 🛡️ Auth Sync: Auto-delete Firestore data when Auth user is deleted ---
export const onUserDeleted = euFunctions.auth.user().onDelete(async (user) => {
    const uid = user.uid;
    console.log(`🗑️ User ${uid} deleted from Auth. Purging all Firestore data...`);

    // Delete all docs in a query in batches of 400 (safe under 500-op limit)
    const deleteQuery = async (query) => {
        const snap = await query.get();
        if (snap.empty) return 0;
        let count = 0;
        const chunks = [];
        for (let i = 0; i < snap.docs.length; i += 400) {
            chunks.push(snap.docs.slice(i, i + 400));
        }
        for (const chunk of chunks) {
            const batch = db.batch();
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            count += chunk.length;
        }
        return count;
    };

    // Delete all docs in a subcollection
    const deleteSubcollection = async (parentRef, subcollection) => {
        return deleteQuery(parentRef.collection(subcollection));
    };

    try {
        const userRef = db.collection('users').doc(uid);
        const topCollections = [
            'invoices', 'quotes', 'expenses', 'recurring_templates',
            'customers', 'products', 'rate_limits', 'audit_logs', 'agent_logs',
        ];

        const results = await Promise.allSettled([
            // Top-level collections scoped by userId
            ...topCollections.map(col =>
                deleteQuery(db.collection(col).where('userId', '==', uid))
            ),
            // rate_limits keyed as uid_scope — also catch with startsWith pattern
            deleteQuery(db.collection('rate_limits').where('__name__', '>=', `${uid}_`).where('__name__', '<', `${uid}_￿`)),
            // customizations single doc
            db.collection('customizations').doc(uid).delete().catch(() => null),
            // Subcollections under users/{uid}
            deleteSubcollection(userRef, 'notifications'),
            deleteSubcollection(userRef, 'team'),
            // Finally the user doc itself
            userRef.delete(),
        ]);

        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
            failed.forEach(f => console.error('❌ Partial delete error:', f.reason));
        }
        console.log(`✅ User ${uid} fully purged. ${failed.length} partial errors.`);
        return null;
    } catch (error) {
        console.error(`❌ Failed to purge data for user ${uid}:`, error);
        return null;
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 BAYFATURA AGENT TEAM
// Amaç: Müşteri edinme, aktivasyon, elde tutma ve gelir büyümesini otomatize et.
//
// Agents:
//   1. Conversion Agent  — Free limit dolunca kişisel ikna emaili
//   2. Churn Agent       — 7+ gün sessiz Elite kullanıcıya uyarı
//   3. Onboarding Agent  — 24s kayıt, hiç fatura oluşturmamış
//   4. Win-back Agent    — Elite'ten düşen kullanıcıyı geri kazan
//
// Koordinasyon: Her agent önce cooldown kontrolü yapar, sonra aksiyon alır,
// sonra agent_logs'a yazar. Böylece kullanıcılar spam almaz ve her agent
// diğerinin ne yaptığını bilir.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Agent Konfigürasyonu ─────────────────────────────────────────────────────
const AGENT_CONFIG = {
    conversion:  { cooldownDays: 7,  name: 'Conversion Agent',  emoji: '💰' },
    churn:       { cooldownDays: 5,  name: 'Churn Agent',       emoji: '🛡️' },
    onboarding:  { cooldownDays: 3,  name: 'Onboarding Agent',  emoji: '🚀' },
    winback:     { cooldownDays: 14, name: 'Win-back Agent',    emoji: '🔄' },
};

const ADMIN_EMAILS = ['omidbayenderi@gmail.com', 'support@bayfatura.com'];

// ─── Shared Agent Helpers ─────────────────────────────────────────────────────

const getAgentResend = () => new Resend(getResendKey());

/** Kullanıcının bu agent tarafından son ne zaman kontakt edildiğini kontrol eder */
const checkAgentCooldown = async (uid, agentType) => {
    const cfg = AGENT_CONFIG[agentType];
    const logRef = db.collection('agent_logs')
        .where('uid', '==', uid)
        .where('agentType', '==', agentType)
        .orderBy('sentAt', 'desc')
        .limit(1);

    const snap = await logRef.get();
    if (snap.empty) return true; // hiç kontakt edilmemiş, devam et

    const lastLog = snap.docs[0].data();
    const lastSentMs = lastLog.sentAt?.toMillis?.() || 0;
    const cooldownMs = cfg.cooldownDays * 24 * 60 * 60 * 1000;
    return (Date.now() - lastSentMs) > cooldownMs;
};

/** Agent aksiyonunu loglar */
const logAgentAction = async (uid, agentType, { email, subject, status, reason }) => {
    await db.collection('agent_logs').add({
        uid,
        agentType,
        agentName: AGENT_CONFIG[agentType]?.name || agentType,
        email,
        subject,
        status, // 'sent' | 'skipped' | 'error'
        reason,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};

/** Kullanıcının bu ayki fatura + teklif sayısını ve toplam gelirini hesaplar */
const getUserMonthlyStats = async (uid) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [invSnap, quoteSnap, expSnap, customerSnap] = await Promise.all([
        db.collection('invoices').where('userId', '==', uid).where('createdAt', '>=', monthStart).get(),
        db.collection('quotes').where('userId', '==', uid).where('createdAt', '>=', monthStart).get(),
        db.collection('expenses').where('userId', '==', uid).where('createdAt', '>=', monthStart).get(),
        db.collection('customers').where('userId', '==', uid).get(),
    ]);

    const invoices = invSnap.docs.map(d => d.data()).filter(d => !d.isDeleted);
    const quotes   = quoteSnap.docs.map(d => d.data()).filter(d => !d.isDeleted);
    const expenses = expSnap.docs.map(d => d.data()).filter(d => !d.isDeleted);

    const totalRevenue  = invoices.reduce((s, i) => s + (i.total || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const avgInvoice    = invoices.length ? totalRevenue / invoices.length : 0;
    const currency      = invoices[0]?.currency || 'EUR';

    return {
        invoiceCount:    invoices.length,
        quoteCount:      quotes.length,
        expenseCount:    expenses.length,
        customerCount:   customerSnap.size,
        totalRevenue,
        totalExpenses,
        avgInvoice,
        currency,
        hasExpenses:     expenses.length > 0,
        hasQuotes:       quotes.length > 0,
        hasCustomers:    customerSnap.size > 0,
    };
};

/** Gemini ile kişiselleştirilmiş email yazar */
const generatePersonalizedEmail = async ({ user, stats, agentType, extraContext = '' }) => {
    const lang = user.appLanguage || user.language || 'en';
    const langMap = { tr: 'Turkish', en: 'English', de: 'German', fr: 'French', es: 'Spanish', pt: 'Portuguese' };
    const langName = langMap[lang] || 'English';

    const fmt = (n) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: stats.currency || 'EUR' }).format(n);

    const prompts = {
        conversion: `You are Maya, a growth specialist at BayFatura — a professional invoicing SaaS.
Write a SHORT, personal, data-driven sales email to convince ${user.name || 'this user'} to upgrade from FREE to Elite (€9/month).

Their real account data this month:
- Invoices created: ${stats.invoiceCount}/5 (FREE LIMIT REACHED)
- Total invoiced: ${fmt(stats.totalRevenue)}
- Customers in CRM: ${stats.customerCount}
- Quotes sent: ${stats.quoteCount}
- Tracks expenses: ${stats.hasExpenses ? 'Yes' : 'No'}
- Industry: ${user.industry || 'general'}
- Company: ${user.companyName || user.name}

Elite benefits relevant to THEIR situation:
- Unlimited invoices (they hit the limit — this is the #1 pain)
- AI Receipt Scanner (auto-reads expense receipts)
- Bank Statement Matcher (auto-matches payments)
- Financial Forecasting
- No ads

Rules:
- Write in ${langName}
- Sound like a real human, not a robot
- Reference their SPECIFIC numbers (revenue, customer count etc.)
- Max 180 words in the body
- Warm, professional tone — not pushy
- End with a single CTA button text

Return ONLY valid JSON: { "subject": "...", "body": "...", "cta": "..." }`,

        churn: `You are Maya, a retention specialist at BayFatura.
Write a short, warm re-engagement email to ${user.name || 'this user'} who is an Elite subscriber but hasn't logged in for 7+ days.

Their account:
- Plan: Elite
- Company: ${user.companyName || user.name}
- Industry: ${user.industry || 'general'}
- Invoices this month: ${stats.invoiceCount}
- Total revenue tracked: ${fmt(stats.totalRevenue)}
${extraContext}

Goal: Remind them of value, offer help, bring them back.
- Write in ${langName}
- Max 150 words
- Friendly, concerned tone — not salesy
- Mention 1-2 specific Elite features they might not be using

Return ONLY valid JSON: { "subject": "...", "body": "...", "cta": "..." }`,

        onboarding: `You are Maya, an onboarding specialist at BayFatura.
Write a warm activation email to ${user.name || 'this user'} who signed up but hasn't created their first invoice yet.

Their account:
- Company: ${user.companyName || user.name}
- Industry: ${user.industry || 'general'}
- Signed up: recently

Goal: Get them to create their first invoice. Make it feel easy and valuable.
- Write in ${langName}
- Max 150 words
- Encouraging, helpful tone
- Include a specific tip for their industry

Return ONLY valid JSON: { "subject": "...", "body": "...", "cta": "..." }`,

        winback: `You are Maya, a win-back specialist at BayFatura.
Write a compelling re-activation email to ${user.name || 'this user'} whose Elite plan recently ended.

Their account:
- Company: ${user.companyName || user.name}
- Industry: ${user.industry || 'general'}
- Revenue tracked while Elite: ${fmt(stats.totalRevenue)}
${extraContext}

Goal: Get them back to Elite. Offer empathy + reminder of what they're missing.
- Write in ${langName}
- Max 160 words
- Empathetic, not desperate
- Mention the specific value they had

Return ONLY valid JSON: { "subject": "...", "body": "...", "cta": "..." }`,
    };

    const aiInstance = genkit({ plugins: [googleAI()] });
    const response = await aiInstance.generate({
        model: googleAI.model('gemini-1.5-flash'),
        prompt: prompts[agentType],
    });

    const text = response.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(text);
};

/** Email HTML şablonu — BayFatura branded */
const buildAgentEmailHtml = ({ name, body, cta, ctaUrl, agentType }) => {
    const colors = {
        conversion: { bg: '#6366f1', light: '#eef2ff' },
        churn:      { bg: '#f59e0b', light: '#fffbeb' },
        onboarding: { bg: '#10b981', light: '#ecfdf5' },
        winback:    { bg: '#8b5cf6', light: '#f5f3ff' },
    };
    const c = colors[agentType] || colors.conversion;
    const bodyHtml = body.replace(/\n/g, '<br/>');

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <!-- Header -->
        <tr>
          <td style="background:${c.bg};padding:28px 40px;text-align:center;">
            <span style="color:white;font-size:22px;font-weight:800;letter-spacing:-0.5px;">⚡ BayFatura</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 20px;font-size:16px;color:#1e293b;line-height:1.7;">${bodyHtml}</p>
            <!-- CTA -->
            <div style="text-align:center;margin:32px 0 24px;">
              <a href="${ctaUrl}" style="display:inline-block;background:${c.bg};color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;">${cta}</a>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:${c.light};padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              BayFatura · <a href="https://bayfatura.com/billing" style="color:#6366f1;text-decoration:none;">Planları Gör</a> ·
              <a href="https://bayfatura.com" style="color:#6366f1;text-decoration:none;">Uygulamayı Aç</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// ─── 1. Conversion Agent ──────────────────────────────────────────────────────
const runConversionAgent = async () => {
    console.log('💰 [ConversionAgent] Starting...');
    const resend = getAgentResend();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    let contacted = 0, skipped = 0, errors = 0;

    // Bu ay 5 fatura dolan free kullanıcıları bul
    const freeUsers = await db.collection('users')
        .where('plan', '==', 'standard')
        .get();

    for (const userDoc of freeUsers.docs) {
        const user = { uid: userDoc.id, ...userDoc.data() };
        if (!user.email || !isValidEmail(user.email)) { skipped++; continue; }
        if (user.isAnonymous) { skipped++; continue; }

        try {
            // Cooldown kontrolü
            const canContact = await checkAgentCooldown(user.uid, 'conversion');
            if (!canContact) { skipped++; continue; }

            // Bu ayki fatura sayısını kontrol et
            const [invSnap, quoteSnap] = await Promise.all([
                db.collection('invoices').where('userId', '==', user.uid).where('createdAt', '>=', monthStart).get(),
                db.collection('quotes').where('userId', '==', user.uid).where('createdAt', '>=', monthStart).get(),
            ]);
            const totalDocs = invSnap.docs.filter(d => !d.data().isDeleted).length +
                              quoteSnap.docs.filter(d => !d.data().isDeleted).length;

            // Sadece limite ulaşan veya 1 adım öncesinde olanları hedefle
            if (totalDocs < 4) { skipped++; continue; }

            const stats = await getUserMonthlyStats(user.uid);
            const emailContent = await generatePersonalizedEmail({ user, stats, agentType: 'conversion' });

            const html = buildAgentEmailHtml({
                name: user.name,
                body: emailContent.body,
                cta: emailContent.cta,
                ctaUrl: 'https://bayfatura.com/billing',
                agentType: 'conversion',
            });

            await resend.emails.send({
                from: getResendFromEmail(),
                to: user.email,
                subject: emailContent.subject,
                html,
            });

            await logAgentAction(user.uid, 'conversion', {
                email: redactEmail(user.email),
                subject: emailContent.subject,
                status: 'sent',
                reason: `${totalDocs}/5 invoices this month, revenue: ${stats.totalRevenue}`,
            });

            contacted++;
            console.log(`💰 [ConversionAgent] Sent to ${redactEmail(user.email)}`);
        } catch (err) {
            errors++;
            console.error(`💰 [ConversionAgent] Error for ${user.uid}:`, err.message);
            await logAgentAction(user.uid, 'conversion', {
                email: redactEmail(user.email || ''),
                subject: '',
                status: 'error',
                reason: err.message,
            });
        }
    }

    console.log(`💰 [ConversionAgent] Done — contacted:${contacted} skipped:${skipped} errors:${errors}`);
    return { contacted, skipped, errors };
};

// ─── 2. Churn Agent ───────────────────────────────────────────────────────────
const runChurnAgent = async () => {
    console.log('🛡️ [ChurnAgent] Starting...');
    const resend = getAgentResend();
    let contacted = 0, skipped = 0, errors = 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Elite kullanıcılar arasında son 7 günde hiç fatura oluşturmamış olanları bul
    const eliteUsers = await db.collection('users')
        .where('plan', 'in', ['elite', 'premium'])
        .get();

    for (const userDoc of eliteUsers.docs) {
        const user = { uid: userDoc.id, ...userDoc.data() };
        if (!user.email || !isValidEmail(user.email)) { skipped++; continue; }

        try {
            const canContact = await checkAgentCooldown(user.uid, 'churn');
            if (!canContact) { skipped++; continue; }

            // Son 7 gün aktivite var mı?
            const recentSnap = await db.collection('invoices')
                .where('userId', '==', user.uid)
                .where('createdAt', '>=', sevenDaysAgo)
                .limit(1)
                .get();

            if (!recentSnap.empty) { skipped++; continue; } // aktif, geç

            const stats = await getUserMonthlyStats(user.uid);
            const planActivated = user.planActivatedAt?.toDate?.()?.toISOString() || '';
            const extraContext = planActivated ? `- Elite since: ${planActivated.split('T')[0]}` : '';

            const emailContent = await generatePersonalizedEmail({ user, stats, agentType: 'churn', extraContext });
            const html = buildAgentEmailHtml({
                name: user.name,
                body: emailContent.body,
                cta: emailContent.cta,
                ctaUrl: 'https://bayfatura.com/dashboard',
                agentType: 'churn',
            });

            await resend.emails.send({
                from: getResendFromEmail(),
                to: user.email,
                subject: emailContent.subject,
                html,
            });

            await logAgentAction(user.uid, 'churn', {
                email: redactEmail(user.email),
                subject: emailContent.subject,
                status: 'sent',
                reason: 'No activity in 7+ days',
            });

            contacted++;
        } catch (err) {
            errors++;
            console.error(`🛡️ [ChurnAgent] Error for ${user.uid}:`, err.message);
            await logAgentAction(user.uid, 'churn', {
                email: redactEmail(user.email || ''),
                subject: '',
                status: 'error',
                reason: err.message,
            });
        }
    }

    console.log(`🛡️ [ChurnAgent] Done — contacted:${contacted} skipped:${skipped} errors:${errors}`);
    return { contacted, skipped, errors };
};

// ─── 3. Onboarding Agent ─────────────────────────────────────────────────────
const runOnboardingAgent = async () => {
    console.log('🚀 [OnboardingAgent] Starting...');
    const resend = getAgentResend();
    let contacted = 0, skipped = 0, errors = 0;

    const oneDayAgo   = new Date(Date.now() - 1  * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // 1-3 gün önce kaydolmuş ve hiç fatura oluşturmamış kullanıcılar
    const newUsers = await db.collection('users')
        .where('createdAt', '>=', threeDaysAgo)
        .where('createdAt', '<=', oneDayAgo)
        .where('plan', '==', 'standard')
        .get();

    for (const userDoc of newUsers.docs) {
        const user = { uid: userDoc.id, ...userDoc.data() };
        if (!user.email || !isValidEmail(user.email)) { skipped++; continue; }
        if (user.isAnonymous) { skipped++; continue; }

        try {
            const canContact = await checkAgentCooldown(user.uid, 'onboarding');
            if (!canContact) { skipped++; continue; }

            const invoiceSnap = await db.collection('invoices')
                .where('userId', '==', user.uid)
                .limit(1)
                .get();

            if (!invoiceSnap.empty) { skipped++; continue; } // fatura var, geç

            const stats = await getUserMonthlyStats(user.uid);
            const emailContent = await generatePersonalizedEmail({ user, stats, agentType: 'onboarding' });
            const html = buildAgentEmailHtml({
                name: user.name,
                body: emailContent.body,
                cta: emailContent.cta,
                ctaUrl: 'https://bayfatura.com/new',
                agentType: 'onboarding',
            });

            await resend.emails.send({
                from: getResendFromEmail(),
                to: user.email,
                subject: emailContent.subject,
                html,
            });

            await logAgentAction(user.uid, 'onboarding', {
                email: redactEmail(user.email),
                subject: emailContent.subject,
                status: 'sent',
                reason: 'Registered 1-3 days ago, no invoice created',
            });

            contacted++;
        } catch (err) {
            errors++;
            await logAgentAction(user.uid, 'onboarding', {
                email: redactEmail(user.email || ''),
                subject: '',
                status: 'error',
                reason: err.message,
            });
        }
    }

    console.log(`🚀 [OnboardingAgent] Done — contacted:${contacted} skipped:${skipped} errors:${errors}`);
    return { contacted, skipped, errors };
};

// ─── 4. Win-back Agent ───────────────────────────────────────────────────────
const runWinbackAgent = async () => {
    console.log('🔄 [WinbackAgent] Starting...');
    const resend = getAgentResend();
    let contacted = 0, skipped = 0, errors = 0;

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // Son 3 günde Elite'ten düşmüş kullanıcılar
    const downgraded = await db.collection('users')
        .where('plan', '==', 'standard')
        .where('planDowngradedAt', '>=', threeDaysAgo)
        .get();

    for (const userDoc of downgraded.docs) {
        const user = { uid: userDoc.id, ...userDoc.data() };
        if (!user.email || !isValidEmail(user.email)) { skipped++; continue; }

        try {
            const canContact = await checkAgentCooldown(user.uid, 'winback');
            if (!canContact) { skipped++; continue; }

            const stats = await getUserMonthlyStats(user.uid);
            const downgradedDate = user.planDowngradedAt?.toDate?.()?.toLocaleDateString?.('tr-TR') || '';
            const extraContext = downgradedDate ? `- Plan ended: ${downgradedDate}` : '';

            const emailContent = await generatePersonalizedEmail({ user, stats, agentType: 'winback', extraContext });
            const html = buildAgentEmailHtml({
                name: user.name,
                body: emailContent.body,
                cta: emailContent.cta,
                ctaUrl: 'https://bayfatura.com/billing',
                agentType: 'winback',
            });

            await resend.emails.send({
                from: getResendFromEmail(),
                to: user.email,
                subject: emailContent.subject,
                html,
            });

            await logAgentAction(user.uid, 'winback', {
                email: redactEmail(user.email),
                subject: emailContent.subject,
                status: 'sent',
                reason: `Downgraded from Elite on ${downgradedDate}`,
            });

            contacted++;
        } catch (err) {
            errors++;
            await logAgentAction(user.uid, 'winback', {
                email: redactEmail(user.email || ''),
                subject: '',
                status: 'error',
                reason: err.message,
            });
        }
    }

    console.log(`🔄 [WinbackAgent] Done — contacted:${contacted} skipped:${skipped} errors:${errors}`);
    return { contacted, skipped, errors };
};

// ─── Agent Orchestrator — Her gün 10:00 Berlin ───────────────────────────────
export const agentOrchestrator = euFunctions.pubsub.schedule('0 10 * * *').timeZone('Europe/Berlin').onRun(async () => {
    console.log('🤖 [AgentOrchestrator] Daily run starting...');

    const results = {};
    const agents = [
        { type: 'onboarding', fn: runOnboardingAgent },
        { type: 'conversion', fn: runConversionAgent },
        { type: 'churn',      fn: runChurnAgent      },
        { type: 'winback',    fn: runWinbackAgent     },
    ];

    for (const agent of agents) {
        try {
            results[agent.type] = await agent.fn();
        } catch (err) {
            console.error(`🤖 [AgentOrchestrator] ${agent.type} failed:`, err.message);
            results[agent.type] = { error: err.message };
        }
    }

    // Günlük özet log
    await db.collection('agent_runs').add({
        runAt: admin.firestore.FieldValue.serverTimestamp(),
        results,
    });

    console.log('🤖 [AgentOrchestrator] Done:', JSON.stringify(results));
    return null;
});

// ─── Manuel Agent Tetikleme (DCC'den) ────────────────────────────────────────
export const triggerAgent = euCallable().onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    if (!ADMIN_EMAILS.includes(context.auth.token.email)) {
        throw new https.HttpsError('permission-denied', 'Admin only');
    }

    const { agentType } = data;
    const agentMap = {
        conversion: runConversionAgent,
        churn:      runChurnAgent,
        onboarding: runOnboardingAgent,
        winback:    runWinbackAgent,
    };

    if (!agentMap[agentType]) throw new https.HttpsError('invalid-argument', 'Unknown agent type');

    const result = await agentMap[agentType]();
    return { success: true, result };
});
