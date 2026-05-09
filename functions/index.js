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
        
        // Resend v3 returns { data, error }
        const { data: resData, error } = await resend.emails.send({
            from: 'BayFatura <onboarding@resend.dev>', // Default testing address if domain not verified
            to: [to],
            subject: subject,
            html: html
        });

        if (error) {
            console.error('❌ Resend API Error:', error);
            throw new https.HttpsError('internal', `Resend Error: ${error.message}`);
        }
        
        console.log(`✅ Email sent successfully. ID: ${resData.id}`);

        // Log to Firestore
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
        // If it's already a HttpsError, rethrow it
        if (error instanceof https.HttpsError) throw error;
        throw new https.HttpsError('internal', error.message || 'An unknown error occurred while sending email');
    }
});

// ─── 5. Cloud Operations: Notifications (Overdue Invoices) ───────────────────────
// Runs every day at 09:00 AM
export const checkOverdueInvoices = pubsub.schedule('0 9 * * *').timeZone('Europe/Berlin').onRun(async () => {
    const now = new Date();
    try {
        const invoicesRef = db.collectionGroup('invoices'); // Requires indexing
        const snapshot = await invoicesRef.where('status', '==', 'PENDING').where('dueDate', '<', now.toISOString()).get();

        const batch = db.batch();
        snapshot.forEach(doc => {
            const invoice = doc.data();
            const notificationRef = db.collection('users').doc(invoice.tenantId).collection('notifications').doc();
            
            batch.set(notificationRef, {
                title: 'Fatura Vadesi Geçti',
                message: `${invoice.invoiceNumber} numaralı faturanın ödeme süresi doldu.`,
                type: 'warning',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                read: false,
                link: `/invoices/${doc.id}`
            });
        });

        await batch.commit();
        console.log(`✅ Sent ${snapshot.size} overdue notifications`);
        return null;
    } catch (error) {
        console.error('Overdue check failed:', error);
        return null;
    }
});
// --- 🛡️ Image Proxy for CORS Bypass ---
export const proxyImage = https.onRequest(async (req, res) => {
    // Permissive CORS headers for the proxy
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    const imageUrl = req.query.url;
    if (!imageUrl) {
        res.status(400).send('Missing url parameter');
        return;
    }

    try {
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type') || 'image/png';
        
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
