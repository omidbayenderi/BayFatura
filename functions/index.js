/**
 * BayFatura — Firebase Cloud Functions
 * Stripe Webhook, Genkit AI, Email Automation & Notifications
 */

import { https, pubsub, config, auth } from 'firebase-functions/v1';
import admin from 'firebase-admin';
import Stripe from 'stripe';
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { Resend } from 'resend';

admin.initializeApp();
const db = admin.firestore();

// --- Services Initialization ---
const getStripe = () => new Stripe(config().stripe?.secret || process.env.STRIPE_SECRET_KEY);
const getResend = () => new Resend(config().resend?.key || process.env.RESEND_API_KEY);
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
    const configuredHostList = config().proxy?.image_allowed_hosts || process.env.PROXY_IMAGE_ALLOWED_HOSTS || '';
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
export const stripeWebhook = https.onRequest(async (req, res) => {
    const stripeInstance = getStripe();
    const webhookSecret = config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        const sig = req.headers['stripe-signature'];
        event = stripeInstance.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const getPlanFromSession = (session) => {
        const amount = session?.amount_total;
        if (amount >= 29900) return { plan: 'elite', subscriptionType: 'lifetime' };
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

                const planData = getPlanFromSession(session);
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

export const syncUserPlan = https.onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    
    const { sessionId } = data;
    if (!sessionId) throw new https.HttpsError('invalid-argument', 'sessionId required');

    const stripeInstance = getStripe();

    try {
        const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid') {
            const userId = context.auth.uid;
            const planData = session.amount_total >= 29900
                ? { plan: 'elite', subscriptionType: 'lifetime' }
                : { plan: 'elite', subscriptionType: 'subscription' };

            await db.collection('users').doc(userId).update({
                ...planData,
                stripeCustomerId: session.customer,
                planActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return { success: true, plan: planData.plan };
        }
        return { success: false, reason: 'payment_not_completed' };
    } catch (err) {
        throw new https.HttpsError('internal', err.message);
    }
});

export const syncAllAuthUsers = https.onCall(async (data, context) => {
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
export const analyzeBankStatement = https.onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
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
        console.error('AI Matcher Error:', error);
        throw new https.HttpsError('internal', error.message);
    }
});

// ─── 3. AI: Receipt Scanner (Genkit Vision) ───────────────────────────────────────
export const scanReceipt = https.onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
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
        console.error('AI Scanner Error:', error);
        throw new https.HttpsError('internal', error.message);
    }
});

// ─── 4. AI: Financial Forecasting (Genkit) ──────────────────────────────────────
export const analyzeFinancials = https.onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
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
        console.error('AI Analysis Error:', error);
        throw new https.HttpsError('internal', error.message);
    }
});

// ─── 5. Cloud Operations: Email Automation (Resend) ───────────────────────────────
export const sendInvoiceEmail = https.onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    const { to, subject, html, invoiceId } = data;

    const resend = getResend();
    if (!resend.key) {
        console.error('❌ Resend API Key is missing from config');
        throw new https.HttpsError('failed-precondition', 'Resend API key not configured');
    }

    try {
        console.log(`📧 Attempting to send email to: ${to} for invoice: ${invoiceId}`);
        
        const { data: resData, error } = await resend.emails.send({
            from: 'BayFatura <onboarding@resend.dev>',
            to: [to],
            subject: subject,
            html: html
        });

        if (error) {
            console.error('❌ Resend API Error:', error);
            throw new https.HttpsError('internal', `Resend Error: ${error.message}`);
        }
        
        console.log(`✅ Email sent successfully. ID: ${resData.id}`);

        await db.collection('email_logs').add({
            invoiceId,
            to,
            subject,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            resendId: resData.id
        });

        return { success: true, messageId: resData.id };
    } catch (error) {
        console.error('❌ Cloud Function Internal Error:', error);
        if (error instanceof https.HttpsError) throw error;
        throw new https.HttpsError('internal', error.message || 'An unknown error occurred while sending email');
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
<title>You're invited to ${companyName}</title>
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
        <p style="margin:0 0 8px;font-size:16px;color:#334155;line-height:1.7">Hello${inviteeName ? ' ' + inviteeName : ''},</p>
        <p style="margin:0 0 20px;font-size:15px;color:#64748b;line-height:1.7">
          <strong>${senderName}</strong> has invited you to join the team at <strong>${companyName}</strong> as a <strong>${roleLabels[role] || role}</strong>.
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="${acceptLink}" target="_blank" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;text-decoration:none;border-radius:100px;font-size:15px;font-weight:700;letter-spacing:.3px">
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

export const sendInvitationEmail = https.onCall(async (data, context) => {
    if (!context.auth) throw new https.HttpsError('unauthenticated', 'Login required');
    const { inviteeEmail, inviteeName, role, invitedBy, invitationId, companyName, senderName } = data;

    if (!inviteeEmail || !invitationId || !invitedBy) {
        throw new https.HttpsError('invalid-argument', 'Missing required fields: inviteeEmail, invitationId, invitedBy');
    }

    const resend = getResend();
    if (!resend.key) {
        console.error('❌ Resend API Key is missing from config');
        throw new https.HttpsError('failed-precondition', 'Resend API key not configured');
    }

    const acceptLink = `${config().app?.url || 'https://bayfatura.com'}/accept-invite?token=${invitationId}&tenant=${invitedBy}&email=${encodeURIComponent(inviteeEmail)}`;

    const html = buildInvitationHtml({
        inviteeName,
        companyName: companyName || 'the company',
        senderName: senderName || 'Your team member',
        role,
        acceptLink,
    });

    const subject = `${senderName || 'Someone'} invited you to join ${companyName || 'a team'} on BayFatura`;

    try {
        console.log(`📧 Sending invitation email to: ${inviteeEmail}`);

        const { data: resData, error } = await resend.emails.send({
            from: 'BayFatura <onboarding@resend.dev>',
            to: [inviteeEmail],
            subject,
            html,
        });

        if (error) {
            console.error('❌ Resend API Error:', error);
            throw new https.HttpsError('internal', `Resend Error: ${error.message}`);
        }

        console.log(`✅ Invitation email sent successfully. ID: ${resData.id}`);

        await db.collection('email_logs').add({
            type: 'invitation',
            invitationId,
            to: inviteeEmail,
            invitedBy,
            role,
            subject,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            resendId: resData.id
        });

        return { success: true, messageId: resData.id };
    } catch (error) {
        console.error('❌ Invitation Email Error:', error);
        if (error instanceof https.HttpsError) throw error;
        throw new https.HttpsError('internal', error.message || 'Failed to send invitation email');
    }
});

// ─── 5c. Accept Team Invitation ──────────────────────────────────────────────
export const acceptTeamInvitation = https.onCall(async (data, context) => {
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
export const processRecurringTemplates = pubsub.schedule('0 2 * * *').timeZone('Europe/Berlin').onRun(async () => {
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

// ─── 6. Cloud Operations: Notifications (Overdue Invoices) ───────────────────────
// Runs every day at 09:00 AM
export const checkOverdueInvoices = pubsub.schedule('0 9 * * *').timeZone('Europe/Berlin').onRun(async () => {
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
export const proxyImage = https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
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
export const onUserCreated = auth.user().onCreate(async (user) => {
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
export const onUserDeleted = auth.user().onDelete(async (user) => {
    const uid = user.uid;
    console.log(`🗑️ User ${uid} deleted from Auth. Cleaning up Firestore data...`);
    
    try {
        // Delete the main user document
        await db.collection('users').doc(uid).delete();
        console.log(`✅ User ${uid} data successfully purged from Firestore.`);
        return null;
    } catch (error) {
        console.error(`❌ Failed to purge data for user ${uid}:`, error);
        return null;
    }
});
